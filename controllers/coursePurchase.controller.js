import Stripe from "stripe";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;
    // console.log({userId, courseId});

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found!" });

    // Create a new course purchase record
    const newPurchase = new CoursePurchase({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending",
    });

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: course.courseTitle,
              images: [course.courseThumbnail],
            },
            unit_amount: course.coursePrice * 100, // Amount in paise (lowest denomination)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:5173/course-progress/${courseId}`, // once payment successful redirect to course progress page
      cancel_url: `http://localhost:5173/course-detail/${courseId}`,
      metadata: {
        courseId: courseId,
        userId: userId,
      },
      shipping_address_collection: {
        allowed_countries: ["IN"], // Optionally restrict allowed countries
      },
    });

    if (!session.url) {
      return res
        .status(400)
        .json({ success: false, message: "Error while creating session" });
    }

    // Save the purchase record
    newPurchase.paymentId = session.id;
    await newPurchase.save();

    return res.status(200).json({
      success: true,
      url: session.url, // Return the Stripe checkout URL
    });
  } catch (error) {
    console.error("Error in createCheckoutSession:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating checkout session",
      error: error.message,
    });
  }
};

export const verifyEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    console.log("Verifying enrollment - User:", userId, "Course:", courseId);

    // Check purchase status
    const purchase = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    console.log("Purchase record:", purchase);

    // Check user enrollment
    const user = await User.findById(userId)
      .select("enrolledCourses")
      .populate({
        path: "enrolledCourses",
        select: "courseTitle",
      });

    console.log("User enrolled courses:", user?.enrolledCourses);

    // Check course enrollment
    const course = await Course.findById(courseId)
      .select("enrolledStudents courseTitle")
      .populate({
        path: "enrolledStudents",
        select: "name email",
      });

    console.log("Course enrolled students:", course?.enrolledStudents);

    // If purchase exists but not properly enrolled, fix it
    if (
      purchase &&
      (!user?.enrolledCourses?.some((c) => c._id.toString() === courseId) ||
        !course?.enrolledStudents?.some((s) => s._id.toString() === userId))
    ) {
      console.log("Found mismatch. Fixing enrollment...");

      // Update user enrollment
      await User.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourses: courseId },
      });

      // Update course enrollment
      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { enrolledStudents: userId },
      });

      console.log("Fixed enrollment status");
    }

    return res.status(200).json({
      success: true,
      enrolled: !!purchase,
      enrollmentDetails: {
        purchaseExists: !!purchase,
        inUserCourses: user?.enrolledCourses?.some(
          (c) => c._id.toString() === courseId
        ),
        inCourseStudents: course?.enrolledStudents?.some(
          (s) => s._id.toString() === userId
        ),
      },
    });
  } catch (error) {
    console.error("Error in verifyEnrollment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify enrollment",
      error: error.message,
    });
  }
};

export const stripeWebhook = async (req, res) => {
  let event;

  try {
    const payloadString = JSON.stringify(req.body, null, 2);
    const secret = process.env.WEBHOOK_ENDPOINT_SECRET;

    console.log("Received webhook event:", req.body.type);

    const header = stripe.webhooks.generateTestHeaderString({
      payload: payloadString,
      secret,
    });

    event = stripe.webhooks.constructEvent(payloadString, header, secret);
  } catch (error) {
    console.error("Webhook error:", error.message);
    return res.status(400).send(`Webhook error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    console.log("Processing completed checkout session");

    try {
      const session = event.data.object;
      console.log("Session details:", {
        id: session.id,
        customer: session.customer,
        paymentStatus: session.payment_status,
      });

      const purchase = await CoursePurchase.findOne({
        paymentId: session.id,
      }).populate({ path: "courseId" });

      if (!purchase) {
        console.error("Purchase not found for session:", session.id);
        return res.status(404).json({ message: "Purchase not found" });
      }

      console.log("Found purchase record:", {
        id: purchase._id,
        courseId: purchase.courseId._id,
        userId: purchase.userId,
        status: purchase.status,
      });

      if (session.amount_total) {
        purchase.amount = session.amount_total / 100;
      }
      purchase.status = "completed";

      // Make lectures visible
      if (purchase.courseId && purchase.courseId.lectures.length > 0) {
        console.log(
          "Updating lecture visibility for course:",
          purchase.courseId._id
        );
        await Lecture.updateMany(
          { _id: { $in: purchase.courseId.lectures } },
          { $set: { isPreviewFree: true } }
        );
      }

      await purchase.save();
      console.log("Updated purchase status to completed");

      // Update user enrollment with retries
      let retryCount = 0;
      let updatedUser = null;
      while (retryCount < 3 && !updatedUser) {
        try {
          updatedUser = await User.findByIdAndUpdate(
            purchase.userId,
            { $addToSet: { enrolledCourses: purchase.courseId._id } },
            { new: true }
          );
          console.log("Updated user enrollment:", updatedUser?._id);
        } catch (err) {
          console.error(`Retry ${retryCount + 1} failed:`, err);
          retryCount++;
          if (retryCount === 3) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }

      if (!updatedUser) {
        console.error(
          "Failed to update user enrollment for user:",
          purchase.userId
        );
        return res
          .status(500)
          .json({ message: "Failed to update user enrollment" });
      }

      // Update course enrollment with retries
      retryCount = 0;
      let updatedCourse = null;
      while (retryCount < 3 && !updatedCourse) {
        try {
          updatedCourse = await Course.findByIdAndUpdate(
            purchase.courseId._id,
            { $addToSet: { enrolledStudents: purchase.userId } },
            { new: true }
          );
          console.log("Updated course enrollment:", updatedCourse?._id);
        } catch (err) {
          console.error(`Retry ${retryCount + 1} failed:`, err);
          retryCount++;
          if (retryCount === 3) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }

      if (!updatedCourse) {
        console.error(
          "Failed to update course enrollment for course:",
          purchase.courseId
        );
        return res
          .status(500)
          .json({ message: "Failed to update course enrollment" });
      }

      console.log(
        "Enrollment successful - User:",
        updatedUser._id,
        "Course:",
        updatedCourse._id
      );
    } catch (error) {
      console.error("Error handling webhook event:", error);
      return res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
  res.status(200).send();
};

export const getCourseDetailWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" });

    const purchased = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    if (!course) {
      return res.status(404).json({ message: "course not found!" });
    }

    return res.status(200).json({
      course,
      purchased: !!purchased, // true if purchased, false otherwise
    });
  } catch (error) {
    console.error("Error in getCourseDetailWithPurchaseStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting course details",
      error: error.message,
    });
  }
};

export const getAllPurchasedCourse = async (req, res) => {
  try {
    const userId = req.id;
    const purchasedCourse = await CoursePurchase.find({
      userId,
      status: "completed",
    }).populate("courseId");

    if (!purchasedCourse) {
      return res.status(404).json({
        purchasedCourse: [],
      });
    }
    return res.status(200).json({
      purchasedCourse,
    });
  } catch (error) {
    console.error("Error in getAllPurchasedCourse:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting purchased courses",
      error: error.message,
    });
  }
};

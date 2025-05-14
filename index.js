import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./database/db.js";
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import purchaseRoute from "./routes/purchaseCourse.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import mentorshipRoute from "./routes/mentorship.js";
import lostItemsRouter from "./routes/lostItems.js";
import foundItemsRouter from "./routes/foundItems.js";
import emergencyRouter from "./routes/emergencyRouter.js";

dotenv.config();

// call database connection here
connectDB();
const app = express();

const PORT = process.env.PORT || 8080;

// default middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static("uploads"));

// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true
// }));

////////////////////////////////////////////////////////////////
const allowedOrigins = [
  "http://localhost:5173",
  "https://campus-360.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // if you're sending cookies or auth headers
  })
);
////////////////////////////////////////////////////////////////

// apis
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/purchase", purchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/mentorship", mentorshipRoute);
app.use("/api/lost-items", lostItemsRouter);
app.use("/api/found-items", foundItemsRouter);
app.use("/api/emergency", emergencyRouter);

app.listen(PORT, () => {
  console.log(`Server listen at port ${PORT}`);
});

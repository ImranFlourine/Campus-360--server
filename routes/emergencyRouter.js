import express from 'express';
// import path from 'path';
import fs from 'fs';
// const __dirname = path.dirname(new URL(import.meta.url).pathname);

const router = express.Router();

// Configure multer for file uploads
let SOSs = [];
// const dataFile = path.join(__dirname, "test.json");
const dataFile = "./test.json";

// Initialize SOSs from file
try {
  const data = fs.readFileSync(dataFile, "utf8");
  // const data = fs.readFileSync("./test.json", "utf8");
  SOSs = JSON.parse(data);
} catch (err) {
  console.error("Error reading SOS data:", err);
  SOSs = [];
}

const createSOS = (req, res) => {
  try {
    const newId = SOSs.length;
    const newSOS = { id: newId, ...req.body };
    SOSs.push(newSOS);

    fs.writeFileSync(dataFile, JSON.stringify(SOSs, null, 2));
    
    res.status(200).json({
      success: true,
      message: "SOS/Complaint recorded successfully",
      data: newSOS
    });
  } catch (err) {
    console.error("Error creating SOS:", err);
    res.status(500).json({
      success: false,
      message: "Failed to record SOS/Complaint",
      error: err.message
    });
  }
};

const getAllSOS = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      count: SOSs.length,
      data: SOSs
    });
  } catch (err) {
    console.error("Error fetching SOS data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch SOS data",
      error: err.message
    });
  }
};

// Routes
router.get('/', getAllSOS);
router.post('/', createSOS);

export default router; 




// // Health check route
// app.get("/api/health", (req, res) => {
//   res.status(200).json({ status: "ok", service: "emergency-sos" });
// });

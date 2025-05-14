const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

let SOSs = [];
const dataFile = path.join(__dirname, "test.json");

// Initialize SOSs from file
try {
  const data = fs.readFileSync(dataFile, "utf8");
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

// Emergency routes
app.route("/api/emergency")
  .get(getAllSOS)
  .post(createSOS);

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "emergency-sos" });
});

module.exports = app; 
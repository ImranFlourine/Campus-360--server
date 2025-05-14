import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import cloudinaryConfig from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Validate Cloudinary configuration
const validateCloudinaryConfig = () => {
  const requiredEnvVars = ['CLOUD_NAME', 'API_KEY', 'API_SECRET'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required Cloudinary environment variables: ${missingVars.join(', ')}`);
  }
};

// Initialize Cloudinary configuration
try {
  validateCloudinaryConfig();
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});
} catch (error) {
  console.error('Failed to initialize Cloudinary:', error);
  throw error;
}

// Upload file to Cloudinary
export const uploadToCloudinary = async (filePath) => {
  try {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Validate file size (5MB limit)
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    if (fileSizeInMB > 5) {
      throw new Error('File size exceeds 5MB limit');
    }

    console.log('Uploading file to Cloudinary:', filePath);
    const result = await cloudinaryConfig.uploader.upload(filePath, {
      folder: 'lost-found',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });

    console.log('Upload successful:', result.secure_url);
    return result;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

// Upload media to Cloudinary
export const uploadMedia = async (file) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    return uploadResponse;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

// Delete media from Cloudinary
export const deleteMediaFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID is required to delete media');
    }
    await cloudinary.uploader.destroy(publicId);
    console.log('Media deleted successfully from Cloudinary:', publicId);
  } catch (error) {
    console.error('Error deleting media from Cloudinary:', error);
    throw new Error(`Failed to delete media from Cloudinary: ${error.message}`);
  }
};

// Delete video from Cloudinary
export const deleteVideoFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (error) {
    console.log(error);
    throw error;
  }
};


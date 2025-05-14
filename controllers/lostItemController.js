import LostItem from '../models/LostItem.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';

// @desc    Create a new lost item
// @route   POST /api/lost-items
// @access  Public
export const createLostItem = async (req, res) => {
  try {
    const { itemName, category, description, location, dateLost, contactDetails } = req.body;
    let imageUrl = '';

    // Validate required fields
    if (!itemName || !category || !description || !location || !dateLost) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Handle image upload
    if (req.file) {
      try {
        console.log('Uploading file to Cloudinary:', req.file.path);
      const result = await uploadToCloudinary(req.file.path);
      imageUrl = result.secure_url;
        console.log('File uploaded successfully to Cloudinary:', imageUrl);
        
        // Clean up the temporary file
        try {
          fs.unlinkSync(req.file.path);
          console.log('Temporary file cleaned up successfully');
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file:', cleanupError);
        }
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        // Clean up the temporary file even if upload fails
        try {
          if (req.file.path) {
            fs.unlinkSync(req.file.path);
            console.log('Temporary file cleaned up after failed upload');
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temporary file after failed upload:', cleanupError);
        }
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
      }
    }

    // Parse contactDetails if it's a string
    let parsedContactDetails;
    try {
      parsedContactDetails = typeof contactDetails === 'string' 
      ? JSON.parse(contactDetails) 
      : contactDetails;
    } catch (parseError) {
      console.error('Error parsing contact details:', parseError);
      return res.status(400).json({ message: 'Invalid contact details format' });
    }

    // Validate contact details
    if (!parsedContactDetails || !parsedContactDetails.email) {
      return res.status(400).json({ message: 'Valid contact details with email are required' });
    }

    // Create the lost item
    try {
    const lostItem = await LostItem.create({
      itemName,
      category,
      description,
      location,
      dateLost,
      image: imageUrl,
      status: 'lost',
      contactDetails: parsedContactDetails
    });

      console.log('Lost item created successfully:', lostItem._id);
    res.status(201).json(lostItem);
    } catch (dbError) {
      console.error('Error creating lost item in database:', dbError);
      res.status(500).json({ message: 'Failed to create lost item in database' });
    }
  } catch (error) {
    console.error('Unexpected error in createLostItem:', error);
    res.status(500).json({ message: 'An unexpected error occurred' });
  }
};

// @desc    Get all lost items
// @route   GET /api/lost-items
// @access  Public
export const getLostItems = async (req, res) => {
  try {
    const lostItems = await LostItem.find().sort({ createdAt: -1 });
    res.json(lostItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get lost item by ID
// @route   GET /api/lost-items/:id
// @access  Public
export const getLostItemById = async (req, res) => {
  try {
    const lostItem = await LostItem.findById(req.params.id);
    if (!lostItem) {
      return res.status(404).json({ message: 'Lost item not found' });
    }
    res.json(lostItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lost item
// @route   PUT /api/lost-items/:id
// @access  Public
export const updateLostItem = async (req, res) => {
  try {
    const { itemName, category, description, location, dateLost, status } = req.body;
    let imageUrl = '';

    if (req.file) {
      try {
      const result = await uploadToCloudinary(req.file.path);
      imageUrl = result.secure_url;
        // Clean up the temporary file
        fs.unlinkSync(req.file.path);
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        // Clean up the temporary file even if upload fails
        if (req.file.path) {
          fs.unlinkSync(req.file.path);
        }
        throw error;
      }
    }

    const lostItem = await LostItem.findById(req.params.id);
    if (!lostItem) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    lostItem.itemName = itemName || lostItem.itemName;
    lostItem.category = category || lostItem.category;
    lostItem.description = description || lostItem.description;
    lostItem.location = location || lostItem.location;
    lostItem.dateLost = dateLost || lostItem.dateLost;
    lostItem.status = status || lostItem.status;
    if (imageUrl) {
      lostItem.image = imageUrl;
    }

    const updatedItem = await lostItem.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete lost item
// @route   DELETE /api/lost-items/:id
// @access  Public
export const deleteLostItem = async (req, res) => {
  try {
    const lostItem = await LostItem.findById(req.params.id);
    if (!lostItem) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    await lostItem.deleteOne();
    res.json({ message: 'Lost item removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Claim lost item
// @route   POST /api/lost-items/:id/claim
// @access  Public
export const claimLostItem = async (req, res) => {
  try {
    const lostItem = await LostItem.findById(req.params.id);
    if (!lostItem) {
      return res.status(404).json({ message: 'Lost item not found' });
    }

    lostItem.status = 'claimed';
    const updatedItem = await lostItem.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 
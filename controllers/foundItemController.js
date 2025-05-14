import FoundItem from '../models/FoundItem.js';
import LostItem from '../models/LostItem.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import cloudinary from '../config/cloudinary.js';

// Create a new found item
export const createFoundItem = async (req, res) => {
  try {
    const { title, description, location, category, dateTime, contactInfo, tags } = req.body;
    const images = [];

    // Upload images to cloudinary if present
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => 
        cloudinary.uploader.upload(file.path, {
          folder: 'lost-found',
          resource_type: 'auto'
        })
      );
      const uploadResults = await Promise.all(uploadPromises);
      images.push(...uploadResults.map(result => result.secure_url));
    }

    const foundItem = new FoundItem({
      title,
      description,
      location,
      category,
      dateTime,
      contactInfo,
      tags,
      images,
      reportedBy: req.user._id
    });

    await foundItem.save();
    res.status(201).json(foundItem);
  } catch (error) {
    console.error('Error creating found item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating found item',
      error: error.message
    });
  }
};

// Get all found items with filters
export const getFoundItems = async (req, res) => {
  try {
    const { search, location, category, status } = req.query;
    const query = {};

    if (search) {
      query.$text = { $search: search };
    }
    if (location && location !== 'All Locations') {
      query.location = location;
    }
    if (category && category !== 'All Categories') {
      query.category = category;
    }
    if (status && status !== 'All Status') {
      query.status = status;
    }

    const foundItems = await FoundItem.find(query)
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name email')
      .populate('claimedBy', 'name email');

    res.json(foundItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single found item
export const getFoundItem = async (req, res) => {
  try {
    const foundItem = await FoundItem.findById(req.params.id)
      .populate('reportedBy', 'name email')
      .populate('claimedBy', 'name email');
    
    if (!foundItem) {
      return res.status(404).json({ message: 'Found item not found' });
    }
    
    res.json(foundItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a found item
export const updateFoundItem = async (req, res) => {
  try {
    const { title, description, location, category, dateTime, contactInfo, tags, status } = req.body;
    const updateData = {
      title,
      description,
      location,
      category,
      dateTime,
      contactInfo,
      tags,
      status
    };

    if (req.files) {
      const images = await Promise.all(
        req.files.map(file => uploadToCloudinary(file.path))
      );
      updateData.images = images;
    }

    const foundItem = await FoundItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!foundItem) {
      return res.status(404).json({ message: 'Found item not found' });
    }

    res.json(foundItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a found item
export const deleteFoundItem = async (req, res) => {
  try {
    const foundItem = await FoundItem.findByIdAndDelete(req.params.id);
    
    if (!foundItem) {
      return res.status(404).json({ message: 'Found item not found' });
    }
    
    res.json({ message: 'Found item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Claim a found item
export const claimFoundItem = async (req, res) => {
  try {
    const foundItem = await FoundItem.findById(req.params.id);
    
    if (!foundItem) {
      return res.status(404).json({ message: 'Found item not found' });
    }

    if (foundItem.status === 'Claimed') {
      return res.status(400).json({ message: 'Item has already been claimed' });
    }

    foundItem.status = 'Claimed';
    foundItem.claimedBy = req.user._id;
    foundItem.claimDate = new Date();

    await foundItem.save();
    res.json(foundItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get similar lost items
export const getSimilarLostItems = async (req, res) => {
  try {
    const foundItem = await FoundItem.findById(req.params.id);
    if (!foundItem) {
      return res.status(404).json({ message: 'Found item not found' });
    }

    const similarItems = await LostItem.find({
      $or: [
        { category: foundItem.category },
        { location: foundItem.location },
        { $text: { $search: foundItem.title } }
      ],
      status: 'Unclaimed'
    })
    .sort({ createdAt: -1 })
    .limit(5);

    res.json(similarItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 
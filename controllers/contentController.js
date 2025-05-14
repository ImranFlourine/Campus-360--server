import Content from '../models/Content.js';
import { v2 as cloudinary } from 'cloudinary';
import { createReadStream } from 'streamifier';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadContent = async (req, res) => {
  try {
    const { title, description, program, branch } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload file to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: `campus-content/${program}/${branch}`,
      },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ message: 'Error uploading file' });
        }

        // Create content document
        const content = new Content({
          title,
          description,
          program,
          branch,
          fileUrl: result.secure_url,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          uploader: req.user._id,
          tags: req.body.tags ? req.body.tags.split(',') : [],
        });

        await content.save();
        res.status(201).json(content);
      }
    );

    // Stream the file to Cloudinary
    const fileStream = createReadStream(file.buffer);
    await pipelineAsync(fileStream, uploadStream);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getContent = async (req, res) => {
  try {
    const { program, branch } = req.query;
    let query = { isApproved: true };

    if (program) query.program = program;
    if (branch) query.branch = branch;

    const content = await Content.find(query)
      .populate('uploader', 'name email')
      .sort({ uploadDate: -1 });

    res.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const downloadContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Increment download count
    content.downloadCount += 1;
    await content.save();

    // Redirect to the file URL
    res.redirect(content.fileUrl);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const approveContent = async (req, res) => {
  try {
    const { id } = req.params;
    const content = await Content.findById(id);

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    content.isApproved = true;
    await content.save();

    res.json(content);
  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 
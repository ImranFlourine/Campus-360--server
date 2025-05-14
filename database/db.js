import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    const MAX_RETRIES = 3;
    let retries = 0;

    // Check if MongoDB URI is defined
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not defined in environment variables');
        process.exit(1);
    }

    while (retries < MAX_RETRIES) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                family: 4
            });
            
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            break;
        } catch (error) {
            retries++;
            console.error(`MongoDB connection attempt ${retries} failed:`, error.message);
            
            if (error.name === 'MongooseServerSelectionError') {
                console.error('\nPossible issues:');
                console.error('1. Your IP is not whitelisted in MongoDB Atlas');
                console.error('2. MongoDB Atlas credentials are incorrect');
                console.error('3. Network connectivity issues');
                console.error('\nTo fix:');
                console.error('1. Add your IP to MongoDB Atlas whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/');
                console.error('2. Check your MONGO_URI in .env file');
                console.error('3. Check your internet connection\n');
            }

            if (retries === MAX_RETRIES) {
                console.error('Failed to connect to MongoDB after', MAX_RETRIES, 'attempts');
                process.exit(1);
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
    } catch (err) {
        console.error('Error closing Mongoose connection:', err);
        process.exit(1);
    }
});

export default connectDB;
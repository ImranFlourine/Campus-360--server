import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Please login to access this resource"
            });
        }

        try {
            const decodedData = jwt.verify(token, process.env.JWT_SECRET);
            req.id = decodedData.id;

            // Check if user still exists
            const user = await User.findById(req.id).select("+password");
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User no longer exists"
                });
            }

            next();
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: "Session expired, please login again"
                });
            }
            throw jwtError;
        }
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during authentication"
        });
    }
};

export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== "instructor") {
            return res.status(403).json({
                success: false,
                message: "Access denied: Admin resource"
            });
        }

        next();
    } catch (error) {
        console.error("Admin auth error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during admin authentication"
        });
    }
}; 
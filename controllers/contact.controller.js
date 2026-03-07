import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Contact } from "../models/contact.model.js";
import mongoose from "mongoose";
import axios from "axios";


const submitInquiry = asyncHandler(async (req, res) => {
    // Destructure captchaToken from the request body
    const { fullName, email, phoneNumber, message, captchaToken } = req.body;

    // --- reCAPTCHA VERIFICATION ---
    if (!captchaToken) {
        throw new ApiError(400, "CAPTCHA verification failed. Please try again.");
    }

    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

        const response = await axios.post(verificationURL);
        const { success } = response.data;

        if (!success) {
            throw new ApiError(400, "Invalid CAPTCHA. Are you a robot?");
        }
    } catch (error) {
        console.error("reCAPTCHA verification error:", error);
        // Throw a generic error to the user, but log the specific one
        throw new ApiError(500, "Failed to verify CAPTCHA. Please try again later.");
    }
    // --- END reCAPTCHA VERIFICATION ---

    // Proceed with form data validation and saving
    if ([fullName, email, message].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "Full Name, Email, and Message are required.");
    }

    const newInquiry = await Contact.create({
        fullName,
        email,
        phoneNumber,
        message,
    });

    if (!newInquiry) {
        throw new ApiError(500, "Something went wrong while saving your inquiry.");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newInquiry, "Inquiry submitted successfully. We will get back to you shortly."));
});



const getAllInquiries = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = {};
    if (status && ["New", "Contacted", "Completed", "Rejected"].includes(status)) {
        filter.status = status;
    }
    const inquiries = await Contact.find(filter).sort({ createdAt: -1 });
    return res
        .status(200)
        .json(new ApiResponse(200, inquiries, "All inquiries fetched successfully."));
});


const getInquiryById = asyncHandler(async (req, res) => {
    const { inquiryId } = req.params;
    if (!mongoose.isValidObjectId(inquiryId)) {
        throw new ApiError(400, "Invalid inquiry ID format.");
    }
    const inquiry = await Contact.findById(inquiryId);
    if (!inquiry) {
        throw new ApiError(404, "Inquiry not found.");
    }
    return res.status(200).json(new ApiResponse(200, inquiry, "Inquiry fetched successfully."));
});


const updateInquiry = asyncHandler(async (req, res) => {

    const { inquiryId } = req.params;
    const { fullName, email, phoneNumber, message, status } = req.body;

    if (!mongoose.isValidObjectId(inquiryId)) {
        throw new ApiError(400, "Invalid inquiry ID format.");
    }

    const inquiry = await Contact.findById(inquiryId);
    if (!inquiry) {
        throw new ApiError(404, "Inquiry not found.");
    }

    inquiry.fullName = fullName || inquiry.fullName;
    inquiry.email = email || inquiry.email;
    inquiry.phoneNumber = phoneNumber || inquiry.phoneNumber;
    inquiry.message = message || inquiry.message;
    
    if (status && ["New", "Contacted", "Completed", "Rejected"].includes(status)) {
        inquiry.status = status;
    }

    const updatedInquiry = await inquiry.save();

    return res
        .status(200)
        .json(new ApiResponse(200, updatedInquiry, "Inquiry updated successfully."));
});


const deleteInquiry = asyncHandler(async (req, res) => {
    const { inquiryId } = req.params;

    if (!mongoose.isValidObjectId(inquiryId)) {
        throw new ApiError(400, "Invalid inquiry ID format.");
    }
    
    const inquiryToDelete = await Contact.findByIdAndDelete(inquiryId);

    if (!inquiryToDelete) {
        throw new ApiError(404, "Inquiry not found.");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Inquiry deleted successfully."));
});

export {
    submitInquiry,
    getAllInquiries,
    getInquiryById,
    updateInquiry,
    deleteInquiry
};
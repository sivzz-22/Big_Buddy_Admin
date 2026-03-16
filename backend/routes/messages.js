import express from "express";
import MessageLog from "../models/MessageLog.js";

const router = express.Router();

// Get recent message history
router.get("/", async (req, res) => {
    try {
        const messages = await MessageLog.find().sort({ date: -1 }).limit(50);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new message log
router.post("/", async (req, res) => {
    try {
        const newLog = new MessageLog({
            memberName: req.body.memberName,
            memberPhone: req.body.memberPhone,
            memberEmail: req.body.memberEmail,
            message: req.body.message,
            channel: req.body.channel,
            type: req.body.type
        });

        const savedLog = await newLog.save();
        res.status(201).json(savedLog);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;

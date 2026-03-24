import express from "express";
import DailyLog from "../models/DailyLog.js";

const router = express.Router();

// Get log for a specific date
router.get("/", async (req, res) => {
    try {
        const { memberId, date } = req.query;
        let log = await DailyLog.findOne({ memberId, date });
        if (!log) {
            return res.json({
                memberId,
                date,
                workoutLogs: [],
                dietLogs: [],
                metrics: { calories: 0, waterIntake: 0 }
            });
        }
        res.json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get ALL logs for a member (for charts/history)
router.get("/history/:memberId", async (req, res) => {
    try {
        const { memberId } = req.params;
        const { limit = 30 } = req.query;
        const logs = await DailyLog.find({ memberId })
            .sort({ date: -1 })
            .limit(parseInt(limit));
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Save/update metrics only for a specific date
router.put("/metrics/:memberId/:date", async (req, res) => {
    try {
        const { memberId, date } = req.params;
        const { metrics } = req.body;
        let log = await DailyLog.findOneAndUpdate(
            { memberId, date },
            { $set: { metrics } },
            { upsert: true, new: true }
        );
        res.json(log);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Create or Update log
router.post("/", async (req, res) => {
    try {
        const { memberId, date, workoutLogs, dietLogs, metrics } = req.body;
        const updateData = {};
        if (workoutLogs !== undefined) updateData.workoutLogs = workoutLogs;
        if (dietLogs !== undefined) updateData.dietLogs = dietLogs;
        if (metrics !== undefined) updateData.metrics = metrics;

        let log = await DailyLog.findOneAndUpdate(
            { memberId, date },
            { $set: updateData },
            { upsert: true, new: true }
        );
        res.json(log);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;

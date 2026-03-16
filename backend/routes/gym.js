import express from "express";
import Gym from "../models/Gym.js";

const router = express.Router();

// Get Gym Info
router.get("/", async (req, res) => {
    try {
        let gym = await Gym.findOne();
        if (!gym) {
            // Create default if not exists
            gym = await Gym.create({});
        }
        res.json(gym);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Gym Info
router.put("/", async (req, res) => {
    try {
        let gym = await Gym.findOne();
        if (!gym) {
            gym = new Gym(req.body);
        } else {
            Object.assign(gym, req.body);
        }
        await gym.save();
        res.json(gym);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

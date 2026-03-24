import express from "express";
import WorkoutPlan from "../models/WorkoutPlan.js";

const router = express.Router();

// Get all workout plans
router.get("/", async (req, res) => {
    try {
        const plans = await WorkoutPlan.find({}).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single workout plan by ID
router.get("/:id", async (req, res) => {
    try {
        const plan = await WorkoutPlan.findById(req.params.id);
        if (plan) {
            res.json(plan);
        } else {
            res.status(404).json({ message: "Workout plan not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a workout plan
router.post("/", async (req, res) => {
    const { title, level, duration, exercises, routine } = req.body;
    try {
        const plan = await WorkoutPlan.create({ title, level, duration, exercises: exercises || [], routine: routine || "" });
        res.status(201).json(plan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a workout plan
router.put("/:id", async (req, res) => {
    const { title, level, duration, exercises, routine } = req.body;
    try {
        const plan = await WorkoutPlan.findById(req.params.id);
        if (plan) {
            plan.title = title || plan.title;
            plan.level = level || plan.level;
            plan.duration = duration || plan.duration;
            if (exercises !== undefined) plan.exercises = exercises;
            if (routine !== undefined) plan.routine = routine;
            const updatedPlan = await plan.save();
            res.json(updatedPlan);
        } else {
            res.status(404).json({ message: "Workout plan not found" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a workout plan
router.delete("/:id", async (req, res) => {
    try {
        const plan = await WorkoutPlan.findById(req.params.id);
        if (plan) {
            await WorkoutPlan.deleteOne({ _id: req.params.id });
            res.json({ message: "Workout plan removed" });
        } else {
            res.status(404).json({ message: "Workout plan not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

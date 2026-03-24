import express from "express";
import DietPlan from "../models/DietPlan.js";

const router = express.Router();

// Get all diet plans
router.get("/", async (req, res) => {
    try {
        const plans = await DietPlan.find({}).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single diet plan by ID
router.get("/:id", async (req, res) => {
    try {
        const dp = await DietPlan.findById(req.params.id);
        if (dp) {
            res.json(dp);
        } else {
            res.status(404).json({ message: "Diet plan not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a diet plan
router.post("/", async (req, res) => {
    const { name, meals, cals, mealSchedule, plan, icon } = req.body;
    try {
        const dp = await DietPlan.create({ name, meals, cals, mealSchedule: mealSchedule || [], plan: plan || "", icon });
        res.status(201).json(dp);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a diet plan
router.put("/:id", async (req, res) => {
    const { name, meals, cals, mealSchedule, plan, icon } = req.body;
    try {
        const dp = await DietPlan.findById(req.params.id);
        if (dp) {
            dp.name = name || dp.name;
            dp.meals = meals || dp.meals;
            dp.cals = cals || dp.cals;
            if (mealSchedule !== undefined) dp.mealSchedule = mealSchedule;
            if (plan !== undefined) dp.plan = plan;
            dp.icon = icon || dp.icon;
            const updatedPlan = await dp.save();
            res.json(updatedPlan);
        } else {
            res.status(404).json({ message: "Diet plan not found" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a diet plan
router.delete("/:id", async (req, res) => {
    try {
        const dp = await DietPlan.findById(req.params.id);
        if (dp) {
            await DietPlan.deleteOne({ _id: req.params.id });
            res.json({ message: "Diet plan removed" });
        } else {
            res.status(404).json({ message: "Diet plan not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

import express from "express";
import MembershipPlan from "../models/MembershipPlan.js";

const router = express.Router();

// @desc    Get all membership plans
// @route   GET /api/membership-plans
// @access  Public (or Private if implemented)
router.get("/", async (req, res) => {
    try {
        const plans = await MembershipPlan.find({}).sort({ createdAt: -1 });
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a membership plan
// @route   POST /api/membership-plans
// @access  Private (Admin)
router.post("/", async (req, res) => {
    const { name, price, duration, description } = req.body;

    try {
        const plan = await MembershipPlan.create({
            name,
            price,
            duration,
            description
        });
        res.status(201).json(plan);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a membership plan
// @route   PUT /api/membership-plans/:id
// @access  Private (Admin)
router.put("/:id", async (req, res) => {
    const { name, price, duration, description } = req.body;

    try {
        const plan = await MembershipPlan.findById(req.params.id);

        if (plan) {
            plan.name = name || plan.name;
            plan.price = price || plan.price;
            plan.duration = duration || plan.duration;
            plan.description = description || plan.description;

            const updatedPlan = await plan.save();
            res.json(updatedPlan);
        } else {
            res.status(404).json({ message: "Plan not found" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a membership plan
// @route   DELETE /api/membership-plans/:id
// @access  Private (Admin)
router.delete("/:id", async (req, res) => {
    try {
        const plan = await MembershipPlan.findById(req.params.id);

        if (plan) {
            await MembershipPlan.deleteOne({ _id: req.params.id });
            res.json({ message: "Plan removed" });
        } else {
            res.status(404).json({ message: "Plan not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

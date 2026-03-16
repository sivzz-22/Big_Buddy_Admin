import express from "express";
import Member from "../models/Member.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Get all members or trainers
router.get("/", async (req, res) => {
    try {
        const { role } = req.query; // Filter by role (member/trainer)
        const filter = role ? { role } : {};
        const members = await Member.find(filter).sort({ createdAt: -1 });
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single member by ID or MemberID
router.get("/:id", async (req, res) => {
    try {
        const member = await Member.findOne({
            $or: [
                { _id: req.params.id },
                { memberID: req.params.id }
            ]
        });
        if (member) {
            res.json(member);
        } else {
            res.status(404).json({ message: "Member not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper to calculate expiry date
const calculateExpiry = (planType, startDate = new Date()) => {
    let monthsToAdd = 0;
    const pt = planType.toLowerCase();
    if (pt.includes('month')) monthsToAdd = 1;
    else if (pt.includes('quarter')) monthsToAdd = 3;
    else if (pt.includes('half')) monthsToAdd = 6;
    else if (pt.includes('year')) monthsToAdd = 12;

    if (monthsToAdd > 0) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + monthsToAdd);
        return d;
    }
    return null;
};

// Create a new member or trainer
router.post("/", async (req, res) => {
    try {
        const { password, memberID, subscriptionType, discount, amountPaid } = req.body;

        const exists = await Member.findOne({ memberID });
        if (exists) return res.status(400).json({ message: "Member ID already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        let expiryDate = null;
        if (subscriptionType) {
            expiryDate = calculateExpiry(subscriptionType);
        }

        const member = new Member({
            ...req.body,
            password: hashedPassword,
            expiryDate: expiryDate || req.body.expiryDate
        });

        const savedMember = await member.save();
        res.status(201).json(savedMember);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update a member or trainer
router.put("/:id", async (req, res) => {
    try {
        const member = await Member.findOne({
            $or: [{ _id: req.params.id }, { memberID: req.params.id }]
        });

        if (member) {
            const oldSubscription = member.subscriptionType;
            
            Object.keys(req.body).forEach(key => {
                if (key !== 'password' && req.body[key] !== undefined) {
                    member[key] = req.body[key];
                }
            });

            if (req.body.password) {
                member.password = await bcrypt.hash(req.body.password, 10);
            }

            // If subscription changed or was just set
            if (req.body.subscriptionType && req.body.subscriptionType !== oldSubscription) {
                member.expiryDate = calculateExpiry(req.body.subscriptionType);
            }

            const updatedMember = await member.save();
            res.json(updatedMember);
        } else {
            res.status(404).json({ message: "Member not found" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a member or trainer
router.delete("/:id", async (req, res) => {
    try {
        const member = await Member.findOne({
            $or: [
                { _id: req.params.id },
                { memberID: req.params.id }
            ]
        });

        if (member) {
            await Member.deleteOne({ _id: member._id });
            res.json({ message: "Member removed" });
        } else {
            res.status(404).json({ message: "Member not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

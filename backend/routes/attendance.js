import express from "express";
import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";
import Gym from "../models/Gym.js";

const router = express.Router();

// Get attendance for a specific date and session
router.get("/", async (req, res) => {
    try {
        const { date, session, memberId } = req.query;
        let filter = {};
        if (date) filter.date = date;
        if (session) filter.session = session;
        if (memberId) filter.memberId = memberId;

        const records = await Attendance.find(filter).sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get attendance summary for a date
router.get("/summary", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: "Date is required" });

        const totalMembers = await Member.countDocuments({ role: 'member' });
        const presentToday = await Attendance.countDocuments({ date });

        res.json({
            present: presentToday,
            absent: Math.max(0, totalMembers - presentToday),
            total: totalMembers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get weekly trend data
router.get("/trend", async (req, res) => {
    try {
        const days = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }

        const counts = await Promise.all(days.map(async (date) => {
            const count = await Attendance.countDocuments({ date });
            return {
                day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                count
            };
        }));

        res.json(counts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Mark attendance
router.post("/", async (req, res) => {
    try {
        const { memberId, session, accessCode } = req.body;
        
        // Validate Access Code if provided (for user-side check-in)
        if (accessCode) {
            const gym = await Gym.findOne();
            if (gym && gym.attendanceCode !== accessCode) {
                return res.status(403).json({ message: "Invalid Access Code!" });
            }
        }

        const member = await Member.findById(memberId);
        if (!member) return res.status(404).json({ message: "Member not found" });

        // Sync status before checking
        await member.save(); 

        if (member.status === 'Expired') {
            return res.status(403).json({ 
                message: "Membership Expired!", 
                expiryDate: member.expiryDate 
            });
        }

        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        // Check if already marked
        const existing = await Attendance.findOne({ memberId, date, session });
        if (existing) {
            return res.status(400).json({ message: "Attendance already marked for this session today" });
        }

        const attendance = new Attendance({
            memberId,
            memberName: member.name,
            date,
            time,
            session
        });

        await attendance.save();
        res.status(201).json(attendance);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

export default router;

import express from "express";
import Member from "../models/Member.js";
import Transaction from "../models/Transaction.js";
import Attendance from "../models/Attendance.js";

const router = express.Router();


router.get("/stats", async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        const dateStr = targetDate.toISOString().split('T')[0];
        
        const startOfTargetDate = new Date(targetDate);
        startOfTargetDate.setHours(0, 0, 0, 0);
        const endOfTargetDate = new Date(targetDate);
        endOfTargetDate.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tenDaysFromNow = new Date(today);
        tenDaysFromNow.setDate(today.getDate() + 10);

        // Basic Stats (Still overall or based on targetDate?)
        // User said "overview should show the data of the selected date"
        // totalMembers and activeMembers are likely current overall status, but newMembers/revenue/attendance should be date-specific
        const totalMembers = await Member.countDocuments({ role: 'member' });
        const activeMembers = await Member.countDocuments({ 
            role: 'member', 
            $or: [
                { expiryDate: { $gt: today } },
                { status: 'Active', expiryDate: null }
            ]
        });
        
        // Expiring in 10 days from TODAY (always forward looking from current time)
        const expiringIn10Days = await Member.countDocuments({
            role: 'member',
            expiryDate: { $gte: today, $lte: tenDaysFromNow }
        });

        // Real Attendance Stats for targetDate
        const morningCount = await Attendance.countDocuments({ date: dateStr, session: 'Morning' });
        const eveningCount = await Attendance.countDocuments({ date: dateStr, session: 'Evening' });
        const attendance = {
            morning: morningCount,
            evening: eveningCount,
            totalToday: morningCount + eveningCount
        };


        // Transaction Summary for targetDate
        const targetTransactions = await Transaction.aggregate([
            { $match: { date: { $gte: startOfTargetDate, $lte: endOfTargetDate } } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                    upiRevenue: { $sum: { $cond: [{ $in: ["$paymentMode", ["UPI", "GPay"]] }, "$amount", 0] } },
                    cashRevenue: { $sum: { $cond: [{ $eq: ["$paymentMode", "Cash"] }, "$amount", 0] } }
                }
            }
        ]);

        const revenue = targetTransactions.length > 0 ? targetTransactions[0] : { totalRevenue: 0, upiRevenue: 0, cashRevenue: 0 };

        // New Members on targetDate
        const newMembersToday = await Member.countDocuments({
            role: 'member',
            joinDate: { $gte: startOfTargetDate, $lte: endOfTargetDate }
        });

        // Reminders (Status-based reminders are usually "as of now")
        const expiredCount = await Member.countDocuments({
            role: 'member',
            $or: [
                { status: 'Expired' },
                { expiryDate: { $lt: today } }
            ]
        });

        // Absent for > 2 days (Active members who have not attended in the last 2 days from TODAY)
        const twoDaysAgoDate = new Date(today);
        twoDaysAgoDate.setDate(today.getDate() - 2);
        const twoDaysAgoStr = twoDaysAgoDate.toISOString().split('T')[0];
        
        const recentAttenders = await Attendance.distinct("memberId", {
            date: { $gte: twoDaysAgoStr }
        });
        
        const absentCount = await Member.countDocuments({
            role: 'member',
            status: 'Active',
            _id: { $nin: recentAttenders }
        });

        // Birthdays on targetDate
        const targetMMDD = targetDate.toISOString().split('T')[0].substring(5); // gets MM-DD
        const birthdayCount = await Member.countDocuments({
            role: 'member',
            dob: { $regex: `${targetMMDD}$` }
        });

        // Pending Invoices
        const pendingInvoices = await Transaction.countDocuments({ invoiceSent: false });

        res.json({
            totalMembers,
            activeMembers,
            expiringIn10Days,
            attendance,
            revenue,
            newMembersToday,
            expiredCount,
            absentCount,
            birthdayCount,
            pendingInvoices
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/reminders/:type", async (req, res) => {
    try {
        const { type } = req.params;
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        today.setHours(0, 0, 0, 0);

        let members = [];

        if (type === 'expired') {
            members = await Member.find({
                role: 'member',
                $or: [
                    { status: 'Expired' },
                    { expiryDate: { $lt: today } }
                ]
            });
        } else if (type === 'absent') {
            const twoDaysAgoDate = new Date();
            twoDaysAgoDate.setDate(today.getDate() - 2);
            const twoDaysAgoStr = twoDaysAgoDate.toISOString().split('T')[0];
            
            const recentAttenders = await Attendance.distinct("memberId", {
                date: { $gte: twoDaysAgoStr }
            });
            members = await Member.find({
                role: 'member',
                status: 'Active',
                _id: { $nin: recentAttenders }
            });
        } else if (type === 'birthday') {
            const todayMMDD = dateStr.substring(5);
            members = await Member.find({
                role: 'member',
                dob: { $regex: `${todayMMDD}$` }
            });
        } else if (type === 'plans') {
            members = await Member.find({
                role: 'member',
                $or: [{ workoutPlan: "" }, { workoutPlan: "None" }, { dietPlan: "" }, { dietPlan: "None" }]
            });
        } else if (type === 'invoices') {
            const pendingInvoices = await Transaction.find({ invoiceSent: false }).populate('memberID');
            return res.json(pendingInvoices); // Returns direct distinct transaction payload
        }

        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

import express from "express";
import Member from "../models/Member.js";
import Transaction from "../models/Transaction.js";
import Attendance from "../models/Attendance.js";
import MessageLog from "../models/MessageLog.js";

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
        const totalTrainers = await Member.countDocuments({ role: 'trainer' });
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

        // Overall Transaction Summary (All time)
        const allTimeTransactions = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$amount" },
                    upiRevenue: { $sum: { $cond: [{ $in: ["$paymentMode", ["UPI", "GPay"]] }, "$amount", 0] } },
                    cashRevenue: { $sum: { $cond: [{ $eq: ["$paymentMode", "Cash"] }, "$amount", 0] } }
                }
            }
        ]);
        const overallRevenue = allTimeTransactions.length > 0 ? allTimeTransactions[0] : { totalRevenue: 0, upiRevenue: 0, cashRevenue: 0 };


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

        // Members with pending balance > 0
        const balanceCount = await Member.countDocuments({
            role: 'member',
            balance: { $gt: 0 }
        });

        res.json({
            totalMembers,
            totalTrainers,
            activeMembers,
            expiringIn10Days,
            attendance,
            revenue,
            overallRevenue,
            totalRevenueAllTime: overallRevenue.totalRevenue || 0,
            newMembersToday,
            expiredCount,
            absentCount,
            birthdayCount,
            pendingInvoices,
            balanceCount
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

        // Helper: find members who were messaged in the last 2 days for the given reminder type
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const recentlySentLogs = await MessageLog.find({
            date: { $gte: twoDaysAgo },
            type: type === 'expired' ? 'expired' : type === 'absent' ? 'absent' : type === 'balance' ? 'balance' : type === 'birthday' ? 'birthday' : type === 'invoices' ? 'invoice' : type
        });
        const recentlySentMemberIds = new Set(recentlySentLogs.map(l => l.memberId?.toString()).filter(Boolean));
        const recentlySentMemberNames = new Set(recentlySentLogs.map(l => l.memberName).filter(Boolean));

        // Filter out recently messaged members (snooze for 2 days)
        const filterSnoozed = (members) => members.filter(m => {
            const sentById = recentlySentMemberIds.has(m._id?.toString());
            const sentByName = recentlySentMemberNames.has(m.name);
            return !sentById && !sentByName;
        });

        let members = [];

        if (type === 'expired') {
            const raw = await Member.find({
                role: 'member',
                $or: [
                    { status: 'Expired' },
                    { expiryDate: { $lt: today } }
                ]
            });
            members = filterSnoozed(raw);
        } else if (type === 'absent') {
            const twoDaysAgoDate = new Date();
            twoDaysAgoDate.setDate(today.getDate() - 2);
            const twoDaysAgoStr = twoDaysAgoDate.toISOString().split('T')[0];

            const recentAttenders = await Attendance.distinct("memberId", {
                date: { $gte: twoDaysAgoStr }
            });
            const raw = await Member.find({
                role: 'member',
                status: 'Active',
                _id: { $nin: recentAttenders }
            });
            members = filterSnoozed(raw);
        } else if (type === 'birthday') {
            // Show birthday for today AND up to 2 days ago (belated window)
            const birthdayMMDDs = [];
            for (let i = 0; i <= 2; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const mmdd = d.toISOString().split('T')[0].substring(5); // MM-DD
                birthdayMMDDs.push(mmdd);
            }
            const raw = await Member.find({
                role: 'member',
                $or: birthdayMMDDs.map(mmdd => ({ dob: { $regex: `${mmdd}$` } }))
            });
            // Enrich with info about whether birthday was today or belated
            const todayMMDD = dateStr.substring(5);
            const enriched = raw.map(m => {
                const dobStr = m.dob || '';
                const isBelated = !dobStr.endsWith(todayMMDD);
                return { ...m.toObject(), isBelated };
            });
            // Snooze: exclude those already wished in last 2 days  
            members = filterSnoozed(enriched);
        } else if (type === 'plans') {
            members = await Member.find({
                role: 'member',
                $or: [{ workoutPlan: "" }, { workoutPlan: "None" }, { dietPlan: "" }, { dietPlan: "None" }]
            });
        } else if (type === 'balance') {
            const raw = await Member.find({
                role: 'member',
                balance: { $gt: 0 }
            }).sort({ balance: -1 });
            members = filterSnoozed(raw);
        } else if (type === 'invoices') {
            const pendingInvoices = await Transaction.find({ invoiceSent: false }).populate('memberID');
            return res.json(pendingInvoices);
        }

        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;

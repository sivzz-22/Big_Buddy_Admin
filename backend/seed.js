import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from './models/Member.js';
import MembershipPlan from './models/MembershipPlan.js';
import WorkoutPlan from './models/WorkoutPlan.js';
import DietPlan from './models/DietPlan.js';
import Transaction from './models/Transaction.js';
import Attendance from './models/Attendance.js';
import Gym from './models/Gym.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // 1. Clear existing data (Optional, but good for a fresh start)
        console.log("Clearing existing data...");
        await Member.deleteMany({});
        await MembershipPlan.deleteMany({});
        await WorkoutPlan.deleteMany({});
        await DietPlan.deleteMany({});
        await Transaction.deleteMany({});
        await Attendance.deleteMany({});
        // We keep Gym info as it's setup specifically

        // 2. Sample Membership Plans
        console.log("Seeding Membership Plans...");
        const plans = await MembershipPlan.insertMany([
            { name: "Monthly Basic", price: 1000, duration: "1 Month", description: "Access to all gym equipment" },
            { name: "Quarterly Pro", price: 2500, duration: "3 Months", description: "Includes one free trainer session" },
            { name: "Yearly Elite", price: 8000, duration: "1 Year", description: "All-inclusive access + 5 free PT sessions" }
        ]);

        // 3. Sample Workout Plans
        console.log("Seeding Workout Plans...");
        const workouts = await WorkoutPlan.insertMany([
            { title: "Full Body Beginner", level: "Beginner", duration: "45 mins", routine: "Pushups, Squats, Lunges, Plank" },
            { title: "Mass Gainer", level: "Intermediate", duration: "60 mins", routine: "Bench Press, Deadlifts, Overhead Press" },
            { title: "Fat Shredder", level: "Advanced", duration: "50 mins", routine: "HIIT, Burpees, Mountain Climbers" }
        ]);

        // 4. Sample Diet Plans
        console.log("Seeding Diet Plans...");
        const diets = await DietPlan.insertMany([
            { name: "Weight Loss", meals: "4", cals: "1500 kcal", plan: "High protein, low carb, lots of greens", icon: "food-apple" },
            { name: "Muscle Gain", meals: "6", cals: "3000 kcal", plan: "High calorie, balanced macros, clean bulk", icon: "food-drumstick" },
            { name: "Keto Special", meals: "3", cals: "1800 kcal", plan: "Very low carb, high healthy fats", icon: "food-avocado" }
        ]);

        // 5. Sample Members (Including a Trainer)
        console.log("Seeding Members...");
        const members = await Member.insertMany([
            {
                name: "Rahul Sharma",
                memberID: "MEM001",
                password: "password123",
                phone: "9876543210",
                email: "rahul@example.com",
                dob: "1995-05-15",
                gender: "Male",
                bloodGroup: "O+",
                address: "Flat 101, Green View, Delhi",
                subscriptionType: "Monthly Basic",
                status: "Active",
                role: "member",
                expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
            },
            {
                name: "Priya Singh",
                memberID: "MEM002",
                password: "password123",
                phone: "9876543211",
                email: "priya@example.com",
                dob: "1998-08-22",
                gender: "Female",
                bloodGroup: "A+",
                address: "House 55, Sector 4, Noida",
                subscriptionType: "Quarterly Pro",
                status: "Active",
                role: "member",
                expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Expiring soon
            },
            {
                name: "John Doe",
                memberID: "MEM003",
                password: "password123",
                phone: "9876543212",
                email: "john@example.com",
                dob: "1990-01-01",
                gender: "Male",
                bloodGroup: "B+",
                address: "Urban Towers, Gurgaon",
                subscriptionType: "Yearly Elite",
                status: "Expired",
                role: "member",
                expiryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Expired
            },
            {
                name: "Vikram Trainer",
                memberID: "TRN001",
                password: "password123",
                phone: "9998887770",
                email: "vikram@example.com",
                dob: "1988-12-10",
                gender: "Male",
                bloodGroup: "AB+",
                address: "Gym Quarters, Delhi",
                role: "trainer",
                workTime: "Both"
            }
        ]);

        // 6. Sample Transactions
        console.log("Seeding Transactions...");
        await Transaction.insertMany([
            { memberID: members[0]._id, memberName: members[0].name, amount: 1000, paymentMode: "Cash", planType: "Monthly", date: new Date() },
            { memberID: members[1]._id, memberName: members[1].name, amount: 2500, paymentMode: "GPay", planType: "Quarterly", date: new Date() },
            { memberID: members[2]._id, memberName: members[2].name, amount: 8000, paymentMode: "UPI", planType: "Yearly", date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        ]);

        // 7. Sample Attendance
        console.log("Seeding Attendance...");
        const todayStr = new Date().toISOString().split('T')[0];
        await Attendance.insertMany([
            { memberId: members[0]._id, memberName: members[0].name, date: todayStr, time: "07:30 AM", session: "Morning", status: "Present" },
            { memberId: members[1]._id, memberName: members[1].name, date: todayStr, time: "06:15 PM", session: "Evening", status: "Present" }
        ]);

        console.log("Data Seeding Completed Successfully!");
        process.exit();
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// Routes
import authRoutes from "./routes/auth.js";
import membershipPlanRoutes from "./routes/membershipPlans.js";
import workoutPlanRoutes from "./routes/workoutPlans.js";
import dietPlanRoutes from "./routes/dietPlans.js";
import memberRoutes from "./routes/members.js";
import transactionRoutes from "./routes/transactions.js";
import dashboardRoutes from "./routes/dashboard.js";
import attendanceRoutes from "./routes/attendance.js";
import gymRoutes from "./routes/gym.js";
import messagesRoutes from "./routes/messages.js";

app.use("/api/auth", authRoutes);
app.use("/api/membership-plans", membershipPlanRoutes);
app.use("/api/workout-plans", workoutPlanRoutes);
app.use("/api/diet-plans", dietPlanRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/gym", gymRoutes);
app.use("/api/messages", messagesRoutes);




const PORT = process.env.PORT || 5050;
const MONGO_URI = process.env.MONGO_URI;

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
    res.send("Gym Management API is working");
});

app.listen(PORT, () => {
    console.log("Server is running on PORT:", PORT);
});
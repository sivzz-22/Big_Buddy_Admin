import mongoose from "mongoose";

const gymSchema = new mongoose.Schema({
    name: { type: String, required: true, default: "Iron Forge Gym" },
    address: { type: String, default: "123 Muscle Street, Fitness City" },
    location: { type: String, default: "Downtown Area" },
    gmail: { type: String, default: "info@ironforge.com" },
    contact: { type: String, default: "+1 234 567 8900" },
    image: { type: String }, // URL or Base64
    qrCode: { type: String }, // URL or Base64 for Bank QR
    attendanceCode: { type: String, default: () => Math.floor(1000 + Math.random() * 9000).toString() },
    softwareUsageFee: { type: Number, default: 499 },
    subscriptionPlan: { type: String, default: "Business Pro Annual" },
    nextPaymentDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    status: { type: String, default: "Active" }
}, { timestamps: true });

const Gym = mongoose.model("Gym", gymSchema);
export default Gym;

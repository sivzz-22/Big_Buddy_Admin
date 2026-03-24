import mongoose from "mongoose";

const dailyLogSchema = new mongoose.Schema({
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    workoutLogs: [{
        exercise: String,
        reps: String,
        sets: String,
        weight: String,
        time: String
    }],
    dietLogs: [{
        mealTime: String,       // e.g. "Morning"
        mealName: String,       // e.g. "Morning - Nuts, fruits, 100g rice" (display label)
        items: String,          // food items string
        isCompleted: { type: Boolean, default: false }
    }],
    metrics: {
        calories: Number,
        waterIntake: Number,
        mood: String,
        weight: Number,
        steps: Number
    }
}, { timestamps: true });

// Ensure one log per member per day
dailyLogSchema.index({ memberId: 1, date: 1 }, { unique: true });

const DailyLog = mongoose.model("DailyLog", dailyLogSchema);
export default DailyLog;

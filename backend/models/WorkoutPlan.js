import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sets: { type: String, default: "3" },
    reps: { type: String, default: "10" },
    kg: { type: String, default: "0" },
}, { _id: false });

const workoutPlanSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true,
        default: "Beginner"
    },
    duration: {
        type: String,
        required: true
    },
    exercises: {
        type: [exerciseSchema],
        default: []
    },
    // Keep routine for backward compatibility (legacy field)
    routine: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const WorkoutPlan = mongoose.model("WorkoutPlan", workoutPlanSchema);

export default WorkoutPlan;

import mongoose from "mongoose";

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
    routine: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const WorkoutPlan = mongoose.model("WorkoutPlan", workoutPlanSchema);

export default WorkoutPlan;

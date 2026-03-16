import mongoose from "mongoose";

const dietPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    meals: {
        type: String,
        required: true,
        default: "4"
    },
    cals: {
        type: String,
        required: true,
        default: "2000 kcal"
    },
    plan: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        default: "food-apple"
    }
}, {
    timestamps: true
});

const DietPlan = mongoose.model("DietPlan", dietPlanSchema);

export default DietPlan;

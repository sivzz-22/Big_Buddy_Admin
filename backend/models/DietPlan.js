import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
    mealTime: { type: String, required: true },  // e.g. "Morning", "Noon", "Evening", "Night"
    items: { type: String, required: true },      // e.g. "Nuts, fruits, 100g rice"
}, { _id: false });

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
    mealSchedule: {
        type: [mealSchema],
        default: []
    },
    // Keep plan for backward compatibility (legacy field)
    plan: {
        type: String,
        default: ""
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

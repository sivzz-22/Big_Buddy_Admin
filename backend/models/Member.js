import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    name: { type: String, required: true },
    memberID: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    address: { type: String, required: true },
    height: { type: String },
    weight: { type: String },
    waistSize: { type: String },
    description: { type: String },
    role: { type: String, enum: ['member', 'trainer'], default: 'member' },
    subscriptionType: { type: String },
    workoutPlan: { type: String },
    dietPlan: { type: String },
    discount: { type: Number, default: 0 },
    paymentMode: { type: String, default: 'Cash' },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    isPaymentCompleted: { type: Boolean, default: false },
    workTime: { type: String }, // For trainers: Morning, Evening, Both
    status: { type: String, enum: ['Active', 'Expired'], default: 'Active' },
    expiryDate: { type: Date },
    joinDate: { type: Date, default: Date.now },
    photo: { type: String }, // URL to photo
}, {
    timestamps: true
});

// Auto-update status based on expiryDate
memberSchema.pre("save", function (next) {
    if (this.expiryDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(this.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry < today) {
            this.status = 'Expired';
        } else {
            this.status = 'Active';
        }
    }
    next();
});

const Member = mongoose.model("Member", memberSchema);

export default Member;

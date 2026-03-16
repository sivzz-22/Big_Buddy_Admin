import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    memberID: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    memberName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, enum: ['Cash', 'UPI', 'GPay'], default: 'Cash' },
    planType: { type: String }, // e.g., Monthly, Quarterly, Yearly
    date: { type: Date, default: Date.now },
    description: { type: String },
    invoiceSent: { type: Boolean, default: false },
}, {
    timestamps: true
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;

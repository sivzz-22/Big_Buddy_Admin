import mongoose from "mongoose";

const messageLogSchema = new mongoose.Schema({
    memberName: { type: String, required: true },
    memberPhone: { type: String },
    memberEmail: { type: String },
    message: { type: String, required: true },
    channel: { type: String, required: true }, // WhatsApp, SMS, Mail
    type: { type: String }, // invoice, expired, absent, birthday, plans
    date: { type: Date, default: Date.now },
}, {
    timestamps: true
});

const MessageLog = mongoose.model("MessageLog", messageLogSchema);

export default MessageLog;

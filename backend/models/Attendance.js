import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, required: true }, // Format: HH:mm AM/PM
    session: { type: String, enum: ['Morning', 'Evening'], required: true },
    status: { type: String, default: 'Present' }
}, {
    timestamps: true
});

// Ensure a member can only have one attendance record per session per day
attendanceSchema.index({ memberId: 1, date: 1, session: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;

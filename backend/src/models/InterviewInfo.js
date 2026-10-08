const mongoose = require('mongoose');

const interviewInfoSchema = new mongoose.Schema(
  {
    interviewId: { type: Number, required: true, unique: true },
    hName: { type: String, required: true, trim: true },
    hNo: { type: String, trim: true },
    hEdu: { type: String, required: true, trim: true },
    hGender: { type: String, required: true, trim: true },
    hPhone: { type: String, required: true, trim: true },
    hAge: { type: Number, required: true, min: 0, max: 150 },
    ansDate: { type: Date, required: true, index: true },
    tspCode: { type: String, required: true, index: true },
    tvgCode: { type: String, required: true },
    wvCode: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewInfo', interviewInfoSchema);

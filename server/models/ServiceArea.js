const mongoose = require("mongoose");

const serviceAreaSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true, maxlength: 100 },
  active: { type: Boolean, default: true, index: true },
  supportsLocal: { type: Boolean, default: true },
  supportsOutstation: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("ServiceArea", serviceAreaSchema);

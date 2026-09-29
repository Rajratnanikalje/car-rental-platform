const mongoose = require("mongoose");

const siteContentSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    publishedAt: { type: Date, default: null },
    seo: {
      title: { type: String, trim: true, maxlength: 160, default: "" },
      description: { type: String, trim: true, maxlength: 320, default: "" },
      keywords: { type: [String], default: [] },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SiteContent", siteContentSchema);

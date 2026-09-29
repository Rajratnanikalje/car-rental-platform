const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      trim: true,
    },

    role: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
    },
    dataOrigin: { type: String, enum: ["demo", "production", "legacy"], default: "legacy" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);

const mongoose = require("mongoose");
const dns = require("dns");

try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
  // Ignore in environments where custom DNS servers cannot be set
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI ? process.env.MONGO_URI.trim() : "";
    await mongoose.connect(mongoUri);

    console.log("MongoDB Atlas Connected Successfully ✅");
  } catch (error) {
    console.error("MongoDB Connection Failed ❌:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
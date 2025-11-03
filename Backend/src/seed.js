require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { User } = require("./models/sales");

const createManager = async () => {
  try {
    // Connect to database
    await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb+srv://standardwebtechnologies_db_user:Dz50fTK0YgXaxc9E@cluster0.cjo82jj.mongodb.net/serenityfoodcourt "
    );
    console.log("✅ Connected to MongoDB");

    // Check if manager exists
    const existingManager = await User.findOne({ role: "manager" });
    if (existingManager) {
      console.log("⚠️  Manager already exists!");
      console.log(`Username: ${existingManager.username}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create manager
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const manager = new User({
      username: "admin",
      password: hashedPassword,
      fullName: "System Administrator",
      role: "manager",
      isActive: true,
    });

    await manager.save();

    console.log("\n✅ Manager created successfully!");
    console.log("================================");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("================================");
    console.log("⚠️  Change this password after first login!\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

createManager();

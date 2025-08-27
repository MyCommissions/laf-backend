const mongoose = require('mongoose');

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI).then(() => {
            console.log("MongoDB connected successfully");
        })
    } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
    }
}

module.exports = dbConnect;
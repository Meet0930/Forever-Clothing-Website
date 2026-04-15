import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected',() => {
        console.log("DB Connected");
    })

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error.message)
    })

    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce`)
    } catch (error) {
        console.error('MongoDB connection failed:', error.message)
    }

}

export default connectDB;

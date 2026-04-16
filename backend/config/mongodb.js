import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on('connected',() => {
        console.log("DB Connected");
    })

    mongoose.connection.on('error', (error) => {
        console.error('MongoDB connection error:', error.message)
    })

    const uri = process.env.MONGODB_URI || ''
    const finalUri = uri.includes('/?')
        ? uri.replace('/?', '/e-commerce?')
        : uri.includes('?')
            ? `${uri.split('?')[0]}/e-commerce?${uri.split('?')[1]}`
            : `${uri}/e-commerce`

    try {
        await mongoose.connect(finalUri)
    } catch (error) {
        console.error('MongoDB connection failed:', error.message)
        throw error
    }

}

export default connectDB;

import mongoose from "mongoose";

const connectDB = async () => {
    mongoose.connection.on('connected',() => {
        console.log("DB Connected");
    })

    const uri = process.env.MONGODB_URI || ''
    const finalUri = uri.includes('/?')
        ? uri.replace('/?', '/e-commerce?')
        : uri.includes('?')
            ? `${uri.split('?')[0]}/e-commerce?${uri.split('?')[1]}`
            : `${uri}/e-commerce`

    await mongoose.connect(finalUri)

}

export default connectDB;

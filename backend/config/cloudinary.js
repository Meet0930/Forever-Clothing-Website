import {v2 as cloudinary } from "cloudinary"

const connectCloudinary = async () => {
    const normalize = (value) => value?.trim().replace(/^['"]|['"]$/g, '')

    cloudinary.config({
        cloud_name: normalize(process.env.CLOUDINARY_NAME),
        api_key: normalize(process.env.CLOUDINARY_API_KEY),
        api_secret: normalize(process.env.CLOUDINARY_SECRET_KEY)
    })

}

export default connectCloudinary;

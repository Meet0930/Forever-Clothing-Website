import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'

const app = express()
const normalize = (value) => value?.trim().replace(/^['"]|['"]$/g, '')

app.use(express.json())
app.use(cors())

app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/order', orderRouter)

app.get('/', (req, res) => {
  res.send('API Working')
})

let initialized = false

export const initBackend = async () => {
  if (initialized) {
    return
  }

  initialized = true
  process.env.JWT_SECRET = normalize(process.env.JWT_SECRET)
  process.env.ADMIN_EMAIL = normalize(process.env.ADMIN_EMAIL)
  process.env.ADMIN_PASSWORD = normalize(process.env.ADMIN_PASSWORD)
  process.env.MONGODB_URI = normalize(process.env.MONGODB_URI)
  process.env.CLOUDINARY_NAME = normalize(process.env.CLOUDINARY_NAME)
  process.env.CLOUDINARY_API_KEY = normalize(process.env.CLOUDINARY_API_KEY)
  process.env.CLOUDINARY_SECRET_KEY = normalize(process.env.CLOUDINARY_SECRET_KEY)
  process.env.STRIPE_SECRET_KEY = normalize(process.env.STRIPE_SECRET_KEY)
  await Promise.all([connectDB(), connectCloudinary()])
}

export default app

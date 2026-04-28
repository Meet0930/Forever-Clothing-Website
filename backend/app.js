import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)) })

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
  process.env.ADMIN_EMAIL = normalize(process.env.ADMIN_EMAIL || process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER)
  process.env.ADMIN_PASSWORD = normalize(process.env.ADMIN_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS)
  process.env.MONGODB_URI = normalize(process.env.MONGODB_URI)
  process.env.CLOUDINARY_NAME = normalize(process.env.CLOUDINARY_NAME)
  process.env.CLOUDINARY_API_KEY = normalize(process.env.CLOUDINARY_API_KEY)
  process.env.CLOUDINARY_SECRET_KEY = normalize(process.env.CLOUDINARY_SECRET_KEY)
  process.env.STRIPE_SECRET_KEY = normalize(process.env.STRIPE_SECRET_KEY)

  const requiredEnv = [
    'JWT_SECRET',
    'MONGODB_URI',
    'CLOUDINARY_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_SECRET_KEY',
  ]
  const missingEnv = requiredEnv.filter((key) => !process.env[key])
  if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`)
  }

  await Promise.all([connectDB(), connectCloudinary()])
}

export default app

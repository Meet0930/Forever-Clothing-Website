import validator from "validator";
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";
import { sendMail } from "../config/mailer.js";
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()
const createResetToken = (email) => {
    return jwt.sign({ email, purpose: 'password-reset' }, process.env.JWT_SECRET, { expiresIn: '10m' })
}

const verifyResetToken = (token) => {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (!payload || payload.purpose !== 'password-reset' || !payload.email) {
        throw new Error('Invalid reset token')
    }
    return payload
}

// Route for user login
const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {

            const token = createToken(user._id)
            res.json({ success: true, token })

        }
        else {
            res.json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {

        const { name, email, password } = req.body;

        // checking user already exists or not
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        // validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {
        
        const {email,password} = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email+password,process.env.JWT_SECRET);
            res.json({success:true,token})
        } else {
            res.json({success:false,message:"Invalid credentials"})
        }

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        if (!email || !validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const otp = generateOtp()
        const resetOtpHash = await bcrypt.hash(otp, 10)
        const resetOtpExpiresAt = Date.now() + 10 * 60 * 1000

        user.resetOtpHash = resetOtpHash
        user.resetOtpExpiresAt = resetOtpExpiresAt
        await user.save()

        const emailPayload = {
            to: email,
            subject: 'Forever Clothes password reset OTP',
            text: `Forever Clothes password reset OTP: ${otp}. It expires in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                    <h2 style="margin-bottom: 12px;">Forever Clothes Password Reset OTP</h2>
                    <p>Your OTP for resetting your Forever Clothes account password is:</p>
                    <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 16px 0;">${otp}</div>
                    <p>This code expires in 10 minutes.</p>
                    <p style="margin-top: 16px;">Sent by Forever Clothes.</p>
                </div>
            `,
        }

        await sendMail(emailPayload)
        res.json({ success: true, message: 'OTP sent to your registered email' })
    } catch (error) {
        console.error('[forgot-password]', error.message)
        res.json({
            success: false,
            message: error.message,
        })
    }
}

const verifyForgotPasswordOtp = async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' })
        }

        if (!otp || otp.length !== 6) {
            return res.json({ success: false, message: 'Please enter the 6 digit OTP' })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
            return res.json({ success: false, message: 'OTP expired or not requested' })
        }

        if (Date.now() > user.resetOtpExpiresAt) {
            user.resetOtpHash = ''
            user.resetOtpExpiresAt = 0
            await user.save()
            return res.json({ success: false, message: 'OTP expired. Please request a new one' })
        }

        const isMatch = await bcrypt.compare(otp, user.resetOtpHash)
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid OTP' })
        }

        const resetToken = createResetToken(email)
        res.json({ success: true, message: 'OTP verified successfully', resetToken })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const resetPassword = async (req, res) => {
    try {
        const { resetToken, password, confirmPassword } = req.body

        if (!resetToken) {
            return res.json({ success: false, message: 'Reset token is required' })
        }

        if (!password || password.length < 8) {
            return res.json({ success: false, message: 'Please enter a strong password' })
        }

        if (password !== confirmPassword) {
            return res.json({ success: false, message: 'Passwords do not match' })
        }

        const payload = verifyResetToken(resetToken)
        const email = payload.email

        if (!email || !validator.isEmail(email)) {
            return res.json({ success: false, message: 'Invalid reset token' })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        user.password = hashedPassword
        user.resetOtpHash = ''
        user.resetOtpExpiresAt = 0
        await user.save()

        res.json({ success: true, message: 'Password reset successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


export { loginUser, registerUser, adminLogin, forgotPassword, verifyForgotPasswordOtp, resetPassword }

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { sendMail } from "../config/mailer.js";

// global variables
const currency = 'inr'
const deliveryCharge = 10

const sendOrderNotification = async ({ email, subject, title, message, items, amount, status }) => {
    if (!email) {
        return
    }

    const adminCopyEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || ''
    const bcc = adminCopyEmail && adminCopyEmail !== email ? adminCopyEmail : undefined

    const itemsHtml = items.map((item) => `
        <li style="margin-bottom: 8px;">
            ${item.name} x ${item.quantity}${item.size ? `, Size: ${item.size}` : ''}
        </li>
    `).join('')

    await sendMail({
        to: email,
        bcc,
        subject,
        text: message,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
                <h2 style="margin-bottom: 12px;">${title}</h2>
                <p>${message}</p>
                <p><strong>Total Amount:</strong> ₹${amount}</p>
                ${status ? `<p><strong>Status:</strong> ${status}</p>` : ''}
                <div style="margin-top: 16px;">
                    <p style="margin-bottom: 8px;"><strong>Items:</strong></p>
                    <ul style="padding-left: 20px; margin: 0;">
                        ${itemsHtml}
                    </ul>
                </div>
                <p style="margin-top: 16px;">Sent by Forever Clothes.</p>
            </div>
        `,
    })

    console.log(`[order-email] Sent "${subject}" to ${email}${bcc ? ` with BCC ${bcc}` : ''}`)
}

const getUserEmail = async (userId) => {
    const user = await userModel.findById(userId)
    return user?.email || ''
}

const getOrderRecipientEmail = async (order) => {
    const checkoutEmail = order?.address?.email?.trim?.()
    if (checkoutEmail) {
        return checkoutEmail
    }

    return getUserEmail(order?.userId)
}

const getStatusNotificationContent = (status) => {
    switch (status) {
        case 'Packing':
            return {
                subject: 'Forever Clothes - Your order is being packed',
                title: 'Your order is now being packed',
                message: 'Tamaro order packing ma chhe. We are preparing it for shipment.',
            }
        case 'Shipped':
            return {
                subject: 'Forever Clothes - Your order has shipped',
                title: 'Your order has shipped',
                message: 'Tamaro order shipped thayo chhe. It is on the way to you.',
            }
        case 'Out for delivery':
            return {
                subject: 'Forever Clothes - Your order is out for delivery',
                title: 'Your order is out for delivery',
                message: 'Tamaro order out for delivery chhe. It will reach you very soon.',
            }
        case 'Delivered':
            return {
                subject: 'Forever Clothes - Your order has been delivered',
                title: 'Your order has been delivered',
                message: 'Tamaro order delivered thayo chhe. Thank you for shopping with Forever Clothes.',
            }
        default:
            return null
    }
}

// gateway initialize
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    : null

// Placing orders using COD Method
const placeOrder = async (req,res) => {
    
    try {
        
        const { userId, items, amount, address} = req.body;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        const email = await getOrderRecipientEmail(newOrder)
        await sendOrderNotification({
            email,
            subject: 'Forever Clothes - Order Placed Successfully',
            title: 'Your order was placed successfully',
            message: 'Your Forever Clothes order has been placed successfully.',
            items,
            amount,
            status: 'Order Placed',
        }).catch((error) => console.error('[order-email]', error.message))

        res.json({success:true,message:"Order Placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Stripe Method
const placeOrderStripe = async (req,res) => {
    try {
        
        const { userId, items, amount, address} = req.body
        const { origin } = req.headers;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Stripe",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency:currency,
                product_data: {
                    name:item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency:currency,
                product_data: {
                    name:'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({success:true,session_url:session.url});

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body

        if (!razorpay) {
            return res.json({
                success: false,
                message: 'Razorpay credentials are not configured',
            })
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: 'Razorpay',
            payment: false,
            date: Date.now(),
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const razorpayOrder = await razorpay.orders.create({
            amount: amount * 100,
            currency: 'INR',
            receipt: newOrder._id.toString(),
        })

        await orderModel.findByIdAndUpdate(newOrder._id, {
            razorpay_order_id: razorpayOrder.id,
        })

        res.json({ success: true, order: razorpayOrder })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Verify Stripe 
const verifyStripe = async (req,res) => {

    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            const order = await orderModel.findById(orderId)
            if (!order) {
                return res.json({ success: false, message: 'Order not found' })
            }

            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}})

            const email = await getOrderRecipientEmail(order)
            await sendOrderNotification({
                email,
                subject: 'Forever Clothes - Order Placed Successfully',
                title: 'Your order was placed successfully',
                message: 'Your payment was confirmed and your order has been placed successfully.',
                items: order?.items || [],
                amount: order?.amount || 0,
                status: 'Order Placed',
            }).catch((error) => console.error('[order-email]', error.message))

            res.json({success: true});
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Verify Razorpay
const verifyRazorpay = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.json({ success: false, message: 'Invalid Razorpay payload' })
        }

        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.json({
                success: false,
                message: 'Razorpay credentials are not configured',
            })
        }

        const sign = razorpay_order_id + '|' + razorpay_payment_id
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex')

        if (expectedSignature !== razorpay_signature) {
            return res.json({ success: false, message: 'Payment verification failed' })
        }

        const order = await orderModel.findOne({ razorpay_order_id })
        if (!order) {
            return res.json({ success: false, message: 'Order not found' })
        }

        await orderModel.findByIdAndUpdate(order._id, {
            payment: true,
            razorpay_payment_id,
            razorpay_signature,
        })

        await userModel.findByIdAndUpdate(order.userId, { cartData: {} })

        const email = await getOrderRecipientEmail(order)
        await sendOrderNotification({
            email,
            subject: 'Forever Clothes - Order Placed Successfully',
            title: 'Your order was placed successfully',
            message: 'Your payment was confirmed and your order has been placed successfully.',
            items: order.items,
            amount: order.amount,
            status: 'Order Placed',
        }).catch((error) => console.error('[order-email]', error.message))

        res.json({ success: true })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// All Orders data for Admin Panel
const allOrders = async (req,res) => {

    try {
        
        const orders = await orderModel.find({})
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// User Order Data For Forntend
const userOrders = async (req,res) => {
    try {
        
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {
        const { orderId, status } = req.body

        const order = await orderModel.findById(orderId)
        if (!order) {
            return res.json({success:false,message:'Order not found'})
        }

        const previousStatus = order.status
        order.status = status
        await order.save()

        if (previousStatus !== status && ['Packing', 'Shipped', 'Out for delivery', 'Delivered'].includes(status)) {
            const email = await getOrderRecipientEmail(order)
            const notification = getStatusNotificationContent(status)

            if (!notification) {
                return res.json({success:true,message:'Status Updated'})
            }

            await sendOrderNotification({
                email,
                subject: notification.subject,
                title: notification.title,
                message: notification.message,
                items: order.items,
                amount: order.amount,
                status,
            }).catch((error) => console.error('[order-email]', error.message))
        }

        res.json({success:true,message:'Status Updated'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export { verifyStripe, verifyRazorpay, placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus }

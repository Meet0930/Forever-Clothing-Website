import React, { useEffect, useRef, useState } from 'react'
import { useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const Verify = () => {

    const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext)
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('loading')
    const [subtitle, setSubtitle] = useState('We are checking your payment status.')
    const redirectedRef = useRef(false)

    const success = searchParams.get('success')
    const orderId = searchParams.get('orderId')
    const verifyPayment = async () => {
        try {

            if (!token) {
                return null
            }

            if (success !== 'true') {
                setStatus('failed')
                navigate('/cart')
                return
            }

            const response = await axios.post(backendUrl + '/api/order/verifyStripe', { success, orderId }, { headers: { token } })

            if (response.data.success) {
                setCartItems({})
                toast.success('Your order was placed successfully')
                setStatus('success')
                setSubtitle('Stripe payment verified. Redirecting you to your orders.')
            } else {
                setStatus('failed')
                navigate('/cart')
            }

        } catch (error) {
            console.log(error)
            setStatus('failed')
            toast.error(error.message)
        }
    }

    useEffect(() => {
        verifyPayment()
    }, [token, success, orderId])

    useEffect(() => {
        if (!isSuccess || redirectedRef.current) {
            return
        }

        redirectedRef.current = true
        const timer = setTimeout(() => {
            window.location.hash = '#/orders'
        }, 1200)

        return () => clearTimeout(timer)
    }, [isSuccess, navigate])

    const isSuccess = status === 'success'

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-lime-50" />
                <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
                <div className="absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-lime-200/40 blur-3xl" />
                <div className="relative px-6 py-12 sm:px-10 sm:py-16 text-center">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner ring-8 ring-emerald-50">
                        <span className="text-4xl leading-none font-bold">
                            {status === 'loading' ? '…' : isSuccess ? '✓' : '×'}
                        </span>
                    </div>

                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
                        {status === 'loading' ? 'Verifying Payment' : isSuccess ? 'Order Confirmed' : 'Payment Failed'}
                    </p>

                    <h1 className="text-3xl font-semibold text-gray-900 sm:text-5xl">
                        {status === 'loading'
                            ? 'Please wait a moment'
                            : isSuccess
                                ? 'Your order was placed successfully'
                                : 'We could not confirm the payment'}
                    </h1>

                    <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-gray-600 sm:text-base">
                        {status === 'loading'
                            ? 'We are checking your payment status and preparing your order.'
                            : isSuccess
                                ? subtitle
                                : 'You can try the checkout again or return to your cart to continue shopping.'}
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <button
                            onClick={() => navigate('/orders')}
                            disabled={!isSuccess}
                            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            View Orders
                        </button>
                    </div>

                    <p className="mt-6 text-xs uppercase tracking-[0.25em] text-gray-400">
                        {status === 'loading'
                            ? 'Please do not close this page'
                            : isSuccess
                                ? 'Redirecting to your orders now'
                                : 'Please return to checkout'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Verify

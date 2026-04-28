import React, { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

const OrderSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const source = searchParams.get('source') || 'payment'

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/orders')
    }, 3500)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-lime-50" />
        <div className="absolute -top-24 right-0 h-48 w-48 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-lime-200/40 blur-3xl" />
        <div className="relative px-6 py-12 sm:px-10 sm:py-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner ring-8 ring-emerald-50">
            <span className="text-4xl leading-none font-bold">✓</span>
          </div>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Order Confirmed
          </p>

          <h1 className="text-3xl font-semibold text-gray-900 sm:text-5xl">
            Your order was placed successfully
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-gray-600 sm:text-base">
            {source === 'stripe'
              ? 'Stripe payment has been verified and your order is now in processing.'
              : 'Your payment was verified and the order has been added to your account.'}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => navigate('/orders')}
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <span className="text-base leading-none">▣</span>
              View Orders
            </button>
            <Link
              to="/collection"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:border-gray-900 hover:text-gray-900"
            >
              Continue Shopping
            </Link>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-gray-400">
            Redirecting to your orders in a few seconds
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess

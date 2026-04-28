import React, { useContext, useEffect, useRef, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

const Orders = () => {

  const { backendUrl, token, currency, setCartItems, navigate } = useContext(ShopContext);

  const [orderData,setorderData] = useState([])
  const [loading, setLoading] = useState(true)
  const [verifyingStripe, setVerifyingStripe] = useState(false)
  const [searchParams] = useSearchParams()
  const authToken = token || localStorage.getItem('token') || ''
  const stripeHandledRef = useRef(false)

  const paymentSuccess = searchParams.get('success')
  const paymentOrderId = searchParams.get('orderId')

  const loadOrderData = async () => {
    try {
      setLoading(true)

      if (!authToken) {
        setOrderData([])
        setLoading(false)
        return null
      }

      const response = await axios.post(backendUrl + '/api/order/userorders',{},{headers:{token:authToken}})
      if (response.data.success) {
        let allOrdersItem = []
        response.data.orders.map((order)=>{
          order.items.map((item)=>{
            item['status'] = order.status
            item['payment'] = order.payment
            item['paymentMethod'] = order.paymentMethod
            item['date'] = order.date
            allOrdersItem.push(item)
          })
        })
        setorderData(allOrdersItem.reverse())
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const verifyStripePayment = async () => {
    if (stripeHandledRef.current) {
      return
    }

    if (paymentSuccess !== 'true' || !paymentOrderId) {
      return
    }

    if (!authToken) {
      setVerifyingStripe(false)
      return
    }

    stripeHandledRef.current = true
    setVerifyingStripe(true)

    try {
      const response = await axios.post(
        backendUrl + '/api/order/verifyStripe',
        { success: paymentSuccess, orderId: paymentOrderId },
        { headers: { token: authToken } }
      )

      if (response.data.success) {
        setCartItems({})
        window.location.replace(`${window.location.origin}/#/orders`)
        return
      }

      toast.error(response.data.message || 'Payment verification failed')
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setVerifyingStripe(false)
      loadOrderData()
      navigate('/orders', { replace: true })
    }
  }

  useEffect(()=>{
    loadOrderData()
  },[authToken])

  useEffect(() => {
    verifyStripePayment()
  }, [authToken, paymentSuccess, paymentOrderId])

  return (
    <div className='border-t pt-16'>

        <div className='text-2xl'>
            <Title text1={'MY'} text2={'ORDERS'}/>
        </div>

        <div className='mt-6'>
            {loading || verifyingStripe ? (
              <div className='py-16 text-center text-gray-500'>
                {verifyingStripe ? 'Verifying payment and loading your orders...' : 'Loading your orders...'}
              </div>
            ) : orderData.length === 0 ? (
              <div className='rounded-2xl border border-dashed border-gray-300 py-16 text-center text-gray-500'>
                No orders found yet. Place an order to see it here.
              </div>
            ) : (
              orderData.map((item,index) => (
                <div key={index} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <div className='flex items-start gap-6 text-sm'>
                        <img
                          className='w-16 sm:w-20 object-cover rounded'
                          src={item?.image?.[0] || 'data:image/gif;base64,R0lGODlhAQABAAAAACw='}
                          alt={item?.name || 'Order item'}
                        />
                        <div>
                          <p className='sm:text-base font-medium'>{item?.name || 'Order item'}</p>
                          <div className='flex items-center gap-3 mt-1 text-base text-gray-700'>
                            <p>{currency}{item?.price || 0}</p>
                            <p>Quantity: {item?.quantity || 0}</p>
                            <p>Size: {item?.size || '-'}</p>
                          </div>
                          <p className='mt-1'>Date: <span className=' text-gray-400'>{item?.date ? new Date(item.date).toDateString() : '-'}</span></p>
                          <p className='mt-1'>Payment: <span className=' text-gray-400'>{item?.paymentMethod || '-'}</span></p>
                        </div>
                    </div>
                    <div className='md:w-1/2 flex justify-between'>
                        <div className='flex items-center gap-2'>
                            <p className='min-w-2 h-2 rounded-full bg-green-500'></p>
                            <p className='text-sm md:text-base'>{item?.status || '-'}</p>
                        </div>
                        <button onClick={loadOrderData} className='border px-4 py-2 text-sm font-medium rounded-sm'>Track Order</button>
                    </div>
                </div>
              ))
            )}
        </div>
    </div>
  )
}

export default Orders

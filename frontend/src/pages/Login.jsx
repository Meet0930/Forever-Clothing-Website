import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {

  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)

  const [name,setName] = useState('')
  const [password,setPasword] = useState('')
  const [email,setEmail] = useState('')

  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const onSubmitHandler = async (event) => {
      event.preventDefault();
      try {
        if (currentState === 'Sign Up') {
          
          const response = await axios.post(backendUrl + '/api/user/register',{name,email,password})
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token',response.data.token)
          } else {
            toast.error(response.data.message)
          }

        } else {

          const response = await axios.post(backendUrl + '/api/user/login', {email,password})
          if (response.data.success) {
            setToken(response.data.token)
            localStorage.setItem('token',response.data.token)
          } else {
            toast.error(response.data.message)
          }

        }


      } catch (error) {
        console.log(error)
        toast.error(error.message)
      }
  }

  const openForgotPassword = () => {
    setShowForgotPassword(true)
    setForgotStep('email')
    setForgotEmail(email)
    setForgotOtp('')
    setNewPassword('')
    setConfirmPassword('')
    setResetToken('')
  }

  const sendOtp = async () => {
    try {
      setForgotLoading(true)
      const response = await axios.post(backendUrl + '/api/user/forgot-password', {
        email: forgotEmail
      })

      if (response.data.success) {
        toast.success(response.data.message)
        setForgotStep('otp')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setForgotLoading(false)
    }
  }

  const requestOtp = async (event) => {
    event.preventDefault()
    await sendOtp()
  }

  const verifyOtp = async (event) => {
    event.preventDefault()

    try {
      setForgotLoading(true)
      const response = await axios.post(backendUrl + '/api/user/verify-forgot-password-otp', {
        email: forgotEmail,
        otp: forgotOtp
      })

      if (response.data.success) {
        toast.success(response.data.message)
        setResetToken(response.data.resetToken)
        setForgotStep('password')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setForgotLoading(false)
    }
  }

  const resetPassword = async (event) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setForgotLoading(true)
      const response = await axios.post(backendUrl + '/api/user/reset-password', {
        resetToken,
        password: newPassword,
        confirmPassword
      })

      if (response.data.success) {
        toast.success(response.data.message)
        setCurrentState('Login')
        setShowForgotPassword(false)
        setForgotStep('email')
        setForgotEmail('')
        setForgotOtp('')
        setNewPassword('')
        setConfirmPassword('')
        setResetToken('')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(()=>{
    if (token) {
      navigate('/')
    }
  },[token])

  return (
    <>
      <form onSubmit={onSubmitHandler} className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
          <div className='inline-flex items-center gap-2 mb-2 mt-10'>
              <p className='prata-regular text-3xl'>{currentState}</p>
              <hr className='border-none h-[1.5px] w-8 bg-gray-800' />
          </div>
          {currentState === 'Login' ? '' : <input onChange={(e)=>setName(e.target.value)} value={name} type="text" className='w-full px-3 py-2 border border-gray-800' placeholder='Name' required/>}
          <input onChange={(e)=>setEmail(e.target.value)} value={email} type="email" className='w-full px-3 py-2 border border-gray-800' placeholder='Email' required/>
          <input onChange={(e)=>setPasword(e.target.value)} value={password} type="password" className='w-full px-3 py-2 border border-gray-800' placeholder='Password' required/>
          <div className='w-full flex justify-between text-sm mt-[-8px]'>
              <p onClick={openForgotPassword} className='cursor-pointer hover:underline'>Forgot your password?</p>
              {
                currentState === 'Login'
                ? <p onClick={()=>setCurrentState('Sign Up')} className=' cursor-pointer'>Create account</p>
                : <p onClick={()=>setCurrentState('Login')} className=' cursor-pointer'>Login Here</p>
              }
          </div>
          <button className='bg-black text-white font-light px-8 py-2 mt-4'>{currentState === 'Login' ? 'Sign In' : 'Sign Up'}</button>
      </form>

      {showForgotPassword && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'>
            <div className='mb-5 flex items-center justify-between'>
              <div>
                <p className='text-lg font-semibold text-gray-900'>Reset Password</p>
                <p className='text-sm text-gray-500'>
                  {forgotStep === 'email'
                    ? 'We will send an OTP to your registered email.'
                    : forgotStep === 'otp'
                      ? 'Enter the OTP sent to your email.'
                      : 'Set your new password.'}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setShowForgotPassword(false)}
                className='text-xl leading-none text-gray-500 hover:text-gray-900'
              >
                ×
              </button>
            </div>

            {forgotStep === 'email' ? (
              <form onSubmit={requestOtp} className='space-y-4'>
                <input
                  type='email'
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black'
                  placeholder='Registered email'
                  required
                />
                <button
                  type='submit'
                  disabled={forgotLoading}
                  className='w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60'
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : forgotStep === 'otp' ? (
              <form onSubmit={verifyOtp} className='space-y-4'>
                <input
                  type='email'
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black'
                  placeholder='Email'
                  required
                />
                <input
                  type='text'
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black'
                  placeholder='6 digit OTP'
                  maxLength='6'
                  required
                />
                <button
                  type='submit'
                  disabled={forgotLoading}
                  className='w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60'
                >
                  {forgotLoading ? 'Verifying OTP...' : 'Verify OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={resetPassword} className='space-y-4'>
                <input
                  type='email'
                  value={forgotEmail}
                  readOnly
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black'
                  placeholder='Email'
                />
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black'
                  placeholder='New password'
                  required
                />
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black'
                  placeholder='Re-enter new password'
                  required
                />
                <button
                  type='submit'
                  disabled={forgotLoading}
                  className='w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60'
                >
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type='button'
                  onClick={async () => {
                    setForgotStep('otp')
                    setForgotOtp('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setResetToken('')
                    await sendOtp()
                  }}
                  disabled={forgotLoading}
                  className='w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 disabled:opacity-60'
                >
                  Resend OTP
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Login

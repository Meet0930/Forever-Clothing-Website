import nodemailer from 'nodemailer'

const env = process.env

const first = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '')

export const hasEmailTransportConfig = () => {
  const url = first(env.SMTP_URL, env.EMAIL_URL, env.MAIL_URL)
  const service = first(env.SMTP_SERVICE, env.EMAIL_SERVICE, env.MAIL_SERVICE)
  const host = first(env.SMTP_HOST, env.EMAIL_HOST, env.MAIL_HOST)
  const port = first(env.SMTP_PORT, env.EMAIL_PORT, env.MAIL_PORT)
  const user = first(
    env.SMTP_USER,
    env.SMTP_USERNAME,
    env.EMAIL_USER,
    env.EMAIL_USERNAME,
    env.MAIL_USER,
    env.MAIL_USERNAME
  )
  const pass = first(
    env.SMTP_PASS,
    env.SMTP_PASSWORD,
    env.EMAIL_PASS,
    env.EMAIL_PASSWORD,
    env.MAIL_PASS,
    env.MAIL_PASSWORD
  )

  return Boolean(url || (user && pass && (service || (host && port))))
}

const getTransporter = () => {
  if (hasEmailTransportConfig()) {
    const url = first(env.SMTP_URL, env.EMAIL_URL, env.MAIL_URL)
    const service = first(env.SMTP_SERVICE, env.EMAIL_SERVICE, env.MAIL_SERVICE)
    const host = first(env.SMTP_HOST, env.EMAIL_HOST, env.MAIL_HOST)
    const port = first(env.SMTP_PORT, env.EMAIL_PORT, env.MAIL_PORT)
    const user = first(
      env.SMTP_USER,
      env.SMTP_USERNAME,
      env.EMAIL_USER,
      env.EMAIL_USERNAME,
      env.MAIL_USER,
      env.MAIL_USERNAME
    )
    const pass = first(
      env.SMTP_PASS,
      env.SMTP_PASSWORD,
      env.EMAIL_PASS,
      env.EMAIL_PASSWORD,
      env.MAIL_PASS,
      env.MAIL_PASSWORD
    )

    if (url) {
      return nodemailer.createTransport(url)
    }

    if (service) {
      return nodemailer.createTransport({
        service,
        auth: {
          user,
          pass,
        },
      })
    }

    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    })
  }

  return nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  })
}

export const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter()
  const configured = hasEmailTransportConfig()
  const from = first(
    env.SMTP_FROM,
    env.EMAIL_FROM,
    env.MAIL_FROM,
    env.SMTP_USER,
    env.SMTP_USERNAME,
    env.EMAIL_USER,
    env.EMAIL_USERNAME,
    env.MAIL_USER,
    env.MAIL_USERNAME,
    'no-reply@localhost'
  )

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    })

    if (!configured) {
      console.warn(
        '[mailer] Email transport env vars are missing. Email was written to the development stream transport instead of being sent.'
      )
      console.warn('[mailer] Message preview:', info.message?.toString?.() ?? info.message)
    }

    return info
  } catch (error) {
    if (!configured) {
      console.warn('[mailer] Failed to send email, falling back to local preview:', error.message)

      const fallbackTransporter = nodemailer.createTransport({
        streamTransport: true,
        buffer: true,
        newline: 'unix',
      })

      const info = await fallbackTransporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
      })

      console.warn('[mailer] Message preview:', info.message?.toString?.() ?? info.message)
      return info
    }

    if (String(error.message).includes('535') || String(error.message).toLowerCase().includes('invalid login')) {
      throw new Error(
        'Gmail rejected the SMTP login. Use a Google App Password for SMTP_PASS and enable 2-Step Verification on the Gmail account.'
      )
    }

    throw new Error(`Failed to send email via SMTP: ${error.message}`)
  }
}

import app, { initBackend } from './app.js'
const port = process.env.PORT || 4000
const host = process.env.HOST || '0.0.0.0'

await initBackend()
app.listen(port, host, ()=> console.log('Server started on '+ host + ':' + port))

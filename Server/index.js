import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import dns from 'node:dns'
import cookieParser from 'cookie-parser'
import userRouter  from './routes/User.routes.js'
import contentRouter from './routes/Content.routes.js'

dns.setServers([
  '8.8.8.8',
  '[2001:4860:4860::8888]',
  '8.8.8.8:1053',
  '[2001:4860:4860::8888]:1053',
]);
dotenv.config()

const app = express()


app.use(cors())
app.use(express.json())
app.use(cookieParser())
app.use('/user', userRouter)
app.use('/content', contentRouter)


// Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
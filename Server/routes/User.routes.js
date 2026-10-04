import express from 'express'
import { getMe, loginUser, registerUser } from '../Controllers/User.controller.js'
import { isAuthenticated } from '../middleware/auth.middleware.js'

const userRouter = express.Router()

userRouter.post('/registerUser', registerUser)
userRouter.post('/loginUser', loginUser)
userRouter.get('/me',isAuthenticated, getMe)

export default userRouter

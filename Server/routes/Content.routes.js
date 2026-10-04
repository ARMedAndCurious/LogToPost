import express from 'express'
import { isAuthenticated } from '../middleware/auth.middleware.js'
import { approveContent, createPost, getUserContent } from '../Controllers/Content.controller.js'
import multer from 'multer'

const contentRouter = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

contentRouter.post('/', isAuthenticated, upload.single('image'), createPost)
contentRouter.post('/approve', isAuthenticated, approveContent)
contentRouter.get('/history', isAuthenticated, getUserContent)
export default contentRouter
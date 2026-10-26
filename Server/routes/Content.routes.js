import express from 'express'
import { isAuthenticated } from '../middleware/auth.middleware.js'
import { approveContent, createPost, getUserContent, transcribeAudio } from '../Controllers/Content.controller.js'
import multer from 'multer'

const contentRouter = express.Router()
const upload = multer({ storage: multer.memoryStorage() })
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }   // 10 MB is plenty for a voice note
})

contentRouter.post('/', isAuthenticated, upload.single('image'), createPost)
contentRouter.post('/approve', isAuthenticated, approveContent)
contentRouter.get('/history', isAuthenticated, getUserContent)
contentRouter.post('/transcribe', isAuthenticated, audioUpload.single('audio'), transcribeAudio)
export default contentRouter
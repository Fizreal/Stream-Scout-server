import express from 'express'
import { Login, Register, CheckSession } from '../controllers/authentication.js'
import { stripToken, verifyToken } from '../middleware/index.js'
const router = express.Router()

router.post('/login', Login)
router.post('/register', Register)

export default router

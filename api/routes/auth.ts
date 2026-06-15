import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { JWT_SECRET } from '../middleware/auth.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const { phone, password, name } = req.body

  if (!phone || !password || !name) {
    res.status(400).json({ success: false, error: '请填写完整信息' })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
  if (existing) {
    res.status(400).json({ success: false, error: '该手机号已注册' })
    return
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const result = db.prepare(
    'INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)'
  ).run(phone, hashedPassword, name, 'owner')

  const token = jwt.sign(
    { id: result.lastInsertRowid, role: 'owner', name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    success: true,
    data: {
      token,
      user: { id: result.lastInsertRowid, phone, name, role: 'owner' },
    },
  })
})

router.post('/login', (req: Request, res: Response): void => {
  const { phone, password } = req.body

  if (!phone || !password) {
    res.status(400).json({ success: false, error: '请填写手机号和密码' })
    return
  }

  const user = db.prepare(
    'SELECT id, phone, password, name, role FROM users WHERE phone = ?'
  ).get(phone) as { id: number; phone: string; password: string; name: string; role: string } | undefined

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(400).json({ success: false, error: '手机号或密码错误' })
    return
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
    },
  })
})

export default router

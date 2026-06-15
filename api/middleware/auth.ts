import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'pet-hospital-secret-2024'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        role: string
        name: string
      }
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number
      role: string
      name: string
    }
    req.user = { id: decoded.id, role: decoded.role, name: decoded.name }
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Token无效或已过期' })
  }
}

export { JWT_SECRET }

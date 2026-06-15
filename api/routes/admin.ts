import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.use(auth, (req: Request, res: Response, next) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: '无权访问' })
    return
  }
  next()
})

router.get('/stats', (_req: Request, res: Response): void => {
  const today = new Date().toISOString().split('T')[0]

  const todayCount = (db.prepare(
    `SELECT COUNT(*) as count FROM appointments WHERE date = ?`
  ).get(today) as any).count

  const weekDates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    weekDates.push(d.toISOString().split('T')[0])
  }

  const weekTrend = weekDates.map(date => {
    const count = (db.prepare(
      `SELECT COUNT(*) as count FROM appointments WHERE date = ?`
    ).get(date) as any).count
    return { date, count }
  })

  const departmentStats = db.prepare(
    `SELECT dept.id, dept.name, COUNT(a.id) as count
     FROM departments dept
     LEFT JOIN appointments a ON dept.id = a.department_id
     GROUP BY dept.id
     ORDER BY count DESC`
  ).all()

  const doctorWorkload = db.prepare(
    `SELECT d.id, u.name, d.title, COUNT(a.id) as count
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     LEFT JOIN appointments a ON d.id = a.doctor_id
     GROUP BY d.id
     ORDER BY count DESC`
  ).all()

  const topDepartments = db.prepare(
    `SELECT dept.id, dept.name, COUNT(a.id) as count
     FROM departments dept
     LEFT JOIN appointments a ON dept.id = a.department_id
     GROUP BY dept.id
     ORDER BY count DESC`
  ).all()

  res.json({
    success: true,
    data: {
      todayCount,
      weekTrend,
      departmentStats,
      doctorWorkload,
      topDepartments,
    },
  })
})

router.get('/schedules', (req: Request, res: Response): void => {
  const { doctorId, weekStart } = req.query

  let sql = `SELECT s.*, u.name as doctor_name, d.title as doctor_title
             FROM schedules s
             JOIN doctors d ON s.doctor_id = d.id
             JOIN users u ON d.user_id = u.id
             WHERE 1=1`
  const params: any[] = []

  if (doctorId) {
    sql += ' AND s.doctor_id = ?'
    params.push(doctorId)
  }

  if (weekStart) {
    const endDate = new Date(weekStart as string)
    endDate.setDate(endDate.getDate() + 6)
    sql += ' AND s.date >= ? AND s.date <= ?'
    params.push(weekStart, endDate.toISOString().split('T')[0])
  }

  sql += ' ORDER BY s.date, s.time_slot'

  const schedules = db.prepare(sql).all(...params)
  res.json({ success: true, data: schedules })
})

router.post('/schedules', (req: Request, res: Response): void => {
  const { doctorId, date, slots } = req.body

  if (!doctorId || !date || !slots || !Array.isArray(slots)) {
    res.status(400).json({ success: false, error: '请填写完整排班信息' })
    return
  }

  db.transaction(() => {
    const upsert = db.prepare(
      `INSERT OR REPLACE INTO schedules (doctor_id, date, time_slot, capacity) VALUES (?, ?, ?, ?)`
    )
    for (const slot of slots) {
      if (slot.time && slot.capacity) {
        upsert.run(doctorId, date, slot.time, slot.capacity)
      }
    }
  })()

  const schedules = db.prepare(
    'SELECT * FROM schedules WHERE doctor_id = ? AND date = ? ORDER BY time_slot'
  ).all(doctorId, date)

  res.json({ success: true, data: schedules })
})

export default router

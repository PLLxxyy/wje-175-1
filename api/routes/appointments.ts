import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/departments', (_req: Request, res: Response): void => {
  const departments = db.prepare('SELECT * FROM departments').all()
  res.json({ success: true, data: departments })
})

router.get('/departments/:id/doctors', (req: Request, res: Response): void => {
  const deptId = req.params.id
  const doctors = db.prepare(
    `SELECT d.id, d.title, d.avatar, u.name, dept.name as department_name
     FROM doctors d
     JOIN users u ON d.user_id = u.id
     JOIN departments dept ON d.department_id = dept.id
     WHERE d.department_id = ?`
  ).all(deptId) as any[]

  const doctorsWithRating = doctors.map(doc => {
    const stats = db.prepare(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
       FROM reviews WHERE doctor_id = ?`
    ).get(doc.id) as { avg_rating: number | null; review_count: number }
    return {
      ...doc,
      avg_rating: stats.avg_rating ? Number(stats.avg_rating.toFixed(1)) : null,
      review_count: stats.review_count || 0,
    }
  })

  res.json({ success: true, data: doctorsWithRating })
})

router.get('/doctors/:id/slots', (req: Request, res: Response): void => {
  const doctorId = req.params.id
  const date = req.query.date as string

  if (!date) {
    res.status(400).json({ success: false, error: '请提供日期参数' })
    return
  }

  const schedules = db.prepare(
    'SELECT * FROM schedules WHERE doctor_id = ? AND date = ?'
  ).all(doctorId, date) as any[]

  const slots = schedules.map(s => {
    const booked = db.prepare(
      `SELECT COUNT(*) as count FROM appointments
       WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status != 'cancelled'`
    ).get(doctorId, date, s.time_slot) as { count: number }

    return {
      time_slot: s.time_slot,
      capacity: s.capacity,
      booked: booked.count,
      remaining: s.capacity - booked.count,
    }
  })

  res.json({ success: true, data: slots })
})

router.post('/', auth, (req: Request, res: Response): void => {
  const { pet_id, doctor_id, department_id, date, time_slot } = req.body

  if (!pet_id || !doctor_id || !department_id || !date || !time_slot) {
    res.status(400).json({ success: false, error: '请填写完整预约信息' })
    return
  }

  const pet = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(pet_id, req.user!.id)
  if (!pet) {
    res.status(400).json({ success: false, error: '宠物不存在' })
    return
  }

  const schedule = db.prepare(
    'SELECT * FROM schedules WHERE doctor_id = ? AND date = ? AND time_slot = ?'
  ).get(doctor_id, date, time_slot) as any

  if (!schedule) {
    res.status(400).json({ success: false, error: '该时段不可预约' })
    return
  }

  const booked = db.prepare(
    `SELECT COUNT(*) as count FROM appointments
     WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status != 'cancelled'`
  ).get(doctor_id, date, time_slot) as { count: number }

  if (booked.count >= schedule.capacity) {
    res.status(400).json({ success: false, error: '该时段已满' })
    return
  }

  const existing = db.prepare(
    `SELECT id FROM appointments
     WHERE pet_id = ? AND doctor_id = ? AND date = ? AND time_slot = ? AND status != 'cancelled'`
  ).get(pet_id, doctor_id, date, time_slot)

  if (existing) {
    res.status(400).json({ success: false, error: '该宠物已在此时段预约' })
    return
  }

  const maxQueue = db.prepare(
    `SELECT MAX(queue_number) as max_q FROM appointments
     WHERE doctor_id = ? AND date = ? AND status != 'cancelled'`
  ).get(doctor_id, date) as { max_q: number | null }

  const queueNumber = (maxQueue.max_q || 0) + 1

  const result = db.prepare(
    `INSERT INTO appointments (pet_id, doctor_id, department_id, owner_id, date, time_slot, queue_number)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(pet_id, doctor_id, department_id, req.user!.id, date, time_slot, queueNumber)

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid) as any

  res.json({
    success: true,
    data: {
      ...appointment,
      estimated_wait: queueNumber * 15,
    },
  })
})

router.get('/', auth, (req: Request, res: Response): void => {
  const appointments = db.prepare(
    `SELECT a.*, p.name as pet_name, p.breed as pet_breed, dept.name as department_name, u.name as doctor_name, d.title as doctor_title
     FROM appointments a
     JOIN pets p ON a.pet_id = p.id
     JOIN departments dept ON a.department_id = dept.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE a.owner_id = ?
     ORDER BY a.date DESC, a.time_slot DESC`
  ).all(req.user!.id)

  res.json({ success: true, data: appointments })
})

router.get('/mine', auth, (req: Request, res: Response): void => {
  const appointments = db.prepare(
    `SELECT a.*, p.name as pet_name, p.breed as pet_breed, dept.name as department_name, u.name as doctor_name, d.title as doctor_title
     FROM appointments a
     JOIN pets p ON a.pet_id = p.id
     JOIN departments dept ON a.department_id = dept.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE a.owner_id = ?
     ORDER BY a.date DESC, a.time_slot DESC`
  ).all(req.user!.id)

  res.json({ success: true, data: appointments })
})

router.put('/:id/status', auth, (req: Request, res: Response): void => {
  const { status } = req.body
  const appointmentId = Number(req.params.id)

  const appointment = db.prepare(
    'SELECT * FROM appointments WHERE id = ? AND owner_id = ?'
  ).get(appointmentId, req.user!.id) as any

  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }

  if (status === 'cancelled' && appointment.status !== 'waiting') {
    res.status(400).json({ success: false, error: '只能取消候诊中的预约' })
    return
  }

  if (!['cancelled'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态' })
    return
  }

  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, appointmentId)

  res.json({ success: true, data: { id: appointmentId, status } })
})

router.get('/:id', auth, (req: Request, res: Response): void => {
  const appointment = db.prepare(
    `SELECT a.*, p.name as pet_name, p.breed as pet_breed, p.age as pet_age, p.weight as pet_weight, dept.name as department_name, u.name as doctor_name, d.title as doctor_title
     FROM appointments a
     JOIN pets p ON a.pet_id = p.id
     JOIN departments dept ON a.department_id = dept.id
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE a.id = ?`
  ).get(req.params.id)

  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }

  res.json({ success: true, data: appointment })
})

export default router

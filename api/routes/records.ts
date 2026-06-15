import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.use(auth)

router.get('/pet/:petId', (req: Request, res: Response): void => {
  const petId = req.params.petId

  const pet = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(petId, req.user!.id)
  if (!pet) {
    res.status(404).json({ success: false, error: '宠物不存在' })
    return
  }

  const records = db.prepare(
    `SELECT mr.*, u.name as doctor_name, d.title as doctor_title,
            a.date as appointment_date, a.time_slot as appointment_time_slot,
            a.status as appointment_status
     FROM medical_records mr
     JOIN appointments a ON mr.appointment_id = a.id
     JOIN doctors d ON mr.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE a.pet_id = ?
     ORDER BY mr.created_at DESC`
  ).all(petId) as any[]

  const recordsWithReviews = records.map(r => {
    const review = db.prepare(
      'SELECT * FROM reviews WHERE appointment_id = ?'
    ).get(r.appointment_id)
    return { ...r, review: review || null }
  })

  res.json({ success: true, data: recordsWithReviews })
})

router.post('/:appointmentId/review', (req: Request, res: Response): void => {
  const appointmentId = Number(req.params.appointmentId)
  const { rating, comment } = req.body

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, error: '请选择有效的评分(1-5星)' })
    return
  }

  const appointment = db.prepare(
    'SELECT * FROM appointments WHERE id = ? AND owner_id = ?'
  ).get(appointmentId, req.user!.id) as any

  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }

  if (appointment.status !== 'completed') {
    res.status(400).json({ success: false, error: '只能评价已完成的就诊' })
    return
  }

  const existing = db.prepare(
    'SELECT * FROM reviews WHERE appointment_id = ?'
  ).get(appointmentId)

  if (existing) {
    db.prepare(
      'UPDATE reviews SET rating = ?, comment = ? WHERE appointment_id = ?'
    ).run(rating, comment || '', appointmentId)
    const updated = db.prepare('SELECT * FROM reviews WHERE appointment_id = ?').get(appointmentId)
    res.json({ success: true, data: updated })
    return
  }

  const result = db.prepare(
    `INSERT INTO reviews (appointment_id, doctor_id, owner_id, rating, comment)
     VALUES (?, ?, ?, ?, ?)`
  ).run(appointmentId, appointment.doctor_id, req.user!.id, rating, comment || '')

  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: review })
})

router.get('/:appointmentId/review', (req: Request, res: Response): void => {
  const appointmentId = Number(req.params.appointmentId)

  const appointment = db.prepare(
    'SELECT * FROM appointments WHERE id = ?'
  ).get(appointmentId) as any

  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }

  if (appointment.owner_id !== req.user!.id && req.user!.role !== 'doctor' && req.user!.role !== 'admin') {
    res.status(403).json({ success: false, error: '无权访问' })
    return
  }

  const review = db.prepare(
    'SELECT * FROM reviews WHERE appointment_id = ?'
  ).get(appointmentId)

  res.json({ success: true, data: review || null })
})

export default router

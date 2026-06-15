import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.use(auth)

router.get('/appointments', (req: Request, res: Response): void => {
  if (req.user!.role !== 'doctor') {
    res.status(403).json({ success: false, error: '无权访问' })
    return
  }

  const doctor = db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(req.user!.id) as any
  if (!doctor) {
    res.status(404).json({ success: false, error: '医生信息不存在' })
    return
  }

  const today = new Date().toISOString().split('T')[0]

  const appointments = db.prepare(
    `SELECT a.*, p.name as pet_name, p.breed as pet_breed, p.age as pet_age, p.weight as pet_weight,
            u.name as owner_name, u.phone as owner_phone
     FROM appointments a
     JOIN pets p ON a.pet_id = p.id
     JOIN users u ON a.owner_id = u.id
     WHERE a.doctor_id = ? AND a.date = ?
     ORDER BY a.queue_number`
  ).all(doctor.id, today)

  res.json({ success: true, data: appointments })
})

router.put('/appointments/:id/status', (req: Request, res: Response): void => {
  if (req.user!.role !== 'doctor') {
    res.status(403).json({ success: false, error: '无权访问' })
    return
  }

  const { status } = req.body
  if (!['in_progress', 'completed'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的状态' })
    return
  }

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id)
  if (!appointment) {
    res.status(404).json({ success: false, error: '预约不存在' })
    return
  }

  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id)

  res.json({ success: true, data: { id: req.params.id, status } })
})

router.get('/appointments/:id/record', (req: Request, res: Response): void => {
  if (req.user!.role !== 'doctor') {
    res.status(403).json({ success: false, error: '无权访问' })
    return
  }

  const record = db.prepare(
    'SELECT * FROM medical_records WHERE appointment_id = ?'
  ).get(req.params.id)

  if (!record) {
    res.json({ success: true, data: null })
    return
  }

  res.json({ success: true, data: record })
})

router.post('/appointments/:id/record', (req: Request, res: Response): void => {
  if (req.user!.role !== 'doctor') {
    res.status(403).json({ success: false, error: '无权访问' })
    return
  }

  const { diagnosis, prescription, advice, follow_up_date } = req.body

  if (!diagnosis || !prescription) {
    res.status(400).json({ success: false, error: '请填写诊断和处方' })
    return
  }

  const doctor = db.prepare('SELECT * FROM doctors WHERE user_id = ?').get(req.user!.id) as any
  if (!doctor) {
    res.status(404).json({ success: false, error: '医生信息不存在' })
    return
  }

  const existing = db.prepare(
    'SELECT * FROM medical_records WHERE appointment_id = ?'
  ).get(req.params.id)

  if (existing) {
    db.prepare(
      `UPDATE medical_records SET diagnosis = ?, prescription = ?, advice = ?, follow_up_date = ? WHERE appointment_id = ?`
    ).run(diagnosis, typeof prescription === 'object' ? JSON.stringify(prescription) : prescription, advice || null, follow_up_date || null, req.params.id)

    const updated = db.prepare('SELECT * FROM medical_records WHERE appointment_id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
    return
  }

  const result = db.prepare(
    `INSERT INTO medical_records (appointment_id, doctor_id, diagnosis, prescription, advice, follow_up_date)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    Number(req.params.id),
    doctor.id,
    diagnosis,
    typeof prescription === 'object' ? JSON.stringify(prescription) : prescription,
    advice || null,
    follow_up_date || null,
  )

  const record = db.prepare('SELECT * FROM medical_records WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: record })
})

export default router

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
            a.date as appointment_date, a.time_slot as appointment_time_slot
     FROM medical_records mr
     JOIN appointments a ON mr.appointment_id = a.id
     JOIN doctors d ON mr.doctor_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE a.pet_id = ?
     ORDER BY mr.created_at DESC`
  ).all(petId)

  res.json({ success: true, data: records })
})

export default router

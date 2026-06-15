import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.use(auth)

router.get('/', (req: Request, res: Response): void => {
  const ownerId = req.user!.id
  const reminders: any[] = []

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0]

  const sevenDaysLater = new Date()
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0]

  const expiringVaccines = db.prepare(
    `SELECT v.*, p.name as pet_name
     FROM vaccines v
     JOIN pets p ON v.pet_id = p.id
     WHERE p.owner_id = ? AND v.expiry_date BETWEEN ? AND ?
     ORDER BY v.expiry_date`
  ).all(ownerId, today, thirtyDaysLaterStr) as any[]

  for (const v of expiringVaccines) {
    const daysLeft = Math.ceil(
      (new Date(v.expiry_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    reminders.push({
      type: 'vaccine_expiry',
      petName: v.pet_name,
      vaccineName: v.name,
      expiryDate: v.expiry_date,
      daysLeft,
    })
  }

  const followUps = db.prepare(
    `SELECT mr.*, p.name as pet_name, a.id as appointment_id
     FROM medical_records mr
     JOIN appointments a ON mr.appointment_id = a.id
     JOIN pets p ON a.pet_id = p.id
     WHERE a.owner_id = ? AND mr.follow_up_date BETWEEN ? AND ?
     ORDER BY mr.follow_up_date`
  ).all(ownerId, today, sevenDaysLaterStr) as any[]

  for (const f of followUps) {
    const daysLeft = Math.ceil(
      (new Date(f.follow_up_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    reminders.push({
      type: 'follow_up',
      petName: f.pet_name,
      followUpDate: f.follow_up_date,
      daysLeft,
    })
  }

  reminders.sort((a, b) => a.daysLeft - b.daysLeft)

  res.json({ success: true, data: reminders })
})

export default router

import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.use(auth)

router.get('/', (req: Request, res: Response): void => {
  const pets = db.prepare(
    'SELECT * FROM pets WHERE owner_id = ? ORDER BY created_at DESC'
  ).all(req.user!.id)

  for (const pet of pets as any[]) {
    pet.vaccines = db.prepare(
      'SELECT * FROM vaccines WHERE pet_id = ?'
    ).all(pet.id)
  }

  res.json({ success: true, data: pets })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, breed, age, weight, sterilized, avatar, vaccines } = req.body

  if (!name || !breed || age == null || weight == null) {
    res.status(400).json({ success: false, error: '请填写完整宠物信息' })
    return
  }

  const result = db.transaction(() => {
    const petResult = db.prepare(
      'INSERT INTO pets (owner_id, name, breed, age, weight, sterilized, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, name, breed, age, weight, sterilized || 0, avatar || null)

    const petId = Number(petResult.lastInsertRowid)

    const insertedVaccines: any[] = []
    if (vaccines && Array.isArray(vaccines)) {
      const insertVaccine = db.prepare(
        'INSERT INTO vaccines (pet_id, name, date, expiry_date) VALUES (?, ?, ?, ?)'
      )
      for (const v of vaccines) {
        if (v.name && v.date && v.expiry_date) {
          const vResult = insertVaccine.run(petId, v.name, v.date, v.expiry_date)
          insertedVaccines.push({ id: vResult.lastInsertRowid, pet_id: petId, ...v })
        }
      }
    }

    return { id: petId, owner_id: req.user!.id, name, breed, age, weight, sterilized: sterilized || 0, avatar: avatar || null, vaccines: insertedVaccines }
  })()

  res.json({ success: true, data: result })
})

router.put('/:id', (req: Request, res: Response): void => {
  const petId = Number(req.params.id)
  const { name, breed, age, weight, sterilized, avatar, vaccines } = req.body

  const pet = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(petId, req.user!.id) as any
  if (!pet) {
    res.status(404).json({ success: false, error: '宠物不存在' })
    return
  }

  const result = db.transaction(() => {
    db.prepare(
      'UPDATE pets SET name = ?, breed = ?, age = ?, weight = ?, sterilized = ?, avatar = ? WHERE id = ?'
    ).run(name ?? pet.name, breed ?? pet.breed, age ?? pet.age, weight ?? pet.weight, sterilized ?? pet.sterilized, avatar ?? pet.avatar, petId)

    if (vaccines && Array.isArray(vaccines)) {
      db.prepare('DELETE FROM vaccines WHERE pet_id = ?').run(petId)
      const insertVaccine = db.prepare(
        'INSERT INTO vaccines (pet_id, name, date, expiry_date) VALUES (?, ?, ?, ?)'
      )
      for (const v of vaccines) {
        if (v.name && v.date && v.expiry_date) {
          insertVaccine.run(petId, v.name, v.date, v.expiry_date)
        }
      }
    }

    return db.prepare('SELECT * FROM pets WHERE id = ?').get(petId)
  })()

  const updatedPet = result as any
  updatedPet.vaccines = db.prepare('SELECT * FROM vaccines WHERE pet_id = ?').all(petId)

  res.json({ success: true, data: updatedPet })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const petId = Number(req.params.id)

  const pet = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(petId, req.user!.id) as any
  if (!pet) {
    res.status(404).json({ success: false, error: '宠物不存在' })
    return
  }

  db.prepare('DELETE FROM pets WHERE id = ?').run(petId)

  res.json({ success: true, data: null })
})

export default router

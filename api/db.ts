import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const dbDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'pet-hospital.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner', 'doctor', 'admin')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    age INTEGER NOT NULL,
    weight REAL NOT NULL,
    sterilized INTEGER DEFAULT 0,
    avatar TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vaccines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    expiry_date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    department_id INTEGER NOT NULL REFERENCES departments(id),
    title TEXT,
    avatar TEXT
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    capacity INTEGER DEFAULT 10
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id INTEGER NOT NULL REFERENCES pets(id),
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    department_id INTEGER NOT NULL REFERENCES departments(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    queue_number INTEGER NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL REFERENCES appointments(id),
    doctor_id INTEGER NOT NULL REFERENCES doctors(id),
    diagnosis TEXT NOT NULL,
    prescription TEXT NOT NULL,
    advice TEXT,
    follow_up_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)'
  )
  const insertDepartment = db.prepare(
    'INSERT INTO departments (name, icon) VALUES (?, ?)'
  )
  const insertDoctor = db.prepare(
    'INSERT INTO doctors (user_id, department_id, title, avatar) VALUES (?, ?, ?, ?)'
  )
  const insertSchedule = db.prepare(
    'INSERT INTO schedules (doctor_id, date, time_slot, capacity) VALUES (?, ?, ?, ?)'
  )

  const departments = [
    { name: '内科', icon: '🩺' },
    { name: '外科', icon: '🔪' },
    { name: '皮肤科', icon: '🧴' },
    { name: '牙科', icon: '🦷' },
  ]

  const doctors = [
    { phone: '13800000001', name: '张医生', title: '主任医师' },
    { phone: '13800000002', name: '李医生', title: '副主任医师' },
    { phone: '13800000003', name: '王医生', title: '主治医师' },
    { phone: '13800000004', name: '赵医生', title: '主治医师' },
  ]

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  ]

  const seed = db.transaction(() => {
    insertUser.run('admin', bcrypt.hashSync('admin123', 10), '管理员', 'admin')

    const deptIds: number[] = []
    for (const dept of departments) {
      const result = insertDepartment.run(dept.name, dept.icon)
      deptIds.push(Number(result.lastInsertRowid))
    }

    const doctorIds: number[] = []
    for (let i = 0; i < doctors.length; i++) {
      const result = insertUser.run(doctors[i].phone, bcrypt.hashSync('123456', 10), doctors[i].name, 'doctor')
      const userId = Number(result.lastInsertRowid)
      const deptId = deptIds[i]
      const docResult = insertDoctor.run(userId, deptId, doctors[i].title, null)
      doctorIds.push(Number(docResult.lastInsertRowid))
    }

    const today = new Date()
    for (let d = 0; d < 8; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() + d)
      const dateStr = date.toISOString().split('T')[0]
      for (const doctorId of doctorIds) {
        for (const slot of timeSlots) {
          insertSchedule.run(doctorId, dateStr, slot, 5)
        }
      }
    }
  })

  seed()
}

export default db

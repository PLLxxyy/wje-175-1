export interface User {
  id: number;
  phone: string;
  name: string;
  role: 'owner' | 'doctor' | 'admin';
}

export interface Pet {
  id: number;
  owner_id: number;
  name: string;
  breed: string;
  age: number;
  weight: number;
  sterilized: boolean;
  avatar?: string;
  created_at: string;
  vaccines?: Vaccine[];
}

export interface Vaccine {
  id: number;
  pet_id: number;
  name: string;
  date: string;
  expiry_date: string;
}

export interface Department {
  id: number;
  name: string;
  icon: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  name: string;
  title: string;
  department_id: number;
  department_name?: string;
  avatar?: string;
  avg_rating?: number;
  review_count?: number;
}

export interface TimeSlot {
  time_slot: string;
  capacity: number;
  booked: number;
  remaining: number;
  available?: boolean;
}

export interface Appointment {
  id: number;
  pet_id: number;
  doctor_id: number;
  department_id: number;
  owner_id: number;
  date: string;
  time_slot: string;
  queue_number: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  estimated_wait: string;
  created_at: string;
  pet?: Pet;
  department?: Department;
  doctor?: Doctor;
  record?: MedicalRecord;
}

export interface Review {
  id: number;
  appointment_id: number;
  doctor_id: number;
  owner_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface MedicalRecord {
  id: number;
  appointment_id: number;
  doctor_id: number;
  diagnosis: string;
  prescription: string;
  advice: string;
  follow_up_date?: string;
  created_at: string;
  doctor_name?: string;
  doctor_title?: string;
  appointment_date?: string;
  appointment_time_slot?: string;
  appointment_status?: string;
  review?: Review;
}

export interface Reminder {
  id: string;
  pet_id: number;
  pet_name: string;
  type: 'vaccine_expiry' | 'follow_up';
  title: string;
  due_date: string;
  days_left: number;
}

export interface ScheduleSlot {
  time: string;
  capacity: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface DepartmentStat {
  department_id: number;
  name: string;
  count: number;
}

export interface DoctorWorkload {
  doctor_id: number;
  name: string;
  appointment_count: number;
}

export interface AdminStats {
  todayCount: number;
  weekTrend: DailyCount[];
  departmentStats: DepartmentStat[];
  doctorWorkload: DoctorWorkload[];
  topDepartments: DepartmentStat[];
}

export interface PrescriptionItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
}

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from '@/store'
import OwnerLayout from '@/components/OwnerLayout'
import DoctorLayout from '@/components/DoctorLayout'
import AdminLayout from '@/components/AdminLayout'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import PetList from '@/pages/PetList'
import PetEdit from '@/pages/PetEdit'
import AppointmentDepartment from '@/pages/AppointmentDepartment'
import AppointmentDoctor from '@/pages/AppointmentDoctor'
import AppointmentSlot from '@/pages/AppointmentSlot'
import AppointmentConfirm from '@/pages/AppointmentConfirm'
import AppointmentDetail from '@/pages/AppointmentDetail'
import ProfileCenter from '@/pages/ProfileCenter'
import MedicalRecords from '@/pages/MedicalRecords'
import Reminders from '@/pages/Reminders'
import DoctorWorkbench from '@/pages/DoctorWorkbench'
import DoctorPatientDetail from '@/pages/DoctorPatientDetail'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminSchedule from '@/pages/AdminSchedule'
import AdminSettings from '@/pages/AdminSettings'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    } else if (roles && !roles.includes(user.role)) {
      const homeMap: Record<string, string> = { owner: '/pets', doctor: '/doctor', admin: '/admin' }
      navigate(homeMap[user.role] || '/login', { replace: true })
    }
  }, [user, roles, navigate])

  if (!user) return null
  if (roles && !roles.includes(user.role)) return null
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />

        <Route element={<ProtectedRoute roles={['owner']}><OwnerLayout /></ProtectedRoute>}>
          <Route path="/pets" element={<PetList />} />
          <Route path="/pets/new" element={<PetEdit />} />
          <Route path="/pets/:id/edit" element={<PetEdit />} />
          <Route path="/appointment" element={<AppointmentDepartment />} />
          <Route path="/appointment/doctor" element={<AppointmentDoctor />} />
          <Route path="/appointment/slot" element={<AppointmentSlot />} />
          <Route path="/appointment/confirm" element={<AppointmentConfirm />} />
          <Route path="/appointment/:id" element={<AppointmentDetail />} />
          <Route path="/profile" element={<ProfileCenter />} />
          <Route path="/profile/records" element={<MedicalRecords />} />
          <Route path="/profile/reminders" element={<Reminders />} />
        </Route>

        <Route element={<ProtectedRoute roles={['doctor']}><DoctorLayout /></ProtectedRoute>}>
          <Route path="/doctor" element={<DoctorWorkbench />} />
          <Route path="/doctor/appointment/:id" element={<DoctorPatientDetail />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/schedule" element={<AdminSchedule />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

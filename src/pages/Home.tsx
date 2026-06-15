import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store'

const roleHomeMap: Record<string, string> = {
  owner: '/pets',
  doctor: '/doctor',
  admin: '/admin',
}

export default function Home() {
  const { user } = useAppStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate(roleHomeMap[user.role] || '/pets', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  return null
}

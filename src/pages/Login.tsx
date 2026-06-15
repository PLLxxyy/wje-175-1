import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Phone, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '@/store'
import { api } from '@/utils/api'
import type { User as UserType } from '@shared/types'

type Tab = 'login' | 'register'

interface AuthResponse {
  token: string
  user: UserType
}

const roleHomeMap: Record<string, string> = {
  owner: '/pets',
  doctor: '/doctor',
  admin: '/admin',
}

export default function Login() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  )
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { setUser } = useAppStore()
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!phone || !password) {
      setError('请填写手机号和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post<AuthResponse>('/auth/login', { phone, password })
      setUser(res.user, res.token)
      navigate(roleHomeMap[res.user.role] || '/pets')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      setError('请填写完整信息')
      return
    }
    if (password !== confirmPwd) {
      setError('两次密码输入不一致')
      return
    }
    if (password.length < 6) {
      setError('密码至少6位')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post<AuthResponse>('/auth/register', {
        name,
        phone,
        password,
      })
      setUser(res.user, res.token)
      navigate('/pets')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    tab === 'login' ? handleLogin() : handleRegister()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden px-4">
      <div className="absolute top-16 left-12 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-20 right-16 w-32 h-32 rounded-full bg-secondary/10 blur-2xl" />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-accent/20 blur-xl" />
      <div className="absolute bottom-1/3 left-1/4 text-4xl opacity-10 select-none">🐾</div>
      <div className="absolute top-1/4 left-1/6 text-2xl opacity-10 select-none">🐾</div>
      <div className="absolute bottom-1/4 right-1/6 text-3xl opacity-10 select-none rotate-45">🐾</div>

      <div className="bg-surface rounded-3xl shadow-xl p-8 w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="font-display text-2xl font-bold text-text">宠医在线</h1>
          <p className="text-text-light text-sm mt-1">宠物医院智能挂号平台</p>
        </div>

        <div className="flex bg-background rounded-xl p-1 mb-6">
          <button
            onClick={() => { setTab('login'); setError('') }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'login'
                ? 'bg-surface shadow-sm text-primary'
                : 'text-text-light'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setTab('register'); setError('') }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              tab === 'register'
                ? 'bg-surface shadow-sm text-primary'
                : 'text-text-light'
            }`}
          >
            注册
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="text"
                placeholder="您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          )}

          <div className="relative">
            <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-light hover:text-text"
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {tab === 'register' && (
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="确认密码"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '请稍候...' : tab === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}

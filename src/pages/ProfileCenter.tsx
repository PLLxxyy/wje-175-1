import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, PawPrint, Calendar, Bell, FileText, ChevronRight } from 'lucide-react';
import { api } from '@/utils/api';
import { useAppStore } from '@/store';
import { formatDate, formatTime, getStatusText, getStatusColor } from '@/utils/helpers';
import type { Pet, Appointment, Reminder } from '@shared/types';

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text">{value}</p>
        <p className="text-xs text-text-light">{label}</p>
      </div>
    </div>
  );
}

export default function ProfileCenter() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [petsData, appointmentsData, remindersData] = await Promise.all([
          api.get<Pet[]>('/pets').catch(() => []),
          api.get<Appointment[]>('/appointments').catch(() => []),
          api.get<Reminder[]>('/reminders').catch(() => []),
        ]);
        setPets(petsData);
        setAppointments(appointmentsData);
        setReminders(remindersData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const upcomingReminders = reminders.filter(r => r.days_left > 0);
  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-text">{user?.name || '未登录'}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-text-light">
              <Phone className="w-3.5 h-3.5" />
              <span>{user?.phone || '-'}</span>
            </div>
            <span className="badge bg-primary/10 text-primary mt-2">
              {user?.role === 'owner' ? '宠主' : user?.role === 'doctor' ? '医生' : '管理员'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<PawPrint className="w-5 h-5 text-primary" />}
          label="宠物数"
          value={pets.length}
          color="bg-primary/10"
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-secondary" />}
          label="预约数"
          value={appointments.length}
          color="bg-secondary/10"
        />
        <StatCard
          icon={<Bell className="w-5 h-5 text-amber-500" />}
          label="待提醒"
          value={upcomingReminders.length}
          color="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="card-hover flex items-center gap-3"
          onClick={() => navigate('/profile/records')}
        >
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-text">病历记录</p>
            <p className="text-xs text-text-light">查看历史病历</p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-light" />
        </button>

        <button
          className="card-hover flex items-center gap-3"
          onClick={() => navigate('/profile/reminders')}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold text-text">提醒中心</p>
            <p className="text-xs text-text-light">查看到期提醒</p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-light" />
        </button>
      </div>

      <div>
        <h3 className="section-title mb-3">最近预约</h3>
        {recentAppointments.length === 0 ? (
          <div className="card text-center py-8 text-text-light">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无预约记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAppointments.map(apt => (
              <div key={apt.id} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-primary" />
                    <span className="font-medium text-text">{apt.pet?.name || '未知'}</span>
                  </div>
                  <p className="text-sm text-text-light mt-0.5">
                    {formatDate(apt.date)} {formatTime(apt.time_slot)}
                  </p>
                </div>
                <span className={`badge ${getStatusColor(apt.status)}`}>
                  {getStatusText(apt.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

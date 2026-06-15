import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, UserRound, PawPrint } from 'lucide-react';
import { api } from '@/utils/api';
import { formatDate, formatTime, getStatusText, getStatusColor } from '@/utils/helpers';
import type { Appointment } from '@shared/types';

function AppointmentCard({ appointment, onAction }: { appointment: Appointment; onAction: (id: number, status: string) => void }) {
  return (
    <div className="card flex items-center gap-4 animate-slide-up">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-lg font-bold">
        {appointment.queue_number}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <PawPrint className="w-4 h-4 text-primary" />
          <span className="font-semibold text-text">{appointment.pet?.name || '未知'}</span>
          <span className="text-text-light text-sm">{appointment.pet?.breed || ''}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-text-light">
          <span className="flex items-center gap-1">
            <UserRound className="w-3.5 h-3.5" />
            宠主
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(appointment.time_slot)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`badge ${getStatusColor(appointment.status)}`}>
          {getStatusText(appointment.status)}
        </span>
        {appointment.status === 'waiting' && (
          <button className="btn-primary text-sm px-4 py-1.5" onClick={() => onAction(appointment.id, 'in_progress')}>
            接诊
          </button>
        )}
        {appointment.status === 'in_progress' && (
          <button className="btn-secondary text-sm px-4 py-1.5" onClick={() => onAction(appointment.id, 'complete')}>
            完成
          </button>
        )}
      </div>
    </div>
  );
}

export default function DoctorWorkbench() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await api.get<Appointment[]>('/doctor/appointments');
      const sorted = [...data].sort((a, b) => a.queue_number - b.queue_number);
      setAppointments(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  const handleAction = async (id: number, status: string) => {
    if (status === 'in_progress') {
      try {
        await api.put(`/doctor/appointments/${id}/status`, { status: 'in_progress' });
        fetchAppointments();
      } catch (err) {
        console.error(err);
      }
    } else if (status === 'complete') {
      navigate(`/doctor/appointment/${id}`);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const today = new Date().toISOString().split('T')[0];
  const waitingCount = appointments.filter(a => a.status === 'waiting').length;
  const inProgressCount = appointments.filter(a => a.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="section-title text-2xl">今日挂号列表</h1>
          <p className="text-text-light text-sm mt-1">{formatDate(today)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-text-light">
            共 <span className="font-bold text-text">{appointments.length}</span> 位
            {waitingCount > 0 && (
              <span className="ml-2 text-amber-600">候诊 {waitingCount}</span>
            )}
            {inProgressCount > 0 && (
              <span className="ml-2 text-blue-600">看诊中 {inProgressCount}</span>
            )}
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 text-text-light ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="card text-center py-16">
          <PawPrint className="w-12 h-12 text-text-light mx-auto mb-3" />
          <p className="text-text-light">今日暂无挂号</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} onAction={handleAction} />
          ))}
        </div>
      )}
    </div>
  );
}

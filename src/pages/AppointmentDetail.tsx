import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';
import { formatDate, formatTime, calculateAge, getStatusText, getStatusColor } from '@/utils/helpers';
import type { Appointment } from '@shared/types';

const STATUS_STEPS = ['waiting', 'in_progress', 'completed'];

function StatusProgress({ status }: { status: string }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center py-3">
        <span className="badge bg-gray-100 text-gray-500 text-base px-4 py-1">已取消</span>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="flex items-center justify-between py-3 px-2">
      {STATUS_STEPS.map((step, index) => {
        const isActive = index <= currentIndex;
        const isCurrent = step === status;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                  isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 whitespace-nowrap',
                  isCurrent ? 'text-primary font-bold' : 'text-text-light'
                )}
              >
                {getStatusText(step)}
              </span>
            </div>
            {index < STATUS_STEPS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  index < currentIndex ? 'bg-primary' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AppointmentDetail() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppointment = useCallback(() => {
    if (!id) return;
    api.get<Appointment>(`/appointments/${id}`)
      .then(setAppointment)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchAppointment();
    const interval = setInterval(fetchAppointment, 30000);
    return () => clearInterval(interval);
  }, [fetchAppointment]);

  const handleCancel = async () => {
    if (!id || appointment?.status !== 'waiting') return;
    await api.put(`/appointments/${id}/status`, { status: 'cancelled' });
    fetchAppointment();
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="card py-10 animate-pulse">
          <div className="h-6 w-24 bg-gray-200 rounded mx-auto mb-3" />
          <div className="h-14 w-20 bg-gray-200 rounded mx-auto" />
        </div>
        <div className="card h-40 animate-pulse" />
      </div>
    );
  }

  if (!appointment) return null;

  return (
    <div className="p-4 animate-fade-in">
      <div className="card text-center mb-4 py-6">
        <p className="text-text-light text-sm mb-2">您的排队号</p>
        <p className="text-5xl font-bold text-primary mb-3">{appointment.queue_number}</p>
        <span className={cn('badge text-sm', getStatusColor(appointment.status))}>
          {getStatusText(appointment.status)}
        </span>
        {appointment.estimated_wait && appointment.status === 'waiting' && (
          <p className="text-text-light text-sm mt-3">
            预计等待时间：{appointment.estimated_wait}
          </p>
        )}
      </div>

      <div className="card mb-4">
        <StatusProgress status={appointment.status} />
      </div>

      <div className="card mb-4 space-y-3">
        {appointment.pet && (
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {appointment.pet.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-text">{appointment.pet.name}</p>
              <p className="text-sm text-text-light">
                {appointment.pet.breed} · {calculateAge(appointment.pet.age)} · {appointment.pet.weight}kg
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-text-light">就诊科室</span>
          <span className="text-text font-semibold">{appointment.department?.name}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-light">接诊医生</span>
          <span className="text-text font-semibold">
            {appointment.doctor?.name} {appointment.doctor?.title}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-light">就诊时间</span>
          <span className="text-text font-semibold">
            {formatDate(appointment.date)} {formatTime(appointment.time_slot)}
          </span>
        </div>
      </div>

      {appointment.status === 'completed' && appointment.record && (
        <div className="card mb-4">
          <h3 className="section-title mb-3">就诊记录</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-text-light">诊断：</span>
              <span className="text-text">{appointment.record.diagnosis}</span>
            </div>
            <div>
              <span className="text-text-light">处方：</span>
              <span className="text-text">{appointment.record.prescription}</span>
            </div>
            <div>
              <span className="text-text-light">医嘱：</span>
              <span className="text-text">{appointment.record.advice}</span>
            </div>
            {appointment.record.follow_up_date && (
              <div>
                <span className="text-text-light">复诊日期：</span>
                <span className="text-text">{formatDate(appointment.record.follow_up_date)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {appointment.status === 'waiting' && (
        <button
          className="btn-outline w-full py-3 text-red-500 border-red-400 hover:bg-red-500 hover:text-white"
          onClick={handleCancel}
        >
          取消挂号
        </button>
      )}
    </div>
  );
}

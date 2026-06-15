import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { formatTime } from '@/utils/helpers';
import StepIndicator from '@/components/StepIndicator';
import type { TimeSlot } from '@shared/types';

function getWeekDay(date: Date): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return `周${days[date.getDay()]}`;
}

function getNext7Days(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AppointmentSlot() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatDateStr(new Date()));
  const navigate = useNavigate();
  const { appointmentDraft, setAppointmentDraft } = useAppStore();
  const dates = getNext7Days();
  const todayStr = formatDateStr(new Date());

  useEffect(() => {
    if (!appointmentDraft.doctorId) {
      navigate('/appointment/doctor');
      return;
    }
  }, [appointmentDraft.doctorId, navigate]);

  useEffect(() => {
    if (!appointmentDraft.doctorId) return;
    setLoading(true);
    api.get<TimeSlot[]>(
      `/appointments/doctors/${appointmentDraft.doctorId}/slots?date=${selectedDate}`
    )
      .then(setSlots)
      .finally(() => setLoading(false));
  }, [selectedDate, appointmentDraft.doctorId]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setAppointmentDraft({ date: selectedDate, timeSlot: slot.time_slot });
    navigate('/appointment/confirm');
  };

  return (
    <div className="p-4 animate-fade-in">
      <StepIndicator currentStep={3} steps={['选择科室', '选择医生', '选择时段']} />

      <button
        className="flex items-center gap-1 text-text-light hover:text-text mb-4 text-sm transition-colors"
        onClick={() => navigate('/appointment/doctor')}
      >
        <ArrowLeft size={16} />
        返回选择医生
      </button>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {dates.map((date) => {
          const dateStr = formatDateStr(date);
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={cn(
                'flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border transition-all duration-200 min-w-[72px]',
                isSelected
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-surface border-border hover:border-primary/50'
              )}
            >
              <span className="text-xs font-medium">{isToday ? '今天' : getWeekDay(date)}</span>
              <span className="text-sm font-bold">{date.getDate()}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {slots.map((slot) => {
            const isAvailable = slot.remaining > 0;
            return (
              <button
                key={slot.time_slot}
                disabled={!isAvailable}
                onClick={() => handleSlotSelect(slot)}
                className={cn(
                  'py-3 px-4 rounded-xl border text-center transition-all duration-200',
                  !isAvailable && 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed',
                  isAvailable && 'bg-surface border-border hover:border-primary/50 hover:shadow-sm'
                )}
              >
                <p className="font-semibold text-sm">{formatTime(slot.time_slot)}</p>
                {isAvailable ? (
                  <p className="text-xs mt-0.5 text-text-light">剩余 {slot.remaining}</p>
                ) : (
                  <p className="text-xs mt-0.5">已约满</p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { api } from '@/utils/api';
import type { Doctor, Department, ScheduleSlot } from '@shared/types';

interface DaySchedule {
  date: string;
  dayName: string;
  slots: ScheduleSlot[];
}

interface WeekData {
  days: DaySchedule[];
}

function EditModal({
  slot,
  date,
  doctorName,
  onSave,
  onClose,
}: {
  slot: ScheduleSlot;
  date: string;
  doctorName: string;
  onSave: (capacity: number) => void;
  onClose: () => void;
}) {
  const [capacity, setCapacity] = useState(slot.capacity);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text">编辑容量</h3>
          <button className="p-1 hover:bg-gray-100 rounded-lg" onClick={onClose}>
            <X className="w-4 h-4 text-text-light" />
          </button>
        </div>
        <p className="text-sm text-text-light mb-1">{doctorName}</p>
        <p className="text-sm text-text-light mb-4">
          {date} {slot.time}
        </p>
        <label className="block text-sm font-medium text-text mb-1.5">容量</label>
        <input
          type="number"
          min={0}
          max={50}
          className="input-field mb-4"
          value={capacity}
          onChange={e => setCapacity(Number(e.target.value))}
        />
        <div className="flex gap-2">
          <button className="btn-outline flex-1 text-sm" onClick={onClose}>取消</button>
          <button className="btn-primary flex-1 text-sm" onClick={() => onSave(capacity)}>保存</button>
        </div>
      </div>
    </div>
  );
}

function getWeekDates(mondayStr?: string): { dates: string[]; label: string } {
  let monday: Date;
  if (mondayStr) {
    monday = new Date(mondayStr);
  } else {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday = new Date(now);
    monday.setDate(now.getDate() + diff);
  }
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const endDate = new Date(monday);
  endDate.setDate(monday.getDate() + 6);
  const label = `${monday.getMonth() + 1}/${monday.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;

  return { dates, label };
}

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function AdminSchedule() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<{
    slot: ScheduleSlot;
    date: string;
    dayIndex: number;
    slotIndex: number;
  } | null>(null);

  const { dates: currentWeekDates } = getWeekDates();

  const getWeekDatesByOffset = useCallback(() => {
    const base = new Date(currentWeekDates[0]);
    base.setDate(base.getDate() + weekOffset * 7);
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    const endDate = new Date(base);
    endDate.setDate(base.getDate() + 6);
    const label = `${base.getMonth() + 1}/${base.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
    return { dates, label };
  }, [currentWeekDates, weekOffset]);

  useEffect(() => {
    async function loadInit() {
      try {
        const depts = await api.get<Department[]>('/appointments/departments');
        const allDoctors: Doctor[] = [];
        for (const dept of depts) {
          try {
            const docs = await api.get<Doctor[]>(`/appointments/departments/${dept.id}/doctors`);
            allDoctors.push(...docs);
          } catch (err) {
            console.error(err);
          }
        }
        setDoctors(allDoctors);
        if (allDoctors.length > 0) {
          setSelectedDoctor(allDoctors[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInit();
  }, []);

  useEffect(() => {
    if (!selectedDoctor) return;
    async function loadSchedule() {
      setLoading(true);
      try {
        const { dates } = getWeekDatesByOffset();
        const startDate = dates[0];
        const data = await api.get<{ date: string; slots: ScheduleSlot[] }[]>(
          `/admin/schedules?doctorId=${selectedDoctor}&week=${startDate}`
        );
        const days: DaySchedule[] = dates.map((date, i) => {
          const found = data.find((d: { date: string; slots: ScheduleSlot[] }) => d.date === date);
          return {
            date,
            dayName: DAY_NAMES[i],
            slots: found?.slots || [],
          };
        });
        setWeekData({ days });
      } catch (err) {
      console.error(err);
      setWeekData(null);
    } finally {
        setLoading(false);
      }
    }
    loadSchedule();
  }, [selectedDoctor, weekOffset, getWeekDatesByOffset]);

  const handleSaveCapacity = async (capacity: number) => {
    if (!editModal || !selectedDoctor) return;
    try {
      const day = weekData?.days[editModal.dayIndex];
      if (day) {
        await api.post('/admin/schedules', {
          doctorId: selectedDoctor,
          date: day.date,
          slots: day.slots.map((s, i) =>
            i === editModal.slotIndex ? { ...s, capacity } : s
          ),
        });
      }
      if (weekData) {
        const updated = { ...weekData };
        updated.days[editModal.dayIndex].slots[editModal.slotIndex].capacity = capacity;
        setWeekData(updated);
      }
      setEditModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedDoctorName = doctors.find(d => d.id === selectedDoctor)?.name || '';

  if (loading && doctors.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { label: currentLabel } = getWeekDatesByOffset();

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 py-6">
      <h1 className="section-title text-2xl mb-6">排班管理</h1>

      <div className="flex items-center gap-4 mb-6">
        <select
          className="input-field w-48"
          value={selectedDoctor || ''}
          onChange={e => setSelectedDoctor(Number(e.target.value))}
        >
          {doctors.map(doc => (
            <option key={doc.id} value={doc.id}>{doc.name} - {doc.department_name || ''}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="w-5 h-5 text-text-light" />
          </button>
          <span className="text-sm font-medium text-text min-w-[140px] text-center">{currentLabel}</span>
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setWeekOffset(prev => prev + 1)}
          >
            <ChevronRight className="w-5 h-5 text-text-light" />
          </button>
          {weekOffset !== 0 && (
            <button
              className="text-xs text-primary hover:text-primary-dark transition-colors"
              onClick={() => setWeekOffset(0)}
            >
              回到本周
            </button>
          )}
        </div>
      </div>

      {!weekData || weekData.days.every(d => d.slots.length === 0) ? (
        <div className="card text-center py-16 text-text-light">
          <p>该医生本周暂无排班数据</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekData?.days.map((day) => (
                <div key={day.date} className="text-center">
                  <p className="text-sm font-medium text-text">{day.dayName}</p>
                  <p className="text-xs text-text-light">{day.date.slice(5)}</p>
                </div>
              ))}
            </div>
            {weekData && weekData.days[0]?.slots.length > 0 && (
              <div className="space-y-2">
                {weekData.days[0].slots.map((_, slotIdx) => (
                  <div key={slotIdx} className="grid grid-cols-7 gap-2">
                    {weekData.days.map((day, dayIdx) => {
                      const slot = day.slots[slotIdx];
                      if (!slot) return <div key={dayIdx} className="h-14" />;
                      return (
                        <button
                          key={dayIdx}
                          className="h-14 rounded-xl border border-border bg-surface hover:bg-primary/5 hover:border-primary/30 flex flex-col items-center justify-center transition-colors"
                          onClick={() => setEditModal({ slot, date: day.date, dayIndex: dayIdx, slotIndex: slotIdx })}
                        >
                          <span className="text-xs text-text-light">{slot.time.slice(0, 5)}</span>
                          <span className="text-sm font-bold text-text">{slot.capacity}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {editModal && (
        <EditModal
          slot={editModal.slot}
          date={editModal.date}
          doctorName={selectedDoctorName}
          onSave={handleSaveCapacity}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

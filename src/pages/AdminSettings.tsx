import { useState, useEffect } from 'react';
import { Save, Stethoscope } from 'lucide-react';
import { api } from '@/utils/api';
import type { Doctor, Department, ScheduleSlot } from '@shared/types';

interface DoctorSchedule {
  doctor: Doctor;
  slots: ScheduleSlot[];
}

export default function AdminSettings() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctorSchedules, setDoctorSchedules] = useState<Record<number, DoctorSchedule[]>>({});
  const [activeDept, setActiveDept] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const depts = await api.get<Department[]>('/appointments/departments');
        setDepartments(depts);
        if (depts.length > 0) {
          setActiveDept(depts[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!activeDept) return;
    if (doctorSchedules[activeDept]) return;

    async function loadDoctors() {
      try {
        const docs = await api.get<Doctor[]>(`/appointments/departments/${activeDept}/doctors`);
        const schedules: DoctorSchedule[] = await Promise.all(
          docs.map(async (doc) => {
            try {
              const today = new Date().toISOString().split('T')[0];
              const data = await api.get<{ slots: ScheduleSlot[] }[]>(
                `/admin/schedules?doctorId=${doc.id}&week=${today}`
              );
              const slots = data.length > 0 && data[0].slots.length > 0
                ? data[0].slots
                : [
                    { time: '08:00-09:00', capacity: 5 },
                    { time: '09:00-10:00', capacity: 5 },
                    { time: '10:00-11:00', capacity: 5 },
                    { time: '11:00-12:00', capacity: 5 },
                    { time: '14:00-15:00', capacity: 5 },
                    { time: '15:00-16:00', capacity: 5 },
                    { time: '16:00-17:00', capacity: 5 },
                    { time: '17:00-18:00', capacity: 5 },
                  ];
              return { doctor: doc, slots };
            } catch {
              return {
                doctor: doc,
                slots: [
                  { time: '08:00-09:00', capacity: 5 },
                  { time: '09:00-10:00', capacity: 5 },
                  { time: '10:00-11:00', capacity: 5 },
                  { time: '11:00-12:00', capacity: 5 },
                  { time: '14:00-15:00', capacity: 5 },
                  { time: '15:00-16:00', capacity: 5 },
                  { time: '16:00-17:00', capacity: 5 },
                  { time: '17:00-18:00', capacity: 5 },
                ],
              };
            }
          })
        );
        setDoctorSchedules(prev => ({ ...prev, [activeDept]: schedules }));
      } catch (err) {
        console.error(err);
      }
    }
    loadDoctors();
  }, [activeDept, doctorSchedules]);

  const handleCapacityChange = (deptId: number, doctorIdx: number, slotIdx: number, value: number) => {
    setDoctorSchedules(prev => {
      const updated = { ...prev };
      const schedules = [...updated[deptId]];
      const docSchedule = { ...schedules[doctorIdx] };
      const slots = [...docSchedule.slots];
      slots[slotIdx] = { ...slots[slotIdx], capacity: value };
      docSchedule.slots = slots;
      schedules[doctorIdx] = docSchedule;
      updated[deptId] = schedules;
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises: Promise<unknown>[] = [];
      for (const deptId of Object.keys(doctorSchedules)) {
        const schedules = doctorSchedules[Number(deptId)];
        for (const schedule of schedules) {
          const today = new Date().toISOString().split('T')[0];
          promises.push(
            api.post('/admin/schedules', {
              doctorId: schedule.doctor.id,
              date: today,
              slots: schedule.slots,
            })
          );
        }
      }
      await Promise.all(promises);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentSchedules = activeDept ? doctorSchedules[activeDept] || [] : [];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-2xl">排班设置</h1>
        <button
          className="btn-primary flex items-center gap-2 text-sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          保存设置
        </button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {departments.map(dept => (
          <button
            key={dept.id}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeDept === dept.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-light hover:bg-gray-200'
            }`}
            onClick={() => setActiveDept(dept.id)}
          >
            {dept.name}
          </button>
        ))}
      </div>

      {currentSchedules.length === 0 ? (
        <div className="card text-center py-16 text-text-light">
          <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>该科室暂无医生</p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentSchedules.map((schedule, doctorIdx) => (
            <div key={schedule.doctor.id} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text">{schedule.doctor.name}</h3>
                  <p className="text-xs text-text-light">{schedule.doctor.title}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {schedule.slots.map((slot, slotIdx) => (
                  <div key={slotIdx} className="flex flex-col">
                    <label className="text-xs text-text-light mb-1">{slot.time}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={50}
                        className="input-field text-center text-sm"
                        value={slot.capacity}
                        onChange={e => handleCapacityChange(activeDept!, doctorIdx, slotIdx, Number(e.target.value))}
                      />
                      <span className="text-xs text-text-light">人</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/utils/api';
import { useAppStore } from '@/store';
import { formatDate, formatTime, calculateAge } from '@/utils/helpers';
import type { Department, Doctor } from '@shared/types';

interface ConfirmResult {
  id: number;
  queue_number: number;
  estimated_wait: string;
}

export default function AppointmentConfirm() {
  const [submitting, setSubmitting] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const navigate = useNavigate();
  const { appointmentDraft, selectedPet, clearAppointmentDraft } = useAppStore();

  useEffect(() => {
    if (!appointmentDraft.petId) {
      navigate('/appointment');
      return;
    }
    if (appointmentDraft.departmentId) {
      api.get<Department[]>('/appointments/departments').then((depts) => {
        const dept = depts.find((d) => d.id === appointmentDraft.departmentId);
        if (dept) setDepartment(dept);
      });
    }
    if (appointmentDraft.doctorId && appointmentDraft.departmentId) {
      api.get<Doctor[]>(
        `/appointments/departments/${appointmentDraft.departmentId}/doctors`
      ).then((docs) => {
        const doc = docs.find((d) => d.id === appointmentDraft.doctorId);
        if (doc) setDoctor(doc);
      });
    }
  }, [appointmentDraft, navigate]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await api.post<ConfirmResult>('/appointments', {
        pet_id: appointmentDraft.petId,
        department_id: appointmentDraft.departmentId,
        doctor_id: appointmentDraft.doctorId,
        date: appointmentDraft.date,
        time_slot: appointmentDraft.timeSlot,
      });
      clearAppointmentDraft();
      navigate(`/appointment/${res.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 animate-fade-in">
      <h1 className="section-title text-xl mb-6">确认挂号</h1>

      <div className="card space-y-4 mb-6">
        <div className="border-b border-border pb-3">
          <h3 className="text-sm text-text-light mb-2">宠物信息</h3>
          {selectedPet && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {selectedPet.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-text">{selectedPet.name}</p>
                <p className="text-sm text-text-light">
                  {selectedPet.breed} · {calculateAge(selectedPet.age)} · {selectedPet.weight}kg
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-border pb-3">
          <h3 className="text-sm text-text-light mb-1">就诊科室</h3>
          <p className="font-semibold text-text">{department?.name || '加载中...'}</p>
        </div>

        <div className="border-b border-border pb-3">
          <h3 className="text-sm text-text-light mb-1">接诊医生</h3>
          <p className="font-semibold text-text">
            {doctor ? `${doctor.name} ${doctor.title}` : '加载中...'}
          </p>
        </div>

        <div>
          <h3 className="text-sm text-text-light mb-1">就诊时间</h3>
          <p className="font-semibold text-text">
            {appointmentDraft.date ? formatDate(appointmentDraft.date) : ''}{' '}
            {appointmentDraft.timeSlot ? formatTime(appointmentDraft.timeSlot) : ''}
          </p>
        </div>
      </div>

      <button
        className="btn-primary w-full py-3 text-lg mb-3"
        onClick={handleConfirm}
        disabled={submitting}
      >
        {submitting ? '提交中...' : '确认挂号'}
      </button>
      <button
        className="btn-outline w-full py-3"
        onClick={() => navigate('/appointment/slot')}
      >
        返回修改
      </button>
    </div>
  );
}

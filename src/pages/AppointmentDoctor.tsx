import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { api } from '@/utils/api';
import { useAppStore } from '@/store';
import StepIndicator from '@/components/StepIndicator';
import type { Doctor } from '@shared/types';

const AVATAR_COLORS = [
  'bg-secondary', 'bg-blue-400', 'bg-purple-400', 'bg-amber-400',
  'bg-emerald-400', 'bg-pink-400', 'bg-indigo-400', 'bg-primary',
];

export default function AppointmentDoctor() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { appointmentDraft, setAppointmentDraft } = useAppStore();

  useEffect(() => {
    if (!appointmentDraft.departmentId) {
      navigate('/appointment');
      return;
    }
    api.get<Doctor[]>(
      `/appointments/departments/${appointmentDraft.departmentId}/doctors`
    )
      .then(setDoctors)
      .finally(() => setLoading(false));
  }, [appointmentDraft.departmentId, navigate]);

  const handleSelect = (doctor: Doctor) => {
    setAppointmentDraft({ doctorId: doctor.id });
    navigate('/appointment/slot');
  };

  return (
    <div className="p-4 animate-fade-in">
      <StepIndicator currentStep={2} steps={['选择科室', '选择医生', '选择时段']} />

      <button
        className="flex items-center gap-1 text-text-light hover:text-text mb-4 text-sm transition-colors"
        onClick={() => navigate('/appointment')}
      >
        <ArrowLeft size={16} />
        返回选择科室
      </button>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {doctors.map((doctor, index) => (
            <div key={doctor.id} className="card flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full ${AVATAR_COLORS[index % AVATAR_COLORS.length]} flex items-center justify-center text-white font-bold text-lg shrink-0`}
              >
                {doctor.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-text">{doctor.name}</h3>
                <p className="text-sm text-text-light">
                  {doctor.title}
                  {doctor.department_name ? ` · ${doctor.department_name}` : ''}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {doctor.avg_rating != null ? (
                    <>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            size={14}
                            className={`${
                              i <= Math.round(doctor.avg_rating!)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300 fill-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-amber-600">
                        {doctor.avg_rating}
                      </span>
                      <span className="text-xs text-text-light">
                        ({doctor.review_count}条评价)
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-text-light">暂无评价</span>
                  )}
                </div>
              </div>
              <button
                className="btn-secondary text-sm py-1.5 px-4 shrink-0"
                onClick={() => handleSelect(doctor)}
              >
                选择
              </button>
            </div>
          ))}
          {doctors.length === 0 && (
            <p className="text-center text-text-light py-10">该科室暂无医生</p>
          )}
        </div>
      )}
    </div>
  );
}

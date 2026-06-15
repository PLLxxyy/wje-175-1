import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Scissors, Shield, Smile } from 'lucide-react';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';
import { calculateAge } from '@/utils/helpers';
import StepIndicator from '@/components/StepIndicator';
import type { Department } from '@shared/types';

const DEPARTMENT_CONFIG: Record<string, { icon: React.ElementType; color: string; desc: string }> = {
  '内科': { icon: Stethoscope, color: 'bg-red-50 text-red-500', desc: '消化、呼吸、泌尿等内科疾病' },
  '外科': { icon: Scissors, color: 'bg-blue-50 text-blue-500', desc: '创伤、骨折、肿瘤等外科手术' },
  '皮肤科': { icon: Shield, color: 'bg-green-50 text-green-500', desc: '过敏性皮炎、真菌感染等皮肤病' },
  '牙科': { icon: Smile, color: 'bg-purple-50 text-purple-500', desc: '洁牙、拔牙、口腔疾病治疗' },
};

const DEFAULT_CONFIG = { icon: Stethoscope, color: 'bg-gray-50 text-gray-500', desc: '' };

function DepartmentCard({ dept, onSelect }: { dept: Department; onSelect: () => void }) {
  const config = DEPARTMENT_CONFIG[dept.name] || DEFAULT_CONFIG;
  const Icon = config.icon;
  return (
    <button className="card card-hover text-left" onClick={onSelect}>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', config.color)}>
        <Icon size={24} />
      </div>
      <h3 className="font-bold text-text mb-1">{dept.name}</h3>
      {config.desc && <p className="text-xs text-text-light">{config.desc}</p>}
    </button>
  );
}

export default function AppointmentDepartment() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { selectedPet, setAppointmentDraft } = useAppStore();

  useEffect(() => {
    api.get<Department[]>('/appointments/departments')
      .then(setDepartments)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (dept: Department) => {
    setAppointmentDraft({ departmentId: dept.id });
    navigate('/appointment/doctor');
  };

  return (
    <div className="p-4 animate-fade-in">
      <StepIndicator currentStep={1} steps={['选择科室', '选择医生', '选择时段']} />

      {selectedPet && (
        <div className="card mb-4 flex items-center gap-3">
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

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-36" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              onSelect={() => handleSelect(dept)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

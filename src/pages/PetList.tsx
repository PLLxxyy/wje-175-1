import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PawPrint } from 'lucide-react';
import { api } from '@/utils/api';
import { calculateAge } from '@/utils/helpers';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import type { Pet } from '@shared/types';

const AVATAR_COLORS = [
  'bg-primary', 'bg-secondary', 'bg-blue-400', 'bg-purple-400',
  'bg-amber-400', 'bg-emerald-400', 'bg-pink-400', 'bg-indigo-400',
];

function PetCard({ pet, index, onAppointment, onEdit }: {
  pet: Pet;
  index: number;
  onAppointment: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="card card-hover">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0',
            AVATAR_COLORS[index % AVATAR_COLORS.length]
          )}
        >
          {pet.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-text truncate">{pet.name}</h3>
            <span className="badge bg-primary/10 text-primary">{pet.breed}</span>
          </div>
          <div className="text-sm text-text-light space-y-0.5">
            <p>{calculateAge(pet.age)} · {pet.weight}kg</p>
            <div className="flex flex-wrap gap-1">
              {pet.sterilized && (
                <span className="badge bg-secondary/10 text-secondary-dark">已绝育</span>
              )}
              {pet.vaccines && pet.vaccines.length > 0 && (
                <span className="badge bg-accent/30 text-amber-700">{pet.vaccines.length}项疫苗</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="btn-secondary text-sm flex-1 py-2" onClick={onAppointment}>
          挂号
        </button>
        <button className="btn-outline text-sm py-2 px-4" onClick={onEdit}>
          编辑
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-9 flex-1 bg-gray-200 rounded-xl" />
              <div className="h-9 w-16 bg-gray-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PetList() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setSelectedPet, setAppointmentDraft } = useAppStore();

  useEffect(() => {
    api.get<Pet[]>('/pets').then(setPets).finally(() => setLoading(false));
  }, []);

  const handleAppointment = (pet: Pet) => {
    setSelectedPet(pet);
    setAppointmentDraft({ petId: pet.id });
    navigate('/appointment');
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-xl">我的宠物</h1>
        <button
          className="btn-primary flex items-center gap-1 text-sm"
          onClick={() => navigate('/pets/new')}
        >
          <Plus size={16} />
          添加宠物
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-light">
          <PawPrint size={64} className="text-border mb-4" />
          <p className="text-lg mb-4">还没有添加宠物</p>
          <button className="btn-primary" onClick={() => navigate('/pets/new')}>
            添加宠物
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pets.map((pet, index) => (
            <PetCard
              key={pet.id}
              pet={pet}
              index={index}
              onAppointment={() => handleAppointment(pet)}
              onEdit={() => navigate(`/pets/${pet.id}/edit`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

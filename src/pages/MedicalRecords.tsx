import { useState, useEffect } from 'react';
import { FileText, PawPrint, ChevronDown } from 'lucide-react';
import { api } from '@/utils/api';
import { formatDate } from '@/utils/helpers';
import { useAppStore } from '@/store';
import type { Pet, MedicalRecord, PrescriptionItem } from '@shared/types';

function PrescriptionList({ data }: { data: string }) {
  let items: PrescriptionItem[] = [];
  try {
    items = JSON.parse(data);
  } catch {
    return <p className="text-sm text-text-light">{data}</p>;
  }

  if (!items.length) return null;

  return (
    <div className="mt-2 space-y-1">
      {items.map((item, i) => (
        <div key={i} className="text-sm text-text-light flex gap-2">
          <span className="font-medium text-text">{item.medicine}</span>
          <span>{item.dosage}</span>
          <span>{item.frequency}</span>
          <span>{item.duration}</span>
        </div>
      ))}
    </div>
  );
}

export default function MedicalRecords() {
  const { selectedPet, setSelectedPet } = useAppStore();
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [petDropdownOpen, setPetDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadPets() {
      try {
        const data = await api.get<Pet[]>('/pets');
        setPets(data);
        if (!selectedPet && data.length > 0) {
          setSelectedPet(data[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPets();
  }, [selectedPet, setSelectedPet]);

  useEffect(() => {
    async function loadRecords() {
      if (!selectedPet) return;
      setLoading(true);
      try {
        const data = await api.get<MedicalRecord[]>(`/records/pet/${selectedPet.id}`);
        setRecords(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, [selectedPet]);

  const handleSelectPet = (pet: Pet) => {
    setSelectedPet(pet);
    setPetDropdownOpen(false);
  };

  if (loading && pets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title text-2xl">病历记录</h1>
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-gray-50 transition-colors"
            onClick={() => setPetDropdownOpen(!petDropdownOpen)}
          >
            <PawPrint className="w-4 h-4 text-primary" />
            <span className="font-medium text-text">{selectedPet?.name || '选择宠物'}</span>
            <ChevronDown className={`w-4 h-4 text-text-light transition-transform ${petDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {petDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface rounded-xl shadow-lg border border-border z-10 overflow-hidden">
              {pets.map(pet => (
                <button
                  key={pet.id}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${selectedPet?.id === pet.id ? 'bg-primary/5 text-primary font-medium' : 'text-text'}`}
                  onClick={() => handleSelectPet(pet)}
                >
                  {pet.name} ({pet.breed})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-text-light mx-auto mb-3" />
          <p className="text-text-light">暂无病历记录</p>
        </div>
      ) : (
        <div className="space-y-0">
          {records.map(record => (
            <div key={record.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0 mt-1.5" />
                <div className="w-0.5 flex-1 bg-border" />
              </div>
              <div className="flex-1 pb-6">
                <p className="text-xs text-text-light mb-1.5">{formatDate(record.created_at)}</p>
                <div className="card p-4">
                  <h4 className="font-semibold text-text mb-2">{record.diagnosis}</h4>
                  {record.prescription && <PrescriptionList data={record.prescription} />}
                  {record.advice && (
                    <p className="text-sm text-text-light mt-2">
                      <span className="font-medium text-text">医嘱：</span>
                      {record.advice}
                    </p>
                  )}
                  {record.doctor_name && (
                    <p className="text-xs text-text-light mt-2 pt-2 border-t border-border">
                      主治医生：{record.doctor_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

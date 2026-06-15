import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { api } from '@/utils/api';
import ToggleSwitch from '@/components/ToggleSwitch';
import type { Pet, Vaccine } from '@shared/types';

interface VaccineForm {
  id?: number;
  name: string;
  date: string;
  expiry_date: string;
}

interface PetForm {
  name: string;
  breed: string;
  age: number;
  weight: number;
  sterilized: boolean;
  vaccines: VaccineForm[];
}

export default function PetEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(isEditing);
  const [form, setForm] = useState<PetForm>({
    name: '',
    breed: '',
    age: 0,
    weight: 0,
    sterilized: false,
    vaccines: [],
  });

  useEffect(() => {
    if (!isEditing) return;
    api.get<Pet[]>('/pets').then((pets) => {
      const pet = pets.find((p) => p.id === Number(id));
      if (pet) {
        setForm({
          name: pet.name,
          breed: pet.breed,
          age: pet.age,
          weight: pet.weight,
          sterilized: pet.sterilized,
          vaccines: (pet.vaccines || []).map((v: Vaccine) => ({
            id: v.id,
            name: v.name,
            date: v.date,
            expiry_date: v.expiry_date,
          })),
        });
      }
    }).finally(() => setLoading(false));
  }, [id, isEditing]);

  const addVaccine = () => {
    setForm((prev) => ({
      ...prev,
      vaccines: [...prev.vaccines, { name: '', date: '', expiry_date: '' }],
    }));
  };

  const removeVaccine = (index: number) => {
    setForm((prev) => ({
      ...prev,
      vaccines: prev.vaccines.filter((_, i) => i !== index),
    }));
  };

  const updateVaccine = (index: number, field: keyof VaccineForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      vaccines: prev.vaccines.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const handleSave = async () => {
    const data = {
      name: form.name,
      breed: form.breed,
      age: form.age,
      weight: form.weight,
      sterilized: form.sterilized,
      vaccines: form.vaccines,
    };
    if (isEditing) {
      await api.put(`/pets/${id}`, data);
    } else {
      await api.post('/pets', data);
    }
    navigate('/pets');
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 animate-fade-in">
        <div className="h-8 w-40 bg-gray-200 rounded-lg animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-text-light hover:text-text transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="section-title text-xl">
          {isEditing ? '编辑宠物' : '添加宠物'}
        </h1>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">宠物名字</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="请输入宠物名字"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-1.5">品种</label>
          <input
            className="input-field"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            placeholder="请输入品种"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">年龄</label>
            <div className="relative">
              <input
                type="number"
                className="input-field pr-8"
                value={form.age || ''}
                onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                min={0}
                step={0.5}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light text-sm">年</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">体重</label>
            <div className="relative">
              <input
                type="number"
                className="input-field pr-8"
                value={form.weight || ''}
                onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                min={0}
                step={0.1}
                placeholder="0"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light text-sm">kg</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text">绝育状态</label>
          <ToggleSwitch
            checked={form.sterilized}
            onChange={(checked) => setForm({ ...form, sterilized: checked })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="section-title">疫苗记录</label>
            <button
              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1"
              onClick={addVaccine}
            >
              <Plus size={14} />
              添加疫苗
            </button>
          </div>
          <div className="space-y-3">
            {form.vaccines.map((vaccine, index) => (
              <div key={index} className="card flex items-end gap-2 py-3">
                <div className="flex-1 min-w-0">
                  <input
                    className="input-field text-sm"
                    placeholder="疫苗名称"
                    value={vaccine.name}
                    onChange={(e) => updateVaccine(index, 'name', e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    className="input-field text-sm"
                    value={vaccine.date}
                    onChange={(e) => updateVaccine(index, 'date', e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="date"
                    className="input-field text-sm"
                    value={vaccine.expiry_date}
                    onChange={(e) => updateVaccine(index, 'expiry_date', e.target.value)}
                  />
                </div>
                <button
                  className="text-red-400 hover:text-red-600 p-2 shrink-0"
                  onClick={() => removeVaccine(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {form.vaccines.length === 0 && (
              <p className="text-sm text-text-light text-center py-4">暂无疫苗记录</p>
            )}
          </div>
        </div>
      </div>

      <button className="btn-primary w-full mt-8 py-3" onClick={handleSave}>
        保存
      </button>
    </div>
  );
}

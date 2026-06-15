import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PawPrint, Syringe, Clock, CheckCircle, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { api } from '@/utils/api';
import { calculateAge, formatDate, formatTime } from '@/utils/helpers';
import type { Appointment, MedicalRecord, PrescriptionItem } from '@shared/types';

function PrescriptionRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: PrescriptionItem;
  index: number;
  onChange: (index: number, field: keyof PrescriptionItem, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <input
        className="input-field flex-1"
        placeholder="药品名称"
        value={item.medicine}
        onChange={e => onChange(index, 'medicine', e.target.value)}
      />
      <input
        className="input-field w-24"
        placeholder="剂量"
        value={item.dosage}
        onChange={e => onChange(index, 'dosage', e.target.value)}
      />
      <input
        className="input-field w-24"
        placeholder="频次"
        value={item.frequency}
        onChange={e => onChange(index, 'frequency', e.target.value)}
      />
      <input
        className="input-field w-24"
        placeholder="疗程"
        value={item.duration}
        onChange={e => onChange(index, 'duration', e.target.value)}
      />
      <button
        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        onClick={() => onRemove(index)}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function RecordTimeline({ records }: { records: MedicalRecord[] }) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-text-light">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>暂无病历记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map(record => (
        <div key={record.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0 mt-1.5" />
            <div className="w-0.5 flex-1 bg-border" />
          </div>
          <div className="flex-1 pb-4">
            <p className="text-xs text-text-light mb-1">{formatDate(record.created_at)}</p>
            <div className="card p-3">
              <p className="font-semibold text-text mb-1">{record.diagnosis}</p>
              {record.advice && <p className="text-sm text-text-light">{record.advice}</p>}
              {record.doctor_name && (
                <p className="text-xs text-text-light mt-1">主治医生：{record.doctor_name}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DoctorPatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pet' | 'history'>('pet');

  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState<PrescriptionItem[]>([
    { medicine: '', dosage: '', frequency: '', duration: '' },
  ]);
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const apt = await api.get<Appointment>(`/appointments/${id}`);
        setAppointment(apt);
        if (apt.pet_id) {
          const recs = await api.get<MedicalRecord[]>(`/records/pet/${apt.pet_id}`);
          setRecords(recs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const handlePrescriptionChange = (index: number, field: keyof PrescriptionItem, value: string) => {
    setPrescription(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddPrescriptionRow = () => {
    setPrescription(prev => [...prev, { medicine: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemovePrescriptionRow = (index: number) => {
    setPrescription(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!diagnosis.trim()) return;
    setSubmitting(true);
    try {
      const validPrescription = prescription.filter(p => p.medicine.trim());
      await api.post(`/doctor/appointments/${id}/record`, {
        diagnosis,
        prescription: JSON.stringify(validPrescription),
        advice,
        follow_up_date: followUpDate || undefined,
      });
      await api.put(`/doctor/appointments/${id}/status`, { status: 'completed' });
      navigate('/doctor');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-16 text-text-light">
        <p>未找到预约信息</p>
      </div>
    );
  }

  const pet = appointment.pet;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto px-4 py-6">
      <button
        className="flex items-center gap-1 text-text-light hover:text-text mb-4 transition-colors"
        onClick={() => navigate('/doctor')}
      >
        <ArrowLeft className="w-4 h-4" />
        返回工作台
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-text">{pet?.name || '未知'}</h3>
                <p className="text-sm text-text-light">{pet?.breed || ''}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-text-light">年龄</span>
                <p className="font-medium text-text">{pet ? calculateAge(pet.age) : '-'}</p>
              </div>
              <div>
                <span className="text-text-light">体重</span>
                <p className="font-medium text-text">{pet?.weight ? `${pet.weight}kg` : '-'}</p>
              </div>
              <div>
                <span className="text-text-light">绝育</span>
                <p className="font-medium text-text">{pet?.sterilized ? '已绝育' : '未绝育'}</p>
              </div>
              <div>
                <span className="text-text-light">就诊时间</span>
                <p className="font-medium text-text">{formatTime(appointment.time_slot)}</p>
              </div>
            </div>
            {pet?.vaccines && pet.vaccines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-text mb-2 flex items-center gap-1">
                  <Syringe className="w-4 h-4 text-secondary" />
                  疫苗记录
                </h4>
                <div className="space-y-1.5">
                  {pet.vaccines.map(v => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span className="text-text">{v.name}</span>
                      <span className="text-text-light">{formatDate(v.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pet' ? 'bg-primary text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'}`}
                onClick={() => setActiveTab('pet')}
              >
                宠物信息
              </button>
              <button
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-primary text-white' : 'bg-gray-100 text-text-light hover:bg-gray-200'}`}
                onClick={() => setActiveTab('history')}
              >
                历史病历
              </button>
            </div>
            {activeTab === 'history' && <RecordTimeline records={records} />}
            {activeTab === 'pet' && (
              <div className="text-sm text-text-light text-center py-4">
                查看上方宠物详情
              </div>
            )}
          </div>
        </div>

        {appointment.status === 'in_progress' && (
          <div className="lg:col-span-3">
            <div className="card">
              <h3 className="section-title mb-4">诊断记录</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-1.5">诊断结果</label>
                <textarea
                  className="input-field min-h-[80px] resize-y"
                  placeholder="请输入诊断结果..."
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-1.5">处方</label>
                <div className="flex items-center gap-2 mb-2 text-xs text-text-light">
                  <span className="flex-1">药品名称</span>
                  <span className="w-24">剂量</span>
                  <span className="w-24">频次</span>
                  <span className="w-24">疗程</span>
                  <span className="w-6" />
                </div>
                {prescription.map((item, index) => (
                  <PrescriptionRow
                    key={index}
                    item={item}
                    index={index}
                    onChange={handlePrescriptionChange}
                    onRemove={handleRemovePrescriptionRow}
                  />
                ))}
                <button
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary-dark transition-colors mt-1"
                  onClick={handleAddPrescriptionRow}
                >
                  <Plus className="w-4 h-4" />
                  添加药品
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-1.5">医嘱</label>
                <textarea
                  className="input-field min-h-[60px] resize-y"
                  placeholder="请输入医嘱..."
                  value={advice}
                  onChange={e => setAdvice(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text mb-1.5">复诊日期（可选）</label>
                <input
                  type="date"
                  className="input-field"
                  value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)}
                />
              </div>

              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleSubmit}
                disabled={submitting || !diagnosis.trim()}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                提交诊断
              </button>
            </div>
          </div>
        )}

        {appointment.status !== 'in_progress' && (
          <div className="lg:col-span-3 flex items-center justify-center">
            <div className="text-center text-text-light py-16">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>该预约尚未开始接诊</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

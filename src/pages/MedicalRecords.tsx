import { useState, useEffect } from 'react';
import { FileText, PawPrint, ChevronDown, Star, Send, Edit3 } from 'lucide-react';
import { api } from '@/utils/api';
import { formatDate } from '@/utils/helpers';
import { useAppStore } from '@/store';
import type { Pet, MedicalRecord, PrescriptionItem, Review } from '@shared/types';

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

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 20,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const display = readonly ? value : hover || value;

  return (
    <div className={`flex items-center gap-0.5 ${readonly ? '' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readonly}
          className={`p-0 transition-transform ${!readonly && 'hover:scale-110 active:scale-95'}`}
          onMouseEnter={() => !readonly && setHover(i)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange && onChange(i)}
        >
          <Star
            size={size}
            className={`transition-colors ${
              i <= display
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-transparent'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({
  record,
  onSubmitted,
}: {
  record: MedicalRecord;
  onSubmitted: (review: Review) => void;
}) {
  const [rating, setRating] = useState(record.review?.rating || 0);
  const [comment, setComment] = useState(record.review?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = rating >= 1 && rating <= 5;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const review = await api.post<Review>(
        `/records/${record.appointment_id}/review`,
        { rating, comment: comment.trim() }
      );
      onSubmitted(review);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">服务评价</p>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <textarea
        className="input-field min-h-[72px] resize-y text-sm"
        placeholder="请写下您对本次就诊的感受和建议（选填）"
        value={comment}
        onChange={e => setComment(e.target.value)}
      />
      <div className="flex justify-end">
        <button
          className="btn-primary text-sm px-4 py-1.5 flex items-center gap-1.5"
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          {record.review ? '修改评价' : '提交评价'}
        </button>
      </div>
    </div>
  );
}

function ReviewDisplay({ review, onEdit }: { review: Review; onEdit: () => void }) {
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarRating value={review.rating} readonly size={16} />
          <span className="text-sm font-medium text-amber-600">{review.rating.toFixed(1)}</span>
        </div>
        <button
          type="button"
          className="text-xs text-text-light hover:text-primary flex items-center gap-1 transition-colors"
          onClick={onEdit}
        >
          <Edit3 className="w-3 h-3" />
          修改
        </button>
      </div>
      {review.comment && (
        <p className="text-sm text-text-light bg-gray-50 rounded-lg p-2.5">
          {review.comment}
        </p>
      )}
      <p className="text-xs text-gray-400">评价于 {formatDate(review.created_at)}</p>
    </div>
  );
}

export default function MedicalRecords() {
  const { selectedPet, setSelectedPet } = useAppStore();
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [petDropdownOpen, setPetDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const handleReviewSubmitted = (appointmentId: number, review: Review) => {
    setRecords(prev =>
      prev.map(r =>
        r.appointment_id === appointmentId ? { ...r, review } : r
      )
    );
    setEditingId(null);
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
          {records.map(record => {
            const isCompleted = record.appointment_status === 'completed';
            const hasReview = !!record.review;
            const isEditing = editingId === record.id;

            return (
              <div key={record.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-secondary flex-shrink-0 mt-1.5" />
                  <div className="w-0.5 flex-1 bg-border" />
                </div>
                <div className="flex-1 pb-6">
                  <p className="text-xs text-text-light mb-1.5">
                    {record.appointment_date
                      ? formatDate(record.appointment_date)
                      : formatDate(record.created_at)}
                  </p>
                  <div className="card p-4">
                    <h4 className="font-semibold text-text mb-2">{record.diagnosis}</h4>
                    {record.prescription && <PrescriptionList data={record.prescription} />}
                    {record.advice && (
                      <p className="text-sm text-text-light mt-2">
                        <span className="font-medium text-text">医嘱：</span>
                        {record.advice}
                      </p>
                    )}
                    {(record.doctor_name || record.doctor_title) && (
                      <p className="text-xs text-text-light mt-2 pt-2 border-t border-border">
                        主治医生：{record.doctor_title ? `${record.doctor_title} ` : ''}
                        {record.doctor_name}
                      </p>
                    )}

                    {isCompleted && (
                      <>
                        {hasReview && !isEditing && (
                          <ReviewDisplay
                            review={record.review!}
                            onEdit={() => setEditingId(record.id)}
                          />
                        )}
                        {(!hasReview || isEditing) && (
                          <ReviewForm
                            record={record}
                            onSubmitted={(review) =>
                              handleReviewSubmitted(record.appointment_id, review)
                            }
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

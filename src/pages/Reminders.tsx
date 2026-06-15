import { useState, useEffect } from 'react';
import { Syringe, CalendarHeart, PawPrint, Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/utils/api';
import { formatDate } from '@/utils/helpers';
import type { Reminder } from '@shared/types';

function DaysLeftBadge({ days }: { days: number }) {
  let colorClass = 'bg-green-100 text-green-700';
  if (days < 7) colorClass = 'bg-red-100 text-red-700';
  else if (days < 14) colorClass = 'bg-amber-100 text-amber-700';
  else if (days < 30) colorClass = 'bg-green-100 text-green-700';

  return (
    <span className={`badge ${colorClass}`}>
      <Clock className="w-3 h-3 mr-1" />
      剩余 {days} 天
    </span>
  );
}

function VaccineReminderCard({ reminder }: { reminder: Reminder }) {
  const urgent = reminder.days_left < 7;

  return (
    <div className={`card flex items-start gap-3 ${urgent ? 'border-red-200 bg-red-50/30' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${urgent ? 'bg-red-100' : 'bg-secondary/10'}`}>
        <Syringe className={`w-5 h-5 ${urgent ? 'text-red-500' : 'text-secondary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <PawPrint className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-text">{reminder.pet_name}</span>
        </div>
        <p className="text-sm text-text">{reminder.title}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-text-light">到期：{formatDate(reminder.due_date)}</span>
          <DaysLeftBadge days={reminder.days_left} />
        </div>
        {urgent && (
          <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            即将到期，请尽快处理
          </div>
        )}
      </div>
    </div>
  );
}

function FollowUpReminderCard({ reminder }: { reminder: Reminder }) {
  return (
    <div className="card flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <CalendarHeart className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <PawPrint className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-text">{reminder.pet_name}</span>
        </div>
        <p className="text-sm text-text">{reminder.title}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-text-light">复诊：{formatDate(reminder.due_date)}</span>
          <DaysLeftBadge days={reminder.days_left} />
        </div>
      </div>
    </div>
  );
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReminders() {
      try {
        const data = await api.get<Reminder[]>('/reminders');
        setReminders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReminders();
  }, []);

  const vaccineReminders = reminders.filter(r => r.type === 'vaccine_expiry');
  const followUpReminders = reminders.filter(r => r.type === 'follow_up');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="section-title text-2xl">提醒中心</h1>

      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <Syringe className="w-5 h-5 text-secondary" />
          疫苗到期提醒
        </h2>
        {vaccineReminders.length === 0 ? (
          <div className="card text-center py-8 text-text-light">
            <Syringe className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无疫苗到期提醒</p>
          </div>
        ) : (
          <div className="space-y-2">
            {vaccineReminders
              .sort((a, b) => a.days_left - b.days_left)
              .map(r => (
                <VaccineReminderCard key={r.id} reminder={r} />
              ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="section-title mb-3 flex items-center gap-2">
          <CalendarHeart className="w-5 h-5 text-primary" />
          复诊提醒
        </h2>
        {followUpReminders.length === 0 ? (
          <div className="card text-center py-8 text-text-light">
            <CalendarHeart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>暂无复诊提醒</p>
          </div>
        ) : (
          <div className="space-y-2">
            {followUpReminders
              .sort((a, b) => a.days_left - b.days_left)
              .map(r => (
                <FollowUpReminderCard key={r.id} reminder={r} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

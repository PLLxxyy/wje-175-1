import { useState, useEffect } from 'react';
import { Calendar, Building2, Stethoscope, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { api } from '@/utils/api';
import type { AdminStats } from '@shared/types';

const CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8E8E', '#6FE0D9', '#E85555', '#3BBFB6'];

function StatCard({ icon, label, value, bgColor }: {
  icon: React.ReactNode; label: string; value: number; bgColor: string;
}) {
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-text">{value}</p>
        <p className="text-sm text-text-light">{label}</p>
      </div>
    </div>
  );
}

function TopDepartmentsList({ data }: { data: AdminStats['topDepartments'] }) {
  if (!data.length) return null;
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="card">
      <h3 className="section-title mb-4">热门科室排行</h3>
      <div className="space-y-3">
        {data.map((dept, index) => (
          <div key={dept.department_id} className="flex items-center gap-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${index < 3 ? 'bg-primary' : 'bg-gray-300'}`}>
              {index + 1}
            </span>
            <span className="text-sm text-text w-20 truncate">{dept.name}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(dept.count / maxCount) * 100}%`,
                  backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                }}
              />
            </div>
            <span className="text-sm font-semibold text-text w-8 text-right">{dept.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DoctorWorkloadTable({ data }: { data: AdminStats['doctorWorkload'] }) {
  if (!data.length) return null;

  return (
    <div className="card">
      <h3 className="section-title mb-4">医生工作量</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-text-light font-medium">医生</th>
              <th className="text-right py-2 text-text-light font-medium">接诊量</th>
              <th className="text-right py-2 text-text-light font-medium">占比</th>
            </tr>
          </thead>
          <tbody>
            {data.map(doc => {
              const total = data.reduce((s, d) => s + d.appointment_count, 0) || 1;
              const pct = ((doc.appointment_count / total) * 100).toFixed(1);
              return (
                <tr key={doc.doctor_id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-text">{doc.name}</td>
                  <td className="py-2.5 text-right font-semibold text-text">{doc.appointment_count}</td>
                  <td className="py-2.5 text-right text-text-light">{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.get<AdminStats>('/admin/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-text-light">
        <p>无法加载统计数据</p>
      </div>
    );
  }

  const weekTotal = stats.weekTrend.reduce((s, d) => s + d.count, 0);

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="section-title text-2xl">管理仪表盘</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Calendar className="w-6 h-6 text-primary" />}
          label="今日挂号量"
          value={stats.todayCount}
          bgColor="bg-primary/10"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-secondary" />}
          label="本周总量"
          value={weekTotal}
          bgColor="bg-secondary/10"
        />
        <StatCard
          icon={<Building2 className="w-6 h-6 text-amber-500" />}
          label="科室数"
          value={stats.departmentStats.length}
          bgColor="bg-amber-50"
        />
        <StatCard
          icon={<Stethoscope className="w-6 h-6 text-purple-500" />}
          label="医生数"
          value={stats.doctorWorkload.length}
          bgColor="bg-purple-50"
        />
      </div>

      <div className="card">
        <h3 className="section-title mb-4">本周趋势</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.weekTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0E6DB" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#7F8C8D" />
              <YAxis tick={{ fontSize: 12 }} stroke="#7F8C8D" />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #F0E6DB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="挂号量"
                stroke="#FF6B6B"
                strokeWidth={2.5}
                dot={{ fill: '#FF6B6B', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title mb-4">科室接诊统计</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E6DB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#7F8C8D" />
                <YAxis tick={{ fontSize: 12 }} stroke="#7F8C8D" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #F0E6DB',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" name="接诊量" radius={[6, 6, 0, 0]}>
                  {stats.departmentStats.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <TopDepartmentsList data={stats.topDepartments} />
      </div>

      <DoctorWorkloadTable data={stats.doctorWorkload} />
    </div>
  );
}

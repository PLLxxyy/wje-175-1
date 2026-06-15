export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[date.getDay()];
  return `${year}年${month}月${day}日 周${weekDay}`;
}

export function formatTime(timeSlot: string): string {
  return timeSlot.slice(0, 5);
}

export function calculateAge(age: number): string {
  if (age < 1) {
    const months = Math.round(age * 12);
    return `${months}个月`;
  }
  if (Number.isInteger(age)) {
    return `${age}岁`;
  }
  const years = Math.floor(age);
  const months = Math.round((age - years) * 12);
  return months > 0 ? `${years}岁${months}个月` : `${years}岁`;
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    waiting: '候诊中',
    in_progress: '看诊中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    waiting: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function getDepartmentIcon(name: string): string {
  const map: Record<string, string> = {
    '内科': 'Stethoscope',
    '外科': 'Scissors',
    '骨科': 'Bone',
    '眼科': 'Eye',
    '牙科': 'Smile',
    '皮肤科': 'Shield',
    '产科': 'Baby',
    '影像科': 'Scan',
    '体检中心': 'ClipboardCheck',
    '急诊': 'Siren',
  };
  return map[name] || 'Stethoscope';
}

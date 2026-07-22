export function formatTime(minutes) {
  const total = Number(minutes || 0);
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  return remaining ? `${hours} h ${remaining} min` : `${hours} h`;
}

export function formatQuantity(value) {
  const number = Number(value || 0);
  if (Number.isInteger(number)) return String(number);
  return String(Math.round(number * 100) / 100);
}

export function todayGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getCurrentTimeList(modes = 'hh:mm') {
  const now = new Date();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  if (modes === 'hh:mm:ss') return [hours, minutes, seconds].join(':');
  else if (modes === 'ss') return seconds;
  else return [hours, minutes].join(':');
}
export const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

export function getCurrentDateDay() {
  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  const monthsOfYear = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const now = new Date();

  const dayOfWeek = daysOfWeek[now.getDay()];
  const month = monthsOfYear[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();

  return `${dayOfWeek} ${month} ${day}, ${year}`;
}

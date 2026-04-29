export const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(amount) || 0);
};

export const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

export const parseTransactionDate = (transaction) => {
  const rawDate = transaction.created_at || transaction.date;
  const parsedDate = rawDate ? new Date(rawDate) : new Date();
  return Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
};

export const getTransactionType = (transaction) => {
  if (transaction.category === 'Income' || transaction.category === 'Transfer In') return 'income';
  if (transaction.category === 'Transfer Out') return 'transfer';
  return 'expense';
};

export const formatPeriodLabel = (date, period) => {
  if (period === 'month') {
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  if (period === 'week') {
    const weekStart = new Date(date);
    const day = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - day + 1);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return `${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  }

  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const getPeriodKey = (date, period) => {
  const keyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (period === 'month') {
    return `${keyDate.getFullYear()}-${String(keyDate.getMonth() + 1).padStart(2, '0')}`;
  }

  if (period === 'week') {
    const day = keyDate.getDay() || 7;
    keyDate.setDate(keyDate.getDate() - day + 1);
  }

  return keyDate.toISOString().slice(0, 10);
};

export const hashPassword = async (password) => {
  const bytes = new TextEncoder().encode(password);
  const buffer = await window.crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return `sha256:${hash}`;
};

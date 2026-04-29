import { useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { parseTransactionDate, getTransactionType, formatPeriodLabel, getPeriodKey, formatIDR } from '../utils/formatters';
import { CHART_COLORS } from '../utils/constants';

export function useFinance(user, addToast, getStoredSessionProof) {
  const [baseTotalIncome, setBaseTotalIncome] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [globalTransactions, setGlobalTransactions] = useState([]);

  const [monthOffset, setMonthOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionGroupBy, setTransactionGroupBy] = useState('day');

  // Edit transaction
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Balance view toggle (monthly vs total)
  const [showTotalBalance, setShowTotalBalance] = useState(false);

  // Undo delete
  const pendingDeleteRef = useRef(null);

  const getReferenceDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const viewMonthName = getReferenceDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const activeBudgetMonth = useMemo(() => {
    const year = getReferenceDate.getFullYear();
    const month = String(getReferenceDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [getReferenceDate]);

  const timelineMonths = useMemo(() => {
    const result = [];
    const d = new Date();
    for (let i = -4; i <= 1; i++) {
      const monthDate = new Date(d.getFullYear(), d.getMonth() + i, 1);
      const year = monthDate.getFullYear();
      const monthStr = String(monthDate.getMonth() + 1).padStart(2, '0');
      result.push({
        label: monthDate.toLocaleString('en-US', { month: 'short' }),
        offset: i,
        budgetMonthValue: `${year}-${monthStr}`
      });
    }
    return result;
  }, []);

  const invokeFinanceAction = useCallback(async (action, payload = {}) => {
    if (!user?.id) return { error: 'User tidak ditemukan.' };

    const sessionProof = getStoredSessionProof();
    if (!sessionProof) return { error: 'Sesi tidak ditemukan. Silakan login ulang.' };

    const { data, error } = await supabase.functions.invoke('user-finance', {
      body: {
        action,
        requesterId: user.id,
        sessionProof,
        ...payload
      }
    });

    if (error || data?.error) {
      // --- AI: Monthly Insight ---
  const fetchMonthlyInsight = useCallback(async () => {
    if (!user?.id) return;
    setIsInsightLoading(true);
    const result = await invokeFinanceAction('monthly_insight', { budgetMonth: activeBudgetMonth });
    if (!result.error && result.data) {
      setMonthlyInsight(result.data);
    }
    setIsInsightLoading(false);
  }, [invokeFinanceAction, user, activeBudgetMonth]);

  // --- AI: Smart Categorize ---
  const smartCategorize = useCallback(async (transactionName, transactionAmount) => {
    if (!user?.id || !transactionName) return null;
    setIsSmartLoading(true);
    const result = await invokeFinanceAction('smart_categorize', { transactionName, transactionAmount });
    setIsSmartLoading(false);
    if (!result.error && result.data) {
      setSmartSuggestion(result.data);
      return result.data;
    }
    return null;
  }, [invokeFinanceAction, user]);

  const clearSmartSuggestion = useCallback(() => setSmartSuggestion(null), []);

  return { error: data?.error || error?.message || 'Gagal memproses data keuangan.' };
    }

    return { data: data?.data };
  }, [user, getStoredSessionProof]);

  const fetchSettings = useCallback(async () => {
    if (!user?.id) return;

    const result = await invokeFinanceAction('get_settings');
    if (result.error) {
      console.error('Failed to fetch settings:', result.error);
      return;
    }

    const data = result.data;
    if (data) {
      setBaseTotalIncome(Number(data.total_income) || 0);
      setAccounts(data.accounts || []);
      setCategories(data.categories || []);
      setGoals(data.goals || []);
      setCutoffDate(Number(data.cutoff_date) || 1);
    } else {
      setBaseTotalIncome(0);
      setAccounts([]);
      setCategories([]);
      setGoals([]);
    }
  }, [invokeFinanceAction, user]);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;

    const result = await invokeFinanceAction('list_transactions', {
      budgetMonth: activeBudgetMonth
    });
    if (result.error) {
      console.error('Failed to fetch transactions:', result.error);
      return;
    }

    const data = result.data || [];
    if (data) {
      const mapped = data.map(d => ({ ...d, isPaid: d.is_paid }));
      setTransactions(mapped);
    }
  }, [activeBudgetMonth, invokeFinanceAction, user]);

  const fetchGlobalTransactions = useCallback(async () => {
    if (!user?.id) return;

    const result = await invokeFinanceAction('list_global_transactions');
    if (result.error) {
      console.error('Failed to fetch global transactions:', result.error);
      return;
    }

    const data = result.data || [];
    if (data) setGlobalTransactions(data);
  }, [invokeFinanceAction, user]);

  const autoGenerateIncome = useCallback(async () => {
    if (!user?.id) return;
    const result = await invokeFinanceAction('auto_generate_income', { budgetMonth: activeBudgetMonth });
    if (result.data) {
      // New income was generated, re-fetch
      await Promise.all([fetchTransactions(), fetchGlobalTransactions()]);
      addToast('Gaji Bulanan otomatis ditambahkan untuk bulan ini.', 'success');
    }
  }, [activeBudgetMonth, invokeFinanceAction, user, fetchTransactions, fetchGlobalTransactions, addToast]);

  const togglePaid = async (id, currentStatus) => {
    setTransactions(transactions.map(tx => tx.id === id ? { ...tx, isPaid: !currentStatus } : tx));
    const result = await invokeFinanceAction('toggle_paid', {
      transactionId: id,
      isPaid: !currentStatus
    });

    if (result.error) {
      setTransactions(transactions.map(tx => tx.id === id ? { ...tx, isPaid: currentStatus } : tx));
      addToast(result.error, 'error');
      return;
    }

    await fetchGlobalTransactions();
  };

  const insertTransactions = async (newRows) => {
    if (!user?.id) return;

    const result = await invokeFinanceAction('insert_transactions', { rows: newRows });
    if (result.error) {
      addToast(result.error, 'error');
      return;
    }

    await Promise.all([fetchTransactions(), fetchGlobalTransactions()]);
  };

  const addExpense = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const amount = Number(e.target.amount.value);
    const account = e.target.account.value;
    const category = e.target.category.value;
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (name && amount) {
      return { success: true, data: { name, amount, account, category, is_paid: true, date, budget_month: budgetMonth } };
    }
    return { success: false };
  };

  const addTopUp = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const amount = Number(e.target.amount.value);
    const account = e.target.account.value;
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (name && amount) {
      return { success: true, data: { name, amount, account, category: 'Income', is_paid: true, date, budget_month: budgetMonth } };
    }
    return { success: false };
  };

  const addTransfer = async (e) => {
    e.preventDefault();
    const fromAcc = e.target.fromAcc.value;
    const toAcc = e.target.toAcc.value;
    const amount = Number(e.target.amount.value);
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (fromAcc === toAcc) { addToast('Akun asal dan tujuan harus berbeda.', 'error'); return { success: false }; }
    if (amount > 0) {
      return {
        success: true,
        data: [
          { name: `Transfer to ${toAcc}`, amount, account: fromAcc, category: 'Transfer Out', is_paid: true, date, budget_month: budgetMonth },
          { name: `Transfer from ${fromAcc}`, amount, account: toAcc, category: 'Transfer In', is_paid: true, date, budget_month: budgetMonth }
        ]
      };
    }
    return { success: false };
  };

  const removeTransaction = (id) => {
    const deletedTx = transactions.find(tx => tx.id === id);
    if (!deletedTx) return;

    setTransactions(prev => prev.filter(tx => tx.id !== id));

    if (pendingDeleteRef.current) {
      clearTimeout(pendingDeleteRef.current.timer);
      const prev = pendingDeleteRef.current;
      invokeFinanceAction('delete_transaction', { transactionId: prev.id }).then(() => fetchGlobalTransactions());
    }

    const timer = setTimeout(async () => {
      pendingDeleteRef.current = null;
      const result = await invokeFinanceAction('delete_transaction', { transactionId: id });
      if (result.error) {
        addToast(result.error, 'error');
        await fetchTransactions();
      }
      await fetchGlobalTransactions();
    }, 8000);

    pendingDeleteRef.current = { id, tx: deletedTx, timer };

    addToast('"' + deletedTx.name + '" dihapus', 'undo', {
      action: () => {
        clearTimeout(timer);
        pendingDeleteRef.current = null;
        setTransactions(prev => [...prev, deletedTx].sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date)));
        addToast('Transaksi berhasil dikembalikan!', 'success');
      },
      actionLabel: 'Undo',
      duration: 8000
    });
  };

  const persistSettings = async (nextSettings) => {
    if (!user?.id) return;

    const result = await invokeFinanceAction('save_settings', {
      settings: {
        total_income: nextSettings.total_income,
        accounts: nextSettings.accounts,
        categories: nextSettings.categories,
        goals: nextSettings.goals
      }
    });

    if (result.error) console.error('Failed to save settings:', result.error);
  };

  const saveSettings = async (closeModal) => {
    if (closeModal) closeModal();
    await persistSettings({
      total_income: baseTotalIncome,
      accounts,
      categories,
      goals
    });
  };

  const quickAddGoalFund = (goalId, amountToAdd) => {
    const amount = parseFloat(prompt('Berapa nominal (IDR) yang ingin ditambahkan ke tabungan impian ini?', amountToAdd || '0'));
    if (!isNaN(amount) && amount > 0) {
      const updatedGoals = goals.map(g => {
        if (g.id === goalId) return { ...g, currentAmount: Number(g.currentAmount) + amount };
        return g;
      });
      setGoals(updatedGoals);
      persistSettings({
        total_income: baseTotalIncome,
        accounts,
        categories,
        goals: updatedGoals
      });
    }
  };

  // Edit transaction handler
  const openEditTransaction = (tx) => { setEditingTransaction(tx); setIsEditOpen(true); };
  const handleEditTransaction = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;
    const name = e.target.name.value;
    const amount = Number(String(e.target.amount.value).replace(/\D/g, '')) || Number(e.target.amount.value);
    const account = e.target.account.value;
    const category = e.target.category.value;
    const budgetMonth = e.target.budget_month.value;
    if (!name || !amount) return addToast('Nama dan jumlah wajib diisi.', 'error');
    setIsEditOpen(false);
    const result = await invokeFinanceAction('update_transaction', { transactionId: editingTransaction.id, updates: { name, amount, account, category, budget_month: budgetMonth } });
    if (result.error) { addToast(result.error, 'error'); return; }
    addToast('Transaksi berhasil diperbarui!', 'success');
    await Promise.all([fetchTransactions(), fetchGlobalTransactions()]);
    setEditingTransaction(null);
  };

  // Computed values
  const activeFilterCount = [filterCategory, filterAccount, filterType, filterStatus].filter(Boolean).length;
  const clearAllFilters = () => { setFilterCategory(''); setFilterAccount(''); setFilterType(''); setFilterStatus(''); };

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(lowerQ) || t.category.toLowerCase().includes(lowerQ) || t.account.toLowerCase().includes(lowerQ));
    }
    if (filterCategory) result = result.filter(t => t.category === filterCategory);
    if (filterAccount) result = result.filter(t => t.account === filterAccount);
    if (filterType === 'income') result = result.filter(t => t.category === 'Income' || t.category === 'Transfer In');
    else if (filterType === 'expense') result = result.filter(t => t.category !== 'Income' && !t.category.includes('Transfer'));
    else if (filterType === 'transfer') result = result.filter(t => t.category.includes('Transfer'));
    if (filterStatus === 'paid') result = result.filter(t => t.isPaid);
    else if (filterStatus === 'unpaid') result = result.filter(t => !t.isPaid);
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'amount') cmp = Number(a.amount) - Number(b.amount);
      else if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else cmp = new Date(a.created_at || a.date) - new Date(b.created_at || b.date);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [transactions, searchQuery, filterCategory, filterAccount, filterType, filterStatus, sortBy, sortOrder]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map();

    filteredTransactions.forEach((transaction) => {
      const transactionDate = parseTransactionDate(transaction);
      const key = getPeriodKey(transactionDate, transactionGroupBy);
      const type = getTransactionType(transaction);
      const amount = Number(transaction.amount) || 0;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date: transactionDate,
          label: formatPeriodLabel(transactionDate, transactionGroupBy),
          transactions: [],
          income: 0,
          expense: 0,
          transfer: 0,
          count: 0
        });
      }

      const group = groups.get(key);
      group.transactions.push(transaction);
      group.count += 1;

      if (type === 'income') group.income += amount;
      else if (type === 'transfer') group.transfer += amount;
      else group.expense += amount;
    });

    return Array.from(groups.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredTransactions, transactionGroupBy]);

  const transactionChartData = useMemo(() => {
    return [...groupedTransactions]
      .reverse()
      .map((group) => ({
        label: group.label,
        Income: group.income,
        Expense: group.expense,
        Net: group.income - group.expense
      }));
  }, [groupedTransactions]);

  const transactionPeriodSummary = useMemo(() => {
    return groupedTransactions.reduce((summary, group) => ({
      income: summary.income + group.income,
      expense: summary.expense + group.expense,
      transfer: summary.transfer + group.transfer,
      count: summary.count + group.count
    }), { income: 0, expense: 0, transfer: 0, count: 0 });
  }, [groupedTransactions]);

  const totals = useMemo(() => {
    const incomes = transactions.filter(t => t.category === 'Income');
    const expenses = transactions.filter(t => t.category !== 'Income' && !t.category.includes('Transfer'));
    const totalDynamicIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
    const allocated = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const categoryTotals = {};
    categories.forEach(c => categoryTotals[c.name] = 0);
    expenses.forEach(exp => {
      if (categoryTotals[exp.category] !== undefined) categoryTotals[exp.category] += Number(exp.amount);
      else categoryTotals[exp.category] = Number(exp.amount);
    });
    return { totalDynamicIncome, allocated, categoryTotals, incomes, expenses };
  }, [transactions, categories]);

  const effectiveTotalIncome = baseTotalIncome + totals.totalDynamicIncome;

  const currentAccountBalances = useMemo(() => {
    const current = {};
    accounts.forEach(a => current[a.name] = Number(a.balance));
    globalTransactions.forEach(tx => {
      if(current[tx.account] !== undefined) {
        if (tx.category === 'Income' || tx.category === 'Transfer In') current[tx.account] += Number(tx.amount);
        else if (tx.is_paid) current[tx.account] -= Number(tx.amount);
      }
    });
    return current;
  }, [globalTransactions, accounts]);

  const sumOfAccounts = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const sumOfCategories = categories.reduce((sum, cat) => sum + Number(cat.targetPercentage), 0);
  const usagePercentage = effectiveTotalIncome > 0 ? ((totals.allocated / effectiveTotalIncome) * 100).toFixed(1) : 0;
  const totalBalance = Object.values(currentAccountBalances).reduce((a, b) => a + b, 0);

  // Monthly balance: income - expenses for current viewed month only
  const monthlyBalance = useMemo(() => {
    const monthIncome = transactions
      .filter(t => t.category === 'Income' || t.category === 'Transfer In')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const monthExpense = transactions
      .filter(t => t.category !== 'Income' && !t.category.includes('Transfer') && t.isPaid)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return monthIncome - monthExpense;
  }, [transactions]);

  // The displayed balance based on toggle
  const displayBalance = showTotalBalance ? totalBalance : monthlyBalance;
  const displayBalanceLabel = showTotalBalance ? 'Total Balance' : 'Balance Bulan Ini';

  const budgetAlerts = useMemo(() => {
    return categories.map(cat => {
      const spent = totals.categoryTotals[cat.name] || 0;
      const target = (cat.targetPercentage / 100) * effectiveTotalIncome;
      const percent = target > 0 ? (spent / target) * 100 : 0;
      return { name: cat.name, spent, target, percent, status: percent >= 100 ? 'over' : percent >= 80 ? 'warning' : 'ok' };
    });
  }, [categories, totals, effectiveTotalIncome]);

  const unpaidCount = useMemo(() => transactions.filter(t => !t.isPaid && t.category !== 'Income' && !t.category.includes('Transfer')).length, [transactions]);

  const donutChartData = useMemo(() => {
        return categories.map((cat, i) => ({
      name: cat.name, value: totals.categoryTotals[cat.name] || 0, color: CHART_COLORS[i % CHART_COLORS.length]
    })).filter(d => d.value > 0);
  }, [categories, totals]);

  const notifications = useMemo(() => {
    const items = [];
    budgetAlerts.forEach(a => {
      if (a.status === 'over') items.push({ id: 'budget-over-' + a.name, type: 'danger', title: a.name + ' Over Budget!', desc: 'Pengeluaran ' + a.percent.toFixed(0) + '% dari budget (' + formatIDR(a.spent) + ' / ' + formatIDR(a.target) + ')' });
      else if (a.status === 'warning') items.push({ id: 'budget-warn-' + a.name, type: 'warning', title: a.name + ' Hampir Limit', desc: 'Sudah ' + a.percent.toFixed(0) + '% dari budget (' + formatIDR(a.spent) + ' / ' + formatIDR(a.target) + ')' });
    });
    if (unpaidCount > 0) items.push({ id: 'unpaid', type: 'info', title: unpaidCount + ' Transaksi Belum Dibayar', desc: 'Ada transaksi yang belum ditandai sebagai paid.' });
    goals.forEach(goal => {
      const pct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      if (pct >= 100) items.push({ id: 'goal-done-' + goal.id, type: 'success', title: goal.name + ' Tercapai!', desc: 'Selamat! Target tabungan sudah terpenuhi.' });
      else if (pct >= 75) items.push({ id: 'goal-75-' + goal.id, type: 'info', title: goal.name + ' ' + pct.toFixed(0) + '%', desc: 'Hampir mencapai target tabungan!' });
    });
    return items;
  }, [budgetAlerts, unpaidCount, goals]);

  return {
    // State
    baseTotalIncome, setBaseTotalIncome,
    accounts, setAccounts,
    categories, setCategories,
    goals, setGoals,
    transactions, setTransactions,
    globalTransactions, setGlobalTransactions,
    monthOffset, setMonthOffset,
    searchQuery, setSearchQuery,
    transactionGroupBy, setTransactionGroupBy,
    editingTransaction, setEditingTransaction,
    isEditOpen, setIsEditOpen,
    filterCategory, setFilterCategory,
    filterAccount, setFilterAccount,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    sortBy, setSortBy,
    sortOrder, setSortOrder,

    // Computed
    getReferenceDate, viewMonthName, activeBudgetMonth, timelineMonths,
    filteredTransactions, groupedTransactions, transactionChartData, transactionPeriodSummary,
    totals, effectiveTotalIncome, currentAccountBalances,
    sumOfAccounts, sumOfCategories, usagePercentage, totalBalance, monthlyBalance, displayBalance, displayBalanceLabel, showTotalBalance, setShowTotalBalance,
    budgetAlerts, unpaidCount, donutChartData, notifications,
    activeFilterCount, clearAllFilters,
    cutoffDate, setCutoffDate,

    // AI Features
    monthlyInsight, isInsightLoading, fetchMonthlyInsight,
    smartSuggestion, isSmartLoading, smartCategorize, clearSmartSuggestion,

    // Actions
    fetchSettings, fetchTransactions, fetchGlobalTransactions,
    togglePaid, insertTransactions,
    addExpense, addTopUp, addTransfer,
    removeTransaction, persistSettings, saveSettings, quickAddGoalFund,
    openEditTransaction, handleEditTransaction, autoGenerateIncome,
  };
}


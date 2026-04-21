import React, { useState, useMemo, useEffect } from 'react';
import { Home, CreditCard, User, Search, Bell, Settings, Plus, ArrowDownRight, Trash2, X, Download, RefreshCw, QrCode, LogOut, ArrowUpRight, CheckCircle2, ArrowRightLeft, Moon, Sun, Target, Eye, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';
import './App.css';

const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(amount) || 0);
};

const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

const CHART_COLORS = ['#d2f411', '#213f31', '#2d5866', '#f59e0b', '#ec4899', '#8b5cf6', '#34d399', '#f87171'];

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [user, setUser] = useState(null); 
  const [activeView, setActiveView] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  const [baseTotalIncome, setBaseTotalIncome] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [goals, setGoals] = useState([]); 
  const [transactions, setTransactions] = useState([]); 
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('accounts');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  const [monthOffset, setMonthOffset] = useState(0); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
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

  useEffect(() => {
    const savedSession = localStorage.getItem('alkhaf_user_session');
    if (savedSession) setUser(JSON.parse(savedSession));

    const savedTheme = localStorage.getItem('alkhaf_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('alkhaf_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('alkhaf_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      fetchSettings();
      fetchTransactions(); 

      const txSub = supabase
        .channel('public:expenses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
          fetchTransactions();
        })
        .subscribe();

      const settingsSub = supabase
        .channel('public:app_settings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
          fetchSettings();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(txSub);
        supabase.removeChannel(settingsSub);
      };
    }
  }, [user, monthOffset]);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
    if (data) {
      setBaseTotalIncome(data.total_income);
      setAccounts(data.accounts || []);
      setCategories(data.categories || []);
      setGoals(data.goals || []); 
    }
  };

  const fetchTransactions = async () => {
    let { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('budget_month', activeBudgetMonth)
      .order('created_at', { ascending: false });

    if (error && error.message.includes('budget_month')) {
      const startOfMonth = new Date(getReferenceDate.getFullYear(), getReferenceDate.getMonth(), 1).toISOString();
      const endOfMonth = new Date(getReferenceDate.getFullYear(), getReferenceDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const fallback = await supabase
        .from('expenses')
        .select('*')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth)
        .order('created_at', { ascending: false });
      
      data = fallback.data;
      error = fallback.error;
    }

    if (data) {
      const mapped = data.map(d => ({ ...d, isPaid: d.is_paid }));
      setTransactions(mapped);
    }
    setIsLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const { data, error } = await supabase.from('app_users').select('*').eq('username', username).eq('password', password).single();
      if (error || !data) return setLoginError('Username atau Password salah!');

      const userData = { id: data.id, name: data.username, role: data.role };
      setUser(userData);
      localStorage.setItem('alkhaf_user_session', JSON.stringify(userData));
    } catch (err) {
      setLoginError('Terjadi kesalahan koneksi database.');
    }
  };

  const handleLogout = () => {
    setUser(null); setActiveView('home'); localStorage.removeItem('alkhaf_user_session'); 
  };

  const togglePaid = async (id, currentStatus) => {
    setTransactions(transactions.map(tx => tx.id === id ? { ...tx, isPaid: !currentStatus } : tx));
    await supabase.from('expenses').update({ is_paid: !currentStatus }).eq('id', id);
  };

  const executeInsertWithFallback = async (newRows) => {
    const res = await supabase.from('expenses').insert(newRows);
    if (res.error && res.error.message.includes('budget_month')) {
       const fallbackRows = newRows.map(r => {
         const { budget_month, ...rest } = r;
         return rest;
       });
       await supabase.from('expenses').insert(fallbackRows);
    }
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
      setIsAddOpen(false);
      await executeInsertWithFallback([{ name, amount, account, category, is_paid: false, date, budget_month: budgetMonth }]);
    }
  };

  const addTopUp = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const amount = Number(e.target.amount.value);
    const account = e.target.account.value;
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (name && amount) {
      setIsTopUpOpen(false);
      await executeInsertWithFallback([{ name, amount, account, category: 'Income', is_paid: true, date, budget_month: budgetMonth }]);
    }
  };

  const addTransfer = async (e) => {
    e.preventDefault();
    const fromAcc = e.target.fromAcc.value;
    const toAcc = e.target.toAcc.value;
    const amount = Number(e.target.amount.value);
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (fromAcc === toAcc) return alert('Source and destination accounts must be different.');
    if (amount > 0) {
      setIsTransferOpen(false);
      await executeInsertWithFallback([
        { name: `Transfer to ${toAcc}`, amount, account: fromAcc, category: 'Transfer Out', is_paid: true, date, budget_month: budgetMonth },
        { name: `Transfer from ${fromAcc}`, amount, account: toAcc, category: 'Transfer In', is_paid: true, date, budget_month: budgetMonth }
      ]);
    }
  };

  const removeTransaction = async (id) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
    await supabase.from('expenses').delete().eq('id', id);
  };

  const saveSettings = async () => {
    setIsSettingsOpen(false);
    await supabase.from('app_settings').upsert({ id: 1, total_income: baseTotalIncome, accounts: accounts, categories: categories, goals: goals });
  };

  const quickAddGoalFund = (goalId, amountToAdd) => {
    const amount = parseFloat(prompt('Berapa nominal (IDR) yang ingin ditambahkan ke tabungan impian ini?', amountToAdd || '0'));
    if (!isNaN(amount) && amount > 0) {
      const updatedGoals = goals.map(g => {
        if (g.id === goalId) return { ...g, currentAmount: Number(g.currentAmount) + amount };
        return g;
      });
      setGoals(updatedGoals);
      supabase.from('app_settings').upsert({ id: 1, total_income: baseTotalIncome, accounts: accounts, categories: categories, goals: updatedGoals }).then();
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return alert("Tidak ada transaksi untuk diekspor di bulan ini.");
    const headers = ['ID', 'Date', 'Transaction Name', 'Amount (IDR)', 'Account', 'Category', 'Type', 'Status', 'Budget Month'];
    const csvRows = [headers.join(',')];
    transactions.forEach(tx => {
      let type = 'Expense';
      if (tx.category === 'Income') type = 'Income';
      if (tx.category === 'Transfer In' || tx.category === 'Transfer Out') type = 'Internal Transfer';
      const row = [tx.id, tx.date, `"${tx.name.replace(/"/g, '""')}"`, tx.amount, `"${tx.account}"`, `"${tx.category}"`, type, tx.isPaid ? 'Completed' : 'Pending', tx.budget_month || ''];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.setAttribute('href', url); a.setAttribute('download', `FinFlow_Transactions_${viewMonthName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const lowerQ = searchQuery.toLowerCase();
    return transactions.filter(t => t.name.toLowerCase().includes(lowerQ) || t.category.toLowerCase().includes(lowerQ) || t.account.toLowerCase().includes(lowerQ));
  }, [transactions, searchQuery]);

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
    transactions.forEach(tx => {
      if(current[tx.account] !== undefined) {
        if (tx.category === 'Income' || tx.category === 'Transfer In') current[tx.account] += Number(tx.amount);
        else if (tx.isPaid) current[tx.account] -= Number(tx.amount);
      }
    });
    return current;
  }, [transactions, accounts]);

  const nonAllocated = effectiveTotalIncome - totals.allocated;
  const sumOfAccounts = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const sumOfCategories = categories.reduce((sum, cat) => sum + Number(cat.targetPercentage), 0);
  const usagePercentage = effectiveTotalIncome > 0 ? ((totals.allocated / effectiveTotalIncome) * 100).toFixed(1) : 0;
  const totalBalance = Object.values(currentAccountBalances).reduce((a, b) => a + b, 0);

  const donutChartData = categories.map((cat, i) => ({
    name: cat.name, value: totals.categoryTotals[cat.name] || 0, color: CHART_COLORS[i % CHART_COLORS.length]
  })).filter(d => d.value > 0); 

  // ==========================================
  // RENDER BLOCKS
  // ==========================================

  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">AF</div>
          <h1 style={{fontSize:'1.8rem', fontWeight:'700', marginBottom:'0.5rem'}}>Welcome to Alkhaf</h1>
          <p style={{color:'var(--text-secondary)', marginBottom:'2rem'}}>Please sign in to your zero-based budgeting dashboard.</p>
          <form onSubmit={handleLogin}>
            {loginError && (<div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.9rem', fontWeight:'500'}}>{loginError}</div>)}
            <div style={{marginBottom:'1.5rem', textAlign:'left'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.9rem'}}>Username</label>
              <input type="text" name="username" required className="form-input" placeholder="Enter username" />
            </div>
            <div style={{marginBottom:'2rem', textAlign:'left'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.9rem'}}>Password</label>
              <input type="password" name="password" required className="form-input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary" style={{width:'100%', padding:'1rem'}}>Sign In to FinFlow</button>
          </form>
        </div>
      </div>
    );
  }

  // 1. DESKTOP VIEW
  const renderDesktopView = () => (
    <>
      <aside className="sidebar">
        <div>
          <div className="logo"><div className="logo-icon">AF</div> Alkhaf</div>
          <div className="nav-links">
            <div className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}><Home size={20} /> Home</div>
            <div className={`nav-item ${activeView === 'transactions' ? 'active' : ''}`} onClick={() => { setActiveView('transactions'); setSearchQuery(''); }}><CreditCard size={20} /> Transactions</div>
            <div className={`nav-item ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}><User size={20} /> Profile</div>
          </div>
        </div>
        <div className="sidebar-bottom">
          <div className="profile-widget">
            <div className="profile-avatar">
              <div style={{width:'100%', height:'100%', background:'var(--accent-lime)', color:'#0f172a', display:'grid', placeContent:'center', fontWeight:'700'}}>{getInitial(user.name)}</div>
            </div>
            <div className="profile-info">
              <div className="profile-name">{user.name}</div>
              <div className="profile-role">{user.role}</div>
            </div>
            <Bell size={18} color="var(--text-secondary)" style={{cursor:'pointer'}} />
          </div>
          <div className="total-balance">
            <div className="total-balance-label">Total Balance (Mock)</div>
            <div className="total-balance-value">{formatIDR(totalBalance)}</div>
          </div>
          <button className="btn-lime"><QrCode size={20} /> Scan QR</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="top-bar">
          <div className="page-title">
            {activeView === 'home' && `Overview - ${viewMonthName}`}
            {activeView === 'transactions' && `Transactions for ${viewMonthName}`}
            {activeView === 'profile' && `Your Profile`}
          </div>
          <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
            <div className="search-bar">
              <Search size={18} color="var(--text-secondary)"/>
              <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); if(activeView!=='transactions') setActiveView('transactions');}}/>
            </div>
            <button style={{background:'var(--bg-card)', border:'none', padding:'0.75rem', borderRadius:'50%', cursor:'pointer'}} onClick={toggleTheme}>
              {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
            <button style={{background:'var(--bg-card)', border:'none', padding:'0.75rem', borderRadius:'50%', cursor:'pointer'}} onClick={() => setIsSettingsOpen(true)}>
              <Settings size={20} />
            </button>
          </div>
        </div>

        {isLoading ? (
           <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'50vh', color:'var(--text-secondary)'}}>Loading {viewMonthName} data...</div>
        ) : activeView === 'home' ? (
          <>
            <div style={{background:'var(--accent-dark-green)', borderRadius:'var(--border-radius-lg)', padding:'2rem', color:'white', marginBottom:'1.5rem', display:'flex', gap:'2rem', alignItems:'center', flexWrap:'wrap'}}>
               <div style={{flex:1, minWidth:'250px'}}>
                 <h3 style={{fontSize:'1.5rem', fontWeight:'500', marginBottom:'0.5rem'}}>Financial Planning</h3>
                 <p style={{opacity:0.8}}>Total Pool: {formatIDR(effectiveTotalIncome)}</p>
               </div>
               <div style={{display:'flex', gap:'1rem'}}>
                 {timelineMonths.map((item, i) => {
                    const isCurrent = item.offset === monthOffset;
                    return (
                      <div key={`month-${i}`} onClick={() => setMonthOffset(item.offset)} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', cursor: 'pointer'}}>
                        <div style={{
                          width: isCurrent ? '80px' : '50px', height: '40px', background: isCurrent ? 'var(--accent-lime)' : 'rgba(255,255,255,0.08)', 
                          borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: isCurrent ? '#0f172a' : 'white', fontWeight: isCurrent ? '600' : '400', transition: 'all 0.3s ease'
                        }}>{isCurrent ? `${usagePercentage}%` : ''}</div>
                        <span style={{ fontSize:'0.8rem', opacity: isCurrent ? 1 : 0.6, fontWeight: isCurrent ? '600' : '400', color: isCurrent ? 'var(--accent-lime)' : 'white' }}>{item.label}</span>
                      </div>
                    )
                 })}
               </div>
            </div>

            <div className="dashboard-grid">
              <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                <div className="widget-card" style={{padding:'1.5rem'}}>
                  <div className="widget-header">
                    <span className="widget-title">My Accounts</span>
                    <a href="#" className="see-all">See all ›</a>
                  </div>
                  <div className="cards-container">
                    {accounts.length === 0 && <span style={{color:'var(--text-secondary)'}}>No accounts yet.</span>}
                    {accounts.map((acc, index) => (
                      <div key={acc.id} className={`bank-card color-${index % 4}`}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                          <span className="bank-card-type">{acc.name}</span>
                          <span style={{fontWeight:'700', fontStyle:'italic'}}>BANK</span>
                        </div>
                        <div className="bank-card-number">**** {String(acc.balance).substring(0,4)}</div>
                        <div className="bank-card-bottom">
                          <div>
                            <div className="bank-card-valid">Valid</div>
                            <div style={{fontSize:'0.9rem'}}>12/28</div>
                          </div>
                          <div className="bank-card-balance">{formatIDR(currentAccountBalances[acc.name])}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1.5rem'}}>
                  <div className="widget-card">
                    <div className="widget-header"><span className="widget-title">Actions</span></div>
                    <div className="actions-grid">
                      <button className="action-btn" onClick={() => setIsAddOpen(true)}>
                        <div className="action-icon"><Plus size={20} color="var(--accent-dark-green)"/></div> Add Exp.
                      </button>
                      <button className="action-btn" onClick={() => setIsTopUpOpen(true)}>
                        <div className="action-icon"><ArrowUpRight size={20} color="var(--success)"/></div> Top Up
                      </button>
                      <button className="action-btn" onClick={() => setIsTransferOpen(true)}>
                        <div className="action-icon"><ArrowRightLeft size={20} color="var(--accent-blue-gray)"/></div> Transfer
                      </button>
                      <button className="action-btn" onClick={exportToCSV}>
                        <div className="action-icon"><Download size={20} color="var(--accent-dark-green)"/></div> Export
                      </button>
                    </div>
                  </div>

                  <div className="widget-card">
                    <div className="widget-header">
                      <span className="widget-title">Recent Transactions</span>
                      <a href="#" className="see-all" onClick={(e) => {e.preventDefault(); setActiveView('transactions');}}>See all ›</a>
                    </div>
                    <div className="transaction-list">
                      {filteredTransactions.length === 0 && <span style={{color:'var(--text-secondary)'}}>No transactions found.</span>}
                      {filteredTransactions.slice(0, 4).map((tx, i) => (
                        <div key={tx.id} className="transaction-item">
                          <div className="transaction-left">
                            <div className="transaction-avatar" style={{background: tx.category === 'Income' ? 'var(--success)' : tx.category.includes('Transfer') ? 'var(--accent-blue-gray)' : `hsl(${i * 60 + 10}, 70%, 50%)`}}>
                              {getInitial(tx.name.replace('Transfer to ', '').replace('Transfer from ', ''))}
                            </div>
                            <div className="transaction-details">
                              <span className={`transaction-name ${tx.isPaid && !tx.category.includes('Transfer') && tx.category !== 'Income' ? 'paid' : ''}`}>{tx.name}</span>
                              <span className="transaction-date">{tx.date} &bull; {tx.account}</span>
                            </div>
                          </div>
                          <div className="transaction-right">
                            <div className={`transaction-amount ${tx.category === 'Income' || tx.category === 'Transfer In' ? 'income' : 'expense'}`}>
                              {tx.category === 'Income' || tx.category === 'Transfer In' ? '+' : '-'} {formatIDR(tx.amount)}
                            </div>
                            <div className="transaction-category">{tx.category}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                <div className="widget-card">
                  <div className="widget-header">
                    <span className="widget-title">Savings Goals</span>
                    <button className="see-all" onClick={() => { setIsSettingsOpen(true); setSettingsTab('goals'); }} style={{background:'none', border:'none'}}><Plus size={16}/> Add Goal</button>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                    {goals.length === 0 ? (<span style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>No savings goals yet.</span>) : (
                      goals.map((goal, i) => {
                        const percent = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                        const isComplete = percent >= 100;
                        return (
                          <div key={goal.id}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'0.5rem'}}>
                              <div style={{display:'flex', alignItems:'center', gap:'0.75rem'}}>
                                <div style={{width:'36px', height:'36px', borderRadius:'10px', background: isComplete ? 'var(--success)' : 'var(--bg-input)', display:'grid', placeContent:'center', color: isComplete ? 'white' : CHART_COLORS[i % CHART_COLORS.length]}}>
                                  {isComplete ? <CheckCircle2 size={18}/> : <Target size={18}/>}
                                </div>
                                <div>
                                  <div style={{fontWeight:'600', fontSize:'0.95rem'}}>{goal.name}</div>
                                  <div style={{fontSize:'0.75rem', color:'var(--text-secondary)'}}>{formatIDR(goal.currentAmount)} / {formatIDR(goal.targetAmount)}</div>
                                </div>
                              </div>
                              <div style={{textAlign:'right'}}>
                                <div style={{fontWeight:'700', fontSize:'1.1rem', color: isComplete ? 'var(--success)' : 'inherit'}}>{percent.toFixed(0)}%</div>
                                {!isComplete && (<button onClick={() => quickAddGoalFund(goal.id)} style={{background:'none', border:'none', color:'var(--accent-blue-gray)', fontSize:'0.75rem', fontWeight:'600', cursor:'pointer', padding:'0.25rem 0'}}>+ Add Fund</button>)}
                              </div>
                            </div>
                            <div style={{height:'8px', background:'var(--bg-input)', borderRadius:'4px', overflow:'hidden'}}>
                              <div style={{height:'100%', width:`${percent}%`, background: isComplete ? 'var(--success)' : CHART_COLORS[i % CHART_COLORS.length], borderRadius:'4px'}}></div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="widget-card" style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
                  <div className="widget-header" style={{marginBottom:'0.5rem'}}>
                    <span className="widget-title" style={{color:'var(--text-secondary)', fontWeight:'500'}}>Total Allocated</span>
                    <div style={{background:'var(--danger-light)', padding:'0.5rem', borderRadius:'50%'}}><ArrowDownRight size={16} color="var(--danger)"/></div>
                  </div>
                  {donutChartData.length > 0 ? (
                    <div style={{ height: '200px', width: '100%', marginTop: '1rem', marginBottom: '1rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {donutChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => formatIDR(value)} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (<div style={{ height: '200px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', fontSize:'0.9rem' }}>No spending yet</div>)}
                  <div className="spending-amount" style={{textAlign:'center'}}>{formatIDR(totals.allocated)}</div>
                  <div className="spending-trend" style={{textAlign:'center'}}>{usagePercentage}% of Pool</div>
                </div>

                <div className="widget-card">
                  <div className="widget-header"><span className="widget-title">Budget Categories</span></div>
                  <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                    {categories.length === 0 && <span style={{color:'var(--text-secondary)'}}>No categories yet.</span>}
                    {categories.map((cat, i) => {
                      const amount = totals.categoryTotals[cat.name] || 0;
                      const targetAmount = (cat.targetPercentage / 100) * effectiveTotalIncome;
                      const percent = targetAmount > 0 ? (amount / targetAmount) * 100 : 0;
                      return (
                        <div key={cat.id} style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                          <div style={{width:'40px', height:'40px', borderRadius:'50%', background:CHART_COLORS[i % CHART_COLORS.length], color: i===0?'black':'white', display:'grid', placeContent:'center', fontWeight:'600'}}>
                            {getInitial(cat.name)}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:'0.25rem'}}>
                              <span style={{fontWeight:'500'}}>{cat.name} ({cat.targetPercentage}%)</span>
                              <span>{formatIDR(amount)}</span>
                            </div>
                            <div style={{height:'6px', background:'var(--bg-input)', borderRadius:'3px', overflow:'hidden'}}>
                              <div style={{height:'100%', width:`${Math.min(percent, 100)}%`, background:CHART_COLORS[i % CHART_COLORS.length]}}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeView === 'transactions' ? (
          <div className="widget-card" style={{minHeight: '600px'}}>
             <div className="widget-header" style={{borderBottom:'1px solid var(--border-color)', paddingBottom:'1.5rem'}}>
              <span className="widget-title">Transactions List ({filteredTransactions.length})</span>
              <div style={{display:'flex', gap:'0.5rem'}}>
                <button className="btn-primary" onClick={() => setIsTransferOpen(true)} style={{background:'var(--accent-blue-gray)', color: '#fff'}}><ArrowRightLeft size={16}/> Transfer</button>
                <button className="btn-primary" onClick={() => setIsAddOpen(true)} style={{color: '#fff'}}><Plus size={16}/> Add Expense</button>
                <button className="btn-primary" style={{background:'var(--success)', color: '#fff'}} onClick={() => setIsTopUpOpen(true)}><ArrowUpRight size={16}/> Top Up</button>
              </div>
            </div>
            <table className="full-transactions-table">
              <thead>
                <tr><th style={{width:'60px'}}>Status</th><th>Date</th><th>Name</th><th>Account</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th><th style={{width:'60px'}}></th></tr>
              </thead>
              <tbody>
                {filteredTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.category === 'Income' || tx.category.includes('Transfer') ? <CheckCircle2 size={16} color="var(--success)"/> : <input type="checkbox" className="custom-checkbox" checked={tx.isPaid} onChange={() => togglePaid(tx.id, tx.isPaid)} />}</td>
                    <td style={{color:'var(--text-secondary)'}}>{tx.date}</td>
                    <td>{tx.name}</td>
                    <td>{tx.account}</td>
                    <td>{tx.category}</td>
                    <td style={{textAlign:'right', color: tx.category === 'Income' || tx.category === 'Transfer In' ? 'var(--success)' : 'inherit'}}>{formatIDR(tx.amount)}</td>
                    <td style={{textAlign:'right'}}><button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)'}} onClick={() => removeTransaction(tx.id)}><Trash2 size={18}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeView === 'profile' ? (
           <div className="widget-card" style={{maxWidth:'600px', margin:'0 auto', textAlign:'center', padding:'3rem'}}>
             <h2 style={{fontSize:'1.8rem', fontWeight:'700'}}>{user.name}</h2>
             <button className="btn-danger" onClick={handleLogout} style={{marginTop:'2rem'}}><LogOut size={18}/> Logout</button>
           </div>
        ) : null}
      </main>
    </>
  );

  // 2. MOBILE VIEW (MOCKUP STYLE)
  const renderMobileView = () => (
    <>
      <main className="main-content">
        <div className="mobile-header">
          <div className="mobile-profile">
            <div className="profile-avatar" style={{width:'48px', height:'48px', borderRadius:'50%', border:'2px solid var(--accent-lime)'}}>
              <div style={{width:'100%', height:'100%', background:'var(--bg-main)', color:'var(--text-primary)', display:'grid', placeContent:'center', fontWeight:'700', fontSize:'1.2rem'}}>
                {getInitial(user.name)}
              </div>
            </div>
            <span className="mobile-profile-name">{user.name}</span>
          </div>
          <div style={{display:'flex', gap:'0.5rem'}}>
             <button style={{background:'var(--bg-card)', border:'none', width:'48px', height:'48px', borderRadius:'50%', display:'grid', placeContent:'center'}} onClick={toggleTheme}>
               {isDarkMode ? <Sun size={20} color="var(--text-primary)"/> : <Moon size={20} color="var(--text-primary)"/>}
             </button>
             <button className="mobile-bell">
               <Bell size={20} color="var(--text-primary)"/>
               <span className="notification-dot"></span>
             </button>
          </div>
        </div>

        {isLoading ? (
           <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'50vh', color:'var(--text-secondary)'}}>Loading...</div>
        ) : activeView === 'home' ? (
          <>
            <div className="mobile-balance">
              <div style={{color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:'0.25rem'}}>Total Balance</div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{fontSize:'2.5rem', fontWeight:'800', color:'var(--text-primary)', letterSpacing:'-1px'}}>{formatIDR(totalBalance)}</div>
                <Eye size={24} color="var(--text-secondary)"/>
              </div>
            </div>

            <div className="cards-container" style={{margin:'1rem 0 2rem 0'}}>
              {accounts.map((acc, index) => (
                <div key={acc.id} className={`bank-card color-${index % 4}`}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                    <span className="bank-card-type">Debit</span>
                    <span style={{fontWeight:'800', fontSize:'1.2rem', letterSpacing:'1px'}}>VISA</span>
                  </div>
                  <div className="chip-icon" style={{margin:'1.5rem 0'}}>
                    <div className="dots-row"><span></span><span></span></div>
                    <div className="dots-row"><span></span><span></span></div>
                  </div>
                  <div className="bank-card-bottom" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
                    <div>
                      <div style={{fontSize:'0.65rem', opacity:0.8, marginBottom:'0.2rem'}}>Card Number</div>
                      <div className="bank-card-number">**** **** **** {String(acc.balance).substring(0,4)}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'0.65rem', opacity:0.8, marginBottom:'0.2rem'}}>Valid</div>
                      <div style={{fontSize:'0.9rem', fontWeight:'600'}}>07/30</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-grid">
              <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                <div className="mobile-actions-row">
                  <div className="mobile-action-item" onClick={() => setIsTopUpOpen(true)}>
                    <div className="mobile-action-squircle"><Download size={24} color="var(--text-primary)"/></div><span>Top Up</span>
                  </div>
                  <div className="mobile-action-item" onClick={() => setIsAddOpen(true)}>
                    <div className="mobile-action-squircle"><ArrowUpRight size={24} color="var(--text-primary)"/></div><span>Send</span>
                  </div>
                  <div className="mobile-action-item" onClick={() => setIsTransferOpen(true)}>
                    <div className="mobile-action-squircle"><CreditCard size={24} color="var(--text-primary)"/></div><span>Pay</span>
                  </div>
                  <div className="mobile-action-item" onClick={exportToCSV}>
                    <div className="mobile-action-squircle"><ArrowRightLeft size={24} color="var(--text-primary)"/></div><span>Transfer</span>
                  </div>
                </div>

                <div className="promo-banner">
                  <div className="promo-icon"><CreditCard size={20} color="white"/></div>
                  <div>
                    <div className="promo-title">Connect Your Card</div>
                    <div className="promo-subtitle">The smarter way to pay your money</div>
                  </div>
                  <div className="promo-arrow"><ChevronRight size={20}/></div>
                </div>

                <div style={{background:'var(--accent-dark-green)', borderRadius:'var(--border-radius-lg)', padding:'1.5rem', color:'white', marginTop:'1rem'}}>
                   <h3 style={{fontSize:'1.2rem', fontWeight:'500', marginBottom:'1rem'}}>Timeline ({usagePercentage}%)</h3>
                   <div style={{display:'flex', gap:'1rem', overflowX:'auto'}}>
                     {timelineMonths.map((item, i) => {
                        const isCurrent = item.offset === monthOffset;
                        return (
                          <div key={`month-${i}`} onClick={() => setMonthOffset(item.offset)} style={{
                            padding:'0.5rem 1rem', background: isCurrent ? 'var(--accent-lime)' : 'rgba(255,255,255,0.08)', 
                            borderRadius: '20px', color: isCurrent ? '#0f172a' : 'white', fontWeight: isCurrent ? '600' : '400', cursor:'pointer'
                          }}>{item.label}</div>
                        )
                     })}
                   </div>
                </div>

                <div className="transaction-list" style={{marginTop:'1rem'}}>
                    {filteredTransactions.slice(0, 5).map((tx, i) => (
                      <div key={tx.id} className="transaction-item" style={{background:'var(--bg-card)', padding:'1rem', borderRadius:'16px'}}>
                        <div className="transaction-left">
                          <div className="transaction-avatar" style={{background: tx.category === 'Income' ? 'var(--success)' : tx.category.includes('Transfer') ? 'var(--accent-blue-gray)' : `hsl(${i * 60 + 10}, 70%, 50%)`}}>
                            {getInitial(tx.name.replace('Transfer to ', '').replace('Transfer from ', ''))}
                          </div>
                          <div className="transaction-details">
                            <span className="transaction-name" style={{color:'var(--text-primary)'}}>{tx.name}</span>
                            <span className="transaction-date">{tx.date}</span>
                          </div>
                        </div>
                        <div className="transaction-right">
                          <div className={`transaction-amount ${tx.category === 'Income' || tx.category === 'Transfer In' ? 'income' : 'expense'}`}>
                            {tx.category === 'Income' || tx.category === 'Transfer In' ? '+' : '-'} {formatIDR(tx.amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        ) : activeView === 'transactions' ? (
          <div style={{paddingBottom:'2rem'}}>
             <h2 style={{marginBottom:'1rem'}}>Transactions</h2>
             <table className="full-transactions-table">
               {/* Same as desktop but mobile scrolling handled in CSS */}
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{color:'var(--text-secondary)'}}>{tx.date}</td>
                      <td>{tx.name}</td>
                      <td style={{textAlign:'right', color: tx.category === 'Income' ? 'var(--success)' : 'inherit'}}>{formatIDR(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        ) : activeView === 'profile' ? (
           <div style={{textAlign:'center', marginTop:'3rem'}}>
             <h2 style={{fontSize:'1.8rem', fontWeight:'700'}}>{user.name}</h2>
             <button className="btn-danger" onClick={handleLogout} style={{marginTop:'2rem'}}><LogOut size={18}/> Logout</button>
           </div>
        ) : null}
      </main>

      <div className="mobile-bottom-nav">
        <div className={`mobile-nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}>
          <Home size={24} /> <span>Home</span>
        </div>
        <div className={`mobile-nav-item ${activeView === 'transactions' ? 'active' : ''}`} onClick={() => setActiveView('transactions')}>
          <ArrowRightLeft size={24} /> <span>Trans</span>
        </div>
        
        <div className="mobile-nav-fab" onClick={() => setIsTopUpOpen(true)}>
           <QrCode size={26} color="#0f172a" />
        </div>

        <div className={`mobile-nav-item`} onClick={() => setIsSettingsOpen(true)}>
          <CreditCard size={24} /> <span>Cards</span>
        </div>
        <div className={`mobile-nav-item ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}>
          <User size={24} /> <span>Profile</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {isMobile ? renderMobileView() : renderDesktopView()}

      {/* MODALS (Shared across both views) */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Add New Expense</h2>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={() => setIsAddOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={addExpense}>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Budget Month (Alokasi Kantong)</label>
                <select name="budget_month" className="form-input" required defaultValue={activeBudgetMonth}>
                  {timelineMonths.map(m => <option key={m.budgetMonthValue} value={m.budgetMonthValue}>{m.label} ({m.budgetMonthValue})</option>)}
                </select>
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Expense Name</label>
                <input type="text" name="name" className="form-input" placeholder="e.g. Internet Bill" required />
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Amount (IDR)</label>
                <input type="number" name="amount" className="form-input" placeholder="0" required />
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Account</label>
                <select name="account" className="form-input" required>
                  {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                </select>
              </div>
              <div style={{marginBottom:'1.5rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Category</label>
                <select name="category" className="form-input" required>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{width: '100%', color: 'white'}}>Add Expense</button>
            </form>
          </div>
        </div>
      )}

      {isTopUpOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Top Up / Add Income</h2>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={() => setIsTopUpOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={addTopUp}>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Budget Month</label>
                <select name="budget_month" className="form-input" required defaultValue={activeBudgetMonth}>
                  {timelineMonths.map(m => <option key={m.budgetMonthValue} value={m.budgetMonthValue}>{m.label} ({m.budgetMonthValue})</option>)}
                </select>
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Income Source Name</label>
                <input type="text" name="name" className="form-input" placeholder="e.g. Bonus Bulanan, Jualan" required />
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Amount (IDR)</label>
                <input type="number" name="amount" className="form-input" placeholder="0" required />
              </div>
              <div style={{marginBottom:'1.5rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Deposit To Account</label>
                <select name="account" className="form-input" required>
                  {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{width: '100%', background:'var(--success)', color: 'white'}}>Add Income</button>
            </form>
          </div>
        </div>
      )}

      {isTransferOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Transfer Funds</h2>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={() => setIsTransferOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={addTransfer}>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Budget Month</label>
                <select name="budget_month" className="form-input" required defaultValue={activeBudgetMonth}>
                  {timelineMonths.map(m => <option key={m.budgetMonthValue} value={m.budgetMonthValue}>{m.label} ({m.budgetMonthValue})</option>)}
                </select>
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Amount (IDR)</label>
                <input type="number" name="amount" className="form-input" placeholder="0" required />
              </div>
              <div style={{marginBottom:'1rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>From Account</label>
                <select name="fromAcc" className="form-input" required>
                  {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                </select>
              </div>
              <div style={{marginBottom:'1.5rem'}}>
                <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>To Account</label>
                <select name="toAcc" className="form-input" required>
                  {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{width: '100%', background:'var(--accent-blue-gray)', color: 'white'}}>Transfer</button>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && renderSettingsModal()}
    </div>
  );
}

export default App;

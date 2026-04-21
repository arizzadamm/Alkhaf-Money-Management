import React, { useState, useMemo, useEffect } from 'react';
import { Home, CreditCard, User, Search, Bell, Settings, Plus, ArrowDownRight, Trash2, X, Download, RefreshCw, QrCode, LogOut, ArrowUpRight, CheckCircle2, ArrowRightLeft, Moon, Sun } from 'lucide-react';
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

const CHART_COLORS = ['#d2f411', '#213f31', '#2d5866', '#f59e0b', '#ec4899', '#8b5cf6'];

function App() {
  // APP STATE
  const [user, setUser] = useState(null); 
  const [activeView, setActiveView] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  // DATA STATE
  const [baseTotalIncome, setBaseTotalIncome] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  
  // UI STATE
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('accounts');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  // NEW FEATURES STATE
  const [monthOffset, setMonthOffset] = useState(0); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // HELPERS FOR MONTH FILTERING
  const getReferenceDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const viewMonthName = getReferenceDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const viewMonthShort = getReferenceDate.toLocaleString('en-US', { month: 'short' });

  const timelineMonths = useMemo(() => {
    const result = [];
    const d = new Date();
    for (let i = -4; i <= 1; i++) {
      const monthDate = new Date(d.getFullYear(), d.getMonth() + i, 1);
      result.push({
        label: monthDate.toLocaleString('en-US', { month: 'short' }),
        offset: i
      });
    }
    return result;
  }, []);

  // INIT SESSION & DARK MODE
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

  // SUPABASE FETCHING & REAL-TIME
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
    }
  };

  const fetchTransactions = async () => {
    const startOfMonth = new Date(getReferenceDate.getFullYear(), getReferenceDate.getMonth(), 1).toISOString();
    const endOfMonth = new Date(getReferenceDate.getFullYear(), getReferenceDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('created_at', startOfMonth)
      .lte('created_at', endOfMonth)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped = data.map(d => ({
        ...d,
        isPaid: d.is_paid
      }));
      setTransactions(mapped);
    }
    setIsLoading(false);
  };

  // HANDLERS
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        setLoginError('Username atau Password salah!');
        return;
      }

      const userData = { id: data.id, name: data.username, role: data.role };
      setUser(userData);
      localStorage.setItem('alkhaf_user_session', JSON.stringify(userData));

    } catch (err) {
      setLoginError('Terjadi kesalahan koneksi database.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveView('home');
    localStorage.removeItem('alkhaf_user_session'); 
  };

  const togglePaid = async (id, currentStatus) => {
    setTransactions(transactions.map(tx => tx.id === id ? { ...tx, isPaid: !currentStatus } : tx));
    await supabase.from('expenses').update({ is_paid: !currentStatus }).eq('id', id);
  };

  const addExpense = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const amount = Number(e.target.amount.value);
    const account = e.target.account.value;
    const category = e.target.category.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (name && amount) {
      const newExp = { name, amount, account, category, is_paid: false, date };
      setIsAddOpen(false);
      await supabase.from('expenses').insert([newExp]);
    }
  };

  const addTopUp = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const amount = Number(e.target.amount.value);
    const account = e.target.account.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (name && amount) {
      const newIncome = { name, amount, account, category: 'Income', is_paid: true, date };
      setIsTopUpOpen(false);
      await supabase.from('expenses').insert([newIncome]);
    }
  };

  const addTransfer = async (e) => {
    e.preventDefault();
    const fromAcc = e.target.fromAcc.value;
    const toAcc = e.target.toAcc.value;
    const amount = Number(e.target.amount.value);
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (fromAcc === toAcc) {
      alert('Source and destination accounts must be different.');
      return;
    }

    if (amount > 0) {
      const transferOut = { name: `Transfer to ${toAcc}`, amount, account: fromAcc, category: 'Transfer Out', is_paid: true, date };
      const transferIn = { name: `Transfer from ${fromAcc}`, amount, account: toAcc, category: 'Transfer In', is_paid: true, date };
      
      setIsTransferOpen(false);
      await supabase.from('expenses').insert([transferOut, transferIn]);
    }
  };

  const removeTransaction = async (id) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
    await supabase.from('expenses').delete().eq('id', id);
  };

  const saveSettings = async () => {
    setIsSettingsOpen(false);
    await supabase.from('app_settings').upsert({
      id: 1, 
      total_income: baseTotalIncome, 
      accounts: accounts,
      categories: categories
    });
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert("Tidak ada transaksi untuk diekspor di bulan ini.");
      return;
    }
    
    const headers = ['ID', 'Date', 'Transaction Name', 'Amount (IDR)', 'Account', 'Category', 'Type', 'Status'];
    const csvRows = [headers.join(',')];
    
    transactions.forEach(tx => {
      let type = 'Expense';
      if (tx.category === 'Income') type = 'Income';
      if (tx.category === 'Transfer In' || tx.category === 'Transfer Out') type = 'Internal Transfer';

      const status = tx.isPaid ? 'Completed' : 'Pending';
      const name = `"${tx.name.replace(/"/g, '""')}"`;
      const account = `"${tx.account}"`;
      const category = `"${tx.category}"`;
      
      const row = [
        tx.id,
        tx.date,
        name,
        tx.amount,
        account,
        category,
        type,
        status
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    const safeMonthName = viewMonthName.replace(/\s+/g, '_');
    a.setAttribute('download', `FinFlow_Transactions_${safeMonthName}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const lowerQ = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.name.toLowerCase().includes(lowerQ) || 
      t.category.toLowerCase().includes(lowerQ) || 
      t.account.toLowerCase().includes(lowerQ)
    );
  }, [transactions, searchQuery]);

  const totals = useMemo(() => {
    const incomes = transactions.filter(t => t.category === 'Income');
    const expenses = transactions.filter(t => t.category !== 'Income' && !t.category.includes('Transfer'));

    const totalDynamicIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
    const allocated = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    
    const categoryTotals = {};
    categories.forEach(c => categoryTotals[c.name] = 0);
    expenses.forEach(exp => {
      if (categoryTotals[exp.category] !== undefined) {
        categoryTotals[exp.category] += Number(exp.amount);
      } else {
        categoryTotals[exp.category] = Number(exp.amount); 
      }
    });

    return { totalDynamicIncome, allocated, categoryTotals, incomes, expenses };
  }, [transactions, categories]);

  const effectiveTotalIncome = baseTotalIncome + totals.totalDynamicIncome;

  const currentAccountBalances = useMemo(() => {
    const current = {};
    accounts.forEach(a => current[a.name] = Number(a.balance));
    
    transactions.forEach(tx => {
      if(current[tx.account] !== undefined) {
        if (tx.category === 'Income' || tx.category === 'Transfer In') {
          current[tx.account] += Number(tx.amount);
        } else if (tx.isPaid) { 
          current[tx.account] -= Number(tx.amount);
        }
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
    name: cat.name,
    value: totals.categoryTotals[cat.name] || 0,
    color: CHART_COLORS[i % CHART_COLORS.length]
  })).filter(d => d.value > 0); 

  // RENDER LOGIN
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">AF</div>
          <h1 style={{fontSize:'1.8rem', fontWeight:'700', marginBottom:'0.5rem'}}>Welcome to Alkhaf</h1>
          <p style={{color:'var(--text-secondary)', marginBottom:'2rem'}}>Please sign in to your zero-based budgeting dashboard.</p>
          
          <form onSubmit={handleLogin}>
            {loginError && (
              <div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.9rem', fontWeight:'500'}}>
                {loginError}
              </div>
            )}
            <div style={{marginBottom:'1.5rem', textAlign:'left'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.9rem'}}>Username</label>
              <input type="text" name="username" required className="form-input" placeholder="Enter username" />
            </div>
            <div style={{marginBottom:'2rem', textAlign:'left'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.9rem'}}>Password</label>
              <input type="password" name="password" required className="form-input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary" style={{width:'100%', padding:'1rem'}}>
              Sign In to FinFlow
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MODALS
  const renderSettingsModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Settings</h2>
          <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={() => setIsSettingsOpen(false)}><X size={24}/></button>
        </div>
        
        <div className="tabs">
          <div className={`tab ${settingsTab === 'accounts' ? 'active' : ''}`} onClick={() => setSettingsTab('accounts')}>Income & Accounts</div>
          <div className={`tab ${settingsTab === 'categories' ? 'active' : ''}`} onClick={() => setSettingsTab('categories')}>Budget Allocations</div>
        </div>

        {settingsTab === 'accounts' && (
          <div>
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Base Monthly Income (IDR)</label>
              <input type="number" className="form-input" value={baseTotalIncome} onChange={(e) => setBaseTotalIncome(Number(e.target.value))} />
              <div style={{marginTop: '0.5rem', fontSize: '0.85rem', color: sumOfAccounts !== baseTotalIncome ? 'var(--danger)' : 'var(--success)'}}>
                Sum of Base Accounts: {formatIDR(sumOfAccounts)} {sumOfAccounts !== baseTotalIncome && `(Mismatch by ${formatIDR(Math.abs(baseTotalIncome - sumOfAccounts))})`}
              </div>
            </div>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h3 style={{fontSize:'1rem', fontWeight:'600'}}>Base Accounts Setup</h3>
              <button style={{background:'var(--accent-lime)', color:'#0f172a', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}} 
                      onClick={() => setAccounts([...accounts, { id: `acc-${Date.now()}`, name: 'New Account', balance: 0 }])}>
                <Plus size={16}/>
              </button>
            </div>
            {accounts.map(acc => (
              <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}} key={acc.id}>
                <input type="text" className="form-input" value={acc.name} onChange={(e) => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, name: e.target.value } : a))} placeholder="Account Name"/>
                <input type="number" className="form-input" value={acc.balance} onChange={(e) => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: Number(e.target.value) } : a))} placeholder="Initial Balance"/>
                <button className="btn-danger" onClick={() => setAccounts(accounts.filter(a => a.id !== acc.id))}><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {settingsTab === 'categories' && (
          <div>
             <div style={{marginBottom: '1.5rem'}}>
              <div style={{fontSize: '0.9rem', color: sumOfCategories !== 100 ? 'var(--danger)' : 'var(--success)'}}>
                Total Allocation: {sumOfCategories}% {sumOfCategories !== 100 && `(Should be exactly 100%)`}
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h3 style={{fontSize:'1rem', fontWeight:'600'}}>Categories Setup</h3>
              <button style={{background:'var(--accent-lime)', color:'#0f172a', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}} 
                      onClick={() => setCategories([...categories, { id: `cat-${Date.now()}`, name: 'New Category', targetPercentage: 0 }])}>
                <Plus size={16}/>
              </button>
            </div>
            {categories.map(cat => (
              <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}} key={cat.id}>
                <input type="text" className="form-input" value={cat.name} onChange={(e) => setCategories(categories.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))} placeholder="Category Name"/>
                <input type="number" className="form-input" value={cat.targetPercentage} onChange={(e) => setCategories(categories.map(c => c.id === cat.id ? { ...c, targetPercentage: Number(e.target.value) } : c))} placeholder="Percentage (e.g. 20)"/>
                <button className="btn-danger" onClick={() => setCategories(categories.filter(c => c.id !== cat.id))}><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" style={{width: '100%', marginTop:'2rem', padding:'1rem', color:'white'}} onClick={saveSettings}>
          Save to Supabase
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="logo">
            <div className="logo-icon">AF</div>
            Alkhaf
          </div>
          
          <div className="nav-links">
            <div className={`nav-item ${activeView === 'home' ? 'active' : ''}`} onClick={() => setActiveView('home')}><Home size={20} /> Home</div>
            <div className={`nav-item ${activeView === 'transactions' ? 'active' : ''}`} onClick={() => { setActiveView('transactions'); setSearchQuery(''); }}><CreditCard size={20} /> Transactions</div>
            <div className={`nav-item ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}><User size={20} /> Profile</div>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-widget">
            <div className="profile-avatar">
              <div style={{width:'100%', height:'100%', background:'var(--accent-lime)', color:'#0f172a', display:'grid', placeContent:'center', fontWeight:'700'}}>
                 {getInitial(user.name)}
              </div>
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

          <button className="btn-lime">
            <QrCode size={20} /> Scan QR
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
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
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeView !== 'transactions') setActiveView('transactions');
                }}
              />
            </div>
            <button 
              style={{background:'var(--bg-card)', border:'none', padding:'0.75rem', borderRadius:'50%', cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', color: 'var(--text-primary)'}} 
              onClick={toggleTheme}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              style={{background:'var(--bg-card)', border:'none', padding:'0.75rem', borderRadius:'50%', cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', color: 'var(--text-primary)'}} 
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
           <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'50vh', color:'var(--text-secondary)'}}>
             Loading {viewMonthName} data from Supabase...
           </div>
        ) : activeView === 'home' ? (
          <>
            {/* HERO CARD WITH MONTH TIMELINE */}
            <div style={{background:'var(--accent-dark-green)', borderRadius:'var(--border-radius-lg)', padding:'2rem', color:'white', marginBottom:'1.5rem', display:'flex', gap:'2rem', alignItems:'center', flexWrap:'wrap'}}>
               <div style={{flex:1, minWidth:'250px'}}>
                 <h3 style={{fontSize:'1.5rem', fontWeight:'500', marginBottom:'0.5rem'}}>Financial Planning</h3>
                 <p style={{opacity:0.8}}>Total Pool: {formatIDR(effectiveTotalIncome)} (Base: {formatIDR(baseTotalIncome)} + Top Up: {formatIDR(totals.totalDynamicIncome)})</p>
               </div>
               
               <div style={{display:'flex', gap:'1rem'}}>
                 {timelineMonths.map((item, i) => {
                    const isCurrent = item.offset === monthOffset;
                    return (
                      <div key={`month-${i}`} onClick={() => setMonthOffset(item.offset)} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem', cursor: 'pointer'}}>
                        <div style={{
                          width: isCurrent ? '80px' : '50px', 
                          height: '40px', 
                          background: isCurrent ? 'var(--accent-lime)' : 'rgba(255,255,255,0.08)', 
                          borderRadius: '20px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: isCurrent ? '#0f172a' : 'white',
                          fontWeight: isCurrent ? '600' : '400',
                          transition: 'all 0.3s ease'
                        }}>
                          {isCurrent ? `${usagePercentage}%` : ''}
                        </div>
                        <span style={{
                          fontSize:'0.8rem', 
                          opacity: isCurrent ? 1 : 0.6,
                          fontWeight: isCurrent ? '600' : '400',
                          color: isCurrent ? 'var(--accent-lime)' : 'white'
                        }}>
                          {item.label}
                        </span>
                      </div>
                    )
                 })}
               </div>
            </div>

            <div className="dashboard-grid">
              <div style={{display:'flex', flexDirection:'column', gap:'1.5rem'}}>
                <div className="widget-card" style={{padding:'1.5rem'}}>
                  <div className="widget-header">
                    <span className="widget-title">My Accounts (This Month Delta)</span>
                    <a href="#" className="see-all">See all ›</a>
                  </div>
                  <div className="cards-container">
                    {accounts.length === 0 && <span style={{color:'var(--text-secondary)'}}>No accounts yet. Go to Settings.</span>}
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
                    <div className="widget-header">
                      <span className="widget-title">Actions</span>
                    </div>
                    <div className="actions-grid">
                      <button className="action-btn" onClick={() => setIsAddOpen(true)}>
                        <div className="action-icon"><Plus size={20} color="var(--accent-dark-green)"/></div>
                        Add Exp.
                      </button>
                      <button className="action-btn" onClick={() => setIsTopUpOpen(true)}>
                        <div className="action-icon"><ArrowUpRight size={20} color="var(--success)"/></div>
                        Top Up
                      </button>
                      <button className="action-btn" onClick={() => setIsTransferOpen(true)}>
                        <div className="action-icon"><ArrowRightLeft size={20} color="var(--accent-blue-gray)"/></div>
                        Transfer
                      </button>
                      <button className="action-btn" onClick={exportToCSV}>
                        <div className="action-icon"><Download size={20} color="var(--accent-dark-green)"/></div>
                        Export
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
                            <div className="transaction-avatar" style={{background: tx.category === 'Income' ? 'var(--success)' : tx.category.includes('Transfer') ? 'var(--accent-blue-gray)' : `hsl(${i * 60 + 10}, 70%, 50%)`, color: '#fff'}}>
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
                <div className="widget-card" style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
                  <div className="widget-header" style={{marginBottom:'0.5rem'}}>
                    <span className="widget-title" style={{color:'var(--text-secondary)', fontWeight:'500'}}>Total Allocated</span>
                    <div style={{background:'var(--danger-light)', padding:'0.5rem', borderRadius:'50%'}}>
                      <ArrowDownRight size={16} color="var(--danger)"/>
                    </div>
                  </div>
                  
                  {/* RECHARTS DONUT CHART */}
                  {donutChartData.length > 0 ? (
                    <div style={{ height: '200px', width: '100%', marginTop: '1rem', marginBottom: '1rem' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {donutChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value) => formatIDR(value)}
                            contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div style={{ height: '200px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', fontSize:'0.9rem' }}>
                       No spending yet
                    </div>
                  )}

                  <div className="spending-amount" style={{textAlign:'center'}}>{formatIDR(totals.allocated)}</div>
                  <div className="spending-trend" style={{textAlign:'center'}}>
                    {usagePercentage}% of Pool ({formatIDR(effectiveTotalIncome)})
                  </div>
                  
                  <div style={{marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid var(--border-color)', textAlign:'center'}}>
                    <div style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>Non-allocated / Remaining</div>
                    <div style={{fontSize:'1.5rem', fontWeight:'600', color:'var(--success)', marginTop:'0.25rem'}}>
                      {formatIDR(nonAllocated)}
                    </div>
                  </div>
                </div>

                <div className="widget-card">
                  <div className="widget-header">
                    <span className="widget-title">Budget Categories</span>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                    {categories.length === 0 && <span style={{color:'var(--text-secondary)'}}>No categories yet.</span>}
                    {categories.map((cat, i) => {
                      const amount = totals.categoryTotals[cat.name] || 0;
                      const targetAmount = (cat.targetPercentage / 100) * effectiveTotalIncome;
                      const percent = targetAmount > 0 ? (amount / targetAmount) * 100 : 0;
                      const color = CHART_COLORS[i % CHART_COLORS.length];

                      return (
                        <div key={cat.id} style={{display:'flex', alignItems:'center', gap:'1rem'}}>
                          <div style={{width:'40px', height:'40px', borderRadius:'50%', background:color, color: i===0?'black':'white', display:'grid', placeContent:'center', fontWeight:'600'}}>
                            {getInitial(cat.name)}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', marginBottom:'0.25rem'}}>
                              <span style={{fontWeight:'500'}}>{cat.name} ({cat.targetPercentage}%)</span>
                              <span>{formatIDR(amount)}</span>
                            </div>
                            <div style={{height:'6px', background:'var(--bg-input)', borderRadius:'3px', overflow:'hidden'}}>
                              <div style={{height:'100%', width:`${Math.min(percent, 100)}%`, background:color}}></div>
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
                <tr>
                  <th style={{width:'60px'}}>Status</th>
                  <th>Date</th>
                  <th>Name</th>
                  <th>Account</th>
                  <th>Category</th>
                  <th style={{textAlign:'right'}}>Amount</th>
                  <th style={{width:'60px'}}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan="7" style={{textAlign:'center', padding:'3rem', color:'var(--text-secondary)'}}>No matching transactions found.</td></tr>
                ) : (
                  filteredTransactions.map(tx => {
                    const isIncome = tx.category === 'Income';
                    const isTransfer = tx.category.includes('Transfer');
                    const isTransferIn = tx.category === 'Transfer In';
                    
                    return (
                      <tr key={tx.id}>
                        <td>
                          {isIncome || isTransfer ? (
                             <div style={{width:'24px', height:'24px', borderRadius:'50%', background: isIncome ? 'var(--success)' : 'var(--accent-blue-gray)', color:'white', display:'grid', placeContent:'center', fontSize:'12px'}}>
                               <CheckCircle2 size={16} />
                             </div>
                          ) : (
                             <input type="checkbox" className="custom-checkbox" checked={tx.isPaid} onChange={() => togglePaid(tx.id, tx.isPaid)} />
                          )}
                        </td>
                        <td style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>{tx.date}</td>
                        <td>
                          <span className={tx.isPaid && !isIncome && !isTransfer ? 'paid' : ''} style={{fontWeight:'500', textDecoration: tx.isPaid && !isIncome && !isTransfer ? 'line-through' : 'none', color: tx.isPaid && !isIncome && !isTransfer ? 'var(--text-secondary)' : 'var(--text-primary)'}}>
                            {tx.name}
                          </span>
                        </td>
                        <td>{tx.account}</td>
                        <td>
                          <span style={{background: isIncome ? (isDarkMode ? 'rgba(52, 211, 153, 0.1)' : '#dcfce7') : isTransfer ? (isDarkMode ? 'rgba(58, 117, 135, 0.2)' : '#e0f2fe') : 'var(--hover-bg)', color: isIncome ? 'var(--success)' : isTransfer ? 'var(--accent-blue-gray)' : 'var(--text-primary)', padding:'0.2rem 0.8rem', borderRadius:'99px', fontSize:'0.8rem', fontWeight:'600'}}>
                            {tx.category}
                          </span>
                        </td>
                        <td style={{textAlign:'right', fontWeight:'600', color: isIncome || isTransferIn ? 'var(--success)' : 'var(--danger)'}}>
                          {isIncome || isTransferIn ? '+' : '-'} {formatIDR(tx.amount)}
                        </td>
                        <td style={{textAlign:'right'}}>
                          <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)'}} onClick={() => removeTransaction(tx.id)}>
                            <Trash2 size={18}/>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : activeView === 'profile' ? (
          <div className="widget-card" style={{maxWidth:'600px', margin:'0 auto', textAlign:'center', padding:'3rem'}}>
            <div style={{width:'100px', height:'100px', borderRadius:'50%', margin:'0 auto 1.5rem', background:'var(--accent-lime)', color:'#0f172a', display:'grid', placeContent:'center', fontSize:'3rem', fontWeight:'700', overflow:'hidden'}}>
               {getInitial(user.name)}
            </div>
            <h2 style={{fontSize:'1.8rem', fontWeight:'700', marginBottom:'0.25rem'}}>{user.name}</h2>
            <span style={{display:'inline-block', background:'var(--bg-main)', padding:'0.25rem 1rem', borderRadius:'99px', fontSize:'0.85rem', fontWeight:'600', marginBottom:'3rem', marginTop:'0.5rem'}}>
              {user.role} Account
            </span>

            <div style={{display:'flex', gap:'1rem', justifyContent:'center'}}>
              <button className="btn-primary" onClick={() => setIsSettingsOpen(true)} style={{color: 'white'}}>
                <Settings size={18}/> Manage Settings
              </button>
              <button className="btn-danger" onClick={handleLogout} style={{padding:'0.75rem 1.5rem'}}>
                <LogOut size={18}/> Logout
              </button>
            </div>
          </div>
        ) : null}
      </main>

      {/* ADD EXPENSE MODAL */}
      {isAddOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Add New Expense</h2>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={() => setIsAddOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={addExpense}>
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
              <button type="submit" className="btn-primary" style={{width: '100%', color: 'white'}}>
                Add Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOP UP MODAL */}
      {isTopUpOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Top Up / Add Income</h2>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={() => setIsTopUpOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={addTopUp}>
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
              <button type="submit" className="btn-primary" style={{width: '100%', background:'var(--success)', color: 'white'}}>
                Add Income
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {isTransferOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Transfer Funds</h2>
              <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={() => setIsTransferOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={addTransfer}>
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
              <p style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'1.5rem', fontStyle:'italic'}}>
                * Transaksi transfer tidak akan mempengaruhi total persentase anggaran (budget donat) Anda.
              </p>
              <button type="submit" className="btn-primary" style={{width: '100%', background:'var(--accent-blue-gray)', color: 'white'}}>
                Transfer
              </button>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && renderSettingsModal()}
    </div>
  );
}

export default App;

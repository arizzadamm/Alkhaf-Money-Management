import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Hooks
import { useToast } from './hooks/useToast.jsx';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useFinance } from './hooks/useFinance';
import { useAdmin } from './hooks/useAdmin';
import { useTelegram } from './hooks/useTelegram';

// Utils
import { exportTransactionsToCSV } from './utils/csv';

// Auth
import { LoginScreen } from './components/auth/LoginScreen';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { MobileHeader } from './components/layout/MobileHeader';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Views
import { HomeView } from './components/views/HomeView';
import { TransactionsView } from './components/views/TransactionsView';
import { AdminView } from './components/views/AdminView';
import { ProfileView } from './components/views/ProfileView';

// Modals
import { SettingsModal } from './components/modals/SettingsModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { TopUpModal } from './components/modals/TopUpModal';
import { TransferModal } from './components/modals/TransferModal';
import { EditTransactionModal } from './components/modals/EditTransactionModal';
import { ChangePasswordModal } from './components/modals/ChangePasswordModal';

// UI
import { ToastContainer } from './components/ui/ToastContainer';
import { NotificationPanel } from './components/NotificationPanel';

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Core hooks
  const { toasts, addToast, removeToast } = useToast();
  const { isDarkMode, toggleTheme } = useTheme();
  const auth = useAuth(addToast);
  const finance = useFinance(auth.user, addToast, auth.getStoredSessionProof);
  const admin = useAdmin(auth.user, auth.getStoredSessionProof);
  const telegram = useTelegram(auth.user, auth.isAdmin, auth.getStoredSessionProof);

  // View state
  const [activeView, setActiveView] = useState('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('accounts');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState(new Set());

  // Set initial view based on role
  useEffect(() => {
    if (auth.user) {
      if (auth.isAdmin && activeView === 'home') setActiveView('admin');
    }
  }, [auth.user, auth.isAdmin]);

  // Data fetching effect
  useEffect(() => {
    if (!auth.user) return;

    const handle = window.setTimeout(() => {
      auth.setIsLoading(true);
      if (auth.isAdmin) {
        admin.fetchAdminUsers().finally(() => auth.setIsLoading(false));
        return;
      }

      Promise.all([
        finance.fetchSettings(),
        finance.fetchTransactions(),
        finance.fetchGlobalTransactions()
      ]).then(() => finance.autoGenerateIncome()).finally(() => auth.setIsLoading(false));
    }, 0);

    return () => window.clearTimeout(handle);
  }, [auth.user, finance.monthOffset]);

  // Fetch telegram connections when profile view is active
  useEffect(() => {
    if (!auth.user || auth.isAdmin || activeView !== 'profile') return;
    const handle = window.setTimeout(() => {
      telegram.fetchTelegramConnections();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [activeView, auth.user, auth.isAdmin]);

  // Budget alert toasts
  const budgetAlertShownRef = useRef(false);
  useEffect(() => {
    if (!auth.user || auth.isAdmin || finance.budgetAlerts.length === 0 || auth.isLoading) return;
    if (budgetAlertShownRef.current) return;
    const alerts = finance.budgetAlerts.filter(a => a.status === 'over' || a.status === 'warning');
    if (alerts.length > 0) {
      budgetAlertShownRef.current = true;
      alerts.slice(0, 3).forEach((a, i) => {
        setTimeout(() => {
          addToast(a.name + ': ' + a.percent.toFixed(0) + '% dari budget', a.status === 'over' ? 'error' : 'warning');
        }, (i + 1) * 800);
      });
    }
  }, [finance.budgetAlerts, auth.user, auth.isAdmin, auth.isLoading, addToast]);

  // Logout handler that also resets local state
  const handleLogout = async () => {
    await auth.handleLogout();
    setActiveView('home');
    admin.setAdminUsers([]);
    admin.setEditingAdminUserId(null);
    admin.setAdminError('');
    admin.setAdminSuccess('');
    finance.setBaseTotalIncome(0);
    finance.setAccounts([]);
    finance.setCategories([]);
    finance.setGoals([]);
    finance.setTransactions([]);
    finance.setGlobalTransactions([]);
  };

  // Export CSV helper
  const exportToCSV = () => exportTransactionsToCSV(finance.transactions, finance.viewMonthName, addToast);

  // Form handlers that bridge modals to finance actions
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const amount = Number(e.target.amount.value);
    const account = e.target.account.value;
    const category = e.target.category.value;
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (name && amount) {
      setIsAddOpen(false);
      await finance.insertTransactions([{ name, amount, account, category, is_paid: true, date, budget_month: budgetMonth }]);
    }
  };

  const handleAddTopUp = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const amount = Number(e.target.amount.value);
    const account = e.target.account.value;
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (name && amount) {
      setIsTopUpOpen(false);
      await finance.insertTransactions([{ name, amount, account, category: 'Income', is_paid: true, date, budget_month: budgetMonth }]);
    }
  };

  const handleAddTransfer = async (e) => {
    e.preventDefault();
    const fromAcc = e.target.fromAcc.value;
    const toAcc = e.target.toAcc.value;
    const amount = Number(e.target.amount.value);
    const budgetMonth = e.target.budget_month.value;
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (fromAcc === toAcc) return addToast('Akun asal dan tujuan harus berbeda.', 'error');
    if (amount > 0) {
      setIsTransferOpen(false);
      await finance.insertTransactions([
        { name: `Transfer to ${toAcc}`, amount, account: fromAcc, category: 'Transfer Out', is_paid: true, date, budget_month: budgetMonth },
        { name: `Transfer from ${fromAcc}`, amount, account: toAcc, category: 'Transfer In', is_paid: true, date, budget_month: budgetMonth }
      ]);
    }
  };

  // Login screen
  if (!auth.user) {
    return <LoginScreen loginError={auth.loginError} rememberMe={auth.rememberMe} setRememberMe={auth.setRememberMe} handleLogin={auth.handleLogin} />;
  }

  // Shared view props
  const viewProps = {
    isMobile,
    accounts: finance.accounts,
    categories: finance.categories,
    goals: finance.goals,
    filteredTransactions: finance.filteredTransactions,
    groupedTransactions: finance.groupedTransactions,
    transactionChartData: finance.transactionChartData,
    transactionPeriodSummary: finance.transactionPeriodSummary,
    totalBalance: finance.totalBalance,
    currentAccountBalances: finance.currentAccountBalances,
    effectiveTotalIncome: finance.effectiveTotalIncome,
    totals: finance.totals,
    donutChartData: finance.donutChartData,
    usagePercentage: finance.usagePercentage,
    viewMonthName: finance.viewMonthName,
    timelineMonths: finance.timelineMonths,
    monthOffset: finance.monthOffset,
    setMonthOffset: finance.setMonthOffset,
    transactionGroupBy: finance.transactionGroupBy,
    setTransactionGroupBy: finance.setTransactionGroupBy,
    filterCategory: finance.filterCategory, setFilterCategory: finance.setFilterCategory,
    filterAccount: finance.filterAccount, setFilterAccount: finance.setFilterAccount,
    filterType: finance.filterType, setFilterType: finance.setFilterType,
    filterStatus: finance.filterStatus, setFilterStatus: finance.setFilterStatus,
    sortBy: finance.sortBy, setSortBy: finance.setSortBy,
    sortOrder: finance.sortOrder, setSortOrder: finance.setSortOrder,
    activeFilterCount: finance.activeFilterCount, clearAllFilters: finance.clearAllFilters,
    togglePaid: finance.togglePaid,
    removeTransaction: finance.removeTransaction,
    openEditTransaction: finance.openEditTransaction,
    quickAddGoalFund: finance.quickAddGoalFund,
    setIsAddOpen, setIsTopUpOpen, setIsTransferOpen,
    setIsSettingsOpen, setSettingsTab,
    setActiveView,
    exportToCSV,
  };

  const renderActiveView = () => {
    if (auth.isLoading) {
      return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'50vh', color:'var(--text-secondary)'}}>{auth.isAdmin ? 'Loading admin data...' : `Loading ${finance.viewMonthName} data...`}</div>;
    }

    switch (activeView) {
      case 'home': return <HomeView {...viewProps} />;
      case 'transactions': return <TransactionsView {...viewProps} />;
      case 'admin': return (
        <AdminView
          isMobile={isMobile}
          adminUsers={admin.adminUsers}
          editingAdminUserId={admin.editingAdminUserId}
          adminError={admin.adminError}
          adminSuccess={admin.adminSuccess}
          handleAdminUserSubmit={admin.handleAdminUserSubmit}
          startEditAdminUser={admin.startEditAdminUser}
          cancelEditAdminUser={admin.cancelEditAdminUser}
          deleteAdminUser={admin.deleteAdminUser}
          fetchAdminUsers={admin.fetchAdminUsers}
        />
      );
      case 'profile': return (
        <ProfileView
          isMobile={isMobile}
          user={auth.user}
          handleLogout={handleLogout}
          telegramProps={telegram}
        />
      );
      default: return null;
    }
  };

  return (
    <div className="app-layout">
      {isMobile ? (
        <>
          <main className="main-content">
            <MobileHeader user={auth.user} isAdmin={auth.isAdmin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} setIsNotificationOpen={setIsNotificationOpen} />
            {renderActiveView()}
          </main>
          <MobileBottomNav
            isAdmin={auth.isAdmin} activeView={activeView} setActiveView={setActiveView}
            handleLogout={handleLogout} fetchAdminUsers={admin.fetchAdminUsers}
            setIsTopUpOpen={setIsTopUpOpen} setIsSettingsOpen={setIsSettingsOpen}
          />
        </>
      ) : (
        <>
          <Sidebar
            user={auth.user} isAdmin={auth.isAdmin} activeView={activeView} setActiveView={setActiveView}
            totalBalance={finance.totalBalance} notifications={finance.notifications}
            readNotifications={readNotifications} setReadNotifications={setReadNotifications}
            handleLogout={handleLogout} fetchAdminUsers={admin.fetchAdminUsers}
          />
          <main className="main-content">
            <TopBar
              activeView={activeView} viewMonthName={finance.viewMonthName} isAdmin={auth.isAdmin}
              searchQuery={finance.searchQuery} setSearchQuery={finance.setSearchQuery} setActiveView={setActiveView}
              isDarkMode={isDarkMode} toggleTheme={toggleTheme} setIsSettingsOpen={setIsSettingsOpen}
            />
            {renderActiveView()}
          </main>
        </>
      )}

      {/* Modals */}
      {!auth.isAdmin && isAddOpen && (
        <AddExpenseModal accounts={finance.accounts} categories={finance.categories} timelineMonths={finance.timelineMonths} activeBudgetMonth={finance.activeBudgetMonth} onSubmit={handleAddExpense} onClose={() => setIsAddOpen(false)} />
      )}
      {!auth.isAdmin && isTopUpOpen && (
        <TopUpModal accounts={finance.accounts} timelineMonths={finance.timelineMonths} activeBudgetMonth={finance.activeBudgetMonth} onSubmit={handleAddTopUp} onClose={() => setIsTopUpOpen(false)} />
      )}
      {!auth.isAdmin && isTransferOpen && (
        <TransferModal accounts={finance.accounts} timelineMonths={finance.timelineMonths} activeBudgetMonth={finance.activeBudgetMonth} onSubmit={handleAddTransfer} onClose={() => setIsTransferOpen(false)} />
      )}
      {!auth.isAdmin && isSettingsOpen && (
        <SettingsModal
          settingsTab={settingsTab} setSettingsTab={setSettingsTab}
          baseTotalIncome={finance.baseTotalIncome} setBaseTotalIncome={finance.setBaseTotalIncome}
          accounts={finance.accounts} setAccounts={finance.setAccounts}
          categories={finance.categories} setCategories={finance.setCategories}
          goals={finance.goals} setGoals={finance.setGoals}
          sumOfAccounts={finance.sumOfAccounts} sumOfCategories={finance.sumOfCategories}
          onSave={() => finance.saveSettings(() => setIsSettingsOpen(false))}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      {finance.isEditOpen && finance.editingTransaction && (
        <EditTransactionModal
          editingTransaction={finance.editingTransaction}
          accounts={finance.accounts} categories={finance.categories}
          timelineMonths={finance.timelineMonths} activeBudgetMonth={finance.activeBudgetMonth}
          onSubmit={finance.handleEditTransaction}
          onClose={() => { finance.setIsEditOpen(false); finance.setEditingTransaction(null); }}
        />
      )}
      {auth.isChangePasswordOpen && (
        <ChangePasswordModal changePasswordError={auth.changePasswordError} onSubmit={auth.handleChangePassword} onClose={() => auth.setIsChangePasswordOpen(false)} />
      )}

      {/* Mobile Notification Panel */}
      {isMobile && isNotificationOpen && (
        <NotificationPanel
          notifications={finance.notifications}
          readNotifications={readNotifications}
          setReadNotifications={setReadNotifications}
          onClose={() => setIsNotificationOpen(false)}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;


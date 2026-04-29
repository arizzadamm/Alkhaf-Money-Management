import React from 'react';
import { Plus, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Download, CheckCircle2, Target, Eye, ChevronRight, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { formatIDR, getInitial } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/constants';

export const HomeView = ({
  isMobile,
  accounts, categories, goals,
  filteredTransactions,
  totalBalance, monthlyBalance, displayBalance, displayBalanceLabel, showTotalBalance, setShowTotalBalance, currentAccountBalances,
  effectiveTotalIncome, totals, donutChartData,
  usagePercentage, timelineMonths, monthOffset, setMonthOffset,
  quickAddGoalFund,
  setIsAddOpen, setIsTopUpOpen, setIsTransferOpen,
  setIsSettingsOpen, setSettingsTab,
  setActiveView, exportToCSV,
}) => {
  if (isMobile) {
    return (
      <>
        <div className="mobile-balance">
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem'}}>
            <span style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>{displayBalanceLabel}</span>
            <button onClick={() => setShowTotalBalance(!showTotalBalance)} style={{background:'none', border:'1px solid var(--border-color)', borderRadius:'999px', padding:'0.2rem 0.6rem', fontSize:'0.7rem', fontWeight:'600', color:'var(--text-secondary)', cursor:'pointer'}}>
              {showTotalBalance ? 'Bulan Ini' : 'Total'}
            </button>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:'2.5rem', fontWeight:'800', color:'var(--text-primary)', letterSpacing:'-1px'}}>{formatIDR(displayBalance)}</div>
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
                <div className="promo-title">Telegram Auto Tracking</div>
                <div className="promo-subtitle">Track your finances as easily as sending a message.</div>
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
    );
  }

  // Desktop
  return (
    <>
      <div className="hero-card">
        <div className="hero-card-pattern"></div>
        <div className="hero-card-copy">
          <div className="hero-card-eyebrow">AlkaFlow</div>
          <h2 className="hero-card-title">Your Financial Flow</h2>
          <p className="hero-card-subtitle">Track income and expenses automatically from Telegram.</p>
        </div>
        <div className="hero-card-metric" style={{cursor:'pointer'}} onClick={() => setShowTotalBalance(!showTotalBalance)}>
          <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
            <div className="hero-card-metric-label">{displayBalanceLabel}</div>
            <span style={{background:'rgba(255,255,255,0.15)', borderRadius:'999px', padding:'0.15rem 0.5rem', fontSize:'0.7rem', fontWeight:'600'}}>{showTotalBalance ? 'Bulan Ini' : 'Total'}</span>
          </div>
          <div className="hero-card-metric-value">{formatIDR(displayBalance)}</div>
          <div className="hero-card-metric-trend">{showTotalBalance ? 'Kumulatif semua bulan' : 'Income - Expense bulan ini'}</div>
        </div>
      </div>

      <div className="money-overview-card" style={{background:'var(--accent-dark-green)', borderRadius:'var(--border-radius-lg)', padding:'2rem', color:'white', marginBottom:'1.5rem', display:'flex', gap:'2rem', alignItems:'center', flexWrap:'wrap'}}>
         <div style={{flex:1, minWidth:'250px'}}>
           <h3 style={{fontSize:'1.5rem', fontWeight:'700', marginBottom:'0.5rem', letterSpacing:'-0.02em'}}>Money Overview</h3>
           <p className="money-overview-subtitle">Total Pool: {formatIDR(effectiveTotalIncome)}</p>
         </div>
         <div className="money-overview-timeline" style={{display:'flex', gap:'1rem'}}>
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
                <div key={acc.id} className={`bank-card color-${index % 4} ${index === 0 ? 'bank-card-primary' : index === 1 ? 'bank-card-accent' : 'bank-card-muted'}`}>
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
            <div className="widget-card action-panel-card">
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
                  <div key={tx.id} className="transaction-item transaction-item-card">
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

          <div className="widget-card chart-card" style={{display:'flex', flexDirection:'column', justifyContent:'center'}}>
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
  );
};

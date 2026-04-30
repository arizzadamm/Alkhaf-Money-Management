import React, { useState } from 'react';
import { Plus, ArrowUpRight, ArrowRightLeft, Download, Trash2, CheckCircle2, Pencil, X, SlidersHorizontal, ChevronDown, ChevronUp, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { formatIDR, getInitial } from '../../utils/formatters';

export const TransactionsView = ({
  isMobile,
  filteredTransactions, groupedTransactions, transactionChartData, transactionPeriodSummary,
  viewMonthName, transactionGroupBy, setTransactionGroupBy,
  categories, accounts,
  filterCategory, setFilterCategory,
  filterAccount, setFilterAccount,
  filterType, setFilterType,
  filterStatus, setFilterStatus,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  activeFilterCount, clearAllFilters,
  togglePaid, removeTransaction, openEditTransaction,
  setIsAddOpen, setIsTopUpOpen, setIsTransferOpen,
  exportToCSV,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);

  if (isMobile) {
    return (
      <div className="mobile-transactions-page">
        {/* Header */}
        <div className="mobile-transactions-header">
          <div>
            <h2 className="mobile-transactions-title">Transactions</h2>
            <p className="mobile-transactions-subtitle">{filteredTransactions.length} transaksi di {viewMonthName}</p>
          </div>
          <button type="button" className="mobile-transactions-export" onClick={exportToCSV}>
            <Download size={18} />
            Export
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mobile-transaction-actions">
          <button type="button" className="mobile-transaction-action action-income" onClick={() => setIsTopUpOpen(true)}>
            <ArrowUpRight size={18} />
            Top Up
          </button>
          <button type="button" className="mobile-transaction-action action-expense" onClick={() => setIsAddOpen(true)}>
            <Plus size={18} />
            Expense
          </button>
          <button type="button" className="mobile-transaction-action action-transfer" onClick={() => setIsTransferOpen(true)}>
            <ArrowRightLeft size={18} />
            Transfer
          </button>
        </div>

        {/* Cashflow Summary Card */}
        <div className="mobile-cashflow-card">
          <button
            type="button"
            className="mobile-cashflow-header"
            onClick={() => setShowChart(!showChart)}
            aria-expanded={showChart}
            aria-label="Toggle cashflow chart"
          >
            <div className="mobile-cashflow-title-row">
              <BarChart3 size={18} />
              <span>Cashflow</span>
            </div>
            {showChart ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          <div className="mobile-cashflow-stats">
            <div className="mobile-cashflow-stat">
              <div className="mobile-cashflow-stat-icon income"><TrendingUp size={14} /></div>
              <div>
                <span className="mobile-cashflow-stat-label">Income</span>
                <strong className="income">{formatIDR(transactionPeriodSummary.income)}</strong>
              </div>
            </div>
            <div className="mobile-cashflow-stat">
              <div className="mobile-cashflow-stat-icon expense"><TrendingDown size={14} /></div>
              <div>
                <span className="mobile-cashflow-stat-label">Expense</span>
                <strong className="expense">{formatIDR(transactionPeriodSummary.expense)}</strong>
              </div>
            </div>
            <div className="mobile-cashflow-stat">
              <div className="mobile-cashflow-stat-icon net"><Minus size={14} /></div>
              <div>
                <span className="mobile-cashflow-stat-label">Net</span>
                <strong>{formatIDR(transactionPeriodSummary.income - transactionPeriodSummary.expense)}</strong>
              </div>
            </div>
          </div>
          {showChart && (
            <div className="mobile-cashflow-chart">
              {transactionChartData.length === 0 ? (
                <div className="mobile-transactions-empty" style={{minHeight:'120px'}}>Tidak ada data grafik.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={transactionChartData} margin={{ top: 8, right: 4, left: -24, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <RechartsTooltip formatter={(v) => formatIDR(v)} />
                    <Bar dataKey="Income" fill="var(--success)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expense" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>

        {/* Period Toggle + Filter Toggle */}
        <div className="mobile-toolbar-row">
          <div className="mobile-period-toggle">
            {[
              { value: 'day', label: 'Harian' },
              { value: 'week', label: 'Mingguan' },
              { value: 'month', label: 'Bulanan' }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={transactionGroupBy === option.value ? 'active' : ''}
                onClick={() => setTransactionGroupBy(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`mobile-filter-toggle-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && <span className="mobile-filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="mobile-filter-panel">
            <div className="mobile-filter-grid">
              <div className="mobile-filter-item">
                <label>Kategori</label>
                <select className={`filter-select ${filterCategory ? 'active' : ''}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">Semua</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  <option value="Income">Income</option>
                </select>
              </div>
              <div className="mobile-filter-item">
                <label>Akun</label>
                <select className={`filter-select ${filterAccount ? 'active' : ''}`} value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
                  <option value="">Semua</option>
                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div className="mobile-filter-item">
                <label>Tipe</label>
                <select className={`filter-select ${filterType ? 'active' : ''}`} value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="">Semua</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div className="mobile-filter-item">
                <label>Status</label>
                <select className={`filter-select ${filterStatus ? 'active' : ''}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">Semua</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>
            <div className="mobile-sort-row">
              <span className="mobile-sort-label">Urutkan:</span>
              <div className="mobile-sort-toggle">
                {['date','amount','name'].map(s => (
                  <button
                    key={s}
                    className={sortBy === s ? 'active' : ''}
                    onClick={() => { setSortBy(s); setSortOrder(prev => sortBy === s ? (prev === 'desc' ? 'asc' : 'desc') : 'desc'); }}
                  >
                    {s === 'date' ? 'Tanggal' : s === 'amount' ? 'Nominal' : 'Nama'}
                    {sortBy === s ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : ''}
                  </button>
                ))}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button className="mobile-filter-clear" onClick={clearAllFilters}>
                <X size={14} /> Reset Filter ({activeFilterCount})
              </button>
            )}
          </div>
        )}

        {/* Grouped Transactions List */}
        <div className="mobile-transactions-list">
          {groupedTransactions.length === 0 ? (
            <div className="mobile-transactions-empty">Belum ada transaksi untuk filter ini.</div>
          ) : (
            groupedTransactions.map((group) => (
              <div className="mobile-transaction-group" key={group.key}>
                <button
                  type="button"
                  className="mobile-transaction-group-header"
                  onClick={() => setExpandedGroup(expandedGroup === group.key ? null : group.key)}
                  aria-expanded={expandedGroup === group.key || expandedGroup === null}
                  aria-label={`Toggle group ${group.label}`}
                >
                  <div className="mobile-group-header-left">
                    <h3>{group.label}</h3>
                    <span>{group.count} transaksi</span>
                  </div>
                  <div className="mobile-group-header-right">
                    <div className="mobile-group-totals">
                      <span className="income">+{formatIDR(group.income)}</span>
                      <span className="expense">-{formatIDR(group.expense)}</span>
                    </div>
                    {expandedGroup === group.key ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {(expandedGroup === group.key || expandedGroup === null) && (
                  <div className="mobile-transaction-group-items">
                    {group.transactions.map((tx, i) => (
                      <article key={tx.id} className="mobile-transaction-card">
                        <div className="mobile-transaction-main">
                          <div
                            className="transaction-avatar"
                            style={{
                              background:
                                tx.category === 'Income'
                                  ? 'var(--success)'
                                  : tx.category.includes('Transfer')
                                    ? 'var(--accent-blue-gray)'
                                    : `hsl(${i * 60 + 10}, 70%, 50%)`
                            }}
                          >
                            {getInitial(tx.name.replace('Transfer to ', '').replace('Transfer from ', ''))}
                          </div>
                          <div className="mobile-transaction-copy">
                            <div className="mobile-transaction-topline">
                              <span className={`transaction-name ${tx.isPaid ? 'paid' : ''}`}>{tx.name}</span>
                              <span className={`transaction-amount ${tx.category === 'Income' || tx.category === 'Transfer In' ? 'income' : 'expense'}`}>
                                {tx.category === 'Income' || tx.category === 'Transfer In' ? '+' : '-'} {formatIDR(tx.amount)}
                              </span>
                            </div>
                            <div className="mobile-transaction-meta">
                              <span>{tx.date}</span>
                              <span>{tx.account}</span>
                              <span>{tx.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mobile-transaction-controls">
                          {tx.category === 'Income' || tx.category.includes('Transfer') ? (
                            <span className="mobile-transaction-status success">
                              <CheckCircle2 size={16} />
                              Completed
                            </span>
                          ) : (
                            <label className="mobile-transaction-toggle">
                              <input
                                type="checkbox"
                                className="custom-checkbox"
                                checked={tx.isPaid}
                                onChange={() => togglePaid(tx.id, tx.isPaid)}
                              />
                              <span>{tx.isPaid ? 'Paid' : 'Mark paid'}</span>
                            </label>
                          )}
                          <div className="mobile-transaction-actions-row">
                            <button
                              type="button"
                              className="mobile-transaction-edit"
                              onClick={() => openEditTransaction(tx)}
                              aria-label={`Edit ${tx.name}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              className="mobile-transaction-delete"
                              onClick={() => removeTransaction(tx.id)}
                              aria-label={`Delete ${tx.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Period Breakdown */}
        {groupedTransactions.length > 0 && (
          <div className="mobile-breakdown-card">
            <div className="mobile-breakdown-header">
              <span>Period Breakdown</span>
            </div>
            <div className="mobile-breakdown-list">
              {groupedTransactions.slice(0, 6).map((group) => {
                const total = group.income + group.expense || 1;
                const expensePercent = Math.round((group.expense / total) * 100);
                return (
                  <div className="mobile-breakdown-item" key={group.key}>
                    <div className="mobile-breakdown-item-header">
                      <strong>{group.label}</strong>
                      <span>{group.count} transaksi</span>
                    </div>
                    <div className="mobile-breakdown-bar">
                      <span style={{width: `${expensePercent}%`}}></span>
                    </div>
                    <small>{formatIDR(group.expense)} expense</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop
  return (
    <div className="transactions-workspace">
      <section className="widget-card transactions-list-panel">
        <div className="widget-header transactions-toolbar">
          <div>
            <span className="widget-title">Transactions List ({filteredTransactions.length})</span>
            <div className="transactions-toolbar-subtitle">{groupedTransactions.length} periode di {viewMonthName}</div>
          </div>
          <div className="transactions-toolbar-actions">
            <div className="period-toggle" aria-label="Group transactions">
              {[
                { value: 'day', label: 'Harian' },
                { value: 'week', label: 'Mingguan' },
                { value: 'month', label: 'Bulanan' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={transactionGroupBy === option.value ? 'active' : ''}
                  onClick={() => setTransactionGroupBy(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={() => setIsTransferOpen(true)} style={{background:'var(--accent-blue-gray)'}}><ArrowRightLeft size={16}/> Transfer</button>
            <button className="btn-primary" onClick={() => setIsAddOpen(true)}><Plus size={16}/> Add Expense</button>
            <button className="btn-primary" style={{background:'var(--success)'}} onClick={() => setIsTopUpOpen(true)}><ArrowUpRight size={16}/> Top Up</button>
          </div>
        </div>

        <div className="filter-bar">
          <select className={`filter-select ${filterCategory ? 'active' : ''}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            <option value="Income">Income</option>
          </select>
          <select className={`filter-select ${filterAccount ? 'active' : ''}`} value={filterAccount} onChange={e => setFilterAccount(e.target.value)}>
            <option value="">Semua Akun</option>
            {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
          <select className={`filter-select ${filterType ? 'active' : ''}`} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Semua Tipe</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </select>
          <select className={`filter-select ${filterStatus ? 'active' : ''}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <div className="sort-toggle">
            {['date','amount','name'].map(s => <button key={s} className={sortBy === s ? 'active' : ''} onClick={() => { setSortBy(s); setSortOrder(prev => sortBy === s ? (prev === 'desc' ? 'asc' : 'desc') : 'desc'); }}>{s === 'date' ? 'Tanggal' : s === 'amount' ? 'Nominal' : 'Nama'}{sortBy === s ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : ''}</button>)}
          </div>
          {activeFilterCount > 0 && <button className="filter-clear-btn" onClick={clearAllFilters}><X size={14}/> Reset ({activeFilterCount})</button>}
        </div>

        {groupedTransactions.length === 0 ? (
          <div className="transactions-empty-state">Belum ada transaksi untuk filter ini.</div>
        ) : (
          <div className="transactions-group-list">
            {groupedTransactions.map((group) => (
              <section className="transaction-period-group" key={group.key}>
                <div className="transaction-period-header">
                  <div>
                    <h3>{group.label}</h3>
                    <span>{group.count} transaksi</span>
                  </div>
                  <div className="transaction-period-totals">
                    <span className="income">+ {formatIDR(group.income)}</span>
                    <span className="expense">- {formatIDR(group.expense)}</span>
                  </div>
                </div>
                <table className="full-transactions-table">
                  <thead>
                    <tr><th style={{width:'60px'}}>Status</th><th>Date</th><th>Name</th><th>Account</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th><th style={{width:'60px'}}></th></tr>
                  </thead>
                  <tbody>
                    {group.transactions.map(tx => (
                      <tr key={tx.id}>
                        <td>{tx.category === 'Income' || tx.category.includes('Transfer') ? <CheckCircle2 size={16} color="var(--success)"/> : <input type="checkbox" className="custom-checkbox" checked={tx.isPaid} onChange={() => togglePaid(tx.id, tx.isPaid)} />}</td>
                        <td style={{color:'var(--text-secondary)'}}>{tx.date}</td>
                        <td>{tx.name}</td>
                        <td>{tx.account}</td>
                        <td>{tx.category}</td>
                        <td style={{textAlign:'right', color: tx.category === 'Income' || tx.category === 'Transfer In' ? 'var(--success)' : 'inherit'}}>{formatIDR(tx.amount)}</td>
                         <td style={{textAlign:'right'}}><div style={{display:'inline-flex', gap:'0.35rem'}}><button style={{background:'none', border:'none', cursor:'pointer', color:'var(--accent-blue-gray)'}} onClick={() => openEditTransaction(tx)} aria-label={`Edit ${tx.name}`}><Pencil size={16}/></button><button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)'}} onClick={() => removeTransaction(tx.id)} aria-label={`Delete ${tx.name}`}><Trash2 size={18}/></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}
      </section>

      <aside className="transactions-chart-panel">
        <div className="widget-card">
          <div className="widget-header">
            <span className="widget-title">Cashflow Chart</span>
            <button type="button" className="see-all" onClick={exportToCSV} style={{background:'none', border:'none'}}>
              <Download size={16} /> Export
            </button>
          </div>
          <div className="transactions-chart-summary">
            <div>
              <span>Income</span>
              <strong className="income">{formatIDR(transactionPeriodSummary.income)}</strong>
            </div>
            <div>
              <span>Expense</span>
              <strong className="expense">{formatIDR(transactionPeriodSummary.expense)}</strong>
            </div>
            <div>
              <span>Net</span>
              <strong>{formatIDR(transactionPeriodSummary.income - transactionPeriodSummary.expense)}</strong>
            </div>
          </div>
          <div className="transactions-chart">
            {transactionChartData.length === 0 ? (
              <div className="transactions-empty-state compact">Tidak ada data grafik.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionChartData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                  <RechartsTooltip formatter={(value) => formatIDR(value)} />
                  <Bar dataKey="Income" fill="var(--success)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Expense" fill="var(--danger)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="widget-card transactions-breakdown-card">
          <div className="widget-header">
            <span className="widget-title">Period Breakdown</span>
          </div>
          <div className="transactions-breakdown-list">
            {groupedTransactions.slice(0, 6).map((group) => {
              const total = group.income + group.expense || 1;
              const expensePercent = Math.round((group.expense / total) * 100);

              return (
                <div className="transactions-breakdown-item" key={group.key}>
                  <div>
                    <strong>{group.label}</strong>
                    <span>{group.count} transaksi</span>
                  </div>
                  <div className="transactions-breakdown-bar">
                    <span style={{width: `${expensePercent}%`}}></span>
                  </div>
                  <small>{formatIDR(group.expense)} expense</small>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
};

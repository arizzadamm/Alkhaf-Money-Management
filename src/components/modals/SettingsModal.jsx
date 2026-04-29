import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { FormattedNumberInput } from '../ui/FormattedNumberInput';
import { formatIDR } from '../../utils/formatters';

export const SettingsModal = ({
  settingsTab, setSettingsTab,
  baseTotalIncome, setBaseTotalIncome,
  accounts, setAccounts,
  categories, setCategories,
  goals, setGoals,
  sumOfAccounts, sumOfCategories,
  onSave, onClose
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Settings</h2>
          <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <div className="tabs" style={{overflowX: 'auto', whiteSpace: 'nowrap'}}>
          <div className={`tab ${settingsTab === 'accounts' ? 'active' : ''}`} onClick={() => setSettingsTab('accounts')}>Accounts</div>
          <div className={`tab ${settingsTab === 'categories' ? 'active' : ''}`} onClick={() => setSettingsTab('categories')}>Budgets</div>
          <div className={`tab ${settingsTab === 'goals' ? 'active' : ''}`} onClick={() => setSettingsTab('goals')}>Goals</div>
        </div>

        {settingsTab === 'accounts' && (
          <div>
            <div style={{marginBottom: '1.5rem'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Income Bulanan (IDR)</label>
              <FormattedNumberInput value={baseTotalIncome} onChange={(num) => setBaseTotalIncome(num)} />
              <div style={{marginTop: '0.5rem', fontSize: '0.85rem', color: sumOfAccounts !== baseTotalIncome ? 'var(--danger)' : 'var(--success)'}}>
                Total akun: {formatIDR(sumOfAccounts)}
              </div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h3 style={{fontSize:'1rem', fontWeight:'600'}}>Base Accounts Setup</h3>
              <button style={{background:'var(--accent-lime)', color:'#0f172a', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}}
                      onClick={() => setAccounts([...accounts, { id: `acc-${Date.now()}`, name: 'New Account', balance: 0 }])}><Plus size={16}/></button>
            </div>
            {accounts.map(acc => (
              <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}} key={acc.id}>
                <input type="text" className="form-input" value={acc.name} onChange={(e) => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, name: e.target.value } : a))} placeholder="Account Name"/>
                <FormattedNumberInput value={acc.balance} onChange={(num) => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: num } : a))} placeholder="Initial Balance"/>
                <button className="btn-danger" onClick={() => setAccounts(accounts.filter(a => a.id !== acc.id))}><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {settingsTab === 'categories' && (
          <div>
            <div style={{marginBottom: '1.5rem'}}>
              <div style={{fontSize: '0.9rem', color: sumOfCategories !== 100 ? 'var(--danger)' : 'var(--success)'}}>Total alokasi: {sumOfCategories}%</div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h3 style={{fontSize:'1rem', fontWeight:'600'}}>Categories Setup</h3>
              <button style={{background:'var(--accent-lime)', color:'#0f172a', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}}
                      onClick={() => setCategories([...categories, { id: `cat-${Date.now()}`, name: 'New Category', targetPercentage: 0 }])}><Plus size={16}/></button>
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

        {settingsTab === 'goals' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h3 style={{fontSize:'1rem', fontWeight:'600'}}>Savings Goals Setup</h3>
              <button style={{background:'var(--accent-lime)', color:'#0f172a', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}}
                      onClick={() => setGoals([...goals, { id: `goal-${Date.now()}`, name: 'New Goal', targetAmount: 10000000, currentAmount: 0 }])}><Plus size={16}/></button>
            </div>
            {goals.map(goal => (
              <div style={{background: 'var(--hover-bg)', padding:'1rem', borderRadius:'12px', marginBottom:'1rem'}} key={goal.id}>
                <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}>
                  <input type="text" className="form-input" value={goal.name} onChange={(e) => setGoals(goals.map(g => g.id === goal.id ? { ...g, name: e.target.value } : g))} placeholder="Goal Name"/>
                  <button className="btn-danger" onClick={() => setGoals(goals.filter(g => g.id !== goal.id))}><Trash2 size={20}/></button>
                </div>
                <div style={{display:'flex', gap:'0.5rem'}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>Terkumpul</label>
                    <FormattedNumberInput value={goal.currentAmount} onChange={(num) => setGoals(goals.map(g => g.id === goal.id ? { ...g, currentAmount: num } : g))} placeholder="0"/>
                  </div>
                  <div style={{flex:1}}>
                    <label style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>Target</label>
                    <FormattedNumberInput value={goal.targetAmount} onChange={(num) => setGoals(goals.map(g => g.id === goal.id ? { ...g, targetAmount: num } : g))} placeholder="1000000"/>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn-primary" style={{width: '100%', marginTop:'2rem', padding:'1rem', color:'white'}} onClick={onSave}>Save to Supabase</button>
      </div>
    </div>
  );
};

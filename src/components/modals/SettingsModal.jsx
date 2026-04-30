import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { FormattedNumberInput } from '../ui/FormattedNumberInput';
import { formatIDR } from '../../utils/formatters';
import { useModalA11y } from '../../hooks/useModalA11y';

export const SettingsModal = ({
  settingsTab, setSettingsTab,
  baseTotalIncome, setBaseTotalIncome,
  accounts, setAccounts,
  categories, setCategories,
  goals, setGoals,
  sumOfAccounts, sumOfCategories,
  onSave, onClose
}) => {
  const { modalRef, titleId, handleOverlayClick } = useModalA11y(onClose);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 id={titleId} style={{fontSize:'1.5rem', fontWeight:'600'}}>Settings</h2>
          <button aria-label="Close dialog" style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <div className="tabs" style={{overflowX: 'auto', whiteSpace: 'nowrap'}}>
          <button type="button" className={`tab ${settingsTab === 'accounts' ? 'active' : ''}`} onClick={() => setSettingsTab('accounts')}>Accounts</button>
          <button type="button" className={`tab ${settingsTab === 'categories' ? 'active' : ''}`} onClick={() => setSettingsTab('categories')}>Budgets</button>
          <button type="button" className={`tab ${settingsTab === 'goals' ? 'active' : ''}`} onClick={() => setSettingsTab('goals')}>Goals</button>
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
              <button type="button" aria-label="Add account" style={{background:'var(--accent-lime)', color:'var(--text-on-accent)', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}}
                      onClick={() => setAccounts([...accounts, { id: `acc-${Date.now()}`, name: 'New Account', balance: 0 }])}><Plus size={16}/></button>
            </div>
            {accounts.map(acc => (
              <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}} key={acc.id}>
                <input type="text" className="form-input" value={acc.name} onChange={(e) => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, name: e.target.value } : a))} placeholder="Account Name"/>
                <FormattedNumberInput value={acc.balance} onChange={(num) => setAccounts(accounts.map(a => a.id === acc.id ? { ...a, balance: num } : a))} placeholder="Initial Balance"/>
                <button type="button" className="btn-danger" aria-label={`Delete account ${acc.name}`} onClick={() => setAccounts(accounts.filter(a => a.id !== acc.id))}><Trash2 size={20}/></button>
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
              <button type="button" aria-label="Add category" style={{background:'var(--accent-lime)', color:'var(--text-on-accent)', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}}
                      onClick={() => setCategories([...categories, { id: `cat-${Date.now()}`, name: 'New Category', targetPercentage: 0 }])}><Plus size={16}/></button>
            </div>
            {categories.map(cat => (
              <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}} key={cat.id}>
                <input type="text" className="form-input" value={cat.name} onChange={(e) => setCategories(categories.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))} placeholder="Category Name"/>
                <input type="number" className="form-input" value={cat.targetPercentage} onChange={(e) => setCategories(categories.map(c => c.id === cat.id ? { ...c, targetPercentage: Number(e.target.value) } : c))} placeholder="Percentage (e.g. 20)"/>
                <button type="button" className="btn-danger" aria-label={`Delete category ${cat.name}`} onClick={() => setCategories(categories.filter(c => c.id !== cat.id))}><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
        )}

        {settingsTab === 'goals' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
              <h3 style={{fontSize:'1rem', fontWeight:'600'}}>Savings Goals Setup</h3>
              <button type="button" aria-label="Add savings goal" style={{background:'var(--accent-lime)', color:'var(--text-on-accent)', border:'none', padding:'0.5rem', borderRadius:'8px', cursor:'pointer'}}
                      onClick={() => setGoals([...goals, { id: `goal-${Date.now()}`, name: 'New Goal', targetAmount: 10000000, currentAmount: 0 }])}><Plus size={16}/></button>
            </div>
            {goals.map(goal => (
              <div style={{background: 'var(--hover-bg)', padding:'1rem', borderRadius:'12px', marginBottom:'1rem'}} key={goal.id}>
                <div style={{display:'flex', gap:'0.5rem', marginBottom:'0.5rem'}}>
                  <input type="text" className="form-input" value={goal.name} onChange={(e) => setGoals(goals.map(g => g.id === goal.id ? { ...g, name: e.target.value } : g))} placeholder="Goal Name"/>
                  <button type="button" className="btn-danger" aria-label={`Delete goal ${goal.name}`} onClick={() => setGoals(goals.filter(g => g.id !== goal.id))}><Trash2 size={20}/></button>
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

        <button className="btn-primary" style={{width: '100%', marginTop:'2rem', padding:'1rem'}} onClick={onSave}>Save to Supabase</button>
      </div>
    </div>
  );
};

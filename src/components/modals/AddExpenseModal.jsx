import React from 'react';
import { X } from 'lucide-react';
import { FormattedNumberInput } from '../ui/FormattedNumberInput';

export const AddExpenseModal = ({ accounts, categories, timelineMonths, activeBudgetMonth, onSubmit, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Add New Expense</h2>
          <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <form onSubmit={onSubmit}>
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
            <FormattedNumberInput name="amount" placeholder="0" required />
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
  );
};

import React from 'react';
import { X } from 'lucide-react';
import { FormattedNumberInput } from '../ui/FormattedNumberInput';

export const EditTransactionModal = ({ editingTransaction, accounts, categories, timelineMonths, activeBudgetMonth, onSubmit, onClose }) => {
  if (!editingTransaction) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Edit Transaksi</h2>
          <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Budget Month</label>
            <select name="budget_month" className="form-input" required defaultValue={editingTransaction.budget_month || activeBudgetMonth}>
              {timelineMonths.map(m => <option key={m.budgetMonthValue} value={m.budgetMonthValue}>{m.label} ({m.budgetMonthValue})</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Nama Transaksi</label>
            <input type="text" name="name" className="form-input" defaultValue={editingTransaction.name} required />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Jumlah (IDR)</label>
            <FormattedNumberInput name="amount" defaultValue={editingTransaction.amount} required />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Akun</label>
            <select name="account" className="form-input" required defaultValue={editingTransaction.account}>
              {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Kategori</label>
            <select name="category" className="form-input" required defaultValue={editingTransaction.category}>
              <option value="Income">Income</option>
              <option value="Transfer In">Transfer In</option>
              <option value="Transfer Out">Transfer Out</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{width:'100%', color:'white'}}>Simpan Perubahan</button>
        </form>
      </div>
    </div>
  );
};

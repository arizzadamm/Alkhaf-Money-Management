import React from 'react';
import { X } from 'lucide-react';
import { FormattedNumberInput } from '../ui/FormattedNumberInput';
import { useModalA11y } from '../../hooks/useModalA11y';

export const EditTransactionModal = ({ editingTransaction, accounts, categories, timelineMonths, activeBudgetMonth, onSubmit, onClose }) => {
  const { modalRef, titleId, handleOverlayClick } = useModalA11y(onClose);

  if (!editingTransaction) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 id={titleId} style={{fontSize:'1.5rem', fontWeight:'600'}}>Edit Transaksi</h2>
          <button aria-label="Close dialog" style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="edit-budget-month" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Budget Month</label>
            <select id="edit-budget-month" name="budget_month" className="form-input" required defaultValue={editingTransaction.budget_month || activeBudgetMonth}>
              {timelineMonths.map(m => <option key={m.budgetMonthValue} value={m.budgetMonthValue}>{m.label} ({m.budgetMonthValue})</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="edit-transaction-name" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Nama Transaksi</label>
            <input id="edit-transaction-name" type="text" name="name" className="form-input" defaultValue={editingTransaction.name} required />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="edit-transaction-amount" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Jumlah (IDR)</label>
            <FormattedNumberInput id="edit-transaction-amount" name="amount" defaultValue={editingTransaction.amount} required />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="edit-transaction-account" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Akun</label>
            <select id="edit-transaction-account" name="account" className="form-input" required defaultValue={editingTransaction.account}>
              {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label htmlFor="edit-transaction-category" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Kategori</label>
            <select id="edit-transaction-category" name="category" className="form-input" required defaultValue={editingTransaction.category}>
              <option value="Income">Income</option>
              <option value="Transfer In">Transfer In</option>
              <option value="Transfer Out">Transfer Out</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{width:'100%'}}>Simpan Perubahan</button>
        </form>
      </div>
    </div>
  );
};

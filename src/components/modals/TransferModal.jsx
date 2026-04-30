import React from 'react';
import { X } from 'lucide-react';
import { FormattedNumberInput } from '../ui/FormattedNumberInput';
import { useModalA11y } from '../../hooks/useModalA11y';

export const TransferModal = ({ accounts, timelineMonths, activeBudgetMonth, onSubmit, onClose }) => {
  const { modalRef, titleId, handleOverlayClick } = useModalA11y(onClose);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 id={titleId} style={{fontSize:'1.5rem', fontWeight:'600'}}>Transfer Funds</h2>
          <button aria-label="Close dialog" style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="transfer-budget-month" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Budget Month</label>
            <select id="transfer-budget-month" name="budget_month" className="form-input" required defaultValue={activeBudgetMonth}>
              {timelineMonths.map(m => <option key={m.budgetMonthValue} value={m.budgetMonthValue}>{m.label} ({m.budgetMonthValue})</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="transfer-amount" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Amount (IDR)</label>
            <FormattedNumberInput id="transfer-amount" name="amount" placeholder="0" required />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="transfer-from-account" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>From Account</label>
            <select id="transfer-from-account" name="fromAcc" className="form-input" required>
              {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label htmlFor="transfer-to-account" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>To Account</label>
            <select id="transfer-to-account" name="toAcc" className="form-input" required>
              {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%', background:'var(--accent-blue-gray)'}}>Transfer</button>
        </form>
      </div>
    </div>
  );
};

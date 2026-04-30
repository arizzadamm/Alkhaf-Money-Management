import React, { useState, useRef, useCallback } from 'react';
import { X, Sparkles } from 'lucide-react';
import { FormattedNumberInput } from '../ui/FormattedNumberInput';
import { useModalA11y } from '../../hooks/useModalA11y';

export const AddExpenseModal = ({
  accounts, categories, timelineMonths, activeBudgetMonth,
  onSubmit, onClose,
  smartCategorize, smartSuggestion, isSmartLoading, clearSmartSuggestion,
}) => {
  const accountRef = useRef(null);
  const categoryRef = useRef(null);
  const [lastQueried, setLastQueried] = useState('');
  const debounceRef = useRef(null);

  const handleNameBlur = useCallback((e) => {
    const name = e.target.value.trim();
    if (!name || name === lastQueried || !smartCategorize) return;
    setLastQueried(name);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const result = await smartCategorize(name);
      if (result && result.confidence >= 0.7) {
        if (accountRef.current && result.account) accountRef.current.value = result.account;
        if (categoryRef.current && result.category) categoryRef.current.value = result.category;
      }
    }, 300);
  }, [smartCategorize, lastQueried]);

  const handleClose = () => {
    if (clearSmartSuggestion) clearSmartSuggestion();
    onClose();
  };

  const { modalRef, titleId, handleOverlayClick } = useModalA11y(handleClose);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 id={titleId} style={{fontSize:'1.5rem', fontWeight:'600'}}>Add New Expense</h2>
          <button aria-label="Close dialog" style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={handleClose}><X size={24}/></button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="expense-budget-month" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Budget Month (Alokasi Kantong)</label>
            <select id="expense-budget-month" name="budget_month" className="form-input" required defaultValue={activeBudgetMonth}>
              {timelineMonths.map(m => <option key={m.budgetMonthValue} value={m.budgetMonthValue}>{m.label} ({m.budgetMonthValue})</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="expense-name" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>
              Expense Name
              {isSmartLoading && <Sparkles size={14} style={{marginLeft:'0.5rem', color:'var(--accent-lime)', animation:'spin 1s linear infinite'}} />}
            </label>
            <input
              id="expense-name"
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Internet Bill"
              required
              onBlur={handleNameBlur}
            />
            {smartSuggestion && smartSuggestion.confidence >= 0.7 && (
              <div style={{
                marginTop:'0.4rem', fontSize:'0.8rem', color:'var(--accent-dark-green)',
                display:'flex', alignItems:'center', gap:'0.35rem'
              }}>
                <Sparkles size={12} />
                AI suggest: {smartSuggestion.account}, {smartSuggestion.category}
              </div>
            )}
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="expense-amount" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Amount (IDR)</label>
            <FormattedNumberInput id="expense-amount" name="amount" placeholder="0" required />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="expense-account" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Account</label>
            <select id="expense-account" name="account" className="form-input" required ref={accountRef}>
              {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name}</option>)}
            </select>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label htmlFor="expense-category" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Category</label>
            <select id="expense-category" name="category" className="form-input" required ref={categoryRef}>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{width: '100%'}}>Add Expense</button>
        </form>
      </div>
    </div>
  );
};

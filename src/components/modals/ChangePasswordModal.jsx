import React from 'react';
import { X } from 'lucide-react';
import { useModalA11y } from '../../hooks/useModalA11y';

export const ChangePasswordModal = ({ changePasswordError, onSubmit, onClose }) => {
  const { modalRef, titleId, handleOverlayClick } = useModalA11y(onClose);

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 id={titleId} style={{fontSize:'1.5rem', fontWeight:'600'}}>Ubah Kredensial</h2>
          <button aria-label="Close dialog" style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <form onSubmit={onSubmit}>
          {changePasswordError && <div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.9rem', fontWeight:'500'}}>{changePasswordError}</div>}
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="current-password" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Kredensial Saat Ini</label>
            <input id="current-password" type="password" name="currentPassword" className="form-input" required placeholder="Masukkan kredensial saat ini" autoComplete="current-password" />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label htmlFor="new-password" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Kredensial Baru</label>
            <input id="new-password" type="password" name="newPassword" className="form-input" required placeholder="Minimal 6 karakter" autoComplete="new-password" />
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label htmlFor="confirm-new-password" style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Konfirmasi Kredensial Baru</label>
            <input id="confirm-new-password" type="password" name="confirmPassword" className="form-input" required placeholder="Ulangi kredensial baru" autoComplete="new-password" />
          </div>
          <button type="submit" className="btn-primary" style={{width:'100%'}}>Ubah Kredensial</button>
        </form>
      </div>
    </div>
  );
};

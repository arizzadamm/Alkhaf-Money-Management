import React from 'react';
import { X } from 'lucide-react';

export const ChangePasswordModal = ({ changePasswordError, onSubmit, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 style={{fontSize:'1.5rem', fontWeight:'600'}}>Ubah Kredensial</h2>
          <button style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-primary)'}} onClick={onClose}><X size={24}/></button>
        </div>
        <form onSubmit={onSubmit}>
          {changePasswordError && <div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.9rem', fontWeight:'500'}}>{changePasswordError}</div>}
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Kredensial Saat Ini</label>
            <input type="password" name="currentPassword" className="form-input" required placeholder="Masukkan kredensial saat ini" />
          </div>
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Kredensial Baru</label>
            <input type="password" name="newPassword" className="form-input" required placeholder="Minimal 6 karakter" />
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Konfirmasi Kredensial Baru</label>
            <input type="password" name="confirmPassword" className="form-input" required placeholder="Ulangi kredensial baru" />
          </div>
          <button type="submit" className="btn-primary" style={{width:'100%', color:'white'}}>Ubah Kredensial</button>
        </form>
      </div>
    </div>
  );
};

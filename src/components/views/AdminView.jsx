import React from 'react';
import { Trash2 } from 'lucide-react';

export const AdminView = ({
  isMobile,
  adminUsers, editingAdminUserId,
  adminError, adminSuccess,
  handleAdminUserSubmit, startEditAdminUser, cancelEditAdminUser, deleteAdminUser,
  fetchAdminUsers,
}) => {
  if (isMobile) {
    return (
      <div style={{display:'flex', flexDirection:'column', gap:'1rem', paddingBottom:'2rem'}}>
        <div className="widget-card">
          <h2 style={{fontSize:'1.4rem', fontWeight:'700', marginBottom:'0.5rem'}}>AlkaFlow Admin</h2>
          <p style={{color:'var(--text-secondary)', marginBottom:'1rem'}}>Kelola user aplikasi dari satu tempat dengan kontrol yang rapi dan aman.</p>
          {adminError && <div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'10px', marginBottom:'1rem'}}>{adminError}</div>}
          {adminSuccess && <div style={{background:'var(--success-light)', color:'var(--success)', padding:'0.75rem', borderRadius:'10px', marginBottom:'1rem'}}>{adminSuccess}</div>}
          <form onSubmit={handleAdminUserSubmit} key={editingAdminUserId || 'mobile-new-user-form'} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <input type="hidden" name="id" defaultValue={editingAdminUserId || ''} />
            <label htmlFor="admin-mobile-username" className="sr-only">Username</label>
            <input id="admin-mobile-username" type="text" name="username" className="form-input" placeholder="Username" defaultValue={editingAdminUserId ? adminUsers.find((item) => item.id === editingAdminUserId)?.username || '' : ''} required autoComplete="username" />
            <label htmlFor="admin-mobile-password" className="sr-only">Password</label>
            <input id="admin-mobile-password" type="password" name="password" className="form-input" placeholder={editingAdminUserId ? 'Password baru (opsional)' : 'Password'} autoComplete="new-password" />
            <label htmlFor="admin-mobile-role" className="sr-only">Role</label>
            <select id="admin-mobile-role" name="role" className="form-input" defaultValue={editingAdminUserId ? adminUsers.find((item) => item.id === editingAdminUserId)?.role || 'user' : 'user'}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" className="btn-primary">{editingAdminUserId ? 'Update User' : 'Create User'}</button>
            {editingAdminUserId && (
              <button type="button" className="btn-danger" onClick={cancelEditAdminUser} style={{width:'100%', justifyContent:'center', padding:'0.75rem'}}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>
        <div className="widget-card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
            <h3 style={{fontSize:'1rem', fontWeight:'600'}}>User List</h3>
            <button type="button" className="see-all" onClick={fetchAdminUsers} style={{background:'none', border:'none'}}>Refresh</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:'0.75rem'}}>
            {adminUsers.map((adminUser) => (
              <div key={adminUser.id} style={{background:'var(--hover-bg)', padding:'1rem', borderRadius:'12px'}}>
                <div style={{fontWeight:'600'}}>{adminUser.username}</div>
                <div style={{color:'var(--text-secondary)', fontSize:'0.85rem', marginTop:'0.25rem'}}>ID {adminUser.id} • {(adminUser.role || 'user').toUpperCase()}</div>
                <div style={{display:'flex', gap:'0.5rem', marginTop:'0.75rem'}}>
                  <button type="button" className="btn-primary" onClick={() => startEditAdminUser(adminUser)} style={{padding:'0.6rem 0.9rem'}}>Edit</button>
                  <button type="button" className="btn-danger" onClick={() => deleteAdminUser(adminUser.id)}><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {adminUsers.length === 0 && <div style={{color:'var(--text-secondary)'}}>Belum ada user.</div>}
          </div>
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div style={{display:'grid', gridTemplateColumns:'1.1fr 1.4fr', gap:'1.5rem'}}>
      <div className="widget-card" style={{alignSelf:'start'}}>
        <div className="widget-header" style={{marginBottom:'1rem'}}>
          <span className="widget-title">{editingAdminUserId ? 'Edit User' : 'Create User'}</span>
        </div>
        {adminError && <div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'10px', marginBottom:'1rem'}}>{adminError}</div>}
        {adminSuccess && <div style={{background:'var(--success-light)', color:'var(--success)', padding:'0.75rem', borderRadius:'10px', marginBottom:'1rem'}}>{adminSuccess}</div>}
        <form onSubmit={handleAdminUserSubmit} key={editingAdminUserId || 'new-user-form'}>
          <input type="hidden" name="id" defaultValue={editingAdminUserId || ''} />
          <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <div>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                defaultValue={editingAdminUserId ? adminUsers.find((item) => item.id === editingAdminUserId)?.username || '' : ''}
                placeholder="Masukkan username"
                required
              />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>
                Password {editingAdminUserId ? '(kosongkan jika tidak diubah)' : ''}
              </label>
              <input type="password" name="password" className="form-input" placeholder={editingAdminUserId ? 'Biarkan kosong jika tetap sama' : 'Masukkan password'} autoComplete="new-password" />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)'}}>Role</label>
              <select
                name="role"
                className="form-input"
                defaultValue={editingAdminUserId ? adminUsers.find((item) => item.id === editingAdminUserId)?.role || 'user' : 'user'}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{width:'100%'}}>
              {editingAdminUserId ? 'Update User' : 'Create User'}
            </button>
            {editingAdminUserId && (
              <button
                type="button"
                className="btn-danger"
                onClick={cancelEditAdminUser}
                style={{justifyContent:'center'}}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="widget-card">
        <div className="widget-header" style={{borderBottom:'1px solid var(--border-color)', paddingBottom:'1rem', marginBottom:'1rem'}}>
          <span className="widget-title">User Management ({adminUsers.length})</span>
          <button className="see-all" onClick={fetchAdminUsers} style={{background:'none', border:'none'}}>Refresh</button>
        </div>
        <table className="full-transactions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th style={{textAlign:'right'}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.map((adminUser) => (
              <tr key={adminUser.id}>
                <td style={{color:'var(--text-secondary)'}}>{adminUser.id}</td>
                <td>{adminUser.username}</td>
                <td style={{textTransform:'capitalize'}}>{adminUser.role || 'user'}</td>
                <td style={{textAlign:'right'}}>
                  <div style={{display:'inline-flex', gap:'0.5rem'}}>
                    <button className="btn-primary" type="button" onClick={() => startEditAdminUser(adminUser)} style={{padding:'0.6rem 0.9rem'}}>Edit</button>
                    <button className="btn-danger" type="button" onClick={() => deleteAdminUser(adminUser.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {adminUsers.length === 0 && (
              <tr>
                <td colSpan="4" style={{textAlign:'center', color:'var(--text-secondary)', padding:'1.5rem'}}>Belum ada user.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

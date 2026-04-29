import React from 'react';
import { AlkaFlowLogoMark, AlkaFlowWordmark } from '../ui/AlkaFlowLogo';

export const LoginScreen = ({ loginError, rememberMe, setRememberMe, handleLogin }) => {
  return (
    <div className="login-screen">
      <div className="login-shell">
        <section className="login-card">
          <div className="login-card-header">
            <div className="login-brand-mark compact">
              <div className="login-brand-orbit" aria-hidden="true">
                <div className="login-brand-orbit-ring"></div>
                <div className="login-brand-orbit-ring secondary"></div>
                <div className="login-brand-orbit-core">
                  <AlkaFlowLogoMark size={58} />
                </div>
              </div>
            </div>
            <AlkaFlowWordmark compact />
            <p className="login-brand-tagline compact">TRACK YOUR MONEY. EFFORTLESSLY.</p>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to continue.</p>
          </div>

          <form onSubmit={handleLogin}>
            {loginError && (<div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.9rem', fontWeight:'500'}}>{loginError}</div>)}
            <div style={{marginBottom:'1.5rem', textAlign:'left'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.9rem'}}>Username</label>
              <input type="text" name="username" required className="form-input login-input" placeholder="Enter username" />
            </div>
            <div style={{marginBottom:'2rem', textAlign:'left'}}>
              <label style={{display:'block', marginBottom:'0.5rem', color:'var(--text-secondary)', fontSize:'0.9rem'}}>Password</label>
              <input type="password" name="password" required className="form-input login-input" placeholder="••••••••" />
            </div>
            <label className="login-remember">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>
            <button type="submit" className="btn-primary login-submit" style={{width:'100%', padding:'1rem'}}>Sign In to AlkaFlow</button>
          </form>
        </section>
      </div>
    </div>
  );
};

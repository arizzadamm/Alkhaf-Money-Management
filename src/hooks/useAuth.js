import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { hashPassword } from '../utils/formatters';
import { SESSION_STORAGE_KEY, REMEMBER_ME_KEY, SESSION_PROOF_KEY } from '../utils/constants';

export function useAuth(addToast) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');

  const isAdmin = user?.role === 'admin';

  const getStoredSessionProof = () => localStorage.getItem(SESSION_PROOF_KEY) || sessionStorage.getItem(SESSION_PROOF_KEY);

  const storeSessionProof = (proof, shouldRemember) => {
    if (shouldRemember) {
      localStorage.setItem(SESSION_PROOF_KEY, proof);
      sessionStorage.removeItem(SESSION_PROOF_KEY);
    } else {
      sessionStorage.setItem(SESSION_PROOF_KEY, proof);
      localStorage.removeItem(SESSION_PROOF_KEY);
    }
  };

  // Restore session on mount
  useEffect(() => {
    const handle = window.setTimeout(() => {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        const parsedUser = JSON.parse(savedSession);
        setUser(parsedUser);
      }

      const savedRememberMe = localStorage.getItem(REMEMBER_ME_KEY);
      if (savedRememberMe !== null) setRememberMe(savedRememberMe === 'true');

      setIsLoading(false);
    }, 0);

    return () => window.clearTimeout(handle);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const username = e.target.username.value;
    const password = e.target.password.value;
    const passwordHash = await hashPassword(password);

    try {
      const { data, error } = await supabase.functions.invoke('auth-session', {
        body: { action: 'login', username, passwordHash, rememberMe }
      });

      if (error || data?.error) {
        return setLoginError(data?.error || error?.message || 'Login gagal!');
      }

      const result = data?.data;
      if (!result?.user || !result?.sessionToken) {
        return setLoginError('Respons login tidak valid.');
      }

      const userData = { id: result.user.id, name: result.user.username, role: result.user.role };
      setUser(userData);
      localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));

      if (rememberMe) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } else {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }

      storeSessionProof(result.sessionToken, rememberMe);
    } catch {
      setLoginError('Terjadi kesalahan koneksi.');
    }
  };

  const handleLogout = async () => {
    const sessionProof = getStoredSessionProof();
    if (sessionProof && user?.id) {
      try {
        await supabase.functions.invoke('auth-session', {
          body: { action: 'logout', requesterId: user.id, sessionToken: sessionProof }
        });
      } catch { /* ignore logout errors */ }
    }
    setUser(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_PROOF_KEY);
    sessionStorage.removeItem(SESSION_PROOF_KEY);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError('');
    const currentVal = e.target.currentPassword.value;
    const newVal = e.target.newPassword.value;
    const confirmVal = e.target.confirmPassword.value;
    if (newVal.length < 6) { setChangePasswordError('Minimal 6 karakter.'); return; }
    if (newVal !== confirmVal) { setChangePasswordError('Konfirmasi tidak cocok.'); return; }
    const currentHash = await hashPassword(currentVal);
    const newHash = await hashPassword(newVal);
    const sessionProof = getStoredSessionProof();
    try {
      const { data, error } = await supabase.functions.invoke('auth-session', {
        body: { action: 'change_password', requesterId: user.id, sessionToken: sessionProof, currentPasswordHash: currentHash, newPasswordHash: newHash }
      });
      if (error || data?.error) { setChangePasswordError(data?.error || error?.message || 'Gagal mengubah.'); return; }
      if (data?.data?.sessionToken) storeSessionProof(data.data.sessionToken, rememberMe);
      setIsChangePasswordOpen(false);
      addToast('Kredensial berhasil diubah!', 'success');
    } catch { setChangePasswordError('Terjadi kesalahan koneksi.'); }
  };

  return {
    user,
    isAdmin,
    isLoading,
    setIsLoading,
    loginError,
    rememberMe,
    setRememberMe,
    handleLogin,
    handleLogout,
    getStoredSessionProof,
    storeSessionProof,
    isChangePasswordOpen,
    setIsChangePasswordOpen,
    changePasswordError,
    handleChangePassword,
  };
}

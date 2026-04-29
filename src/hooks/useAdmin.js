import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { hashPassword } from '../utils/formatters';

export function useAdmin(user, getStoredSessionProof) {
  const [adminUsers, setAdminUsers] = useState([]);
  const [editingAdminUserId, setEditingAdminUserId] = useState(null);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  const isAdmin = user?.role === 'admin';

  const resetAdminFeedback = () => {
    setAdminError('');
    setAdminSuccess('');
  };

  const fetchAdminUsers = useCallback(async () => {
    if (!isAdmin) return;

    const sessionProof = getStoredSessionProof();
    if (!sessionProof) {
      setAdminError('Sesi admin tidak ditemukan. Silakan login ulang.');
      return;
    }

    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'list',
        requesterId: user.id,
        sessionProof
      }
    });

    if (error || data?.error) {
      setAdminError(data?.error || error?.message || 'Gagal mengambil daftar user.');
      return;
    }

    setAdminUsers(data?.data || []);
  }, [isAdmin, user, getStoredSessionProof]);

  const handleAdminUserSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    resetAdminFeedback();

    const formData = new FormData(e.currentTarget);
    const id = formData.get('id');
    const username = String(formData.get('username') || '').trim();
    const password = String(formData.get('password') || '').trim();
    const role = String(formData.get('role') || 'user');

    if (!username) {
      setAdminError('Username wajib diisi.');
      return;
    }

    if (!id && !password) {
      setAdminError('Password wajib diisi untuk user baru.');
      return;
    }

    const sessionProof = getStoredSessionProof();
    if (!sessionProof) {
      setAdminError('Sesi admin tidak ditemukan. Silakan login ulang.');
      return;
    }

    const passwordHash = password ? await hashPassword(password) : null;

    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: id ? 'update' : 'create',
        requesterId: user.id,
        sessionProof,
        targetUserId: id || null,
        username,
        role,
        passwordHash
      }
    });

    if (error || data?.error) {
      setAdminError(data?.error || error?.message || 'Gagal menyimpan user.');
      return;
    }

    setAdminSuccess(id ? 'User berhasil diperbarui.' : 'User baru berhasil dibuat.');
    setEditingAdminUserId(null);
    await fetchAdminUsers();
  };

  const startEditAdminUser = (adminUser) => {
    setEditingAdminUserId(adminUser.id);
    resetAdminFeedback();
  };

  const cancelEditAdminUser = () => {
    setEditingAdminUserId(null);
    resetAdminFeedback();
  };

  const deleteAdminUser = async (id) => {
    if (!isAdmin) return;
    if (id === user.id) {
      setAdminError('Admin yang sedang login tidak bisa menghapus akun sendiri.');
      return;
    }

    resetAdminFeedback();
    const confirmed = window.confirm('Hapus user ini dari sistem?');
    if (!confirmed) return;

    const sessionProof = getStoredSessionProof();
    if (!sessionProof) {
      setAdminError('Sesi admin tidak ditemukan. Silakan login ulang.');
      return;
    }

    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'delete',
        requesterId: user.id,
        sessionProof,
        targetUserId: id
      }
    });

    if (error || data?.error) {
      setAdminError(data?.error || error?.message || 'Gagal menghapus user.');
      return;
    }

    setAdminSuccess('User berhasil dihapus.');
    await fetchAdminUsers();
  };

  return {
    adminUsers, setAdminUsers,
    editingAdminUserId, setEditingAdminUserId,
    adminError, setAdminError,
    adminSuccess, setAdminSuccess,
    resetAdminFeedback,
    fetchAdminUsers,
    handleAdminUserSubmit,
    startEditAdminUser,
    cancelEditAdminUser,
    deleteAdminUser,
  };
}

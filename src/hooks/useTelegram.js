import { useState, useMemo, useCallback, useEffect } from 'react';
import QRCode from 'qrcode';
import { supabase } from '../supabaseClient';
import { TELEGRAM_BOT_USERNAME } from '../utils/constants';

export function useTelegram(user, isAdmin, getStoredSessionProof) {
  const [telegramConnections, setTelegramConnections] = useState([]);
  const [telegramLinkToken, setTelegramLinkToken] = useState(null);
  const [telegramError, setTelegramError] = useState('');
  const [telegramSuccess, setTelegramSuccess] = useState('');
  const [isTelegramLoading, setIsTelegramLoading] = useState(false);
  const [telegramQrCode, setTelegramQrCode] = useState('');

  const resetTelegramFeedback = () => {
    setTelegramError('');
    setTelegramSuccess('');
  };

  const invokeTelegramLinkAction = useCallback(async (action, payload = {}) => {
    if (!user?.id) return { error: 'User tidak ditemukan.' };

    const sessionProof = getStoredSessionProof();
    if (!sessionProof) return { error: 'Sesi tidak ditemukan. Silakan login ulang.' };

    const { data, error } = await supabase.functions.invoke('telegram-link', {
      body: {
        action,
        requesterId: user.id,
        sessionProof,
        ...payload
      }
    });

    if (error || data?.error) {
      return { error: data?.error || error?.message || 'Gagal terhubung ke layanan Telegram.' };
    }

    return { data: data?.data };
  }, [user, getStoredSessionProof]);

  const fetchTelegramConnections = useCallback(async () => {
    if (!user?.id || isAdmin) return;

    setIsTelegramLoading(true);
    resetTelegramFeedback();

    const result = await invokeTelegramLinkAction('list_connections');
    if (result.error) {
      setTelegramError(result.error);
      setIsTelegramLoading(false);
      return;
    }

    setTelegramConnections(result.data || []);
    setIsTelegramLoading(false);
  }, [invokeTelegramLinkAction, isAdmin, user]);

  const generateTelegramLinkToken = async () => {
    if (!user?.id || isAdmin) return;

    setIsTelegramLoading(true);
    resetTelegramFeedback();

    const result = await invokeTelegramLinkAction('generate_token');
    if (result.error) {
      setTelegramError(result.error);
      setIsTelegramLoading(false);
      return;
    }

    setTelegramLinkToken(result.data);
    setTelegramSuccess('Token linking baru berhasil dibuat. Kirim ke bot Telegram dalam 15 menit.');
    setIsTelegramLoading(false);
  };

  const setPrimaryTelegramConnection = async (connectionId) => {
    setIsTelegramLoading(true);
    resetTelegramFeedback();

    const result = await invokeTelegramLinkAction('set_primary', { connectionId });
    if (result.error) {
      setTelegramError(result.error);
      setIsTelegramLoading(false);
      return;
    }

    setTelegramSuccess('Koneksi utama Telegram berhasil diperbarui.');
    await fetchTelegramConnections();
    setIsTelegramLoading(false);
  };

  const unlinkTelegramConnection = async (connectionId) => {
    const confirmed = window.confirm('Lepas koneksi Telegram ini dari akun Anda?');
    if (!confirmed) return;

    setIsTelegramLoading(true);
    resetTelegramFeedback();

    const result = await invokeTelegramLinkAction('unlink_connection', { connectionId });
    if (result.error) {
      setTelegramError(result.error);
      setIsTelegramLoading(false);
      return;
    }

    setTelegramSuccess('Koneksi Telegram berhasil dilepas.');
    await fetchTelegramConnections();
    setIsTelegramLoading(false);
  };

  const telegramStartLink = useMemo(() => {
    if (!telegramLinkToken?.token) return '';
    if (!TELEGRAM_BOT_USERNAME) return '';
    return `tg://resolve?domain=${encodeURIComponent(TELEGRAM_BOT_USERNAME)}&start=${encodeURIComponent(telegramLinkToken.token)}`;
  }, [telegramLinkToken]);

  const telegramStartWebLink = useMemo(() => {
    if (!telegramLinkToken?.token) return '';
    if (!TELEGRAM_BOT_USERNAME) return '';
    return `https://t.me/${encodeURIComponent(TELEGRAM_BOT_USERNAME)}?start=${encodeURIComponent(telegramLinkToken.token)}`;
  }, [telegramLinkToken]);

  useEffect(() => {
    let cancelled = false;

    const buildQrCode = async () => {
      if (!telegramLinkToken?.token) {
        setTelegramQrCode('');
        return;
      }

      try {
        const qrValue = telegramStartLink || telegramLinkToken.token;
        const url = await QRCode.toDataURL(qrValue, {
          width: 280,
          margin: 1,
          color: {
            dark: '#213f31',
            light: '#ffffff'
          }
        });

        if (!cancelled) setTelegramQrCode(url);
      } catch {
        if (!cancelled) setTelegramQrCode('');
      }
    };

    buildQrCode();
    return () => {
      cancelled = true;
    };
  }, [telegramLinkToken, telegramStartLink]);

  return {
    telegramConnections,
    telegramLinkToken,
    telegramError,
    telegramSuccess,
    isTelegramLoading,
    telegramQrCode,
    telegramStartLink,
    telegramStartWebLink,
    fetchTelegramConnections,
    generateTelegramLinkToken,
    setPrimaryTelegramConnection,
    unlinkTelegramConnection,
  };
}

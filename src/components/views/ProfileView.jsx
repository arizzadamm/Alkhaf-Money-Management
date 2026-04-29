import React from 'react';
import { LogOut, Trash2, QrCode } from 'lucide-react';

export const TelegramProfilePanel = ({
  telegramConnections, telegramLinkToken, telegramError, telegramSuccess,
  isTelegramLoading, telegramQrCode, telegramStartLink, telegramStartWebLink,
  fetchTelegramConnections, generateTelegramLinkToken,
  setPrimaryTelegramConnection, unlinkTelegramConnection,
}) => (
  <div className="widget-card telegram-profile-card">
    <div className="widget-header" style={{marginBottom:'1rem'}}>
      <span className="widget-title">Telegram Integration</span>
      <button type="button" className="btn-primary" onClick={fetchTelegramConnections} disabled={isTelegramLoading} style={{color:'white'}}>
        Refresh
      </button>
    </div>

    <div className="telegram-settings-card">
      <div>
        <div className="telegram-settings-title">Hubungkan Telegram</div>
        <div className="telegram-settings-copy">
          Generate token lalu scan QR untuk menghubungkan akun Telegram Anda.
        </div>
      </div>
      <button type="button" className="btn-primary" onClick={generateTelegramLinkToken} disabled={isTelegramLoading} style={{color:'white'}}>
        {isTelegramLoading ? 'Memproses...' : 'Generate Token'}
      </button>
    </div>

    {telegramError && (
      <div style={{background:'var(--danger-light)', color:'var(--danger)', padding:'0.75rem', borderRadius:'10px', marginBottom:'1rem'}}>
        {telegramError}
      </div>
    )}

    {telegramSuccess && (
      <div style={{background:'rgba(16,185,129,0.12)', color:'var(--success)', padding:'0.75rem', borderRadius:'10px', marginBottom:'1rem'}}>
        {telegramSuccess}
      </div>
    )}

    {telegramLinkToken && (
      <div className="telegram-token-box">
        <div style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'0.4rem'}}>Token aktif</div>
        <div className="telegram-token-value">{telegramLinkToken.token}</div>
        <div style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:'0.5rem'}}>
          Berlaku sampai {new Date(telegramLinkToken.expires_at).toLocaleString('id-ID')}
        </div>
        {telegramQrCode && (
          <div className="telegram-qr-section">
            <div className="telegram-qr-card">
              <img src={telegramQrCode} alt="QR code untuk menghubungkan Telegram" className="telegram-qr-image" />
            </div>
            <div style={{fontSize:'0.9rem', color:'var(--text-secondary)', lineHeight:'1.5'}}>
              {telegramStartLink ? (
                <>
                  Scan QR ini untuk membuka Telegram dan melanjutkan proses koneksi.
                  <div style={{marginTop:'0.5rem', wordBreak:'break-all'}}>
                    <a href={telegramStartWebLink} target="_blank" rel="noreferrer" style={{color:'var(--accent-dark-green)', fontWeight:'600'}}>
                      Buka Telegram
                    </a>
                  </div>
                </>
              ) : (
                <>
                  QR siap dipakai untuk proses koneksi Telegram.
                </>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    <div className="telegram-settings-card" style={{marginTop:'1rem'}}>
      <div>
        <div className="telegram-settings-title">Koneksi Saat Ini</div>
        <div className="telegram-settings-copy">
          Daftar akun Telegram yang sudah terhubung ke akun ini.
        </div>
      </div>
    </div>

    {isTelegramLoading && telegramConnections.length === 0 ? (
      <div style={{color:'var(--text-secondary)', marginTop:'1rem'}}>Memuat koneksi Telegram...</div>
    ) : telegramConnections.length === 0 ? (
      <div className="telegram-empty-state">
        Belum ada koneksi Telegram.
      </div>
    ) : (
      <div style={{display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'1rem'}}>
        {telegramConnections.map((connection) => (
          <div key={connection.id} className="telegram-connection-item">
            <div>
              <div style={{display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap'}}>
                <strong>{connection.label || `Chat ${connection.telegram_chat_id}`}</strong>
                {connection.is_primary && <span className="telegram-badge">Primary</span>}
                {connection.is_verified && <span className="telegram-badge telegram-badge-success">Verified</span>}
              </div>
              <div style={{fontSize:'0.85rem', color:'var(--text-secondary)', marginTop:'0.35rem'}}>
                chat_id: {connection.telegram_chat_id} • type: {connection.chat_type}
              </div>
              <div style={{fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.25rem'}}>
                Terhubung {new Date(connection.linked_at || connection.created_at).toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{display:'flex', gap:'0.5rem', flexWrap:'wrap', justifyContent:'flex-end'}}>
              {!connection.is_primary && (
                <button type="button" className="btn-primary" style={{color:'white', padding:'0.65rem 0.9rem'}} onClick={() => setPrimaryTelegramConnection(connection.id)}>
                  Jadikan Primary
                </button>
              )}
              <button type="button" className="btn-danger" style={{padding:'0.65rem 0.9rem'}} onClick={() => unlinkTelegramConnection(connection.id)}>
                <Trash2 size={16} /> Unlink
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const ProfileView = ({ isMobile, user, handleLogout, telegramProps }) => {
  return (
    <div style={{display:'flex', flexDirection:'column', gap: isMobile ? '1rem' : '1.5rem', maxWidth: isMobile ? undefined : '860px', margin: isMobile ? undefined : '0 auto', paddingBottom: isMobile ? '2rem' : undefined}}>
      <div className="widget-card" style={{textAlign:'center', padding: isMobile ? undefined : '3rem'}}>
        <h2 style={{fontSize:'1.8rem', fontWeight:'700'}}>{user.name}</h2>
        <div style={{marginTop:'0.75rem', color:'var(--text-secondary)', textTransform:'capitalize'}}>{user.role}</div>
        <button className="btn-danger" onClick={handleLogout} style={{marginTop:'2rem'}}><LogOut size={18}/> Logout</button>
      </div>
      <TelegramProfilePanel {...telegramProps} />
    </div>
  );
};

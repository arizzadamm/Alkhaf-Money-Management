import React, { useEffect } from 'react';
import { formatIDR } from '../../utils/formatters';

export const InsightCard = ({ monthlyInsight, isInsightLoading, fetchMonthlyInsight, viewMonthName }) => {
  useEffect(() => {
    if (!monthlyInsight && !isInsightLoading) {
      fetchMonthlyInsight();
    }
  }, [monthlyInsight, isInsightLoading, fetchMonthlyInsight]);

  if (isInsightLoading) {
    return (
      <div className="widget-card" style={{padding:'1.5rem'}}>
        <div className="widget-header">
          <span className="widget-title">AI Insight</span>
        </div>
        <div style={{color:'var(--text-secondary)', fontSize:'0.9rem', padding:'1rem 0'}}>
          Menganalisis keuangan Anda...
        </div>
      </div>
    );
  }

  if (!monthlyInsight) return null;

  const { summary, insight } = monthlyInsight;

  return (
    <div className="widget-card" style={{padding:'1.5rem', background:'linear-gradient(135deg, var(--bg-card) 0%, var(--hover-bg) 100%)'}}>
      <div className="widget-header" style={{marginBottom:'1rem'}}>
        <span className="widget-title">AI Insight</span>
        <span style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>{viewMonthName}</span>
      </div>

      {summary && (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem'}}>
          <div style={{background:'var(--bg-main)', padding:'0.75rem', borderRadius:'10px'}}>
            <div style={{fontSize:'0.75rem', color:'var(--text-secondary)'}}>Expense</div>
            <div style={{fontSize:'1.1rem', fontWeight:'700', color:'var(--danger)'}}>{formatIDR(summary.expense)}</div>
          </div>
          <div style={{background:'var(--bg-main)', padding:'0.75rem', borderRadius:'10px'}}>
            <div style={{fontSize:'0.75rem', color:'var(--text-secondary)'}}>vs Bulan Lalu</div>
            <div style={{fontSize:'1.1rem', fontWeight:'700', color: summary.changePercent > 0 ? 'var(--danger)' : 'var(--success)'}}>
              {summary.changePercent > 0 ? '+' : ''}{summary.changePercent}%
            </div>
          </div>
        </div>
      )}

      {insight && (
        <div style={{
          padding:'1rem',
          background:'var(--bg-main)',
          borderRadius:'10px',
          borderLeft:'3px solid var(--accent-lime)',
          fontSize:'0.9rem',
          lineHeight:'1.6',
          color:'var(--text-primary)',
        }}>
          {insight}
        </div>
      )}
    </div>
  );
};

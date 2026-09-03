'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface SettlementListProps {
  groupId: string;
  currentUserId: string;
  settlements: Settlement[];
  userNames: Record<string, string>;
}

export default function SettlementList({ groupId, currentUserId, settlements, userNames }: SettlementListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (settlements.length === 0) {
    return <p className="text-muted">Everyone is settled up! No debts.</p>;
  }

  const handlePay = async (settlement: Settlement) => {
    const key = `${settlement.from}-${settlement.to}`;
    setLoading(key);

    try {
      const res = await fetch(`/api/groups/${groupId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: settlement.to,
          amount: settlement.amount
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create payment');
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Error creating payment');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {settlements.map((s, idx) => {
        const isMeDebtor = s.from === currentUserId;
        const isMeCreditor = s.to === currentUserId;
        const isProcessing = loading === `${s.from}-${s.to}`;

        return (
          <li key={idx} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontWeight: '600', color: isMeDebtor ? 'var(--danger)' : 'var(--text-main)' }}>{userNames[s.from] || 'Unknown'}</span>
              <span className="text-muted" style={{ margin: '0 8px' }}>pays</span>
              <span style={{ fontWeight: '600', color: isMeCreditor ? 'var(--accent)' : 'var(--text-main)' }}>{userNames[s.to] || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="text-accent" style={{ fontWeight: '600' }}>₹{s.amount.toFixed(2)}</span>
              {isMeDebtor && (
                <button 
                  className="btn-primary" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => handlePay(s)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Paying...' : 'Mark as Paid'}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

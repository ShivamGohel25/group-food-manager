'use client';

interface Payment {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
}

interface PaymentHistoryProps {
  payments: Payment[];
  userNames: Record<string, string>;
}

export default function PaymentHistory({ payments, userNames }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return <p className="text-muted">No completed payments yet.</p>;
  }

  // Sort by date descending
  const sortedPayments = [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sortedPayments.map((p) => {
        const dateStr = new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        return (
          <li key={p.id} style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{userNames[p.fromUserId] || 'Unknown'}</span>
              <span className="text-muted" style={{ margin: '0 8px' }}>paid</span>
              <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{userNames[p.toUserId] || 'Unknown'}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="text-accent" style={{ fontWeight: '600' }}>₹{p.amount.toFixed(2)}</span>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>{dateStr}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

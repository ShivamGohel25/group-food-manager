'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteOrderButton({ 
  groupId, 
  orderId, 
  purchaser, 
  coPurchaser, 
  totalCost 
}: { 
  groupId: string, 
  orderId: string, 
  purchaser: { id: string, name: string }, 
  coPurchaser?: { id: string, name: string } | null, 
  totalCost: number 
}) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [purchaserAmount, setPurchaserAmount] = useState(totalCost);
  const [coPurchaserAmount, setCoPurchaserAmount] = useState(0);

  const router = useRouter();

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to complete this order? This will finalize the bill and distribute the expenses.')) return;
    
    const payers = [];
    if (purchaserAmount > 0) {
      payers.push({ userId: purchaser.id, amount: purchaserAmount });
    }
    if (coPurchaser && coPurchaserAmount > 0) {
      payers.push({ userId: coPurchaser.id, amount: coPurchaserAmount });
    }

    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/orders/${orderId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payers })
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert('Failed to complete order');
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <button 
        onClick={() => setShowForm(true)} 
        className="btn-primary"
        style={{ marginTop: '16px', background: 'var(--accent)', color: '#fff', width: '100%' }}
      >
        Finish & Calculate Expenses
      </button>
    );
  }

  return (
    <form onSubmit={handleComplete} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
        <p style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Who paid at the shop?</p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontWeight: '500' }}>{purchaser.name}</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px' }}>₹</span>
            <input 
              type="number" 
              step="0.01" 
              value={purchaserAmount} 
              onChange={e => setPurchaserAmount(parseFloat(e.target.value) || 0)}
              className="input-field" 
              style={{ width: '80px', padding: '4px 8px' }}
            />
          </div>
        </div>

        {coPurchaser && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontWeight: '500' }}>{coPurchaser.name}</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>₹</span>
              <input 
                type="number" 
                step="0.01" 
                value={coPurchaserAmount} 
                onChange={e => setCoPurchaserAmount(parseFloat(e.target.value) || 0)}
                className="input-field" 
                style={{ width: '80px', padding: '4px 8px' }}
              />
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span>Total Paid:</span>
          <span style={{ fontWeight: '600', color: (purchaserAmount + coPurchaserAmount) === totalCost ? 'var(--accent)' : 'var(--warning)' }}>
            ₹{purchaserAmount + coPurchaserAmount}
          </span>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary" style={{ background: 'var(--accent)' }}>
        {loading ? 'Completing...' : 'Confirm Payment & Complete'}
      </button>
    </form>
  );
}

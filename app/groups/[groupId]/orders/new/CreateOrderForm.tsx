'use client';
import { useState, useEffect } from 'react';
import SpinningWheel from '@/components/SpinningWheel';
import { useRouter } from 'next/navigation';

export default function CreateOrderForm({ groupId, members, items }: { 
  groupId: string, 
  members: {id: string, name: string}[], 
  items: {id: string, name: string, price: number}[] 
}) {
  const [purchaserId, setPurchaserId] = useState('');
  const [coPurchaserId, setCoPurchaserId] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [wheelCandidates, setWheelCandidates] = useState<any[]>([]);
  const router = useRouter();

  const loadWheelCandidates = async () => {
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/wheel`);
    if (res.ok) {
      const data = await res.json();
      setWheelCandidates(data.candidates);
      setShowWheel(true);
    } else {
      setError('Failed to load wheel candidates');
    }
    setLoading(false);
  };

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id));
    else setSelectedItems([...selectedItems, id]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError('Select at least one food item');
      return;
    }
    
    setError('');
    setLoading(true);
    
    if (!purchaserId || !coPurchaserId) {
      setError('Please select purchasers using the wheel');
      return;
    }

    const res = await fetch(`/api/groups/${groupId}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaserId, coPurchaserId, itemIds: selectedItems })
    });

    if (res.ok) {
      const order = await res.json();
      router.push(`/groups/${groupId}/orders/${order.id}`);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create order');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="glass-panel" style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <label className="input-label">Who is purchasing?</label>
        
        {purchaserId && coPurchaserId ? (
          <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '600' }}>Driver: {members.find(m => m.id === purchaserId)?.name}</div>
            <div style={{ fontWeight: '600' }}>Passenger: {members.find(m => m.id === coPurchaserId)?.name}</div>
            <button type="button" className="btn-secondary" onClick={loadWheelCandidates} style={{ marginTop: '12px' }}>
              Spin Again
            </button>
          </div>
        ) : (
          <button type="button" className="btn-primary" onClick={loadWheelCandidates} disabled={loading} style={{ width: '100%', padding: '12px' }}>
            {loading ? 'Loading...' : 'Spin Wheel to Decide'}
          </button>
        )}
      </div>

      {showWheel && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', position: 'relative' }}>
            <button type="button" onClick={() => setShowWheel(false)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            <SpinningWheel 
              candidates={wheelCandidates} 
              onComplete={(p1, p2) => {
                setPurchaserId(p1);
                setCoPurchaserId(p2);
                setTimeout(() => setShowWheel(false), 2000);
              }} 
            />
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <label className="input-label">Available Items Today</label>
        {items.length === 0 ? (
          <p className="text-danger">No food items exist. Add items first.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map(item => (
              <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  style={{ width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>{item.name}</div>
                  <div className="text-accent" style={{ fontSize: '0.8rem' }}>₹{item.price}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
      
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</div>}
      
      <button type="submit" className="btn-primary" disabled={loading || items.length === 0}>
        {loading ? 'Creating...' : 'Create Order'}
      </button>
    </form>
  );
}

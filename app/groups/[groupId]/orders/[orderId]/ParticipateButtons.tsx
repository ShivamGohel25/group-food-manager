'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParticipateButtons({ groupId, orderId, orderItemId, myQuantity }: {
  groupId: string,
  orderId: string,
  orderItemId: string,
  myQuantity: number
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 0) return;
    setLoading(true);
    const res = await fetch(`/api/groups/${groupId}/orders/${orderId}/participate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderItemId, quantity: newQuantity })
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button 
        onClick={() => updateQuantity(myQuantity - 1)} 
        disabled={loading || myQuantity === 0}
        className="btn-secondary"
        style={{ width: '40px', height: '40px', borderRadius: '8px', fontSize: '1.2rem', padding: 0 }}
      >
        -
      </button>
      
      <div style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: '1.1rem' }}>
        {myQuantity > 0 ? `${myQuantity} added` : 'Add'}
      </div>
      
      <button 
        onClick={() => updateQuantity(myQuantity + 1)} 
        disabled={loading}
        className="btn-primary"
        style={{ width: '40px', height: '40px', borderRadius: '8px', fontSize: '1.2rem', padding: 0 }}
      >
        +
      </button>
    </div>
  );
}

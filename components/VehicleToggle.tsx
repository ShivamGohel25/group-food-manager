'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VehicleToggle({ initialValue }: { initialValue: boolean }) {
  const [hasVehicle, setHasVehicle] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    const newValue = !hasVehicle;
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasVehicle: newValue })
    });
    setLoading(false);
    if (res.ok) {
      setHasVehicle(newValue);
      router.refresh();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
      <label className="input-label" style={{ margin: 0 }}>I own a vehicle:</label>
      <button 
        onClick={toggle}
        disabled={loading}
        className={hasVehicle ? "btn-primary" : "btn-secondary"}
        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
      >
        {hasVehicle ? 'Yes, I do' : 'No, I don\'t'}
      </button>
    </div>
  );
}

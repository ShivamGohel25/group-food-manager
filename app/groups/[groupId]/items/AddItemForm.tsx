'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddItemForm({ groupId }: { groupId: string }) {
  const [name, setName] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = await fetch(`/api/groups/${groupId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, defaultPrice })
    });

    setLoading(false);

    if (res.ok) {
      setName('');
      setDefaultPrice('');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add item');
    }
  };

  return (
    <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label className="input-label">Item Name</label>
        <input 
          type="text" 
          className="input-field" 
          placeholder="e.g. Magpulav" 
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="input-label">Default Price (₹)</label>
        <input 
          type="number" 
          className="input-field" 
          placeholder="e.g. 100" 
          value={defaultPrice}
          onChange={e => setDefaultPrice(e.target.value)}
          required
          min="0"
          step="0.01"
        />
      </div>
      
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{error}</div>}
      
      <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '8px' }}>
        {loading ? 'Adding...' : 'Add Item'}
      </button>
    </form>
  );
}

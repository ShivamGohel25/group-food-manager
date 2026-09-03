'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddMemberForm({ groupId }: { groupId: string }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });

    setLoading(false);

    if (res.ok) {
      setUsername('');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to add member');
    }
  };

  return (
    <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
      <input 
        type="text" 
        className="input-field" 
        placeholder="Enter exact username" 
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Adding...' : 'Add'}
      </button>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', position: 'absolute', marginTop: '48px' }}>{error}</div>}
    </form>
  );
}

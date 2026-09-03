'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewGroupPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });

    if (res.ok) {
      router.push('/groups');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create group');
    }
  };

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/groups" className="nav-link active">Groups</Link>
        </div>
      </nav>

      <div className="flex-center" style={{ minHeight: 'calc(100vh - 80px)', padding: '24px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
          <h1 className="heading-lg" style={{ textAlign: 'center' }}>Create New Group</h1>
          <p className="text-muted" style={{ textAlign: 'center', marginBottom: '24px' }}>Start managing food and expenses with friends.</p>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Group Name</label>
              <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Hostel Friends" />
            </div>
            <div>
              <label className="input-label">Description (Optional)</label>
              <textarea 
                className="input-field" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3} 
                placeholder="What is this group for?"
                style={{ resize: 'none' }}
              />
            </div>
            
            {error && <p className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</p>}
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <Link href="/groups" className="btn-secondary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>Cancel</Link>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>Create Group</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

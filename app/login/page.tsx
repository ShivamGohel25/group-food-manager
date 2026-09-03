'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to login');
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="heading-lg" style={{ textAlign: 'center' }}>Welcome Back</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '24px' }}>Sign in to manage your group expenses</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label">Username</label>
            <input 
              type="text" 
              className="input-field" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {error && <p className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</p>}
          
          <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Sign In</button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          <span className="text-muted">Don't have an account? </span>
          <Link href="/register" className="text-accent" style={{ textDecoration: 'none', fontWeight: '500' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

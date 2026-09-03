import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import VehicleToggle from '@/components/VehicleToggle';

export default async function Dashboard() {
  const authUser = await getUserFromCookie();
  if (!authUser) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: authUser.id }
  });

  if (!user) redirect('/login');

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true }
  });

  // Calculate global user financial summary across all groups
  const paymentsSent = await prisma.payment.findMany({
    where: { fromUserId: user.id }
  });
  
  const paymentsReceived = await prisma.payment.findMany({
    where: { toUserId: user.id }
  });

  let totalExpenses = 0; // Money I owe (sent payments represent debts to the purchaser in this system)
  paymentsSent.forEach(p => totalExpenses += p.amount);

  let totalOwedToMe = 0; // Money others owe me
  paymentsReceived.forEach(p => totalOwedToMe += p.amount);

  // In this system, "Payment" model is actually representing "Debt" from one person to another created at checkout.
  // We can treat `totalExpenses` as "Total You Owe" and `totalOwedToMe` as "Total You Are Owed".

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href="/dashboard" className="nav-link active">Dashboard</Link>
          <Link href="/groups" className="nav-link">Groups</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
            <span className="text-muted">Hello, {user.name}</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Logout</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        <h1 className="heading-xl">Welcome back, {user.name}!</h1>
        <p className="text-muted" style={{ marginBottom: '16px' }}>Here is the summary of your recent activities and groups.</p>
        
        <div className="glass-panel" style={{ marginBottom: '32px', display: 'inline-block' }}>
          <h3 className="heading-md" style={{ marginBottom: '8px' }}>Personal Preferences</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>This helps the spinning wheel select drivers fairly.</p>
          <VehicleToggle initialValue={user.hasVehicle} />
        </div>
        
        <div className="grid-2">
          <div className="glass-panel">
            <h3 className="heading-md">Your Groups ({memberships.length})</h3>
            {memberships.length === 0 ? (
              <p className="text-muted" style={{ marginBottom: '16px' }}>You are not part of any group yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {memberships.slice(0,3).map(m => (
                  <li key={m.id} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <Link href={`/groups/${m.groupId}`} style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: '500' }}>
                      {m.group.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/groups/new" className="btn-primary">Create New Group</Link>
          </div>
          
          <div className="glass-panel">
            <h3 className="heading-md">Global Financial Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <div className="flex-between" style={{ paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>
                <span className="text-muted">You Owe (Total Debt):</span>
                <span className="text-danger" style={{ fontWeight: '600' }}>₹{totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex-between">
                <span className="text-muted">You are owed (Total Credit):</span>
                <span className="text-accent" style={{ fontWeight: '600' }}>₹{totalOwedToMe.toFixed(2)}</span>
              </div>
            </div>
            <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>* Check individual groups for detailed settlements.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

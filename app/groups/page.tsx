import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';

export default async function GroupsPage() {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true }
  });

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/groups" className="nav-link active">Groups</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
            <span className="text-muted">Hello, {user.name}</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Logout</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <h1 className="heading-lg">Your Groups</h1>
          <Link href="/groups/new" className="btn-primary">Create New Group</Link>
        </div>

        {memberships.length === 0 ? (
          <div className="glass-panel">
            <p className="text-muted">You are not part of any groups yet.</p>
          </div>
        ) : (
          <div className="grid-2">
            {memberships.map((m) => (
              <Link href={`/groups/${m.groupId}`} key={m.groupId} style={{ textDecoration: 'none' }}>
                <div className="glass-panel glass-panel-interactive">
                  <h3 className="heading-md">{m.group.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>{m.group.description || 'No description provided.'}</p>
                  <div style={{ marginTop: '16px' }}>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(79, 70, 229, 0.2)', color: '#a5b4fc', padding: '4px 8px', borderRadius: '4px', fontWeight: '500' }}>
                      Role: {m.role}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

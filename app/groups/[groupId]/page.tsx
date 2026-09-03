import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import AddMemberForm from './AddMemberForm';

export default async function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');
  
  const { groupId } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
    include: {
      group: {
        include: {
          members: {
            include: { user: true }
          }
        }
      }
    }
  });

  if (!membership) redirect('/groups');
  
  const group = membership.group;
  const isAdmin = membership.role === 'ADMIN' || membership.role === 'MANAGER';

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/groups" className="nav-link active">Groups</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <div>
            <Link href="/groups" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Groups</Link>
            <h1 className="heading-lg">{group.name}</h1>
            <p className="text-muted">{group.description}</p>
          </div>
          <div>
            <Link href={`/groups/${group.id}/orders/new`} className="btn-primary">Create Food Order</Link>
          </div>
        </div>

        <div className="grid-2">
          <div className="glass-panel">
            <h3 className="heading-md">Members ({group.members.length})</h3>
            
            {isAdmin && <AddMemberForm groupId={group.id} />}
            
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              {group.members.map((m) => (
                <li key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{m.user.name} {m.userId === user.id && <span className="text-accent" style={{ fontSize: '0.8rem' }}>(You)</span>}</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>@{m.user.username}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>{m.role}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="glass-panel">
            <h3 className="heading-md" style={{ marginBottom: '16px' }}>Upcoming Orders</h3>
            <p className="text-muted">No upcoming orders. Create one to get started!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

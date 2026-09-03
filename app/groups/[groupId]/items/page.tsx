import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import AddItemForm from './AddItemForm';

export default async function FoodItemsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');
  
  const { groupId } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
    include: { group: { include: { foodItems: true } } }
  });

  if (!membership) redirect('/groups');
  
  const group = membership.group;
  const isAdmin = membership.role === 'ADMIN' || membership.role === 'MANAGER';

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href={`/groups/${group.id}`} className="nav-link">Overview</Link>
          <Link href={`/groups/${group.id}/items`} className="nav-link active">Food Items</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        <h1 className="heading-lg">Food Menu - {group.name}</h1>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Manage the items available for ordering in this group.</p>

        <div className="grid-2">
          {isAdmin && (
            <div className="glass-panel">
              <h3 className="heading-md">Add New Item</h3>
              <AddItemForm groupId={group.id} />
            </div>
          )}
          
          <div className="glass-panel">
            <h3 className="heading-md" style={{ marginBottom: '16px' }}>Available Items ({group.foodItems.length})</h3>
            
            {group.foodItems.length === 0 ? (
              <p className="text-muted">No food items added yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.foodItems.map(item => (
                  <li key={item.id} className="flex-between" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{item.name}</span>
                    <span className="text-accent" style={{ fontWeight: '600' }}>₹{item.defaultPrice}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

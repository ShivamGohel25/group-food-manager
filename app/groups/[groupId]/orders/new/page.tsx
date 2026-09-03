import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import CreateOrderForm from './CreateOrderForm';

export default async function NewOrderPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');
  
  const { groupId } = await params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: true } },
      foodItems: true
    }
  });

  if (!group) redirect('/groups');

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href={`/groups/${group.id}`} className="nav-link">Overview</Link>
          <Link href={`/groups/${group.id}/items`} className="nav-link">Food Items</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        <h1 className="heading-lg">Create New Order</h1>
        <p className="text-muted" style={{ marginBottom: '24px' }}>Select who is purchasing and which items are available today.</p>

        <CreateOrderForm 
          groupId={group.id} 
          members={group.members.map(m => ({ id: m.user.id, name: m.user.name }))} 
          items={group.foodItems.map(i => ({ id: i.id, name: i.name, price: i.defaultPrice }))} 
        />
      </div>
    </div>
  );
}

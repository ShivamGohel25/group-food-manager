import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import ParticipateButtons from './ParticipateButtons';
import CompleteOrderButton from './CompleteOrderButton';

export default async function OrderDetailPage({ params }: { params: Promise<{ groupId: string, orderId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');
  
  const { groupId, orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      group: true,
      purchaser: true,
      coPurchaser: true,
      orderItems: {
        include: {
          foodItem: true,
          participants: { include: { user: true } }
        }
      }
    }
  });

  if (!order || order.groupId !== groupId) redirect(`/groups/${groupId}`);

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } }
  });
  const isAdmin = membership && (membership.role === 'ADMIN' || membership.role === 'MANAGER');

  let totalCost = 0;
  order.orderItems.forEach(item => {
    totalCost += item.price * item.quantity;
  });

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href={`/groups/${groupId}`} className="nav-link">Overview</Link>
          <Link href={`/groups/${groupId}/items`} className="nav-link">Food Items</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <div>
            <Link href={`/groups/${groupId}`} className="text-muted" style={{ textDecoration: 'none', fontSize: '0.9rem', marginBottom: '8px', display: 'inline-block' }}>&larr; Back to Group</Link>
            <h1 className="heading-lg">Order Details</h1>
            <p className="text-muted">
              Purchasers: <span style={{ color: 'var(--text-main)' }}>{order.purchaser.name}</span>
              {order.coPurchaser && <span style={{ color: 'var(--text-main)' }}> & {order.coPurchaser.name}</span>} | Date: {new Date(order.date).toLocaleDateString()}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
             <span style={{ padding: '8px 16px', background: order.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: order.status === 'COMPLETED' ? 'var(--accent)' : 'var(--warning)', borderRadius: '8px', fontWeight: '600' }}>
               {order.status}
             </span>
             <div className="text-muted">Estimated Total: <span className="text-accent" style={{ fontWeight: '600', fontSize: '1.1rem' }}>₹{totalCost}</span></div>
          </div>
        </div>
        
        {order.status === 'UPCOMING' && (order.purchaserId === user.id || order.coPurchaserId === user.id || isAdmin) && (
          <div className="glass-panel" style={{ marginBottom: '24px', maxWidth: '400px' }}>
            <h3 className="heading-md">Finalize Purchase</h3>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>If you have purchased the items, complete this order to calculate the split expenses for everyone.</p>
            <CompleteOrderButton 
              groupId={groupId} 
              orderId={orderId} 
              purchaser={order.purchaser}
              coPurchaser={order.coPurchaser}
              totalCost={totalCost}
            />
          </div>
        )}

        <div className="grid-2">
          {order.orderItems.map(item => {
            const isParticipating = item.participants.some(p => p.userId === user.id);
            return (
              <div key={item.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="flex-between" style={{ marginBottom: '16px' }}>
                    <h3 className="heading-md">{item.foodItem.name}</h3>
                    <span className="text-accent" style={{ fontWeight: '600' }}>₹{item.price}</span>
                  </div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '8px' }}>People ordering this ({item.quantity}):</p>
                    {item.participants.length === 0 ? (
                      <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>No one yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {item.participants.map(p => (
                          <span key={p.id} style={{ fontSize: '0.8rem', background: p.userId === user.id ? 'rgba(79, 70, 229, 0.3)' : 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                            {p.user.name} {p.userId === user.id ? '(You)' : ''} <strong style={{ color: 'var(--accent)', marginLeft: '4px' }}>x{p.quantity}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {order.status === 'UPCOMING' && (
                  <ParticipateButtons 
                    groupId={groupId} 
                    orderId={orderId} 
                    orderItemId={item.id} 
                    myQuantity={item.participants.find(p => p.userId === user.id)?.quantity || 0} 
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

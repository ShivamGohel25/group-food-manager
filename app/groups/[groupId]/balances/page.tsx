import { getUserFromCookie } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import Link from 'next/link';
import SettlementList from '@/components/SettlementList';
import PaymentHistory from '@/components/PaymentHistory';

export default async function BalancesPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) redirect('/login');
  
  const { groupId } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
    include: { group: { include: { members: { include: { user: true } } } } }
  });

  if (!membership) redirect('/groups');
  const group = membership.group;

  const completedOrders = await prisma.order.findMany({
    where: { groupId, status: 'COMPLETED' },
    include: {
      orderItems: { include: { participants: true } },
      orderPayers: true
    }
  });

  const payments = await prisma.payment.findMany({
    where: { groupId }
  });

  const balances: Record<string, number> = {};
  group.members.forEach(m => balances[m.userId] = 0);

  for (const order of completedOrders) {
    for (const item of order.orderItems) {
      if (item.quantity > 0) {
        for (const participant of item.participants) {
          if (participant.quantity > 0 && balances[participant.userId] !== undefined) {
            balances[participant.userId] -= (item.price * participant.quantity);
          }
        }
      }
    }

    for (const payer of order.orderPayers) {
      if (balances[payer.userId] !== undefined) {
        balances[payer.userId] += payer.amount;
      }
    }
  }

  payments.forEach(p => {
    if (balances[p.fromUserId] !== undefined) balances[p.fromUserId] += p.amount;
    if (balances[p.toUserId] !== undefined) balances[p.toUserId] -= p.amount;
  });

  const debtors = Object.keys(balances).filter(id => balances[id] < -0.01).map(id => ({ id, amount: -balances[id] })).sort((a,b) => b.amount - a.amount);
  const creditors = Object.keys(balances).filter(id => balances[id] > 0.01).map(id => ({ id, amount: balances[id] })).sort((a,b) => b.amount - a.amount);

  const settlements: { from: string, to: string, amount: number }[] = [];
  
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0.01) {
      settlements.push({ from: debtor.id, to: creditor.id, amount: Number(amount.toFixed(2)) });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  const userNames: Record<string, string> = {};
  group.members.forEach(m => userNames[m.userId] = m.user.name);

  return (
    <div>
      <nav className="nav-bar">
        <h2 className="heading-md" style={{ margin: 0 }}>Group Food Manager</h2>
        <div className="nav-links">
          <Link href={`/groups/${groupId}`} className="nav-link">Overview</Link>
          <Link href={`/groups/${groupId}/balances`} className="nav-link active">Balances</Link>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: '40px' }}>
        <h1 className="heading-lg">Financial Balances - {group.name}</h1>
        <p className="text-muted" style={{ marginBottom: '24px' }}>See who owes whom based on completed orders.</p>

        <div className="grid-2">
          <div className="glass-panel">
            <h3 className="heading-md" style={{ marginBottom: '16px' }}>Individual Net Balances</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.members.map(m => {
                const bal = balances[m.userId] || 0;
                const color = bal > 0.01 ? 'var(--accent)' : bal < -0.01 ? 'var(--danger)' : 'var(--text-muted)';
                return (
                  <li key={m.id} className="flex-between" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '500' }}>{m.user.name} {m.userId === user.id ? '(You)' : ''}</span>
                    <span style={{ color, fontWeight: '600' }}>{bal > 0.01 ? '+' : ''}₹{bal.toFixed(2)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="glass-panel">
            <h3 className="heading-md" style={{ marginBottom: '16px' }}>Suggested Settlements</h3>
            <SettlementList 
              groupId={groupId} 
              currentUserId={user.id} 
              settlements={settlements} 
              userNames={userNames} 
            />
          </div>

          <div className="glass-panel" style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <h3 className="heading-md" style={{ marginBottom: '16px' }}>Payment History</h3>
            <PaymentHistory 
              payments={payments} 
              userNames={userNames} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

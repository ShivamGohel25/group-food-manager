import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = await params;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } }
  });

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true }
  });

  const balances: Record<string, { userId: string, name: string, balance: number }> = {};
  for (const member of groupMembers) {
    balances[member.userId] = { userId: member.userId, name: member.user.name, balance: 0 };
  }

  // 1. Calculate how much each person consumed
  const completedOrders = await prisma.order.findMany({
    where: { groupId, status: 'COMPLETED' },
    include: {
      orderItems: { include: { participants: true } },
      orderPayers: true
    }
  });

  for (const order of completedOrders) {
    for (const item of order.orderItems) {
      if (item.quantity > 0) {
        for (const participant of item.participants) {
          if (participant.quantity > 0 && balances[participant.userId]) {
            balances[participant.userId].balance -= item.price * participant.quantity;
          }
        }
      }
    }

    // 2. Add amount paid by payers
    for (const payer of order.orderPayers) {
      if (balances[payer.userId]) {
        balances[payer.userId].balance += payer.amount;
      }
    }
  }

  // 3. Apply peer-to-peer payments
  const payments = await prisma.payment.findMany({
    where: { groupId }
  });

  for (const payment of payments) {
    if (balances[payment.fromUserId]) {
      balances[payment.fromUserId].balance += payment.amount;
    }
    if (balances[payment.toUserId]) {
      balances[payment.toUserId].balance -= payment.amount;
    }
  }

  // Return list of balances, sorted by balance (those who owe most first)
  const balancesArray = Object.values(balances).sort((a, b) => a.balance - b.balance);

  return NextResponse.json({ balances: balancesArray });
}

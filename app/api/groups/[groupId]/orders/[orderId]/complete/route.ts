import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string, orderId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId, orderId } = await params;
  const { payers } = await req.json(); // { userId: string, amount: number }[]

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: { include: { participants: true } }
    }
  });

  if (!order || order.groupId !== groupId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (order.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Order is already completed' }, { status: 400 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } }
  });

  if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'MANAGER' && order.purchaserId !== user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let totalCost = 0;
  for (const item of order.orderItems) {
    if (item.quantity > 0) {
      for (const participant of item.participants) {
        if (participant.quantity > 0) {
          totalCost += item.price * participant.quantity;
        }
      }
    }
  }

  // We assume the payers array matches the total cost, or they can just input what they actually paid
  const orderPayersData = (payers || []).map((p: any) => ({
    orderId,
    userId: p.userId,
    amount: p.amount
  }));

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' }
    }),
    ...(orderPayersData.length > 0 ? [
      prisma.orderPayer.createMany({
        data: orderPayersData
      })
    ] : [])
  ]);

  return NextResponse.json({ success: true });
}

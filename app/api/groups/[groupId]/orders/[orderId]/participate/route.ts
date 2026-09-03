import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string, orderId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId, orderId } = await params;
  const { orderItemId, quantity } = await req.json();

  const orderItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true }
  });

  if (!orderItem || orderItem.order.id !== orderId || orderItem.order.groupId !== groupId) {
    return NextResponse.json({ error: 'Invalid order item' }, { status: 400 });
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
  }

  if (quantity > 0) {
    await prisma.orderParticipant.upsert({
      where: { orderItemId_userId: { orderItemId, userId: user.id } },
      update: { quantity },
      create: { orderItemId, userId: user.id, quantity }
    });
  } else {
    await prisma.orderParticipant.deleteMany({
      where: { orderItemId, userId: user.id }
    });
  }

  const result = await prisma.orderParticipant.aggregate({
    _sum: { quantity: true },
    where: { orderItemId }
  });

  const totalQuantity = result._sum.quantity || 0;

  await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { quantity: totalQuantity }
  });

  return NextResponse.json({ success: true, quantity: totalQuantity });
}

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = await params;
  const { purchaserId, coPurchaserId, itemIds } = await req.json();

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } }
  });

  if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const foodItems = await prisma.foodItem.findMany({
    where: { id: { in: itemIds }, groupId }
  });

  const order = await prisma.order.create({
    data: {
      groupId,
      purchaserId,
      coPurchaserId: coPurchaserId || null,
      orderItems: {
        create: foodItems.map(item => ({
          foodItemId: item.id,
          price: item.defaultPrice,
          quantity: 0
        }))
      }
    }
  });

  return NextResponse.json(order);
}

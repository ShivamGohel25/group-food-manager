import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = await params;

  try {
    const { toUserId, amount } = await req.json();

    if (!toUserId || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Verify user is in group
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        groupId,
        fromUserId: user.id,
        toUserId,
        amount
      }
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

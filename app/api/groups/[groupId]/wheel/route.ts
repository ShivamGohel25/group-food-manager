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

  const candidates = await Promise.all(
    groupMembers.map(async (member) => {
      const purchaserCount = await prisma.order.count({
        where: {
          groupId,
          status: 'COMPLETED',
          OR: [
            { purchaserId: member.userId },
            { coPurchaserId: member.userId }
          ]
        }
      });

      return {
        userId: member.userId,
        name: member.user.name,
        hasVehicle: member.user.hasVehicle,
        count: purchaserCount
      };
    })
  );

  candidates.sort((a, b) => a.count - b.count);

  return NextResponse.json({ candidates });
}

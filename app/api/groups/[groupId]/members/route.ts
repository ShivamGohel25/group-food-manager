import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = await params;
  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  const requesterMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } }
  });

  if (!requesterMembership || (requesterMembership.role !== 'ADMIN' && requesterMembership.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden: only admins can add members' }, { status: 403 });
  }

  const targetUser = await prisma.user.findUnique({ where: { username } });
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const existingMember = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: targetUser.id, groupId } }
  });

  if (existingMember) return NextResponse.json({ error: 'User is already a member' }, { status: 400 });

  await prisma.groupMember.create({
    data: {
      userId: targetUser.id,
      groupId,
      role: 'MEMBER'
    }
  });

  return NextResponse.json({ success: true });
}

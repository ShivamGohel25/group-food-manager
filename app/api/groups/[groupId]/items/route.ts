import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { groupId } = await params;

  const items = await prisma.foodItem.findMany({ where: { groupId } });
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { groupId } = await params;
  const { name, defaultPrice } = await req.json();

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } }
  });

  if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const item = await prisma.foodItem.create({
    data: { groupId, name, defaultPrice: parseFloat(defaultPrice) }
  });

  return NextResponse.json(item);
}

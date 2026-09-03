import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true }
  });

  return NextResponse.json(memberships.map(m => m.group));
}

export async function POST(req: Request) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: 'Group name required' }, { status: 400 });

  const group = await prisma.group.create({
    data: {
      name,
      description,
      members: {
        create: {
          userId: user.id,
          role: 'ADMIN'
        }
      }
    }
  });

  return NextResponse.json(group);
}

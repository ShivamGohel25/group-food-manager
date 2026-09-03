import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function PATCH(req: Request) {
  const user = await getUserFromCookie();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hasVehicle } = await req.json();

  if (typeof hasVehicle !== 'boolean') {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { hasVehicle }
  });

  return NextResponse.json({ success: true });
}

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const response = NextResponse.redirect(new URL('/login', req.url));
  response.cookies.delete('auth_token');
  return response;
}

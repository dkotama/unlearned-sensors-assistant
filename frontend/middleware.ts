import { NextResponse, NextRequest } from 'next/server';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebaseConfig';

export function middleware(request: NextRequest) {
  // Temporarily bypass auth check for debugging routing issues
  // return new Promise((resolve) => {
  //   onAuthStateChanged(auth, (user) => {
  //     if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/dashboard'))) {
  //       return resolve(NextResponse.redirect(new URL('/login', request.url)));
  //     }
  //     resolve(NextResponse.next());
  //   });
  // });
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
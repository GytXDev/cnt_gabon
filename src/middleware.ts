import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: [
    '/',
    '/horaires',
    '/achat-billet',
    '/achat-billet/download',
    '/api/singpay/(.*)',
    '/api/tickets/verify',
    '/api/tickets/(.*)',
    '/api/buses/(.*)',
    '/api/chat/(.*)',
    '/api/users/sync',
  ],
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

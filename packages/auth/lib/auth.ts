import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import db from '@play-money/database'
import { PrismaAdapter } from './auth-prisma-adapter'

if (!process.env.NEXTAUTH_URL) {
  throw new Error('NEXTAUTH_URL is not set')
}

const useSecureCookies = process.env.NEXTAUTH_URL.startsWith('https://')
const cookiePrefix = useSecureCookies ? '__Secure-' : ''
const hostName = new URL(process.env.NEXTAUTH_URL).hostname

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/check-email',
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Support cookies on different subdomains
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        domain: `.${hostName}`,
        secure: useSecureCookies,
      },
    },
  },

  providers: [
    Resend({
      from: 'case@casesandberg.com',
    }),
  ],
})

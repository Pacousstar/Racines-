import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'

// Toutes les pages du dashboard utilisent la session (cookies) : rendu dynamique uniquement.
export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await getSession()
    if (!session) redirect('/login')
    return <DashboardLayoutClient user={session}>{children}</DashboardLayoutClient>
  } catch (e) {
    console.error('DashboardLayout error:', e)
    redirect('/login?error=session')
  }
}

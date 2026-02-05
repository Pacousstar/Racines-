import { Session } from './auth'
import { prisma } from './db'

/**
 * Récupère l'entiteId à utiliser pour les opérations.
 * Pour SUPER_ADMIN, utilise l'entiteId de la session (qui peut être changé).
 * Pour les autres, utilise l'entiteId de l'utilisateur en base (sécurité).
 */
export async function getEntiteId(session: Session): Promise<number> {
  if (session.role === 'SUPER_ADMIN') {
    // SUPER_ADMIN peut utiliser l'entité sélectionnée dans la session
    return session.entiteId || session.userId // Fallback si pas défini
  }
  
  // Pour les autres rôles, on récupère depuis la base (sécurité)
  const user = await prisma.utilisateur.findUnique({
    where: { id: session.userId },
    select: { entiteId: true },
  })
  
  return user?.entiteId || session.entiteId || session.userId
}

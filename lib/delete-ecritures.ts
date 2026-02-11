import { prisma } from './db'

/**
 * Supprime toutes les écritures comptables liées à une opération (vente, achat, etc.).
 * À appeler avant de supprimer l'enregistrement métier pour garder la cohérence comptable.
 */
export async function deleteEcrituresByReference(
  referenceType: string,
  referenceId: number
): Promise<number> {
  const result = await prisma.ecritureComptable.deleteMany({
    where: { referenceType, referenceId },
  })
  return result.count
}

# Inspection finale GestiCom-Portable

Dernière vérification avant compilation pour clé USB / autre PC.

## 1. Erreur réseau — résolue

- **Aucun appel réseau externe** : tous les `fetch()` de l’application utilisent des URLs **relatives** (`/api/...`). Ils ciblent le serveur Next.js local (même origine). Aucune dépendance à Internet en utilisation normale.
- **Portable** : le launcher démarre le serveur sur la machine, puis ouvre le navigateur sur `http://localhost:3000`. Tout le trafic reste en **localhost**. Aucune "erreur réseau" possible liée à Internet : l’app fonctionne **100 % hors ligne** une fois le serveur lancé.
- Aucun message "Failed to fetch", "erreur réseau" ou "network error" n’est affiché dans l’interface ; en cas d’échec d’un `fetch`, c’est le message d’erreur métier (API) qui s’affiche.

## 2. Build et livrables

- **next.config.ts** : `output: "standalone"` → build autonome pour le portable.
- **Build** : `npm run build` génère `.next/standalone` et `.next/static` (vérifié).
- **Script build portable** : `npm run build:portable` copie standalone, static, public, `ensure-schema.js`, `portable-launcher.js`, crée `data/gesticom.db`, `Lancer.bat`, `Lancer.vbs`, `README-Portable.txt`.
- **Schéma BD** : au démarrage du portable, `ensure-schema.js` est exécuté automatiquement (colonnes `montantPaye`/`statutPaiement`, table `Depense` si besoin). Pas d’erreur P2022 en conditions normales.

## 3. Sécurité et bonnes pratiques

- Pas de secret en dur dans le code ; `SESSION_SECRET` par défaut uniquement pour le portable (à changer en prod si déploiement réseau).
- Chemins avec espaces : le launcher gère (copie vers `C:\gesticom_portable_data` si besoin, resync à l’arrêt).
- Une seule instance : fichier `.gesticom-portable.lock` + PID pour éviter les doubles lancements.

## 4. Checklist avant de copier sur clé

1. **Compiler** : depuis le dossier du projet (`gesticom`) :  
   `npm run build:portable`
2. **Vérifier** : le dossier `GestiCom-Portable` contient `server.js`, `.next/standalone`, `.next/static`, `data/gesticom.db`, `portable-launcher.js`, `ensure-schema.js`, `Lancer.bat`, `Lancer.vbs`.
3. **Ajouter** : `node.exe` (zip Node.js LTS Windows) dans `GestiCom-Portable`.
4. **Tester** sur ce PC : double-clic sur `Lancer.vbs` ou `Lancer.bat` → le navigateur s’ouvre sur http://localhost:3000, connexion admin / Admin@123.
5. **Copier** tout le dossier `GestiCom-Portable` sur la clé USB.
6. **Sur l’autre PC** : lancer depuis la clé (ou copier le dossier sur le disque) puis `Lancer.vbs` ou `Lancer.bat`. Aucune connexion Internet requise.

## 5. Résumé

- **Réseau** : aucun appel externe ; tout est localhost. Pas d’"erreur réseau" en usage portable.
- **Build** : standalone OK ; lint sans erreur ; build Next + Prisma OK.
- **Portable** : launcher, ensure-schema, une instance, chemins avec espaces gérés, base dans `data/` (ou C:\ si espaces).
- Vous pouvez compiler et copier GestiCom-Portable sur clé en toute confiance.

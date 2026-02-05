# Persistance de la base en version portable — explication et correction

## Ce qui se passait (problème)

Sur un PC où le chemin du dossier GestiCom-Portable contient des **espaces** (ex. `D:\GSN EXPERTISES GROUP\GestiCom-Portable` ou clé USB avec espace dans le nom), SQLite peut rencontrer des difficultés. Le launcher copie donc la base vers **C:\gesticom_portable_data\gesticom.db** et fait tourner l’application avec cette copie.

**Comportement ancien (bug) :**

- À **chaque** démarrage de Lancer.bat, le launcher **écrasait** le fichier C:\ avec le contenu de **data/gesticom.db**.
- Pendant la session, tous les enregistrements (produits, stock, ventes, achats, dépenses, paramètres magasins, etc.) étaient bien écrits dans **C:\gesticom_portable_data\gesticom.db**.
- À l’arrêt, le launcher recopiait C:\ vers **data/gesticom.db** — **mais** si vous fermiez en tuant le processus ou si la fenêtre se fermait brutalement, cette recopie ne s’exécutait pas.
- Au **redémarrage** suivant : le launcher recopiait à nouveau **data/gesticom.db** (toujours l’ancienne version, jamais mise à jour) **vers C:\, en écrasant** le fichier C:\ qui contenait tous vos enregistrements. Résultat : la base semblait « à zéro », tout le travail paraissait perdu.

Vous voyiez par exemple « Base data/gesticom.db (272 Ko) » au lancement et encore après reconnexion, car l’app utilisait en réalité C:\, mais au prochain démarrage C:\ était remplacé par l’ancien data/ de 272 Ko.

## Ce qui a été corrigé

Le launcher a été modifié pour **ne plus jamais écraser C:\ avec data/** lorsque le fichier **C:\gesticom_portable_data\gesticom.db existe déjà**.

- **Premier lancement** (ou nouveau PC où C:\ n’existe pas) : **data/gesticom.db** est copié vers C:\, et l’app utilise C:\.
- **Lancements suivants sur le même PC** : si **C:\gesticom_portable_data\gesticom.db** existe, le launcher **l’utilise tel quel** et ne le remplace pas par data/. Tous les enregistrements passés restent donc disponibles ; les nouveaux s’ajoutent à la même base.
- **À l’arrêt** (fermeture normale de Lancer.bat) : C:\ est recopié vers **data/gesticom.db**, pour que le dossier portable (ou la clé) emporte la dernière version.

Ainsi, sur le même PC : vous lancez Lancer.bat, vous enregistrez, vous fermez Lancer.bat, vous éteignez le PC ; au retour, vous relancez Lancer.bat et la base affiche et prend en compte **tous** les enregistrements passés, tout en acceptant les nouveaux.

## Ce que vous devez faire

1. **Fermer proprement** : arrêtez GestiCom en fermant la fenêtre **Lancer.bat** (ou en quittant normalement). Évitez de tuer le processus (Gestionnaire des tâches) pour que la recopie C:\ → data/ ait bien lieu.
2. **Après mise à jour du launcher** : si vous aviez déjà perdu des données, elles peuvent encore être dans **C:\gesticom_portable_data\gesticom.db**. Ouvrez ce dossier ; si le fichier existe et a une taille plus grande que 272 Ko, c’est très probablement votre base avec les enregistrements. Avec le nouveau launcher, au prochain lancement cette base sera réutilisée et ne sera plus écrasée.
3. **Changer de PC ou recopier le portable** : après une fermeture normale, **data/gesticom.db** contient la dernière base. En copiant tout le dossier GestiCom-Portable sur une clé ou un autre PC, **data/gesticom.db** voyage avec ; sur le nouvel emplacement, si le chemin a des espaces, le launcher créera une nouvelle copie dans C:\ à partir de ce data/, et ne l’écrasera plus aux lancements suivants.

En résumé : la base affiche et prend bien en compte tous les enregistrements passés, et les nouveaux s’ajoutent, à condition de fermer Lancer.bat correctement pour que data/ soit mise à jour avant d’éteindre ou de déplacer le dossier.

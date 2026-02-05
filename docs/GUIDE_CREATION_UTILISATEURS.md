# Guide : Création d'utilisateurs par SUPER_ADMIN et ADMIN

## Vue d'ensemble

Seuls les **SUPER_ADMIN** et **ADMIN** peuvent créer de nouveaux utilisateurs dans GestiCom. Ce guide explique le processus complet.

---

## 🔐 Étape 1 : Connexion

### Identifiants par défaut

Lors de la première installation, un utilisateur **SUPER_ADMIN** est créé automatiquement :

- **Login** : `admin`
- **Mot de passe** : `Admin@123`

### Processus de connexion

1. Accédez à la page de connexion : `http://localhost:3000/login`
2. Entrez votre **login** et votre **mot de passe**
3. Cliquez sur **"Se connecter"**
4. Vous serez redirigé vers le tableau de bord (`/dashboard`)

---

## 👥 Étape 2 : Accéder à la création d'utilisateurs

### Option 1 : Via l'URL directe

Une fois connecté en tant que **SUPER_ADMIN** ou **ADMIN**, accédez directement à :

```
http://localhost:3000/register
```

### Option 2 : Via le menu (si disponible)

Si une page de gestion des utilisateurs existe dans le menu, vous pouvez y accéder depuis le tableau de bord.

---

## ➕ Étape 3 : Créer un nouvel utilisateur

### Formulaire de création

Le formulaire de création d'utilisateur demande les informations suivantes :

#### Champs obligatoires

1. **Identifiant (Login)**
   - Minimum 3 caractères, maximum 50
   - Uniquement lettres, chiffres, tirets et underscores
   - Doit être unique dans le système

2. **Nom complet**
   - Minimum 2 caractères, maximum 100
   - Nom complet de l'utilisateur

3. **Mot de passe**
   - Minimum 8 caractères, maximum 100
   - Doit être confirmé (les deux champs doivent correspondre)

4. **Rôle**
   - Sélection parmi :
     - **SUPER_ADMIN** : Accès total (uniquement créable par SUPER_ADMIN)
     - **ADMIN** : Gestion opérationnelle
     - **COMPTABLE** : Accès comptable
     - **GESTIONNAIRE** : Gestion commerciale
     - **MAGASINIER** : Gestion des stocks
     - **ASSISTANTE** : Saisie limitée

5. **Entité**
   - Sélection de l'entité à laquelle l'utilisateur appartient
   - Liste déroulante des entités disponibles

#### Champs optionnels

- **Email** : Adresse email de l'utilisateur (doit être unique si fourni)

### Restrictions importantes

⚠️ **Important** :
- Seul un **SUPER_ADMIN** peut créer un autre **SUPER_ADMIN**
- Un **ADMIN** ne peut pas créer de **SUPER_ADMIN**
- Les autres rôles ne peuvent pas créer d'utilisateurs

---

## 📋 Exemple de création

### Créer un Gestionnaire

1. Connectez-vous en tant que **SUPER_ADMIN** ou **ADMIN**
2. Accédez à `/register`
3. Remplissez le formulaire :
   - **Identifiant** : `gestionnaire01`
   - **Nom** : `Jean Dupont`
   - **Email** : `jean.dupont@example.com` (optionnel)
   - **Rôle** : `GESTIONNAIRE`
   - **Entité** : Sélectionnez l'entité appropriée
   - **Mot de passe** : `MotDePasse123!`
   - **Confirmer** : `MotDePasse123!`
4. Cliquez sur **"Créer l'utilisateur"**
5. L'utilisateur sera créé et vous serez redirigé

### Créer un Comptable

Même processus, mais sélectionnez le rôle **COMPTABLE**.

---

## 🔒 Sécurité

### Vérifications automatiques

Le système vérifie automatiquement :

- ✅ L'utilisateur est bien connecté
- ✅ L'utilisateur a les permissions (SUPER_ADMIN ou ADMIN)
- ✅ Le login n'existe pas déjà
- ✅ L'email n'existe pas déjà (si fourni)
- ✅ Le mot de passe respecte les critères (minimum 8 caractères)
- ✅ Les mots de passe correspondent
- ✅ L'entité existe
- ✅ Seul SUPER_ADMIN peut créer SUPER_ADMIN

### Protection des données

- Les mots de passe sont **hashés** avec bcrypt (10 rounds)
- Les mots de passe ne sont jamais stockés en clair
- Les sessions sont sécurisées avec JWT

---

## 🚨 En cas d'erreur

### Erreurs courantes

1. **"Non autorisé"**
   - Vous n'êtes pas connecté ou n'avez pas les permissions
   - Solution : Connectez-vous en tant que SUPER_ADMIN ou ADMIN

2. **"Ce login est déjà utilisé"**
   - Le login existe déjà dans le système
   - Solution : Choisissez un autre login

3. **"Cet email est déjà utilisé"**
   - L'email existe déjà
   - Solution : Utilisez un autre email ou laissez le champ vide

4. **"Seul un Super Administrateur peut créer un Super Administrateur"**
   - Vous essayez de créer un SUPER_ADMIN en tant qu'ADMIN
   - Solution : Connectez-vous en tant que SUPER_ADMIN

5. **"Le mot de passe doit contenir au moins 8 caractères"**
   - Le mot de passe est trop court
   - Solution : Utilisez un mot de passe d'au moins 8 caractères

---

## 📝 Résumé rapide

1. **Connexion** : `admin` / `Admin@123`
2. **Accès** : `/register`
3. **Remplir** : Formulaire avec toutes les informations
4. **Créer** : Cliquer sur "Créer l'utilisateur"
5. **Résultat** : Utilisateur créé et prêt à se connecter

---

## 💡 Bonnes pratiques

- **Mots de passe forts** : Utilisez des mots de passe complexes (lettres, chiffres, caractères spéciaux)
- **Logins explicites** : Utilisez des logins clairs (ex: `jean.dupont`, `comptable01`)
- **Rôles appropriés** : Attribuez le rôle le plus restrictif possible (principe du moindre privilège)
- **Documentation** : Notez les identifiants créés dans un endroit sécurisé

---

## 🔄 Modification et suppression

- **Modification** : Les SUPER_ADMIN et ADMIN peuvent modifier les utilisateurs (via une page de gestion si disponible)
- **Suppression** : Seul le SUPER_ADMIN peut supprimer des utilisateurs

---

Pour toute question ou problème, contactez votre administrateur système.

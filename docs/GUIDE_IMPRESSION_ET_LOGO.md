# Guide : Impression et Ajout de Logo - GestiCom

**Date :** Février 2026

---

## 📍 Où se trouve la partie Impression ?

### 1. Configuration des Templates d'Impression

**Chemin :** `/dashboard/parametres/impression`

**Accès :**
1. Connectez-vous à GestiCom
2. Allez dans le menu **Paramètres** (icône ⚙️)
3. Cliquez sur **Impression**

**Fonctionnalités :**
- ✅ Créer des templates personnalisés pour les ventes et achats
- ✅ Ajouter/modifier le logo de l'entreprise
- ✅ Personnaliser l'en-tête et le pied de page
- ✅ Prévisualiser les templates
- ✅ Activer/désactiver des templates

---

## 🖼️ Comment Ajouter le Logo ?

### Étape 1 : Accéder à la page Impression

1. Menu **Paramètres** → **Impression**
2. Ou directement : `http://localhost:3000/dashboard/parametres/impression`

### Étape 2 : Créer ou Modifier un Template

1. **Créer un nouveau template :**
   - Cliquez sur le bouton **"Nouveau Template"** (icône ➕)
   - Remplissez le formulaire :
     - **Type** : Vente, Achat, Bon de livraison, ou Facture
     - **Nom** : Donnez un nom à votre template (ex: "Ticket Standard")

2. **Modifier un template existant :**
   - Cliquez sur le bouton **"Modifier"** (icône ✏️) à côté du template

### Étape 3 : Ajouter le Logo

Dans le formulaire de création/modification :

1. **Section "Logo"** :
   - Cliquez sur **"Choisir un fichier"** ou **"Upload Logo"**
   - Sélectionnez une image (JPG, PNG, etc.)
   - **Limite :** 2 Mo maximum
   - Le logo sera automatiquement converti en base64 et sauvegardé

2. **Personnaliser l'en-tête** :
   - Dans l'éditeur HTML, vous pouvez utiliser la variable `{ENTREPRISE_LOGO}`
   - Le logo s'affichera automatiquement à l'endroit où vous placez cette variable

3. **Sauvegarder** :
   - Cliquez sur **"Enregistrer"**
   - Le template sera disponible pour l'impression

---

## 🖨️ Comment Imprimer une Vente ou un Achat ?

### Pour une Vente

1. **Accéder à la page Ventes :**
   - Menu **Ventes** → Liste des ventes

2. **Ouvrir le détail d'une vente :**
   - Cliquez sur l'icône **"Voir"** (👁️) à côté d'une vente
   - Ou cliquez sur le numéro de la vente

3. **Imprimer :**
   - Dans la popup de détail, cliquez sur le bouton **"Imprimer"** (icône 🖨️)
   - Une nouvelle fenêtre s'ouvrira avec le document formaté
   - La boîte de dialogue d'impression du navigateur s'affichera automatiquement

### Pour un Achat

1. **Accéder à la page Achats :**
   - Menu **Achats** → Liste des achats

2. **Ouvrir le détail d'un achat :**
   - Cliquez sur l'icône **"Voir"** (👁️) à côté d'un achat
   - Ou cliquez sur le numéro de l'achat

3. **Imprimer :**
   - Dans la popup de détail, cliquez sur le bouton **"Imprimer"** (icône 🖨️)
   - Une nouvelle fenêtre s'ouvrira avec le document formaté
   - La boîte de dialogue d'impression du navigateur s'affichera automatiquement

---

## 📋 Variables Disponibles dans les Templates

Vous pouvez utiliser ces variables dans l'en-tête et le pied de page :

| Variable | Description |
|---------|-------------|
| `{ENTREPRISE_LOGO}` | Logo de l'entreprise (si uploadé) |
| `{ENTREPRISE_NOM}` | Nom de l'entreprise |
| `{ENTREPRISE_CONTACT}` | Contact de l'entreprise |
| `{ENTREPRISE_LOCALISATION}` | Localisation de l'entreprise |
| `{NUMERO}` | Numéro du ticket/bon |
| `{DATE}` | Date de la vente/achat |
| `{HEURE}` | Heure de la vente/achat |
| `{MAGASIN_CODE}` | Code du magasin |
| `{MAGASIN_NOM}` | Nom du magasin |
| `{CLIENT_NOM}` | Nom du client (ventes uniquement) |
| `{FOURNISSEUR_NOM}` | Nom du fournisseur (achats uniquement) |
| `{LIGNES}` | Tableau des produits (généré automatiquement) |
| `{TOTAL}` | Montant total |
| `{MONTANT_PAYE}` | Montant payé |
| `{RESTE}` | Reste à payer |
| `{MODE_PAIEMENT}` | Mode de paiement |
| `{OBSERVATION}` | Observation |

---

## 🎨 Exemple de Template avec Logo

```html
<div style="font-family: Arial, sans-serif; max-width: 300px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 20px;">
    {ENTREPRISE_LOGO}
    <h2 style="margin: 10px 0;">{ENTREPRISE_NOM}</h2>
    <p style="font-size: 12px; color: #666;">{ENTREPRISE_CONTACT}</p>
    <p style="font-size: 12px; color: #666;">{ENTREPRISE_LOCALISATION}</p>
  </div>
  
  <hr style="border: 1px solid #ddd; margin: 20px 0;">
  
  <div style="margin-bottom: 15px;">
    <p><strong>Ticket N°:</strong> {NUMERO}</p>
    <p><strong>Date:</strong> {DATE} {HEURE}</p>
    <p><strong>Magasin:</strong> {MAGASIN_CODE} - {MAGASIN_NOM}</p>
    {CLIENT_NOM ? '<p><strong>Client:</strong> {CLIENT_NOM}</p>' : ''}
  </div>
  
  <hr style="border: 1px solid #ddd; margin: 20px 0;">
  
  {LIGNES}
  
  <hr style="border: 1px solid #ddd; margin: 20px 0;">
  
  <div style="text-align: right; margin-top: 15px;">
    <p><strong>Total:</strong> {TOTAL}</p>
    {MONTANT_PAYE ? '<p><strong>Payé:</strong> {MONTANT_PAYE}</p>' : ''}
    {RESTE ? '<p><strong>Reste:</strong> {RESTE}</p>' : ''}
    <p><strong>Mode:</strong> {MODE_PAIEMENT}</p>
  </div>
  
  {OBSERVATION ? '<p style="margin-top: 15px; font-size: 12px; color: #666;">{OBSERVATION}</p>' : ''}
  
  <hr style="border: 1px solid #ddd; margin: 20px 0;">
  
  <div style="text-align: center; font-size: 11px; color: #999; margin-top: 20px;">
    <p>Merci de votre visite !</p>
    <p>{ENTREPRISE_NOM}</p>
  </div>
</div>
```

---

## ⚙️ Configuration de l'Impression

### Format d'Impression

- **Format par défaut :** 80mm (ticket de caisse)
- **Marges :** Automatiques
- **Police :** Arial, 12px

### Personnalisation

Vous pouvez modifier le format dans le code du template en ajoutant des styles CSS :

```html
<style>
  @media print {
    @page {
      size: A4; /* ou 80mm auto pour ticket */
      margin: 10mm;
    }
  }
</style>
```

---

## 🔧 Dépannage

### Le logo ne s'affiche pas

1. Vérifiez que le logo a bien été uploadé (visible dans le formulaire)
2. Vérifiez que la variable `{ENTREPRISE_LOGO}` est présente dans l'en-tête
3. Vérifiez que le template est **actif** (case cochée)

### L'impression ne fonctionne pas

1. **Autoriser les popups :** Le navigateur doit autoriser les popups pour GestiCom
2. **Vérifier le template actif :** Assurez-vous qu'un template actif existe pour le type (VENTE ou ACHAT)
3. **Vérifier la connexion :** L'impression nécessite une connexion pour charger le template

### Le format d'impression n'est pas correct

1. Vérifiez les paramètres d'impression du navigateur
2. Ajustez les marges dans la boîte de dialogue d'impression
3. Modifiez le template pour ajuster les styles CSS

---

## 📝 Notes Importantes

1. **Rôles requis :** Seuls les rôles `SUPER_ADMIN` et `ADMIN` peuvent accéder à la page de paramètres d'impression

2. **Taille du logo :** Maximum 2 Mo, formats acceptés : JPG, PNG, GIF, WebP

3. **Template par défaut :** Si aucun template actif n'est trouvé, un template par défaut sera utilisé

4. **Variables conditionnelles :** Certaines variables ne s'affichent que si elles ont une valeur (ex: `{CLIENT_NOM}`)

---

**Guide créé le :** Février 2026  
**Version GestiCom :** 0.1.0

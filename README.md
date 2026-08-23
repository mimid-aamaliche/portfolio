# Portfolio — Documentation & Mode d'emploi

Site portfolio statique (HTML/CSS/Vanilla JS) optimisé pour GitHub Pages, sans backend lourd ni dépendances complexes. Les projets sont chargés de manière modulaire via une stratégie **Manifest-first** avec repli automatique sur l'API GitHub.

---

## 1. Configuration initiale (une seule fois)

Dans `js/script.js`, vérifiez les 3 premières lignes :

```js
const GITHUB_USER   = "mimid-aamaliche";   // votre identifiant GitHub
const GITHUB_REPO   = "portfolio";         // nom du dépôt
const GITHUB_BRANCH = "main";              // branche principale
```

---

## 2. Structure d'un projet (`/projects`)

Chaque projet possède son propre dossier sous `projects/` selon la convention suivante :

```text
projects/
  mon-projet-slug/
    metadata.txt          # Métadonnées du projet (clé: valeur)
    images/               # (Optionnel) Galerie d'images (.png, .jpg, .webp, .svg, .gif)
      .gitkeep
      capture1.png
    videos/               # (Optionnel) Première vidéo intégrée (.mp4, .webm, .mov)
      .gitkeep
      demo.mp4
```

### Format de `metadata.txt`
```ini
title: Titre du projet
description: Une ou deux phrases décrivant le problème résolu et la solution apportée.
date: 2025-02
tech: C#, ASP.NET Core, React, TypeScript, SQL Server
highlight: true
link: https://github.com/mon-compte/mon-repo
```

- **`tech`** : liste de technologies séparées par des virgules (génère des badges individuels).
- **`highlight`** : mettre à `true` pour marquer le projet comme **Automatisation** (badge dédié, bordure accentuée et mise en avant en tête de liste).
- **`link`** : URL du dépôt ou de la démo (optionnel, le lien est masqué si omis).
- **`date`** : format `YYYY` ou `YYYY-MM` pour un tri chronologique décroissant automatique.

---

## 3. Chargement des projets & Manifest

### Comment fonctionne le chargement (Manifest-First) :
1. **Chemin rapide (Production & Local)** : Le navigateur tente de charger `manifest.json` directement (fichier statique).
   - ⚡ **Avantages** : Chargement instantané, aucun appel d'API, **immunité totale contre les limites de taux (rate limits)** de GitHub.
2. **Chemin de repli (Découverte API)** : Si `manifest.json` est supprimé ou introuvable, le script interroge dynamiquement l'API GitHub (`/contents/projects`) pour découvrir les dossiers et les fichiers.

### Régénérer le Manifest :
Lorsque vous ajoutez, modifiez ou supprimez un dossier dans `projects/`, régénérez `manifest.json` à l'aide du script fourni :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-manifest.ps1
```

Le script scanne tous les sous-dossiers de `projects/`, extrait les métadonnées de chaque `metadata.txt`, référence les images et vidéos présentes, et produit le fichier `manifest.json` à la racine.

---

## 4. Fonctionnalités UI & Média

- **Galerie d'images dynamique** : Tout fichier déposé dans `images/` apparaît dans le carousel horizontal du projet.
- **Lightbox plein écran** : Un clic sur n'importe quelle image de la galerie ouvre la vue agrandie (fermeture via la touche `Échap`, clic sur le fond ou le bouton ✕).
- **Lecteur vidéo natif** : Toute vidéo déposée dans `videos/` est intégrée avec contrôles vidéo.
- **Photo de profil / Avatar** : L'avatar d'en-tête est chargé depuis `assets/avatar.jpg` avec un lien d'ancrage vers la section `#about`.
- **Mise en avant thématique** : Les projets d'automatisation (`highlight: true`) sont épinglés en premier avec un badge `AUTOMATISATION` en bleu sarcelle.

---

## 5. Tester en local et Déployer

### Tester en local
Pour prévisualiser le site sur votre machine avec un serveur statique :
```bash
# Python
python -m http.server 8000

# Ou via npx
npx serve .
```
Puis ouvrez `http://localhost:8000` dans votre navigateur.

### Déploiement sur GitHub Pages
1. Poussez vos modifications sur votre branche principale :
   ```bash
   git add .
   git commit -m "Mise à jour des projets et du manifest"
   git push origin main
   ```
2. Dans GitHub → **Settings** → **Pages** :
   - Source : `Deploy from a branch`
   - Branch : `main` / Folder : `/ (root)`
3. Votre portfolio est accessible sous `https://<votre-user>.github.io/<votre-repo>/`.

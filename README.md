# Portfolio — mode d'emploi

## 1. Configuration (à faire une seule fois)

Ouvrez `js/script.js` et modifiez les 3 premières lignes :

```js
const GITHUB_USER   = "votre-nom-utilisateur-github";
const GITHUB_REPO   = "nom-du-repo";
const GITHUB_BRANCH = "main";
```

C'est tout. Le reste du fichier n'a jamais besoin d'être modifié.

## 2. Déployer sur GitHub Pages

1. Créez un dépôt GitHub public (ex: `portfolio`).
2. Poussez tout ce dossier dedans.
3. Dans Settings → Pages, choisissez la branche `main` et le dossier racine `/`.
4. Votre site sera disponible à `https://<user>.github.io/<repo>/` en quelques minutes.

## 3. Ajouter un nouveau projet (automatique)

Aucune ligne de code à écrire. Il suffit de créer un dossier :

```
projects/
  nom-du-projet/
    metadata.txt
    images/
      photo1.jpg
      photo2.png
    videos/
      demo.mp4
```

- `metadata.txt` : fichier texte simple, format `clé: valeur` par ligne.
  Champs reconnus : `title`, `description`, `date`, `tech` (séparés par des virgules), `link`.
- `images/` : toutes les images de ce dossier sont affichées dans une galerie.
- `videos/` : la première vidéo trouvée est intégrée avec un lecteur.
- Les deux dossiers sont optionnels — un projet sans vidéo ou sans image fonctionne très bien.

Poussez (`git add . && git commit -m "add project" && git push`), rechargez le site : le projet apparaît automatiquement, trié par date décroissante.

Si vous supprimez un dossier de projet, il disparaît du site au prochain chargement — rien n'est codé en dur.

## 4. Comment ça marche techniquement

`js/script.js` interroge l'API GitHub (`api.github.com/repos/.../contents/projects`) au chargement de la page pour lister les dossiers présents, puis récupère `metadata.txt` et le contenu de `images/` et `videos/` via `raw.githubusercontent.com`. Comme c'est un appel réseau fait par le navigateur du visiteur, ça ne fonctionne qu'une fois le site en ligne (via HTTPS) — pas en ouvrant `index.html` directement en local (`file://`). Pour tester en local, lancez un petit serveur :

```
python3 -m http.server 8000
```
puis ouvrez `http://localhost:8000`.

**Limite à connaître** : l'API GitHub non authentifiée est limitée à 60 requêtes/heure par visiteur. Largement suffisant pour un portfolio, mais à garder en tête si le trafic devient important — dans ce cas, on pourra générer un `projects.json` au moment du build via une GitHub Action à la place.

## 5. SEO déjà en place

- Balises `title` / `meta description` sur la page.
- Données structurées JSON-LD (`Person`) dans `index.html` — à mettre à jour avec votre vraie URL une fois déployée.
- Prochaines étapes : ajouter `sitemap.xml`, `robots.txt`, et créer une page dédiée par étude de cas pour cibler des mots-clés long-tail (voir la stratégie SEO discutée séparément).

# Hinata Desktop

## Lancer en développement

```bash
npm install
npm start
```

L'application ouvre la même interface HTML/CSS/JS dans une WebView Electron.

En développement, les données sont écrites dans `Hinata/data/` :

- `settings/local-storage.json`
- `conversations/*.json`

La version macOS packagée utilise le dossier de données utilisateur macOS afin de ne pas modifier le contenu de l'application.

## Construire l'application macOS

```bash
npm run dist
```

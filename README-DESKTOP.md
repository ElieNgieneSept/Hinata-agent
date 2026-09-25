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

Les trois formats de distribution sont générés dans `Installateurs/` :

- `npm run dist:mac` : installateur macOS `.dmg` dans `Installateurs/MaOS/` ;
- `npm run dist:web` : archive navigateur `.zip` dans `Installateurs/Navigateur/`, avec `index.html` directement à la racine après décompression ;
- `npm run dist:win` : installateur Windows `.exe` dans `Installateurs/Windows/`.

Pour lancer les trois builds :

```bash
npm run dist:all
```

La compilation Windows depuis macOS peut nécessiter Wine selon la configuration locale d'Electron Builder. Les installateurs non signés peuvent afficher un avertissement de sécurité au premier lancement.

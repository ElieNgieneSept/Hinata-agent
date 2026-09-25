# Mémoire du projet Hinata

Dernière mise à jour : 2026-09-20

## Objectif du projet

Kiro est un client IA web local, exécuté directement depuis `index.html`. Il permet d'utiliser plusieurs fournisseurs IA avec ses propres clés API, de gérer des conversations, des agents, des prompts, des projets, des fichiers joints et des réglages de génération.

Le projet ne possède pas de backend local ni de système de build. Les technologies principales sont HTML, CSS et JavaScript natif.

## Structure principale

- `index.html` : structure complète de l'interface et chargement des dépendances.
- `css/style.css` : styles, thèmes clair/sombre, composants et responsive.
- `js/app.js` : logique principale, événements UI, conversations, agents, projets, rendu des messages et envoi des requêtes.
- `js/api.js` : fournisseurs IA, streaming, génération d'images, audio et appels API.
- `js/filemanager.js` : IndexedDB, localStorage, conversations, agents, prompts et projets.
- `models.js` : catalogue statique des modèles.
- `js/faq.js` : contenu de la FAQ.
- `images/` : logos et ressources visuelles.

## Historique des modifications

### 1. Accent visuel

La couleur principale a été remplacée temporairement par un vert, puis restaurée en orange à la demande.

Valeurs actuelles principales dans `css/style.css` :

- `--accent: #F06D13`
- `--accent-dark: #c95a0e`
- `--accent-light` avec une transparence orange adaptée

Les couleurs d'alerte et d'erreur restent indépendantes de l'accent principal.

### 2. Évolution des catégories vers les projets

L'ancien système de catégories a été conservé techniquement pour assurer la compatibilité avec les données existantes, mais son rôle fonctionnel est désormais celui d'un projet.

Fonctionnalités disponibles :

- créer un projet ;
- modifier ou supprimer un projet ;
- choisir un nom, une icône et une couleur ;
- ajouter un contexte général au projet ;
- affecter une conversation à un projet ;
- retirer une conversation d'un projet ;
- créer une conversation sans projet ;
- filtrer la liste avec `Tous les projets` ;
- conserver les anciennes conversations associées à une ancienne catégorie.

Le stockage reste compatible avec les anciennes clés :

- projets stockés dans `localStorage` via `minou-categories` ;
- conversations contenant le champ `category`, qui représente maintenant l'identifiant du projet ;
- le contexte est stocké dans la propriété `contexte` du projet.

Ne pas renommer ces clés sans prévoir une migration des données.

### 3. Contexte projet

Le contexte général du projet est automatiquement ajouté au contexte système envoyé aux modèles texte.

Il est également ajouté aux prompts de génération et d'édition d'images.

La logique principale se trouve dans `js/app.js` :

- `effectiveSystemPrompt()` ajoute le contexte au prompt système ;
- `buildImagePrompt()` ajoute le contexte aux requêtes image ;
- `getCategoryContext()` lit le contexte depuis `js/filemanager.js`.

Le contexte projet est combiné avec l'agent sélectionné et, lorsque nécessaire, avec le contexte Canvas.

### 4. Renommage des rôles en agents

Le terme visible `Rôles` a été remplacé par `Agents` dans l'interface :

- bouton de la barre latérale ;
- panneau de réglages ;
- modales de gestion ;
- création, modification, suppression et import ;
- confirmations ;
- FAQ principale ;
- export Markdown.

Les identifiants internes n'ont pas été renommés pour préserver la compatibilité :

- `sidebar-roles-btn` ;
- `roles-manage-overlay` ;
- `sp-select` ;
- `currentSystemPrompt` ;
- `minou-systemprompts` ;
- formats d'export historiques comme `_minou_role`.

Il faut conserver ces identifiants sauf si une migration complète est prévue.

### 5. Sélecteur rapide d'agent dans le chat

Un sélecteur a été ajouté au-dessus de la zone de saisie dans `index.html` :

- `#chat-agent-bar` ;
- `#chat-agent-select` ;
- `#chat-agent-status`.

Il permet de :

- choisir `Aucun agent` ;
- sélectionner directement un agent enregistré ;
- basculer d'un agent à l'autre sans ouvrir les réglages ;
- synchroniser la sélection avec le panneau droit existant ;
- conserver l'agent lors du chargement d'une conversation ;
- réinitialiser le sélecteur lors d'une nouvelle conversation.

La synchronisation est gérée dans `js/app.js` par `syncChatAgentSelect()` et les événements de `spSelect` et `chatAgentSelect`.

Le style du sélecteur se trouve dans `css/style.css`, sous la section `Sélection rapide de l'agent actif`.

### 6. Personnalisation visuelle des agents

Chaque agent peut maintenant recevoir une identité visuelle depuis sa modale d'édition :

- avatar image recadré automatiquement au ratio 1:1 ;
- mascotte animée au format WebM, MP4 ou Lottie JSON ;
- case permettant d'afficher ou masquer la mascotte dans le chat ;
- aperçu des médias dans la modale ;
- avatar affiché à côté du sélecteur rapide d'agent ;
- mascotte affichée dans un widget flottant ;
- widget entièrement transparent, sans fond ni contrôles visibles ;
- widget déplaçable directement en maintenant le clic gauche sur la mascotte ;
- clic droit sur la mascotte ouvrant un menu avec l'action `Fermer la mascotte` ;
- position mémorisée avec l'agent dans `localStorage`.

Le fichier de test `animation/robot.webm` a été utilisé avec succès sur l'agent `sympote`.

Les éléments concernés sont :

- `#sp-modal-avatar` et `#sp-modal-mascot` dans `index.html` ;
- `#agent-mascot-widget` dans `index.html` ;
- fonctions de rendu média dans `js/app.js` ;
- propriétés `avatar`, `mascotte`, `mascotteVisible` et `mascottePosition` dans `js/filemanager.js` ;
- lecteur `lottie-web` chargé depuis jsDelivr pour les animations JSON ;
- styles du widget dans `css/style.css`.

Les médias sont stockés en Data URL dans `localStorage`. Il faut donc éviter des fichiers très lourds, surtout pour les longues vidéos WebM.

## Stockage et compatibilité

- Conversations : IndexedDB, base locale `minou_conversations`.
- Agents et prompts : localStorage / IndexedDB selon les fonctions historiques du projet.
- Projets : localStorage via `minou-categories`.
- Thème : localStorage via `minou-theme`.
- Clés API : localStorage via les clés déjà utilisées par l'application.

### 7. Mode Work et version desktop Electron

Un mode Work permet de partager explicitement un dossier local avec l'agent :

- sélection d'un dossier via le sélecteur natif macOS dans Electron ;
- lecture de l'arborescence et de fichiers texte/code ;
- lecture seule par défaut ;
- permission d'écriture séparée, avec confirmation avant chaque écriture ou suppression ;
- protection contre les chemins absolus et les remontées `..` ;
- nom du dossier actif affiché dans le bouton Work ;
- protocole interne `work-write`, `work-append` et `work-delete`.

Le module principal est `js/work.js`. Dans Electron, les opérations passent par :

- `desktop/main.js` pour le dialogue macOS et les accès fichiers ;
- `desktop/preload.js` pour l'API sécurisée exposée à la WebView ;
- `window.kiroDesktop.work` côté interface.

Les confirmations Work sont résumées globalement après exécution. Le résumé IA reçoit uniquement le type d'action et le chemin, jamais le contenu écrit, afin d'éviter de répéter le texte du fichier.

La version desktop est une WebView Electron qui réutilise l'interface HTML/CSS/JS existante :

- lancement de développement : `npm start` ;
- configuration dans `package.json` ;
- données desktop de développement dans `Hinata/data/` ;
- les artefacts `.app` et `.dmg` sont générés uniquement avec `npm run dist` et peuvent être supprimés pendant le développement.

Dans Electron, le stockage des paramètres est redirigé vers `data/settings/local-storage.json` et les conversations vers `data/conversations/*.json`. Une migration des conversations IndexedDB est prévue au premier chargement desktop.

### 8. Ajustements UX récents

- le panneau de réglages de conversation est fermé au démarrage ;
- l'engrenage du composer près de la barre de saisie est masqué ;
- l'engrenage de la toolbar supérieure reste le bouton unique pour ouvrir les réglages ;
- les échanges sont centrés dans une colonne maximale de `800px`, alignée sur le composer ;
- les bulles sont plafonnées à environ `680px` sur grand écran et restent responsives sur petit écran ;
- les comptes rendus Work sont courts et générés globalement, avec un texte de secours si le résumé IA échoue.

Les clés API ne doivent jamais être ajoutées à ce fichier mémoire ni à un fichier suivi par Git.

### 9. Positionnement responsive des mascottes

La position par défaut de chaque mascotte est maintenant calculée dynamiquement par `positionMascotWidget()` dans `js/app.js`.

Comportement attendu :

- la mascotte est placée juste au-dessus du coin supérieur droit de `.input-wrapper` ;
- le calcul utilise le rectangle réel de la barre de saisie et les dimensions CSS du widget ;
- la position est recalculée pendant un redimensionnement si la mascotte par défaut ou une ancienne position sauvegardée sort de l'écran ;
- une position manuelle valide reste conservée après déplacement par glisser-déposer ;
- une position sauvegardée devenue invalide est remplacée par l'ancrage par défaut visible.

Les limites de la fenêtre sont respectées avec une marge minimale de `8px`. Le comportement de déplacement et la propriété historique `mascottePosition` restent compatibles.

### 10. Accès Work lié à la conversation

L'accès à un dossier Work est lié à la conversation active, et non plus seulement à l'état global de l'interface.

Fonctionnement actuel :

- `js/app.js` sauvegarde l'accès dans la conversation via `workFolder` ;
- `js/filemanager.js` sérialise cette propriété sous le nom public `work_folder` dans le JSON ;
- lors du chargement d'une conversation, `WorkMode.restoreConversation()` reconnecte le dossier enregistré ;
- lors de la création d'une nouvelle conversation, `WorkMode.clear()` désactive l'accès hérité du chat précédent ;
- sélectionner un dossier dans une conversation existante déclenche sa sauvegarde ;
- les mises à jour asynchrones d'une conversation conservent `workFolder` via `_mergeConvData()`.

### 11. Fournisseurs cloud et fournisseurs OpenAI-compatible

La couche fournisseur a été étendue pour couvrir les cas réels suivants :

- `Groq` via `https://api.groq.com/openai/v1/chat/completions` et `https://api.groq.com/openai/v1/models` ;
- `Ollama Cloud` via une URL de base configurable, avec la valeur attendue `https://ollama.com` ;
- `Fournisseur personnalisé` compatible OpenAI, en utilisant `URL de base + /v1/chat/completions` et `URL de base + /v1/models` ;
- uniformisation visuelle du panneau configuration des fournisseurs pour que tous soient gérés avec la même logique d’URL, de clé et de catalogue.

Points de vigilance appliqués :

- compatibilité des anciennes valeurs `localStorage` et des clés déjà présentes dans le projet ;
- éviter les crash UI lors du rendu du catalogue quand un fournisseur n’a pas encore de clé ou d’URL ;
- ne pas casser le flux local Ollama / LM Studio déjà existant ;
- conserver les logos spécifiques et les libellés cohérents dans l’onglet API et Modèles.

Ces changements sont gérés dans `js/api.js` et `js/app.js`, sans modifier la structure générale de données de Kiro ni les conventions d’export des conversations.

### 12. Stabilisation du démarrage et du panneau API

- Une ancienne valeur `https://ollama.com` enregistrée dans la clé locale `ollama` est automatiquement remplacée par `http://localhost:11434` ; Ollama Cloud conserve sa propre clé `ollamaCloud` et son URL `ollamaCloudUrl`.
- La restauration des champs API est centralisée et tolère l’absence temporaire d’un champ dynamique.
- La promesse d’initialisation journalise les erreurs et signale le splash afin qu’une erreur secondaire ne bloque pas toute l’interface.
- Le splash possède aussi un délai maximal de sécurité de 12 secondes.
- La CSP autorise désormais les endpoints `https://ollama.com` et `https://api.groq.com`.

Validation utilisateur : les modèles Ollama local et Ollama Cloud se chargent correctement dans le panneau API et cette partie est considérée comme fonctionnelle.

### 13. Correction du gel Groq et fournisseur personnalisé

Le catalogue Groq/custom/Ollama Cloud ne doit pas être rechargé automatiquement depuis `renderProviderCatalog()` lorsqu'il est vide. Cette ancienne logique relançait un appel réseau puis le rendu dans `finally`, ce qui créait une boucle infinie dès qu'un endpoint répondait en erreur ou restait inaccessible.

Le comportement actuel est :

- la frappe dans une clé API ou une URL ne fait que marquer le formulaire comme modifié ;
- aucun appel réseau n'est lancé au démarrage pour Groq ou le fournisseur personnalisé ;
- le bouton `Sauvegarder` déclenche au plus un rafraîchissement asynchrone du catalogue actif ;
- un échec réseau affiche un état stable et ne bloque plus le thread d'interface.

Validation utilisateur : la configuration et le chargement des modèles ont réussi pour les trois fournisseurs suivants :

- `Groq` ;
- `Ollama Cloud` avec `https://ollama.com` ;
- `Ollama` local avec son endpoint local.

Le parcours `Fournisseur personnalisé` n'a pas encore été testé avec un endpoint externe non listé. Il reste donc à valider avec un fournisseur OpenAI-compatible qui n'est pas présent dans la liste native.

Dans la version Electron :

- `desktop/main.js` conserve le chemin local actif dans `workRoot` ;
- le canal IPC `kiro-work-set` reconnecte un chemin sauvegardé après un changement de conversation ou un redémarrage ;
- `desktop/preload.js` expose `window.kiroDesktop.work.setFolder()` ;
- le fichier JSON de chaque conversation peut contenir `work_folder: { name, path }`.

Les anciennes conversations sans `work_folder` sont ouvertes sans dossier Work. Si le dossier sauvegardé n'existe plus ou n'est plus un dossier, l'accès est désactivé au lieu de pointer vers un autre emplacement. Le chemin local est stocké uniquement dans les données locales de conversation ; aucune clé API ou donnée sensible ne doit y être ajoutée.

Validation récente : `node --check` passe sur `desktop/main.js`, `desktop/preload.js`, `Hinata/js/filemanager.js`, `Hinata/js/work.js` et `Hinata/js/app.js`. Les diagnostics VS Code ne signalent aucune erreur sur ces fichiers.

### 14. Stabilisation définitive des catalogues dynamiques

Les catalogues Groq, Ollama Cloud et Fournisseur personnalisé sont maintenant persistants et déterministes après fermeture et redémarrage d'Electron.

Corrections appliquées dans `js/api.js` :

- les modèles dynamiques sont conservés dans `localStorage` via la clé `minou-dynamic-provider-models` ;
- les catalogues persistés sont réinjectés pendant `rebuildModelLists()` avant le rendu du sélecteur principal ;
- les catalogues configurés sont actualisés silencieusement au démarrage, sans obliger l'utilisateur à rouvrir la configuration ;
- les URLs OpenAI-compatibles sont normalisées pour éviter les chemins invalides comme `/v1/v1/models` lorsque l'URL saisie contient déjà `/v1` ;
- les endpoints de chat utilisent également cette normalisation ;
- la fusion des résultats API ne considère plus les anciens modèles du même fournisseur comme des doublons ;
- un rafraîchissement réussi ne réécrit donc plus le cache avec une liste vide de manière aléatoire.

Les fournisseurs concernés utilisent les endpoints suivants après normalisation :

- catalogue : `/v1/models` ;
- conversation : `/v1/chat/completions`.

Ne pas supprimer le cache `minou-dynamic-provider-models` ni réintroduire une déduplication qui ajoute les anciens IDs du fournisseur dans l'ensemble des doublons avant de traiter les nouveaux résultats.

Validation effectuée avec les configurations locales existantes : Groq, Ollama Cloud et OmniRoute répondent correctement et leurs catalogues sont restaurés après redémarrage.

### 15. OmniRoute comme fournisseur fixe

La gestion de plusieurs fournisseurs personnalisés dynamiques a été retirée pour stabiliser cette version.

OmniRoute est maintenant déclaré comme fournisseur natif dans le panneau `API et Modèles` :

- identifiant interne : `omniroute` ;
- libellé visible : `OmniRoute` ;
- icône : `images/Other.svg` ;
- clé API : `API_KEYS.omniroute` ;
- URL de base : `API_KEYS.omnirouteUrl` ;
- catalogue : `${URL de base normalisée}/v1/models` ;
- conversations : `${URL de base normalisée}/v1/chat/completions`.

La valeur par défaut de l'URL est `http://localhost:20128/v1`.

Migration appliquée dans `js/api.js` :

- les anciennes valeurs `custom` et `customUrl` sont migrées vers `omniroute` et `omnirouteUrl` ;
- l'ancienne entrée nommée OmniRoute dans `customProviders` est privilégiée lors de la migration ;
- les anciens catalogues stockés sous `custom` ou `custom-*` sont fusionnés sous `omniroute` ;
- les anciennes clés de stockage dynamiques sont supprimées après migration ;
- les préférences de modèles déjà enregistrées dans `minou-catalog-prefs` sont conservées.

Le panneau ne permet plus d'ajouter des fournisseurs personnalisés. OmniRoute, Groq et Ollama Cloud utilisent chacun un identifiant stable pour la restauration du catalogue après redémarrage Electron. Ne pas réintroduire une liste de fournisseurs personnalisés dynamiques sans prévoir une migration complète des clés, des catalogues et des identifiants de modèles.

### 16. Catalogue de modèles unifié

L'interface de sélection des modèles est maintenant harmonisée pour tous les fournisseurs natifs, et ne se limite plus à OpenRouter.

Le rendu commun est géré dans `js/app.js` par `_renderStandardProviderCatalog()` et s'applique notamment à :

- OpenAI, Anthropic, Google, Mistral, DeepSeek, Grok, Z.ai et Perplexity ;
- Groq, Ollama Cloud et OmniRoute ;
- Ollama et LM Studio lorsque leurs modèles locaux sont disponibles.

Chaque catalogue standard présente désormais la même structure que celui d'OpenRouter :

- case de sélection globale ;
- filtre par catégorie ;
- recherche par nom ou identifiant de modèle ;
- lignes de modèles avec état activé/désactivé, prix et informations détaillées ;
- bascule `Textes` / `Images` lorsque le fournisseur la prend en charge.

La recherche ne reconstruit plus toute la section à chaque caractère. Seules les lignes de modèles sont actualisées, ce qui conserve la valeur et le focus du champ et permet de saisir un mot normalement.

Une erreur de rendu liée à un appel incorrect de `.join()` a également été corrigée. Cette erreur empêchait les catalogues statiques comme Google de s'afficher et pouvait laisser une section vide malgré la présence des modèles dans `models.js`.

Validation effectuée : les modèles Google s'affichent dans le panneau, la recherche multi-caractères fonctionne avec conservation du focus, et `node --check` ainsi que les diagnostics VS Code ne signalent aucune erreur. Toute évolution future du catalogue standard doit préserver le rendu commun et éviter de recréer le champ de recherche pendant la frappe.

### 11. Fournisseurs cloud et catalogue unifié

Les fournisseurs IA supportés ont été étendus sans casser les configurations historiques existantes :

- ajout de Groq dans le flux principal `PROVIDERS` et dans le panneau de configuration ;
- ajout d'un fournisseur personnalisé OpenAI-compatible avec un champ de clé API et un champ d'URL de base ;
- prise en charge de serveurs Ollama ou endpoints compatibles exposés en cloud via le même mode d'intégration OpenAI-compatible ;
- homogénéisation de l'interface de configuration des providers, avec le même schéma de clé / URL / catalogue depuis le panneau API et Modèles ;
- standardisation du chargement des catalogues dynamiques pour les providers qui exposent un endpoint `/v1/models` ;
- conservation de la compatibilité avec les clés et identifiants historiques déjà présents dans `localStorage`.

Les points de saisie API et les sélecteurs de modèles restent compatibles avec les anciens fournisseurs, les modèles locaux et le catalogue OpenRouter existant.

### 12. Générer les fichiers d'installation macOS

La génération est configurée dans `package.json` avec `electron-builder`.

Prérequis :

- macOS ;
- Node.js et npm installés ;
- dépendances installées avec `npm install` ;
- terminal positionné à la racine `/Users/sept/Desktop/ChatBox` du projet.

Procédure complète :

```bash
npm install
npm run dist
```

Le script `dist` exécute `electron-builder --mac`. La configuration actuelle :

- nom de l'application : `Hinata` ;
- identifiant : `com.eliesept.hinata` ;
- cible macOS : `dmg` ;
- fichiers inclus : `desktop/`, `Hinata/` et `package.json`.

Après la compilation, vérifier le dossier `dist/` :

- le fichier `.dmg` est l'installateur macOS à distribuer ;
- le fichier `.app` se trouve généralement dans `dist/mac/` ou dans un sous-dossier de sortie équivalent selon la version d'Electron Builder ;
- le nom exact peut contenir la version et l'architecture, par exemple `Hinata-3.2.0-arm64.dmg`.

Installation locale :

1. Ouvrir le fichier `.dmg`.
2. Faire glisser `Hinata.app` vers le dossier `Applications`.
3. Éjecter l'image disque.
4. Ouvrir Hinata depuis `Applications`.

Pour tester directement l'application sans DMG, ouvrir le fichier `Hinata.app` généré. Les données de la version packagée sont stockées dans le dossier utilisateur macOS via `app.getPath('userData')`, et non dans `Hinata/data/` du projet.

La distribution publique nécessite une signature de code et une notarisation Apple configurées séparément. Sans signature, macOS peut afficher un avertissement au premier lancement ; pour un test local, utiliser le clic droit sur l'application puis `Ouvrir` si nécessaire. Ne jamais intégrer de clé de signature, certificat privé ou secret dans le dépôt.

### 12. Redimensionnement de la sidebar gauche

La sidebar gauche est redimensionnable horizontalement depuis sa bordure droite.

Implémentation :

- la poignée est `#sidebar-resizer` dans `index.html` ;
- `initSidebarResize()` dans `js/app.js` gère le glissement et la persistance ;
- la largeur est limitée entre `180px` et `500px` ;
- la largeur choisie est stockée dans `localStorage` sous `kiro-sidebar-width` ;
- `css/style.css` rend la poignée visible au survol et pendant le glissement ;
- l'animation de largeur est désactivée pendant le glissement pour éviter un déplacement retardé.

Pour utiliser la fonction, placer le curseur sur la bordure droite du panneau gauche jusqu'à voir le curseur horizontal, puis faire glisser. Le bouton de masquage de la sidebar suit automatiquement la largeur enregistrée via `--sidebar-width`.

### 13. Onglets Chats et Browser

Un navigateur interne a été ajouté à la version Electron de Hinata :

- `#view-tabs` bascule entre les vues `Chats` et `Browser` sans modifier la logique du chat ;
- `#browser-view` contient une barre de sous-onglets et plusieurs pages indépendantes ;
- chaque page Electron utilise une balise `<webview>` avec la partition persistante `persist:hinata-browser` ;
- Google est la page d'accueil ; la barre propose précédent, suivant, actualiser et saisie d'URL ;
- une barre de favoris persistante propose par défaut Gemini, ChatGPT, Claude, DeepSeek et Qwen avec leurs favicons ; le bouton `☆` ajoute la page active et un clic droit retire un favori ;
- les liens qui demandent une nouvelle fenêtre sont ouverts dans un nouvel onglet Hinata ;
- le premier navigateur Electron est chargé uniquement lors du premier passage sur l'onglet Browser, afin de ne pas ralentir le démarrage du chat ;
- l'adresse affichée est simplifiée après navigation en retirant le protocole et `www`, tandis que l'URL complète reste utilisée pour charger la page ;
- `desktop/main.js` active `webviewTag: true` ;
- en ouverture directe de `index.html`, l'onglet Browser est masqué pour éviter un navigateur dans le navigateur ;
- cliquer sur une conversation dans la sidebar rebascule automatiquement vers l'onglet Chats.

Corrections UX récentes :

- la suppression d'un favori se fait uniquement avec la croix `×` visible au survol ou au focus clavier ; le clic droit ne supprime plus rien ;
- le redimensionnement de la sidebar utilise la capture Pointer Events et s'arrête au relâchement, à l'annulation du pointeur ou à la perte de focus de la fenêtre.

### 14. Stabilisation avant génération de l'installateur macOS

La version actuelle inclut les derniers ajustements UX du navigateur interne :

- les favoris sont stockés sous `hinata-browser-bookmarks` dans le stockage local Electron ;
- la suppression se fait par la croix `×` au survol, avec support clavier, et non plus par clic droit ;
- le redimensionnement de la sidebar repose sur `pointerdown`, `pointermove`, `pointerup` et `pointercancel`, avec arrêt supplémentaire lors de la perte de focus ;
- les validations `node --check` et `git diff --check` passent avant la génération de l'installateur ;
- l'installateur macOS est généré avec `npm run dist` et produit un fichier `.dmg` dans `dist/`.

Ne jamais inclure de clé API, cookie ou donnée personnelle dans la mémoire ou dans l'installateur. Les sessions du navigateur restent stockées localement par Electron.

Les cookies et sessions du navigateur sont conservés localement par Electron grâce à la partition persistante. Certains services peuvent toutefois refuser une connexion depuis un navigateur intégré Electron pour des raisons de sécurité ou de détection d'environnement ; cette limite dépend du fournisseur et ne peut pas être garantie par Hinata.

Limite structurelle du mode web : un fichier HTML ouvert directement ne peut pas devenir un navigateur universel. Google, Gemini et ChatGPT peuvent bloquer l'affichage dans une iframe via `X-Frame-Options` ou CSP. Pour une navigation complète et une connexion fiable dans la version web, il faudra plus tard un hébergement avec backend/proxy contrôlé, ou conserver l'expérience complète dans la version Electron.

### 15. Arborescence Work et pièces jointes

Le panneau droit contient maintenant un onglet `Work` qui affiche l'arborescence du dossier partagé pour la conversation active.

- les dossiers peuvent être ouverts et repliés dans l'arbre ;
- l'arborescence peut être actualisée manuellement et après une opération d'écriture Work ;
- après la sélection d'un dossier, le panneau droit s'ouvre automatiquement sur l'onglet Work ;
- les fichiers de l'arbre sont déplaçables vers la zone de saisie du chat ;
- les fichiers texte, PDF et images courantes sont convertis en pièces jointes sans modifier le format historique des messages ;
- Electron expose `readBinary` via `desktop/preload.js` et limite la lecture à 10 Mo, avec validation des chemins relatifs dans `desktop/main.js` ;
- les fichiers texte sont limités à 250 Ko pour l'extraction et le contexte ;
- le mode navigateur direct utilise la File System Access API avec les mêmes contrôles de chemin et de taille.

Validation utilisateur : le panneau Work, l'arborescence et le glisser-déposer fonctionnent dans la version desktop.

### 16. Mémoire globale Hinata

Une mémoire globale locale est disponible dans l'onglet `Configuration > Mémoire`.

Fonctionnement :

- le document est stocké dans `localStorage` via `hinata-global-memory` ; dans Electron, ce stockage est redirigé vers `Hinata/data/settings/local-storage.json` ;
- une section `CONFIGURATION PAR DÉFAUT DE HINATA` est initialisée une seule fois avec les règles de réponse, de travail, de validation et de protection des secrets ;
- une section `CONTEXTE UTILISATEUR` est réservée aux informations stables apprises pendant les échanges ;
- la mémoire globale est injectée avant l'agent, le contexte projet et le contexte Canvas dans `effectiveSystemPrompt()` ;
- elle est aussi ajoutée aux prompts de génération d'images ;
- la mise à jour automatique utilise le modèle de résumé configuré, mais ne modifie que `CONTEXTE UTILISATEUR` ;
- l'utilisateur peut modifier, désactiver ou effacer la mémoire depuis la configuration ; l'effacement reste définitif jusqu'à une nouvelle saisie ;
- aucune clé API, aucun token, mot de passe, cookie ou secret ne doit être enregistré dans cette mémoire.

Les clés historiques de cette fonctionnalité sont :

- `hinata-global-memory` ;
- `hinata-global-memory-initialized` ;
- `hinata-global-memory-auto`.

### 17. Bouton d'insertion de prompt

Le bouton `#toolbar-insert-btn` est maintenant déplacé dans `.input-line-2-right`, juste avant `#mic-btn`.

- sa position ne dépend plus du curseur ni de la longueur du prompt ;
- les fonctions de calcul de coordonnées et le style `.floating` ont été supprimés ;
- l'insertion et le sélecteur de prompts enregistrés restent inchangés.

Validation du 20 septembre 2026 : `node --check` passe sur les fichiers JavaScript, les diagnostics VS Code ne signalent aucune erreur et `git diff --check` passe.

### 18. Actualisation du stockage et sauvegarde de la mémoire

Le panneau `Configuration > Stockage` lit maintenant les conversations via les abstractions communes `listConversationFiles()` et `readConversationFile()` au lieu de dépendre directement d'IndexedDB. Il fonctionne donc aussi dans Electron, où les conversations sont stockées dans `Hinata/data/conversations/*.json`.

- les compteurs de conversations et de médias sont calculés à partir des données réellement persistées ;
- les pièces jointes `image` et `file` présentes dans les messages sont comptabilisées dans les médias et dans les catégories de taille ;
- le résumé du stockage est invalidé après chaque mutation et se rafraîchit automatiquement quand le panneau d'accueil est visible ;
- les opérations de suppression et de modification du panneau continuent de recalculer le résumé et la liste.

Le panneau `Configuration > Mémoire` possède un bouton `Sauvegarder` visible en haut, à droite de la case de mise à jour automatique.

- le bouton écrit le contenu complet de l'éditeur dans `hinata-global-memory` ;
- la sauvegarde est aussi déclenchée lors du changement d'onglet et de la fermeture de la configuration ;
- le bouton utilise une apparence active et `cursor: pointer`, car il ne dépend pas du système de boutons désactivés des autres panneaux ;
- le message `Mémoire sauvegardée.` confirme l'écriture locale.

Validation : `node --check`, diagnostics VS Code et `git diff --check` passent avant la génération du nouvel installateur macOS.

### 19. Combos d'identité visuelle des agents

L'agent par défaut est désormais `Hinata` au lieu de `sympote`.

- le prompt par défaut décrit l'identité, le ton, les capacités, la mémoire et le format de réponse de Hinata ;
- les médias officiels du combo initial sont dans `Hinata/Avatar-Agent/combo-01/` ;
- le combo contient `Hinata_photo1.png` et `Hinata-Work_anim.webm` ;
- la modale de création et de modification ne permet plus d'importer des fichiers personnels ;
- l'utilisateur choisit un `comboId` depuis le catalogue prédéfini ;
- les agents historiques sont migrés vers `combo-01` au démarrage ;
- les anciens exports d'agents sont importés avec le combo officiel, sans réintroduire leurs médias personnalisés.

Le catalogue est déclaré dans `js/app.js` via `AGENT_COMBOS`. Tout nouveau combo doit être ajouté à cette liste avec ses chemins relatifs dans `Avatar-Agent/`.

### 20. Éditeur Markdown des agents

La modale de configuration des agents est maintenant plus large et redimensionnable en largeur et en hauteur sur desktop. Sur les petits écrans, elle s'adapte automatiquement à la fenêtre.

- l'éditeur du contenu possède les onglets `Édition` et `Aperçu` ;
- l'aperçu utilise `marked` et la sanitisation déjà configurée dans `app.js` ;
- la barre d'outils permet d'insérer du gras, de l'italique, des titres, des listes, des citations, du code et des liens ;
- le stockage conserve le Markdown brut historique dans la propriété `contenu`.

### 21. Combo visuel optionnel pour les nouveaux agents

Le sélecteur de combo de la modale Agent contient maintenant l'option `Aucun`.

- un nouvel agent est créé sans avatar ni mascotte par défaut ;
- l'utilisateur peut choisir `combo-01` ou conserver une identité visuelle vide ;
- l'agent par défaut `Hinata` conserve automatiquement `combo-01` ;
- la migration ne réimpose plus un combo aux agents enregistrés avec `comboId: null` ;
- l'aperçu Markdown possède un padding intérieur renforcé pour éviter que le texte touche les bords.

### 22. Dimensions fixes de la modale Agent

La modale de configuration d'agent n'est plus redimensionnable manuellement.

- elle utilise une taille fixe responsive d'environ `800px × 720px` sur desktop ;
- sur un écran plus petit, sa taille suit la fenêtre avec des marges réduites ;
- le contenu de la modale défile verticalement lorsque les sections dépassent la hauteur disponible ;
- les modes Édition et Aperçu Markdown utilisent la même hauteur de zone pour éviter que l'aperçu masque le sélecteur de combo ou les actions.

### 23. Barre Agent et bouton Work

- le statut de l'agent actif est affiché sous le sélecteur d'agent ;
- dans la ligne d'actions du composer, l'ordre est désormais fichier, recherche Web puis Work ;
- le bouton Work affiche le libellé `Donner accès à un dossier` en plus de l'icône dossier ;
- le bouton conserve son ouverture du panneau Work et son indication dynamique de dossier dans l'attribut `title`.

### 24. Taille proportionnelle des mascottes

La mascotte flottante utilise maintenant sa largeur comme dimension principale.

- `#agent-mascot-widget` et son contenu ont une hauteur automatique ;
- les vidéos utilisent `width: 100%` et `height: auto` pour préserver le ratio natif de chaque combo ;
- la position est recalculée après `loadedmetadata` pour utiliser la hauteur réelle de la vidéo ;
- les animations Lottie sont repositionnées après leur rendu ;
- pour modifier la taille globale d'une mascotte, il suffit d'ajuster sa largeur CSS.

### 25. Protection contre les doublons de mascotte

Le rendu de la mascotte utilise un jeton de rendu dans `app.js` afin d'invalider les appels asynchrones précédents lorsque l'agent actif change rapidement ou que la synchronisation est déclenchée plusieurs fois. Le conteneur vidéo est nettoyé avant chaque nouveau rendu pour garantir un seul élément média actif.

### 26. Largeur et ancrage par défaut de la mascotte

La largeur CSS par défaut de `#agent-mascot-widget` est fixée à `182px`. Sa hauteur reste automatique selon le ratio du média. Lorsque la position est automatique, le haut du widget est calculé à `16px` au-dessus de la barre de saisie afin d'éviter qu'il ne chevauche le composer. Les positions manuelles sauvegardées restent prioritaires.

### 27. État de la version avant publication

La version actuelle regroupe les améliorations de l'identité visuelle des agents, de la modale Agent, du mode Work et de la mascotte flottante.

- l'agent Hinata utilise un combo officiel modifiable, tandis que les nouveaux agents commencent avec `Aucun` ;
- la modale Agent est fixe, responsive et scrollable, avec édition et aperçu Markdown équilibrés ;
- le statut de l'agent est placé sous son sélecteur ;
- le bouton Work est placé après la recherche Web et affiche `Donner accès à un dossier` ;
- la modale Work est centrée ;
- la mascotte utilise une largeur par défaut de `182px`, une hauteur automatique et un positionnement calculé au-dessus du composer ;
- les rendus concurrents ne peuvent plus créer plusieurs vidéos de mascotte ;
- les validations préalables à la publication sont `node --check` sur les modules JavaScript et `git diff --check`.

La génération de l'installateur macOS reste `npm run dist` et produit le fichier `.dmg` dans `dist/`. Aucun secret ne doit être ajouté au dépôt.

## Règles de reprise pour un autre agent

1. Lire ce fichier avant toute modification.
2. Lire le code local autour de la fonctionnalité concernée avant d'éditer.
3. Préserver les identifiants DOM et les clés de stockage historiques.
4. Utiliser `apply_patch` pour les modifications manuelles.
5. Ne pas refactoriser les zones sans rapport avec la demande.
6. Tester après chaque modification avec `get_errors` et, si possible, le navigateur intégré.
7. Vérifier les thèmes clair, sombre et automatique lorsque l'interface est modifiée.
8. Pour le mode Work, vérifier séparément une conversation avec dossier, une conversation sans dossier, une nouvelle conversation et un redémarrage Electron.
9. Pour les mascottes, vérifier le plein écran, une fenêtre redimensionnée et le déplacement manuel.
10. Pour la sidebar, vérifier le glissement, les limites de largeur, le masquage et la restauration après redémarrage.
11. Ne pas ajouter de clé API, mot de passe ou donnée personnelle dans le dépôt.

## État actuel

La gestion des projets, le sélecteur rapide d'agents, le mode Work avec arborescence et pièces jointes, et les onglets Chats/Browser fonctionnent dans la WebView Electron lancée avec `npm start`. L'accès Work est maintenant restauré par conversation et supprimé lors du passage à une nouvelle conversation. Les mascottes utilisent un ancrage par défaut responsive au-dessus de la barre de chat, tout en restant déplaçables manuellement. La sidebar gauche est redimensionnable entre `180px` et `500px`, avec mémorisation locale de la largeur. L'interface affiche actuellement l'accent orange. L'agent de test existant `sympote` apparaît dans le sélecteur rapide ; le projet de test créé pendant la validation a été supprimé.

## Prochaine direction possible

Continuer à améliorer les projets pour qu'ils deviennent des espaces de travail plus complets, par exemple avec des prompts dédiés, des agents par défaut, des fichiers de projet et des réglages propres à chaque projet. Toute évolution doit préserver les conversations sans projet et la compatibilité des anciennes données. Pour le desktop, continuer avec `npm start` pendant le développement et ne générer le `.app` ou le `.dmg` qu'au moment de la distribution.

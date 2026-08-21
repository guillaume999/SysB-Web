# SysB — interface web d'administration

Admin web du contenu du jeu Unity **SysB**, branchée sur PocketBase.

L'admin se connecte avec son **compte de jeu PocketBase** (collection `users`)
à condition que son champ `role` vaille `admin`. Le **superuser PocketBase n'est pas
utilisé ici** : il reste réservé à l'admin PocketBase brut sur `pb-sysb.physiooffice.com/_/`.

Les règles d'API de `config`, `fiches`, `templates`, `productions` et `evolutions`
autorisent la lecture à tout le monde et l'écriture à `@request.auth.role = 'admin'`.

| | |
|---|---|
| Site | https://sysb.physiooffice.com |
| API PocketBase | https://pb-sysb.physiooffice.com |
| Admin PocketBase brut | https://pb-sysb.physiooffice.com/_/ |
| Accès local (LAN NAS) | http://192.168.1.95:8083 |

## Comment ça marche

L'appli est un SPA React + Vite servi par nginx. Le schéma des collections est
décrit **en dur** dans `src/lib/schema.ts` : l'endpoint `/api/collections` de
PocketBase est réservé aux superusers, donc un compte `role = admin` ne peut pas
le lire. Un champ ajouté côté PocketBase doit donc être ajouté dans ce fichier.

Les champs `json` (héritage du modèle Firestore : `consomation`, `production`,
`obtention`, `niveaux`, `conditions`, `value`…) ont un éditeur en grille quand la
valeur est un tableau d'objets plats, et un éditeur JSON brut sinon.

## Développement

```bash
npm install
npm run dev     # http://localhost:5173, tape sur https://pb-sysb.physiooffice.com
npm run build
npm run typecheck
```

L'URL PocketBase est injectée au build par `VITE_PB_URL` (voir `Dockerfile`).
En `npm run dev` sans variable, l'appli retombe sur l'instance SysB de production.

## Déploiement (NAS Asustor, Portainer)

Même schéma que `physiooffice-dev` : Portainer clone ce dépôt, build le
`Dockerfile` et sert le `dist/` avec nginx.

- Stack Portainer : **`sysb-web`**, méthode *Repository*, GitOps polling 1 min
- Port host **8083** → 8081 dans le conteneur
- Variables d'environnement de la stack : voir `stack.env`
- Exposition : tunnel Cloudflare `nas-physiooffice`,
  route `sysb.physiooffice.com` → `http://192.168.1.95:8083` (NPM n'est pas dans le chemin)

Aucun identifiant n'est stocké dans le code ni dans le build : ils sont saisis à la
connexion et le token vit dans le `localStorage` du navigateur.

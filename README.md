# SysB — interface web d'administration

Admin web du contenu du jeu Unity **SysB**, branchée sur PocketBase.

Depuis le retrait du champ `role` (2026-08-21), les collections de contenu
(`config`, `templates`, `productions`, `fiches`, `evolutions`) sont en **écriture
superuser uniquement** : le client Unity ne peut plus les écrire. Ce site est le
seul moyen de peupler et maintenir ce contenu.

| | |
|---|---|
| Site | https://sysb.physiooffice.com |
| API PocketBase | https://pb-sysb.physiooffice.com |
| Admin PocketBase brut | https://pb-sysb.physiooffice.com/_/ |
| Accès local (LAN NAS) | http://192.168.1.95:8083 |

## Comment ça marche

L'appli est un SPA React + Vite servi par nginx. Elle se connecte en
`_superusers` sur PocketBase, lit le **schéma des collections à l'exécution**
(`/api/collections`) et génère les tableaux et formulaires à partir de là — donc
un champ ajouté côté PocketBase apparaît ici sans rebuild.

Les champs `json` (héritage du modèle Firestore : `consomation`, `production`,
`obtention`, `niveaux`, `value`…) ont un éditeur en grille quand la valeur est un
tableau d'objets plats, et un éditeur JSON brut sinon.

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

Aucun identifiant PocketBase n'est stocké dans le code ni dans le build : ils sont
saisis à la connexion et le token vit dans le `localStorage` du navigateur.

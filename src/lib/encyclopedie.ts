// ============================================================
//  encyclopedie.ts
//  LE CATALOGUE RÉEL, ÉCRIT EN MARKDOWN — posé le 2026-09-13.
//
//  *« mets à jour le site avec les bâtiments de la liste tuiles, les ressources
//  de la liste ressources et les technologies »* : le document de conception
//  décrit un jeu imaginé en juillet, la base contient celui qui existe. Plutôt
//  que de réécrire le texte à la main — périmé dès la saisie suivante — trois
//  sections sont AJOUTÉES à la fin du document, relues dans PocketBase à
//  chaque ouverture de la page.
//
//  ⚠️⚠️ **CE FICHIER REND DU MARKDOWN, PAS DU JSX, ET C'EST LE POINT.** Le
//  document a déjà son rendu (`components/Markdown.tsx`), son sommaire
//  (`extraireTitres`) et son bouton « Télécharger le .md ». En rendant du
//  texte, les trois sections héritent des trois d'un coup : elles apparaissent
//  dans le sommaire sans qu'on l'y ajoute, et le .md téléchargé est complet.
//  Les rendre en composants aurait demandé de récrire les titres, les tableaux
//  et les listes — et le fichier téléchargé aurait menti par omission.
//
//  ⚠️ **AUCUNE MISE EN FORME N'EST RÉÉCRITE ICI.** Les phrases viennent des
//  fonctions qui servent déjà aux écrans d'admin — `decrireRegle`,
//  `decrireAppro`, `libelleCycle`, `formatDuree`, `libelleAge`,
//  `erreursPalier`. Une règle de placement se lit donc avec les MÊMES mots à
//  l'écran d'admin et dans le document. Écrire une seconde formulation ici
//  ferait deux vérités à tenir d'accord.
//
//  ⚠️ **On n'écrit PAS dans le document.** `src/docs/conception-tri-axes.md`
//  n'est pas touché : le texte de conception reste corrigé par commit, ce qui
//  était la décision du 24/08 et le reste. Ces sections vivent à côté, et leur
//  source de vérité est la base.
// ============================================================

import { type Age, libelleAge, loadAges, numerosDeclares } from "@/lib/ages";
import {
  GENRES,
  type Ressource,
  codeInconnu,
  estTransportable,
  libelleRessource,
  loadRessources,
} from "@/lib/ressources";
import {
  TECHNOS_HORS_MOTEUR,
  type Technologie,
  batimentDe,
  categorieDe,
  codesDe,
  coutDe,
  effetUtile,
  effetsDe,
  loadTechnologies,
  niveauxDe,
  prerequisEffectifs,
} from "@/lib/technologies";
import {
  CASE_VIDE,
  type LigneCout,
  type LigneFlux,
  type LigneProduction,
  type Palier,
  TOUTES_RESSOURCES,
  type Tuile,
  categoriesDe,
  contrainteDe,
  decrireAppro,
  decrireRegle,
  erreursPalier,
  estCommun,
  estEntrepot,
  formatDuree,
  libelleCycle,
  loadTuiles,
  logistiqueDe,
  paliersDe,
  palierTourne,
  placementDe,
  satisfactionMax,
  tranchesTriees,
} from "@/lib/tuiles";

/** Les quatre listes que les sections relisent. */
export interface DonneesCatalogue {
  ressources: Ressource[];
  tuiles: Tuile[];
  technologies: Technologie[];
  ages: Age[];
}

/**
 * Les quatre collections, en parallèle.
 *
 * ⚠️ **Aucune n'exige d'être admin** : `ressources`, `tuiles`, `technologies`
 * et `ages` sont publiques en lecture (règle `""`), c'est ce qui permet à un
 * compte joueur de lire ces sections. Si l'une d'elles se fermait un jour, ce
 * serait ici que ça casserait — et il faudrait alors les réserver aux admins,
 * pas ouvrir la collection.
 */
export function chargerCatalogue(): Promise<DonneesCatalogue> {
  return Promise.all([loadRessources(), loadTuiles(), loadTechnologies(), loadAges()]).then(
    ([ressources, tuiles, technologies, ages]) => ({ ressources, tuiles, technologies, ages }),
  );
}

/* ------------------------------------------------------------------ */
/* Petits outils d'écriture                                            */
/* ------------------------------------------------------------------ */

/**
 * ⚠️ **Une barre verticale dans un nom couperait la cellule en deux** et
 * décalerait toute la ligne du tableau. Rien n'interdit `|` dans un `nom` de
 * PocketBase : on l'échappe plutôt que de faire confiance à la saisie.
 */
function cellule(texte: string): string {
  return texte.replace(/\|/g, "\\|");
}

/** Une liste en français : « a, b et c ». Vide rend la chaîne vide. */
function enumerer(morceaux: string[]): string {
  if (morceaux.length === 0) return "";
  if (morceaux.length === 1) return morceaux[0];
  return `${morceaux.slice(0, -1).join(", ")} et ${morceaux[morceaux.length - 1]}`;
}

function pluriel(n: number, singulier: string, plurielMot = `${singulier}s`): string {
  return `${n} ${n > 1 ? plurielMot : singulier}`;
}

/** Le jour de la lecture, en toutes lettres courtes : `13/09/2026 à 15:02`. */
function horodatage(maintenant: Date): string {
  const deuxChiffres = (n: number) => String(n).padStart(2, "0");
  return (
    `${deuxChiffres(maintenant.getDate())}/${deuxChiffres(maintenant.getMonth() + 1)}/` +
    `${maintenant.getFullYear()} à ${deuxChiffres(maintenant.getHours())}:` +
    `${deuxChiffres(maintenant.getMinutes())}`
  );
}

/**
 * Les âges à parcourir : ceux qui sont **déclarés**, plus ceux **trouvés** dans
 * la liste, et `0` (« sans âge ») à la fin s'il y a quelque chose dedans.
 *
 * ⚠️ Même règle que l'écran Âges : un âge déclaré mais vide reste visible — il
 * n'attend qu'une saisie —, et un âge porté par une tuile mais absent de la
 * collection s'affiche quand même. Le masquer ferait disparaître ses bâtiments
 * sans rien dire, alors que c'est une faute de saisie qu'on veut voir.
 */
function agesAParcourir(portes: number[], ages: Age[]): number[] {
  const numeros = [...new Set([...numerosDeclares(ages), ...portes].filter((n) => n > 0))].sort(
    (a, b) => a - b,
  );
  return portes.some((n) => n <= 0) ? [...numeros, 0] : numeros;
}

/* ------------------------------------------------------------------ */
/* Les trois sections                                                  */
/* ------------------------------------------------------------------ */

/** Le titre de niveau 1 sous lequel les trois sections se rangent. */
export const TITRE_PARTIE = "PARTIE IX — LE CONTENU RÉEL, LU DANS LA BASE";

/**
 * Les trois sections, prêtes à être collées à la fin du document.
 *
 * Les titres sont de **niveau 1 et 2** : le sommaire de la page les prend donc
 * tout seuls (`extraireTitres(source, 2)`). Les bâtiments et les technos sont
 * en niveau 3 et 4 — cent quarante entrées de sommaire rendraient le filtre
 * inutilisable.
 */
export function sectionsDuCatalogue(d: DonneesCatalogue, maintenant = new Date()): string {
  return [
    "",
    "---",
    "",
    `# ${TITRE_PARTIE}`,
    "",
    "> Tout ce qui précède est le document de **conception** : ce qu'on a voulu faire.",
    "> Cette partie-ci est le **contenu réel**, relu dans la base à chaque ouverture de la",
    "> page — elle n'est écrite par personne, et elle ne peut donc pas être en retard.",
    "> Là où les deux se contredisent, c'est celle-ci qui dit ce que le jeu fait",
    `> aujourd'hui. Lecture du ${horodatage(maintenant)}.`,
    "",
    tableauDesCompteurs(d),
    sectionRessources(d),
    sectionBatiments(d),
    sectionTechnologies(d),
  ].join("\n");
}

function tableauDesCompteurs(d: DonneesCatalogue): string {
  const actives = d.tuiles.filter((t) => t.actif).length;
  const rattachees = d.technologies.filter((t) => t.batiment > 0).length;
  return [
    "| Liste | En base | Dont |",
    "|---|---|---|",
    `| Ressources | ${d.ressources.length} | ${d.ressources.filter(estTransportable).length} que les navettes portent |`,
    `| Bâtiments | ${d.tuiles.length} | **${actives} actifs**, ${d.tuiles.length - actives} en brouillon |`,
    `| Technologies | ${d.technologies.length} | ${rattachees} rattachées à un bâtiment |`,
    `| Âges | ${d.ages.length} | déclarés dans la collection \`ages\` |`,
    "",
  ].join("\n");
}

/* --- Les ressources ------------------------------------------------ */

function sectionRessources({ ressources }: DonneesCatalogue): string {
  const lignes = [
    "## Les ressources",
    "",
    `Le vocabulaire du jeu : ${pluriel(ressources.length, "ressource")}, dans l'ordre où la barre`,
    "du haut les affiche. **Le `code` est ce que tout le reste cite** — un coût, une",
    "production, une règle d'appro ne nomment jamais une ressource autrement.",
    "",
    "| Code | Nom | Genre | Ce que ça veut dire | Navette | Ordre |",
    "|---|---|---|---|---|---|",
  ];

  for (const r of ressources) {
    const genre = GENRES.find((g) => g.valeur === r.genre);
    lignes.push(
      `| \`${cellule(r.code)}\` | ${cellule(r.nom)} | ` +
        `${genre ? genre.libelle : "⚠️ non renseigné"} | ${genre ? genre.aide : "—"} | ` +
        `${estTransportable(r) ? "oui" : "non"} | ${r.ordre} |`,
    );
  }

  lignes.push(
    "",
    "⚠️ Seul le genre **stock** voyage : ni un habitant, ni un pourcentage, ni la",
    "réserve du plateau ne prennent la navette.",
    "",
  );
  return lignes.join("\n");
}

/* --- Les bâtiments ------------------------------------------------- */

function sectionBatiments(d: DonneesCatalogue): string {
  const { tuiles, ages } = d;
  const actives = tuiles.filter((t) => t.actif).length;
  const lignes = [
    "## Les bâtiments",
    "",
    `${pluriel(tuiles.length, "tuile")} en base, dont **${actives} actives** — les autres sont des`,
    "brouillons, signalés comme tels ci-dessous : elles existent en base mais le magasin",
    "ne les propose pas. Les cases de terrain (eau, forêt, volcan) sont des tuiles comme",
    "les autres, rangées « sans âge ».",
    "",
  ];

  for (const numero of agesAParcourir(
    tuiles.map((t) => t.age ?? 0),
    ages,
  )) {
    const dedans = tuiles.filter((t) => (t.age ?? 0) === numero);
    lignes.push(`### ${libelleAge(numero, ages)} — ${pluriel(dedans.length, "bâtiment")}`, "");

    const age = ages.find((a) => a.numero === numero);
    if (age?.description) lignes.push(`*${age.description}*`, "");
    if (dedans.length === 0)
      lignes.push("Aucun bâtiment n'est rangé dans cet âge pour l'instant.", "");

    for (const tuile of dedans) lignes.push(ficheBatiment(tuile, d), "");
  }

  return lignes.join("\n");
}

/** La fiche complète d'un bâtiment : identité, pose, paliers, coffre, transport. */
function ficheBatiment(tuile: Tuile, d: DonneesCatalogue): string {
  const nomTuile = (tileId: number) => nomDeTuile(tileId, d.tuiles);
  const nomRes = (code: string) => nomDeRessource(code, d.ressources);
  const nomTechno = (code: string) =>
    d.technologies.find((t) => t.code === code)?.nom || `${code} (techno inconnue)`;

  const lignes = [
    `#### ${tuile.tileId} — ${tuile.nom}${tuile.actif ? "" : " · brouillon"}`,
    "",
    `- **Identité** — ${identite(tuile, d)}`,
  ];

  if (tuile.description.trim()) lignes.push(`- **Description** — ${tuile.description.trim()}`);

  const placement = placementDe(tuile);
  lignes.push(placement.length === 0 ? "- **Pose** — aucune règle : se pose partout." : "- **Pose**");
  for (const r of placement) lignes.push(`  - ${decrireRegle(r, nomTuile, nomTechno)}`);

  // ⚠️ `paliersDe` rend UN palier vide quand la tuile n'en a aucun : c'est le
  //    défaut du FORMULAIRE, pas une donnée. Ici, afficher « Palier 1, chantier
  //    immédiat, cycle non déclaré » sur une case d'herbe ferait passer un
  //    terrain pour une saisie ratée. On lit donc le champ tel qu'il est en base.
  const declares = Array.isArray(tuile.niveaux) && tuile.niveaux.length > 0;
  if (!declares) lignes.push("- **Paliers** — aucun : il ne coûte rien et ne fait rien (une case de terrain).");
  else for (const p of paliersDe(tuile)) lignes.push(...palier(p, nomRes));

  lignes.push(...coffreEtTransport(tuile, nomTuile, nomRes));
  return lignes.join("\n");
}

function identite(tuile: Tuile, { ages, tuiles }: DonneesCatalogue): string {
  const categories = categoriesDe(tuile);
  const prefab = tuile.expand?.modele?.nom_prefab;
  const contrainte = contrainteDe(tuile);
  const morceaux = [
    tuile.code ? `code \`${tuile.code}\`` : "pas de code d'arbre",
    libelleAge(tuile.age ?? 0, ages),
    categories.length > 0 ? enumerer(categories) : "sans catégorie",
    `plateau \`${tuile.typeOfPlateau}\``,
    prefab ? `modèle 3D \`${prefab}\`` : "⚠️ aucun modèle 3D",
    contrainte === "destructible"
      ? `destructible — la case redevient « ${nomDeTuile(tuile.tileId_apres_destruction, tuiles)} »`
      : contrainte === "indestructible"
        ? "indestructible, mais une autre tuile peut prendre sa place"
        : "figée : ni destruction, ni remplacement",
  ];
  return morceaux.join(" · ");
}

function palier(p: Palier, nomRes: (code: string) => string): string[] {
  const payes = p.cout.filter((l) => l.mode === "paye");
  const mobilises = p.cout.filter((l) => l.mode === "mobilise");
  const max = satisfactionMax(p.utilisation);

  // ⚠️ Un palier qui ne consomme ni ne produit n'a PAS de cycle — le champ
  //    n'est même pas écrit en base (`paliersPourEnregistrer`). Lui afficher
  //    « durée non déclarée » inventerait une faute de saisie.
  const entete = [
    `chantier ${formatDuree(p.duree_construction_s)}`,
    ...(palierTourne(p)
      ? [libelleCycle(p), p.demarre_partiel ? "démarre avec ce qu'il y a" : "tout ou rien"]
      : []),
    max > 100 ? `satisfaction jusqu'à ${max} %` : "",
  ].filter(Boolean);

  const lignes = [`- **Palier ${p.niveau}** — ${entete.join(" · ")}`];

  if (payes.length > 0)
    lignes.push(`  - payé à la construction, et perdu — ${enumerer(payes.map((l) => cout(l, nomRes)))}`);
  if (mobilises.length > 0)
    lignes.push(
      `  - mobilisé tant qu'il tourne, rendu par la veille — ${enumerer(mobilises.map((l) => cout(l, nomRes)))}`,
    );
  if (p.utilisation.length > 0)
    lignes.push(`  - consomme par cycle — ${enumerer(p.utilisation.map((l) => consommation(l, nomRes)))}`);
  if (p.production.length > 0)
    for (const l of p.production) lignes.push(`  - produit par cycle — ${production(l, nomRes)}`);

  for (const erreur of erreursPalier(p)) lignes.push(`  - ⚠️ **erreur de saisie** — ${erreur}`);
  return lignes;
}

function cout(l: LigneCout, nomRes: (code: string) => string): string {
  return `${l.quantite} ${nomRes(l.ressource)}`;
}

function consommation(l: LigneFlux, nomRes: (code: string) => string): string {
  const notes = [
    l.direct ? "en direct, sans navette" : "",
    l.bonus > 0 ? `bonus +${l.bonus} % de satisfaction, ne bloque jamais le cycle` : "",
  ].filter(Boolean);
  return `${l.quantite} ${nomRes(l.ressource)}${notes.length > 0 ? ` (${notes.join(" ; ")})` : ""}`;
}

function production(l: LigneProduction, nomRes: (code: string) => string): string {
  const base = `${l.quantite} ${nomRes(l.ressource)}`;
  if (!l.indicateur)
    return `${base}, au prorata de la satisfaction du bâtiment`;
  const escalier = tranchesTriees(l.tranches)
    .map((t) => `à partir de ${t.seuil} % → ${t.rendement} %`)
    .join(", ");
  return `${base}, cadencé par « ${l.indicateur} » : ${escalier || "⚠️ aucune tranche"}`;
}

function coffreEtTransport(
  tuile: Tuile,
  nomTuile: (tileId: number) => string,
  nomRes: (code: string) => string,
): string[] {
  const l = logistiqueDe(tuile);
  const lignes: string[] = [];

  const plafonds = l.stockage.map((s) =>
    s.ressource === TOUTES_RESSOURCES
      ? `n'importe quoi jusqu'à ${s.max}`
      : `${nomRes(s.ressource)} jusqu'à ${s.max}`,
  );
  lignes.push(
    `- **Coffre** — ${plafonds.length === 0 ? "il ne garde rien." : enumerer(plafonds) + "."}` +
      (estCommun(l)
        ? " **Stock commun** : toutes les tuiles de ce type ne font qu'un seul coffre, et n'importe laquelle y donne accès."
        : ""),
  );

  if (l.appros.length > 0) {
    lignes.push(
      estEntrepot(l)
        ? "- **Transport** — il récolte **et** il livre : c'est un entrepôt."
        : "- **Transport**",
    );
    for (const r of l.appros) {
      lignes.push(`  - ${decrireAppro(r, nomTuile, nomRes)}`);
      if (r.erreur) lignes.push(`  - ⚠️ **erreur de saisie** — ${r.erreur}`);
    }
  }
  return lignes;
}

/* --- Les technologies ---------------------------------------------- */

function sectionTechnologies(d: DonneesCatalogue): string {
  const { technologies, ages } = d;
  const lignes = [
    "## Les technologies",
    "",
    `${pluriel(technologies.length, "recherche")} en base. Une techno n'est pas un bâtiment : c'est`,
    "une **recherche** qu'on paie depuis le bâtiment où elle vit, et qui débloque d'autres",
    "bâtiments ou d'autres recherches.",
    "",
    `⚠️ ${TECHNOS_HORS_MOTEUR}`,
    "",
  ];

  for (const numero of agesAParcourir(
    technologies.map((t) => t.age ?? 0),
    ages,
  )) {
    const dedans = technologies.filter((t) => (t.age ?? 0) === numero);
    if (dedans.length === 0) continue;
    lignes.push(`### ${libelleAge(numero, ages)} — ${pluriel(dedans.length, "recherche")}`, "");
    for (const t of dedans) lignes.push(ficheTechno(t, d), "");
  }

  return lignes.join("\n");
}

function ficheTechno(t: Technologie, d: DonneesCatalogue): string {
  const nomTuile = (tileId: number) => nomDeTuile(tileId, d.tuiles);
  const nomRes = (code: string) => nomDeRessource(code, d.ressources);
  const nomTechno = (code: string) =>
    d.technologies.find((x) => x.code === code)?.nom || `${code} (techno inconnue)`;

  const hote = batimentDe(t, d.tuiles);
  const niveaux = niveauxDe(t);
  const cat = categorieDe(hote);
  const lignes = [
    `#### ${t.nom} — \`${t.code}\`${t.batiment > 0 ? "" : " · brouillon"}`,
    "",
    `- **Où** — ${
      hote ? `dans « ${hote.nom} »${cat ? ` (${cat})` : ""}` : "⚠️ aucun bâtiment hôte : brouillon"
    } · ${libelleAge(t.age ?? 0, d.ages)} · ordre ${t.ordre} · ${
      niveaux > 1 ? `${niveaux} niveaux, et chacun repaie le coût` : "un seul niveau"
    }`,
  ];

  if (t.description.trim()) lignes.push(`- **Description** — ${t.description.trim()}`);

  // ⚠️ `batiments_requis` porte des **tileId**, `technos_requises` des **codes** :
  //    deux listes qui se ressemblent et ne se lisent pas pareil.
  const requisBatiments = (Array.isArray(t.batiments_requis) ? t.batiments_requis : []).map(
    (id) => `« ${nomTuile(id)} »`,
  );
  const requisTechnos = prerequisEffectifs(t.code, d.technologies).map((c) => `« ${nomTechno(c)} »`);
  if (requisBatiments.length > 0 || requisTechnos.length > 0)
    lignes.push(
      `- **Il faut d'abord** — ${enumerer([
        ...(requisBatiments.length > 0 ? [`posséder ${enumerer(requisBatiments)}`] : []),
        ...(requisTechnos.length > 0 ? [`avoir cherché ${enumerer(requisTechnos)}`] : []),
      ])}`,
    );

  const debloqueBatiments = (Array.isArray(t.debloque) ? t.debloque : []).map(
    (id) => `« ${nomTuile(id)} »`,
  );
  const debloqueTechnos = codesDe(t.debloque_technos).map((c) => `« ${nomTechno(c)} »`);
  if (debloqueBatiments.length > 0 || debloqueTechnos.length > 0)
    lignes.push(
      `- **Elle ouvre** — ${enumerer([
        ...(debloqueBatiments.length > 0 ? [enumerer(debloqueBatiments)] : []),
        ...(debloqueTechnos.length > 0 ? [`les recherches ${enumerer(debloqueTechnos)}`] : []),
      ])}`,
    );

  const c = coutDe(t);
  const prix = [
    ...(c.achat.length > 0
      ? [`à l'acquisition : ${enumerer(c.achat.map((l) => `${l.quantite} ${nomRes(l.ressource)}`))}`]
      : []),
    ...(c.entretien.length > 0
      ? [
          `entretien : ${enumerer(
            c.entretien.map((l) => `${l.par_minute} ${nomRes(l.ressource)} par minute`),
          )}`,
        ]
      : []),
  ];
  if (prix.length > 0) lignes.push(`- **Coût, par niveau** — ${prix.join(" · ")}`);

  const effets = effetsDe(t).filter(effetUtile);
  if (effets.length > 0)
    lignes.push(
      `- **Effets** — ${enumerer(
        effets.map(
          (e) =>
            `« ${nomTuile(e.tuile)} » produit ${e.valeur > 0 ? "+" : ""}${e.valeur}` +
            `${e.mode === "pourcentage" ? " %" : " par cycle"} de ${nomRes(e.ressource)}`,
        ),
      )}`,
    );

  return lignes.join("\n");
}

/* --- Les deux noms, dits une seule fois ---------------------------- */

/**
 * ⚠️ `0` est **la case vide**, pas une tuile manquante : c'est la convention de
 * `tilesBase64`, et elle se coche dans les règles de pose comme une tuile.
 * Un id qui ne correspond à rien, lui, doit se VOIR — une règle qui cite une
 * tuile supprimée est une faute de saisie.
 */
function nomDeTuile(tileId: number, tuiles: Tuile[]): string {
  if (tileId === CASE_VIDE) return "case vide";
  return tuiles.find((t) => t.tileId === tileId)?.nom ?? `tuile ${tileId} (inconnue)`;
}

/** Le nom d'une ressource, et un signal quand le code n'existe plus. */
function nomDeRessource(code: string, ressources: Ressource[]): string {
  return codeInconnu(ressources, code)
    ? `\`${code}\` (⚠️ code inconnu)`
    : `« ${libelleRessource(ressources, code)} »`;
}

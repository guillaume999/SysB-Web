import type { ReactNode } from "react";

/**
 * Les schémas du document de conception, dessinés en SVG.
 *
 * Ils ne décorent pas le texte : chacun montre un mécanisme qu'il faudrait
 * sinon reconstituer de tête en lisant plusieurs paragraphes — pourquoi la
 * boucle de supériorité tient, ce qui traverse les Portes, quelle famille
 * d'unités naît de quelle intersection d'axes, ce qu'un biome change.
 *
 * Ils sont appelés depuis le Markdown par un marqueur en commentaire :
 *
 *     <!-- schema: triangulation -->
 *
 * Le commentaire est invisible dans n'importe quel autre lecteur Markdown, et
 * le fichier .md reste lisible seul. Quand un bloc ``` suit immédiatement le
 * marqueur, le schéma le **remplace** à l'écran et le dessin ASCII d'origine
 * part dans un `<details>` replié — rien n'est perdu, l'écran est lisible.
 *
 * ⚠️ La couleur ne porte jamais seule une information : chaque élément coloré
 * est aussi nommé en toutes lettres. Un lecteur qui ne distingue pas le vert du
 * violet lit le même schéma.
 */

const SCI = "#4c8dff";
const GEN = "#4ade80";
const ARC = "#c084fc";

/* ------------------------------------------------------------------ */
/* Briques communes                                                    */
/* ------------------------------------------------------------------ */

/** Les pointes de flèche. `p` préfixe les ids : ils doivent être uniques dans la page. */
function Fleches({ p }: { p: string }) {
  return (
    <defs>
      {[
        ["", "currentColor"],
        ["-sci", SCI],
        ["-gen", GEN],
        ["-arc", ARC],
      ].map(([suffixe, couleur]) => (
        <marker
          key={suffixe}
          id={`${p}${suffixe}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={couleur} />
        </marker>
      ))}
    </defs>
  );
}

/** Une boîte d'axe : nom, rôle, et le profil défensif qui explique la boucle. */
function BoiteAxe({
  x,
  y,
  couleur,
  nom,
  role,
  defense,
}: {
  x: number;
  y: number;
  couleur: string;
  nom: string;
  role: string;
  defense: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={200} height={92} rx={10} fill={couleur} fillOpacity={0.1} stroke={couleur} />
      <text x={x + 100} y={y + 30} textAnchor="middle" fontSize={14} fontWeight={600} fill={couleur}>
        {nom}
      </text>
      <text x={x + 100} y={y + 52} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.75}>
        {role}
      </text>
      <text x={x + 100} y={y + 74} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.5}>
        {defense}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* 1. La triangulation                                                 */
/* ------------------------------------------------------------------ */

function Triangulation() {
  return (
    <svg
      viewBox="0 0 880 520"
      className="h-auto w-full"
      role="img"
      aria-label="Chaque axe perce la défense du suivant : la Science annule la régénération de la Génétique, la Génétique étouffe le mana des Archéomages, les Archéomages ignorent le blindage de la Science."
    >
      <Fleches p="tri" />

      <BoiteAxe x={340} y={24} couleur={SCI} nom="SCIENCE" role="Perfore · Annule" defense="Armure physique haute · énergétique basse" />
      <BoiteAxe x={650} y={350} couleur={GEN} nom="GÉNÉTIQUE" role="Absorbe · Neutralise" defense="PV massifs · armure énergétique" />
      <BoiteAxe x={30} y={350} couleur={ARC} nom="ARCHÉOMAGES" role="Contourne · Surcharge" defense="Intangibilité physique · peu de PV" />

      {/* Science bat Génétique */}
      <path d="M 528 120 Q 640 200 704 344" fill="none" stroke={SCI} strokeWidth={2} markerEnd="url(#tri-sci)" />
      <text x={672} y={198} fontSize={11} fill={SCI}>
        perfore &amp; cautérise
      </text>
      <text x={672} y={216} fontSize={10} fill="currentColor" opacity={0.6}>
        la régénération ne repart pas
      </text>

      {/* Génétique bat Archéomages */}
      <line x1={642} y1={396} x2={244} y2={396} stroke={GEN} strokeWidth={2} markerEnd="url(#tri-gen)" />
      <text x={443} y={368} textAnchor="middle" fontSize={11} fill={GEN}>
        étouffe le mana
      </text>
      <text x={443} y={386} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>
        masse de PV, immunité d'esprit
      </text>

      {/* Archéomages bat Science */}
      <path d="M 156 344 Q 220 210 344 122" fill="none" stroke={ARC} strokeWidth={2} markerEnd="url(#tri-arc)" />
      <text x={200} y={198} textAnchor="end" fontSize={11} fill={ARC}>
        ignore le blindage
      </text>
      <text x={200} y={216} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.6}>
        phasique, téléportation
      </text>

      <text x={443} y={470} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.45}>
        Aucun axe n'est fort partout : chacun est taillé contre la défense d'un seul autre.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 2. La boucle de jeu                                                 */
/* ------------------------------------------------------------------ */

function BoucleJeu() {
  return (
    <svg
      viewBox="0 0 880 360"
      className="h-auto w-full"
      role="img"
      aria-label="Les planètes produisent, les Portes téléportrices transportent vers le Plateau de l'Univers, et les cases conquises renvoient des ressources vers les planètes."
    >
      <Fleches p="bcl" />

      {/* Planètes */}
      <rect x={20} y={60} width={230} height={170} rx={10} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.35} />
      <text x={135} y={88} textAnchor="middle" fontSize={13} fontWeight={600} fill="currentColor">
        PLANÈTES
      </text>
      {["7 paliers d'évolution", "population · confort", "chaînes de production", "recherche des 3 axes"].map((t, i) => (
        <text key={t} x={135} y={116 + i * 24} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.55}>
          {t}
        </text>
      ))}

      {/* Porte */}
      <rect x={340} y={100} width={200} height={110} rx={55} fill={SCI} fillOpacity={0.12} stroke={SCI} />
      <text x={440} y={140} textAnchor="middle" fontSize={12} fontWeight={600} fill={SCI}>
        PORTE
      </text>
      <text x={440} y={160} textAnchor="middle" fontSize={12} fontWeight={600} fill={SCI}>
        TÉLÉPORTRICE
      </text>
      <text x={440} y={182} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.55}>
        le seul passage entre les deux
      </text>
      <text x={440} y={236} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.5}>
        coûte hydrazine + comburant O2
      </text>
      <text x={440} y={252} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.5}>
        −30 % avec le Sanctuaire de Stabilisation
      </text>

      {/* Plateau */}
      <rect x={630} y={60} width={230} height={170} rx={10} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.35} />
      <text x={745} y={88} textAnchor="middle" fontSize={13} fontWeight={600} fill="currentColor">
        PLATEAU DE L'UNIVERS
      </text>
      {["damier de la Toile cosmique", "neutre → occupé → en guerre", "Dota (temps réel)", "ou tour par tour (siège)"].map((t, i) => (
        <text key={t} x={745} y={116 + i * 24} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.55}>
          {t}
        </text>
      ))}

      {/* Aller */}
      <line x1={256} y1={145} x2={334} y2={145} stroke="currentColor" strokeOpacity={0.6} strokeWidth={2} markerEnd="url(#bcl)" />
      <text x={295} y={118} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.6}>
        ressources
      </text>
      <text x={295} y={131} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.6}>
        unités, armes
      </text>

      <line x1={546} y1={145} x2={624} y2={145} stroke="currentColor" strokeOpacity={0.6} strokeWidth={2} markerEnd="url(#bcl)" />
      <text x={585} y={118} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.6}>
        vagues et
      </text>
      <text x={585} y={131} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.6}>
        bataillons
      </text>

      {/* Retour */}
      <path
        d="M 745 236 L 745 300 L 135 300 L 135 240"
        fill="none"
        stroke={GEN}
        strokeWidth={2}
        strokeOpacity={0.8}
        markerEnd="url(#bcl-gen)"
      />
      <text x={440} y={322} textAnchor="middle" fontSize={11} fill={GEN}>
        cases conquises → ressources rares, nouveaux biomes, plus de Portes
      </text>

      <text x={440} y={44} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.45}>
        Une planète qui ne produit pas ne pèse rien sur le front ; un front qui n'avance pas ne rapporte rien à la planète.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Les 7 familles d'unités                                          */
/* ------------------------------------------------------------------ */

function Familles() {
  const cercles = [
    { cx: 250, cy: 230, couleur: ARC },
    { cx: 470, cy: 230, couleur: SCI },
    { cx: 360, cy: 420, couleur: GEN },
  ];

  const zones: { x: number; y: number; couleur: string; nom: string[]; exemple: string }[] = [
    { x: 152, y: 176, couleur: ARC, nom: ["Archéomages purs"], exemple: "Inquisiteur · Poseur de Glyphes" },
    { x: 568, y: 176, couleur: SCI, nom: ["Scientifiques purs"], exemple: "Drone · Char à Plasma" },
    { x: 360, y: 522, couleur: GEN, nom: ["Généticiens purs"], exemple: "Pionnier · Berserker" },
    { x: 360, y: 166, couleur: "currentColor", nom: ["Techno-Magie"], exemple: "Golem · Artillerie Phasique" },
    { x: 238, y: 366, couleur: "currentColor", nom: ["Bio-Magie"], exemple: "Muta-Chaman · Araignée" },
    { x: 482, y: 366, couleur: "currentColor", nom: ["Cyber-Bionique"], exemple: "Cyborg · Dreadnought" },
    { x: 360, y: 292, couleur: "#fbbf24", nom: ["Trinité"], exemple: "Avatar Cosmique" },
  ];

  return (
    <svg
      viewBox="0 0 720 660"
      className="mx-auto h-auto w-full max-w-[560px]"
      role="img"
      aria-label="Les 35 unités se répartissent en 7 familles de 5 : trois axes purs, trois croisements de deux axes, et la Trinité au centre des trois."
    >
      {cercles.map((c) => (
        <circle key={c.couleur} cx={c.cx} cy={c.cy} r={190} fill={c.couleur} fillOpacity={0.08} stroke={c.couleur} strokeOpacity={0.55} />
      ))}

      {zones.map((z) => (
        <g key={z.nom[0]}>
          <text x={z.x} y={z.y} textAnchor="middle" fontSize={12} fontWeight={600} fill={z.couleur}>
            {z.nom[0]}
          </text>
          <text x={z.x} y={z.y + 16} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.7}>
            5 unités
          </text>
          <text x={z.x} y={z.y + 31} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.45}>
            {z.exemple}
          </text>
        </g>
      ))}

      <text x={360} y={636} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.45}>
        7 familles × 5 unités = 35. Les paliers 1 et 2 n'ont que des unités pures : il faut deux axes mûrs pour croiser.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 4. La matrice de combat                                             */
/* ------------------------------------------------------------------ */

interface Ligne {
  palier: string;
  role: string[];
  sci: [string, string, string];
  gen: [string, string, string];
  arc: [string, string, string];
  dominant: "sci" | "gen" | "arc";
}

const MATRICE: Ligne[] = [
  {
    palier: "P1",
    role: ["Infanterie", "de ligne"],
    sci: ["Exosquelette de Tir", "650 PV", "armure 25 / 5"],
    gen: ["Guerrier Mutant", "1 100 PV", "armure 10 / 35"],
    arc: ["Inquisiteur Runique", "500 PV", "armure 35 / 5"],
    dominant: "sci",
  },
  {
    palier: "P2",
    role: ["Siège &", "démolition"],
    sci: ["Canon à Plasma Lourd", "1 800 PV", "armure 60 / 15"],
    gen: ["Behemoth de Muta-Chair", "4 200 PV", "armure 20 / 70"],
    arc: ["Faucheur d'Éther", "1 200 PV", "armure 80 / 10"],
    dominant: "gen",
  },
  {
    palier: "P3",
    role: ["Contrôle", "de zone"],
    sci: ["Émetteur de Stase EMP", "2 400 PV", "armure 80 / 20"],
    gen: ["Traqueur Venimeux", "2 900 PV", "armure 25 / 85"],
    arc: ["Sphère de Distorsion", "1 600 PV", "armure 100 / 15"],
    dominant: "arc",
  },
  {
    palier: "P4",
    role: ["Artillerie", "lourde"],
    sci: ["Batterie Orbitale", "3 500 PV", "armure 100 / 25"],
    gen: ["Hydre Métabolique", "8 200 PV", "armure 35 / 120"],
    arc: ["Artillerie Phasique", "2 200 PV", "armure 130 / 20"],
    dominant: "sci",
  },
  {
    palier: "P5",
    role: ["Domination", "aérienne"],
    sci: ["Chasseur à Rayon", "3 200 PV", "armure 75 / 20"],
    gen: ["Léviathan Volant", "6 800 PV", "armure 30 / 95"],
    arc: ["Archonte de Tempête", "2 400 PV", "armure 110 / 15"],
    dominant: "gen",
  },
  {
    palier: "P6",
    role: ["Unités", "suprêmes"],
    sci: ["Titan Anti-Matière", "8 500 PV", "armure 120 / 40"],
    gen: ["Colosse Transhumain", "14 000 PV", "armure 50 / 150"],
    arc: ["Avatar de l'Éther", "6 000 PV", "armure 180 / 30"],
    dominant: "arc",
  },
];

const DOMINE: Record<Ligne["dominant"], { couleur: string; haut: string; bas: string }> = {
  sci: { couleur: SCI, haut: "Science", bas: "▸ Génétique" },
  gen: { couleur: GEN, haut: "Génétique", bas: "▸ Archéomages" },
  arc: { couleur: ARC, haut: "Archéomages", bas: "▸ Science" },
};

function MatriceCombat() {
  const COLS = [
    { x: 90, w: 216, couleur: SCI, nom: "SCIENCE", cle: "sci" as const },
    { x: 306, w: 216, couleur: GEN, nom: "GÉNÉTIQUE", cle: "gen" as const },
    { x: 522, w: 216, couleur: ARC, nom: "ARCHÉOMAGES", cle: "arc" as const },
  ];

  return (
    <svg
      viewBox="0 0 880 520"
      className="h-auto w-full"
      role="img"
      aria-label="Les 18 unités de combat, trois axes sur six paliers. L'axe dominant tourne à chaque palier : Science, Génétique, Archéomages, puis à nouveau Science."
    >
      {COLS.map((c) => (
        <text key={c.cle} x={c.x + c.w / 2} y={28} textAnchor="middle" fontSize={12} fontWeight={600} fill={c.couleur}>
          {c.nom}
        </text>
      ))}
      <text x={809} y={28} textAnchor="middle" fontSize={11} fontWeight={600} fill="currentColor" opacity={0.6}>
        Domination
      </text>
      <line x1={0} y1={42} x2={880} y2={42} stroke="currentColor" strokeOpacity={0.3} />

      {MATRICE.map((ligne, i) => {
        const y = 42 + i * 76;
        const d = DOMINE[ligne.dominant];
        return (
          <g key={ligne.palier}>
            {i % 2 === 1 && <rect x={0} y={y} width={880} height={76} fill="currentColor" fillOpacity={0.035} />}
            <line x1={0} y1={y} x2={880} y2={y} stroke="currentColor" strokeOpacity={0.15} />

            <text x={45} y={y + 32} textAnchor="middle" fontSize={14} fontWeight={600} fill="currentColor" opacity={0.85}>
              {ligne.palier}
            </text>
            {ligne.role.map((r, n) => (
              <text key={r} x={45} y={y + 48 + n * 12} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.45}>
                {r}
              </text>
            ))}

            {COLS.map((c) => {
              const [nom, pv, armure] = ligne[c.cle];
              const actif = ligne.dominant === c.cle;
              return (
                <g key={c.cle}>
                  {actif && (
                    <rect x={c.x + 6} y={y + 8} width={c.w - 12} height={60} rx={6} fill={c.couleur} fillOpacity={0.1} stroke={c.couleur} strokeOpacity={0.5} />
                  )}
                  <text x={c.x + c.w / 2} y={y + 30} textAnchor="middle" fontSize={11} fill={actif ? c.couleur : "currentColor"} opacity={actif ? 1 : 0.8}>
                    {nom}
                  </text>
                  <text x={c.x + c.w / 2} y={y + 46} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.55}>
                    {pv}
                  </text>
                  <text x={c.x + c.w / 2} y={y + 61} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>
                    {armure}
                  </text>
                </g>
              );
            })}

            <rect x={750} y={y + 18} width={118} height={40} rx={6} fill={d.couleur} fillOpacity={0.12} stroke={d.couleur} strokeOpacity={0.5} />
            <text x={809} y={y + 34} textAnchor="middle" fontSize={9} fontWeight={600} fill={d.couleur}>
              {d.haut}
            </text>
            <text x={809} y={y + 48} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.6}>
              {d.bas}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={498} x2={880} y2={498} stroke="currentColor" strokeOpacity={0.3} />
      <text x={440} y={514} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.45}>
        Lire la colonne de droite de haut en bas : la domination tourne, aucun axe ne garde l'avantage deux paliers de suite.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Les 7 paliers d'évolution                                        */
/* ------------------------------------------------------------------ */

const PALIERS: { nom: string[]; habitat: string }[] = [
  { nom: ["Âge des", "Pionniers"], habitat: "cabane en bois" },
  { nom: ["Secteur", "Artisanal"], habitat: "maison en brique" },
  { nom: ["Société", "Urbaine"], habitat: "immeuble" },
  { nom: ["Ère", "Industrielle"], habitat: "cité ouvrière" },
  { nom: ["Ère Spatiale", "Primordiale"], habitat: "béton et verre" },
  { nom: ["Métropole", "Spatiale"], habitat: "arcologie" },
  { nom: ["Cité Spatiale", "Transhumaine"], habitat: "dôme / orbital" },
];

function PaliersEvolution() {
  return (
    <svg
      viewBox="0 0 900 480"
      className="h-auto w-full"
      role="img"
      aria-label="Les sept paliers d'évolution d'une planète, en escalier. Au palier 5 la colonie atteint l'orbite et commence à expédier vers le front ; au palier 7 elle alimente les Portes."
    >
      {PALIERS.map((p, i) => {
        const x = 26 + i * 122;
        const yTop = 396 - i * 46;
        const spatial = i >= 4;
        return (
          <g key={p.habitat}>
            {i > 0 && (
              <path
                d={`M ${x} ${yTop + 26} L ${x} ${yTop + 46} L ${x - 18} ${yTop + 46}`}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.25}
              />
            )}
            <rect
              x={x}
              y={yTop}
              width={104}
              height={26}
              rx={4}
              fill={spatial ? SCI : "currentColor"}
              fillOpacity={spatial ? 0.18 : 0.06 + i * 0.02}
              stroke={spatial ? SCI : "currentColor"}
              strokeOpacity={spatial ? 0.6 : 0.3}
            />
            <text x={x + 52} y={yTop + 18} textAnchor="middle" fontSize={12} fontWeight={600} fill={spatial ? SCI : "currentColor"} opacity={spatial ? 1 : 0.8}>
              {`P${i + 1}`}
            </text>
            {p.nom.map((l, n) => (
              <text key={l} x={x + 52} y={yTop - 32 + n * 12} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.75}>
                {l}
              </text>
            ))}
            <text x={x + 52} y={yTop - 8} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.4}>
              {p.habitat}
            </text>
          </g>
        );
      })}

      <text x={26 + 6 * 122 + 52} y={182} textAnchor="middle" fontSize={9} fill={SCI} opacity={0.9}>
        alimente les Portes
      </text>

      {/* Le seuil qui compte : l'orbite */}
      <line x1={509} y1={60} x2={509} y2={440} stroke={SCI} strokeOpacity={0.5} strokeDasharray="5 4" />
      <text x={519} y={54} fontSize={10} fill={SCI}>
        seuil de l'orbite — à partir d'ici la planète expédie vers le front
      </text>

      <text x={26} y={462} fontSize={10} fill="currentColor" opacity={0.45}>
        Chaque palier change l'habitat, donc la densité de population, donc ce que la planète peut produire et envoyer.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 6. L'arbre des bâtiments                                            */
/* ------------------------------------------------------------------ */

const BRANCHES = [
  {
    couleur: SCI,
    commun: ["Quartier Résidentiel", "+15 Main-d'Œuvre"],
    tete: "Infrastructure Scientifique",
    paliers: [
      ["Usine de Matrice · P1-P2", "Exosquelette · Canon à Plasma"],
      ["Forge à Plasma · P3-P4", "Stase EMP · Batterie Orbitale"],
      ["Complexe Anti-Matière · P5-P6", "Chasseur à Rayon · Titan"],
    ],
  },
  {
    couleur: GEN,
    commun: ["Distributeur Alimentaire", "+10 Alimentation"],
    tete: "Biomodule de Culture",
    paliers: [
      ["Gestateur d'Échines · P1-P2", "Guerrier Mutant · Behemoth"],
      ["Cuve de Biomasse · P3-P4", "Traqueur Venimeux · Hydre"],
      ["Charnier Transhumain · P5-P6", "Léviathan · Colosse"],
    ],
  },
  {
    couleur: ARC,
    commun: ["Sanctuaire d'Alignement", "+15 % satisfaction · +5 FA"],
    tete: "Foyer de Focale",
    paliers: [
      ["Autel des Runes · P1-P2", "Inquisiteur · Faucheur d'Éther"],
      ["Nexus Éthérique · P3-P4", "Sphère · Artillerie Phasique"],
      ["Obélisque Astral · P5-P6", "Archonte · Avatar de l'Éther"],
    ],
  },
];

function ArbreBatiments() {
  const centres = [150, 440, 730];

  return (
    <svg
      viewBox="0 0 880 450"
      className="h-auto w-full"
      role="img"
      aria-label="Le Centre de Gouvernance ouvre trois bâtiments communs, chacun tête d'une branche d'axe, et chaque branche produit deux unités par paire de paliers."
    >
      <Fleches p="bat" />

      <rect x={250} y={12} width={380} height={48} rx={8} fill="currentColor" fillOpacity={0.08} stroke="currentColor" strokeOpacity={0.4} />
      <text x={440} y={34} textAnchor="middle" fontSize={12} fontWeight={600} fill="currentColor">
        CENTRE DE GOUVERNANCE (I → III)
      </text>
      <text x={440} y={50} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.5}>
        fixe le plafond démographique de tout le reste
      </text>

      <path d="M 440 60 L 440 78 M 150 78 L 730 78 M 150 78 L 150 96 M 440 78 L 440 96 M 730 78 L 730 96" fill="none" stroke="currentColor" strokeOpacity={0.3} />

      {BRANCHES.map((b, i) => {
        const cx = centres[i];
        const x = cx - 125;
        return (
          <g key={b.tete}>
            <rect x={x} y={96} width={250} height={46} rx={6} fill="currentColor" fillOpacity={0.05} stroke="currentColor" strokeOpacity={0.3} />
            <text x={cx} y={116} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.85}>
              {b.commun[0]}
            </text>
            <text x={cx} y={132} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.5}>
              {b.commun[1]}
            </text>

            <line x1={cx} y1={142} x2={cx} y2={168} stroke={b.couleur} strokeOpacity={0.6} markerEnd="url(#bat)" />

            <rect x={x} y={170} width={250} height={38} rx={6} fill={b.couleur} fillOpacity={0.14} stroke={b.couleur} />
            <text x={cx} y={194} textAnchor="middle" fontSize={11} fontWeight={600} fill={b.couleur}>
              {b.tete}
            </text>

            {b.paliers.map((p, n) => {
              const y = 224 + n * 60;
              return (
                <g key={p[0]}>
                  <line x1={cx} y1={y - 16} x2={cx} y2={y - 2} stroke={b.couleur} strokeOpacity={0.35} />
                  <rect x={x} y={y} width={250} height={44} rx={6} fill={b.couleur} fillOpacity={0.05} stroke={b.couleur} strokeOpacity={0.35} />
                  <text x={cx} y={y + 19} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.85}>
                    {p[0]}
                  </text>
                  <text x={cx} y={y + 34} textAnchor="middle" fontSize={9} fill={b.couleur} opacity={0.8}>
                    {p[1]}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      <text x={440} y={438} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.45}>
        Un bâtiment de faction ne produit que deux unités : monter d'un palier suppose d'avoir bâti le précédent.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Les biomes                                                       */
/* ------------------------------------------------------------------ */

type Arete = "sg" | "ga" | "as";

const BIOMES: {
  nom: string;
  arete: Arete;
  attaque: string;
  sens: "amplifie" | "attenue";
  couleur: string;
  effets: string[];
}[] = [
  {
    nom: "Plaines volcaniques",
    arete: "sg",
    attaque: "Science ▸ Génétique",
    sens: "amplifie",
    couleur: SCI,
    effets: ["Science +20 % dégâts thermiques", "Génétique −50 % régén., −15 armure", "Archéo +1 portée, −10 % résist. plasma"],
  },
  {
    nom: "Forêt vierge",
    arete: "sg",
    attaque: "Science ▸ Génétique",
    sens: "attenue",
    couleur: GEN,
    effets: ["Génétique +50 % régén. · Discrétion", "Science −2 cases de portée", "Archéo −1 case de vitesse"],
  },
  {
    nom: "Ruines industrielles",
    arete: "as",
    attaque: "Archéomages ▸ Science",
    sens: "amplifie",
    couleur: ARC,
    effets: ["Archéo +25 % rayon des sorts de zone", "Science +30 armure derrière les débris", "Génétique 30 dégâts de saignement/tour"],
  },
];

function MiniTriangle({ arete, sens }: { arete: Arete; sens: "amplifie" | "attenue" }) {
  /**
   * La flèche garde la couleur de l'axe qui attaque — c'est elle qu'on suit.
   * Le biome favorisé se lit sur le titre du panneau, pas sur le trait : sinon
   * la flèche « Science contre Génétique » de la forêt serait verte, et on
   * croirait que c'est la Génétique qui attaque.
   */
  const aretes: Record<Arete, { d: string; marker: string; couleur: string }> = {
    sg: { d: "M 134 54 L 176 126", marker: "bio-sci", couleur: SCI },
    ga: { d: "M 172 140 L 68 140", marker: "bio-gen", couleur: GEN },
    as: { d: "M 64 126 L 106 54", marker: "bio-arc", couleur: ARC },
  };

  return (
    <g>
      {(["sg", "ga", "as"] as Arete[]).map((a) => {
        const vif = a === arete;
        return (
          <path
            key={a}
            d={aretes[a].d}
            fill="none"
            stroke={vif ? aretes[a].couleur : "currentColor"}
            strokeOpacity={vif ? 1 : 0.25}
            strokeWidth={vif && sens === "amplifie" ? 4.5 : 1.5}
            strokeDasharray={vif && sens === "attenue" ? "4 4" : undefined}
            markerEnd={`url(#${vif ? aretes[a].marker : "bio"})`}
          />
        );
      })}
      {[
        { cx: 120, cy: 38, lettre: "S", couleur: SCI },
        { cx: 190, cy: 140, lettre: "G", couleur: GEN },
        { cx: 50, cy: 140, lettre: "A", couleur: ARC },
      ].map((n) => (
        <g key={n.lettre}>
          <circle cx={n.cx} cy={n.cy} r={16} fill={n.couleur} fillOpacity={0.15} stroke={n.couleur} />
          <text x={n.cx} y={n.cy + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill={n.couleur}>
            {n.lettre}
          </text>
        </g>
      ))}
    </g>
  );
}

function Biomes() {
  return (
    <svg
      viewBox="0 0 880 320"
      className="h-auto w-full"
      role="img"
      aria-label="Un biome n'inverse jamais la boucle : il épaissit ou affaiblit une seule de ses trois flèches. Le volcan renforce la Science contre la Génétique, la forêt l'affaiblit, les ruines renforcent les Archéomages contre la Science."
    >
      <Fleches p="bio" />

      {BIOMES.map((b, i) => (
        <g key={b.nom} transform={`translate(${20 + i * 293}, 0)`}>
          <MiniTriangle arete={b.arete} sens={b.sens} />
          <text x={120} y={198} textAnchor="middle" fontSize={12} fontWeight={600} fill={b.couleur}>
            {b.nom}
          </text>
          <text x={120} y={214} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.5}>
            {`${b.attaque} — ${b.sens === "amplifie" ? "amplifié (trait épais)" : "atténué (trait pointillé)"}`}
          </text>
          {b.effets.map((e, n) => (
            <text key={e} x={120} y={238 + n * 16} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.65}>
              {e}
            </text>
          ))}
        </g>
      ))}

      <text x={440} y={306} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.45}>
        S = Science · G = Génétique · A = Archéomages. Le biome change le rythme de la boucle, jamais son sens.
      </text>
    </svg>
  );
}

/* ================================================================== */
/* PARTIE VIII — les âges                                             */
/* ================================================================== */

/**
 * Un flux d'âge : quatre colonnes, de la case au bénéfice.
 *
 * Un seul moteur pour les sept âges — ils se comparent d'autant mieux que le
 * dessin ne change pas. Chaque flèche se lit « alimente » et rien d'autre :
 * c'est pourquoi elles ne portent pas d'étiquette. La ressource qui circule est
 * écrite sous le bâtiment qui la produit, une fois, au lieu d'être répétée sur
 * chaque trait.
 */
interface NoeudFlux {
  id: string;
  nom: string;
  sous?: string;
  col: 0 | 1 | 2 | 3;
  couleur?: string;
  cle?: boolean;
}

interface DonneesFlux {
  entetes: [string, string, string, string];
  noeuds: NoeudFlux[];
  liens: [string, string][];
}

const LARGEUR_NOEUD = 188;
const HAUTEUR_NOEUD = 44;
const PAS = 62;
const COLONNES_X = [16, 236, 456, 676];

function FluxAge({ donnees, titre }: { donnees: DonneesFlux; titre: string }) {
  const parColonne = [0, 1, 2, 3].map((c) => donnees.noeuds.filter((n) => n.col === c));
  const hauteurMax = Math.max(...parColonne.map((c) => c.length));
  /** +26 sous la dernière rangée : le couloir où passent les liens longs. */
  const hauteur = 100 + hauteurMax * PAS;
  const yCouloir = hauteur - 16;

  /** Le centre vertical d'un nœud : chaque colonne est centrée sur la hauteur commune. */
  const position = (id: string) => {
    const noeud = donnees.noeuds.find((n) => n.id === id)!;
    const colonne = parColonne[noeud.col];
    const rang = colonne.indexOf(noeud);
    const offset = (hauteurMax - colonne.length) / 2;
    return {
      x: COLONNES_X[noeud.col],
      y: 74 + (rang + offset) * PAS,
    };
  };

  return (
    <svg
      viewBox={`0 0 880 ${hauteur}`}
      className="h-auto w-full"
      role="img"
      aria-label={titre}
    >
      <Fleches p={`fx${donnees.noeuds[0].id}`} />

      {donnees.entetes.map((entete, i) => (
        <text
          key={entete}
          x={COLONNES_X[i] + LARGEUR_NOEUD / 2}
          y={30}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill="currentColor"
          opacity={0.45}
          letterSpacing="0.08em"
        >
          {entete.toUpperCase()}
        </text>
      ))}
      <line x1={0} y1={44} x2={880} y2={44} stroke="currentColor" strokeOpacity={0.2} />

      {donnees.liens.map(([de, vers]) => {
        const a = position(de);
        const b = position(vers);
        const x1 = a.x + LARGEUR_NOEUD;
        const y1 = a.y + HAUTEUR_NOEUD / 2;
        const y2 = b.y + HAUTEUR_NOEUD / 2;
        const colDe = donnees.noeuds.find((n) => n.id === de)!.col;
        const colVers = donnees.noeuds.find((n) => n.id === vers)!.col;

        /**
         * Seul un lien vers la colonne immédiatement à droite peut aller droit.
         * Tous les autres — saut de colonne, retour en arrière, voisin de la même
         * colonne — traverseraient des boîtes et se liraient comme des traits
         * perdus : ils descendent dans le couloir du bas, longent le dessin et
         * remontent à l'arrivée.
         */
        const d =
          colVers - colDe !== 1
            ? `M ${x1} ${y1} L ${x1 + 12} ${y1} Q ${x1 + 26} ${y1}, ${x1 + 26} ${y1 + 14}` +
              ` L ${x1 + 26} ${yCouloir - 14} Q ${x1 + 26} ${yCouloir}, ${x1 + 40} ${yCouloir}` +
              ` L ${b.x - 40} ${yCouloir} Q ${b.x - 26} ${yCouloir}, ${b.x - 26} ${yCouloir - 14}` +
              ` L ${b.x - 26} ${y2 + 14} Q ${b.x - 26} ${y2}, ${b.x - 12} ${y2} L ${b.x - 4} ${y2}`
            : `M ${x1} ${y1} C ${x1 + 26} ${y1}, ${b.x - 26} ${y2}, ${b.x - 4} ${y2}`;

        return (
          <path
            key={`${de}-${vers}`}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.3}
            markerEnd={`url(#fx${donnees.noeuds[0].id})`}
          />
        );
      })}

      {donnees.noeuds.map((n) => {
        const { x, y } = position(n.id);
        const couleur = n.couleur ?? (n.cle ? SCI : "currentColor");
        const marque = Boolean(n.couleur || n.cle);
        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={LARGEUR_NOEUD}
              height={HAUTEUR_NOEUD}
              rx={6}
              fill={couleur}
              fillOpacity={marque ? 0.12 : 0.05}
              stroke={couleur}
              strokeOpacity={marque ? 0.7 : 0.28}
            />
            <text
              x={x + LARGEUR_NOEUD / 2}
              y={y + (n.sous ? 19 : 27)}
              textAnchor="middle"
              fontSize={10}
              fill={marque ? couleur : "currentColor"}
              opacity={marque ? 1 : 0.85}
            >
              {n.nom}
            </text>
            {n.sous && (
              <text x={x + LARGEUR_NOEUD / 2} y={y + 34} textAnchor="middle" fontSize={9} fill="currentColor" opacity={0.45}>
                {n.sous}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const FLUX: Record<number, DonneesFlux> = {
  1: {
    entetes: ["Prendre à la case", "Transformer", "Produire", "Ce que ça donne"],
    noeuds: [
      { id: "a1", nom: "Hutte du Bûcheron", sous: "bois", col: 0 },
      { id: "a2", nom: "Carrière & Fosse", sous: "pierre · argile", col: 0 },
      { id: "a3", nom: "Chasse & Pêche", sous: "gibier · poisson", col: 0 },
      { id: "a4", nom: "Rucher", sous: "baies · miel", col: 0 },
      { id: "b1", nom: "Entrepôt en Bois", sous: "sans lui, rien ne tourne", col: 1, cle: true },
      { id: "b2", nom: "Cuve Artisanale", sous: "3 baies · 1 miel", col: 1 },
      { id: "b3", nom: "Séchoir en Bois", sous: "feuilles de tabac", col: 1 },
      { id: "c1", nom: "Vivres stockés", col: 2 },
      { id: "c2", nom: "Bière de baies", col: 2 },
      { id: "c3", nom: "Tabac séché", col: 2 },
      { id: "d1", nom: "Colons au travail", sous: "+10 % de vitesse", col: 3 },
      { id: "d2", nom: "Autel en Pierre", sous: "ouvre la jauge d'Esprit", col: 3, couleur: ARC },
    ],
    liens: [
      ["a1", "b1"], ["a2", "b1"], ["a3", "b1"], ["a4", "b2"],
      ["b1", "c1"], ["b2", "c2"], ["b3", "c3"],
      ["c1", "d1"], ["c2", "d1"], ["c3", "d1"], ["c2", "d2"],
    ],
  },
  2: {
    entetes: ["Prendre à la case", "Transformer", "Produire", "Ce que ça débloque"],
    noeuds: [
      { id: "a1", nom: "Bois, pierre, argile", col: 0 },
      { id: "a2", nom: "Mine de Fer", sous: "minerai · gisement", col: 0 },
      { id: "a3", nom: "Champ de Blé", sous: "case fertile", col: 0 },
      { id: "a4", nom: "Bergerie", sous: "bétail · laine", col: 0 },
      { id: "b1", nom: "Scierie", sous: "planches", col: 1 },
      { id: "b2", nom: "Four à Briques", sous: "briques", col: 1, cle: true },
      { id: "b3", nom: "Charbonnière", sous: "charbon de bois", col: 1 },
      { id: "b4", nom: "Forge du Village", sous: "outils en fer", col: 1, cle: true },
      { id: "b5", nom: "Moulin du Meunier", sous: "farine", col: 1 },
      { id: "c1", nom: "Planches", col: 2 },
      { id: "c2", nom: "Briques", col: 2, cle: true },
      { id: "c3", nom: "Outils en fer", col: 2, cle: true },
      { id: "c4", nom: "Farine & vivres", col: 2 },
      { id: "d1", nom: "Maison en Brique", sous: "loge 8 colons", col: 3 },
      { id: "d2", nom: "Hôtel de Ville", sous: "ouvre l'âge 3", col: 3, cle: true },
      { id: "d3", nom: "Marché du Village", sous: "+15 satisfaction", col: 3 },
    ],
    liens: [
      ["a1", "b1"], ["a1", "b2"], ["a1", "b3"], ["a2", "b4"], ["a3", "b5"], ["a4", "c4"],
      ["b1", "c1"], ["b2", "c2"], ["b3", "b4"], ["b4", "c3"], ["b5", "c4"],
      ["c1", "d1"], ["c2", "d1"], ["c2", "d2"], ["c3", "d2"], ["c4", "d3"],
    ],
  },
  3: {
    entetes: ["Prendre à la case", "Transformer", "Produire", "Ce que ça débloque"],
    noeuds: [
      { id: "a1", nom: "Mine de Silicium & Nickel", col: 0 },
      { id: "a2", nom: "Champ de Canne", sous: "case chaude", col: 0 },
      { id: "a3", nom: "Céréales & Bétail", col: 0 },
      { id: "a4", nom: "Pêche", col: 0 },
      { id: "b1", nom: "Fonderie Avancée", sous: "composants primaires", col: 1 },
      { id: "b2", nom: "Usine Chimique", sous: "comburant O2", col: 1, cle: true },
      { id: "b3", nom: "Sucre → Distillerie", sous: "rhum raffiné", col: 1 },
      { id: "b4", nom: "Conserverie", sous: "−15 % de consommation", col: 1 },
      { id: "b5", nom: "Boulangerie & Boucherie", col: 1 },
      { id: "c1", nom: "Composants", col: 2 },
      { id: "c2", nom: "Comburant O2", col: 2, cle: true },
      { id: "c3", nom: "Rhum raffiné", col: 2 },
      { id: "c4", nom: "Conserves", col: 2 },
      { id: "c5", nom: "Pain & viande", col: 2 },
      { id: "d1", nom: "Immeuble & Centre Admin.", col: 3 },
      { id: "d2", nom: "Taverne", sous: "+20 % dans les usines", col: 3 },
      { id: "d3", nom: "Première fusée", sous: "la planète sort d'elle-même", col: 3, cle: true },
    ],
    liens: [
      ["a1", "b1"], ["a1", "b4"], ["a2", "b3"], ["a3", "b5"], ["a4", "b4"],
      ["b1", "c1"], ["b2", "c2"], ["b3", "c3"], ["b4", "c4"], ["b5", "c5"],
      ["c1", "d1"], ["c3", "d2"], ["c4", "d1"], ["c5", "d1"], ["c2", "d3"],
    ],
  },
  4: {
    entetes: ["Prendre à la case", "Transformer", "Produire", "Ce que ça débloque"],
    noeuds: [
      { id: "a1", nom: "Mine de Charbon", sous: "charbon minéral", col: 0, cle: true },
      { id: "a2", nom: "Puits de Pétrole", col: 0 },
      { id: "a3", nom: "Mine de Fer", col: 0 },
      { id: "a4", nom: "Mine d'Or", col: 0 },
      { id: "b1", nom: "Haut-Fourneau", sous: "acier", col: 1, cle: true },
      { id: "b2", nom: "Raffinerie Pétrochimique", sous: "plastique · carburant", col: 1 },
      { id: "b3", nom: "Centrale à Vapeur", sous: "énergie", col: 1, cle: true },
      { id: "b4", nom: "Atelier de Machines-Outils", sous: "machines", col: 1 },
      { id: "c1", nom: "Acier & poutrelles", col: 2 },
      { id: "c2", nom: "Carburant & plastique", col: 2 },
      { id: "c3", nom: "Vapeur", sous: "sans elle, rien ne tourne", col: 2, cle: true },
      { id: "c4", nom: "Machines", col: 2 },
      { id: "d1", nom: "Cité Ouvrière", sous: "loge 60", col: 3 },
      { id: "d2", nom: "Gare & Réseau Ferré", sous: "+50 % de débit", col: 3 },
      { id: "d3", nom: "Ferme Mécanisée", sous: "16 blé, 6 ouvriers", col: 3 },
      { id: "d4", nom: "Grande Cathédrale", sous: "14 Foi", col: 3, couleur: ARC },
    ],
    liens: [
      ["a1", "b1"], ["a1", "b3"], ["a3", "b1"], ["a2", "b2"], ["a4", "d4"],
      ["b1", "c1"], ["b2", "c2"], ["b3", "c3"], ["b4", "c4"], ["c1", "b4"],
      ["c1", "d1"], ["c3", "d1"], ["c1", "d2"], ["c4", "d3"], ["c2", "d3"],
    ],
  },
  5: {
    entetes: ["Prendre à la case", "Raffiner", "Assembler", "Expédier vers le front"],
    noeuds: [
      { id: "a1", nom: "Pierre & charbon", col: 0 },
      { id: "a2", nom: "Minerai rare", sous: "titane", col: 0 },
      { id: "a3", nom: "Silicium & Or", col: 0 },
      { id: "a4", nom: "Pétrole", col: 0 },
      { id: "a5", nom: "Site de Fouilles", sous: "reliques · case de ruines", col: 0, couleur: ARC },
      { id: "b1", nom: "Cimenterie", sous: "béton", col: 1 },
      { id: "b2", nom: "Raffinerie de Titane", sous: "titane", col: 1 },
      { id: "b3", nom: "Usine d'Électronique", sous: "électronique", col: 1 },
      { id: "b4", nom: "Centrale Électrique", sous: "électricité", col: 1 },
      { id: "c1", nom: "Usine d'Hydrazine", sous: "le carburant des Portes", col: 2, cle: true },
      { id: "c2", nom: "Complexe Résidentiel", sous: "loge 150", col: 2 },
      { id: "c3", nom: "Institut de Recherche", sous: "les 3 axes", col: 2 },
      { id: "d1", nom: "Astroport V2", sous: "Science", col: 3, couleur: SCI },
      { id: "d2", nom: "Cocon de Muta-Culture", sous: "Génétique", col: 3, couleur: GEN },
      { id: "d3", nom: "Observatoire Runique", sous: "Archéomages", col: 3, couleur: ARC },
    ],
    liens: [
      ["a1", "b1"], ["a2", "b2"], ["a3", "b3"], ["a4", "b4"], ["a5", "d3"],
      ["b1", "c2"], ["b2", "c1"], ["b4", "c1"], ["b3", "c3"], ["b3", "c1"],
      ["c1", "d1"], ["c3", "d1"], ["c3", "d2"], ["c3", "d3"], ["c2", "d2"],
    ],
  },
  6: {
    entetes: ["Prendre à la case", "Raffiner", "Automatiser", "Ce que ça débloque"],
    noeuds: [
      { id: "a1", nom: "Extracteur Orbital", sous: "minerais rares", col: 0 },
      { id: "a2", nom: "Titane & Nickel", col: 0 },
      { id: "a3", nom: "Silicium & Or", col: 0 },
      { id: "b1", nom: "Fonderie d'Alliages Rares", sous: "alliage nickel-titane", col: 1, cle: true },
      { id: "b2", nom: "Usine Quantique", sous: "composants quantiques", col: 1, cle: true },
      { id: "b3", nom: "Réacteur à Fusion", sous: "énergie ×2", col: 1 },
      { id: "c1", nom: "Chaîne Automatisée", sous: "−60 % de travaillants", col: 2, cle: true },
      { id: "c2", nom: "Ferme Hydroponique", sous: "hors biome", col: 2 },
      { id: "c3", nom: "Laboratoire de Pointe", col: 2 },
      { id: "d1", nom: "Arcologie", sous: "loge 600", col: 3 },
      { id: "d2", nom: "Chantier Naval Orbital", col: 3 },
      { id: "d3", nom: "Recherche de palier 6", col: 3 },
    ],
    liens: [
      ["a1", "b1"], ["a2", "b1"], ["a3", "b2"], ["b3", "b2"],
      ["b3", "c1"], ["b3", "c2"], ["b2", "c3"], ["b1", "c1"],
      ["b1", "d1"], ["c1", "d2"], ["c2", "d1"], ["c3", "d3"],
    ],
  },
  7: {
    entetes: ["Prendre à la case", "Synthétiser", "Bâtir", "Alimenter la guerre"],
    noeuds: [
      { id: "a1", nom: "Collecteur de Noyaux", sous: "case de filament cosmique", col: 0, cle: true },
      { id: "a2", nom: "Fruits mutés & tabac GM", col: 0, couleur: GEN },
      { id: "a3", nom: "Alliage & composants", col: 0 },
      { id: "b1", nom: "Synthétiseur", sous: "matière exotique", col: 1, cle: true },
      { id: "b2", nom: "Distillerie Quantique", sous: "Nectar d'Ambroisie", col: 1 },
      { id: "b3", nom: "Labo de Néo-Tabac", sous: "essence synaptique", col: 1, couleur: ARC },
      { id: "c1", nom: "Cité-Dôme & Orbital", sous: "loge 2 000", col: 2 },
      { id: "c2", nom: "Grand Astroport", col: 2 },
      { id: "c3", nom: "Sanctuaire des Filaments", sous: "−30 % coût des Portes", col: 2, couleur: ARC },
      { id: "d1", nom: "Injecteur de Porte", sous: "unités lourdes sur le Plateau", col: 3, cle: true },
      { id: "d2", nom: "Héros régénéré", sous: "sur le champ de bataille", col: 3 },
      { id: "d3", nom: "Sorts renforcés", sous: "lancés depuis la planète", col: 3, couleur: ARC },
    ],
    liens: [
      ["a1", "b1"], ["a3", "b1"], ["a2", "b2"], ["a2", "b3"], ["a1", "c3"],
      ["b1", "c1"], ["b1", "c2"], ["a3", "c2"],
      ["c2", "d1"], ["c3", "d1"], ["b2", "d1"], ["b2", "d2"], ["b3", "d3"],
    ],
  },
};

/* ------------------------------------------------------------------ */
/* Les lignées : ce qui naît, ce qui dure, ce qui meurt                */
/* ------------------------------------------------------------------ */

/** 0 = pas encore · 1 = vivante · 2 = éteinte à cet âge */
const LIGNEES: { nom: string; vie: number[] }[] = [
  { nom: "Habitat", vie: [1, 1, 1, 1, 1, 1, 1] },
  { nom: "Gouvernance", vie: [1, 1, 1, 1, 1, 1, 1] },
  { nom: "Bâtir", vie: [1, 1, 1, 1, 1, 1, 1] },
  { nom: "Outiller", vie: [0, 1, 1, 1, 1, 1, 1] },
  { nom: "Énergie", vie: [0, 1, 1, 1, 1, 1, 1] },
  { nom: "Nourrir — la terre", vie: [1, 1, 1, 1, 1, 1, 1] },
  { nom: "Nourrir — la mer", vie: [1, 1, 1, 1, 2, 0, 0] },
  { nom: "Enivrer", vie: [1, 1, 1, 1, 1, 0, 1] },
  { nom: "Croire", vie: [1, 1, 1, 1, 1, 1, 1] },
  { nom: "Savoir & santé", vie: [0, 0, 1, 1, 1, 1, 1] },
  { nom: "Stocker & acheminer", vie: [1, 1, 1, 1, 1, 1, 1] },
];

function Lignees() {
  const x = (age: number) => 214 + age * 90;
  const y = (rang: number) => 68 + rang * 33;

  return (
    <svg
      viewBox="0 0 820 470"
      className="h-auto w-full"
      role="img"
      aria-label="Onze lignées de bâtiments suivies sur sept âges : deux naissent à l'âge 2, une à l'âge 3, la filière de la mer s'éteint à l'âge 5, la filière de l'alcool saute l'âge 6."
    >
      {[0, 1, 2, 3, 4, 5, 6].map((age) => (
        <text key={age} x={x(age)} y={44} textAnchor="middle" fontSize={10} fontWeight={600} fill="currentColor" opacity={0.55}>
          {`Âge ${age + 1}`}
        </text>
      ))}
      <line x1={0} y1={54} x2={820} y2={54} stroke="currentColor" strokeOpacity={0.2} />
      <line x1={x(4) - 45} y1={54} x2={x(4) - 45} y2={y(LIGNEES.length - 1) + 16} stroke={SCI} strokeOpacity={0.35} strokeDasharray="4 4" />

      {LIGNEES.map((l, r) => {
        const premier = l.vie.findIndex((v) => v > 0);
        return (
          <g key={l.nom}>
            <text x={200} y={y(r) + 4} textAnchor="end" fontSize={10} fill="currentColor" opacity={0.8}>
              {l.nom}
            </text>
            {/* Segment par segment : un âge sauté laisse un vrai trou dans le trait. */}
            {l.vie.slice(0, -1).map((v, age) =>
              v > 0 && l.vie[age + 1] > 0 ? (
                <line
                  key={age}
                  x1={x(age)}
                  y1={y(r)}
                  x2={x(age + 1)}
                  y2={y(r)}
                  stroke={l.vie[age + 1] === 2 ? "#f87171" : SCI}
                  strokeOpacity={l.vie[age + 1] === 2 ? 0.4 : 0.3}
                  strokeWidth={2}
                />
              ) : null,
            )}
            {l.vie.map((v, age) => {
              if (v === 2)
                return (
                  <g key={age}>
                    <line x1={x(age) - 6} y1={y(r) - 6} x2={x(age) + 6} y2={y(r) + 6} stroke="#f87171" strokeWidth={2} />
                    <line x1={x(age) + 6} y1={y(r) - 6} x2={x(age) - 6} y2={y(r) + 6} stroke="#f87171" strokeWidth={2} />
                  </g>
                );
              if (v === 0)
                return <circle key={age} cx={x(age)} cy={y(r)} r={3.5} fill="none" stroke="currentColor" strokeOpacity={0.25} />;
              const naissance = age === premier;
              return (
                <circle
                  key={age}
                  cx={x(age)}
                  cy={y(r)}
                  r={naissance ? 7 : 5}
                  fill={naissance ? "none" : SCI}
                  fillOpacity={naissance ? 0 : 0.85}
                  stroke={SCI}
                  strokeWidth={naissance ? 2 : 0}
                />
              );
            })}
          </g>
        );
      })}

      <text x={214} y={438} fontSize={9} fill="currentColor" opacity={0.5}>
        ● lignée vivante ⬡ premier bâtiment de la lignée ○ pas encore ✕ filière éteinte
      </text>
      <text x={214} y={454} fontSize={9} fill={SCI} opacity={0.75}>
        Le pointillé marque le seuil de l'orbite : c'est là que la mer meurt et que l'alcool change de client.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Les verrous entre âges                                             */
/* ------------------------------------------------------------------ */

const VERROUS = [
  { materiau: "brique · outil en fer", batiment: "Hôtel de Ville", blocage: "Sans argile sur le secteur, pas de brique : il faut s'étendre avant de monter." },
  { materiau: "verre · papier", batiment: "Centre Administratif", blocage: "Le papier vient du bois : la Papeterie entre en concurrence avec la Scierie." },
  { materiau: "acier · machines", batiment: "Mairie Industrielle", blocage: "L'acier exige du charbon minéral — un gisement, pas du charbon de bois." },
  { materiau: "béton · électronique", batiment: "Conseil Colonial", blocage: "L'électronique exige or ET silicium : le premier âge à demander deux mines." },
  { materiau: "alliage Ni-Ti · composants quantiques", batiment: "Sénat Métropolitain", blocage: "Le titane vient d'un minerai rare, souvent absent : il faut déjà l'Astroport." },
  { materiau: "matière exotique · noyaux d'énergie", batiment: "Conseil Transhumain", blocage: "Les noyaux ne se récoltent que sur une case de filament — donc sur le Plateau." },
];

function VerrousAges() {
  const yAge = (i: number) => 30 + i * 82;

  return (
    <svg
      viewBox="0 0 880 600"
      className="h-auto w-full"
      role="img"
      aria-label="Chaque passage d'âge demande un matériau clé et un bâtiment de gouvernance. Le dernier, de l'âge 6 à l'âge 7, exige des noyaux d'énergie qui ne se récoltent que sur le champ de bataille."
    >
      <Fleches p="vrr" />
      <line x1={85} y1={yAge(0) + 34} x2={85} y2={yAge(6)} stroke="currentColor" strokeOpacity={0.25} markerEnd="url(#vrr)" />

      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const dernier = i === 6;
        return (
          <g key={i}>
            <rect
              x={20}
              y={yAge(i)}
              width={130}
              height={34}
              rx={6}
              fill={dernier ? GEN : "currentColor"}
              fillOpacity={dernier ? 0.15 : 0.07}
              stroke={dernier ? GEN : "currentColor"}
              strokeOpacity={dernier ? 0.7 : 0.3}
            />
            <text x={85} y={yAge(i) + 22} textAnchor="middle" fontSize={12} fontWeight={600} fill={dernier ? GEN : "currentColor"} opacity={dernier ? 1 : 0.85}>
              {`Âge ${i + 1}`}
            </text>
          </g>
        );
      })}

      {VERROUS.map((v, i) => {
        const y = yAge(i) + 58;
        const dernier = i === 5;
        const couleur = dernier ? GEN : SCI;
        return (
          <g key={v.batiment}>
            <line x1={85} y1={y} x2={180} y2={y} stroke={couleur} strokeOpacity={0.35} />
            <rect x={180} y={y - 26} width={680} height={56} rx={6} fill={couleur} fillOpacity={dernier ? 0.1 : 0.05} stroke={couleur} strokeOpacity={dernier ? 0.6 : 0.3} />
            <text x={198} y={y - 8} fontSize={11} fontWeight={600} fill={couleur}>
              {v.materiau}
            </text>
            <text x={198} y={y + 8} fontSize={10} fill="currentColor" opacity={0.75}>
              {`et le bâtiment qui ouvre l'âge : ${v.batiment}`}
            </text>
            <text x={198} y={y + 23} fontSize={9} fill="currentColor" opacity={0.45}>
              {v.blocage}
            </text>
          </g>
        );
      })}

      <text x={20} y={588} fontSize={10} fill={GEN} opacity={0.85}>
        Le dernier verrou ne se franchit pas sur la planète : il faut avoir conquis pour atteindre l'âge 7.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Le registre                                                         */
/* ------------------------------------------------------------------ */

interface Fiche {
  dessin: ReactNode;
  legende: string;
}

export const SCHEMAS: Record<string, Fiche> = {
  triangulation: {
    dessin: <Triangulation />,
    legende:
      "La boucle de supériorité. Chaque axe est taillé contre la défense d'un seul autre — c'est le profil d'armure, pas la puissance brute, qui décide de qui bat qui.",
  },
  "boucle-jeu": {
    dessin: <BoucleJeu />,
    legende:
      "Les deux moitiés du jeu et le seul point de passage entre elles. Tout ce qui arrive sur le front a été produit sur une planète et a coûté du carburant à téléporter.",
  },
  "familles-unites": {
    dessin: <Familles />,
    legende:
      "Le catalogue de 35 unités, lu comme trois cercles qui se recoupent : cinq unités par zone pure, par croisement de deux axes, et au centre pour la Trinité.",
  },
  "matrice-combat": {
    dessin: <MatriceCombat />,
    legende:
      "Les 18 unités du combat pur. Le cadre coloré marque l'axe qui domine le palier ; la colonne de droite montre la rotation Science → Génétique → Archéomages qui recommence tous les trois paliers.",
  },
  "paliers-evolution": {
    dessin: <PaliersEvolution />,
    legende:
      "Les sept paliers d'une planète. Le seuil du palier 5 est celui qui change la nature du jeu : avant, la colonie se nourrit ; après, elle arme le front.",
  },
  "arbre-batiments": {
    dessin: <ArbreBatiments />,
    legende:
      "De la gouvernance aux unités. Chaque branche d'axe part d'un bâtiment commun et n'ouvre ses unités que deux paliers à la fois.",
  },
  "flux-age-1": {
    dessin: <FluxAge donnees={FLUX[1]} titre="Chaîne de production de l'Âge 1 — des Pionniers." />,
    legende:
      "Tout part de la case et finit sur l'entrepôt : sans lui à portée, aucun producteur ne tourne. L'unique bien qui rapporte à la colonie est la bière — et c'est elle qui paie l'Autel, donc la voie Archéomage. Chaque flèche se lit « alimente » ; la ressource qui circule est écrite sous le bâtiment qui la produit.",
  },
  "flux-age-2": {
    dessin: <FluxAge donnees={FLUX[2]} titre="Chaîne de production de l'Âge 2 — le Secteur Artisanal." />,
    legende:
      "Deux bâtiments commandent tout l'âge : le Four à Briques et la Forge. La brique conditionne chaque construction, l'outil en fer chaque évolution. Chaque flèche se lit « alimente » ; la ressource qui circule est écrite sous le bâtiment qui la produit.",
  },
  "flux-age-3": {
    dessin: <FluxAge donnees={FLUX[3]} titre="Chaîne de production de l'Âge 3 — la Société Urbaine." />,
    legende:
      "Le premier âge où le confort rapporte plus qu'il ne coûte — et le premier où la planète produit quelque chose qui ne sert pas à elle-même : le comburant. Chaque flèche se lit « alimente » ; la ressource qui circule est écrite sous le bâtiment qui la produit.",
  },
  "flux-age-4": {
    dessin: <FluxAge donnees={FLUX[4]} titre="Chaîne de production de l'Âge 4 — l'Ère Industrielle." />,
    legende:
      "L'énergie devient un intrant comme un autre. À partir d'ici, une colonie peut être riche en matière et bloquée quand même. Chaque flèche se lit « alimente » ; la ressource qui circule est écrite sous le bâtiment qui la produit.",
  },
  "flux-age-5": {
    dessin: <FluxAge donnees={FLUX[5]} titre="Chaîne de production de l'Âge 5 — l'Ère Spatiale Primordiale." />,
    legende:
      "Le seuil de l'orbite. Les trois bâtiments de droite ne rendent rien à la planète : ils n'existent que pour le front. Chaque flèche se lit « alimente » ; la ressource qui circule est écrite sous le bâtiment qui la produit.",
  },
  "flux-age-6": {
    dessin: <FluxAge donnees={FLUX[6]} titre="Chaîne de production de l'Âge 6 — la Métropole Spatiale." />,
    legende:
      "L'automatisation casse le lien entre produire et loger. Une planète peut devenir une usine presque vide — et perdre la population qui générait sa Focale. Chaque flèche se lit « alimente » ; la ressource qui circule est écrite sous le bâtiment qui la produit.",
  },
  "flux-age-7": {
    dessin: <FluxAge donnees={FLUX[7]} titre="Chaîne de production de l'Âge 7 — la Cité Spatiale Transhumaine." />,
    legende:
      "Tout converge vers une seule sortie. Les trois productions les plus chères de l'âge n'améliorent presque rien sur place : elles agissent sur le champ de bataille. Chaque flèche se lit « alimente » ; la ressource qui circule est écrite sous le bâtiment qui la produit.",
  },
  lignees: {
    dessin: <Lignees />,
    legende:
      "Onze fonctions suivies sur sept âges. Ce que le tableau ne montre pas d'un coup d'œil : deux lignées naissent seulement à l'âge 2, une à l'âge 3, la filière de la mer meurt à l'âge 5, et celle de l'alcool saute l'âge 6 — elle ne disparaît pas, elle change de client.",
  },
  "verrous-ages": {
    dessin: <VerrousAges />,
    legende:
      "Un âge s'ouvre sur un matériau et un bâtiment, pas sur un compteur. Le dernier verrou est le seul qui ne se franchit pas sur la planète : les noyaux d'énergie ne se récoltent que sur le Plateau.",
  },
  biomes: {
    dessin: <Biomes />,
    legende:
      "Ce qu'un biome change, et ce qu'il ne change pas. La même boucle dans les trois cas — seule l'épaisseur d'une flèche bouge.",
  },
};

/** Un schéma dans le fil du document, avec le dessin ASCII d'origine sous le pli. */
export function Schema({ cle, origine }: { cle: string; origine?: string }) {
  const fiche = SCHEMAS[cle];
  if (!fiche) return null;

  return (
    <figure className="my-6 rounded-lg border border-edge bg-ink/60 p-4 text-slate-300">
      {fiche.dessin}
      <figcaption className="mt-3 border-t border-edge pt-2 text-xs leading-relaxed text-slate-500">
        {fiche.legende}
      </figcaption>
      {origine && (
        <details className="mt-2">
          <summary className="cursor-pointer select-none text-[11px] text-slate-600 transition-colors hover:text-slate-400">
            Voir le schéma d'origine, en texte
          </summary>
          <pre className="mt-2 overflow-x-auto rounded border border-edge bg-ink p-3 font-mono text-[11px] leading-[1.45] text-slate-400">
            {origine}
          </pre>
        </details>
      )}
    </figure>
  );
}

import Aide, { Terme } from "@/components/Aide";
import { codeInconnu, libelleRessource, parAlphabet, type Ressource } from "@/lib/ressources";
import {
  PERIODE_PAR_DEFAUT,
  TRANCHES_PAR_DEFAUT,
  casesCouvertes,
  chantierPasEncoreApplique,
  fluxVide,
  formatDuree,
  palierVide,
  pourcentageProximite,
  productionVide,
  proximiteParDefaut,
  proximitePosee,
  proximiteUtile,
  proximiteVide,
  rendEnVeille,
  rendementPourIndicateur,
  seuilsEnDouble,
  totalParts,
  tranchesCouvrentZero,
  tranchesTriees,
  type LigneCout,
  type LigneFlux,
  type LigneProduction,
  type ModeCout,
  type Palier,
  type Proximite,
  type Tranche,
  type Tuile,
} from "@/lib/tuiles";

/**
 * Ce qu'une tuile coute, palier par palier — **reconstruit de zero le
 * 2026-08-26**, sur les decisions de l'utilisateur prises ce jour-la :
 *
 *  1. les paliers tout de suite, mais **tout dans un seul onglet** ;
 *  2. **deux modes** seulement : paye / mobilise. `requis` est supprime ;
 *  3. **la veille rend TOUT ce qui est mobilise** — regle unique, aucun reglage
 *     par ligne, et « si pas de pop, pas de prod » ;
 *  4. **c'est le joueur qui met en veille**, jamais la penurie.
 *
 * ⚠️ **Le mode n'est PAS un menu deroulant, c'est la SECTION qui le porte.**
 * Remarque de l'utilisateur : *« pendant qu'il tourne, ne consomme pas mais
 * occupe X de pop »*. Un ouvrier n'est pas depense a la construction, il est
 * occupe tant que ca tourne. L'ecran le dit au lieu de le faire deduire :
 *
 *   A LA CONSTRUCTION      -> les lignes `paye`
 *   PENDANT QU'IL TOURNE   -> les lignes `mobilise`, puis les consommations
 *
 * En base, une seule liste `cout` porte les deux, distinguees par leur `mode`.
 */
export default function TuileCouts({
  paliers,
  ressources,
  tuiles,
  onChange,
}: {
  paliers: Palier[];
  ressources: Ressource[];
  /** Le catalogue, pour la regle de proximite d'une consommation (28/08). */
  tuiles: Tuile[];
  onChange: (paliers: Palier[]) => void;
}) {
  const majPalier = (index: number, patch: Partial<Palier>) =>
    onChange(paliers.map((p, i) => (i === index ? { ...p, ...patch } : p)));

  const ajouterPalier = () => onChange([...paliers, palierVide(paliers.length + 1)]);

  // Renumerotation immediate : la position et le champ `niveau` ne doivent
  // jamais diverger a l'ecran, sinon on croit avoir retire le mauvais.
  const retirerPalier = (index: number) =>
    onChange(paliers.filter((_, i) => i !== index).map((p, i) => ({ ...p, niveau: i + 1 })));

  const nomRessource = (code: string) => libelleRessource(ressources, code);
  const nomTuile = (tileId: number) =>
    tuiles.find((t) => t.tileId === tileId)?.nom ?? `tuile ${tileId}`;
  /**
   * Ce qu'une tuile peut fabriquer : tout sauf le genre `mobilise`, indicateurs
   * compris.
   *
   * ⚠️ Une ressource `mobilise` (la population) ne se PRODUIT pas : elle se
   * déclare en places dans l'onglet *Stock & appro*, et le jeu lit ce plafond.
   * L'offrir ici donnerait une ligne qui remplit un coffre que personne ne lit —
   * les habitants disparaîtraient sans un mot.
   */
  const productibles = parAlphabet(ressources.filter((r) => r.genre !== "mobilise"));
  const indicateurs = parAlphabet(ressources.filter((r) => r.genre === "indicateur"));

  /**
   * Ce qu'on peut **payer** ou **consommer** : uniquement ce qui vit dans un
   * coffre. Deux genres n'y sont pas, et les proposer était le dernier piège
   * ouvert de l'écran (26/08) :
   *
   * - `mobilise` — rien n'en est jamais stocké : la population se compte sur
   *   les **places déclarées** (`Tresorerie.Places`), pas sur un contenu.
   *   *Payer* 6 habitants passe la vérification (`Disponible` compte les logés)
   *   puis échoue au débit, et le joueur lit « ressources insuffisantes » avec
   *   des habitants libres affichés juste au-dessus. *Consommer* des habitants
   *   ne trouve rien, fait tomber la couverture à zéro, et fige la tuile sans
   *   un mot.
   * - `indicateur` — calculé, jamais rangé nulle part (l'onglet *Stock & appro*
   *   le refuse déjà au stockage). Une production le **lit** par son champ
   *   `indicateur` ; elle ne le consomme pas.
   *
   * ⚠️ Le mode `mobilise`, lui, garde la liste ENTIÈRE : immobiliser du bois
   * tant que le bâtiment tourne est un cas légitime, et c'est là que la
   * population a sa place.
   */
  const depensables = parAlphabet(
    ressources.filter((r) => r.genre !== "mobilise" && r.genre !== "indicateur"),
  );

  /**
   * Les lignes déjà en base qui citent une ressource **existante mais qui n'a
   * pas sa place ici** — rendues par leur nom affichable.
   *
   * On ne les efface pas : on les **dit**, comme le chantier pas encore branché
   * et la portée `empire`. Un champ qui ment ne dit rien, un champ hors sujet
   * l'annonce ; retirer la saisie à la place de l'utilisateur lui reperdrait
   * l'information sans qu'il sache pourquoi.
   *
   * ⚠️ Un code **absent du catalogue** n'est PAS de ce cas-là : c'est une
   * ressource supprimée ou mal tapée, et le menu le dit déjà en orange par son
   * option « — inconnue ». Les confondre donnerait une explication fausse.
   */
  const horsSujet = (codes: string[]) =>
    codes
      .filter(
        (c) =>
          c !== "" &&
          !depensables.some((r) => r.code === c) &&
          ressources.some((r) => r.code === c),
      )
      .map(nomRessource);

  /** Remplace les lignes d'UN mode, en gardant celles de l'autre. */
  const majCout = (index: number, mode: ModeCout, lignes: LigneCout[]) => {
    const autres = paliers[index].cout.filter((l) => l.mode !== mode);
    majPalier(index, {
      cout: mode === "paye" ? [...lignes, ...autres] : [...autres, ...lignes],
    });
  };

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="label mb-0">Coûts, palier par palier</p>
        <button type="button" className="text-xs text-accent hover:underline" onClick={ajouterPalier}>
          + ajouter un palier
        </button>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Le palier 1 est la construction ; les suivants sont les améliorations.
      </p>

      <Aide titre="Payé, occupé, consommé, produit">
        <Terme nom="à la construction">
          Prélevé du stock et <strong>perdu</strong>. 50 bois payés ne reviennent jamais — ni à la
          destruction, ni en veille.
        </Terme>
        <Terme nom="occupe pendant qu'il tourne">
          Retenu <strong>tant que le bâtiment tourne</strong>, puis rendu. C'est le mode de la
          population : 6 habitants travaillent ici et ne travaillent nulle part ailleurs. Ils ne
          sont pas <em>dépensés</em> — ils reviennent à la destruction <em>ou en veille</em>.
        </Terme>
        <Terme nom="consomme pendant qu'il tourne">
          Ce qui part vraiment, en quantité par période. Jamais un taux à virgule : le calcul hors
          ligne multiplie des entiers, sans dérive d'arrondi sur douze heures.
          <br />
          ⚠️ <strong>Garde la même période partout</strong> ({PERIODE_PAR_DEFAUT} s par défaut) :
          le ralenti en cas de pénurie est exact à une unité près avec une période commune, à trois
          ou quatre quand elles sont mélangées.
        </Terme>
        <Terme nom="d'où ça vient, où ça va">
          Pas ici. Cet onglet dit ce que le bâtiment consomme et ce qu'il fabrique ;{" "}
          <strong>par où ça arrive et par où ça repart</strong> se règle dans l'onglet{" "}
          <em>Stock &amp; appro</em>, qui porte le stockage, les rayons et les navettes.
        </Terme>
        <Terme nom="+ indice">
          En bout de ligne, un lien <strong>+ indice</strong> ajoute une part de satisfaction à
          cette consommation. La plupart des consommations n'en ont pas — un champ toujours là,
          à zéro sur quatre lignes sur cinq, ferait croire qu'il faut le remplir.
          <br />
          C'est réservé aux habitations : sans indice, c'est une consommation ordinaire. La
          première ligne se pose à 100 %, les suivantes à 10 %.
          <br />
          Chaque ligne compte <strong>au prorata de ce qui est réellement servi</strong> :
          20 nourriture demandées pour 100 % de satisfaction, mais seulement 15 reçues faute de
          stock, donnent <strong>75 %</strong>. Ajoute 10 pierre à 10 %, servies à plein, et on
          monte à <strong>85 %</strong>.
          <br />
          Le total des parts devrait faire 100 : en dessous, l'habitation ne pourra jamais être
          pleinement satisfaite. Un avertissement te le dit sous les lignes.
          <br />
          ⚠️ La tuile déclare qu'elle <em>produit</em> la satisfaction dans l'onglet{" "}
          <strong>Stock &amp; appro</strong> ; ici on dit seulement <em>d'où elle vient</em>.
        </Terme>
        <Terme nom="+ proximité">
          Même geste que <strong>+ indice</strong>, en bout d'une consommation : elle reste cachée
          tant qu'on ne la demande pas. Elle dit combien de bâtiments d'un type il faut{" "}
          <strong>autour de la tuile</strong> pour que la ligne tourne à plein — c'est ce qui
          attache un abattoir à ses pâturages.
          <br />
          <em>10 bovins toutes les 120 s, besoin de 5 « Pâturage » à 2 de rayon = 100 %.</em>
          <br />
          <strong>Au prorata</strong>, jamais tout ou rien : 3 pâturages sur 5 valent 60 %. La
          ligne ne demande alors plus que 6 bovins, et la tuile plafonne à 60 % de sa production —
          sans cette seconde moitié, une ligne servie à plein de sa demande réduite produirait
          100 % avec 3 pâturages, et la règle ne servirait à rien.
          <br />
          Le rayon se compte sur la grille <strong>hexagonale</strong> : 6 cases à 1, 18 à 2, 36 à
          3. La phrase sous la règle te donne le compte exact.
          <br />
          ⚠️ <strong>Pas encore appliqué en jeu</strong> : le moteur ne regarde pas le voisinage.
          Un avertissement orange le rappelle sous chaque règle posée.
        </Terme>
        <Terme nom="produit">
          Ce que la tuile <strong>fabrique</strong> pendant qu'elle tourne, <strong>au
          maximum</strong>. Une ligne par ressource — n'importe laquelle, indicateurs compris.
          <br />
          La production suit <strong>au prorata</strong> ce que la tuile a réellement reçu :
          50 bovins demandés pour 100 nourriture, mais seulement 25 reçus, donnent{" "}
          <strong>50 nourriture</strong>. Puis l'indice de rendement, s'il y en a un, s'applique
          par-dessus.
          <br />
          La couverture se calcule <strong>tuile par tuile, sur ses propres lignes de
          consommation</strong> — et sur elles seules. Une ressource que ce bâtiment ne demande
          pas n'a aucune influence sur lui.
          <br />
          ⚠️ Seule nuance, et elle est étroite : consommations et productions sont deux listes
          séparées, donc <strong>à l'intérieur d'une même tuile</strong>, une entrée manquante
          ralentit toutes ses sorties. Une tuile qui demande bovins <em>et</em> bois, et qui manque
          de bois, ralentit aussi la production qui ne tenait qu'aux bovins. Le jour où ça gêne, il
          faudra des recettes liées — une ligne portant ses propres entrées et sorties.
          <br />
          ⚠️ <strong>Ni cible ni rayon</strong> : un producteur ne livre pas. Il fabrique dans son
          coffre, et c'est le preneur qui vient, avec <em>son</em> rayon de récolte. Seul un
          entrepôt envoie vraiment, et ça se règle dans l'onglet Stock &amp; appro.
        </Terme>
        <Terme nom="+ indice (production)">
          Même geste que sur une consommation : la plupart des lignes de production n'en ont pas,
          donc le champ reste caché jusqu'à ce qu'on clique <strong>+ indice</strong>.
          <br />
Tu poses un pourcentage <strong>et l'indice dont il dépend</strong>. 60 % de rendement
          selon la Satisfaction, c'est 60 % du débit quand la satisfaction est au maximum, et{" "}
          <strong>au prorata</strong> en dessous : à 60 % de satisfaction, il reste 36 % du débit.
          <br />
          Choisis <em>« rien (plafond fixe) »</em> comme indice si tu veux juste brider la ligne à
          un pourcentage qui ne bouge pas.
          <br />
          ⚠️ <strong>Laisse-le vide sur les fermes.</strong> C'est le garde-fou contre la spirale :
          sans au moins une production non plafonnée quelque part, moins de vivres → moins de
          satisfaction → les fermes produisent moins → encore moins de vivres, et le joueur
          découvre l'effondrement en revenant.
        </Terme>
        <Terme nom="produire un indicateur">
          Choisis la satisfaction comme ressource produite et il n'y a{" "}
          <strong>rien d'autre à saisir</strong> : sa valeur se calcule à partir des indices posés
          sur les consommations juste au-dessus.
        </Terme>
        <Terme nom="chantier">
          Le temps qu'il faut avant que le bâtiment serve. <code>0</code> = instantané.
          <br />
          ⚠️ <strong>Pas encore appliqué en jeu</strong> : tout se construit sur-le-champ, et
          l'état d'une case n'a pas de date de fin de chantier. Un avertissement orange le rappelle
          dès que tu mets autre chose que zéro.
        </Terme>
        <Terme nom="mise en veille">
          Le joueur éteint un bâtiment : il <strong>rend tout ce qu'il occupe</strong> — la
          population d'abord — et cesse de consommer. C'est ainsi qu'on récupère des ouvriers pour
          ailleurs.
          <br />
          Il cesse aussi de produire, mais ce n'est pas une règle de plus :{" "}
          <strong>sans sa main-d'œuvre, un bâtiment ne produit pas</strong>. La production suit les
          ouvriers, pas l'interrupteur.
          <br />
          Rien à régler ici : la règle est la même pour toutes les tuiles, et la phrase sous chaque
          palier te dit ce que ça donnera.
        </Terme>
        <Terme nom="pénurie">
          Elle n'éteint <strong>rien</strong>. Quand une ressource manque, tout ralentit au
          prorata. La veille est une décision du joueur, pas une punition automatique.
        </Terme>
      </Aide>

      <div className="mt-2 space-y-3">
        {paliers.map((palier, index) => {
          const payes = palier.cout.filter((l) => l.mode === "paye");
          const occupes = palier.cout.filter((l) => l.mode === "mobilise");
          const rendus = rendEnVeille(palier);
          return (
            <div key={index} className="rounded border border-edge bg-ink/40 p-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-slate-300">
                  Palier {palier.niveau}
                  {index === 0 && <span className="ml-2 text-slate-500">construction</span>}
                </p>
                {paliers.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-red-400"
                    onClick={() => retirerPalier(index)}
                  >
                    retirer
                  </button>
                )}
              </div>

              {/* ── À la construction ─────────────────────────────────── */}
              <Section titre="À la construction, une fois">
                <LignesCout
                  lignes={payes}
                  mode="paye"
                  ressources={depensables}
                  toutes={ressources}
                  videTexte="gratuit"
                  onChange={(l) => majCout(index, "paye", l)}
                />
                <Avertissement noms={horsSujet(payes.map((l) => l.ressource))} quoi="payée" />

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-slate-500">
                    chantier
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="input h-9 w-24 py-1"
                      value={palier.duree_construction_s}
                      onChange={(e) =>
                        majPalier(index, {
                          duree_construction_s: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                    s
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {palier.duree_construction_s === 0
                      ? "immédiat"
                      : `soit ${formatDuree(palier.duree_construction_s)} avant que le bâtiment serve`}
                  </span>
                </div>
                {chantierPasEncoreApplique(palier) && (
                  <p className="mt-1 text-[11px] leading-tight text-amber-400">
                    ⚠️ Enregistré mais <strong>pas encore appliqué en jeu</strong> : les chantiers
                    n'existent pas, tout se construit instantanément.
                  </p>
                )}
              </Section>

              {/* ── Pendant qu'il tourne ──────────────────────────────── */}
              <Section titre="Pendant qu'il tourne">
                <p className="mb-1 text-[11px] text-slate-500">
                  Occupe, sans le dépenser — rendu en veille :
                </p>
                <LignesCout
                  lignes={occupes}
                  mode="mobilise"
                  ressources={ressources}
                  toutes={ressources}
                  videTexte="n'occupe rien"
                  onChange={(l) => majCout(index, "mobilise", l)}
                />

                <p className="mb-1 mt-3 text-[11px] text-slate-500">Consomme :</p>
                <LignesFlux
                  lignes={palier.utilisation}
                  ressources={depensables}
                  toutes={ressources}
                  tuiles={tuiles}
                  nomTuile={nomTuile}
                  onChange={(utilisation) => majPalier(index, { utilisation })}
                />
                <Avertissement
                  noms={horsSujet(palier.utilisation.map((l) => l.ressource))}
                  quoi="consommée"
                />

                <p className="mb-1 mt-3 text-[11px] text-slate-500">Produit :</p>
                <LignesProduction
                  lignes={palier.production}
                  productibles={productibles}
                  indicateurs={indicateurs}
                  nomRessource={nomRessource}
                  onChange={(production) => majPalier(index, { production })}
                />

                {totalParts(palier) > 0 && (
                  <p
                    className={`mt-1 text-[11px] leading-tight ${
                      totalParts(palier) === 100 ? "text-slate-500" : "text-amber-400"
                    }`}
                  >
                    Cette tuile produit de la satisfaction. Total des parts :{" "}
                    <span className="tabular-nums">{totalParts(palier)} %</span>
                    {totalParts(palier) === 100
                      ? " — entièrement servie, elle atteint 100 %."
                      : totalParts(palier) < 100
                        ? ` — même entièrement servie, elle plafonnera à ${totalParts(palier)} %.`
                        : " — au-delà de 100 %, le surplus est perdu. Rééquilibre les parts."}
                    {" "}
                    <span className="text-slate-500">
                      Chaque ligne compte au prorata : 15 servies sur 20 demandées avec une part de
                      100 % donnent 75 %.
                    </span>
                  </p>
                )}

              </Section>

              {/* La relecture : le seul endroit ou la regle de veille se voit,
                  puisqu'elle ne se saisit pas. */}
              <p className="mt-2 text-[11px] leading-tight text-slate-500">
                {rendus.length === 0 && palier.utilisation.length === 0 ? (
                  "Ce palier n'occupe rien et ne consomme rien : la mise en veille n'y changerait rien."
                ) : (
                  <>
                    En veille :{" "}
                    {rendus.length > 0 ? (
                      <span className="text-slate-300">
                        rend{" "}
                        {rendus.map((l) => `${l.quantite} ${nomRessource(l.ressource)}`).join(", ")}
                      </span>
                    ) : (
                      "ne rend rien"
                    )}
                    {palier.utilisation.length > 0 && ", ne consomme plus rien"}
                    {rendus.length > 0
                      ? ", et ne produit plus — sans sa main-d'œuvre, un bâtiment ne produit pas."
                      : "."}
                  </>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Briques ─────────────────────────────────────────────────────────────────

function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 rounded border border-edge/60 p-2">
      <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">{titre}</p>
      {children}
    </div>
  );
}

function ChoixRessource({
  code,
  ressources,
  toutes,
  onChange,
}: {
  code: string;
  /** Ce qu'on PROPOSE ici. Peut être plus étroit que le catalogue. */
  ressources: Ressource[];
  /**
   * Le catalogue ENTIER, pour nommer une ressource qui existe mais n'a pas sa
   * place dans cette liste-ci. Sans lui, un `habitant` déjà saisi en « payé »
   * s'afficherait « inconnue » — un mot faux, qui enverrait chercher un bug
   * dans le catalogue au lieu de la ligne.
   */
  toutes?: Ressource[];
  onChange: (code: string) => void;
}) {
  // Un code hors liste doit rester VISIBLE et choisi : le faire tomber du menu
  // changerait la ligne en silence au premier reenregistrement.
  const horsListe = code !== "" && codeInconnu(ressources, code);
  const connuAilleurs = horsListe && !!toutes && !codeInconnu(toutes, code);
  return (
    <select
      className={`input h-9 w-44 py-1 ${horsListe ? "border-amber-700 text-amber-300" : ""}`}
      value={code}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">choisir une ressource</option>
      {horsListe && (
        <option value={code}>
          {connuAilleurs
            ? `${libelleRessource(toutes!, code)} — pas ici`
            : `${code} — inconnue`}
        </option>
      )}
      {parAlphabet(ressources).map((r) => (
        <option key={r.id} value={r.code}>
          {r.nom}
        </option>
      ))}
    </select>
  );
}

/**
 * La ligne orange sous une section : « ces lignes ne veulent rien dire ici ».
 *
 * ⚠️ Même traitement que le chantier pas encore appliqué et la portée
 * `empire` — **on ne supprime jamais la saisie de l'utilisateur en silence**,
 * on la lui montre. Retirer la ligne à sa place, c'est reperdre l'information
 * sans qu'il sache pourquoi.
 */
function Avertissement({ noms, quoi }: { noms: string[]; quoi: string }) {
  if (noms.length === 0) return null;
  return (
    <p className="mt-1 text-[11px] leading-tight text-amber-400">
      ⚠️ {noms.map((nom) => `« ${nom} »`).join(", ")} ne peut pas être {quoi} : cette ressource
      n&apos;est <strong>jamais rangée dans un coffre</strong>, donc le jeu ne l&apos;y trouverait
      pas. Retire la ligne — ou passe-la en <strong>occupe pendant qu&apos;il tourne</strong> si ce
      sont des ouvriers.
    </p>
  );
}

function BoutonLigne({ onClick, libelle }: { onClick: () => void; libelle: string }) {
  return (
    <button type="button" className="text-xs text-accent hover:underline" onClick={onClick}>
      {libelle}
    </button>
  );
}

function LignesCout({
  lignes,
  mode,
  ressources,
  toutes,
  videTexte,
  onChange,
}: {
  lignes: LigneCout[];
  mode: ModeCout;
  /** Ce qu'on propose ici — plus étroit que le catalogue pour le mode `paye`. */
  ressources: Ressource[];
  /** Le catalogue entier, pour nommer une ligne déjà saisie qui n'a plus sa place. */
  toutes?: Ressource[];
  videTexte: string;
  onChange: (lignes: LigneCout[]) => void;
}) {
  const maj = (i: number, patch: Partial<LigneCout>) =>
    onChange(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <div>
      {lignes.length === 0 ? (
        <p className="text-xs text-slate-600">{videTexte}</p>
      ) : (
        <div className="space-y-1">
          {lignes.map((ligne, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                className="input h-9 w-20 py-1"
                value={ligne.quantite}
                onChange={(e) => maj(i, { quantite: Math.max(0, Number(e.target.value) || 0) })}
              />
              <ChoixRessource
                code={ligne.ressource}
                ressources={ressources}
                toutes={toutes}
                onChange={(ressource) => maj(i, { ressource })}
              />
              <button
                type="button"
                className="ml-auto text-xs text-slate-500 hover:text-red-400"
                onClick={() => onChange(lignes.filter((_, k) => k !== i))}
              >
                retirer
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-1">
        <BoutonLigne
          libelle="+ ligne"
          onClick={() =>
            onChange([...lignes, { ressource: ressources[0]?.code ?? "", quantite: 1, mode }])
          }
        />
      </div>
    </div>
  );
}

/**
 * Ce que la tuile fabrique pendant qu'elle tourne.
 *
 * ⚠️ Deplacee ici depuis Stock & appro le 26/08 : c'est ce que le batiment
 * FAIT, pas ce qui bouge. Une ligne n'a **ni cible ni rayon** — un producteur
 * ne livre pas, c'est le preneur qui vient avec SON rayon.
 *
 * ⚠️ Le rendement se pose desormais avec le **meme geste que la satisfaction
 * d'une consommation** — un `+ indice` en bout de ligne, cache tant qu'on ne
 * l'a pas demande. Retire le meme jour le systeme "rendement selon [indicateur]
 * + tranches" : demande explicite de l'utilisateur, en voyant a quel point la
 * consommation etait plus simple a lire. C'est un plafond FIXE, pas une valeur
 * qui suit un indicateur en direct.
 */
function LignesProduction({
  lignes,
  productibles,
  indicateurs,
  nomRessource,
  onChange,
}: {
  lignes: LigneProduction[];
  productibles: Ressource[];
  indicateurs: Ressource[];
  nomRessource: (code: string) => string;
  onChange: (lignes: LigneProduction[]) => void;
}) {
  const maj = (i: number, patch: Partial<LigneProduction>) =>
    onChange(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  return (
    <div>
      {lignes.length === 0 ? (
        <p className="text-xs text-slate-600">ne produit rien</p>
      ) : (
        <div className="space-y-2">
          {lignes.map((ligne, i) => {
            const estIndicateur = indicateurs.some((r) => r.code === ligne.ressource);
            return (
              <div key={i} className="rounded border border-edge/60 bg-ink/40 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Un indicateur n'a pas de quantite : sa valeur se calcule. */}
                  {!estIndicateur && (
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="input h-9 w-20 py-1"
                      value={ligne.quantite}
                      onChange={(e) =>
                        maj(i, { quantite: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  )}
                  <select
                    className="input h-9 w-44 py-1"
                    value={ligne.ressource}
                    onChange={(e) => maj(i, { ressource: e.target.value })}
                  >
                    <option value="">choisir une ressource</option>
                    {productibles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.nom}
                        {r.genre === "indicateur" ? " (indicateur)" : ""}
                      </option>
                    ))}
                  </select>
                  {!estIndicateur && (
                    <>
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        toutes les
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="input h-9 w-24 py-1"
                          value={ligne.periode_s}
                          onChange={(e) =>
                            maj(i, { periode_s: Math.max(1, Number(e.target.value) || 1) })
                          }
                        />
                        s
                      </label>
                      <span className="text-[11px] text-slate-500">
                        soit {ligne.quantite} / {formatDuree(ligne.periode_s)}
                      </span>

                      {/* ⚠️ Meme geste que le "+ indice" de la consommation :
                          cache par defaut. Mais ici ce n'est PAS un nombre :
                          c'est un ESCALIER (choix du 26/08 apres-midi). */}
                      {ligne.tranches.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          selon
                          <select
                            className="input h-9 w-36 py-1"
                            value={ligne.indicateur}
                            onChange={(e) => maj(i, { indicateur: e.target.value })}
                          >
                            <option value="">rien (plafond fixe)</option>
                            {indicateurs.map((r) => (
                              <option key={r.id} value={r.code}>
                                {r.nom}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="text-slate-500 hover:text-red-400"
                            title="retirer l'indice"
                            onClick={() => maj(i, { tranches: [], indicateur: "" })}
                          >
                            ×
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-accent hover:underline"
                          onClick={() =>
                            maj(i, {
                              tranches: TRANCHES_PAR_DEFAUT,
                              indicateur: indicateurs[0]?.code ?? "",
                            })
                          }
                        >
                          + indice
                        </button>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    className="ml-auto text-xs text-slate-500 hover:text-red-400"
                    onClick={() => onChange(lignes.filter((_, k) => k !== i))}
                  >
                    retirer
                  </button>
                </div>

                {estIndicateur ? (
                  <p className="mt-1 text-[11px] leading-tight text-accent">
                    Rien à saisir : la valeur de cet indicateur <strong>se calcule</strong> à
                    partir des indices posés sur les consommations ci-dessus. Entièrement servie,
                    la tuile le produit à 100 % ; à moitié, à 50 %.
                  </p>
                ) : (
                  <>
                    {ligne.tranches.length > 0 && (
                      <Escalier
                        tranches={ligne.tranches}
                        quantite={ligne.quantite}
                        indicateur={ligne.indicateur}
                        nomRessource={nomRessource}
                        onChange={(tranches) => maj(i, { tranches })}
                      />
                    )}
                    <p className="mt-1 text-[11px] leading-tight text-slate-500">
                      C'est un <strong>maximum</strong> : la production réelle vaut ce débit ×{" "}
                      <span className="text-slate-300">la couverture de ses intrants</span>{" "}
                      {/* L'exemple a moitie : c'est le cas que l'utilisateur cite
                          lui-meme (« si il n'y a que 25 bovins sur 50 »), et un
                          chiffre se verifie d'un coup d'oeil, pas une formule. */}
                      <span className="text-slate-400">
                        (à moitié approvisionné :{" "}
                        <span className="tabular-nums text-slate-300">
                          {Math.round(ligne.quantite / 2)}
                        </span>
                        )
                      </span>
                      {ligne.tranches.length > 0 ? (
                        ligne.indicateur !== "" ? (
                          <>
                            , puis × <span className="text-slate-300">le rendement de la tranche</span>{" "}
                            de {nomRessource(ligne.indicateur)}{" "}
                            <span className="text-slate-400">
                              — la valeur lue est celle de{" "}
                              <span className="text-slate-300">la période précédente</span>.
                            </span>
                          </>
                        ) : (
                          <>
                            , puis ×{" "}
                            <span className="text-slate-300">
                              {rendementPourIndicateur(ligne.tranches, 100)} % de rendement
                            </span>{" "}
                            — aucun indice choisi, c'est un plafond fixe.
                          </>
                        )
                      ) : (
                        <>
                          {" "}
                          — <span className="text-accent">rien ne la plafonne</span>.
                        </>
                      )}{" "}
                      Et sans sa main-d'œuvre, elle est nulle.
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-1">
        <BoutonLigne
          libelle="+ ligne"
          onClick={() => onChange([...lignes, productionVide(productibles[0]?.code ?? "")])}
        />
      </div>
    </div>
  );
}

/**
 * L'**escalier de rendement** d'une ligne de production.
 *
 * ⚠️ Une tranche ne porte que son **seuil bas** — le haut est celui de la
 * tranche du dessus. C'est ce qui interdit structurellement le trou et le
 * recouvrement, les deux fautes qui feraient dependre le resultat de l'ordre de
 * lecture. L'ecran affiche donc « de X a Y % », mais ne laisse saisir que X.
 */
function Escalier({
  tranches,
  quantite,
  indicateur,
  nomRessource,
  onChange,
}: {
  tranches: Tranche[];
  quantite: number;
  indicateur: string;
  nomRessource: (code: string) => string;
  onChange: (tranches: Tranche[]) => void;
}) {
  const triees = tranchesTriees(tranches);
  const nom = indicateur === "" ? "l'indice" : nomRessource(indicateur);

  const maj = (i: number, patch: Partial<Tranche>) =>
    onChange(triees.map((t, k) => (k === i ? { ...t, ...patch } : t)));

  return (
    <div className="mt-2 rounded border border-edge/60 bg-ink/60 p-2">
      <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
        rendement selon {nom}
      </p>
      <div className="space-y-1">
        {triees.map((t, i) => {
          // Le haut de la tranche est celui du dessus : on le LIT, on ne le
          // saisit pas. 100 pour la premiere.
          const haut = i === 0 ? 100 : triees[i - 1].seuil;
          return (
            <div key={i} className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
              de
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                className="input h-8 w-16 py-0"
                value={t.seuil}
                onChange={(e) =>
                  maj(i, { seuil: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                }
              />
              à <span className="tabular-nums text-slate-400">{haut}</span> % →
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                className="input h-8 w-16 py-0"
                value={t.rendement}
                onChange={(e) =>
                  maj(i, { rendement: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                }
              />
              % de rendement
              <span className="tabular-nums text-slate-400">
                — soit {Math.round((quantite * t.rendement) / 100)} par période
              </span>
              <button
                type="button"
                className="ml-auto text-slate-500 hover:text-red-400"
                title="retirer la tranche"
                onClick={() => onChange(triees.filter((_, k) => k !== i))}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-1">
        <BoutonLigne
          libelle="+ tranche"
          onClick={() => onChange([...triees, { seuil: 0, rendement: 50 }])}
        />
      </div>

      {/* ⚠️ Un escalier qui ne descend pas jusqu'a 0 n'est pas une erreur
          bloquante : la tranche la plus basse s'applique quand meme en dessous
          de son seuil. Mais l'ecran doit le DIRE, sinon il ment. */}
      {!tranchesCouvrentZero(triees) && (
        <p className="mt-1 text-[11px] leading-tight text-amber-300">
          La tranche la plus basse part de {triees[triees.length - 1].seuil} % : en dessous, c'est
          elle qui s'applique quand même ({triees[triees.length - 1].rendement} %). Jamais 100 % —
          sinon un {nom} catastrophique donnerait la production maximale.
        </p>
      )}
      {seuilsEnDouble(triees) && (
        <p className="mt-1 text-[11px] leading-tight text-amber-300">
          Deux tranches partent du même seuil : le rendement dépendrait de l'ordre de lecture.
        </p>
      )}
      <p className="mt-1 text-[11px] leading-tight text-slate-500">
        La valeur lue est celle de <strong>la période précédente</strong> — l'habitation produit son{" "}
        {nom} à la fin du tick, la production le lit au tick suivant. À 100 % :{" "}
        <span className="tabular-nums text-slate-300">
          {Math.round((quantite * rendementPourIndicateur(triees, 100)) / 100)}
        </span>{" "}
        · à 60 % :{" "}
        <span className="tabular-nums text-slate-300">
          {Math.round((quantite * rendementPourIndicateur(triees, 60)) / 100)}
        </span>{" "}
        · à 0 % :{" "}
        <span className="tabular-nums text-slate-300">
          {Math.round((quantite * rendementPourIndicateur(triees, 0)) / 100)}
        </span>
        .
      </p>
    </div>
  );
}

function LignesFlux({
  lignes,
  ressources,
  toutes,
  tuiles,
  nomTuile,
  onChange,
}: {
  lignes: LigneFlux[];
  /** Ce qu'on propose ici : ni `mobilise` ni `indicateur` — rien n'en est stocké. */
  ressources: Ressource[];
  /** Le catalogue entier, pour nommer une ligne déjà saisie qui n'a plus sa place. */
  toutes?: Ressource[];
  /** Le catalogue des tuiles, pour le batiment que la proximite demande autour. */
  tuiles: Tuile[];
  nomTuile: (tileId: number) => string;
  onChange: (lignes: LigneFlux[]) => void;
}) {
  const maj = (i: number, patch: Partial<LigneFlux>) =>
    onChange(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const periodes = Array.from(new Set(lignes.map((l) => l.periode_s)));

  return (
    <div>
      {lignes.length === 0 ? (
        <p className="text-xs text-slate-600">ne consomme rien</p>
      ) : (
        <div className="space-y-2">
          {lignes.map((ligne, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="input h-9 w-20 py-1"
                  value={ligne.quantite}
                  onChange={(e) => maj(i, { quantite: Math.max(0, Number(e.target.value) || 0) })}
                />
                <ChoixRessource
                  code={ligne.ressource}
                  ressources={ressources}
                  toutes={toutes}
                  onChange={(ressource) => maj(i, { ressource })}
                />
                <label className="flex items-center gap-1 text-xs text-slate-500">
                  toutes les
                  <input
                    type="number"
                    min={1}
                    step={1}
                    className="input h-9 w-24 py-1"
                    value={ligne.periode_s}
                    onChange={(e) => maj(i, { periode_s: Math.max(1, Number(e.target.value) || 1) })}
                  />
                  s
                </label>
                <span className="text-[11px] text-slate-500">
                  soit {ligne.quantite} / {formatDuree(ligne.periode_s)}
                </span>
                {/* ⚠️ L'indice ne s'AJOUTE que si on le demande. La plupart des
                    consommations n'en ont pas : un champ toujours la, a zero sur
                    quatre lignes sur cinq, ferait croire qu'il faut le remplir.
                    Demande explicite de l'utilisateur. */}
                {ligne.part > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    =
                    <input
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      className="input h-9 w-16 py-1"
                      value={ligne.part}
                      onChange={(e) =>
                        maj(i, { part: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                      }
                    />
                    % de satisfaction
                    <button
                      type="button"
                      className="text-slate-500 hover:text-red-400"
                      title="retirer l'indice"
                      onClick={() => maj(i, { part: 0 })}
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline"
                    // La premiere ligne porte 100 %, les suivantes 10 % : c'est
                    // l'exemple de l'utilisateur, et ca evite un total absurde
                    // des la deuxieme ligne.
                    onClick={() =>
                      maj(i, { part: lignes.some((l, k) => k !== i && l.part > 0) ? 10 : 100 })
                    }
                  >
                    + indice
                  </button>
                )}

                {/* ⚠️ Meme geste que le « + indice » : cache tant qu'on ne l'a
                    pas demande. La plupart des consommations n'ont aucune
                    regle de voisinage. */}
                {!proximitePosee(ligne.proximite) && (
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline"
                    onClick={() => maj(i, { proximite: proximiteParDefaut() })}
                  >
                    + proximité
                  </button>
                )}

                <button
                  type="button"
                  className="ml-auto text-xs text-slate-500 hover:text-red-400"
                  onClick={() => onChange(lignes.filter((_, k) => k !== i))}
                >
                  retirer
                </button>
              </div>

              {proximitePosee(ligne.proximite) && (
                <BlocProximite
                  proximite={ligne.proximite}
                  quantite={ligne.quantite}
                  periode_s={ligne.periode_s}
                  tuiles={tuiles}
                  nomTuile={nomTuile}
                  onChange={(proximite) => maj(i, { proximite })}
                />
              )}
            </div>
          ))}
          {periodes.length > 1 && (
            <p className="text-[11px] text-amber-400">
              Ce palier mélange {periodes.length} périodes différentes. Le ralenti en cas de
              pénurie sera moins précis — garde la même période partout si tu peux.
            </p>
          )}
        </div>
      )}
      <div className="mt-1">
        <BoutonLigne
          libelle="+ ligne"
          onClick={() => onChange([...lignes, fluxVide(ressources[0]?.code ?? "")])}
        />
      </div>
    </div>
  );
}

/**
 * **La regle de proximite d'une consommation** — 2026-08-28.
 *
 * Mot de l'utilisateur : *« 10 bovin × 120 s × (besoin de 5 tile bovin a
 * 2 rayon = 100 %) »*. Elle attache un batiment a son voisinage : un abattoir
 * sans paturages autour n'a rien a abattre.
 *
 * ⚠️ **Au prorata** (choix du 28/08) : 3 sur 5 valent 60 %, pas zero. La ligne
 * ne demande alors plus que 60 % de son debit, et la tuile plafonne a 60 % de
 * sa production — c'est ce que la phrase de relecture montre en chiffres.
 *
 * ⚠️ Elle n'est **pas encore appliquee en jeu** : le moteur ne regarde pas le
 * voisinage. L'avertissement orange part avec le mecanisme, pas avant.
 */
function BlocProximite({
  proximite,
  quantite,
  periode_s,
  tuiles,
  nomTuile,
  onChange,
}: {
  proximite: Proximite;
  quantite: number;
  periode_s: number;
  tuiles: Tuile[];
  nomTuile: (tileId: number) => string;
  onChange: (proximite: Proximite) => void;
}) {
  const p = proximite;
  const utile = proximiteUtile(p);
  // Un tileId qui ne designe plus rien reste VISIBLE dans le menu, marque
  // « inconnue » : le faire disparaitre changerait la ligne en silence au
  // premier reenregistrement.
  const orpheline = p.tileId > 0 && !tuiles.some((t) => t.tileId === p.tileId);
  const maj = (patch: Partial<Proximite>) => onChange({ ...p, ...patch });
  // Un exemple a une tuile pres du compte : c'est la que le prorata se voit.
  const manquantes = Math.max(0, p.nombre - 1);
  const pct = pourcentageProximite(p, manquantes);

  return (
    <div className="mt-1 rounded border border-edge/60 bg-ink/60 p-2">
      <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
        besoin de
        <input
          type="number"
          min={1}
          step={1}
          className="input h-8 w-16 py-0"
          value={p.nombre}
          onChange={(e) => maj({ nombre: Math.max(0, Number(e.target.value) || 0) })}
        />
        {/* Une liste, jamais un id tape a la main : c'est la convention du site. */}
        <select
          className={`input h-8 w-44 py-0 ${orpheline ? "border-amber-700 text-amber-300" : ""}`}
          value={String(p.tileId)}
          onChange={(e) => maj({ tileId: Number(e.target.value) || 0 })}
        >
          <option value="0">choisir un bâtiment</option>
          {orpheline && <option value={p.tileId}>tuile {p.tileId} — inconnue</option>}
          {[...tuiles]
            .sort((a, b) => a.nom.localeCompare(b.nom))
            .map((t) => (
              <option key={t.id} value={t.tileId}>
                {t.nom}
              </option>
            ))}
        </select>
        à
        <input
          type="number"
          min={1}
          step={1}
          className="input h-8 w-16 py-0"
          value={p.rayon}
          onChange={(e) => maj({ rayon: Math.max(0, Number(e.target.value) || 0) })}
        />
        de rayon = 100 %
        <button
          type="button"
          className="ml-auto text-slate-500 hover:text-red-400"
          title="retirer la proximité"
          onClick={() => onChange(proximiteVide())}
        >
          &times;
        </button>
      </div>

      {utile ? (
        <p className="mt-1 text-[11px] leading-tight text-slate-500">
          Il faut <span className="tabular-nums text-slate-300">{p.nombre}</span>{" "}
          <span className="text-slate-300">&laquo; {nomTuile(p.tileId)} &raquo;</span> dans les{" "}
          <span className="tabular-nums">{casesCouvertes(p.rayon)}</span> cases à {p.rayon} de
          rayon pour consommer les {quantite} par {formatDuree(periode_s)}.{" "}
          <strong>Au prorata en dessous</strong> : avec{" "}
          <span className="tabular-nums text-slate-300">{manquantes}</span> sur {p.nombre}, la
          ligne ne demande plus que{" "}
          <span className="tabular-nums text-slate-300">
            {Math.round((quantite * pct) / 100)}
          </span>{" "}
          et la tuile plafonne à <span className="tabular-nums text-slate-300">{pct} %</span> de sa
          production.
        </p>
      ) : (
        <p className="mt-1 text-[11px] leading-tight text-amber-400">
          Règle incomplète — il faut un bâtiment, un nombre et un rayon. Telle quelle, elle sera{" "}
          <strong>ignorée en jeu</strong>.
        </p>
      )}

      {/* ⚠️ Un champ enregistre mais pas encore branche cote jeu l'annonce ;
          un champ qui ment ne dit rien. A retirer avec le mecanisme. */}
      <p className="mt-1 text-[11px] leading-tight text-amber-400">
        ⚠️ Enregistré mais <strong>pas encore appliqué en jeu</strong> : le moteur ne regarde pas
        encore le voisinage d&apos;une tuile pour calculer sa consommation.
      </p>
    </div>
  );
}

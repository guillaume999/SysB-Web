import Aide, { Terme } from "@/components/Aide";
import ChoixTuiles from "@/components/ChoixTuiles";
import { codeInconnu, libelleRessource, parAlphabet, type Ressource } from "@/lib/ressources";
import {
  INDICE_LU,
  TRANCHES_PAR_DEFAUT,
  casesCouvertes,
  erreursPalier,
  fluxVide,
  formatDuree,
  palierTourne,
  palierVide,
  pourcentageProximite,
  pourcentageProximites,
  productionVide,
  proximiteParDefaut,
  proximiteUtile,
  rendEnVeille,
  rendementPourIndicateur,
  satisfactionMax as satisfactionMaxDuPalier,
  seuilsEnDouble,
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
 *   PENDANT QU'IL TOURNE   -> les lignes `mobilise`
 *   A CHAQUE CYCLE         -> la duree du cycle, puis ce qu'il consomme et produit
 *
 * En base, une seule liste `cout` porte les deux premieres, distinguees par
 * leur `mode`.
 *
 * ⚠️⚠️ **LE MODELE A CYCLES (2026-09-11, spec §2ter).** Le formulaire est
 * celui de la spec, mot pour mot :
 *
 *   Cycle : [ 2 ] minute(s)
 *     ☐ demarre avec ce qu'il y a
 *     consomme   20  BLE   ☐ en direct
 *     produit     5  BOIS
 *
 * La periode est sur le PALIER, jamais sur la ligne ; une ligne porte une
 * quantite ENTIERE par cycle. `par_minute` et les `part` de satisfaction ont
 * disparu — voir `lib/tuiles.ts`.
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
   * Ce qu'une tuile peut fabriquer : tout sauf les genres `mobilise` et
   * `indicateur`.
   *
   * ⚠️ Une ressource `mobilise` (la population) ne se PRODUIT pas : elle se
   * déclare en places dans l'onglet *Stock & appro*, et le jeu lit ce plafond.
   * L'offrir ici donnerait une ligne qui remplit un coffre que personne ne lit —
   * les habitants disparaîtraient sans un mot.
   *
   * ⚠️ Un `indicateur` ne se produit plus non plus, depuis le 11/09 (§5.4) : la
   * satisfaction se CONSTATE sur tout bâtiment qui consomme. Une ligne
   * « produit 1 satisfaction » était le reliquat du modèle où l'indicateur
   * était une ressource ; une production peut le SUIVRE (« + indice »), jamais
   * le fabriquer. Une ligne déjà en base est dite en orange, pas effacée.
   */
  const productibles = parAlphabet(
    ressources.filter((r) => r.genre !== "mobilise" && r.genre !== "indicateur"),
  );
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
   *
   * Un `FluxStock` (la monnaie, 07/09) reste proposé partout ici — produit,
   * payé, consommé : il a bien une quantité qui s'accumule et se dépense, elle
   * vit seulement dans la réserve du plateau au lieu d'un coffre.
   */
  const depensables = parAlphabet(
    ressources.filter((r) => r.genre !== "mobilise" && r.genre !== "indicateur"),
  );

  /**
   * Les lignes déjà en base qui citent une ressource **existante mais qui n'a
   * pas sa place ici** — rendues par leur nom affichable.
   *
   * On ne les efface pas : on les **dit** — même règle de maison que les
   * anciens avertissements « pas encore appliqué » (partis le 28/08 avec leurs
   * mécanismes). Un champ qui ment ne dit rien, un champ hors sujet
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

      <Aide titre="Payé, occupé, le cycle, consommé, produit">
        <Terme nom="à la construction">
          Prélevé du stock et <strong>perdu</strong>. 50 bois payés ne reviennent jamais — ni à la
          destruction, ni en veille.
        </Terme>
        <Terme nom="occupe pendant qu'il tourne">
          Retenu <strong>tant que le bâtiment tourne</strong>, puis rendu. C'est le mode de la
          population : 6 habitants travaillent ici et ne travaillent nulle part ailleurs. Ils ne
          sont pas <em>dépensés</em> — ils reviennent à la destruction <em>ou en veille</em>.
        </Terme>
        <Terme nom="cycle">
          Le bâtiment a <strong>un rythme, et un seul</strong> : il démarre un cycle quand ses
          ressources sont là, le cycle dure <strong>X minutes</strong>, puis il consomme et livre{" "}
          <strong>d'un coup</strong>. X est un <strong>entier de minutes</strong> — le cycle le plus
          court est une minute.
          <br />
          ⚠️ <strong>Obligatoire dès que le palier consomme ou produit</strong> : sans lui, le
          serveur refuse la tuile, et l'enregistrement est bloqué. Un palier qui ne fait rien n'a
          pas de cycle à déclarer.
          <br />
          10 par cycle de 1 min ne se comporte pas comme 20 par cycle de 2 min : le second attend
          deux fois plus longtemps sa cargaison, et livre deux fois plus d'un coup.
        </Terme>
        <Terme nom="démarre avec ce qu'il y a">
          <strong>Décoché (le défaut) : tout ou rien.</strong> Un four qui demande 20 blé et n'en
          a que 12 <strong>ne démarre pas</strong> — il n'en mange aucun, il attend sa cargaison
          complète, et il reste à l'arrêt tant qu'elle n'est pas là.
          <br />
          <strong>Coché</strong> : un cycle part dès qu'il y a <em>quelque chose</em>. Le bâtiment
          mange ce qu'il trouve et livre à proportion ; une ressource totalement absente bloque
          toujours.
          <br />
          ⚠️ Le prix du mode coché : avec 1 blé sur 100, il consomme ce blé à chaque cycle et ne
          produit rien (arrondi vers le bas). C'est pour ça que ce n'est pas le défaut.
          <br />
          ⚠️ Quand ça débloque, <strong>on ne rattrape pas</strong> : un bâtiment arrêté une heure
          repart pour <em>un</em> cycle, pas soixante. Le temps d'arrêt est perdu.
        </Terme>
        <Terme nom="consomme">
          Ce qui part vraiment, <strong>à chaque cycle</strong> : un nombre entier d'unités, et la
          ressource. Plus de débit « par minute » — c'est la durée du cycle qui porte le rythme.
        </Terme>
        <Terme nom="en direct">
          Une case à cocher sur une ligne <strong>consommée</strong> : la ressource est prise{" "}
          <strong>sans navette, sur tout le plateau</strong> — sauf chez un bâtiment qui la
          consomme lui aussi.
          <br />
          ⚠️ Une ressource consommée en direct <strong>n'est jamais allée chercher par une
          navette</strong> : c'est tout l'intérêt, elle arrive sans transport, donc sans aléa. Une
          règle d'appro de ce bâtiment (onglet <em>Stock &amp; appro</em>) qui la cite n'envoie
          rien pour elle.
          <br />
          Tous les bâtiments d'un même type qui la prennent en direct <strong>ne font
          qu'un</strong> : ils consomment et produisent comme un seul, avec une seule
          satisfaction. C'est ce qui lisse les indices — la famine reste visible <em>entre</em>{" "}
          types, plus à l'intérieur d'un type.
        </Terme>
        <Terme nom="bonus">
          Sur une ligne de consommation, un <strong>bonus</strong> fait monter la satisfaction{" "}
          <strong>au-dessus de 100 %</strong> : 10 nourriture (ligne ordinaire) + 5 gibier
          (bonus 20 %) donnent 120 % quand les deux sont servis, 108 % si le gibier n&apos;arrive
          qu&apos;aux deux cinquièmes, 100 % sans gibier du tout.
          <br />
          ⚠️ Une ligne bonus <strong>n&apos;entre pas dans la demande de base</strong> — c&apos;est
          ce qui permet de dépasser 100 — et elle <strong>ne bloque jamais un cycle</strong> : le
          « en plus » ne doit pas devenir un « obligatoire ». Elle se consomme quand même, elle
          coûte vraiment.
          <br />
          ⚠️ Le surplus ne paie <strong>que par l&apos;escalier</strong> d&apos;une production, avec
          une tranche écrite au-dessus de 100 (« de 120 → 130 % »). Une production ordinaire, elle,
          reste plafonnée à sa quantité déclarée. Aucun plafond n&apos;est imposé : c&apos;est le
          catalogue qui borne, en n&apos;écrivant pas de tranche plus haut.
        </Terme>
        <Terme nom="satisfaction">
          <strong>Elle ne se déclare pas, elle se constate.</strong> Tout bâtiment qui consomme
          publie la sienne : ce qu'il a reçu sur ce qu'il demandait. 15 blé servis sur 20
          demandés, c'est <strong>75 %</strong> — il n'y a rien à saisir, et aucune ligne ne
          « produit » de satisfaction.
        </Terme>
        <Terme nom="d'où ça vient, où ça va">
          Pas ici. Cet onglet dit ce que le bâtiment consomme et ce qu'il fabrique ;{" "}
          <strong>par où ça arrive et par où ça repart</strong> se règle dans l'onglet{" "}
          <em>Stock &amp; appro</em>, qui porte le stockage, les rayons et les navettes.
        </Terme>
        <Terme nom="+ proximité">
          En bout d'une ligne — consommation <em>ou</em> production : elle reste cachée tant qu'on
          ne la demande pas. Elle dit combien de bâtiments il faut <strong>autour de la
          tuile</strong> pour qu'on tourne à plein — c'est ce qui attache un abattoir à ses
          pâturages.
          <br />
          ⚠️ <strong>Pas encore appliquée par le moteur à cycles</strong> (décision du 11/09) : tu
          peux la saisir, elle est enregistrée, mais elle ne freine rien en jeu pour l'instant.
          <br />
          <strong>Plusieurs tuiles cochées = un OU, et elles s'additionnent.</strong> « 5 au total
          parmi Pâturage ou Bergerie » est rempli par 3 pâturages + 2 bergeries. Pour un{" "}
          <strong>ET</strong> — 5 pâturages <em>et</em> 3 bergeries — clique une deuxième fois sur{" "}
          <strong>+ proximité</strong> : les règles s'empilent sur la ligne et doivent toutes être
          remplies. <strong>Au prorata</strong>, et c'est la plus contraignante qui commande.
          <br />
          Le rayon se compte sur la grille <strong>hexagonale</strong> : 6 cases à 1, 18 à 2, 36 à
          3. La phrase sous la règle te donne le compte exact.
        </Terme>
        <Terme nom="produit">
          Ce que la tuile <strong>livre à chaque cycle</strong>, <strong>au maximum</strong>. Une
          ligne par ressource.
          <br />
          Une ligne ordinaire suit <strong>la satisfaction du bâtiment</strong> : il a reçu 80 % de
          ce qu'il attendait, il livre 80 %, <strong>arrondi vers le bas</strong>. Un bâtiment qui
          ne consomme rien livre toujours tout.
          <br />
          ⚠️ <strong>Ni cible ni rayon</strong> : un producteur ne livre pas. Il fabrique dans son
          coffre, et c'est le preneur qui vient, avec <em>son</em> rayon de récolte. Seul un
          entrepôt envoie vraiment, et ça se règle dans l'onglet Stock &amp; appro.
          <br />
          ⚠️ Un <strong>indicateur</strong> (la satisfaction) ne se produit pas : il n'est pas
          proposé ici. Une production peut le <em>suivre</em>, voir <strong>+ indice</strong>.
        </Terme>
        <Terme nom="+ indice">
          En bout d'une ligne de production : elle <strong>suit un indicateur</strong> au lieu de
          la satisfaction du bâtiment. Tu choisis l'indicateur et un <strong>escalier</strong> —
          « à partir de 80 %, rendement 100 % ; en dessous, 60 % ».
          <br />
          ⚠️ <strong>Une ligne a un cadenceur, et un seul</strong> : avec un indice, c'est
          l'escalier qui décide, et lui seul. La remultiplier par la satisfaction propre du
          bâtiment compterait la pénurie deux fois.
          <br />
          Chaque bâtiment qui consomme prend <strong>sa</strong> tranche, et le rendement est leur
          moyenne <strong>pondérée par la population</strong> — pas la tranche de la moyenne : une
          famine locale tire le rendement vers le bas sur sa part de population, elle ne se dilue
          pas dans un chiffre confortable.
          <br />
          ⚠️ <strong>Laisse-le vide sur les fermes.</strong> Sans au moins une production qui ne
          suit pas l'indice quelque part, moins de vivres → moins de satisfaction → les fermes
          produisent moins → encore moins de vivres, et le joueur découvre l'effondrement en
          revenant.
        </Terme>
        <Terme nom="chantier">
          Le temps qu'il faut avant que le bâtiment serve. <code>0</code> = instantané.
          <br />
          Pendant le chantier la case est <strong>inerte</strong> (elle ne produit pas, ne
          consomme pas, ne loge et ne mobilise personne), un badge CHANTIER la signale, et le
          premier cycle ne peut partir qu'à la fin des travaux — à l'heure serveur. Détruire en
          plein chantier ne rembourse rien, et améliorer ouvre un chantier.
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
          Elle n'éteint <strong>rien</strong>. Quand une ressource manque, le cycle{" "}
          <strong>attend</strong> sa cargaison — ou part avec ce qu'il y a, si la case est cochée.
          La veille est une décision du joueur, pas une punition automatique.
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
                        majPalier(index, { duree_construction_s: entierSaisi(e.target.value) })
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
                {/* L'avertissement « chantiers pas encore appliqués » est
                    parti le 28/08, avec l'arrivée du mécanisme en jeu. */}
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
              </Section>

              {/* ── À chaque cycle (spec §2ter) ───────────────────────── */}
              <Section titre="À chaque cycle">
                <ChoixCycle palier={palier} onChange={(patch) => majPalier(index, patch)} />

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
                  toutes={ressources}
                  indicateurs={indicateurs}
                  consomme={palier.utilisation.some((l) => l.ressource !== "" && l.quantite > 0)}
                  satisfactionMax={satisfactionMaxDuPalier(palier.utilisation)}
                  nomRessource={nomRessource}
                  tuiles={tuiles}
                  nomTuile={nomTuile}
                  onChange={(production) => majPalier(index, { production })}
                />
                <AvertissementProduction
                  lignes={palier.production}
                  ressources={ressources}
                  nomRessource={nomRessource}
                />
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

              {/* Ce que le serveur refuserait : en rouge ICI, sous le palier en
                  faute, et repete au pied de la fenetre qui bloque l'envoi. */}
              {erreursPalier(palier).map((e) => (
                <p key={e} className="mt-1 text-[11px] leading-tight text-red-400">
                  ⚠️ {e}
                </p>
              ))}
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
 * ⚠️ **On ne supprime jamais la saisie de l'utilisateur en silence** — on la
 * lui montre. Retirer la ligne à sa place, c'est reperdre l'information sans
 * qu'il sache pourquoi.
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
                onChange={(e) => maj(i, { quantite: entierSaisi(e.target.value) })}
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
 * **La duree du cycle, et le mode de demarrage** — le haut du formulaire de
 * la spec §2ter :
 *
 *   Cycle : [ X ] minute(s)
 *     ☐ demarre avec ce qu'il y a
 *
 * ⚠️ Aucun defaut : un palier neuf arrive a `0` (« pas encore declare »), et
 * le champ passe au rouge des qu'une ligne consomme ou produit. Un rythme
 * choisi a la place de l'admin ne se decouvrirait qu'en jeu.
 */
function ChoixCycle({
  palier,
  onChange,
}: {
  palier: Palier;
  onChange: (patch: Partial<Palier>) => void;
}) {
  const tourne = palierTourne(palier);
  const manque = tourne && palier.cycle_minutes < 1;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        Cycle :
        <input
          type="number"
          min={1}
          step={1}
          placeholder="—"
          className={`input h-9 w-20 py-1 ${manque ? "border-red-700" : ""}`}
          // 0 = pas encore declare : un champ VIDE le dit mieux qu'un zero, qui
          // se lirait comme une valeur choisie.
          value={palier.cycle_minutes === 0 ? "" : palier.cycle_minutes}
          onChange={(e) => onChange({ cycle_minutes: entierSaisi(e.target.value) })}
        />
        minute{palier.cycle_minutes > 1 ? "s" : ""}
        {palier.cycle_minutes >= 1 && (
          <span className="text-[11px] text-slate-500">
            — il consomme et livre d'un coup au bout de {formatDuree(palier.cycle_minutes * 60)}
          </span>
        )}
        {!tourne && (
          <span className="text-[11px] text-slate-600">
            — ne consomme ni ne produit : pas de cycle à déclarer
          </span>
        )}
      </div>
      <label className="mt-1 flex flex-wrap items-center gap-2 pl-4 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={palier.demarre_partiel}
          onChange={(e) => onChange({ demarre_partiel: e.target.checked })}
        />
        démarre avec ce qu'il y a
        <span className="text-[11px] text-slate-500">
          {palier.demarre_partiel
            ? "— un cycle part dès qu'il y a quelque chose, et livre à proportion"
            : "— tout ou rien : il attend sa cargaison complète"}
        </span>
      </label>
    </div>
  );
}

/**
 * Une quantite saisie : un ENTIER positif ou nul, jamais une decimale (§3).
 * Le champ `step={1}` n'empeche pas de taper « 2,5 » — la troncature, si.
 */
function entierSaisi(valeur: string): number {
  return Math.max(0, Math.trunc(Number(valeur) || 0));
}

/**
 * Une ligne a 0 par cycle ne fait rien : elle est retiree a l'enregistrement,
 * et ca se DIT avant. C'est aussi ce qu'on voit sur une ligne d'avant le 11/09,
 * dont le `par_minute` n'est pas relu.
 */
function LigneAZero({ ligne }: { ligne: { ressource: string; quantite: number } }) {
  if (ligne.ressource === "" || ligne.quantite > 0) return null;
  return (
    <p className="mt-1 text-[11px] leading-tight text-amber-400">
      0 par cycle : cette ligne ne fait rien, elle sera retirée à l&apos;enregistrement.
    </p>
  );
}

/**
 * **Ce qu'une ligne BONUS fait vraiment** (§5.5, 13/09) — la relecture avec ses
 * VRAIS chiffres, parce qu'un pourcentage de satisfaction se verifie d'un coup
 * d'oeil et une regle ne se verifie pas.
 *
 * ⚠️ Les deux phrases comptent autant l'une que l'autre : « n'entre pas dans
 * la demande de base » est ce qui permet de depasser 100, « ne bloque jamais »
 * est ce qui empeche le bonus de devenir obligatoire.
 */
function RelectureBonus({ ligne }: { ligne: LigneFlux }) {
  if (ligne.bonus <= 0) return null;
  return (
    <p className="mt-1 text-[11px] leading-tight text-slate-500">
      <strong>+{ligne.bonus} %</strong> de satisfaction quand la ligne est servie entierement,{" "}
      <span className="tabular-nums text-slate-400">
        +{Math.floor(ligne.bonus / 2)} %
      </span>{" "}
      a moitie servie, <span className="text-slate-400">+0 %</span> sans rien — elle ne retire{" "}
      <em>jamais</em>. Elle <strong>n&apos;entre pas dans la demande de base</strong> : c&apos;est
      ce qui fait monter au-dessus de 100 %. Et elle{" "}
      <strong>ne bloque jamais le cycle</strong> — sans elle, le batiment tourne quand meme.
    </p>
  );
}

/**
 * Ce que la tuile fabrique a chaque cycle.
 *
 * ⚠️ Deplacee ici depuis Stock & appro le 26/08 : c'est ce que le batiment
 * FAIT, pas ce qui bouge. Une ligne n'a **ni cible ni rayon** — un producteur
 * ne livre pas, c'est le preneur qui vient avec SON rayon.
 *
 * ⚠️ **Une ligne a UN cadenceur** (spec §4, 11/09) : sans indice, la
 * satisfaction du batiment ; avec, l'escalier de l'indicateur — jamais les
 * deux. Le « plafond fixe » (un escalier sans indicateur) est donc mort : le
 * menu ne propose plus « rien », et un escalier orphelin est dit en orange.
 */
function LignesProduction({
  lignes,
  productibles,
  toutes,
  indicateurs,
  consomme,
  satisfactionMax,
  nomRessource,
  tuiles,
  nomTuile,
  onChange,
}: {
  lignes: LigneProduction[];
  productibles: Ressource[];
  /** Le catalogue entier, pour nommer une ligne déjà saisie qui n'a plus sa place. */
  toutes: Ressource[];
  indicateurs: Ressource[];
  /** Le palier consomme-t-il quelque chose ? Sinon sa satisfaction vaut 100 %. */
  consomme: boolean;
  /** 100, plus les bonus des lignes de consommation (§5.5) — le plafond de ce palier. */
  satisfactionMax: number;
  nomRessource: (code: string) => string;
  /** Le catalogue, pour les tuiles que la proximite demande autour (30/08). */
  tuiles: Tuile[];
  nomTuile: (tileId: number) => string;
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
            const avecIndice = ligne.indicateur !== "" || ligne.tranches.length > 0;
            return (
              <div key={i} className="rounded border border-edge/60 bg-ink/40 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="input h-9 w-20 py-1"
                    value={ligne.quantite}
                    onChange={(e) => maj(i, { quantite: entierSaisi(e.target.value) })}
                  />
                  <ChoixRessource
                    code={ligne.ressource}
                    ressources={productibles}
                    toutes={toutes}
                    onChange={(ressource) => maj(i, { ressource })}
                  />
                  <span className="text-xs text-slate-500">par cycle</span>

                  {/* ⚠️ Cache par defaut : la plupart des productions ne suivent
                      aucun indice. Ce n'est pas un nombre mais un ESCALIER
                      (choix du 26/08 apres-midi), et un indicateur NOMME — il
                      n'y a plus d'option « rien » depuis le 11/09. */}
                  {avecIndice ? (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      suit
                      <select
                        className={`input h-9 w-36 py-1 ${
                          ligne.indicateur === "" ? "border-amber-700 text-amber-300" : ""
                        }`}
                        value={ligne.indicateur}
                        onChange={(e) => maj(i, { indicateur: e.target.value })}
                      >
                        <option value="">choisir un indicateur</option>
                        {ligne.indicateur !== "" &&
                          !indicateurs.some((r) => r.code === ligne.indicateur) && (
                            <option value={ligne.indicateur}>{ligne.indicateur} — inconnu</option>
                          )}
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
                      className="text-xs text-accent hover:underline disabled:text-slate-600 disabled:no-underline"
                      disabled={indicateurs.length === 0}
                      title={
                        indicateurs.length === 0
                          ? "aucune ressource de genre « indicateur » au catalogue"
                          : "cette ligne suivra un indicateur, par un escalier de tranches"
                      }
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

                  {/* ⚠️ La proximite d'une PRODUCTION ne freine pas que sa
                      ligne : elle plafonne tout le palier. Elle s'ecrit
                      quand meme ici — c'est la demande telle qu'elle est
                      venue le 30/08, « dans ce que produit un batiment ». */}
                  <BoutonProximite
                    deja={ligne.proximites.length}
                    onClick={() =>
                      maj(i, { proximites: [...ligne.proximites, proximiteParDefaut()] })
                    }
                  />
                  <button
                    type="button"
                    className="ml-auto text-xs text-slate-500 hover:text-red-400"
                    onClick={() => onChange(lignes.filter((_, k) => k !== i))}
                  >
                    retirer
                  </button>
                </div>

                <LigneAZero ligne={ligne} />

                {avecIndice && (
                  <Escalier
                    satisfactionMax={satisfactionMax}
                    tranches={ligne.tranches}
                    quantite={ligne.quantite}
                    indicateur={ligne.indicateur}
                    nomRessource={nomRessource}
                    onChange={(tranches) => maj(i, { tranches })}
                  />
                )}

                <BlocsProximite
                  proximites={ligne.proximites}
                  contexte="produit"
                  quantite={ligne.quantite}
                  tuiles={tuiles}
                  nomTuile={nomTuile}
                  onChange={(proximites) => maj(i, { proximites })}
                />

                <p className="mt-1 text-[11px] leading-tight text-slate-500">
                  C'est un <strong>maximum</strong>.{" "}
                  {ligne.indicateur !== "" ? (
                    <>
                      Cadencée par <span className="text-slate-300">l'escalier</span> de{" "}
                      {nomRessource(ligne.indicateur)}, et par lui seul — pas par la satisfaction
                      du bâtiment en plus, qui compterait la pénurie deux fois.
                    </>
                  ) : consomme ? (
                    <>
                      Elle suit <span className="text-slate-300">la satisfaction du bâtiment</span>{" "}
                      — ce qu'il a reçu sur ce qu'il demandait —, arrondi vers le bas{" "}
                      <span className="text-slate-400">
                        (à moitié servi :{" "}
                        <span className="tabular-nums text-slate-300">
                          {Math.floor(ligne.quantite / 2)}
                        </span>
                        )
                      </span>
                      .
                    </>
                  ) : (
                    <>
                      Ce palier ne consomme rien : <span className="text-accent">il livre tout</span>{" "}
                      à chaque cycle.
                    </>
                  )}{" "}
                  Et sans sa main-d'œuvre, elle est nulle.
                </p>
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
 * Une production deja en base qui cite ce qui ne se PRODUIT pas — dite en
 * orange, jamais effacee (meme regle que `Avertissement`).
 *
 * - un `indicateur` : la satisfaction se CONSTATE depuis le 11/09 (§5.4), elle
 *   ne se fabrique plus ;
 * - un `mobilise` : il se declare en PLACES, dans l'onglet Stock & appro.
 */
function AvertissementProduction({
  lignes,
  ressources,
  nomRessource,
}: {
  lignes: LigneProduction[];
  ressources: Ressource[];
  nomRessource: (code: string) => string;
}) {
  const genreDe = (code: string) => ressources.find((r) => r.code === code)?.genre;
  const indicateurs = lignes.filter((l) => genreDe(l.ressource) === "indicateur");
  const mobilises = lignes.filter((l) => genreDe(l.ressource) === "mobilise");
  const noms = (ls: LigneProduction[]) => ls.map((l) => `« ${nomRessource(l.ressource)} »`).join(", ");
  return (
    <>
      {indicateurs.length > 0 && (
        <p className="mt-1 text-[11px] leading-tight text-amber-400">
          ⚠️ {noms(indicateurs)} ne se produit pas : un indicateur <strong>se constate</strong>{" "}
          — tout bâtiment qui consomme publie sa satisfaction, ce qu&apos;il a reçu sur ce qu&apos;il
          demandait. Retire la ligne ; une production peut le <em>suivre</em> avec{" "}
          <strong>+ indice</strong>.
        </p>
      )}
      {mobilises.length > 0 && (
        <p className="mt-1 text-[11px] leading-tight text-amber-400">
          ⚠️ {noms(mobilises)} ne se produit pas : il se déclare en <strong>places</strong>, dans
          le tableau de stockage de l&apos;onglet <em>Stock &amp; appro</em>. Retire la ligne.
        </p>
      )}
    </>
  );
}

/**
 * L'**escalier de rendement** d'une ligne de production.
 *
 * ⚠️ Une tranche ne porte que son **seuil bas** — le haut est celui de la
 * tranche du dessus. C'est ce qui interdit structurellement le trou et le
 * recouvrement, les deux fautes qui feraient dependre le resultat de l'ordre de
 * lecture. L'ecran affiche donc « de X a Y % », mais ne laisse saisir que X.
 *
 * ⚠️ Des pour CENT, partout : seuils, rendements, indicateur (§3).
 */
function Escalier({
  satisfactionMax,
  tranches,
  quantite,
  indicateur,
  nomRessource,
  onChange,
}: {
  /**
   * La satisfaction la plus haute que ce palier puisse atteindre : 100, plus
   * ses lignes bonus (§5.5). Une tranche au-dessus ne s'ouvrirait jamais.
   */
  satisfactionMax: number;
  tranches: Tranche[];
  quantite: number;
  indicateur: string;
  nomRessource: (code: string) => string;
  onChange: (tranches: Tranche[]) => void;
}) {
  const triees = tranchesTriees(tranches);
  const nom = indicateur === "" ? "l'indice" : nomRessource(indicateur);
  // ⚠️ ARRONDI VERS LE BAS, comme le moteur (`Math.floor` dans `consoProd`) :
  // un `Math.round` afficherait une unite de plus que ce que le jeu livrera.
  const livre = (valeur: number) =>
    Math.floor((quantite * rendementPourIndicateur(triees, valeur)) / 100);

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
          // ⚠️ LA TRANCHE DU HAUT N'A PLUS DE PLAFOND (13/09) : une
          // satisfaction peut depasser 100, donc « de 80 a 100 % » serait
          // faux — c'est « de 80 % et au-dessus ».
          const haut = i === 0 ? null : triees[i - 1].seuil;
          return (
            <div key={i} className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
              de
              <input
                type="number"
                min={0}
                step={1}
                className="input h-8 w-16 py-0"
                value={t.seuil}
                onChange={(e) => maj(i, { seuil: entierSaisi(e.target.value) })}
              />
              {haut === null ? (
                <span className="text-slate-400">% et au-dessus</span>
              ) : (
                <>
                  à <span className="tabular-nums text-slate-400">{haut}</span> %
                </>
              )}
              →
              <input
                type="number"
                min={0}
                step={1}
                className="input h-8 w-16 py-0"
                value={t.rendement}
                onChange={(e) => maj(i, { rendement: entierSaisi(e.target.value) })}
              />
              % de rendement
              <span className="tabular-nums text-slate-400">
                — soit {Math.floor((quantite * t.rendement) / 100)} par cycle
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

      {indicateur === "" && triees.length > 0 && (
        <p className="mt-1 text-[11px] leading-tight text-amber-300">
          Aucun indicateur choisi : sans lui, l&apos;escalier ne cadence rien — le moteur
          l&apos;ignore, et il sera retiré à l&apos;enregistrement. La ligne suivrait alors la
          satisfaction du bâtiment.
        </p>
      )}
      {/* ⚠️ Un escalier qui ne descend pas jusqu'a 0 n'est pas une erreur
          bloquante : la tranche la plus basse s'applique quand meme en dessous
          de son seuil. Mais l'ecran doit le DIRE, sinon il ment. */}
      {triees.length > 0 && !tranchesCouvrentZero(triees) && (
        <p className="mt-1 text-[11px] leading-tight text-amber-300">
          La tranche la plus basse part de {triees[triees.length - 1].seuil} % : en dessous, c'est
          elle qui s'applique quand même ({triees[triees.length - 1].rendement} %). Jamais 100 % —
          sinon un {nom} catastrophique donnerait la production maximale.
        </p>
      )}
      {/* ⚠️⚠️ LA FAUTE QUI SE DECOUVRIRAIT EN JEU, TROIS SEMAINES PLUS TARD :
          une tranche au-dessus de ce que le palier peut atteindre ne s'ouvre
          JAMAIS, et rien ne le dirait. */}
      {triees.length > 0 && triees[0].seuil > satisfactionMax && (
        <p className="mt-1 text-[11px] leading-tight text-amber-300">
          La tranche du haut part de {triees[0].seuil} %, mais ce palier plafonne à{" "}
          {satisfactionMax} % : elle ne s&apos;ouvrira <strong>jamais</strong>. Pour dépasser 100,
          il faut une ligne de consommation portant un <strong>bonus</strong> (bouton
          «&nbsp;+&nbsp;bonus&nbsp;» sur la ligne, plus haut) — le bonus se déclare sur ce que le
          bâtiment MANGE, pas ici.
        </p>
      )}
      {seuilsEnDouble(triees) && (
        <p className="mt-1 text-[11px] leading-tight text-amber-300">
          Deux tranches partent du même seuil : le rendement dépendrait de l'ordre de lecture.
        </p>
      )}
      {triees.length > 0 && (
        <p className="mt-1 text-[11px] leading-tight text-slate-500">
          La valeur est relue {INDICE_LU}. Chaque bâtiment qui consomme prend{" "}
          <strong>sa</strong> tranche, et le rendement est leur moyenne{" "}
          <strong>pondérée par la population</strong>. Tous à 100 % :{" "}
          <span className="tabular-nums text-slate-300">{livre(100)}</span>
          {satisfactionMax > 100 && (
            <>
              {" "}
              · tous à {satisfactionMax} % :{" "}
              <span className="tabular-nums text-slate-300">{livre(satisfactionMax)}</span>
            </>
          )}{" "}
          · tous à 60 % :{" "}
          <span className="tabular-nums text-slate-300">{livre(60)}</span> · tous à 0 % :{" "}
          <span className="tabular-nums text-slate-300">{livre(0)}</span>.
        </p>
      )}
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
                  min={0}
                  step={1}
                  className="input h-9 w-20 py-1"
                  value={ligne.quantite}
                  onChange={(e) => maj(i, { quantite: entierSaisi(e.target.value) })}
                />
                <ChoixRessource
                  code={ligne.ressource}
                  ressources={ressources}
                  toutes={toutes}
                  onChange={(ressource) => maj(i, { ressource })}
                />
                <span className="text-xs text-slate-500">par cycle</span>
                {/* ⚠️ Spec §4 : pris sans navette, sur tout le plateau — et
                    jamais alle chercher par une navette de ce batiment. */}
                <label
                  className="flex items-center gap-1 text-xs text-slate-400"
                  title="pris sans navette, sur tout le plateau — sauf chez un bâtiment qui le consomme lui aussi"
                >
                  <input
                    type="checkbox"
                    checked={ligne.direct}
                    onChange={(e) => maj(i, { direct: e.target.checked })}
                  />
                  en direct
                </label>

                {/* ⚠️ §5.5 — LE BONUS, cache tant qu'on ne l'a pas demande,
                    exactement comme « + indice » cote production : la quasi
                    totalite des consommations n'en portent pas. Un `×` le
                    retire, et la ligne redevient ordinaire. */}
                {ligne.bonus > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    bonus
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="input h-9 w-16 py-1"
                      value={ligne.bonus}
                      onChange={(e) => maj(i, { bonus: entierSaisi(e.target.value) })}
                    />
                    % de satisfaction
                    <button
                      type="button"
                      className="text-slate-500 hover:text-red-400"
                      title="retirer le bonus — la ligne redevient ordinaire"
                      onClick={() => maj(i, { bonus: 0 })}
                    >
                      ×
                    </button>
                  </span>
                ) : (
                  <BoutonLigne libelle="+ bonus" onClick={() => maj(i, { bonus: 20 })} />
                )}

                {/* ⚠️ Cache tant qu'on ne l'a pas demande : la plupart des
                    consommations n'ont aucune regle de voisinage. Depuis le
                    30/08 le bouton RESTE : un deuxieme clic empile une seconde
                    regle, et c'est comme ca qu'on ecrit un ET. */}
                <BoutonProximite
                  deja={ligne.proximites.length}
                  onClick={() =>
                    maj(i, { proximites: [...ligne.proximites, proximiteParDefaut()] })
                  }
                />

                <button
                  type="button"
                  className="ml-auto text-xs text-slate-500 hover:text-red-400"
                  onClick={() => onChange(lignes.filter((_, k) => k !== i))}
                >
                  retirer
                </button>
              </div>

              <LigneAZero ligne={ligne} />
              <RelectureBonus ligne={ligne} />

              <BlocsProximite
                proximites={ligne.proximites}
                contexte="consomme"
                quantite={ligne.quantite}
                tuiles={tuiles}
                nomTuile={nomTuile}
                onChange={(proximites) => maj(i, { proximites })}
              />
            </div>
          ))}
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
 * **Le bouton qui ouvre une regle de proximite** — 2026-08-28, devenu
 * empilable le 2026-08-30.
 *
 * ⚠️ Il ne disparait PLUS quand une regle est posee, contrairement au
 * « + indice » : un second clic ajoute une SECONDE regle, et c'est comme ca
 * qu'on ecrit un ET (*« c'est un OU, une autre regle fera un ET »*). Le
 * libelle change pour que le geste se devine sans avoir a l'essayer.
 */
function BoutonProximite({ deja, onClick }: { deja: number; onClick: () => void }) {
  return (
    <button
      type="button"
      className="text-xs text-accent hover:underline"
      title={
        deja === 0
          ? "une règle de voisinage sur cette ligne"
          : "une règle de PLUS : elles devront toutes être remplies (ET)"
      }
      onClick={onClick}
    >
      {deja === 0 ? "+ proximité" : "+ une autre proximité"}
    </button>
  );
}

/**
 * **Toutes les regles de proximite d'une ligne**, empilees — 2026-08-30.
 *
 * Elles se lisent en **ET**, et c'est **la plus contraignante qui commande**
 * (choix de l'utilisateur : 80 % d'un cote et 50 % de l'autre donnent 50 %).
 * La phrase de synthese ne s'affiche qu'a partir de deux regles utiles : avec
 * une seule, celle du bloc suffit et la repeter ferait du bruit.
 */
function BlocsProximite({
  proximites,
  contexte,
  quantite,
  tuiles,
  nomTuile,
  onChange,
}: {
  proximites: Proximite[];
  contexte: Contexte;
  quantite: number;
  tuiles: Tuile[];
  nomTuile: (tileId: number) => string;
  onChange: (proximites: Proximite[]) => void;
}) {
  if (proximites.length === 0) return null;

  // L'exemple est pris a UNE tuile du compte : c'est la que le prorata se voit,
  // et, a plusieurs regles, que le minimum se lit.
  const presentes = proximites.map((p) => Math.max(0, p.nombre - 1));
  const utiles = proximites.filter(proximiteUtile);
  const total = pourcentageProximites(proximites, presentes);
  const detail = proximites
    .map((p, i) => (proximiteUtile(p) ? `${pourcentageProximite(p, presentes[i])} %` : null))
    .filter((x): x is string => x !== null)
    .join(" et ");

  return (
    <div className="mt-1 space-y-1">
      {proximites.map((p, i) => (
        <div key={i}>
          {i > 0 && (
            <p className="my-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              et
            </p>
          )}
          <BlocProximite
            proximite={p}
            contexte={contexte}
            quantite={quantite}
            tuiles={tuiles}
            nomTuile={nomTuile}
            onChange={(modifiee) => onChange(proximites.map((x, k) => (k === i ? modifiee : x)))}
            onRetirer={() => onChange(proximites.filter((_, k) => k !== i))}
          />
        </div>
      ))}

      {utiles.length > 1 && (
        <p className="text-[11px] leading-tight text-slate-500">
          Ces {utiles.length} règles doivent être remplies <strong>en même temps</strong>, et
          c'est <strong>la plus contraignante qui commande</strong> : avec les exemples ci-dessus
          ({detail}), on retient{" "}
          <span className="tabular-nums text-slate-300">{total} %</span>.
        </p>
      )}

      {/* ⚠️ HORS MOTEUR depuis le 11/09 (decision de Guillaume) : dit UNE fois
          sous la section, pas sous chaque regle. A retirer AVEC le mecanisme. */}
    </div>
  );
}

/** Ou la regle est ecrite — ce qui change sa PORTEE, pas seulement sa phrase. */
type Contexte = "consomme" | "produit";

/**
 * **Une regle de proximite** — 2026-08-28, elargie le 2026-08-30.
 *
 * Mot de l'utilisateur au depart : *« 10 bovin × 120 s × (besoin de 5 tile
 * bovin a 2 rayon = 100 %) »*. ⚠️ HORS MOTEUR depuis le 11/09 — voir
 * Elle attache un batiment a son voisinage : un
 * abattoir sans paturages autour n'a rien a abattre.
 *
 * Le 30/08 : **plusieurs tuiles au choix, dont le total fait N** — un OU, leurs
 * presences s'additionnent (3 paturages + 2 bergeries remplissent « 5 »).
 *
 * ⚠️ **Des cases a cocher, jamais un menu** : c'est la convention du site pour
 * une liste de tuiles, et le `<select>` d'origine ne savait en porter qu'une.
 *
 * ⚠️ **Au prorata** (choix du 28/08) : 3 sur 5 valent 60 %, pas zero. Ce que ce
 * facteur plafonne, en revanche, depend du cote ou la regle est ecrite — voir
 * `Contexte` et la phrase de relecture.
 */
function BlocProximite({
  proximite,
  contexte,
  quantite,
  tuiles,
  nomTuile,
  onChange,
  onRetirer,
}: {
  proximite: Proximite;
  contexte: Contexte;
  quantite: number;
  tuiles: Tuile[];
  nomTuile: (tileId: number) => string;
  onChange: (proximite: Proximite) => void;
  onRetirer: () => void;
}) {
  const p = proximite;
  const utile = proximiteUtile(p);
  // Un tileId qui ne designe plus rien ne peut pas s'afficher dans la liste a
  // cocher — il n'est plus au catalogue. On le NOMME donc en dessous : le
  // laisser disparaitre changerait la regle en silence au premier
  // reenregistrement, meme garde que `ChoixRessource`.
  const orphelines = p.tileIds.filter((id) => !tuiles.some((t) => t.tileId === id));
  const maj = (patch: Partial<Proximite>) => onChange({ ...p, ...patch });
  // Un exemple a une tuile pres du compte : c'est la que le prorata se voit.
  const manquantes = Math.max(0, p.nombre - 1);
  const pct = pourcentageProximite(p, manquantes);
  const liste = p.tileIds.map((id) => `« ${nomTuile(id)} »`).join(" ou ");
  // La phrase se compose en JS, pas en JSX : un « telle{s} quelle{s} » decoupe
  // en accolades s'ecrirait « telle s quelle s » a l'ecran (JSX recolle les
  // lignes avec un espace).
  const phraseOrphelines =
    orphelines.length === 0
      ? ""
      : orphelines.length === 1
        ? `tuile ${orphelines[0]} — plus au catalogue. Elle reste comptée telle quelle.`
        : `${orphelines
            .map((id) => `tuile ${id}`)
            .join(", ")} — plus au catalogue. Elles restent comptées telles quelles.`;

  return (
    <div className="rounded border border-edge/60 bg-ink/60 p-2">
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
        tuiles <strong className="font-medium text-slate-400">au total</strong>, au choix parmi :
        <button
          type="button"
          className="ml-auto text-slate-500 hover:text-red-400"
          title="retirer cette règle de proximité"
          onClick={onRetirer}
        >
          &times;
        </button>
      </div>

      <div className="mt-1">
        <ChoixTuiles
          tuiles={tuiles}
          choisies={p.tileIds}
          onChange={(tileIds) => maj({ tileIds })}
          vide="Aucune tuile au catalogue à proposer."
        />
      </div>

      {phraseOrphelines !== "" && (
        <p className="mt-1 text-[11px] leading-tight text-amber-400">{phraseOrphelines}</p>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
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
        {p.rayon > 0 && (
          <span className="text-[11px] text-slate-600">
            (<span className="tabular-nums">{casesCouvertes(p.rayon)}</span> cases)
          </span>
        )}
      </div>

      {utile ? (
        <p className="mt-1 text-[11px] leading-tight text-slate-500">
          Il faut <span className="tabular-nums text-slate-300">{p.nombre}</span> tuiles au total
          parmi <span className="text-slate-300">{liste}</span> dans les{" "}
          <span className="tabular-nums">{casesCouvertes(p.rayon)}</span> cases à {p.rayon} de
          rayon pour {contexte === "consomme" ? "consommer" : "produire"} les {quantite} par
          cycle. <strong>Au prorata en dessous</strong> : avec{" "}
          <span className="tabular-nums text-slate-300">{manquantes}</span> sur {p.nombre},{" "}
          {contexte === "consomme" ? (
            <>
              la ligne ne demande plus que{" "}
              <span className="tabular-nums text-slate-300">
                {Math.round((quantite * pct) / 100)}
              </span>{" "}
              et la tuile plafonne à{" "}
              <span className="tabular-nums text-slate-300">{pct} %</span> de sa production.
            </>
          ) : (
            <>
              <strong>tout le palier</strong> plafonne à{" "}
              <span className="tabular-nums text-slate-300">{pct} %</span> — ses productions comme
              ses consommations, pas seulement cette ligne.
            </>
          )}
        </p>
      ) : (
        <p className="mt-1 text-[11px] leading-tight text-amber-400">
          Règle incomplète — il faut au moins une tuile cochée, un nombre et un rayon. Telle
          quelle, elle sera <strong>ignorée en jeu</strong>.
        </p>
      )}
    </div>
  );
}

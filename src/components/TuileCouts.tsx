import Aide, { Terme } from "@/components/Aide";
import { codeInconnu, libelleRessource, type Ressource } from "@/lib/ressources";
import {
  PERIODE_PAR_DEFAUT,
  chantierPasEncoreApplique,
  fluxVide,
  formatDuree,
  hautDeTranche,
  palierVide,
  productionVide,
  rendEnVeille,
  rendementPourIndicateur,
  totalParts,
  tranchesTriees,
  type LigneCout,
  type LigneFlux,
  type LigneProduction,
  type ModeCout,
  type Palier,
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
  onChange,
}: {
  paliers: Palier[];
  ressources: Ressource[];
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
  /** Ce qu'une tuile peut fabriquer : tout sauf la population, indicateurs compris. */
  const productibles = ressources.filter((r) => r.genre !== "population");
  const indicateurs = ressources.filter((r) => r.genre === "indicateur");

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
        <Terme nom="produit">
          Ce que la tuile <strong>fabrique</strong> pendant qu'elle tourne. Une ligne par
          ressource — n'importe laquelle, indicateurs compris.
          <br />
          ⚠️ <strong>Ni cible ni rayon</strong> : un producteur ne livre pas. Il fabrique dans son
          coffre, et c'est le preneur qui vient, avec <em>son</em> rayon de récolte. Seul un
          entrepôt envoie vraiment, et ça se règle dans l'onglet Stock &amp; appro.
        </Terme>
        <Terme nom="rendement par tranches">
          Une production peut être freinée par un indicateur, <strong>par paliers</strong> :
          <br />
          <code>de 80 à 100 % → 100 %</code> · <code>de 0 à 80 % → 80 %</code>
          <br />
          Tu ne saisis que le <strong>seuil bas</strong> ; le haut vient de la tranche du dessus.
          Impossible de laisser un trou ou de faire se chevaucher deux tranches, ce qui donnerait
          un rendement différent selon l'ordre de lecture.
          <br />
          ⚠️ <strong>Laisse « rien » sur les fermes.</strong> C'est le garde-fou contre la
          spirale : sans au moins une production insensible quelque part, moins de vivres → moins
          de satisfaction → les fermes produisent moins → encore moins de vivres, et le joueur
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
                  ressources={ressources}
                  videTexte="gratuit"
                  onChange={(l) => majCout(index, "paye", l)}
                />

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
                  videTexte="n'occupe rien"
                  onChange={(l) => majCout(index, "mobilise", l)}
                />

                <p className="mb-1 mt-3 text-[11px] text-slate-500">Consomme :</p>
                <LignesFlux
                  lignes={palier.utilisation}
                  ressources={ressources}
                  onChange={(utilisation) => majPalier(index, { utilisation })}
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
  onChange,
}: {
  code: string;
  ressources: Ressource[];
  onChange: (code: string) => void;
}) {
  // Un code disparu du vocabulaire doit rester VISIBLE : le faire tomber du
  // menu changerait la ligne en silence au premier reenregistrement.
  const inconnu = code !== "" && codeInconnu(ressources, code);
  return (
    <select
      className={`input h-9 w-44 py-1 ${inconnu ? "border-amber-700 text-amber-300" : ""}`}
      value={code}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">choisir une ressource</option>
      {inconnu && <option value={code}>{code} — inconnue</option>}
      {ressources.map((r) => (
        <option key={r.id} value={r.code}>
          {r.nom}
        </option>
      ))}
    </select>
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
  videTexte,
  onChange,
}: {
  lignes: LigneCout[];
  mode: ModeCout;
  ressources: Ressource[];
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
 * ⚠️ Le rendement se donne par TRANCHES d'indicateur, pas par une formule
 * continue. Mots de l'utilisateur : « 60 nourriture × 100 % pour satisfaction
 * 100–80 %, 60 nourriture × 80 % pour satisfaction 80–0 % ». Un seul nombre par
 * tranche (le seuil bas), le haut vient de la tranche du dessus : impossible de
 * laisser un trou ou de faire se chevaucher deux tranches.
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
            const triees = tranchesTriees(ligne.tranches);
            const basse = triees[triees.length - 1];
            return (
              <div key={i} className="rounded border border-edge/60 bg-ink/40 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Un indicateur n'a pas de quantite : sa valeur se calcule. */}
                  {!estIndicateur && (
                    <>
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
                    </>
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
                  <div className="mt-2 border-t border-edge/60 pt-2">
                    <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      rendement selon
                      <select
                        className="input h-9 w-44 py-1"
                        value={ligne.indicateur}
                        onChange={(e) =>
                          maj(i, {
                            indicateur: e.target.value,
                            tranches: e.target.value
                              ? ligne.tranches.length > 0
                                ? ligne.tranches
                                : [
                                    { seuil: 80, rendement: 100 },
                                    { seuil: 0, rendement: 80 },
                                  ]
                              : [],
                          })
                        }
                      >
                        <option value="">rien (produit toujours à plein)</option>
                        {indicateurs.map((r) => (
                          <option key={r.id} value={r.code}>
                            {r.nom}
                          </option>
                        ))}
                      </select>
                      {ligne.indicateur !== "" && (
                        <button
                          type="button"
                          className="ml-2 text-xs text-accent hover:underline"
                          onClick={() =>
                            maj(i, { tranches: [...ligne.tranches, { seuil: 0, rendement: 50 }] })
                          }
                        >
                          + tranche
                        </button>
                      )}
                    </div>

                    {ligne.indicateur !== "" && (
                      <div className="mt-1 space-y-1">
                        {triees.map((t, k) => (
                          <div
                            key={k}
                            className="flex flex-wrap items-center gap-1 text-xs text-slate-500"
                          >
                            de
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={5}
                              className="input h-8 w-16 py-0.5"
                              value={t.seuil}
                              onChange={(e) =>
                                maj(i, {
                                  tranches: triees.map((x, j) =>
                                    j === k
                                      ? {
                                          ...x,
                                          seuil: Math.min(
                                            100,
                                            Math.max(0, Number(e.target.value) || 0),
                                          ),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                            à {hautDeTranche(triees, k)} % →
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={5}
                              className="input h-8 w-16 py-0.5"
                              value={t.rendement}
                              onChange={(e) =>
                                maj(i, {
                                  tranches: triees.map((x, j) =>
                                    j === k
                                      ? {
                                          ...x,
                                          rendement: Math.min(
                                            100,
                                            Math.max(0, Number(e.target.value) || 0),
                                          ),
                                        }
                                      : x,
                                  ),
                                })
                              }
                            />
                            % — soit{" "}
                            <span className="tabular-nums text-slate-300">
                              {Math.round((ligne.quantite * t.rendement) / 100)}
                            </span>{" "}
                            / {formatDuree(ligne.periode_s)}
                            <button
                              type="button"
                              className="ml-auto text-xs text-slate-500 hover:text-red-400"
                              onClick={() =>
                                maj(i, { tranches: triees.filter((_, j) => j !== k) })
                              }
                            >
                              retirer
                            </button>
                          </div>
                        ))}
                        {basse && basse.seuil !== 0 && (
                          <p className="text-[11px] text-amber-400">
                            La tranche la plus basse ne part pas de 0 : en dessous de {basse.seuil}{" "}
                            %, c'est elle qui s'appliquera quand même. Mets son seuil à 0 pour le
                            dire clairement.
                          </p>
                        )}
                      </div>
                    )}

                    <p className="mt-1 text-[11px] leading-tight text-slate-500">
                      C'est un <strong>maximum</strong> : la production réelle vaut ce débit × la
                      couverture de ses intrants
                      {ligne.indicateur !== "" ? (
                        <>
                          , puis la tranche de{" "}
                          <span className="text-slate-300">{nomRessource(ligne.indicateur)}</span>{" "}
                          où l'on se trouve — à 60 %,{" "}
                          <span className="tabular-nums text-slate-300">
                            {Math.round(
                              (ligne.quantite * rendementPourIndicateur(ligne.tranches, 0.6)) / 100,
                            )}
                          </span>
                          .
                        </>
                      ) : (
                        <>
                          {" "}
                          — <span className="text-accent">rien ne la freine</span>.
                        </>
                      )}{" "}
                      Et sans sa main-d'œuvre, elle est nulle.
                    </p>
                  </div>
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

function LignesFlux({
  lignes,
  ressources,
  onChange,
}: {
  lignes: LigneFlux[];
  ressources: Ressource[];
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
            <div key={i} className="flex flex-wrap items-center gap-2">
              <>
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
                      step={5}
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

                <button
                  type="button"
                  className="ml-auto text-xs text-slate-500 hover:text-red-400"
                  onClick={() => onChange(lignes.filter((_, k) => k !== i))}
                >
                  retirer
                </button>
              </>
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

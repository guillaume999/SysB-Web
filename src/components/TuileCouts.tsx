import Aide, { Terme } from "@/components/Aide";
import { codeInconnu, libelleRessource, type Ressource } from "@/lib/ressources";
import {
  PERIODE_PAR_DEFAUT,
  chantierPasEncoreApplique,
  fluxVide,
  formatDuree,
  palierVide,
  rendEnVeille,
  totalParts,
  type LigneCout,
  type LigneFlux,
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

      <Aide titre="Payé, occupé, consommé — et d'où ça vient">
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
        <Terme nom="d'où ça vient">
          Pas ici. Ce que le bâtiment consomme est dit dans cet onglet ; <strong>par où ça
          arrive</strong> se règle dans l'onglet <em>Stock &amp; appro</em>, qui porte aussi le
          rayon de récolte et les navettes.
        </Terme>
        <Terme nom="indicateur produit">
          Certaines tuiles — les habitations — ne fabriquent pas un objet mais un{" "}
          <strong>pourcentage</strong> : la satisfaction. Sa valeur ne se saisit pas, elle se{" "}
          <strong>calcule</strong> à partir des parts ci-dessous, pour qu'un logement bien nourri
          soit satisfait sans qu'on ait à l'écrire deux fois.
        </Terme>
        <Terme nom="part de satisfaction">
          Ce que chaque consommation couvre, en pourcentage. Le total devrait faire 100.
          <br />
          La satisfaction obtenue est la <strong>somme pondérée de ce qui est réellement
          servi</strong> : nourriture 80 % + pierre 10 % + argile 10 %, avec la nourriture servie
          à moitié, donne 40 + 10 + 10 = <strong>60 %</strong>.
        </Terme>
        <Terme nom="efficacité minimale">
          Le plancher sous lequel la production de <em>cette</em> tuile ne descend jamais, quelle
          que soit la satisfaction du plateau. <code>100</code> = insensible (les fermes
          continuent de nourrir même quand tout va mal), <code>0</code> = totalement soumise.
          <br />
          ⚠️ <strong>C'est le garde-fou contre la spirale.</strong> Sans plancher quelque part, la
          boucle est mortelle : moins de vivres → moins de satisfaction → les fermes produisent
          moins → encore moins de vivres. Le joueur qui revient après douze heures découvrirait
          l'effondrement déjà consommé, sans avoir pu réagir.
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
                  avecParts={palier.indicateur !== ""}
                  onChange={(utilisation) => majPalier(index, { utilisation })}
                />

                {/* L'indicateur produit, et le garde-fou contre la spirale. */}
                <div className="mt-3 space-y-1 border-t border-edge/60 pt-2">
                  <label className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    produit l'indicateur
                    <select
                      className="input h-9 w-44 py-1"
                      value={palier.indicateur}
                      onChange={(e) => majPalier(index, { indicateur: e.target.value })}
                    >
                      <option value="">aucun</option>
                      {indicateurs.map((r) => (
                        <option key={r.id} value={r.code}>
                          {r.nom}
                        </option>
                      ))}
                    </select>
                    {indicateurs.length === 0 && (
                      <span className="text-[11px] text-amber-300">
                        aucune ressource de genre « indicateur » déclarée
                      </span>
                    )}
                  </label>

                  {palier.indicateur !== "" && (
                    <p
                      className={`text-[11px] leading-tight ${
                        totalParts(palier) === 100 ? "text-slate-500" : "text-amber-400"
                      }`}
                    >
                      Total des parts : <span className="tabular-nums">{totalParts(palier)} %</span>
                      {totalParts(palier) === 100
                        ? " — un logement entièrement servi atteint 100 %."
                        : totalParts(palier) < 100
                          ? ` — même entièrement servi, ce logement plafonnera à ${totalParts(palier)} %.`
                          : " — au-delà de 100 %, le surplus est perdu. Rééquilibre les parts."}
                    </p>
                  )}

                  <label className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    efficacité minimale garantie
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      className="input h-9 w-20 py-1"
                      value={palier.plancher_efficacite}
                      onChange={(e) =>
                        majPalier(index, {
                          plancher_efficacite: Math.min(
                            100,
                            Math.max(0, Number(e.target.value) || 0),
                          ),
                        })
                      }
                    />
                    %
                  </label>
                  <p className="text-[11px] leading-tight text-slate-500">
                    {palier.plancher_efficacite >= 100
                      ? "Insensible à la satisfaction : produit toujours à plein, même quand le plateau va mal."
                      : palier.plancher_efficacite === 0
                        ? "Totalement soumise à la satisfaction du plateau — jusqu'à 0 %."
                        : `Produit au minimum à ${palier.plancher_efficacite} %, même si la satisfaction tombe plus bas.`}
                  </p>
                </div>
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

function LignesFlux({
  lignes,
  ressources,
  avecParts,
  onChange,
}: {
  lignes: LigneFlux[];
  ressources: Ressource[];
  /** Le palier produit un indicateur : chaque ligne porte alors une part. */
  avecParts: boolean;
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
                {avecParts && (
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    couvre
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      className="input h-9 w-16 py-1"
                      value={ligne.part}
                      onChange={(e) =>
                        maj(i, { part: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })
                      }
                    />
                    % de satisfaction
                  </label>
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

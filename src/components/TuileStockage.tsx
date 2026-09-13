import { useState } from "react";
import Aide, { Terme } from "@/components/Aide";
import ChoixRessources from "@/components/ChoixRessources";
import ChoixTuiles from "@/components/ChoixTuiles";
import {
  estMobilise,
  estTransportable,
  libelleRessource,
  parAlphabet,
  type Ressource,
} from "@/lib/ressources";
import {
  CIBLES_APPRO,
  SENS_APPRO,
  TOUTES_RESSOURCES,
  chargeParVolee,
  cransParTrajet,
  decrireAppro,
  dureeTrajet,
  formatDuree,
  estEntrepot,
  lignesNominatives,
  maxToutesRessources,
  regleApproUtile,
  regleApproVide,
  secondesParCran,
  type CibleAppro,
  type Logistique,
  type RegleAppro,
  type SensAppro,
  type Tuile,
} from "@/lib/tuiles";

/**
 * Stockage et approvisionnement — **onglet cree le 2026-08-26**, a la demande de
 * l'utilisateur : *« on va faire un nouvel onglet, enleve l'approvisionnement de
 * l'onglet cout »*. Il avait d'abord ete greffe ligne par ligne dans les couts ;
 * c'etait le mauvais endroit, parce que l'entrepot ne consomme rien et n'aurait
 * donc eu aucune ligne ou se decrire.
 *
 * Trois exigences, mot pour mot :
 *
 *  · *« l'approvisionnement doit aller dans les 2 sens si necessaire (cas de
 *    l'entrepot) »* → chaque regle porte un SENS. Une tuile qui recoit ET
 *    fournit EST un entrepot ; le role ne se declare plus, il se deduit.
 *  · *« doit pouvoir etre pour toutes les ressources ou certaines »* → une
 *    liste de ressources par regle, **vide = toutes**.
 *  · *« un rayon de recolte ou d'envoi […] un nombre de navettes par periodes
 *    et une quantite sur les navettes »* → rayon par regle, et un debit ecrit
 *    en navettes plutot qu'en nombre abstrait.
 *
 * ⚠️⚠️ **2026-09-06 — LA DISTANCE COMPTE, et cette note dit maintenant le
 * CONTRAIRE de ce qu'elle disait.** Les navettes n'etaient qu'une ANIMATION :
 * on multipliait navettes x quantite par periode, sans jamais regarder ou etait
 * la cible. Le champ `debit.periode_s` a ete RETIRE et remplace par une
 * `vitesse` en **crans par periode**, ou un cran = une case du plateau. Une
 * navette fait l'ALLER-RETOUR : une cible a `d` cases coute `2d` crans.
 *
 * Ce qui n'a PAS change, et qui est la raison pour laquelle c'etait finalement
 * portable : rien ne se deplace, il n'y a toujours ni agent ni pathfinding. Le
 * moteur ne compte pas une duree, il compte des CRANS franchis en temps absolu,
 * exactement comme il comptait des periodes. La progression hors ligne reste
 * calculable en forme fermee.
 *
 * ⚠️⚠️ **2026-09-07 — « 2 navettes en tout, flotte PARTAGEE ».** Le modele du
 * 06/09 comptait les voyages PAR CIBLE : chaque source recevait ses propres
 * navettes, dix sources valaient dix flottes. Refuse. `navettes` est un
 * PLAFOND, et la flotte se repartit A PARTS EGALES entre les N cibles a portee
 * (geometrie seule, jamais le stock — la seule forme invariante aux cadences :
 * un budget commun « les plus remplies d'abord » a ete mesure a 700 / 480 /
 * 700 selon la passe). Ajouter une cible RALENTIT les autres ; le rayon et
 * `cible: tuiles` sont donc de vrais reglages de puissance.
 */
export default function TuileStockage({
  logistique,
  ressources,
  tuiles,
  tuileCourante,
  onChange,
}: {
  logistique: Logistique;
  ressources: Ressource[];
  tuiles: Tuile[];
  tuileCourante: string | null;
  onChange: (l: Logistique) => void;
}) {
  const { appros } = logistique;

  /**
   * Cocher une ressource lui donne un plafond ; decocher retire la ligne.
   * Le plafond par defaut n'est pas zero : une ligne a zero serait jetee a
   * l'enregistrement, et l'utilisateur croirait avoir stocke quelque chose.
   */
  const majStock = (code: string, max: number | null) => {
    const sans = logistique.stockage.filter((x) => x.ressource !== code);
    onChange({
      ...logistique,
      stockage: max === null ? sans : [...sans, { ressource: code, max }],
    });
  };

  const majAppro = (i: number, patch: Partial<(typeof appros)[number]>) =>
    onChange({
      ...logistique,
      appros: appros.map((r, k) => (k === i ? { ...r, ...patch } : r)),
    });

  const nomTuile = (tileId: number) =>
    tuiles.find((t) => t.tileId === tileId)?.nom ?? `tuile ${tileId}`;
  const nomRessource = (code: string) => libelleRessource(ressources, code);
  const citables = tuiles.filter((t) => t.id !== tuileCourante);

  /**
   * ⚠️ **Deux genres ne montent dans aucune navette** : `mobilise` et
   * `indicateur`. Un habitant ne se transporte pas — il est mobilisable la ou
   * il est loge — et un pourcentage encore moins. Les exclure de la LISTE est
   * plus sur que de le verifier apres coup : ce qui n'est pas proposable ne
   * peut pas etre saisi par erreur.
   *
   * C'est aussi ce qui repond a « le stockage de la pop ne doit pas varier » :
   * si rien ne peut la recolter ni l'envoyer, elle ne peut pas bouger. Ce n'est
   * pas une promesse, c'est une impossibilite.
   */
  const transportables = parAlphabet(ressources.filter(estTransportable));
  /**
   * Le stockage accepte le genre `mobilise` (c'est un logement), jamais un
   * indicateur, ni un `FluxStock` : celui-là n'a pas de coffre du tout, il vit
   * dans la réserve du plateau — un plafond déclaré ici ne serait lu par rien.
   */
  const stockables = parAlphabet(
    ressources.filter((r) => r.genre !== "indicateur" && r.genre !== "FluxStock"),
  );
  const toutes = maxToutesRessources(logistique);
  const nominatives = lignesNominatives(logistique);
  const aToutes = logistique.stockage.some((x) => x.ressource === TOUTES_RESSOURCES);

  /**
   * Les lignes qui font de cette tuile un LOGEMENT.
   *
   * ⚠️ Une ligne nommée seulement : le volume partagé « toutes les ressources »
   * ne loge personne — un entrepôt de 500 n'est pas une ville de 500 habitants.
   */
  const placesLogees = logistique.stockage.filter(
    (x) =>
      x.max > 0 &&
      x.ressource !== TOUTES_RESSOURCES &&
      estMobilise(ressources.find((r) => r.code === x.ressource)),
  );

  const [filtre, setFiltre] = useState("");
  const q = filtre.trim().toLowerCase();
  // Ce qui est coche reste TOUJOURS visible : sinon on ne sait plus ce qu'on a
  // choisi des qu'on tape un filtre.
  const visibles = stockables.filter(
    (r) =>
      logistique.stockage.some((x) => x.ressource === r.code) ||
      q === "" ||
      r.nom.toLowerCase().includes(q),
  );

  return (
    <div className="space-y-4">
      {/* ── Le stockage ──────────────────────────────────────────────── */}
      <div>
        <p className="label mb-0">Stockage</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Ce que cette tuile garde chez elle, et combien.
        </p>

        <Aide titre="Un plafond par ressource, et pourquoi ça compte">
          <Terme nom="toutes les ressources">
            La première ligne du tableau : la tuile accepte <strong>n'importe quoi</strong>, dans
            la limite d'un volume <strong>partagé</strong>. C'est l'entrepôt générique — 500 au
            total, peu importe ce que c'est.
          </Terme>
          <Terme nom="coche et plafond">
            Une ressource cochée a son <strong>propre</strong> maximum, et il l'emporte sur la
            ligne « toutes ». C'est ce qui permet d'écrire « n'importe quoi jusqu'à 500, mais pas
            plus de 50 de bois ».
            <br />
            Une ressource ni cochée ni couverte par « toutes » n'est{" "}
            <strong>pas stockée du tout</strong>.
          </Terme>
          <Terme nom="à quoi sert le plafond">
            Un producteur plein <strong>s'arrête</strong>. C'est cette pression qui donne une
            raison d'exister aux entrepôts — sans plafond, personne n'aurait besoin de venir
            ramasser quoi que ce soit.
          </Terme>
          <Terme nom="loger de la population">
            Un logement, c'est une tuile qui stocke une ressource de genre{" "}
            <strong>mobilisé</strong> — la population : coche-la, mets 12, et voilà douze
            habitants logés.
            <br />
            ⚠️ <strong>Le logement EST la capacité.</strong> Les habitants sont là dès la pose, à
            hauteur de ce plafond — il n'y a aucune ligne de production à saisir pour les faire
            apparaître, et rien ne les fait naître ni mourir. Le jeu ne fait que lire ce nombre, à
            chaque fois qu'il en a besoin.
            <br />
            ⚠️ <strong>Le stockage appartient à la tuile, pas au palier.</strong> Améliorer un
            bâtiment ne change donc pas le nombre de places : il faut une autre tuile pour loger
            plus.
            <br />
            ⚠️ <strong>Une tuile en veille ne loge personne</strong>, exactement comme une usine en
            veille ne retient plus ses ouvriers. Éteindre une maison rend ses habitants
            indisponibles.
            <br />
            ⚠️ <strong>Ce nombre ne varie jamais</strong>, et pas par convention : la population ne
            figure dans <em>aucune</em> liste d'approvisionnement. Rien ne peut la récolter, rien
            ne peut l'envoyer — un habitant ne prend pas la navette, il est mobilisable là où il
            est logé.
          </Terme>
        </Aide>

        {/* Meme boite que ChoixRessources : une liste qui defile, des lignes
            cochables, un filtre au-dela de dix entrees. L'utilisateur a demande
            explicitement ce gabarit — un tableau prenait toute la hauteur de la
            modale pour dix ressources. La seule difference : chaque ligne porte
            en plus son plafond. */}
        <div className="mt-2">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] uppercase ${
                logistique.stockage.length === 0
                  ? "border-edge text-slate-500"
                  : "border-accent/40 text-accent"
              }`}
            >
              {logistique.stockage.length === 0
                ? "ne stocke rien"
                : toutes > 0
                  ? `toutes, ${toutes} au total`
                  : `${nominatives.length} ressource${nominatives.length > 1 ? "s" : ""}`}
            </span>
            {logistique.stockage.length > 0 && (
              <button
                type="button"
                className="text-xs text-accent hover:underline"
                onClick={() => onChange({ ...logistique, stockage: [] })}
              >
                tout decocher
              </button>
            )}
            {stockables.length > 10 && (
              <input
                className="input h-7 w-40 py-0.5 text-xs"
                value={filtre}
                onChange={(e) => setFiltre(e.target.value)}
                placeholder="filtrer..."
              />
            )}
          </div>

          {stockables.length === 0 ? (
            <p className="text-[11px] text-slate-500">
              Aucune ressource declaree : commence par l'onglet Ressources.
            </p>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded border border-edge bg-ink/40 p-1">
              {/* La ligne fourre-tout, en tete et detachee : c'est un volume
                  global, pas une ressource de plus. */}
              <div className="mb-1 flex items-center gap-2 border-b border-edge pb-1">
                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-ink">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-accent"
                    checked={aToutes}
                    onChange={(e) => majStock(TOUTES_RESSOURCES, e.target.checked ? 500 : null)}
                  />
                  <span className={`italic ${aToutes ? "text-accent" : "text-slate-400"}`}>
                    toutes les ressources
                  </span>
                  <span className="font-mono text-[10px] text-slate-600">au total</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  disabled={!aToutes}
                  className="input h-7 w-24 py-0.5 text-xs disabled:opacity-30"
                  value={toutes}
                  onChange={(e) =>
                    majStock(TOUTES_RESSOURCES, Math.max(0, Number(e.target.value) || 0))
                  }
                  aria-label="plafond partage"
                />
              </div>

              {visibles.length === 0 && (
                <p className="p-1 text-[11px] text-slate-500">Rien ne correspond a ce filtre.</p>
              )}

              {visibles.map((r) => {
                const propre = logistique.stockage.find((x) => x.ressource === r.code);
                const coche = propre !== undefined;
                return (
                  <div key={r.id} className="flex items-center gap-2">
                    <label
                      className={`flex flex-1 cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-ink ${
                        coche ? "text-slate-200" : "text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-accent"
                        checked={coche}
                        onChange={(e) => majStock(r.code, e.target.checked ? 100 : null)}
                      />
                      <span>{r.nom}</span>
                      <span className="font-mono text-[10px] text-slate-600">{r.genre}</span>
                      {!coche && toutes > 0 && (
                        <span className="text-[10px] text-slate-600">— couverte par « toutes »</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      disabled={!coche}
                      className="input h-7 w-24 py-0.5 text-xs disabled:opacity-30"
                      value={coche ? propre.max : toutes}
                      onChange={(e) => majStock(r.code, Math.max(0, Number(e.target.value) || 0))}
                      aria-label={`plafond ${r.nom}`}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ⚠️ Une ligne de population n'est pas un stockage comme un autre :
              c'est ce qui FAIT le logement. On le dit en clair, sinon l'admin
              cherche une ligne de production « habitants » qui n'existe pas. */}
          {placesLogees.length > 0 && (
            <p className="mt-2 rounded border border-accent/40 bg-accent/5 p-2 text-[11px] leading-tight text-accent">
              Cette tuile <strong>loge</strong>{" "}
              {placesLogees
                .map((x) => `${x.max} ${nomRessource(x.ressource)}`)
                .join(", ")}{" "}
              dès qu'elle est posée. Ce nombre ne varie jamais : la population ne se produit pas,
              ne voyage pas, et se libère quand la tuile est détruite ou mise en veille.
            </p>
          )}

          <p className="mt-2 text-[11px] text-slate-500">
            {logistique.stockage.length === 0 ? (
              "Cette tuile ne stocke rien : ce qu'elle produit doit partir tout de suite."
            ) : (
              <>
                {toutes > 0 && (
                  <>
                    Garde{" "}
                    <span className="text-slate-300">
                      n'importe quelle ressource, {toutes} au total
                    </span>
                    {nominatives.length > 0 ? " — sauf " : "."}
                  </>
                )}
                {toutes === 0 && nominatives.length > 0 && <>Garde jusqu'à </>}
                {nominatives.length > 0 && (
                  <>
                    <span className="text-slate-300">
                      {nominatives
                        .map((x) => `${x.max} ${nomRessource(x.ressource)}`)
                        .join(", ")}
                    </span>
                    {toutes > 0
                      ? ", plafonnées à part."
                      : " — et rien d'autre."}
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* ── Le stock commun ────────────────────────────────────────── */}
        <label
          className={`mt-2 flex cursor-pointer items-start gap-2 rounded border px-2 py-1.5 ${
            logistique.stock_commun
              ? "border-accent/40 bg-accent/5"
              : "border-line/60 hover:bg-ink"
          }`}
        >
          <input
            type="checkbox"
            className="mt-0.5 h-3.5 w-3.5 accent-accent"
            checked={logistique.stock_commun}
            onChange={(e) => onChange({ ...logistique, stock_commun: e.target.checked })}
          />
          <span className="text-xs">
            <span className="text-slate-200">
              Toutes les tuiles de ce type partagent un seul stock
            </span>
            <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
              Leur nombre n&rsquo;augmente que la quantité stockable : deux bâtiments réglés à{" "}
              {toutes > 0 ? toutes : 500} font un coffre de{" "}
              {(toutes > 0 ? toutes : 500) * 2}. N&rsquo;importe lequel donne accès à{" "}
              <strong>tout</strong> le stock — un consommateur voisin d&rsquo;un seul d&rsquo;entre
              eux atteint ce qui a été ramassé à l&rsquo;autre bout du plateau.
            </span>
            <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
              Le débit, lui, n&rsquo;est pas mis en commun : chacun garde ses navettes et son
              rayon. Trois entrepôts ramassent trois fois plus vite, et couvrent trois zones.
            </span>
            {logistique.stock_commun && logistique.stockage.length === 0 && (
              <span className="mt-0.5 block text-[11px] leading-tight text-amber-400">
                ⚠️ Aucun plafond n&rsquo;est saisi : il n&rsquo;y a pour l&rsquo;instant aucun
                volume à mettre en commun.
              </span>
            )}
            {logistique.stock_commun && (
              <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">
                ⚠️ Détruire une de ces tuiles ne perd pas ce qu&rsquo;elle portait — la
                marchandise est remise chez les autres. Seul le surplus qui ne tient plus est
                perdu, et le jeu le dit avant de confirmer.
              </span>
            )}
          </span>
        </label>
      </div>

      {/* ── L'approvisionnement ──────────────────────────────────────── */}
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="label mb-0">Approvisionnement</p>
          <span className="flex gap-3">
            {(["entrant", "envoi"] as const).map((sens) => (
              <button
                key={sens}
                type="button"
                className="text-xs text-accent hover:underline"
                onClick={() =>
                  onChange({ ...logistique, appros: [...appros, regleApproVide(sens)] })
                }
              >
                + {SENS_APPRO.find((x) => x.valeur === sens)?.libelle}
              </button>
            ))}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Ce qu'elle va chercher, ce qu'elle fabrique, ce qu'elle livre. Prendre et envoyer à la
          fois, c'est ce qui fait un entrepôt.
        </p>

        <Aide titre="Les deux sens, le rayon, les navettes">
          <Terme nom="je récolte">
            Cette tuile <strong>va chercher</strong> ailleurs. Son <strong>rayon de récolte</strong>{" "}
            dit jusqu'où elle se déplace, et sa liste dit ce qu'elle peut prendre.
          </Terme>
          <Terme nom="j'envoie">
            Cette tuile <strong>livre</strong> chez les autres, dans son{" "}
            <strong>rayon d'envoi</strong>. C'est le seul cas où quelque chose part de soi-même, et
            en pratique c'est <strong>l'entrepôt</strong> : celui qui apporte les bovins à
            l'abattoir.
          </Terme>
          <Terme nom="combien on produit vraiment">
            Pas ici : la production se déclare dans l'onglet <em>Coût</em>, en quantité{" "}
            <strong>par cycle</strong>. Ce qu'on règle ici, c'est par où elle arrive et repart.
            <br />
            Rappel de la règle (spec du 11/09) : une ligne ordinaire livre{" "}
            <code>quantité × satisfaction du bâtiment</code>, arrondi vers le bas — ce qu'il a reçu
            sur ce qu'il demandait. Un abattoir à 20 viandes par cycle qui n'a reçu que la moitié
            de ses bovins en sort <strong>10</strong>. Une ligne qui suit un indicateur est
            cadencée par son escalier, et par lui seul.
            <br />
            ⚠️ Et sans sa main-d'œuvre, un bâtiment ne produit <strong>rien du tout</strong>.
          </Terme>
          <Terme nom="en direct">
            Une consommation cochée <em>en direct</em> dans l'onglet <em>Coût</em> est prise sans
            navette, sur tout le plateau. ⚠️ <strong>Aucune règle d'ici ne part la
            chercher</strong> : une règle qui la cite n'envoie rien pour elle — ce serait payer
            deux fois le même approvisionnement.
          </Terme>
          <Terme nom="qui passe en premier">
            ⚠️ Les <strong>consommateurs directs se servent avant les entrepôts</strong>. Sans ça,
            l'entrepôt aspirerait tous les bovins du pré avant que l'abattoir ait pu en prendre, et
            l'abattoir tomberait en panne à côté d'un champ plein.
            <br />
            Rien à régler ici : c'est une règle du jeu, pas un champ.
          </Terme>
          <Terme nom="entrepôt">
            Il n'y a pas de case « c'est un entrepôt » : une tuile qui a une règle{" "}
            <em>je récolte</em> <strong>et</strong> une règle <em>j'envoie</em> en est un. Le rôle
            se déduit au lieu de se déclarer, donc il ne peut pas contredire les règles.
          </Terme>
          <Terme nom="navettes">
            La flotte de la règle : <strong>N navettes qui portent chacune Q</strong> par voyage.
            Une volée complète rapporte donc N × Q. Il n'y a plus de période à saisir ici — la
            cadence sort du trajet, voir <em>vitesse</em>.
            <br />
            ⚠️ <strong>« 2 navettes en tout »</strong> : c'est un plafond. La flotte se{" "}
            <strong>partage à parts égales entre toutes les cibles à portée</strong> — dix
            fermes dans le rayon, c'est un dixième de navette pour chacune. Ajouter une cible
            ralentit les autres ; réduire le rayon ou viser des tuiles précises concentre la
            flotte.
          </Terme>
          <Terme nom="vitesse (crans)">
            <strong>Un cran = une case du plateau.</strong> « 1 cran / 20 s » veut dire qu'une
            navette met 20 s à franchir une case. Elle fait l'<strong>aller-retour</strong> : une
            cible à 4 cases coûte 8 crans, soit 160 s de navette. Dès qu'une navette est rentrée,
            elle repart.
            <br />
            ⚠️ <strong>La distance coûte, depuis le 06/09.</strong> Les navettes n'étaient
            qu'une animation : on multipliait N × Q par période sans jamais regarder où était la
            cible. Maintenant une cible deux fois plus loin est servie <strong>deux fois moins
            souvent</strong>.
            <br />
            La part de chaque cible est fixée par la <strong>géométrie</strong>, jamais par ce
            qu'elle contient : avec N cibles à portée, la cible à <em>d</em> cases reçoit un
            aller-retour toutes les 2 × d × période × N / (crans × navettes) secondes. Une
            part qui n'a rien à transporter est perdue, comme la production d'une ferme
            saturée. (Un budget commun que les cibles se disputent a été essayé le 07/09 et
            mesuré non invariant aux cadences — 700, 480 ou 700 selon la passe — c'est
            pourquoi la part est fixe.)
            <br />
            ⚠️ <strong>0 cran = navette bloquée</strong>, rien ne circule. C'est aussi vrai de
            0 navette et de 0 par voyage : dans ce bloc, un zéro veut toujours dire « rien ne
            passe ». L'ancienne indulgence « débit non renseigné = illimité » a été retirée le
            même jour, elle aurait donné deux sens opposés à deux zéros voisins.
            <br />
            Rien ne se déplace pour autant : il n'y a ni agent ni pathfinding. Le moteur compte
            des <strong>crans franchis en temps absolu</strong>, comme il comptait des périodes —
            c'est ce qui permet de calculer douze heures d'absence d'un coup.
          </Terme>
          <Terme nom="qui est servi en premier">
            Chaque cible ayant sa part de flotte, servir l'une ne prive plus l'autre de
            navettes. L'ordre départage ce qui reste partagé : la <strong>place</strong> chez le
            preneur et une source convoitée par plusieurs preneurs. À la{" "}
            <strong>récolte</strong>, les sources les <strong>plus remplies</strong> d'abord ;
            à la <strong>livraison</strong>, les tuiles les <strong>plus en manque</strong>. À
            égalité, l'ordre des cases, pour que deux parties identiques donnent le même
            résultat.
            <br />
            Rien à régler ici : c'est une règle du jeu, pas un champ.
          </Terme>
          <Terme nom="rayon">
            Distance <strong>hexagonale</strong>. Un rayon <em>r</em> couvre 3r(r+1) cases :
            6 · 18 · 36 · 60 · 90. « Tout le plateau » veut dire qu'il n'y a pas de limite de
            distance — le réglage naturel pour un entrepôt qui dessert la colonie entière.
          </Terme>
        </Aide>

        {appros.length === 0 ? (
          <p className="mt-1 text-xs text-slate-600">
            aucune — cette tuile ne reçoit rien et ne fournit rien
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {appros.map((regle, i) => {
              const inutile = !regleApproUtile(regle);
              // Rouge = ERREUR DE SAISIE (un bloc manquant en base), orange =
              // règle muette par CHOIX (un zéro). Les deux ne circulent pas,
              // mais l'une est un oubli et l'autre un réglage.
              const enErreur = !!regle.erreur;
              return (
                <div
                  key={i}
                  className={`rounded border p-2 ${
                    enErreur
                      ? "border-red-700/70 bg-red-950/20"
                      : inutile
                        ? "border-amber-700/70 bg-amber-950/20"
                        : "border-edge bg-ink/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="input h-9 w-36 py-1"
                      value={regle.sens}
                      onChange={(e) => majAppro(i, { sens: e.target.value as SensAppro })}
                    >
                      {SENS_APPRO.map((s) => (
                        <option key={s.valeur} value={s.valeur}>
                          {s.libelle}
                        </option>
                      ))}
                    </select>

                        <select
                          className="input h-9 w-48 py-1"
                          value={regle.cible}
                          onChange={(e) => majAppro(i, { cible: e.target.value as CibleAppro })}
                        >
                          {CIBLES_APPRO.map((c) => (
                            <option key={c.valeur} value={c.valeur}>
                              {c.libelle}
                            </option>
                          ))}
                        </select>

                        {/* rayon null = tout le plateau. Zero reste la case elle-meme. */}
                        <label className="flex items-center gap-1 text-xs text-slate-500">
                          {regle.sens === "entrant" ? "rayon de récolte" : "rayon d'envoi"}
                          <input
                            type="number"
                            min={0}
                            step={1}
                            disabled={regle.rayon === null}
                            className="input h-9 w-16 py-1 disabled:opacity-40"
                            value={regle.rayon ?? 0}
                            onChange={(e) =>
                              majAppro(i, { rayon: Math.max(0, Number(e.target.value) || 0) })
                            }
                          />
                        </label>
                        <label className="flex items-center gap-1 text-xs text-slate-400">
                          <input
                            type="checkbox"
                            checked={regle.rayon === null}
                            onChange={(e) => majAppro(i, { rayon: e.target.checked ? null : 3 })}
                          />
                          tout le plateau
                        </label>

                    <button
                      type="button"
                      className="ml-auto text-xs text-slate-500 hover:text-red-400"
                      onClick={() =>
                        onChange({ ...logistique, appros: appros.filter((_, k) => k !== i) })
                      }
                    >
                      retirer
                    </button>
                  </div>

                  {/* SANS LIMITE (08/09) : le seul illimite qui existe, et il
                      s'ecrit. Coche, la flotte et la vitesse disparaissent du
                      formulaire ET de la base. */}
                  <label className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={regle.illimite}
                      onChange={(e) =>
                        majAppro(i, { illimite: e.target.checked, erreur: undefined })
                      }
                    />
                    sans limite
                    <span className="text-slate-600">
                      — ni flotte ni trajet : tout ce qui est à portée part dans la passe
                      (réglage de test ou de tuile « magique », pas un défaut)
                    </span>
                  </label>

                  {regle.erreur && (
                    <p className="mt-1 text-[11px] text-red-400">
                      Erreur de saisie — {regle.erreur}. Rien ne circule tant que la règle
                      n&rsquo;est pas réenregistrée avec des chiffres, ou cochée « sans limite ».
                    </p>
                  )}

                  {/* LA FLOTTE : N navettes x Q par voyage. Plus aucune periode
                      ici depuis le 06/09 — la cadence sort du trajet. */}
                  {!regle.illimite && (
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="input h-9 w-16 py-1"
                      value={regle.debit.navettes}
                      onChange={(e) =>
                        majAppro(i, {
                          debit: { ...regle.debit, navettes: Math.max(0, Number(e.target.value) || 0) },
                        })
                      }
                    />
                    navette(s) de
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="input h-9 w-20 py-1"
                      value={regle.debit.quantite}
                      onChange={(e) =>
                        majAppro(i, {
                          debit: { ...regle.debit, quantite: Math.max(0, Number(e.target.value) || 0) },
                        })
                      }
                    />
                    par voyage — soit{" "}
                    <span className="tabular-nums text-slate-300">{chargeParVolee(regle)}</span>{" "}
                    {regle.sens === "entrant" ? "ramassés" : "livrés"} par volée
                  </div>
                  )}

                  {/* LA VITESSE : des crans (= des cases) par periode. C'est elle
                      qui fabrique la cadence, en aller-retour. */}
                  {!regle.illimite && (
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    vitesse
                    <input
                      type="number"
                      min={0}
                      step={1}
                      className="input h-9 w-16 py-1"
                      value={regle.vitesse.crans}
                      onChange={(e) =>
                        majAppro(i, {
                          vitesse: {
                            ...regle.vitesse,
                            crans: Math.max(0, Number(e.target.value) || 0),
                          },
                        })
                      }
                    />
                    cran(s) toutes les
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="input h-9 w-20 py-1"
                      value={regle.vitesse.periode_s}
                      onChange={(e) =>
                        majAppro(i, {
                          vitesse: {
                            ...regle.vitesse,
                            periode_s: Math.max(1, Number(e.target.value) || 1),
                          },
                        })
                      }
                    />
                    s <span className="text-slate-600">— un cran = une case, aller-retour</span>
                  </div>
                  )}

                  <ApercuTrajets regle={regle} />

                  {/* Le garde-fou contre la spirale, reduit a une case a cocher. */}
                  {regle.cible === "tuiles" && (
                    <div className="mt-2">
                      <p className="mb-1 text-[11px] text-slate-500">
                        {regle.sens === "entrant" ? "Récolte chez :" : "Envoie vers :"}
                      </p>
                      <ChoixTuiles
                        tuiles={citables}
                        choisies={regle.tileIds}
                        onChange={(tileIds) => majAppro(i, { tileIds })}
                      />
                    </div>
                  )}

                  <div className="mt-2">
                    <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">
                      Ressources concernées
                    </p>
                    <ChoixRessources
                      ressources={transportables}
                      choisies={regle.ressources}
                      onChange={(codes) => majAppro(i, { ressources: codes })}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      La population et les indicateurs ne sont pas proposés : ils ne se
                      transportent pas.
                    </p>
                    {regle.sens === "entrant" && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        « N&rsquo;importe quelle tuile » veut dire « je ne nomme personne »,
                        pas « chez tout le monde » : on ne prend jamais une ressource chez
                        une tuile qui la consomme. Le garde-manger d&rsquo;un habitat ou
                        d&rsquo;un abattoir n&rsquo;est pas une source — mais ce que
                        l&rsquo;abattoir fabrique, si.
                      </p>
                    )}
                  </div>

                  <p
                    className={`mt-1.5 text-[11px] leading-tight ${
                      inutile ? "text-amber-400" : "text-slate-500"
                    }`}
                  >
                    {enErreur
                      ? "Règle en erreur — elle sera ignorée en jeu (voir ci-dessus)."
                      : inutile
                      ? secondesParCran(regle) === null
                        ? "Navette bloquée — 0 cran par période : rien ne circulera, la règle sera ignorée en jeu."
                        : "Règle incomplète — aucune tuile cochée, ou aucun débit : elle sera ignorée en jeu."
                      : decrireAppro(regle, nomTuile, nomRessource)}
                  </p>

                </div>
              );
            })}
          </div>
        )}

        {estEntrepot(logistique) && (
          <p className="mt-2 rounded border border-accent/40 bg-accent/10 p-2 text-[11px] text-accent">
            Cette tuile récolte <strong>et</strong> envoie : c'est un entrepôt. Rien à cocher de
            plus — le rôle se déduit de ses règles.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * L'aperçu chiffré sous le débit : ce que la règle rend VRAIMENT, à deux
 * distances et pour plusieurs nombres de cibles.
 *
 * ⚠️ Il est là parce que le formulaire ne sait plus répondre tout seul à
 * « combien par minute ? ». Avant le 06/09 la réponse était dans le champ ;
 * maintenant elle dépend de la distance à la cible ET du nombre de cibles à
 * portée, que le site ne connaît pas — le catalogue ne sait rien du plateau.
 * Deux distances font sentir la pente (la case d'à côté, le bord du rayon) ;
 * trois valeurs de N font sentir le partage : `navettes` est un PLAFOND
 * (07/09), et chaque cible n'en reçoit qu'une part. Un chiffre « pour une
 * seule cible » seul redonnait à lire le modèle mort du 06/09, où chaque
 * ferme avait toute la flotte.
 */
function ApercuTrajets({ regle }: { regle: RegleAppro }) {
  if (regle.illimite) return null;
  if (secondesParCran(regle) === null || chargeParVolee(regle) <= 0) return null;
  // Sans rayon, la portée est le plateau entier : 5 cases est une distance
  // parlante pour montrer la pente sans prétendre à un chiffre exact.
  const loin = regle.rayon === null ? 5 : regle.rayon;
  const distances = loin > 1 ? [1, loin] : [1];
  const nombres = [1, 3, 10];
  const q = Math.max(0, regle.debit.quantite);
  return (
    <div className="mt-1 text-[11px] leading-tight text-slate-500">
      <p>
        Flotte partagée : chaque cible à portée reçoit{" "}
        <span className="tabular-nums text-slate-300">{q}</span> par voyage, toutes les…
      </p>
      {distances.map((d) => (
        <p key={d}>
          <span className="text-slate-400">
            à {d} case{d > 1 ? "s" : ""}
          </span>{" "}
          ({cransParTrajet(d)} crans) :{" "}
          {nombres.map((n, k) => (
            <span key={n}>
              {k > 0 && " · "}
              <span className="tabular-nums text-slate-300">
                {formatDuree(Math.round(dureeTrajet(regle, d, n) as number))}
              </span>{" "}
              <span className="text-slate-500">
                si {n} cible{n > 1 ? "s" : ""}
              </span>
            </span>
          ))}
        </p>
      ))}
      <p className="text-slate-600">
        Le nombre de cibles est celui du plateau (géométrie et type de tuile, jamais le stock) —
        ajouter une cible ralentit les autres.
      </p>
    </div>
  );
}

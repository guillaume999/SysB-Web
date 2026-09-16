// ============================================================
//  echanges.test.ts — les capacités d'échange d'une tuile (16/09)
//
//  Transfert (quai) et marché universel, déclarés PAR PALIER. Ce qui se perd
//  en silence : une capacité qui ne repart pas en base, ou qui repart avec une
//  forme que le serveur refuse (`moteur/echanges.go`).
// ============================================================

import { describe, expect, it } from "vitest";

import {
  avertissementsEchanges,
  erreursPalier,
  estMarche,
  estQuai,
  logistiqueVide,
  marcheVide,
  normaliserPalier,
  palierVide,
  paliersPourEnregistrer,
  transfertVide,
} from "./tuiles";

describe("échanges d'un palier", () => {
  it("un palier neuf ne transfère pas et ne vend pas — et rien ne part en base", () => {
    const p = palierVide(1);
    expect(p.transfert).toBeNull();
    expect(p.marche).toBeNull();
    const [enr] = paliersPourEnregistrer([p]);
    expect("transfert" in enr).toBe(false);
    expect("marche" in enr).toBe(false);
  });

  it("aller-retour : ce qui est saisi repart tel quel et se relit pareil", () => {
    const p = {
      ...palierVide(1),
      transfert: { destinations: ["plateau", "tpt"] as ("plateau" | "tpt")[], envois_max: 2, quantite_max: 40, duree_minutes: 0 },
      marche: { offres_max: 3, quantite_max: 20, duree_minutes: 5 },
    };
    const [enr] = paliersPourEnregistrer([p]);
    expect(enr.transfert).toEqual(p.transfert);
    expect(enr.marche).toEqual(p.marche);
    const relu = normaliserPalier(JSON.parse(JSON.stringify(enr)), 1);
    expect(relu.transfert).toEqual(p.transfert);
    expect(relu.marche).toEqual(p.marche);
    expect(erreursPalier(relu)).toEqual([]);
  });

  it("une destination inconnue ou en double est écartée à la lecture", () => {
    const relu = normaliserPalier(
      { niveau: 1, transfert: { destinations: ["lune", "tpt", "tpt"], envois_max: 1, quantite_max: 1, duree_minutes: 1 } },
      1,
    );
    expect(relu.transfert?.destinations).toEqual(["tpt"]);
  });

  it("ce que le serveur refuserait bloque l'enregistrement", () => {
    const p = {
      ...palierVide(1),
      transfert: { ...transfertVide(), destinations: [], envois_max: 0 },
      marche: { ...marcheVide(), quantite_max: 0 },
    };
    const e = erreursPalier(p);
    expect(e.some((x) => x.includes("destination"))).toBe(true);
    expect(e.some((x) => x.includes("envoi"))).toBe(true);
    expect(e.some((x) => x.startsWith("marché"))).toBe(true);
  });

  it("un quai ou un marché sans coffre est signalé en orange", () => {
    const paliers = [{ ...palierVide(1), transfert: transfertVide(), marche: marcheVide() }];
    expect(estQuai(paliers)).toBe(true);
    expect(estMarche(paliers)).toBe(true);
    expect(avertissementsEchanges(paliers, logistiqueVide())).toHaveLength(2);
    const avecCoffre = { ...logistiqueVide(), stockage: [{ ressource: "*", max: 100 }] };
    expect(avertissementsEchanges(paliers, avecCoffre)).toEqual([]);
    expect(avertissementsEchanges([palierVide(1)], logistiqueVide())).toEqual([]);
  });
});

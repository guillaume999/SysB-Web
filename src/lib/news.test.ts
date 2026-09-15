import { describe, expect, it } from "vitest";
import { lienSur } from "@/lib/liens";
import { corpsNews, dateLisible, erreurNews } from "@/lib/news";

describe("le corps d'une news", () => {
  it("est un objet simple sans nouvelle image, et garde l'auteur à la création", () => {
    expect(corpsNews({ titre: " Titre ", contenu: "x", publiee: true }, "adm")).toEqual({
      titre: "Titre",
      contenu: "x",
      publiee: true,
      auteur: "adm",
    });
  });

  it("retire l'image quand on le demande", () => {
    expect(corpsNews({ titre: "T", contenu: "", publiee: false, image: null }, null)).toMatchObject({ image: null });
  });

  it("passe en FormData quand une image part", () => {
    const fd = corpsNews(
      { titre: "T", contenu: "c", publiee: false, image: new File(["x"], "a.png", { type: "image/png" }) },
      null,
    );
    expect(fd).toBeInstanceOf(FormData);
    expect((fd as FormData).get("publiee")).toBe("false");
    expect((fd as FormData).get("image")).toBeInstanceOf(File);
  });
});

describe("validation et date", () => {
  it("exige un titre", () => {
    expect(erreurNews({ titre: "  ", contenu: "", publiee: true })).toMatch(/titre/);
    expect(erreurNews({ titre: "Ok", contenu: "", publiee: true })).toBeNull();
  });
  it("lit une date PocketBase et ignore une date vide", () => {
    expect(dateLisible("2026-09-15 19:04:00.000Z")).toMatch(/2026/);
    expect(dateLisible("")).toBe("");
  });
});

describe("les liens d'une news", () => {
  it("n'accepte que http(s), mailto et les adresses du site", () => {
    expect(lienSur("https://sysb.physiooffice.com")).toBe(true);
    expect(lienSur("mailto:a@b.c")).toBe(true);
    expect(lienSur("/forum")).toBe(true);
    expect(lienSur("javascript:alert(1)")).toBe(false);
    expect(lienSur("JavaScript:alert(1)")).toBe(false);
    expect(lienSur("//evil.example")).toBe(false);
    expect(lienSur("data:text/html,x")).toBe(false);
  });
});

# SysB — DOCUMENT DE CONCEPTION UNIFIÉ « TRI-AXES »

> Compilation intégrale de 7 documents de travail, regroupée par sections.
> Aucun contenu n'a été supprimé. Les passages présents à l'identique dans plusieurs
> fichiers ont été fusionnés une seule fois ; les variantes qui divergeaient sont
> toutes conservées et signalées. Voir l'**Annexe A** (provenance) et l'**Annexe B**
> (divergences entre versions).

---

## SOMMAIRE

**PARTIE I — CONCEPT GÉNÉRAL & BOUCLE DE JEU**
1. Boucle de jeu & interconnexion globale
2. Section 1 — Développement planétaire & gestion
3. Arbre d'amélioration & factions (les 3 axes)
4. Section 2 — Conquête spatiale & champ de bataille
5. Boucle économique du Palier 3 — la Société urbaine
6. Comparatif des extrémités : Palier 1 vs Palier 7
7. Tableau récapitulatif des 7 paliers d'évolution
8. Palier 5 (Ère spatiale primordiale) — spécialisation par axe

**PARTIE II — ARBRES DE RECHERCHE**
9. Version A — Arbre hybride à 5 paliers
10. Version B — Arbre étendu à 7 paliers (recherche militaire)
11. Version C — Arbre de technologie complet (51 technologies, combat pur)

**PARTIE III — CATALOGUES D'UNITÉS**
12. Catalogue des 21 unités hybrides de base (5 paliers)
13. Catalogue complet des 35 unités (7 paliers)
14. Matrice de répartition & équilibre des 35 unités

**PARTIE IV — LE COMBAT PUR : TRIANGULATION SANS HYBRIDATION**
15. Principes fondamentaux & triangulation tactique
16. Progression alternée par palier (lecture narrative)
17. Synthèse générale de la progression par palier (1 à 6)
18. Spécifications techniques des unités, Palier 1 à Palier 6
19. Synthèse des confrontations d'élite

**PARTIE V — MODES DE JEU**
20. Mode Dota (MOBA / action en temps réel) — le Héros et les unités hybrides
21. Mode tour par tour / siège

**PARTIE VI — LES BIOMES**
22. Jeu de biomes A — les 4 biomes du champ de bataille
23. Jeu de biomes B — les 3 biomes détaillés
24. Synthèses de l'influence des biomes

**PARTIE VII — ÉCOSYSTÈME ÉCONOMIQUE, DÉMOGRAPHIQUE & SATISFACTION**
25. Ressources système
26. Mécanisme de satisfaction
27. Arbre des bâtiments (infrastructure & production)
28. Matrice d'équilibrage économie / combat

**PARTIE VIII — CATALOGUE DES BÂTIMENTS, ÂGE PAR ÂGE**
29. Comment lire ce catalogue
30. Âge 1 — L'Âge des Pionniers
31. Âge 2 — Le Secteur Artisanal
32. Âge 3 — La Société Urbaine
33. Âge 4 — L'Ère Industrielle
34. Âge 5 — L'Ère Spatiale Primordiale
35. Âge 6 — La Métropole Spatiale
36. Âge 7 — La Cité Spatiale Transhumaine
37. Les lignées — ce que chaque bâtiment devient
38. Les verrous — ce qu'un âge doit au précédent

**ANNEXES**
- Annexe A — Provenance des sources
- Annexe B — Divergences entre versions

---
---

# PARTIE I — CONCEPT GÉNÉRAL & BOUCLE DE JEU

## 1. Boucle de jeu & interconnexion globale

Le jeu repose sur deux grandes sections interconnectées par un système de **Portes
téléportrices** :

- **La Gestion & Colonisation (Macro-gestion)** :
  Développement de planètes (dont la Terre), gestion des populations, extraction
  de ressources, recherche théorique et expansion spatiale.

- **Le Champ de bataille (Tactique/Action)** :
  Envoi de ressources, d'unités et d'unités spéciales via les Portes pour conquérir
  le Plateau de l'Univers.

<!-- schema: boucle-jeu -->

---

## 2. Section 1 — Développement planétaire & gestion

### 2.1 Système de population & paliers

- **Évolution** : la population nécessite de la nourriture et des biens de confort
  pour être efficace au travail.
- **Progression** : système structuré en **7 paliers d'évolution minimum**
  (ex : Maison bois → Brique → Immeuble ; Hôtel de ville → Centre administratif).
- **Personnalisation** : chaque planète dispose d'une version customisée de sa
  population et de ses besoins.

### 2.2 Ressources & chaînes de production

- **Matériaux de base & Époque 1** : bois, pierre, argile, fer, silicium, nickel, or.
- **Nourriture & consommables** : gibier, poissons, légumes, fruits, élevage
  (ferme / aquaculture).
- **Confort & croyance** : sucre, alcool, tabac, temples (pour la foi selon les biomes :
  forêt vierge, volcan, champ de bataille).
- **Chaînes de transformation** :
  * Bûcheron → Scierie
  * Meunier → Boulangerie
  * Abattoir → Boucherie
  * Pêcheur / Marché / Entrepôt

### 2.3 Modèle de données des bâtiments (Tilemap)

Chaque case (Tile) du jeu repose sur la structure suivante :

- Nom & conditions de construction/fonctionnement
- Coût de construction & coût d'évolution
- Travaillants requis & ressources consommées pour fonctionner
- Ressources produites

---

## 3. Arbre d'amélioration & factions (les 3 axes)

L'amélioration globale de la civilisation repose sur trois voies complémentaires :

```
+---------------+-------------------------------------+-----------------------------------+
| Axe           | Spécialité / Rôle                   | Impact sur les statistiques       |
+---------------+-------------------------------------+-----------------------------------+
| Archéomages   | Magie, mystique, fouilles,          | Esprit -> Magie / Capacités       |
|               | cartographie                        | mystiques                         |
+---------------+-------------------------------------+-----------------------------------+
| Généticiens   | Évolution biologique, mutation      | Corps -> Force, défense, points   |
|               |                                     | de vie                            |
+---------------+-------------------------------------+-----------------------------------+
| Scientifiques | Technologie, industrie, ingénierie  | Équipement -> Dégâts,             |
|               |                                     | technologies avancées             |
+---------------+-------------------------------------+-----------------------------------+
```

Les 3 axes fondamentaux, tels que nommés dans le document Tri-Axes :

- **ARCHÉOMAGES** (Axe Esprit & Magie)
- **GENÉTICIENS** (Axe Corps & Mutations)
- **SCIENTIFIQUES** (Axe Équipement & Mécanique)

---

## 4. Section 2 — Conquête spatiale & champ de bataille

### 4.1 Conquête & Plateau de l'Univers

- **Structure** : la carte globale représente la **Toile cosmique** (filaments de matière
  et vides spatiaux).
- **Carte de jeu** : damier de cases dont l'état évolue : **Neutre → Occupé → En guerre**.
- **Modes de résolution des combats (2 styles envisagés)** :
  * **Style Dota (MOBA/Action)** : un Héros rejoint le champ de bataille pour prêter
    main-forte à un Empereur face à d'autres Héros.
  * **Tour par tour (Tactique/Siège)** : gestion de siège de château et affrontements
    au tour par tour.

*(Le détail de ces deux modes est en **Partie V**.)*

### 4.2 Logistique spatiale & Portes

- **Progression spatiale** :
  1. **Terre** → Lancement de fusées (nécessite comburant O2/peroxyde d'azote et
     carburant hydrazine/hydrogène).
  2. **Orbites & Stations** → Construction de bases spatiales, satellites
     d'observation, astroports et labos.
  3. **Système solaire & Hors système** → Colonisation de nouvelles planètes pour
     extraire des ressources rares.
- **Lien avec la bataille** : les planètes développées envoient continuellement des
  flux de ressources, des armes d'exception et des unités spéciales à travers
  les Portes jusqu'au champ de bataille.
- **Menaces PVE** : rencontres et combats contre des pirates de l'espace sur les points
  de spawn / routes de transit.

---

## 5. Boucle économique du Palier 3 — la Société urbaine

L'**Ère de la Vapeur & Chimie** marque la transition entre la gestion purement locale
et le début de l'industrialisation lourde vers l'espace.

À ce stade, l'habitat passe de la **Maison en brique** à l'**Immeuble en brique**.
La densité de population explose, demandant des chaînes de transformation plus
complexes et l'accès à des biens de confort élaborés pour maintenir une efficacité
maximale.

Schéma global :

```
[Ressources Brutes] -> [Transformations N1 & N2] -> [Services & Biens de Confort] -> [Efficacité & Énergie Spatiale]
```

### 5.1 Besoins vitaux (consommation de base)

Pour ne pas faire de grève ou réduire son rendement au travail, ce palier exige
une alimentation diversifiée et un accès aux services municipaux.

```
+--------------------+--------------------------------+-----------------------------------------------+------------------------------------------+
| Besoins            | Bâtiments de transformation    | Chaîne de production                          | Effet si satisfait                       |
+--------------------+--------------------------------+-----------------------------------------------+------------------------------------------+
| Pain & Viande      | Boulangerie, Boucherie         | Champs de blé -> Meunier -> Boulangerie       | Main-d'œuvre de base opérationnelle.     |
|                    |                                | Bétail -> Abattoir -> Boucherie               |                                          |
+--------------------+--------------------------------+-----------------------------------------------+------------------------------------------+
| Poissons préparés  | Conserverie (Nouveau)          | Pêcheur + Nickel/Fer -> Conserverie           | Réduit de 15 % la consommation globale   |
|                    |                                |                                               | de nourriture.                           |
+--------------------+--------------------------------+-----------------------------------------------+------------------------------------------+
| Accès à la Santé   | Dispensaire, École communale   | Nécessite briques, fer et papier              | Débloque le niveau de qualification      |
| & Éducation        |                                |                                               | "Technicien".                            |
+--------------------+--------------------------------+-----------------------------------------------+------------------------------------------+
```

### 5.2 Ressources de confort débloquées & chaînes de luxe

Les biens de confort ne sont pas obligatoires pour la survie, mais augmentent
drastiquement la productivité (**+25 % à +50 %**) et génèrent de la **Croyance /
Motivation** transmise aux scientifiques et archéomages.

- **Alcool fort (Rhum / Whisky)** :
  * Chaîne : Canne à sucre / Céréales → Distillerie → Taverne & Marque de confort.
  * Bonus : **+20 % d'efficacité** dans les usines lourdes.

- **Cigares / Tabac raffiné** :
  * Chaîne : Champs de tabac → Séchoir → Manufacture de tabac.
  * Bonus : **+15 % de génération de points de recherche** (Esprit / Archéomages).

- **Vêtements sur-mesure** :
  * Chaîne : Élevage (laine/cuir) + Teinturerie (chimie) → Atelier textile.
  * Bonus : augmente la limite de population par Immeuble.

### 5.3 Ressources stratégiques & portée spatiale

C'est à ce palier que la planète commence à alimenter le programme spatial et
le champ de bataille :

- **Silicium & Nickel raffinés** : Extraction en mine → Fonderie avancée → Composants
  électroniques primaires.
- **Comburant primaire (O2 industriel)** : Séparation de l'air / Eau → Usine chimique →
  Réservoirs pour les premières fusées de reconnaissance.

### 5.4 Synthèse sur la Tilemap (exemple d'un bâtiment du Palier 3)

- **Nom** : Distillerie de Rhum
- **Ressources pour la construire** : 50 Briques, 20 Fer, 10 Silicium
- **Travailleurs pour la faire fonctionner** : 12 Ouvriers (Palier 3)
- **Ressources pour fonctionner** : 10 Sucre, 2 Bois, 1 Alcool (consommé par le personnel)
- **Ressources produites** : 8 Rhum raffiné
- **Conditions de construction** : présence d'un champ de canne à sucre sur le secteur
  + accès au réseau d'eau
- **Conditions de fonctionnement** : stock de sucre alimenté via Entrepôt
- **Ressources pour évoluer (vers Palier 4)** : 15 Nickel, 5 Composants avancés

---

## 6. Comparatif des extrémités : Palier 1 vs Palier 7

### 6.1 PALIER 1 — L'ÂGE DES PIONNIERS (installation & subsistance)

À ce stade, l'habitat repose sur la **Cabane en bois** ou la **Tente de colon**. La population
est peu nombreuse, directement dépendante de l'environnement immédiat. L'objectif
est d'assurer la survie et d'accumuler les matériaux de construction de base.

Schéma global :

```
[Biomes : Forêt / Rivière] -> [Collecte Brute] -> [Transformation Primaire] -> [Survie & Premier Temple]
```

**1. Besoins vitaux & consommation de base**

- Nourriture de subsistance : gibier (chasse), poisson sec (pêche locale) ou baie/légume sauvage.
- Habitat & chauffage : bois de chauffage brut pour maintenir l'efficacité sous des climats rudes.
- Services de base : puits communal (eau potable) et feu de camp / place du village.

**2. Ressources de confort & croyance débloquées**

- **Alcool artisanal (Hydromel / Bière de baies)** :
  * Chaîne : Baies sauvages / Miel → Casserie / Cuve artisanale → Bière.
  * Bonus : **+10 %** de vitesse de déplacement et de récolte des colons.
- **Tabac séché brut** :
  * Chaîne : Feuilles de tabac sauvages → Séchoir en bois.
  * Bonus : réduit les risques de mutinerie ou de baisse de moral.
- **Première Croyance (Autel en pierre / Petit Temple)** :
  * Chaîne : Pierre taillée + Bois + Alcool artisanal.
  * Bonus : débloque la première jauge de Magie/Esprit (voie Archéomage).

**3. Fiche Tilemap — exemple : Cabane de Pêcheur**

- Nom : Cabane de Pêcheur
- Ressources pour la construire : 15 Bois, 5 Pierre
- Travaillants pour la faire fonctionner : 2 Pionniers
- Ressources pour fonctionner : aucune (utilise le point d'eau contigu)
- Ressources produites : 4 Poisson frais
- Conditions de construction : doit être placée sur une case côtière ou de rivière
- Conditions de fonctionnement : réserve de stockage (Entrepôt en bois) à portée
- Ressources pour évoluer (vers Palier 2) : 10 Briques, 5 Outils en fer → Séchoir à poisson / Pêcherie mécanique

### 6.2 PALIER 7 — L'ÈRE DE LA CITÉ SPATIALE (transcendance & logistique cosmique)

Au Palier 7, les colons sont devenus des **Citoyens Transhumains / Archontes**. L'habitat
se fait dans des **Cités-Dômes Intelligentes** ou des **Habitats Orbitaux**. La colonie
produit de la matière exotique pour alimenter le réseau de Portes spatiales et
la conquête du Plateau de l'Univers.

Schéma global :

```
[Matière Exotique & Énergie] -> [Synthèse & Génétique Avancée] -> [Transcendance] -> [Alimentation des Portes & Bataille]
```

**1. Besoins vitaux (consommation synaptique & maintien)**

- **Nourriture synthétique / Nutriments Quantiques** :
  * Chaîne : Fermes hydroponiques automatisées + Silicium + Puces biologiques.
  * Rôle : évite la dégénérescence cellulaire des citoyens.
- **Infrastructures de maintien** : dôme à atmosphère contrôlée, réseau de télépathie
  synthétique, processeurs quantiques municipaux.

**2. Biens de confort avancés & croyance élevée**

- **Nectar d'Ambroisie (alcool bio-synthétique)** :
  * Chaîne : Fruits mutés (Génétique) + Chimie lourde + Distillerie Quantique.
  * Bonus : **+50 %** de vitesse de recherche globale et régénération accélérée des Héros
    sur le champ de bataille.
- **Néo-Tabac Synaptique** :
  * Chaîne : Tabac génétiquement modifié + Injecteurs d'essence mystique (Archéomages).
  * Bonus : augmente la puissance des sorts lancés depuis la planète vers le plateau
    de l'univers.
- **Complexe de Croyance Cosmologique (Sanctuaire des Filaments)** :
  * Chaîne : Alliages d'Or/Silicium + Noyaux d'énergie spatiale + Reliques archéologiques.
  * Bonus : **réduit de 30 %** le coût d'ouverture des Portes téléportrices vers les zones de guerre.

**3. Fiche Tilemap — exemple : Injecteur de Porte Spatiale**

- Nom : Injecteur de Porte Spatiale
- Ressources pour la construire : 200 Alliage Nickel-Titane, 100 Composants Quantiques,
  50 Noyaux d'Énergie Spatiale
- Travaillants pour la faire fonctionner : 5 Généticiens Supérieurs, 5 Archéomages
- Ressources pour fonctionner : 20 Hydrazine, 10 Comburant O2, 5 Nectar d'Ambroisie / cycle
- Ressources produites : flux de téléportation (envoie directement unités lourdes
  et armes spéciales sur le Plateau de l'Univers)
- Conditions de construction : présence d'un Astroport à proximité + connexion
  au réseau d'énergie de la Cité Spatiale
- Conditions de fonctionnement : alimentation continue en énergie et produits de
  confort synaptiques
- Ressources pour évoluer : statut maximal (Niveau 7)

---

## 7. Tableau récapitulatif des 7 paliers d'évolution

<!-- schema: paliers-evolution -->

> Le détail des bâtiments de chaque âge, leurs lignées et les verrous entre âges sont en
> **Partie VIII** (§29 à §38).

```
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| Palier | Nom du Palier              | Type d'Habitation             | Thème Principal & Objectif                                              |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| 1      | Âge des Pionniers          | Cabane en bois / Tente de     | Survie & Subsistance (chasse, pêche, cueillette, matériaux bruts).      |
|        |                            | colon                         |                                                                         |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| 2      | Secteur Artisanal          | Maison en brique              | Transformation & Métiers (agriculture, maçonnerie, outils en fer).      |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| 3      | Société Urbaine            | Immeuble en brique            | Industrialisation Primaire (chimie, conserveries, biens de confort).    |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| 4      | Ère Industrielle           | Cité ouvrière / Résidence     | Production de Masse & Énergie (fonderies, pétrochimie, réseau d'eau/    |
|        |                            | acier                         | vapeur).                                                                |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| 5      | Ère Spatiale Primordiale   | Complexe résidentiel béton/   | Conquête de l'Orbite (centre de lancement, comburants/carburants,       |
|        |                            | verre                         | satellites).                                                            |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| 6      | Metropole Spatiale         | Arcologie / Habitat modulable | Colonisation Interplanétaire (alliages rares, automatisation,           |
|        |                            | avancé                        | laboratoire de pointe).                                                 |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
| 7      | Cité Spatiale Transhumaine | Dôme biologique / Habitat     | Singularité & Projection Cosmique (matière exotique, bio-synthèse,      |
|        |                            | orbital                       | alimentation des Portes).                                               |
+--------+----------------------------+-------------------------------+-------------------------------------------------------------------------+
```

---

## 8. Palier 5 (Ère spatiale primordiale) — spécialisation par axe

Au Palier 5, la colonie passe de l'industrie terrestre à l'expansion orbitale. C'est le
moment charnière où la population commence à exploiter les ressources spatiales et à
alimenter le champ de bataille via les Portes.

Chaque axe débloque une catégorie de bâtiments uniques qui modifient profondément
la production, les unités et la logistique :

### 8.1 Axe Archéomages — Maîtrise de l'Esprit & Focalisation Astrale

Cet axe fusionne la technologie spatiale émergente avec les reliques et la
cartographie mystique pour percer les secrets du cosmos.

- **Bâtiment débloqué : L'Observatoire Runique Orbital**
  * Rôle : reçoit et décode les signaux mystiques émanant de la Toile cosmique.
  * Fonction : cartographie les secteurs neutres ou ennemis du Plateau de l'Univers.
    Génère de la Croyance spatiale.
  * Impact combat/logistique : permet de cibler précisément les zones d'atterrissage
    sur le champ de bataille et débloque le sort de soutien **« Siphon astral »** pour le Héros.

- **Bâtiment débloqué : Le Sanctuaire de Stabilisation de Porte**
  * Rôle : bâtiment adjacent à la Porte de téléportation.
  * Fonction : utilise la magie pour **réduire de 30 %** la consommation de carburant
    (H2 / Hydrazine) lors de l'envoi de ressources vers le champ de bataille.

### 8.2 Axe Généticiens — Adaptation du Corps & Super-Soldats

Cet axe prépare l'humain (et les créatures) aux environnements hostiles de l'espace
et produit des unités organiques supérieures pour le champ de bataille.

- **Bâtiment débloqué : Le Cocon de Muta-Culture Spatiale**
  * Rôle : laboratoire d'ingénierie génétique lourde.
  * Fonction : consomme des légumes, de l'alcool raffiné et du silicium pour « cultiver »
    des troupes aux caractéristiques accrues (santé, armure biologique).
  * Impact combat/logistique : débloque la création d'unités de choc pour le Plateau
    de l'Univers (ex : Bataillons Mutants résistants aux biomes extrêmes comme les
    volcans ou le vide).

- **Bâtiment débloqué : La Serre d'Adaptation Xéno-Botanique**
  * Rôle : ferme automatisée haute densité.
  * Fonction : produit des nutriments enrichis nécessaires pour alimenter la
    population de Palier 5 sans dépendre des surfaces agricoles classiques.

### 8.3 Axe Scientifiques — Ingénierie de l'Équipement & Balistique

Cet axe met l'accent sur les machines, les alliages avancés, les fusées et les
infrastructures spatiales lourdes.

- **Bâtiment débloqué : Le Complexe de Lancement & Astroport V2**
  * Rôle : centre logistique spatial principal.
  * Fonction : traite et raffine les comburants (O2) et carburants (hydrazine)
    pour lancer des fusées d'approvisionnement et fabriquer des satellites
    (observation/défense).
  * Impact combat/logistique : augmente le débit et le volume de ressources
    expédiables simultanément vers les lignes de front.

- **Bâtiment débloqué : La Fonderie d'Armement de Précision**
  * Rôle : usine d'armement mécanique et énergétique.
  * Fonction : transforme le fer, le nickel et le silicium en équipements militaires
    avancés (canons orbitaux, boucliers de siège).

### 8.4 Synthèse des bâtiments de Palier 5 par axe

```
+---------------+-------------------------------------+-----------------------------------+-----------------------------------------------+
| Axe           | Bâtiments uniques Palier 5          | Ressource clé consommée           | Résultat pour le Champ de Bataille            |
+---------------+-------------------------------------+-----------------------------------+-----------------------------------------------+
| Archéomages   | Observatoire Runique & Sanctuaire   | Alcool raffiné, Reliques, Pierre  | Vision de carte, sorts de Héros & réduction   |
|               | de Porte                            |                                   | du coût de téléportation.                     |
+---------------+-------------------------------------+-----------------------------------+-----------------------------------------------+
| Généticiens   | Cocon de Muta-Culture & Serre       | Sucre, Nourriture, Silicium       | Unités biologiques avec bonus de vie/défense  |
|               | Xéno-Botanique                      |                                   | & alimentation haute densité.                 |
+---------------+-------------------------------------+-----------------------------------+-----------------------------------------------+
| Scientifiques | Astroport V2 & Fonderie de          | Fer, Nickel, Hydrazine / O2       | Flux logistique accru, artillerie lourde &    |
|               | Précision                           |                                   | améliorations d'équipement.                   |
+---------------+-------------------------------------+-----------------------------------+-----------------------------------------------+
```

---
---

# PARTIE II — ARBRES DE RECHERCHE

> Trois versions coexistent dans les documents sources : une structure hybride à
> **5 paliers**, une extension militaire à **7 paliers**, et un arbre de technologie
> **combat pur à 51 technologies**. Elles sont toutes reproduites ci-dessous.

## 9. Version A — Arbre hybride à 5 paliers

```
                  [ PALIER 1 — INITIATION & FONDATIONS ]
           ┌────────────────────────┼────────────────────────┐
    [ ARCHÉOMAGES ]          [ GENÉTICIENS ]          [ SCIENTIFIQUES ]
   (Esprit & Magie)         (Corps & Mutations)      (Ingénierie & Balistique)
           │                        │                        │
           ├────────────────────────┼────────────────────────┤
                  [ PALIER 2 — SPÉCIALISATIONS SECTORIELLES ]
           │                        │                        │
           ├────────────────────────┼────────────────────────┤
                  [ PALIER 3 — PREMIÈRES SYNERGIES DUALES ]
     (Bio-Magie)               (Cyber-Bionique)           (Techno-Magie)
           │                        │                        │
           ├────────────────────────┼────────────────────────┤
                  [ PALIER 4 — EXPANSION HYBRIDE AVANCÉE ]
           │                        │                        │
           └────────────────────────┼────────────────────────┘
                  [ PALIER 5 — TRINITÉ COSMIQUE & SINGULARITÉ ]
```

### 9.1 Détail des technologies par axe

**A. ARCHÉOMAGES (Esprit & Magie)**

- **P1 — Focales Runiques** : lignes ley sur planètes (+15 % régénération de mana).
- **P2 — Cartographie de la Toile** : révèle le brouillard et les ressources.
- **P2 (Sec.) — Encens & Incantations** : convertit le confort en Croyance.
- **P3 — Résonance Astrale** : augmente la portée d'action des sorts.
- **P4 — Invocations Éthérées** : canalisation de tempêtes arcaniques.

**B. GENÉTICIENS (Corps & Mutations)**

- **P1 — Musculature Renforcée** : +20 % PV de base, +10 % vitesse.
- **P2 — Métabolisme Adaptatif** : immunité aux malus de biomes.
- **P2 (Sec.) — Muta-Culture Organique** : élevage à haut rendement.
- **P3 — Séro-Régénération** : régénération passive de PV par tour/seconde.
- **P4 — Génome Supérieur** : modification de masse de la population (+30 %).

**C. SCIENTIFIQUES (Ingénierie & Balistique)**

- **P1 — Alliages de Fer & Nickel** : -15 % entretien des usines, +armure.
- **P2 — Propulsion à Hydrazine** : +vitesse attaques véhicules et fusées.
- **P2 (Sec.) — Raffinage du Silicium** : optimisation des chaînes complexes.
- **P3 — Focalisateurs Plasma** : dégâts de perforation à l'artillerie.
- **P4 — Servomoteurs d'Assaut** : +cadence de tir et résistance mécanisée.

---

## 10. Version B — Arbre étendu à 7 paliers (recherche militaire)

Extension majeure du système de recherche et de l'arsenal militaire, amenant l'arbre à
**7 paliers complets** (parfaitement alignés sur les 7 paliers d'évolution des planètes)
et poussant le catalogue à **35 unités distinctes**. Cette version introduit également des
**sous-branches spécialisées** dans chaque axe et un système d'**unités hybrides triples
spécifiques**.

L'arbre s'étend de la colonisation primitive à la singularité cosmique. Chaque palier
débloque de nouvelles branches, de nouveaux bâtiments de laboratoire sur vos planètes
et élargit les capacités de projection sur le champ de bataille.

```
                         [ PALIER 1 — SURVIE & FONDATIONS ]
           ┌────────────────────────────┼────────────────────────────┐
    [ ARCHÉOMAGES ]              [ GENÉTICIENS ]              [ SCIENTIFIQUES ]
   (Esprit & Mystique)          (Corps & Bio-Ingénierie)     (Équipement & Mécanique)
           │                            │                            │
  [P2 — ÉVOLUTION SECTORIELLE]  [P2 — ÉVOLUTION SECTORIELLE]  [P2 — ÉVOLUTION SECTORIELLE]
           │                            │                            │
   ┌───────┴───────┐            ┌───────┴───────┐            ┌───────┴───────┐
 (Runes)      (Astral)      (Mutations)   (Clonage)      (Balistique)   (Réseaux)
           │                            │                            │
           ├────────────────────────────┼────────────────────────────┤
                         [ PALIER 3 — PREMIÈRES SYNERGIES DUALES ]
           │   (Bio-Magie)              │   (Cyber-Bionique)         │   (Techno-Magie)
           ├────────────────────────────┼────────────────────────────┤
                         [ PALIER 4 — EXPANSION INTERPLANÉTAIRE ]
           │                            │                            │
           ├────────────────────────────┼────────────────────────────┤
                         [ PALIER 5 — MAÎTRISE HYBRIDE AVANCÉE ]
           │                            │                            │
           ├────────────────────────────┼────────────────────────────┤
                         [ PALIER 6 — CONVERGENCE TECHNIQUE ]
           │                            │                            │
           └────────────────────────────┼────────────────────────────┘
                         [ PALIER 7 — SINGULARITÉ COSMIQUE ]
                       (Trinité & Unités Suprêmes Divines)
```

### 10.1 Détail des 7 paliers de recherche par axe

**A. Axe Archéomages (Esprit & Mystique)**

- **P1 — Sensibilité Éthérée** : révèle la position des gisements d'énergie sur les cartes.
- **P2 — Sous-branche Runes & Glyphes** : débloque la pose de pièges arcaniques immobiles sur le damier.
- **P2 — Sous-branche Projection Astrale** : augmente la vitesse de déplacement des sorts et la portée de vue.
- **P3 — Résonance des Filaments** : réduit de 20 % la perte de mana lors des transferts interplanétaires.
- **P4 — Invocations Éthérées** : permet de matérialiser temporairement des entités d'énergie pure.
- **P5 — Architectures Rituelles** : les temples planétaires génèrent du mana transférable directement au Héros.
- **P6 — Distorsion Temporelle** : débloque des compétences capables d'annuler ou rejouer des actions de combat.
- **P7 — Puits de Transcendance** : débloque l'invocation directe de divinités cosmiques.

**B. Axe Généticiens (Corps & Bio-Ingénierie)**

- **P1 — Génome Adaptatif** : +15 % aux PV de base de toutes les unités d'infanterie.
- **P2 — Sous-branche Mutations Végétales/Bio** : permet la production de nourriture haute densité.
- **P2 — Sous-branche Clonage Rapide** : réduit de 25 % le temps de formation des troupes biologiques.
- **P3 — Régénération Cellulaire** : accorde un soin passif continu aux troupes en combat.
- **P4 — Adaptation aux Biomes** : immunise totalement l'armée contre les effets environnementaux (volcans, poisons, vide).
- **P5 — Eugénisme Supérieur** : améliore l'efficacité de la population planétaire de +30 %.
- **P6 — Génétique Quantique** : permet la reconstruction instantanée d'un bataillon détruit s'il reste une cellule survivante.
- **P7 — Immortalité Métabolique** : vos unités biologiques ne subissent plus de malus de fatigue ou de dégâts moraux.

**C. Axe Scientifiques (Équipement & Mécanique)**

- **P1 — Métallurgie de Base** : réduit le coût de construction des bâtiments en pierre/fer.
- **P2 — Sous-branche Balistique & Plasma** : augmente les dégâts de perforation d'armure de +20 %.
- **P2 — Sous-branche Automates & Réseaux** : permet l'automatisation de la collecte des ressources secondaires.
- **P3 — Propulsion à Hydrazine** : augmente la vitesse des véhicules et des fusées de colonisation.
- **P4 — Blindages Réactifs** : absorbe 30 % du premier coup subi par les unités mécaniques à chaque tour/vague.
- **P5 — Noyaux à Fusion Spatiale** : multiplie par deux l'énergie générée par les bâtiments spatiaux.
- **P6 — Champs de Stase Électromagnétique** : débloque des armes capables d'immobiliser les armées adverses.
- **P7 — Matière Exotique & Anti-Matière** : alimentation maximale des pièces d'artillerie suprêmes.

---

## 11. Version C — Arbre de technologie complet (51 technologies, combat pur)

### 11.1 BRANCHE 1 : SCIENCE (17 technologies)

**[ÉCONOMIE & DÉMOGRAPHIE]**

- **SC-ECO-01 — Automatisations d'Usine** : coût MO des bâtiments Science -15 %.
- **SC-ECO-02 — Rations Synthétisées** : Distributeur Alimentaire +25 % d'Alimentation (AB).
- **SC-ECO-03 — Confort Standardisé** : max Satisfaction des Quartiers Résidentiels +10 %.
- **SC-ECO-04 — Logistique d'Assemblage** : temps de formation des unités Science -20 %.
- **SC-ECO-05 — Recyclage Énergétique** : impact négatif sur la Satisfaction des unités P5/P6 -50 %.

**[AMÉLIORATIONS TACTIQUES PAR PALIER]**

- **SC-UT-01** (P1 - Exosquelette) — *Munitions Cautérisantes* : Balles Cautérisantes réduit la régénération de 60 % (au lieu de 40 %).
- **SC-UT-02** (P1 - Exosquelette) — *Servomoteurs Renforcés* : PV +100, Armure Physique +5.
- **SC-UT-03** (P2 - Canon Plasma) — *Superchargeurs Thermiques* : Bombardement Plasma rayon +1 case.
- **SC-UT-04** (P2 - Canon Plasma) — *Blindage Ablatif* : Ancrage de Siège maintient l'armure magique à 10 (au lieu de 0).
- **SC-UT-05** (P3 - Stase EMP) — *Surcharge Cautérisante* : Champ Cautérisant inflige 75 dégâts/tour (au lieu de 50).
- **SC-UT-06** (P3 - Stase EMP) — *Générateur à Flux Inverse* : Onde d'Inhibition portée +1 case.
- **SC-UT-07** (P4 - Artillerie Orbitale) — *Imagerie Satellite* : portée maximale de la Batterie Orbitale +2 cases.
- **SC-UT-08** (P4 - Artillerie Orbitale) — *Incubation Atomique* : sol enflammé persiste 3 tours (au lieu de 2).
- **SC-UT-09** (P5 - Chasseur à Rayon) — *Post-Combustion Plasma* : Mitraillage Incendiaire portée 4 cases.
- **SC-UT-10** (P5 - Chasseur à Rayon) — *Réflecteurs en Titane* : Roue d'Évasion passe à 45 % de chance (au lieu de 30 %).
- **SC-UT-11** (P6 - Titan Anti-Matière) — *Condensateur Subatomique* : Rayon d'Annihilation recharge réduite à 1 tour.
- **SC-UT-12** (P6 - Titan Anti-Matière) — *Protocole Étendu* : explosion à la mort réduit les dégâts ennemis adjacents de 40 % (1 tour).

### 11.2 BRANCHE 2 : GÉNÉTIQUE (17 technologies)

**[ÉCONOMIE & DÉMOGRAPHIE]**

- **GE-ECO-01 — Biomasse Accélérée** : coût en Alimentation (AB) de la population -15 %.
- **GE-ECO-02 — Phéromones d'Apaisement** : maintient la Satisfaction > 50 % même en pénurie d'Alimentation.
- **GE-ECO-03 — Organismes d'Assainissement** : Quartiers Résidentiels +5 Main-d'Œuvre.
- **GE-ECO-04 — Maturation In-Vitro Express** : coût des unités P1 à P3 -15 %.
- **GE-ECO-05 — Métabolisme de Récupération** : convertit 10 % des PV de biomasse perdus en combat en AB.

**[AMÉLIORATIONS TACTIQUES PAR PALIER]**

- **GE-UT-01** (P1 - Guerrier Mutant) — *Membrane Épaisse* : Cuir Dissipateur réduit de 50 % les dégâts magiques (au lieu de 40 %).
- **GE-UT-02** (P1 - Guerrier Mutant) — *Tendons Haute Tension* : Bond de Traque portée 3 cases.
- **GE-UT-03** (P2 - Behemoth) — *Synapses Absorbeuses* : Cortex Absorbeur convertit chaque sort reçu en +8 % PV max (au lieu de 5 %).
- **GE-UT-04** (P2 - Behemoth) — *Épines Perforantes* : Projection d'Osséine inflige 260 dégâts (au lieu de 200).
- **GE-UT-05** (P3 - Traqueur Venimeux) — *Neurotoxine Évoluée* : Fibrillation Toxique inflige 80 dégâts/tour (au lieu de 60).
- **GE-UT-06** (P3 - Traqueur Venimeux) — *Toile Submersible* : Toile Organique tire la cible de 2 cases (au lieu d'une).
- **GE-UT-07** (P4 - Hydre Métabolique) — *Mitose Parfaite* : Hydra-Petits apparaissent avec 35 % PV max (au lieu de 25 %).
- **GE-UT-08** (P4 - Hydre Métabolique) — *Sucs Gastro-Corrosifs* : Marge d'Acide réduit l'armure physique de 20 (2 tours).
- **GE-UT-09** (P5 - Léviathan Volant) — *Spores Concentrées* : Nuage Asphyxiant zone augmentée à 3x3 cases.
- **GE-UT-10** (P5 - Léviathan Volant) — *Tissus Nutritifs* : Membranes Absorbantes convertit 40 % dégâts magiques en soins (au lieu de 30 %).
- **GE-UT-11** (P6 - Colosse Transhumain) — *Chair Harmonique* : PV max 16 000, Chair Résonante réduit de 70 % les dégâts magiques.
- **GE-UT-12** (P6 - Colosse Transhumain) — *Onde Dévastatrice* : Écrasement Synaptique passe à 1 000 dégâts et rayon 2 cases.

### 11.3 BRANCHE 3 : ARCHÉOMAGES (17 technologies)

**[ÉCONOMIE & DÉMOGRAPHIE]**

- **AR-ECO-01 — Canalisation Runique** : population génère +20 % FA quand Satisfaction >= 80 %.
- **AR-ECO-02 — Harmonie Éthérique** : Sanctuaires d'Alignement augmentent la Satisfaction de +25 % (au lieu de 15 %).
- **AR-ECO-03 — Inscription Runique Civile** : coût de construction des bâtiments Archéomages -20 %.
- **AR-ECO-04 — Écho Spirituel** : à la mort d'une unité Archéomage, 25 % de sa valeur en FA est restituée.
- **AR-ECO-05 — Exaltation Astrale** : temps de recharge des compétences -15 % si Satisfaction > 90 %.

**[AMÉLIORATIONS TACTIQUES PAR PALIER]**

- **AR-UT-01** (P1 - Inquisiteur Runique) — *Incisions Phasiques* : Sceptre Phasique ignore 75 % de l'armure (au lieu de 60 %).
- **AR-UT-02** (P1 - Inquisiteur Runique) — *Saut Réactif* : Escapade Éthérée passe à 40 % de chances.
- **AR-UT-03** (P2 - Faucheur d'Éther) — *Lame d'Éther Tranchante* : dégâts de base 440, Saut d'Ombre bonus critique +70 %.
- **AR-UT-04** (P2 - Faucheur d'Éther) — *Annulation Magnétique* : Décharge de Dissolution dure 2 tours (au lieu de 1).
- **AR-UT-05** (P3 - Sphère Distorsion) — *Prisme Réfringent* : Renvoi de Projectile renvoie avec +40 % dégâts (au lieu de 20 %).
- **AR-UT-06** (P3 - Sphère Distorsion) — *Matrice Roulante* : Miroir de Focale ignore 80 % des dégâts mécaniques/balistiques.
- **AR-UT-07** (P4 - Artillerie Phasique) — *Percée Dimensionnelle* : Perce-Blindage Astral dégâts 1 100 vs mécanique.
- **AR-UT-08** (P4 - Artillerie Phasique) — *Piège Runique Résiduel* : piège de Brèche de Repli immobilise (1 tour) après l'étourdissement.
- **AR-UT-09** (P5 - Archonte Tempête) — *Décharge Disruptive* : Impulsion IEMP inflige 1 000 dégâts et réduit la portée de la cible de 2 cases.
- **AR-UT-10** (P5 - Archonte Tempête) — *Mirages Éthérés* : Transfert Éthéré laisse 2 illusions (au lieu d'une).
- **AR-UT-11** (P6 - Avatar de l'Éther) — *Intangibilité Absolue* : Intangibilité Éthérée ignore 90 % des dégâts Science.
- **AR-UT-12** (P6 - Avatar de l'Éther) — *Catalyseur Astral* : Surcharge Court-Circuit inflige 2 400 dégâts et verrouille la cible pendant 3 tours.

---
---

# PARTIE III — CATALOGUES D'UNITÉS

## 12. Catalogue des 21 unités hybrides de base (structure 5 paliers)

**Pures Archéomages (Esprit)**

1. **Inquisiteur Runique** (P1) : infanterie mystique, détection et tirs magiques.
2. **Faucheur d'Éther** (P3) : assassin astral ignorant l'armure physique.
3. **Canaliseur de Portes** (P4) : soutien réduisant le coût d'invocation.

**Pures Généticiens (Corps)**

4. **Pionnier Mutant** (P1) : troupes rapides pour capturer les cases.
5. **Berserker Organique** (P3) : combattant de mêlée devenant plus fort si blessé.
6. **Behemoth Cellulaire** (P4) : colosse biologique bouclier humain.

**Pures Scientifiques (Équipement)**

7. **Drone de Reconnaissance** (P1) : éclaireur mécanique très rapide.
8. **Exosquelette d'Assaut** (P3) : infanterie lourde blindée à minigun.
9. **Char à Plasma Lourd** (P4) : artillerie mobile à dégâts de zone.

**Hybrides Archéomages + Généticiens (Bio-Magie)**

10. **Muta-Chaman** (P3) : soigneur convertissant dégâts magiques en soins.
11. **Traqueur Ombral** (P4) : bête mutée invisible et venimeuse.
12. **Garde-Biomantique** (P5) : guerrier se régénérant au lancement de sorts.

**Hybrides Généticiens + Scientifiques (Cyber-Bionique)**

13. **Cyborg de Siège** (P3) : tank PV élevés + bouclier anti-structure.
14. **Infiltrateur Cybernétique** (P4) : infanterie d'élite à lames haute fréquence.
15. **Colosse Biomécanique** (P5) : géant de chair à canon dorsal.

**Hybrides Scientifiques + Archéomages (Techno-Magie)**

16. **Golem Mécanisé** (P3) : châssis blindé à tir magique à travers les obstacles.
17. **Relais d'Astra-Téléportation** (P4) : balise mobile d'apparition de Portes.
18. **Artillerie Phasique** (P5) : artillerie lourde tirant sans ligne de vue.

**Unités Suprêmes de la Trinité (P5 — Archéo + Génétique + Science)**

19. **Commandeur Transhumain** : champion polyvalent plasma/soin/bouclier.
20. **Titan d'Astra-Chair** : unité colossale à canon à distorsion et auto-réparation.
21. **Avatar Cosmique** (Ultime) : mobilité absolue, invulnérabilité et destruction.

---

## 13. Catalogue complet des 35 unités (structure 7 paliers)

<!-- schema: familles-unites -->

### 🔮 Pures Archéomages (5 unités)

- **Inquisiteur Runique (P1)** : infanterie de détection et tirs magiques de base.
- **Poseur de Glyphes (P2)** : pose des pièges invisibles sur le damier qui explosent au contact.
- **Faucheur d'Éther (P3)** : assassin astral qui traverse les obstacles et ignore les boucliers physiques.
- **Canaliseur de Portes (P4)** : réduit le coût d'invocation des renforts à travers les Portes.
- **Archonte Astral (P6)** : unité de soutien volant infligeant des malédictions massives et restaurant le mana.

### 🧬 Pures Généticiens (5 unités)

- **Pionnier Mutant (P1)** : troupes très rapides pour capturer rapidement les cases neutres.
- **Clonat de Choc (P2)** : infanterie bon marché et produite en masse pour submerger l'ennemi.
- **Berserker Organique (P3)** : combattant dont la vitesse et les dégâts augmentent avec la perte de PV.
- **Behemoth Cellulaire (P4)** : colosse biologique absorbant les tirs à la place des troupes plus faibles.
- **Hydre de Muta-Culture (P6)** : monstre à plusieurs têtes qui se régénère et attaque plusieurs cibles adjacentes.

### ⚙️ Pures Scientifiques (5 unités)

- **Drone de Reconnaissance (P1)** : éclaireur mécanique rapide à très longue portée de vue.
- **Sentinelle Automatisée (P2)** : tourelle mobile pour sécuriser les points stratégiques du damier.
- **Exosquelette d'Assaut (P3)** : infanterie lourde blindée armée de canons à haute cadence.
- **Char à Plasma Lourd (P4)** : artillerie mobile très efficace contre les structures et les bastions.
- **Fortification Volante (P6)** : plateforme blindée servant de couverture lourde mobile.

### 🔮🧬 Hybrides Archéomages + Généticiens (Bio-Magie) — 5 unités

- **Muta-Chaman (P3)** : convertit les dégâts magiques en soins biologiques de zone.
- **Traqueur Ombral (P4)** : bête biologique invisible capable d'embuscades venimeuses.
- **Garde-Biomantique (P5)** : guerrier se régénérant lorsqu'un sort est lancé près de lui.
- **Araignée Éthérée (P6)** : tisse des toiles de mana qui immobilisent et empoisonnent les troupes ennemies.
- **Léviathan Résonant (P7)** : créature colossale dont les rugissements magiques étourdissent les armées ennemies.

### 🧬⚙️ Hybrides Généticiens + Scientifiques (Cyber-Bionique) — 5 unités

- **Cyborg de Siège (P3)** : tank alliant masse corporelle et boucliers mécaniques anti-structure.
- **Infiltrateur Cybernétique (P4)** : assassin bionique très rapide armé de lames à haute fréquence.
- **Colosse Biomécanique (P5)** : géant de chair armé d'un canon dorsal alimenté par son propre métabolisme.
- **Nuée de Bio-Drones (P6)** : micro-organismes mécanisés qui dévorent l'armure et la santé des cibles.
- **Dreadnought Organo-Mécanique (P7)** : usine marchande vivante qui répare les véhicules et guérit les troupes.

### ⚙️🔮 Hybrides Scientifiques + Archéomages (Techno-Magie) — 5 unités

- **Golem Mécanisé (P3)** : châssis blindé propulsé par de l'énergie runique, tirant à travers les obstacles.
- **Relais d'Astra-Téléportation (P4)** : balise mécanique mobile servant de point d'apparition pour les Portes.
- **Artillerie Phasique (P5)** : canon lourd tirant à travers la Toile cosmique sans ligne de vue.
- **Frégate Runique (P6)** : vaisseau atmosphérique tirant des rayons de plasma magique perforants.
- **Automate Temporel (P7)** : robot magique capable de figer les unités ennemies dans une bulle temporelle.

### 🌟 Unités Suprêmes de la Trinité (Archéo + Génétique + Science) — 5 unités

- **Commandeur Transhumain (P5)** : champion polyvalent oscillant entre tirs plasma, soins et boucliers arcaniques.
- **Titan d'Astra-Chair (P6)** : colosse doté d'un canon à distorsion, d'auto-réparation et d'une aura d'affaiblissement.
- **Colosse de Singularité (P7)** : unité de rupture créant un trou noir localisé qui attire et broie les armées ennemies.
- **Vaisseau-Mère Transcendant (P7)** : station volante projetant un rayon orbital destructeur alimenté par les 3 axes.
- **Avatar Cosmique (Unité Ultime — P7)** : le sommet absolu. Téléportation sans limite, invulnérabilité temporaire et capacité de détruire une case fortifiée en un seul tour.

---

## 14. Matrice de répartition & équilibre des 35 unités

```
+---------------------------+------------------+-----------------------------------------------------------------+
| Catégorie                 | Nombre d'Unités  | Rôle Stratégique Global                                         |
+---------------------------+------------------+-----------------------------------------------------------------+
| Archéomages Purs          | 5                | Contrôle de carte, vision, pièges, manipulation du mana.        |
| Généticiens Purs          | 5                | Infanterie de masse, régénération, adaptation aux terrains.     |
| Scientifiques Purs        | 5                | Pilonnage à distance, véhicules lourds, boucliers balistiques.  |
| Bio-Magie (A + G)         | 5                | Soins avancés, invocations de bêtes, effets de statut complexes.|
| Cyber-Bionique (G + S)    | 5                | Démolition de structures, tanks à haute vitesse, auto-réparation|
| Techno-Magie (S + A)      | 5                | Artillerie longue portée, téléportation tactique, tirs phasiques|
| Trinité (A + G + S)       | 5                | Unités de fin de partie (Endgame), héros colossaux, conditions  |
|                           |                  | de victoire.                                                    |
+---------------------------+------------------+-----------------------------------------------------------------+
```

---
---

# PARTIE IV — LE COMBAT PUR : TRIANGULATION SANS HYBRIDATION

> Refonte complète basée **uniquement sur le combat** (aucune récolte / économie), où
> chaque branche reste **strictement séparée** (pas de fusion hybride).
> *(La version « design document » précise : sans gestion de ressources ni économie ; la
> version étendue y adjoint néanmoins l'écosystème économique reproduit en Partie VII.)*

## 15. Principes fondamentaux & triangulation tactique

Le jeu repose sur un système pur de combat tactique articulé autour d'une boucle
d'avantages croisés strictement séparée en trois branches : **Science, Génétique
et Archéomages**.

**[BOUCLE DE PROGRESSION & SUPÉRIORITÉ]**

<!-- schema: triangulation -->

```
Science ---> Génétique ---> Archéomages ---> Science

              ┌────────────────────────┐
              ▼                        │
       [ SCIENTIFIQUES ]               │
     (Perfore / Annule)                │
              │                        │
              ▼                        │
       [ GENÉTICIENS ]                 │
    (Absorbe / Neutralise)             │
              │                        │
              ▼                        │
      [ ARCHÉOMAGES ] ─────────────────┘
    (Contourne / Surcharge)
```

- **Science > Génétique** :
  Les munitions perforantes, le plasma et les agents cautérisants annulent la
  régénération biologique et percent les tissus renforcés.
  *(Variante : les armes à plasma, obus perforants et champs de stase annulent les
  régénérations cellulaires et percent les boucliers biologiques.)*

- **Génétique > Archéomages** :
  Les réserves de PV massives, la densité musculaire et l'immunité aux
  altérations d'esprit étouffent le mana et détruisent la fragilité des mages.
  *(Variante : la masse musculaire, l'immunité aux altérations d'esprit et l'absorption
  organique étouffent les sorts et la fragilité des mages.)*

- **Archéomages > Science** :
  Les attaques phasiques, la téléportation et les surcharges arcaniques
  ignorent les blindages mécaniques et court-circuitent l'électronique.
  *(Variante : les tirs phasiques, la téléportation et les malédictions magiques ignorent
  les blindages mécaniques et court-circuitent les systèmes électroniques.)*

---

## 16. Progression alternée par palier (lecture narrative)

À chaque niveau, un axe prend l'avantage tactique sur le suivant, créant un roulement
dans l'efficacité des unités.

**Palier 1 — L'Infanterie de Ligne**

- *Avantage Science* : **Exosquelette de Tir**. Ses balles perforantes réduisent à néant la peau renforcée des mutants de base.
- *Avantage Génétique* : **Guerrier Mutant**. Sa masse biologique submerge et étouffe la magie naissante des mages.
- *Avantage Archéo* : **Inquisiteur Runique**. Ses tirs arcaniques traversent les armures de fer sans toucher au métal.

**Palier 2 — Les Unités de Siège & Démolition**

- *Avantage Science* : **Canon à Plasma Lourd**. Cautérise et dissout instantanément les monstres régénérants sur les remparts.
- *Avantage Génétique* : **Behemoth de Muta-Chair**. Absorbe les vagues de magie de zone sans chanceler grâce à sa réserve de PV massive.
- *Avantage Archéo* : **Faucheur d'Éther**. Se téléporte derrière les lignes blindées pour détruire les cockpits des pièces d'artillerie.

**Palier 3 — Le Contrôle de Zone**

- *Avantage Science* : **Émetteur de Stase EMP**. Neutralise les systèmes nerveux et métabolismes des créatures biologiques à portée.
- *Avantage Génétique* : **Traqueur Venimeux**. Traque et empoisonne les unités magiques avant qu'elles ne puissent canaliser leurs sorts.
- *Avantage Archéo* : **Sphère de Distorsion Runique**. Redirige les obus et tirs mécaniques vers leurs propres lanceurs.

**Palier 4 — L'Artillerie Lourde**

- *Avantage Science* : **Batterie d'Artillerie Orbitale**. Frappe atomique/plasma qui annihile les armées organiques sur une vaste zone.
- *Avantage Génétique* : **Hydre Métabolique**. Se divise à la mort sous les attaques magiques pour multiplier le nombre d'assaillants.
- *Avantage Archéo* : **Artillerie Phasique**. Tire à travers la Toile cosmique pour détruire les usines de chars adverses hors de portée de riposte.

**Palier 5 — Les Unités Volantes & Domination Aérienne**

- *Avantage Science* : **Chasseur à Rayon Cautérisant**. Découpe et brûle les créatures volantes avant qu'elles n'approchent.
- *Avantage Génétique* : **Léviathan Organique Volant**. Projette des spores étouffantes qui réduisent au silence les mages célestes.
- *Avantage Archéo* : **Archonte de Tempête**. Foudroie et dérègle les commandes de navigation des vaisseaux mécaniques.

**Palier 6 — Les Unités Suprêmes de Rupture**

- *Avantage Science* : **Titan Mécanisé à Anti-Matière**. Annihile la matière organique en un tir, rendant la régénération biologique impossible.
- *Avantage Génétique* : **Colosse Transhumain Organique**. Immunisé totalement aux sorts et au contrôle mental, il écrase les lignes arcaniques.
- *Avantage Archéo* : **Avatar de l'Éther**. Rend l'armée intangible aux tirs physiques/mécaniques et désintègre les structures en un instant.

### 16.1 Synthèse des paliers et des dominances

```
+--------+-------------+--------------------+--------------------+-------------------------------------------------+
| Palier | Type d'Unité| Branche Dominante  | Branche Dominée    | Raison Tactique du Titre                        |
+--------+-------------+--------------------+--------------------+-------------------------------------------------+
| P1     | Infanterie  | Science            | Génétique          | Munitions perforantes contre peau biologique.   |
| P2     | Siège       | Génétique          | Archéomages        | Masse de PV encaissant les sorts de zone.       |
| P3     | Contrôle    | Archéomages        | Science            | Tirs phasiques ignorant les boucliers balistiq. |
| P4     | Artillerie  | Science            | Génétique          | Cautérisation de zone empêchant la régénération.|
| P5     | Aérien      | Génétique          | Archéomages        | Spores étouffantes bloquant la canalisation.    |
| P6     | Suprême     | Archéomages        | Science            | (Contournement phasique / court-circuit.)       |
+--------+-------------+--------------------+--------------------+-------------------------------------------------+
```

---

## 17. Synthèse générale de la progression par palier (1 à 6)

<!-- schema: matrice-combat -->

```
+------+-------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| Pal. | Rôle Tactique     | Science (Perfore)     | Génétique (Absorbe)   | Archéomages (Contour.)| Domination du Palier  |
+------+-------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| P1   | Infanterie Ligne  | Exosquelette de Tir   | Guerrier Mutant       | Inquisiteur Runique   | Science > Génétique   |
| P2   | Siège & Démol.    | Canon à Plasma Lourd  | Behemoth Muta-Chair   | Faucheur d'Éther      | Génétique > Archéo    |
| P3   | Contrôle de Zone  | Émetteur Stase EMP    | Traqueur Venimeux     | Sphère de Distorsion  | Archéo > Science      |
| P4   | Artillerie Lourde | Batterie Orbitale     | Hydre Métabolique     | Artillerie Phasique   | Science > Génétique   |
| P5   | Domination Aér.   | Chasseur à Rayon      | Léviathan Volant      | Archonte de Tempête   | Génétique > Archéo    |
| P6   | Unités Suprêmes   | Titan Anti-Matière    | Colosse Transhumain   | Avatar de l'Éther     | Archéo > Science      |
+------+-------------------+-----------------------+-----------------------+-----------------------+-----------------------+
```

---
---

## 18. Spécifications techniques des unités, Palier 1 à Palier 6

> Chaque fiche réunit : la description narrative, le schéma de dominance, le profil
> chiffré et les compétences dans leur rédaction complète.

---

### PALIER 1 — INFANTERIE DE LIGNE

#### 1.1 Exosquelette de Tir (Axe Science)

Un soldat augmenté en armure asservie, équipé d'un fusil d'assaut à haute cadence et
de munitions à fragmentation anti-chair.

```
               [ EXOSQUELETTE DE TIR (Science) ]
                               │
                Munitions Perforantes (Anti-Organique)
                               │
                               ▼
               [ GUERRIER MUTANT (Génétique) ]
```

**Profil & statistiques**

- **Rôle** : infanterie de ligne à distance / dégâts continus anti-chair.
- **PV** : 650
- **Armure Physique / Énergétique** : 25 / 5 *(châssis en acier trempé, sensible aux tirs d'énergie arcanique)*
- **Portée d'attaque** : 3 cases
- **Dégâts de base** : 110 *(Type : Balistique / Perforant)*

**Compétences de combat**

- **Balles Cautérisantes (Passif)** : chaque tir réduit la régénération de PV de la cible de **40 % pendant 2 tours** (très efficace contre les mutants).
- **Rafale Perforante (Actif — Recharge : 2 tours)** : tire une salve de **3 projectiles** étalés. Inflige un total de **180 dégâts** avec un bonus de **+50 % contre les cibles biologiques** (Axe Génétique).
- **Viseur Tactique (Passif)** : augmente la précision de **20 %** si l'unité n'a pas bougé pendant son tour.

#### 1.2 Guerrier Mutant (Axe Génétique)

Un soldat génétiquement modifié possédant une densité musculaire surhumaine et une
peau chitineuse absorbant la magie.

```
                 [ GUERRIER MUTANT (Génétique) ]
                               │
                Masse Musculaire (Anti-Magie)
                               │
                               ▼
               [ INQUISITEUR RUNIQUE (Archéo) ]
```

**Profil & statistiques**

- **Rôle** : infanterie de choc de mêlée / anti-magie.
- **PV** : 1 100
- **Armure Physique / Énergétique** : 10 / 35 *(peau organique souple résistant aux sorts, vulnérable aux balles perforantes)*
- **Portée d'attaque** : 1 case (Mêlée)
- **Dégâts de base** : 95 *(Type : Tranchant / Biologique)*

**Compétences de combat**

- **Cuir Dissipateur (Passif)** : réduit de **40 %** tous les dégâts magiques subis (Axe Archéomages) et immunise l'unité contre le **silence** et l'**immobilisation magique**.
- **Bond de Traque (Actif — Recharge : 2 tours)** : saute sur une cible située à **2 cases**, lui inflige **140 dégâts physiques** et la réduit au **silence** (bloque ses sorts) pendant 1 tour.
- **Régénération Cellulaire (Passif)** : récupère **5 % de ses PV maximum** au début de chaque tour *(neutralisé par les armes de la Science)*.

#### 1.3 Inquisiteur Runique (Axe Archéomages)

Un adepte initié maniant un bâton d'éther, tirant des orbes de pure énergie arcanique
qui traversent le métal sans frottement.

```
               [ INQUISITEUR RUNIQUE (Archéo) ]
                               │
                Projectiles Phasiques (Anti-Mécanique)
                               │
                               ▼
               [ EXOSQUELETTE DE TIR (Science) ]
```

**Profil & statistiques**

- **Rôle** : infanterie magique / perce-blindage.
- **PV** : 500
- **Armure Physique / Énergétique** : 35 / 5 *(voile éthéré déviant les balles et impacts physiques, très fragile au corps-à-corps)*
- **Portée d'attaque** : 3 cases
- **Dégâts de base** : 130 *(Type : Arcanique / Phasique)*

**Compétences de combat**

- **Sceptre Phasique (Passif)** : ignore **60 %** de l'armure physique et mécanique (Axe Science). Ses tirs traversent directement le blindage de l'exosquelette.
- **Surcharge Runique (Actif — Recharge : 2 tours)** : canalise un rayon d'énergie qui inflige **190 dégâts** et court-circuite les armes de la cible, réduisant ses dégâts de **30 % au tour suivant**.
- **Escapade Éthérée (Passif)** : si attaqué au corps-à-corps, **25 % de chances** de se téléporter automatiquement sur une case libre adjacente.

#### 1.4 Tableau comparatif du Palier 1

```
+-------------------------------+-------+-----------------------------+---------------------------+---------------------------+
| Unité                         | PV    | Résistance Principale       | Proie (Cible Prioritaire) | Prédateur (Menace)        |
+-------------------------------+-------+-----------------------------+---------------------------+---------------------------+
| Exosquelette de Tir (Science) | 650   | Armure Physique (25)        | Guerrier Mutant           | Inquisiteur Runique       |
| Guerrier Mutant (Génétique)   | 1 100 | Armure Énergétique (35)     | Inquisiteur Runique       | Exosquelette de Tir       |
| Inquisiteur Runique (Archéo)  | 500   | Voile Physico-Éthéré (35)   | Exosquelette de Tir       | Guerrier Mutant           |
+-------------------------------+-------+-----------------------------+---------------------------+---------------------------+
```

---

### PALIER 2 — SIÈGE & DÉMOLITION

#### 2.1 Canon à Plasma Lourd (Axe Science)

Une pièce d'artillerie thermique sur chenilles conçue pour incinérer et liquéfier les
tissus biologiques et les remparts de chair.

```
               [ CANON À PLASMA LOURD (Science) ]
                               │
               Surchauffe Thermique (Anti-Organique)
                               │
                               ▼
               [ BEHEMOTH DE MUTA-CHAIR (Génétique) ]
```

**Profil & statistiques**

- **Rôle** : destruction de fortifications biologiques / dégâts de zone.
- **PV** : 1 800
- **Armure Physique / Énergétique** : 60 / 15 *(blindage balistique lourd, très vulnérable aux sorts phasiques)*
- **Portée d'attaque** : 6 cases (portée minimale : 2 cases)
- **Dégâts de base** : 320 *(Type : Plasma / Incendiaire)*

**Compétences de combat**

- **Cautérisation Structurelle (Passif)** : toutes les attaques de zone appliquent l'effet **Chair Fondue**. Les unités biologiques subissent **40 dégâts bruts par tour** et perdent **100 % de leur capacité de régénération naturelle pendant 2 tours**.
- **Tir de Bombardement Plasma (Actif — Recharge : 2 tours)** : vise un hexagone et touche toutes les unités adjacentes. Inflige **450 dégâts** et **+60 % de dégâts bonus contre l'Axe Génétique**.
- **Ancrage de Siège (Actif)** : l'unité se fixe au sol. Immobilisée, elle gagne **+2 en portée** et **+20 % de dégâts**, mais réduit sa **résistance magique à zéro**.

#### 2.2 Behemoth de Muta-Chair (Axe Génétique)

Une masse vivante de muscles hyper-denses et d'ossements imbriqués, capable d'encaisser
et d'étouffer les explosions arcaniques.

```
             [ BEHEMOTH DE MUTA-CHAIR (Génétique) ]
                               │
               Absorption d'Énergie (Anti-Magie)
                               │
                               ▼
               [ FAUCHEUR D'ÉTHER (Archéo) ]
```

**Profil & statistiques**

- **Rôle** : bélier vivant / tank anti-magie / démolition de portes.
- **PV** : 4 200
- **Armure Physique / Énergétique** : 20 / 70 *(formidable réserve de PV et résistance magique, sensible aux flammes du plasma)*
- **Portée d'attaque** : 1 case (Mêlée)
- **Dégâts de base** : 280 *(Type : Impact / Concussif)*

**Compétences de combat**

- **Cortex Absorbeur (Passif)** : réduit de **50 %** tous les dégâts magiques et arcaniques subis (Axe Archéomages). **Chaque sort reçu régénère 5 % de ses PV max.**
- **Charge d'Écrasement (Actif — Recharge : 2 tours)** : charge en ligne droite sur **3 cases**. Traverse les unités ennemies, leur inflige **350 dégâts** et les **étourdit**. **Brûle la réserve de mana/focale** des unités magiques touchées.
- **Projection d'Osséine (Actif — Recharge : 3 tours)** : expulse des épines osseuses à **2 cases** à la ronde, **détruisant les barrières magiques** et infligeant **200 dégâts d'impact**.

#### 2.3 Faucheur d'Éther (Axe Archéomages)

Un tisseur de sorts assassin capable de franchir les lignes ennemies par téléportation
pour détruire les pièces d'artillerie lourdes de l'intérieur.

```
                 [ FAUCHEUR D'ÉTHER (Archéo) ]
                               │
               Siphonnage Phasique (Anti-Mécanique)
                               │
                               ▼
               [ CANON À PLASMA LOURD (Science) ]
```

**Profil & statistiques**

- **Rôle** : saboteur d'artillerie / dégâts perforants phasiques.
- **PV** : 1 200
- **Armure Physique / Énergétique** : 80 / 10 *(intangibilité physique élevée déviant les tirs, fragile face à la masse biologique)*
- **Portée d'attaque** : 2 cases
- **Dégâts de base** : 390 *(Type : Arcanique / Perforant)*

**Compétences de combat**

- **Lame Phasique (Passif)** : ignore **75 %** de l'armure physique et mécanique (Axe Science). Ses attaques traversent les blindages lourds comme s'ils n'existaient pas.
- **Saut d'Ombre Arcanique (Actif — Recharge : 2 tours)** : se téléporte immédiatement **derrière une unité mécanique** ou une structure cible dans un rayon de **4 cases** et effectue une **attaque critique garantie (+50 % dégâts)**.
- **Décharge de Dissolution (Actif — Recharge : 3 tours)** : canalise un rayon qui détruit les systèmes électroniques et **verrouille les armes** du Canon à Plasma ennemi pendant **1 tour**.

#### 2.4 Tableau comparatif du Palier 2

```
+-----------------------------------+-------+-------------------------+---------------------------+---------------------------+
| Unité                             | PV    | Résistance Principale   | Proie (Cible Prioritaire) | Prédateur (Menace)        |
+-----------------------------------+-------+-------------------------+---------------------------+---------------------------+
| Canon à Plasma Lourd (Science)    | 1 800 | Armure Physique (60)    | Behemoth de Muta-Chair    | Faucheur d'Éther          |
| Behemoth de Muta-Chair (Génétique)| 4 200 | Armure Énergétique (70) | Faucheur d'Éther          | Canon à Plasma Lourd      |
| Faucheur d'Éther (Archéo)         | 1 200 | Intangibilité Phys. (80)| Canon à Plasma Lourd      | Behemoth de Muta-Chair    |
+-----------------------------------+-------+-------------------------+---------------------------+---------------------------+
```

---

### PALIER 3 — CONTRÔLE DE ZONE

#### 3.1 Émetteur de Stase EMP (Axe Science)

Un véhicule chenillé déployant des impulsions électromagnétiques et des gaz
neurotoxiques pour paralyser la matière biologique.

```
              [ ÉMETTEUR DE STASE EMP (Science) ]
                               │
               Gaz Cautérisant & EMP (Anti-Organique)
                               │
                               ▼
               [ TRAQUEUR VENIMEUX (Génétique) ]
```

**Profil & statistiques**

- **Rôle** : neutralisation de zone / anti-organique / entrave.
- **PV** : 2 400
- **Armure Physique / Énergétique** : 80 / 20 *(carapace mécanique lourde, très vulnérable aux résonances magiques)*
- **Portée d'attaque** : 3 cases
- **Dégâts de base** : 210 *(Type : Chimique / Électromagnétique — noté aussi EMP/Chimique)*

**Compétences de combat**

- **Champ Cautérisant (Passif)** : toutes les unités biologiques dans un **rayon de 2 cases** subissent **-60 % de soin/régénération** et perdent **50 PV par tour**.
- **Onde d'Inhibition (Actif — Recharge : 2 tours)** : émet une onde sur un **rayon de 2 cases**. Inflige **280 dégâts**, applique un **ralentissement de 50 %** et réduit les **dégâts physiques des unités biologiques de 40 % pendant 2 tours**.
- **Projections de Stase (Actif — Recharge : 3 tours)** : bloque une case du damier pendant **1 tour**, empêchant toute unité organique d'y traverser ou de s'y installer.

#### 3.2 Traqueur Venimeux (Axe Génétique)

Une créature arachnide agile dotée de neurotoxines étouffantes, conçue pour débusquer
et traquer les lanceurs de sorts.

```
               [ TRAQUEUR VENIMEUX (Génétique) ]
                               │
               Neurotoxines de Silence (Anti-Magie)
                               │
                               ▼
            [ SPHÈRE DE DISTORSION (Archéo) ]
```

**Profil & statistiques**

- **Rôle** : embuscade / anti-magie / traqueur de mages.
- **PV** : 2 900
- **Armure Physique / Énergétique** : 25 / 85 *(exosquelette organique absorbant les perturbations arcaniques, fragile face aux armes lourdes)*
- **Portée d'attaque** : 2 cases
- **Dégâts de base** : 260 *(Type : Toxique / Chitineux)*

**Compétences de combat**

- **Fibrillation Toxique (Passif)** : réduit de **50 %** les dégâts magiques subis (Axe Archéomages). Chaque attaque **empoisonne** la cible (**60 dégâts/tour pendant 3 tours**).
- **Morsure Muteuse (Actif — Recharge : 2 tours)** : bondit sur une cible et lui inflige **380 dégâts**. Applique un **Silence total** pendant 1 tour et **draine 50 points de mana/focale**.
- **Toile Organique (Actif — Recharge : 3 tours)** : **immobilise une unité magique** à distance pendant **2 tours** et **la tire d'une case** vers le Traqueur.

#### 3.3 Sphère de Distorsion Runique (Axe Archéomages)

Un réceptacle éthéré lévitant qui déforme l'espace-temps pour dévier les projectiles
physiques et perturber les circuits électroniques.

```
            [ SPHÈRE DE DISTORSION (Archéo) ]
                               │
               Réfraction Arcanique (Anti-Mécanique)
                               │
                               ▼
              [ ÉMETTEUR DE STASE EMP (Science) ]
```

**Profil & statistiques**

- **Rôle** : déviateur de tirs / anti-mécanique / miroir tactique.
- **PV** : 1 600
- **Armure Physique / Énergétique** : 100 / 15 *(champ d'intangibilité repoussant la matière physique, sans défense contre le venin)*
- **Portée d'attaque** : 4 cases
- **Dégâts de base** : 290 *(Type : Disruption / Arcanique)*

**Compétences de combat**

- **Miroir de Focale (Passif)** : ignore **70 %** des dégâts mécaniques et balistiques (Axe Science).
- **Renvoi de Projectile (Actif — Recharge : 2 tours)** : active une bulle de réflexion pendant 1 tour. Le **prochain tir à distance reçu est entièrement annulé et renvoyé** vers l'attaquant avec **+20 % de dégâts**.
- **Surcharge Phasique (Actif — Recharge : 3 tours)** : crée une zone de distorsion de **2x2 cases**. Les unités mécaniques à l'intérieur subissent **320 dégâts phasiques** et voient leurs **armes verrouillées pendant 1 tour**.

#### 3.4 Tableau comparatif du Palier 3

```
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
| Unité                           | PV    | Résistance Principale    | Proie (Cible Prioritaire) | Prédateur (Menace)        |
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
| Émetteur de Stase (Science)     | 2 400 | Armure Physique (80)     | Traqueur Venimeux         | Sphère de Distorsion      |
| Traqueur Venimeux (Génétique)   | 2 900 | Armure Énergétique (85)  | Sphère de Distorsion      | Émetteur de Stase         |
| Sphère de Distorsion (Archéo)   | 1 600 | Intangibilité Phys. (100)| Émetteur de Stase         | Traqueur Venimeux         |
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
```

---

### PALIER 4 — ARTILLERIE LOURDE

#### 4.1 Batterie d'Artillerie Orbitale (Axe Science)

Un complexe de tir automatisé guidé par satellite, larguant des frappes thermiques
massives pour incinérer des légions biologiques entières.

```
           [ BATTERIE ORBITALE (Science) ]
                          │
          Frappe Incendiaire (Anti-Organique)
                          │
                          ▼
            [ HYDRE MÉTABOLIQUE (Génétique) ]
```

**Profil & statistiques**

- **Rôle** : bombardement à très longue portée / cautérisation de masse.
- **PV** : 3 500
- **Armure Physique / Énergétique** : 100 / 25 *(blindage d'artillerie renforcé, vulnérable aux tirs trans-dimensionnels)*
- **Portée d'attaque** : 8 cases (portée minimale : 3 cases)
- **Dégâts de base** : 620 *(Type : Thermique / Orbital)*

**Compétences de combat**

- **Cautérisation Atomique (Passif)** : toutes les attaques au sol **enflamment la zone pendant 2 tours**. Les unités biologiques qui y restent subissent **120 dégâts bruts par tour** et voient toute régénération/soin **réduite à 0**.
- **Frappe de Rayon Convertisseur (Actif — Recharge : 2 tours)** : vise une zone de **3x3 cases**. Après **1 tour de verrouillage**, déchaîne un rayon qui inflige **850 dégâts** avec **+70 % de dégâts contre les cibles biologiques**.
- **Ancrage Sécurisé (Passif)** : déploie des vérins hydrauliques augmentant la résistance aux **étourdissements et déplacements forcés de 80 %**.

#### 4.2 Hydre Métabolique (Axe Génétique)

Un béhémoth multi-têtes à croissance rapide capable d'absorber les attaques magiques
et de déverser des flots d'acide corrosif.

```
            [ HYDRE MÉTABOLIQUE (Génétique) ]
                          │
           Projection Acide & Scission (Anti-Magie)
                          │
                          ▼
            [ ARTILLERIE PHASIQUE (Archéo) ]
```

**Profil & statistiques**

- **Rôle** : artillerie vivante / multiplication / anti-magie.
- **PV** : 8 200
- **Armure Physique / Énergétique** : 35 / 120 *(formidable endurance magique, sensible aux attaques orbitales incendiaires)*
- **Portée d'attaque** : 5 cases
- **Dégâts de base** : 490 *(Type : Acide Bio-Corrosif)*

**Compétences de combat**

- **Dissipation Tégumentaire (Passif)** : réduit de **55 %** tous les dégâts magiques subis (Axe Archéomages).
- **Division Cellulaire (Réaction à la mort)** : à sa destruction **par une attaque magique**, se sépare en **2 Hydra-Petits** ayant **25 % des PV max** et gardant la capacité de cracher de l'acide.
- **Marge d'Acide Corrosif (Actif — Recharge : 2 tours)** : crache un torrent d'acide sur une **ligne de 4 cases**. Inflige **600 dégâts** et **détruit 100 % de la réserve de mana/focale** des lanceurs de sorts touchés.

#### 4.3 Artillerie Phasique (Axe Archéomages)

Une relique arcanique capable d'ouvrir des micro-brèches dans le Voile pour envoyer
des projectiles magiques directement au cœur des véhicules blindés.

```
            [ ARTILLERIE PHASIQUE (Archéo) ]
                          │
           Décharge Trans-Voile (Anti-Mécanique)
                          │
                          ▼
           [ BATTERIE ORBITALE (Science) ]
```

**Profil & statistiques**

- **Rôle** : artillerie de rupture / destruction d'artillerie lourde.
- **PV** : 2 200
- **Armure Physique / Énergétique** : 130 / 20 *(forme en résonance astrale déviant les tirs conventionnels, très vulnérable aux acides organiques)*
- **Portée d'attaque** : 7 cases
- **Dégâts de base** : 710 *(Type : Arcanique / Trans-Phasique)*

**Compétences de combat**

- **Voile Immatériel (Passif)** : ignore **75 %** des dégâts mécaniques, explosifs et balistiques (Axe Science).
- **Perce-Blindage Astral (Actif — Recharge : 2 tours)** : tire un projectile à travers la Toile espace-temporelle. **Ignore l'armure** de la cible, inflige **950 dégâts phasiques** aux unités mécaniques et **désactive leur arme principale pendant 1 tour**.
- **Brèche de Repli (Actif — Recharge : 3 tours)** : crée un portail sous elle-même pour se téléporter à **4 cases** de distance en laissant un **piège arcanique étourdissant**.

#### 4.4 Tableau comparatif du Palier 4

```
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
| Unité                           | PV    | Résistance Principale    | Proie (Cible Prioritaire) | Prédateur (Menace)        |
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
| Batterie Orbitale (Science)     | 3 500 | Armure Physique (100)    | Hydre Métabolique         | Artillerie Phasique       |
| Hydre Métabolique (Génétique)   | 8 200 | Armure Énergétique (120) | Artillerie Phasique       | Batterie Orbitale         |
| Artillerie Phasique (Archéo)    | 2 200 | Voile Immatériel (130)   | Batterie Orbitale         | Hydre Métabolique         |
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
```

---

### PALIER 5 — UNITÉS VOLANTES & DOMINATION AÉRIENNE

#### 5.1 Chasseur à Rayon Cautérisant (Axe Science)

Un appareil anti-biologique rapide équipé de lasers thermiques à haute fréquence pour
découper les créatures célestes.

```
                 [ CHASSEUR À RAYON (Science) ]
                               │
               Rayon Thermique (Anti-Organique)
                               │
                               ▼
               [ LÉVIATHAN VOLANT (Génétique) ]
```

**Profil & statistiques**

- **Rôle** : intercepteur aérien / anti-organique à haute cadence.
- **PV** : 3 200
- **Armure Physique / Énergétique** : 75 / 20 *(châssis blindé léger, sensible aux décharges magiques)*
- **Portée d'attaque** : 4 cases
- **Dégâts de base** : 480 *(Type : Plasma / Thermique)*

**Compétences de combat**

- **Faisceau Cautérisant (Passif)** : chaque tir réussi réduit de **50 %** l'efficacité des soins et de la régénération de la cible pendant **2 tours**.
- **Mitraillage Incendiaire (Actif — Recharge : 2 tours)** : survole **3 cases en ligne droite**. Inflige **650 dégâts thermiques** à toutes les unités traversées, avec **+75 % de dégâts contre les cibles biologiques**.
- **Roue d'Évasion (Réaction)** : **30 % de chances** d'esquiver totalement une attaque de mêlée ou un projectile physique.

#### 5.2 Léviathan Organique Volant (Axe Génétique)

Une monstruosité céleste de chair et de membranes, projetant des nuages de spores
asphyxiantes pour faire taire les mages.

```
               [ LÉVIATHAN VOLANT (Génétique) ]
                               │
               Spores Effondrantes (Anti-Magie)
                               │
                               ▼
                [ ARCHONTE DE TEMPÊTE (Archéo) ]
```

**Profil & statistiques**

- **Rôle** : support aérien lourd / anti-magie / contrôle de zone.
- **PV** : 6 800
- **Armure Physique / Énergétique** : 30 / 95 *(résistance biologique élevée aux sorts, vulnérable aux lasers de précision)*
- **Portée d'attaque** : 2 cases
- **Dégâts de base** : 380 *(Type : Bio-Poison)*

**Compétences de combat**

- **Spores de Silence (Passif)** : les unités magiques situées à **2 cases ou moins** voient le **coût en mana de leurs compétences doublé**.
- **Nuage Asphyxiant (Actif — Recharge : 2 tours)** : lâche une zone de spores de **2x2 cases** qui persiste **2 tours**. Inflige **300 dégâts de poison par tour** et applique un **Silence total** aux unités de l'Axe Archéomages.
- **Membranes Absorbantes (Passif)** : convertit **30 %** des dégâts magiques subis **en PV pour lui-même**.

#### 5.3 Archonte de Tempête (Axe Archéomages)

Une créature d'énergie arcanique contrôlant les vents et la foudre pour dérégler les
systèmes de navigation mécaniques.

```
                [ ARCHONTE DE TEMPÊTE (Archéo) ]
                               │
                Surcharges Périphériques (Anti-Mécanique)
                               │
                               ▼
                 [ CHASSEUR À RAYON (Science) ]
```

**Profil & statistiques**

- **Rôle** : bombardier magique à distance / anti-mécanique.
- **PV** : 2 400
- **Armure Physique / Énergétique** : 110 / 15 *(forme éthérée déviant les tirs balistiques, sensible au venin biologique)*
- **Portée d'attaque** : 5 cases
- **Dégâts de base** : 580 *(Type : Électro-Arcanique)*

**Compétences de combat**

- **Champ d'Intangibilité (Passif)** : réduit de **60 %** tous les dégâts physiques et mécaniques provenant de l'Axe Science.
- **Impulsion IEMP Arcanique (Actif — Recharge : 2 tours)** : déchaîne un éclair sur une cible mécanique. Inflige **850 dégâts (ignorant le blindage)** et **immobilise les systèmes de bord** (la cible ne peut ni se déplacer ni utiliser de compétences au tour suivant).
- **Transfert Éthéré (Actif — Recharge : 3 tours)** : se téléporte de **3 cases** en laissant une **illusion arcanique qui absorbe la prochaine attaque** adverse.

#### 5.4 Tableau comparatif du Palier 5 (Aérien)

```
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
| Unité                           | PV    | Résistance Principale    | Proie (Cible Prioritaire) | Prédateur (Menace)        |
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
| Chasseur à Rayon (Science)      | 3 200 | Armure Physique (75)     | Léviathan Volant          | Archonte de Tempête       |
| Léviathan Volant (Génétique)    | 6 800 | Armure Énergétique (95)  | Archonte de Tempête       | Chasseur à Rayon          |
| Archonte de Tempête (Archéo)    | 2 400 | Intangibilité Phys. (110)| Chasseur à Rayon          | Léviathan Volant          |
+---------------------------------+-------+--------------------------+---------------------------+---------------------------+
```

---

### PALIER 6 — UNITÉS SUPRÊMES DE RUPTURE

#### 6.1 Titan Mécanisé à Anti-Matière (Axe Science)

Conçu pour désintégrer la matière biologique et annuler toute forme de régénération.

```
                 [ TITAN À ANTI-MATIÈRE (Science) ]
                                │
               Annihilation de la Chair (Anti-Soin)
                                │
                                ▼
                 [ COLOSSE TRANSHUMAIN (Génétique) ]
```

**Profil & statistiques**

- **Rôle** : destruction massive à distance / anti-organique.
- **PV** : 8 500
- **Armure Physique / Énergétique** : 120 / 40 *(très résistant aux balles/tranchant, fragile face à la magie)*
- **Portée d'attaque** : 5 cases
- **Dégâts de base** : 950 *(Type : Anti-Matière / Perforant)*

**Compétences de combat**

- **Canon Cautérisant (Passif)** : toutes les attaques appliquent l'effet **Brûlure Atomique**. Les unités touchées **ne peuvent plus régénérer leurs PV pendant 3 tours** et subissent **100 dégâts bruts par tour**.
- **Rayon d'Annihilation (Actif — Recharge : 2 tours)** : tire un rayon **en ligne droite sur 4 cases**. Inflige **1 500 dégâts** et **+100 % de dégâts bonus contre les cibles biologiques**.
- **Protocole de Stase (Réaction à la mort)** : à sa destruction, le Titan **explose en neutralisant l'armure** de toutes les unités adjacentes pendant **1 tour**.

#### 6.2 Colosse Transhumain Organique (Axe Génétique)

Un titan de chair et de tendons immunisé au contrôle mental, conçu pour étouffer les
mages sous une masse physique inarrêtable.

```
                [ COLOSSE TRANSHUMAIN (Génétique) ]
                                │
               Surcharge Métabolique (Anti-Magie)
                                │
                                ▼
                   [ AVATAR DE L'ÉTHER (Archéo) ]
```

**Profil & statistiques**

- **Rôle** : enfoncement de ligne / anti-magie.
- **PV** : 14 000
- **Armure Physique / Énergétique** : 50 / 150 *(formidablement résistant à la magie, plus vulnérable au plasma lourd)*
- **Portée d'attaque** : 1 case (Mêlée)
- **Dégâts de base** : 750 *(Type : Concussif / Biologique)*

**Compétences de combat**

- **Chair Résonante (Passif)** : réduit de **60 %** tous les dégâts magiques subis (Axe Archéomages) et **immunise l'unité au silence, à la téléportation forcée et au contrôle mental**.
- **Écrasement Synaptique (Actif — Recharge : 2 tours)** : frappe le sol et inflige **800 dégâts de zone** autour de lui. **Brûle 100 % du mana/focale** des unités magiques touchées et les **étourdit pendant 1 tour**.
- **Régénération Monstrueuse (Passif)** : récupère **8 % de ses PV max à la fin de chaque tour** *(annulé uniquement par les attaques à l'Anti-Matière de la Science)*.

#### 6.3 Avatar de l'Éther (Axe Archéomages)

Une entité de pure énergie arcanique qui traverse les blindages mécaniques et détruit
la technologie de l'intérieur.

```
                   [ AVATAR DE L'ÉTHER (Archéo) ]
                                │
                 Tir Phasique (Anti-Mécanique)
                                │
                                ▼
                 [ TITAN À ANTI-MATIÈRE (Science) ]
```

**Profil & statistiques**

- **Rôle** : contournement / anti-mécanique / destruction de blindage.
- **PV** : 6 000
- **Armure Physique / Énergétique** : 180 / 30 *(l'armure physique représente son intangibilité face aux obus/balles)*
- **Portée d'attaque** : 3 cases
- **Dégâts de base** : 1 100 *(Type : Phasique / Arcanique)*

**Compétences de combat**

- **Intangibilité Éthérée (Passif)** : ignore **80 %** des dégâts physiques et mécaniques (Axe Science). Les tirs à distance de l'artillerie le traversent sans l'impacter pleinement.
- **Surcharge Court-Circuit (Actif — Recharge : 2 tours)** : lance une vague d'énergie sur un véhicule ou une structure mécanique. Inflige **2 000 dégâts phasiques (ignorant l'armure)** et **désactive les compétences/boucliers de la cible pendant 2 tours**.
- **Pulsation d'Astra-Téléportation (Actif — Recharge : 3 tours)** : se téléporte instantanément sur n'importe quelle case libre du damier dans un **rayon de 5 cases**, en infligeant **500 dégâts magiques aux cases de départ et d'arrivée**.

#### 6.4 Tableau comparatif du Palier 6

```
+---------------------------------+--------+--------------------------+---------------------------+---------------------------+
| Unité                           | PV     | Résistance Principale    | Proie (Cible Prioritaire) | Prédateur (Menace)        |
+---------------------------------+--------+--------------------------+---------------------------+---------------------------+
| Titan à Anti-Matière (Science)  | 8 500  | Armure Physique (120)    | Colosse Transhumain       | Avatar de l'Éther         |
| Colosse Transhumain (Génétique) | 14 000 | Armure Énergétique (150) | Avatar de l'Éther         | Titan à Anti-Matière      |
| Avatar de l'Éther (Archéo)      | 6 000  | Intangibilité Phys. (180)| Titan à Anti-Matière      | Colosse Transhumain       |
+---------------------------------+--------+--------------------------+---------------------------+---------------------------+
```

---

## 19. Synthèse des confrontations d'élite (P6 & P5)

**[COMPARATIF SUPRÊME — PALIER 6]**

```
+----------------------+--------+------------------------+-----------------------+-----------------------+
| Unité                | PV     | Résistance Principale  | Proie (Cible Prior.)  | Prédateur (Menace)    |
+----------------------+--------+------------------------+-----------------------+-----------------------+
| Titan Anti-Matière   | 8 500  | Armure Physique (120)  | Colosse Transhumain   | Avatar de l'Éther     |
| Colosse Transhumain  | 14 000 | Armure Énergétique(150)| Avatar de l'Éther     | Titan Anti-Matière    |
| Avatar de l'Éther    | 6 000  | Intangibilité Phys(180)| Titan Anti-Matière    | Colosse Transhumain   |
+----------------------+--------+------------------------+-----------------------+-----------------------+
```

**[COMPARATIF AÉRIEN — PALIER 5]**

```
+----------------------+--------+------------------------+-----------------------+-----------------------+
| Unité                | PV     | Résistance Principale  | Proie (Cible Prior.)  | Prédateur (Menace)    |
+----------------------+--------+------------------------+-----------------------+-----------------------+
| Chasseur à Rayon     | 3 200  | Armure Physique (75)   | Léviathan Volant      | Archonte de Tempête   |
| Léviathan Volant     | 6 800  | Armure Énergétique (95)| Archonte de Tempête   | Chasseur à Rayon      |
| Archonte de Tempête  | 2 400  | Intangibilité Phys(110)| Chasseur à Rayon      | Léviathan Volant      |
+----------------------+--------+------------------------+-----------------------+-----------------------+
```

---
---

# PARTIE V — MODES DE JEU

## 20. Mode Dota (MOBA / action en temps réel) — le Héros et les unités hybrides

En mode Dota (MOBA / Action), le **Héros** agit comme un **commandant opérationnel** sur le
terrain. Alors que les unités hybrides produites sur tes planètes arrivent par la Porte
en **vagues automatisées** ou en **bataillons de soutien**, le Héros dispose de compétences
spécifiques pour modifier leur comportement, amplifier leurs synergies et créer des
combos tactiques en temps réel.

### 20.1 Interaction avec les Muta-Chamans (Archéo + Génétique)

Cette interaction repose sur le **transfert de ressource magique** et la gestion des flux
de soins biologiques.

- **Canalisation d'Aura Vitaliste** : le Héros sert de relais de puissance. S'il lance un
  sort de dégâts arcaniques à proximité d'un Muta-Chaman, ce dernier **absorbe le surplus
  de mana** pour déclencher instantanément une **vague de soin biologique** sur toutes les
  troupes alliées environnantes.
- **Mutation Ciblée Commandée** : le Héros peut désigner une **cible prioritaire** (bâtiment
  de siège ennemi, héros adverse). Le Muta-Chaman convertit immédiatement le bataillon
  d'infanterie le plus proche en **Muta-Monstres de choc** focalisés exclusivement sur
  cette cible.

### 20.2 Interaction avec les Cyborgs de Siège (Génétique + Science)

Le Héros exploite la masse physique et les boucliers énergétiques de ces unités lourdes
pour **verrouiller le terrain**.

- **Lien de Bouclier Synaptique** : le Héros peut « ancrer » son propre bouclier à un Cyborg
  de Siège. Tant que le lien est actif, **40 % des dégâts subis par le Héros sont transférés**
  sur la jauge de PV renforcée du Cyborg.
- **Trouée Tactique** : lorsqu'un Cyborg de Siège active son mode d'assaut pour enfoncer les
  lignes ennemies, le Héros gagne un **bonus passif de vitesse de déplacement dans son
  sillage**, lui permettant de s'infiltrer derrière la ligne de front adverse sans subir
  les tirs d'artillerie.

### 20.3 Interaction avec les Golems Mécanisés (Science + Archéo)

Cette synergie est axée sur la **mobilité spatiale** et la **redirection des tirs à longue
portée**.

- **Relais de Téléportation Courte Portée** : les Golems Mécanisés génèrent des micro-champs
  de distorsion. Le Héros peut utiliser la compétence **Saut de Porte** pour se téléporter
  instantanément d'un Golem à un autre sur le damier, créant une mobilité imprévisible
  pour l'adversaire.
- **Marquage Arcanique d'Artillerie** : le Héros applique une **marque magique** sur une unité
  ou un bâtiment ennemi. Tous les Golems Mécanisés présents dans le secteur **redirigent
  automatiquement leurs tirs de plasma arcanique** vers cette cible, **en ignorant les
  obstacles de terrain**.

### 20.4 Interaction avec l'Avatar Cosmique (Trinité)

L'Avatar Cosmique est l'**unité suprême de fin de partie**. Son interaction avec le Héros
ressemble à une **fusion de commandement**.

```
[Héros (Commandement)] ──> Synchronisation Quantique ──> [Avatar Cosmique (Puissance)]
                                    │
                                    ▼
                      Compétence Ultime : Fission Cosmique
```

- **Synchronisation Quantique** : lorsque le Héros se tient à proximité de l'Avatar, ils
  **partagent leurs jauges** : le Héros utilise la réserve d'énergie de l'Avatar pour lancer
  ses sorts **sans coût en mana**, tandis que l'Avatar bénéficie des **bonus d'équipement et
  d'expérience** du Héros.
- **Capacité Ultime Combinée (Fission Cosmique)** : le Héros peut **prendre le contrôle direct
  de l'Avatar pendant 15 secondes**. Durant cette phase, la caméra passe en **vue rapprochée**
  et les attaques de l'Avatar appliquent **simultanément les effets des 3 axes** (dégâts
  physiques lourds, dégâts magiques de zone et régénération biologique).

### 20.5 Synthèse des combos Héros / Unités hybrides

```
+------------------+---------------------------+---------------------------+---------------------------------------------+
| Unité Hybride    | Rôle principal de l'unité | Compétence du Héros       | Résultat tactique en combat                 |
+------------------+---------------------------+---------------------------+---------------------------------------------+
| Muta-Chaman      | Soin & Support biologique | Canalisation d'Aura       | Soin de zone massif déclenché par les sorts |
|                  |                           |                           | du Héros.                                   |
+------------------+---------------------------+---------------------------+---------------------------------------------+
| Cyborg de Siège  | Tank & Enfoncement        | Lien Synaptique           | Transfert des dégâts subis par le Héros     |
|                  |                           |                           | vers le Cyborg.                             |
+------------------+---------------------------+---------------------------+---------------------------------------------+
| Golem Mécanisé   | Artillerie & Micro-portes | Marquage Arcanique        | Focus automatique des tirs à distance +     |
|                  |                           |                           | téléportation.                              |
+------------------+---------------------------+---------------------------+---------------------------------------------+
| Avatar Cosmique  | Unité Ultime              | Synchronisation Quantique | Prise de contrôle direct et mana illimité   |
|                  |                           |                           | pour le Héros.                              |
+------------------+---------------------------+---------------------------+---------------------------------------------+
```

---

## 21. Mode tour par tour / siège

La gestion se fait **sur damier** par consommation de **Jauges de Commandement**.

### 21.1 Jauges des 3 axes

- **Archéomages** : **Points de Focale** (sorts de zone, altération d'initiative).
- **Généticiens** : **Résistance à la Fatigue** (maintien des stats en combat).
- **Scientifiques** : **Charges de Munitions** (pilonnage de boucliers et remparts).

### 21.2 Rôle des unités hybrides en siège

- **Muta-Chaman** : *Infection Fissuraire* (dégâts biologiques/tour aux remparts,
  **-50 % défense** aux occupants) + *Pulsation de Masse* (soin passif de zone).
- **Cyborg de Siège** : *Charge Assommante* (fonce sur 2 cases, défonce la porte,
  étourdit) + *Blindage Réactif* (**-40 % dégâts à distance** subis si immobile).
- **Golem Mécanisé** : *Tir Phasique* (ignore la ligne de vue à **6 cases**) + *Ancre de
  Porte* (sert de point d'apparition pour les renforts).
- **Avatar Cosmique** : *Effondrement Synaptique* (immobilise à 2 cases, détruit les
  boucliers) + *Aura de Singularité* (**-20 % dégâts** à toute l'armée ennemie).

---
---

# PARTIE VI — LES BIOMES

> Les biomes **n'annulent pas** la boucle de supériorité (Science → Génétique →
> Archéomages → Science), mais ils en **modifient le rythme** en offrant des bonus de
> terrain ou des malus environnementaux qui favorisent temporairement une branche ou
> amplifient/atténuent les contres naturels.
>
> Deux jeux de biomes coexistent dans les documents sources ; les deux sont conservés.

## 22. Jeu de biomes A — les 4 biomes du champ de bataille

```
+-----------------------+----------------------------------+-----------+-----------------------------------+
| Biome                 | Effet Système                    | Axe Fav.  | Impact sur la Boucle              |
+-----------------------+----------------------------------+-----------+-----------------------------------+
| Cité Mécanisée        | Perturbation de Champ :          | Science   | Amplifie le contre de la Science  |
|                       | +20% Armure Phys. pour Science,  |           | sur la Génétique. Les Archéomages |
|                       | -30% Résist. Énerg. Génétique.   |           | gardent leur avantage phasique.   |
+-----------------------+----------------------------------+-----------+-----------------------------------+
| Bassin Éco-Mutations  | Atmosphère Saturée :             | Génétique | La Génétique résiste mieux aux    |
|                       | +50% soins/régénération bio,     |           | salves Science. Archéomages très  |
|                       | -20% portée projectiles bal.     |           | désavantagés contre la chair.     |
+-----------------------+----------------------------------+-----------+-----------------------------------+
| Sanctuaire Astral     | Fluctuations d'Éther :           | Archéo.   | Avantage Archéomages sur Science  |
|                       | -30% coût en Mana/Focale,        |           | décuplé. La Génétique reste le    |
|                       | +1 portée des tirs magiques.     |           | seul rempart efficace.            |
+-----------------------+----------------------------------+-----------+-----------------------------------+
| Terre Brûlée / Cendres| Atmosphère Stérilisante :        | Science   | Cautérisation ultra-efficace.     |
|                       | -100% régénération naturelle bio,|           | La régénération de la Génétique   |
|                       | +25% dégâts de brûlure.          |           | est complètement annulée.         |
+-----------------------+----------------------------------+-----------+-----------------------------------+
```

## 23. Jeu de biomes B — les 3 biomes détaillés

### 23.1 Biome : Plaines Volcaniques & Terres Brûlées

Un environnement extrême marqué par des rivières de lave, une chaleur intense et des
cendres métalliques en suspension.

```
                  [ TERRAIN VOLCANIQUE ]
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   [ SCIENCE ]        [ GÉNÉTIQUE ]       [ ARCHÉOMAGES ]
 (Boost Thermique)   (Malus Brûlure)     (Canalisation +)
```

**Impact sur la SCIENCE (avantage majeur)**

- *Surchauffe Plasma* : les armes thermiques et à plasma (Canon à Plasma, Batterie
  Orbitale, Titan) gagnent **+20 % de dégâts** et étendent la durée de leur effet
  Brûlure/Cautérisation de **+1 tour**.
- *Dissipation Énergétique* : la présence de cendres ionisées **recharge les systèmes
  d'armure de 5 % par tour**.

**Impact sur la GÉNÉTIQUE (malus significatif)**

- *Affaiblissement Métabolique* : la chaleur extrême réduit la **régénération passive de
  50 %**.
- *Peau Cautérisée* : l'armure naturelle des unités génétiques subit un **malus permanent
  de -15 contre les tirs thermiques**.

**Impact sur les ARCHÉOMAGES (neutre / dégâts d'aura)**

- La proximité de l'énergie magmatique augmente la **portée des sorts de +1 case**, mais
  réduit de **10 % leur résistance au plasma**.

**Modification de la boucle** : la Science domine encore plus nettement la Génétique dans
ce biome. La Génétique a plus de difficultés à tenir face à la Science, obligeant le
joueur Génétique à appuyer ses attaques sur les Archéomages.

### 23.2 Biome : Forêt Vierge & Canopée Mutante

Un environnement organique dense, saturé de spores, d'humidité et d'une faune/flore
vivante réactive.

```
                   [ FORÊT VIERGE ]
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   [ SCIENCE ]      [ GÉNÉTIQUE ]     [ ARCHÉOMAGES ]
 (Ligne de tir -)  (Régénération +)  (Portée Réduite)
```

**Impact sur la GÉNÉTIQUE (avantage majeur)**

- *Communion Organique* : la régénération de PV de toutes les unités de l'Axe Génétique
  est augmentée de **+50 %**.
- *Camouflage Végétal* : les unités comme le Traqueur Venimeux ou le Guerrier Mutant
  gagnent l'état **Discrétion** (impossible à cibler à plus de **3 cases**).

**Impact sur la SCIENCE (malus de ligne de vue)**

- *Obstruction Visuelle* : la canopée bloque les tirs à longue portée. La Batterie
  Orbitale et l'Artillerie voient leur **portée maximale réduite de 2 cases**.
- *Humidité & Encrassement* : les chances d'enrayement ou de surchauffe des fusils
  balistiques augmentent.

**Impact sur les ARCHÉOMAGES (contrôle parallèle)**

- La flore perturbe la résonance des lignes de ley : la **vitesse de déplacement des mages
  est réduite de -1 case**, mais leurs **sorts de zone appliquent un enracinement de 1 tour**.

**Modification de la boucle** : ce biome permet à la Génétique de combler son retard face
à la Science grâce au camouflage et à la régénération accrue. Les engagements se font à
courte portée, ce qui désavantage l'artillerie scientifique.

### 23.3 Biome : Champ de Bataille Désolé & Ruines Métalliques

Un champ de ruines industrielles composé de carcasses de chars, de structures en acier
tordu et de débris électroniques.

```
                 [ RUINES INDUSTRIELLES ]
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   [ SCIENCE ]        [ GÉNÉTIQUE ]       [ ARCHÉOMAGES ]
(Couverture Métal)  (Mouvement Réduit)  (Amplification EMP)
```

**Impact sur les ARCHÉOMAGES (avantage majeur)**

- *Conduction Arcanique* : les réseaux de structures métalliques conduisent les décharges
  magiques. Les sorts de zone (Sphère de Distorsion, Artillerie Phasique) gagnent
  **+25 % de rayon d'effet**.
- *Surcharge des Épaves* : les unités Archéomages peuvent **faire exploser les carcasses
  mécaniques** au sol pour infliger des dégâts phasiques autour d'elles.

**Impact sur la SCIENCE (avantage déductif)**

- *Couverture Lourde* : les unités mécaniques immobiles derrière des débris gagnent
  **+30 d'Armure Physique**.

**Impact sur la GÉNÉTIQUE (malus de déplacement)**

- *Terrain Perforant* : les structures métalliques acérées et les produits chimiques
  industriels infligent **30 dégâts de saignement par tour** aux unités biologiques
  traversant les Ruines.

**Modification de la boucle** : les Archéomages deviennent extrêmement dangereux dans ce
biome. Leur capacité à surcharger le champ de bataille renforce leur avantage naturel
contre la Science et complique la progression des unités biologiques de la Génétique.

## 24. Synthèses de l'influence des biomes

<!-- schema: biomes -->

**Synthèse longue**

```
+---------------------------+-------------------+---------------------------------------+---------------------------------------------+
| Biome                     | Branche Favorisée | Effet Dominant sur le Combat          | Impact sur la Triangulation                 |
+---------------------------+-------------------+---------------------------------------+---------------------------------------------+
| Volcan                    | Science           | +Dégâts Thermiques / -Soin Biologique | La Science écrase plus vite la Génétique.   |
| Forêt Vierge              | Génétique         | +Régénération / Camouflage / -Portée  | La Génétique résiste mieux aux tirs Science.|
| Ruines / Champ de Bataille| Archéomages       | Conduction des sorts / Dégâts de zone | Les Archéomages verrouillent la Science.    |
+---------------------------+-------------------+---------------------------------------+---------------------------------------------+
```

**Synthèse condensée (version Tri-Axes)**

1. **PLAINES VOLCANIQUES & TERRES BRÛLÉES** (favorise la Science)
   - Science : +20 % dégâts plasma/thermiques, durée brûlures +1 tour.
   - Génétique : -50 % régénération passive de PV, -15 armure naturelle.
   - Archéomages : +1 portée de sort, -10 % résistance plasma.

2. **FORÊT VIERGE & CANOPÉE MUTANTE** (favorise la Génétique)
   - Génétique : +50 % régénération de PV, état Discrétion à plus de 3 cases.
   - Science : portée maximale artillerie réduite de 2 cases.
   - Archéomages : vitesse -1 case, sorts d'enracinement +1 tour.

3. **RUINES INDUSTRIELLES & CHAMP DE BATAILLE** (favorise les Archéomages)
   - Archéomages : +25 % rayon d'effet des sorts de zone (conduction du métal).
   - Science : +30 armure physique derrière les débris métalliques.
   - Génétique : 30 dégâts saignement/tour en franchissant les ruines.

---
---

# PARTIE VII — ÉCOSYSTÈME ÉCONOMIQUE, DÉMOGRAPHIQUE & SATISFACTION

## 25. Ressources système

- **Main-d'Œuvre (MO)** : générée par la population active. Requise pour construire/
  entretenir les bâtiments et former les unités de la **Science** et de la **Génétique**.
- **Focale Arcanique (FA)** : générée par la dévotion de la population (taux de
  satisfaction élevé) ou la conversion d'énergie. Requise pour les unités et sorts
  des **Archéomages**.
- **Alimentation & Biomasse (AB)** : nécessaire au maintien de la population et au
  développement des unités **Génétiques**.

## 26. Mécanisme de satisfaction (0 à 100 %)

- **80 % à 100 % — Ferveur** : +20 % vitesse de production, +50 % génération de Focale Arcanique (FA).
- **40 % à 79 % — Stabilité** : ratios de production normaux (100 %).
- **10 % à 39 % — Agitation** : -30 % vitesse de construction/recrutement, gain de FA nul.
- **< 10 % — Révolte** : arrêt total du recrutement, perte de 2 % PV max/tour sur l'infanterie.

## 27. Arbre des bâtiments (infrastructure & production)

<!-- schema: arbre-batiments -->

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      CENTRE DE GOUVERNANCE (I à III)                     │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│  QUARTIER    │              │ DISTRIBUTEUR │              │ SANCTUAIRE   │
│ RESIDENTIEL  │              │  ALIMENTAIRE │              │ D'ALIGNEMENT │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       ▼                             ▼                             ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│ INFRASTRUCT. │              │ BIOMODULE DE │              │ FOYER DE     │
│ SCIENTIFIQUE │              │   CULTURE    │              │    FOCALE    │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │                             │                             │
       ├─ Usine Matrice (P1-P2)      ├─ Gestateur Echines(P1-P2)   ├─ Autel Runes (P1-P2)
       ├─ Forge Plasma (P3-P4)       ├─ Cuve Biomasse (P3-P4)      ├─ Nexus Etherique (P3-P4)
       └─ Cpx Anti-Matiere (P5-P6)   └─ Charnier Transhum (P5-P6)  └─ Obélisque Astral (P5-P6)
```

### 27.1 Bâtiments communs

1. **Centre de Gouvernance (Niv I-III)** : cœur du territoire. Augmente le plafond démographique.
2. **Quartier Résidentiel** : augmente la population maximale (**+15 MO**).
3. **Distributeur Alimentaire** : consomme la biomasse pour générer de l'Alimentation (**+10 AB**).
4. **Sanctuaire d'Alignement** : augmente la Satisfaction (**+15 %**) et génère de la Focale
   Arcanique (**+5 FA/tour** si Satisfaction > 80 %).

### 27.2 Bâtiments de faction & production

**BRANCHE SCIENCE**

- **Usine de Matrice (P1-P2)** : produit Exosquelette de Tir & Canon à Plasma Lourd.
- **Forge à Plasma (P3-P4)** : produit Émetteur Stase EMP & Batterie Orbitale.
- **Complexe Anti-Matière (P5-P6)** : produit Chasseur à Rayon & Titan Anti-Matière.

**BRANCHE GÉNÉTIQUE**

- **Gestateur d'Échines (P1-P2)** : produit Guerrier Mutant & Behemoth Muta-Chair.
- **Cuve de Biomasse (P3-P4)** : produit Traqueur Venimeux & Hydre Métabolique.
- **Charnier Transhumain (P5-P6)** : produit Léviathan Volant & Colosse Transhumain.

**BRANCHE ARCHÉOMAGES**

- **Autel des Runes (P1-P2)** : invoque Inquisiteur Runique & Faucheur d'Éther.
- **Nexus Éthérique (P3-P4)** : invoque Sphère de Distorsion & Artillerie Phasique.
- **Obélisque Astral (P5-P6)** : invoque Archonte de Tempête & Avatar de l'Éther.

## 28. Matrice d'équilibrage économie / combat

```
+--------------+--------------------------+--------------------------+---------------------------------+
| Faction      | Force Économique         | Faiblesse Démographique  | Levier de Satisfaction          |
+--------------+--------------------------+--------------------------+---------------------------------+
| Science      | Coûts réduits,           | Sensible aux pénuries    | Bâtiments industriels efficaces |
|              | production rapide.       | d'Alimentation.          | mais entretien élevé.           |
+--------------+--------------------------+--------------------------+---------------------------------+
| Génétique    | Croissance démographique | Très gourmande en        | Phéromones d'apaisement,        |
|              | extrême, unités meulantes| Alimentation / Biomasse. | difficile à maintenir à 100%.   |
+--------------+--------------------------+--------------------------+---------------------------------+
| Archéomages  | Unités coûteuses mais    | Faible effectif global   | Conversion directe de la haute  |
|              | rendement exponentiel.   | (coût FA élevé).         | satisfaction en Focale (FA).    |
+--------------+--------------------------+--------------------------+---------------------------------+
```

---
---

# PARTIE VIII — CATALOGUE DES BÂTIMENTS, ÂGE PAR ÂGE

## 29. Comment lire ce catalogue

### 29.1 Deux économies, deux catalogues

⚠️ **À ne pas confondre avec la Partie VII.** L'arbre des bâtiments du §27 est l'**économie de
guerre** : ce qu'on bâtit sur une case conquise du Plateau de l'Univers, avec trois ressources
abstraites (Main-d'Œuvre, Focale Arcanique, Alimentation) et un seul but, produire des unités.

Cette Partie VIII est l'**économie longue** : ce qu'on bâtit sur une planète, avec des ressources
concrètes (bois, brique, acier, titane…), sur sept âges. C'est elle qui alimente la première.
Les deux se rencontrent au palier 5, quand la planète commence à expédier par les Portes.

### 29.2 Les six familles, présentes à tous les âges

Chaque âge décline les mêmes six familles. C'est ce qui permet de comparer deux âges colonne par
colonne, et de voir du premier coup d'œil ce qui manque à une colonie.

| Famille | Ce qu'elle règle | Si elle manque |
|---|---|---|
| **Habitat & Gouvernance** | combien de gens vivent là, et le plafond démographique | la population plafonne, l'âge suivant reste fermé |
| **Vivres** | nourrir, sans quoi le rendement au travail s'effondre | grève, puis perte de population |
| **Matériaux** | extraire et transformer la matière à bâtir | plus rien ne se construit |
| **Confort & Croyance** | productivité (+25 % à +50 %), jauge d'Esprit — et, par la mode, l'art et le sport, la satisfaction | production molle, voie Archéomage fermée, colonie morose |
| **Services & Savoir** | santé, éducation, qualifications | les métiers avancés restent inaccessibles |
| **Logistique** | stocker, acheminer, et à partir de l'âge 5 expédier | tout est produit et rien n'arrive |

### 29.3 Ce que porte chaque fiche

Le modèle de données est celui du §2.3 — nom, coût de construction, travaillants requis,
ressources consommées, ressources produites, conditions. Les tableaux ci-dessous portent les
cinq premières colonnes ; **ce que devient un bâtiment à l'âge suivant est au §37**, pour ne pas
raconter deux fois la même chose.

Les coûts sont donnés en unités relatives, calibrées sur la Cabane de Pêcheur du §6.1
(15 bois, 5 pierre, 2 pionniers, 4 poissons). Ce sont des ordres de grandeur à équilibrer en jeu,
pas des valeurs définitives.

### 29.4 Trois règles qui traversent les sept âges

1. **Un bâtiment ne se remplace pas tout seul.** Monter d'âge n'efface rien : la Hutte du
   Bûcheron continue de produire à l'âge 4, elle est simplement dépassée par la Scierie.
   Ce qui force la mise à niveau, c'est le coût des bâtiments de l'âge courant, pas une
   obsolescence automatique.
2. **Chaque âge ferme une porte et en ouvre une autre.** La filière poisson s'éteint quand
   l'hydroponie arrive ; la filière bois s'éteint quand l'acier remplace la charpente. Voir §37.
3. **Un âge se débloque par un bâtiment, pas par un compteur.** Ce n'est pas « 500 briques » qui
   ouvre l'âge 3, c'est d'avoir bâti la Verrerie et l'École. Les verrous sont au §38.

---

## 30. Âge 1 — L'Âge des Pionniers

*Habitat : cabane en bois / tente de colon. On survit sur ce que la case donne.*

<!-- schema: flux-age-1 -->

### 30.1 Habitat & Gouvernance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Tente de Colon | 8 bois | — | — | loge 2 pionniers |
| Cabane en Bois | 20 bois · 5 pierre | — | — | loge 4 pionniers |
| Feu de Camp (Place du Village) | 5 bois · 5 pierre | — | 2 bois | +10 satisfaction · un seul par secteur |

### 30.2 Vivres

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Campement de Chasse | 12 bois | 3 | — | 5 gibier · *case de forêt ou de plaine* |
| Cabane de Pêcheur | 15 bois · 5 pierre | 2 | — | 4 poisson frais · *case côtière ou de rivière* |
| Rucher & Cueillette | 8 bois | 1 | — | 3 baies · 2 miel · *case de forêt* |
| Puits Communal | 10 pierre | 1 | — | eau potable à 3 cases · *nappe* |

### 30.3 Matériaux

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Hutte du Bûcheron | 10 bois | 2 | — | 6 bois brut · *case boisée* |
| Carrière à Ciel Ouvert | 15 bois | 3 | — | 5 pierre · *case rocheuse* |
| Fosse d'Argile | 10 bois | 2 | — | 4 argile · *berge de rivière* |

### 30.4 Confort & Croyance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Cuve Artisanale (Casserie) | 12 bois | 2 | 3 baies · 1 miel | 2 bière de baies → +10 % vitesse des colons |
| Séchoir en Bois | 10 bois | 1 | 3 feuilles de tabac | 2 tabac séché → réduit le risque de mutinerie |
| Autel en Pierre (Petit Temple) | 15 pierre · 10 bois · 2 bière | 1 | 1 bière | 2 Foi → **débloque la jauge d'Esprit** |
| Atelier de Parures | 10 bois · 5 pierre | 1 | 1 baies (teinture) | 2 parures → **+5 satisfaction** · *le premier pas de la Mode* |
| Terrain de Jeux | 8 bois | — | — | **+5 satisfaction** · un seul par secteur · *le premier pas du Sport* |

### 30.5 Logistique

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Entrepôt en Bois | 20 bois | 1 | — | 200 de stockage à 4 cases |

> **Le filet de sécurité.** Sans entrepôt à portée, aucun producteur ne fonctionne : c'est la
> première chose que la colonie doit avoir, et la raison pour laquelle les tout premiers
> bâtiments sont gratuits à l'amorçage.

**Services & Savoir : rien.** L'âge 1 n'a ni école ni soin — c'est ce qui le rend fragile, et ce
qui donne son prix au dispensaire de l'âge 3.

---

## 31. Âge 2 — Le Secteur Artisanal

*Habitat : maison en brique. La colonie cesse de cueillir et commence à transformer.*

<!-- schema: flux-age-2 -->

### 31.1 Habitat & Gouvernance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Maison en Brique | 30 briques · 10 bois | — | — | loge 8 colons |
| Hôtel de Ville | 60 briques · 20 planches · 10 outils | 3 | 1 pain | plafond démographique +1 palier · ouvre un second secteur |

### 31.2 Vivres

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Champ de Blé | 15 planches | 3 | — | 8 blé · *case fertile* |
| Moulin du Meunier | 25 planches · 10 pierre | 2 | 6 blé | 4 farine · *case ventée* |
| Bergerie | 25 planches | 3 | 4 blé | 3 bétail · 2 laine |
| Séchoir à Poisson | 10 briques · 5 outils | 2 | 4 poisson frais | 4 poisson sec (se conserve) |

### 31.3 Matériaux

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Scierie | 25 bois · 15 briques | 3 | 6 bois brut | 4 planches |
| Four à Briques | 20 pierre · 15 bois | 3 | 4 argile · 2 bois | 6 briques |
| Charbonnière | 15 bois | 2 | 5 bois | 3 charbon de bois |
| Mine de Fer | 30 briques · 10 planches | 4 | — | 4 minerai de fer · *gisement* |
| Forge du Village | 30 briques · 10 planches | 3 | 3 minerai · 2 charbon | 3 outils en fer |

### 31.4 Confort & Croyance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Brasserie Artisanale | 30 briques · 10 planches | 3 | 4 blé · 2 miel | 3 bière |
| Chapelle de Pierre | 40 briques · 10 planches | 2 | 1 bière | 4 Foi |
| Tisserand | 25 briques · 10 planches | 3 | 3 laine | 2 vêtements de laine → **+10 satisfaction** · +1 logé par Maison en Brique |
| Champ de Tir & Lice | 20 briques · 15 planches | 2 | 1 bière | **+8 satisfaction** · les recrues partent formées *(effet au front, plus tard)* |

### 31.5 Logistique

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Entrepôt en Brique | 35 briques | 2 | — | 600 de stockage à 6 cases |
| Marché du Village | 30 briques · 15 planches | 4 | — | distribue les vivres à 4 cases · +15 satisfaction |

> **L'âge du goulot.** Tout l'âge 2 tient sur deux bâtiments : le **Four à Briques** et la
> **Forge**. La brique conditionne chaque construction suivante, l'outil en fer conditionne
> chaque évolution. Une colonie qui les bâtit tard perd deux âges.

---

## 32. Âge 3 — La Société Urbaine

*Habitat : immeuble en brique. La densité explose, le confort devient un levier de production.*

<!-- schema: flux-age-3 -->

### 32.1 Habitat & Gouvernance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Immeuble en Brique | 80 briques · 20 planches · 10 verre | — | — | loge 24 citadins |
| Centre Administratif | 120 briques · 40 outils · 10 papier | 6 | 2 pain · 1 papier | plafond +1 palier · gère 4 secteurs |

### 32.2 Vivres

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Boulangerie | 50 briques · 10 outils | 4 | 4 farine · 1 charbon | 6 pain |
| Abattoir | 45 briques · 15 outils | 4 | 3 bétail | 4 viande crue |
| Boucherie | 50 briques · 10 verre | 3 | 4 viande crue | 5 viande préparée |
| Conserverie | 60 briques · 20 nickel | 5 | 4 poisson · 2 nickel | 6 conserves → **−15 % de consommation globale de nourriture** |

### 32.3 Matériaux

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Verrerie | 50 briques · 10 charbon | 3 | 3 pierre · 2 charbon | 4 verre |
| Papeterie | 45 briques · 10 outils | 3 | 4 bois | 3 papier |
| Mine de Silicium & Nickel | 70 briques · 20 outils | 6 | — | 4 silicium · 3 nickel · *gisement* |
| Fonderie Avancée | 90 briques · 30 fer · 10 verre | 6 | 4 silicium · 3 nickel | 3 composants électroniques primaires |
| Usine Chimique | 100 briques · 30 fer · 20 verre | 6 | eau · 4 charbon | 4 comburant O2 → **les premières fusées de reconnaissance** |

### 32.4 Confort & Croyance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Champ de Canne à Sucre | 25 planches | 3 | — | 8 canne · *case chaude* |
| Raffinerie de Sucre | 55 briques · 15 outils | 4 | 6 canne | 4 sucre |
| Distillerie de Rhum | 50 briques · 20 fer · 10 silicium | 12 | 10 sucre · 2 bois · 1 alcool | 8 rhum raffiné · *canne sur le secteur + réseau d'eau* |
| Taverne | 45 briques · 10 verre | 3 | 3 rhum | **+20 % d'efficacité dans les usines lourdes** |
| Manufacture de Tabac | 55 briques · 10 outils | 5 | 4 tabac séché | 3 cigares → **+15 % de points de recherche** |
| Teinturerie | 50 briques · 10 verre | 4 | 3 laine · 2 charbon | 3 teinture |
| Atelier Textile | 60 briques · 15 outils | 5 | 3 laine · 2 teinture | 4 vêtements sur-mesure → **+limite de population par immeuble** |
| Temple Urbain | 90 briques · 20 verre · 5 or | 4 | 2 rhum | 8 Foi |
| Salle des Fêtes & Théâtre | 60 briques · 15 verre | 4 | 1 rhum · 1 papier | spectacles → **+12 satisfaction** · *l'Art rejoint la Mode* |
| Gymnase & Hippodrome | 70 briques · 20 fer | 4 | 2 pain | **+10 satisfaction** · santé : −10 % de perte de population |

### 32.5 Services & Savoir

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Dispensaire | 70 briques · 20 fer · 10 papier | 4 | 2 conserves | santé · réduit la perte de population |
| École Communale | 65 briques · 15 fer · 10 papier | 3 | 1 papier | **débloque la qualification « Technicien »** |

### 32.6 Logistique

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Entrepôt Urbain | 60 briques · 20 fer | 2 | — | 1 500 de stockage à 8 cases |

> **L'âge charnière.** C'est ici que le confort cesse d'être un bonus : la Taverne et la
> Manufacture de Tabac rendent plus que ce qu'elles coûtent. Et c'est ici que la planète produit
> pour la première fois quelque chose qui ne sert pas à elle-même — le **comburant O2**.

---

## 33. Âge 4 — L'Ère Industrielle

*Habitat : cité ouvrière et résidence en acier. L'énergie entre dans l'équation.*

<!-- schema: flux-age-4 -->

### 33.1 Habitat & Gouvernance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Cité Ouvrière | 60 acier · 100 briques | — | — | loge 60 ouvriers |
| Résidence en Acier | 100 acier · 40 verre | — | — | loge 90 · +satisfaction |
| Mairie Industrielle | 200 acier · 60 verre · 20 papier | 10 | 2 vapeur | plafond +1 palier · gère 8 secteurs |

### 33.2 Vivres

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Ferme Mécanisée | 90 acier · 30 machines | 6 | 2 carburant | 16 blé (double le champ, moitié moins d'ouvriers) |
| Silo & Minoterie Industrielle | 110 acier · 20 machines | 6 | 12 blé | 10 farine |
| Flotte de Pêche Industrielle | 130 acier · 40 machines | 8 | 3 carburant | 14 poisson · *port* |

### 33.3 Matériaux & Énergie

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Mine de Charbon | 80 briques · 40 acier | 8 | — | 8 charbon minéral · *gisement* |
| Puits de Pétrole | 120 acier · 30 machines | 8 | — | 6 pétrole · *gisement* |
| Haut-Fourneau | 150 briques · 60 fer | 10 | 6 minerai · 5 charbon minéral | 6 acier |
| Aciérie & Laminoir | 180 acier · 40 machines | 10 | 6 acier | 4 poutrelles |
| Raffinerie Pétrochimique | 200 acier · 60 machines | 12 | 6 pétrole | 4 plastique · 2 carburant |
| Atelier de Machines-Outils | 160 acier · 40 composants | 10 | 4 acier · 2 composants | 4 machines |
| Centrale à Vapeur | 140 acier · 30 machines | 8 | 5 charbon minéral · eau | 10 vapeur (énergie) |
| Château d'Eau & Réseau | 100 briques · 60 acier | 4 | — | eau sous pression à 6 cases |
| Mine d'Or | 130 acier · 40 machines | 8 | — | 3 or · *gisement* |

### 33.4 Confort & Croyance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Distillerie de Whisky | 120 acier · 30 verre | 6 | 8 céréales · 2 vapeur | 8 alcool fort |
| Grande Cathédrale | 200 briques · 80 acier · 10 or | 6 | 2 alcool fort | 14 Foi |
| Maison de Couture & Opéra | 120 acier · 40 verre | 6 | 3 vêtements sur-mesure · 2 teinture | 4 tenues de prestige → **+15 satisfaction** · +limite de population par Résidence |
| Stade Ouvrier | 200 acier · 60 poutrelles | 8 | 2 vapeur · 3 conserves | **+15 satisfaction** · **+10 % de rendement des ouvriers** |

### 33.5 Services & Savoir

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Hôpital | 150 acier · 60 verre · 20 plastique | 8 | 3 conserves · 1 vapeur | santé avancée · +espérance de vie |
| Lycée Technique | 140 acier · 40 papier | 6 | 2 papier | **débloque la qualification « Ingénieur »** |

### 33.6 Logistique

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Gare & Réseau Ferré | 180 acier · 60 poutrelles | 8 | 2 charbon minéral | relie 3 secteurs · **+50 % de débit d'entrepôt** |
| Entrepôt Industriel | 120 acier | 3 | — | 4 000 de stockage |

> **La bascule invisible.** À partir de l'âge 4, un bâtiment sans **énergie** ne tourne pas : la
> vapeur devient un intrant au même titre que le minerai. C'est le premier âge où la colonie
> peut être riche en matière et bloquée quand même.

---

## 34. Âge 5 — L'Ère Spatiale Primordiale

*Habitat : complexe résidentiel béton et verre. **Le seuil de l'orbite** : la colonie cesse de
produire pour elle seule. C'est aussi le premier âge où les trois axes ont leurs propres
bâtiments.*

<!-- schema: flux-age-5 -->

### 34.1 Habitat & Gouvernance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Complexe Résidentiel Béton/Verre | 200 béton · 80 verre | — | électricité | loge 150 |
| Conseil Colonial | 300 béton · 100 électronique | 12 | électricité | plafond +1 palier · gère 16 secteurs |

### 34.2 Vivres

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Serre d'Adaptation Xéno-Botanique *(Génétique)* | 280 béton · 100 verre | 10 | eau · électricité | 20 nutriments enrichis — **nourrit l'âge 5 sans surface agricole** |

### 34.3 Matériaux & Énergie

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Cimenterie | 160 acier · 40 machines | 8 | 6 pierre · 3 charbon | 8 béton |
| Raffinerie de Titane | 240 béton · 100 acier | 12 | 6 minerai rare | 4 titane |
| Usine d'Électronique | 200 béton · 60 silicium · 40 or | 10 | 6 silicium · 2 or | 5 électronique |
| Centrale Électrique | 250 béton · 100 acier | 10 | 8 pétrole | 20 électricité |
| Usine d'Hydrazine | 220 béton · 80 titane | 10 | 4 plastique · électricité | 5 hydrazine — **le carburant des Portes** |
| Site de Fouilles Archéologiques | 180 béton · 60 machines | 8 | — | 3 reliques · *case de ruines* |

### 34.4 Confort & Croyance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Galerie d'Art & Studio de Design | 220 béton · 80 verre · 20 électronique | 8 | électricité · 2 papier | **+18 satisfaction** · +10 % de Focale Arcanique |
| Complexe Olympique | 300 béton · 100 acier | 10 | électricité · 4 nutriments enrichis | **+18 satisfaction** · les recrues Génétiques partent avec +5 % de PV |

### 34.5 Services & Savoir

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Institut de Recherche | 260 béton · 80 verre · 40 électronique | 12 | 2 papier · électricité | points de recherche des 3 axes |

### 34.6 Logistique & Espace

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Complexe de Lancement & Astroport V2 *(Science)* | 400 béton · 200 titane · 80 électronique | 20 | hydrazine · comburant O2 | **augmente le débit et le volume expédiables vers le front** · satellites |
| Entrepôt Sous Pression | 200 béton · 80 titane | 4 | électricité | 12 000 de stockage |

### 34.7 Les bâtiments d'axe — ce que chacun ouvre sur le front

| Axe | Bâtiment | Consomme | Effet sur le champ de bataille |
|---|---|---|---|
| **Science** | Fonderie d'Armement de Précision | fer · nickel · silicium | canons orbitaux, boucliers de siège — équipements militaires avancés |
| **Science** | Astroport V2 *(ci-dessus)* | hydrazine · O2 | plus de tonnage par Porte et par tour |
| **Génétique** | Cocon de Muta-Culture Spatiale | légumes · alcool raffiné · silicium | bataillons mutants résistants aux biomes extrêmes |
| **Génétique** | Serre Xéno-Botanique *(ci-dessus)* | eau · électricité | de quoi nourrir une population qui n'a plus de champs |
| **Archéomages** | Observatoire Runique Orbital | alcool raffiné · reliques · pierre | cartographie du Plateau · sort **« Siphon astral »** pour le Héros |
| **Archéomages** | Sanctuaire de Stabilisation de Porte | Foi | **−30 % de carburant** sur chaque envoi vers le front |

> **Le vrai seuil.** Les six bâtiments d'axe ne rendent rien à la planète : ils ne servent qu'au
> Plateau. Une colonie peut atteindre l'âge 5 et n'en bâtir aucun — elle sera riche et sans
> aucun poids sur la guerre.

---

## 35. Âge 6 — La Métropole Spatiale

*Habitat : arcologie. L'automatisation rompt le lien entre production et population.*

<!-- schema: flux-age-6 -->

### 35.1 Habitat & Gouvernance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Arcologie | 500 béton · 200 alliage · 100 verre | — | énergie | loge 600 |
| Habitat Modulable Avancé | 400 alliage · 150 composants quantiques | — | énergie | loge 400 · s'étend sans nouvelle case |
| Sénat Métropolitain | 600 alliage · 200 composants quantiques | 16 | énergie | plafond +1 palier · gère la planète entière |

### 35.2 Vivres

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Ferme Hydroponique | 350 alliage · 150 verre | 10 | eau · énergie | 30 légumes — **indépendante du biome** |
| Complexe Médical Génétique | 420 alliage · 180 composants | 14 | nutriments enrichis | santé transhumaine · population résistante au vide |

### 35.3 Matériaux & Énergie

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Fonderie d'Alliages Rares | 450 béton · 200 titane | 18 | titane · nickel · or | 6 alliage nickel-titane |
| Usine Quantique | 500 alliage · 200 électronique | 20 | silicium · or · énergie | 4 composants quantiques |
| Réacteur à Fusion Spatiale | 700 alliage · 400 composants quantiques | 22 | — | 80 énergie — **double l'énergie des bâtiments spatiaux** |
| Extracteur Orbital (Mine Interplanétaire) | 600 alliage · 300 titane | 24 | carburant | minerais rares · *nécessite un astroport* |

### 35.4 Confort, Croyance & Savoir

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Grand Nexus de Croyance | 500 alliage · 100 or · 60 reliques | 14 | Foi élevée | **mana transférable directement au Héros** sur le front |
| Laboratoire de Pointe | 480 alliage · 200 composants quantiques | 18 | énergie | recherche de palier 6 des 3 axes |
| Cité Universitaire | 400 alliage · 160 papier | 12 | énergie | **débloque la qualification « Chercheur »** |
| Atelier Holographique | 400 alliage · 120 composants quantiques | 8 | énergie | mode et art projetés, sans matière → **+25 satisfaction** · *compense la population réduite par l'automatisation* |
| Arène à Gravité Variable | 500 alliage · 150 titane | 12 | énergie | **+25 satisfaction** · entraînement des bataillons mutants : +10 % d'armure biologique |

### 35.5 Logistique

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Chaîne Automatisée | 400 alliage · 150 composants quantiques | 6 | énergie | **−60 % de travaillants requis** dans tout le secteur |
| Chantier Naval Orbital | 800 alliage · 300 titane · 200 composants | 26 | énergie · alliage | vaisseaux et stations |
| Entrepôt Orbital | 400 alliage | 5 | énergie | 40 000 de stockage |

> **Ce que change l'automatisation.** Jusqu'ici, produire plus voulait dire loger plus de monde.
> La Chaîne Automatisée casse cette règle : à l'âge 6, une planète peut être une usine avec peu
> d'habitants — et devient alors très vulnérable côté satisfaction, qui n'a plus de population
> pour générer de la Focale.

---

## 36. Âge 7 — La Cité Spatiale Transhumaine

*Habitat : cité-dôme intelligente et habitat orbital. Tout converge vers une seule sortie :
la Porte.*

<!-- schema: flux-age-7 -->

### 36.1 Habitat & Gouvernance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Cité-Dôme Intelligente | 800 alliage · 400 composants quantiques · 100 matière exotique | — | énergie · nutriments quantiques | loge 2 000 |
| Habitat Orbital | 1 000 alliage · 500 composants quantiques | — | énergie | loge 1 500 · hors surface planétaire |
| Conseil Transhumain | 900 alliage · 400 composants quantiques | 20 | énergie | plafond maximal · gouverne plusieurs planètes |
| Dôme à Atmosphère Contrôlée | 600 alliage · 300 composants | 20 | énergie | **évite la dégénérescence cellulaire des citoyens** |

### 36.2 Vivres

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Ferme Hydroponique Automatisée | 500 alliage · 200 silicium · 100 puces biologiques | 8 | énergie | 40 nutriments quantiques |

### 36.3 Matériaux & Énergie

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Collecteur de Noyaux d'Énergie Spatiale | 800 alliage · 400 titane | 24 | — | 6 noyaux d'énergie · *case de filament cosmique* |
| Synthétiseur de Matière Exotique | 900 alliage · 500 composants quantiques · 200 noyaux | 28 | énergie massive | 4 matière exotique |

### 36.4 Confort & Croyance

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Distillerie Quantique | 600 alliage · 300 composants quantiques | 16 | fruits mutés · chimie lourde | 8 Nectar d'Ambroisie → **+50 % de vitesse de recherche · régénération accélérée des Héros sur le front** |
| Laboratoire de Néo-Tabac Synaptique | 550 alliage · 250 composants · essence mystique | 14 | tabac génétiquement modifié · essence mystique | 6 néo-tabac → **augmente la puissance des sorts lancés depuis la planète vers le Plateau** |
| Sanctuaire des Filaments | alliages or/silicium · noyaux d'énergie · reliques archéologiques | 20 | Foi maximale | **−30 % sur le coût d'ouverture des Portes vers les zones de guerre** |
| Sculpteur de Corps (Esthétique Transhumaine) | 700 alliage · 300 composants quantiques | 14 | matière exotique · Nectar d'Ambroisie | **+30 satisfaction** · prestige des Archontes : −10 % de coût FA des sorts |
| Colisée Orbital | 900 alliage · 400 composants quantiques | 18 | énergie · nutriments quantiques | **+30 satisfaction** · simule le front : les unités expédiées partent avec un palier d'expérience |

### 36.5 Services & Savoir

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Réseau de Télépathie Synthétique | 700 alliage · 400 composants quantiques | 18 | énergie | coordination instantanée · +satisfaction de masse |
| Processeurs Quantiques Municipaux | 750 alliage · 450 composants quantiques | 16 | énergie | optimise toutes les chaînes de la planète |

### 36.6 Logistique & Portes

| Bâtiment | Coût | Travaillants | Consomme | Produit |
|---|---|---|---|---|
| Grand Astroport Transhumain | 1 200 alliage · 600 composants quantiques | 30 | hydrazine · O2 | tonnage maximal vers l'orbite |
| **Injecteur de Porte Spatiale** | 200 alliage Ni-Ti · 100 composants quantiques · 50 noyaux d'énergie | 5 Généticiens Supérieurs · 5 Archéomages | 20 hydrazine · 10 comburant O2 · 5 Nectar d'Ambroisie / cycle | **flux de téléportation — envoie directement unités lourdes et armes spéciales sur le Plateau** · *astroport à proximité + réseau d'énergie* |
| Entrepôt à Champ de Stase | 600 alliage · 200 matière exotique | 6 | énergie | 100 000 de stockage · aucune perte |

> **L'âge 7 ne se garde pas pour soi.** Ses trois productions les plus chères — Nectar,
> Néo-Tabac, matière exotique — n'améliorent presque rien sur la planète : elles agissent sur le
> champ de bataille. Une colonie de palier 7 est une **batterie**, pas une ville.

---

## 37. Les lignées — ce que chaque bâtiment devient

Une **lignée** est une même fonction tenue d'un âge à l'autre par des bâtiments différents.
C'est la lecture verticale du catalogue : on suit une colonne de besoin, pas un âge.

<!-- schema: lignees -->

| Lignée | Âge 1 | Âge 2 | Âge 3 | Âge 4 | Âge 5 | Âge 6 | Âge 7 |
|---|---|---|---|---|---|---|---|
| **Habitat** | Cabane en Bois | Maison en Brique | Immeuble | Résidence en Acier | Complexe Béton/Verre | Arcologie | Cité-Dôme · Habitat Orbital |
| **Gouvernance** | Place du Village | Hôtel de Ville | Centre Administratif | Mairie Industrielle | Conseil Colonial | Sénat Métropolitain | Conseil Transhumain |
| **Bâtir** | Carrière à Ciel Ouvert | Four à Briques | Verrerie | Haut-Fourneau *(acier)* | Cimenterie *(béton)* | Fonderie d'Alliages Rares | Synthétiseur de Matière Exotique |
| **Outiller** | — | Forge du Village | Fonderie Avancée | Atelier de Machines-Outils | Usine d'Électronique | Usine Quantique | Processeurs Quantiques |
| **Énergie** | — | Charbonnière | *(charbon de bois)* | Centrale à Vapeur | Centrale Électrique | Réacteur à Fusion Spatiale | Collecteur de Noyaux d'Énergie |
| **Nourrir — la terre** | Campement de Chasse | Champ de Blé · Bergerie | Boulangerie · Boucherie | Ferme Mécanisée | Serre Xéno-Botanique | Ferme Hydroponique | Ferme Hydroponique Automatisée |
| **Nourrir — la mer** | Cabane de Pêcheur | Séchoir à Poisson | Conserverie | Flotte de Pêche Industrielle | **✕ éteinte** | — | — |
| **Enivrer** | Cuve Artisanale | Brasserie Artisanale | Distillerie de Rhum | Distillerie de Whisky | *le rhum part vers le Cocon et l'Observatoire* | — | Distillerie Quantique *(Nectar d'Ambroisie)* |
| **Croire** | Autel en Pierre | Chapelle de Pierre | Temple Urbain | Grande Cathédrale | Observatoire Runique · Sanctuaire de Porte | Grand Nexus de Croyance | Sanctuaire des Filaments |
| **Savoir & santé** | — | — | Dispensaire · École | Hôpital · Lycée Technique | Institut de Recherche | Laboratoire de Pointe · Cité Universitaire | Télépathie Synthétique · Processeurs Quantiques |
| **Stocker & acheminer** | Entrepôt en Bois | Entrepôt en Brique · Marché | Entrepôt Urbain | Gare & Réseau Ferré | Astroport V2 · Entrepôt Sous Pression | Entrepôt Orbital · Chantier Naval | Injecteur de Porte · Entrepôt à Stase |
| **Mode & Art** | Atelier de Parures | Tisserand | Atelier Textile · Salle des Fêtes | Maison de Couture & Opéra | Galerie d'Art & Studio de Design | Atelier Holographique | Sculpteur de Corps |
| **Sport** | Terrain de Jeux | Champ de Tir & Lice | Gymnase & Hippodrome | Stade Ouvrier | Complexe Olympique | Arène à Gravité Variable | Colisée Orbital |

### 37.1 Les quatre choses que ce tableau raconte

**Une lignée peut mourir.** La filière **mer** s'éteint à l'âge 5 : l'hydroponie nourrit mieux,
partout, sans dépendre d'une case côtière. Le joueur qui a bâti sa colonie autour d'un port doit
alors la reconvertir — c'est un vrai coût, pas une formalité. C'est la seule lignée qui disparaît
complètement, et c'est voulu : il en faut au moins une pour que le joueur sente que le temps passe.

**Une lignée peut dormir.** La filière **enivrer** ne disparaît pas à l'âge 5 et 6, elle **change
de client** : le rhum raffiné cesse d'aller à la Taverne pour alimenter le Cocon de Muta-Culture
et l'Observatoire Runique. Le même bâtiment sert soudain la guerre au lieu de servir la ville.
Elle revient au grand jour à l'âge 7 avec la Distillerie Quantique.

**Une lignée peut naître tard.** **Savoir & santé** n'existe pas avant l'âge 3, **Outiller** et
**Énergie** pas avant l'âge 2. C'est ce qui rend les deux premiers âges rudes et courts : il n'y a
presque rien à optimiser, seulement à survivre.

**Deux lignées ne s'arrêtent jamais.** **Habitat** et **Gouvernance** ont une entrée aux sept
âges, parce que ce sont elles qui portent le plafond de tout le reste. Une colonie qui néglige la
gouvernance plafonne, quels que soient ses gisements.

**Deux lignées ne servent qu'à plaire — et c'est leur force.** **Mode & Art** et **Sport**
n'extraient rien, ne transforment rien d'indispensable : elles ne produisent que de la
satisfaction. C'est ce qui les rend précieuses à l'âge 6, quand l'automatisation vide les
habitats et que la Focale n'a plus personne pour la générer. Et à partir de l'âge 5, le Sport
cesse d'être un loisir : ses bâtiments préparent les recrues avant qu'elles ne passent la Porte —
c'est la troisième lignée, après Enivrer et Croire, à changer de client pour servir le front.

---

## 38. Les verrous — ce qu'un âge doit au précédent

Un âge ne s'ouvre pas sur un compteur de ressources. Il s'ouvre quand deux choses sont vraies :
le **matériau clé** de l'âge suivant est produit, et le **bâtiment de gouvernance** est monté.

<!-- schema: verrous-ages -->

| Passage | Matériau clé à produire | Bâtiment qui ouvre | Ce qui bloque en pratique |
|---|---|---|---|
| **1 → 2** | brique · outil en fer | Hôtel de Ville | Sans argile sur le secteur, pas de brique : la colonie doit s'étendre avant de monter. |
| **2 → 3** | verre · papier | Centre Administratif | Le papier vient du bois : la Papeterie entre en concurrence directe avec la Scierie. |
| **3 → 4** | acier · machines | Mairie Industrielle | L'acier demande du **charbon minéral**, pas du charbon de bois — c'est un gisement, et toutes les planètes n'en ont pas. |
| **4 → 5** | béton · électronique | Conseil Colonial | L'électronique demande **or et silicium**, deux gisements distincts : la première fois qu'un âge exige deux mines différentes. |
| **5 → 6** | alliage nickel-titane · composants quantiques | Sénat Métropolitain | L'alliage demande du **titane**, tiré d'un minerai rare souvent absent de la planète natale : il faut déjà l'Astroport et une seconde colonie. |
| **6 → 7** | matière exotique · noyaux d'énergie spatiale | Conseil Transhumain | Les noyaux ne se récoltent que sur une **case de filament cosmique** — c'est-à-dire sur le Plateau de l'Univers. |

### 38.1 Le verrou qui referme la boucle

Le passage **6 → 7** est le seul qui ne se franchit pas sur la planète.

Les noyaux d'énergie spatiale viennent des filaments de la Toile cosmique, qui sont des cases du
champ de bataille. Autrement dit : **il faut avoir conquis pour atteindre l'âge 7**, et il faut
l'âge 5 pour pouvoir conquérir quoi que ce soit. Les deux moitiés du jeu, qui n'étaient jusque-là
qu'un aller-retour de ressources, deviennent une vraie dépendance mutuelle.

C'est le seul endroit du système où la macro-gestion ne peut pas avancer seule. Le reste du temps,
un joueur peut jouer « planète » ou « front » à sa guise — ici, il doit avoir fait les deux.

---
---

# ANNEXES

## Annexe A — Provenance des sources

| Fichier source | Contenu repris dans |
|---|---|
| `le jeu` | Partie I (§1 à §8) |
| `triaxes.txt` | Partie II §9, Partie III §12, Partie IV §15/§18 (variante condensée), Partie V §20-21, Partie VI §24 |
| `recherche militaire` | Partie II §10, Partie III §13 et §14 |
| `design_document_tactical_rts.txt` | Partie II §11, Partie IV §15/§17/§18/§19, Partie VI §22, Partie VII §25 à §28 |
| `unités combat` | Identique à `design_document_tactical_rts.txt` (Parties I à 5 de ce fichier) — fusionné sans perte |
| `refonte unite combat` | Partie IV §16 et §18 (descriptions narratives, schémas de dominance, tableaux comparatifs par palier), Partie VI §23 |
| `explication du moba` | Partie V §20 (version longue) |

**Note sur les doublons.** `unités combat` et `design_document_tactical_rts.txt` sont
identiques mot pour mot, à deux différences près :

1. `unités combat` précise « *sans gestion de ressources ni économie* » au §1 ;
2. `design_document_tactical_rts.txt` ajoute les sections 6 à 9 (économie, bâtiments,
   51 technologies, matrice d'équilibrage).

Les deux formulations sont conservées (voir Partie IV, encadré d'ouverture).
Les fiches d'unités de `refonte unite combat` et de `triaxes.txt` reprennent les mêmes
chiffres que le design document ; la rédaction la plus complète a été retenue, les
précisions propres à chaque version (rôle, matière, sensibilités) ont été intégrées.

## Annexe B — Divergences entre versions

Points à trancher un jour, tous conservés en l'état dans le document :

1. **Structure de l'arbre de recherche** : 5 paliers (Tri-Axes) vs 7 paliers (recherche
   militaire) vs 6 paliers de combat pur (design document). Les trois coexistent en Partie II.

2. **Nombre d'unités** : 21 (hybrides, 5 paliers) vs 35 (hybrides, 7 paliers) vs 18
   (combat pur, 3 axes × 6 paliers, sans hybridation). Trois catalogues distincts.

3. **Hybridation** : le concept global (Parties I, II, III, V) *autorise* les unités
   hybrides et la Trinité ; la refonte combat (Partie IV) les *interdit* explicitement —
   « chaque branche reste strictement séparée ». Ce sont deux directions de design
   alternatives, pas une contradiction interne.

4. **Palier des unités homonymes** : plusieurs noms apparaissent à des paliers différents
   selon le catalogue —
   - *Faucheur d'Éther* : **P2** en combat pur, **P3** dans les catalogues hybrides.
   - *Artillerie Phasique* : **P4** en combat pur, **P5** dans les catalogues hybrides.
   - *Exosquelette* : *Exosquelette de Tir* **P1** (combat pur) vs *Exosquelette d'Assaut*
     **P3** (catalogues hybrides) — probablement deux unités distinctes.
   - *Char à Plasma Lourd* (**P4**, hybrides) vs *Canon à Plasma Lourd* (**P2**, combat pur).
   - *Hydre* : *Hydre Métabolique* **P4** (combat pur) vs *Hydre de Muta-Culture* **P6**.
   - *Archonte* : *Archonte de Tempête* **P5** (combat pur) vs *Archonte Astral* **P6**.
   - *Behemoth* : *Behemoth de Muta-Chair* **P2** vs *Behemoth Cellulaire* **P4**.

5. **Biomes** : deux jeux différents (4 biomes « système » vs 3 biomes « narratifs »).
   Le biome *Terre Brûlée / Cendres* (jeu A) et *Plaines Volcaniques* (jeu B) décrivent
   probablement le même terrain avec deux chiffrages différents (-100 % régénération et
   +25 % dégâts de brûlure d'un côté ; -50 % régénération, -15 armure et +20 % dégâts
   thermiques de l'autre).

6. **Économie** : le combat pur est annoncé « sans économie », mais le design document
   étendu lui adjoint tout l'écosystème MO / FA / AB et l'arbre des bâtiments (Partie VII).
   À décider : cet écosystème s'applique-t-il au mode combat, au mode gestion planétaire
   (Partie I), ou aux deux ?

7. **Deux systèmes de ressources coexistent** : MO / FA / AB (Partie VII) et les chaînes
   de production planétaires bois/pierre/fer/nourriture/confort (Partie I). Le second
   est manifestement la couche « planète », le premier la couche « champ de bataille ».

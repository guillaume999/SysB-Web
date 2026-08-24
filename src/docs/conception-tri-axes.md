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

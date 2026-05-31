# Spec — Mode « Épeler les mots — Reconnaissance vocale iOS » (STT)

**Date :** 2026-05-31
**Auteur :** Stéphane Leblanc (design assisté)
**Statut :** En revue (à approuver avant implémentation)
**Feature source :** `stt-feature.md`

## 1. Contexte et objectif

Robot Dictée valide aujourd'hui la saisie mot par mot, par correspondance exacte :
l'utilisateur tape dans le champ, une **espace** valide le mot (`viewModel.js:42-46`),
et `word.isMistake()` est simplement `actual() !== expected()` (`word.js:32-34`).

On veut un mode où l'enfant **épelle les mots à voix haute** avec la dictée vocale (STT)
d'iOS. iOS produit alors une suite de lettres et de noms d'accents
(ex : « A. M. O. U. R. », « S. È, R. E. », « P. R. E. Accent aiguë S. E. N. T. »).
Le mode rend cette sortie compatible avec la validation existante.

Deux contraintes dominent (tirées de `stt-feature.md`, section « Enjeux ») :

1. **Délai/réécriture iOS :** iOS réécrit parfois le texte quelques centaines de ms
   plus tard, surtout pour les accents.
2. **Boucle de test lente :** tester demande un vrai iPhone ; difficile, voire
   impossible, depuis le dev container. Le design doit **maximiser ce qui est
   testable sans appareil**.

## 2. Activation du mode

- Au chargement, détecter le paramètre `stt` dans le query string (ex : `?stt`
  ou `…&stt`). S'il est présent → mode STT actif pour toute la session.
- L'entête (`<h1>Robot Dictée</h1>`) affiche **en tout temps** un libellé de mode :
  « Robot Dictée — Épeler les mots (Reconnaissance vocale iOS) ». On met aussi à
  jour `document.title`.
- **Seule** sortie du mode : recharger l'application sans le query string. Aucun
  bouton, aucun toggle (YAGNI).

## 3. Saisie et validation (ESPACE clavier)

Le commit actuel observe la **valeur** du champ (« le dernier caractère est-il une
espace ? »). C'est ambigu en mode STT, car iOS sème des espaces entre les lettres
(« A. M. O. U. R. ») et parfois après un point (« R. » vs « R. »).

Solution : en mode STT, **commiter sur l'événement clavier**, pas sur la valeur.

- L'appui sur **ESPACE** au clavier émet un `keydown`/`beforeinput` (`key === " "`
  / `code === "Space"`). iOS, lui, insère son texte via des événements `input`
  (`insertText`/`insertReplacementText`) **sans** `keydown` d'espace.
- En mode STT : intercepter le `keydown` ESPACE → `preventDefault()` → prendre le
  contenu **brut** du champ → le transformer (section 4) → commiter → avancer →
  vider le champ.
- **ENTER** continue de rejouer le segment courant (comportement existant intact).
- iOS reste seul propriétaire du champ ; ses espaces/points internes y restent
  jusqu'à l'appui ESPACE de l'utilisateur. C'est l'utilisateur qui décide du moment
  de valider, ce qui **neutralise le problème de délai iOS** (Enjeu #1) : il peut
  attendre que iOS se stabilise, corriger au clavier, ou valider immédiatement.
- Le mode normal (clavier) reste **inchangé** (commit-sur-valeur conservé).

**Réserve (à valider sur appareil) :** iOS Safari avec clavier logiciel a parfois
des événements clavier bizarres (`keyCode 229` en « composition »). On est
raisonnablement confiant pour ESPACE et ENTER, mais c'est le seul point qui exige
un test sur iPhone (voir section 8).

## 4. Transformation `sttToWord(brut, motAttendu)` — fonction pure

Nouveau module `model/sttTranscription.js` exposant
`global.robotDictee.sttToWord(brut, motAttendu)`. **Fonction pure**, sans état,
sans dépendance au DOM → 100 % testable en Jasmine sans iPhone.

### 4.1 Stratégie « hybride »

- Les **lettres** sont transcrites en aveugle (l'enfant épelle, on lit les lettres).
- Le **mot attendu** sert uniquement à arbitrer les **accents/diacritiques** :
  « si la lettre est bonne, mettre le bon accent ». iOS ne peut pas dicter les
  accents français de façon fiable ; on les considère donc comme non testables et
  on les remplit à partir du mot attendu.
- Une vraie faute de **lettre** reste détectée et affichée en rouge.

### 4.2 Étapes

1. **Tokeniser** le brut en :
   - **lettres individuelles** — les lettres collées sont éclatées
     (« OU » → o,u ; « BE » → b,e) ; points et virgules jetés ;
   - **marqueurs d'accent** — phrases reconnues comme un accent.
2. **Vocabulaire d'accents** (dans `config.js`, extensible) : « accent aigu »,
   « accent aiguë », « accent grave », « grave » seul, « accent circonflexe »,
   « accent complexe » et « complexe » (erreur de reconnaissance fréquente pour
   circonflexe), « tréma ». La **valeur** de l'accent est ignorée pour la
   comparaison — seule sa **présence** importe.
3. **Aligner** la suite de lettres contre le mot attendu **désaccentué**
   (comparaison **insensible à la casse**) :
   - lettre de base attendue → consommer la lettre correspondante ;
   - caractère attendu **accentué** (é, è, ê, ë, à, â, ù, û, ô, î, ï) → accepter
     soit (lettre de base + marqueur d'accent optionnel), soit (marqueur d'accent
     seul quand iOS a avalé la voyelle), puis émettre le caractère **accentué du
     mot attendu** ;
   - **ç** → rempli d'office (impossible à dicter) ;
   - **lettre parasite** qui ne correspond pas à la position attendue et qui est
     immédiatement suivie d'un marqueur d'accent → absorbée comme partie d'un
     « accent … » mal reconnu (cas « F. L. U. **X.** Complexe » pour flûte).
4. **Sortie :**
   - si toutes les lettres de base s'alignent sur le mot attendu désaccentué →
     émettre le **mot attendu** tel quel (accents et casse d'origine, plus la
     ponctuation de fin éventuelle du segment) → s'affiche **vert** ;
   - sinon → émettre la **transcription brute des lettres** en minuscules
     (ce que l'enfant a réellement épelé) → s'affiche **rouge**, et le tableau
     attendu/réel montre l'écart.

### 4.3 Cas de test (contrat de comportement — à réviser avant implémentation)

Entrée brute exactement telle que produite par iOS → mot attendu → sortie de
`sttToWord`. Tous les exemples de `stt-feature.md`, **chaque variante**, plus des
cas de vraie faute.

#### Général (lettres seulement, mot attendu non déterminant)

| # | Mot attendu | Dictée iOS (brut) | Sortie |
|---|-------------|-------------------|--------|
| 1 | amour | `A. M. O. U. R.` | `amour` |
| 2 | soie | `S. O. I E.` | `soie` |
| 3 | soin | `S. O. I N.` | `soin` |
| 4 | son | `S. O. N.` | `son` |
| 5 | spectacle | `S. P. E. C. T. A. C. L. E.` | `spectacle` |
| 6 | sucre | `S. U. C. R. E.` | `sucre` |
| 7 | surface | `S. U. R. F. A. C. E.` | `surface` |

#### Voyelles sans points (lettres collées)

| # | Mot attendu | Dictée iOS (brut) | Sortie |
|---|-------------|-------------------|--------|
| 8 | secouer | `S. E. C. O U. E. R.` | `secouer` |
| 9 | soulier | `S. OU L. I. E. R.` | `soulier` |
| 10 | souriant | `S. OU R. I A. N. T.` | `souriant` |

#### Accents (mot attendu déterminant)

| # | Mot attendu | Dictée iOS (brut) | Sortie |
|---|-------------|-------------------|--------|
| 11 | présent | `P. R. E. Accent aiguë S. E. N. T.` | `présent` |
| 12 | bébé | `B. E. Accent aigu B E. Accent aigu` | `bébé` |
| 13 | bébé | `B. E. Accent aigu BE Accent aigu` | `bébé` |
| 14 | bébé | `B. E. Accent aiguë BE Accent aiguë` | `bébé` |
| 15 | bébé | `B. E. Accent aiguë BE accent aiguë` | `bébé` |
| 16 | bébé | `B. E. Accent aigu BE Accent aiguë` | `bébé` |
| 17 | généreux | `G. E. Accent aiguë, NE accent aiguë REU X.` | `généreux` |
| 18 | généreux | `G. Accent aiguë, N E. Accent aigu RE U. X.` | `généreux` |
| 19 | sèche | `S. È. C. H. E.` | `sèche` |
| 20 | très | `T. R. E. Grave S.` | `très` |
| 21 | très | `T. R. È, S.` | `très` |
| 22 | où | `O. U. Accent grave.` | `où` |
| 23 | mère | `M. È, R. E.` | `mère` |
| 24 | sûr | `S. U. Accent circonflexe R.` | `sûr` |
| 25 | hôpital | `H.O accent circonflexe, P. I. T. A. L.` | `hôpital` |
| 26 | hôpital | `H.O accent complexe, P I.T A. L.` | `hôpital` |
| 27 | flûte | `F. L. U. Accent complexe T E.` | `flûte` |
| 28 | flûte | `F. L. U. X. Complexe T E.` | `flûte` |
| 29 | noël | `N. O. E tréma L.` | `noël` |
| 30 | leçon | `L. E. C. O N.` | `leçon` |

#### Cas délicats — explication de l'alignement

- **#18 (généreux) :** iOS avale la 1re voyelle é : « G. Accent aiguë » donne
  `g` + marqueur d'accent (sans `e`). La règle « caractère attendu accentué →
  accepter un marqueur d'accent seul » fournit le é. Lettres alignées → `généreux`.
- **#28 (flûte) :** « X. Complexe » est un « accent circonflexe » mal reconnu. Le
  `x` ne correspond pas à la position attendue (`t`) et précède immédiatement un
  marqueur d'accent → absorbé. Lettres restantes alignées → `flûte`.

#### Vraies fautes (la tolérance d'accent ne masque pas une erreur de lettre)

| # | Mot attendu | Dictée iOS (brut) | Sortie | Résultat |
|---|-------------|-------------------|--------|----------|
| 31 | amour | `A. M. O. R.` | `amor` | faute (lettre U manquante) |
| 32 | spectacle | `S. P. E. K. T. A. C. L. E.` | `spektacle` | faute (K au lieu de C) |
| 33 | présent | `P. R. E. S. A. N. T.` | `presant` | faute (A au lieu de E) |

## 5. Aperçu en direct (lecture seule)

- Un `computed` Knockout `apercuStt = sttToWord(currentWordText, motAttenduCourant)`,
  affiché en lecture seule près du champ, **seulement** en mode STT pendant une
  dictée active.
- Il ne **touche jamais** au champ de saisie (iOS en reste seul propriétaire) :
  pas de conflit avec la réécriture iOS, pas de flicker. L'aperçu se recalcule
  progressivement à mesure que iOS écrit, et l'utilisateur appuie sur ESPACE quand
  l'aperçu affiche le bon mot.

## 6. Points d'intégration

- `model/sttTranscription.js` (nouveau) : `sttToWord(brut, motAttendu)` pure.
- `model/config.js` : vocabulaire des marqueurs d'accent.
- `model/dictation.js` : exposer le **mot attendu courant** (pour l'aperçu et le
  commit en mode STT).
- `viewModel.js` : lire le mode STT ; le `computed` d'aperçu ; le handler `keydown`
  ESPACE ; transformer au commit via `sttToWord(brut, motAttendu)`.
- `index.html` : libellé de mode dans l'entête + élément d'aperçu (lecture seule).
- `main.js` : détection du query string `stt` au démarrage.
- Mode normal : **inchangé**.

## 7. Tests

- Nouveau `model/spec/sttTranscriptionSpec.js` : **tous** les cas de la
  section 4.3 (général, voyelles, chaque variante d'accent, vraies fautes) comme
  cas Jasmine. La fonction étant pure → testable à 100 % dans le dev container,
  **sans iPhone**.
- Suivre TDD : écrire les cas de 4.3 d'abord, puis implémenter `sttToWord` jusqu'à
  ce qu'ils passent.

## 8. À valider sur appareil (non automatisable)

Seul point hors de portée des tests unitaires :

- La disambiguïsation **ESPACE clavier vs espace iOS** via `keydown`/`beforeinput`
  sur iOS Safari (clavier logiciel). À confirmer sur un vrai iPhone.
- Comportement réel de la dictée iOS (incrémental vs bloc, espaces parasites).
- **Ordre des accents :** `tryAlign` suppose que le nom d'accent suit toujours sa
  lettre (« E. Accent aiguë ») ou tient lieu d'une voyelle avalée (« G. Accent
  aiguë »), conformément à tous les exemples connus. Si iOS produisait un jour
  l'ordre inverse (accent avant la voyelle), le mot retomberait sur la transcription
  brute (affiché comme faute) — jamais un faux positif. À surveiller sur appareil.

## 9. Hors scope (YAGNI)

- Aucun toggle UI pour le mode.
- Aucune persistance, aucune analytique.
- Aucun changement au comportement du mode normal (clavier).
- Aucune gestion de ponctuation dictée à la voix : la ponctuation de fin de
  segment éventuelle est reprise du mot attendu, comme les accents.

## 10. Questions ouvertes

- **Casse :** sortie en minuscules sur faute ; sur succès, on reprend la casse du
  mot attendu. À confirmer pour les débuts de phrase / noms propres.
- **Vocabulaire d'accents :** la liste initiale couvre les exemples connus ;
  d'autres erreurs de reconnaissance iOS pourront être ajoutées dans `config.js`
  au fil des tests sur appareil.

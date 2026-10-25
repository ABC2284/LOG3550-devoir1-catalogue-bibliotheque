# LOG3550 – Devoir 1 : Catalogue de bibliothèque (frontend)

**Auteur :** Julmice Carl Verlet · ISTEAH · LOG3550 Développement web
**Dépôt Git :** _(à compléter : lien de votre dépôt)_

## Description
Frontend d'un catalogue de bibliothèque en HTML, CSS et JavaScript purs (sans framework ni bibliothèque). On peut consulter, rechercher, filtrer, trier, ajouter et supprimer des livres. Il sera relié à une API FastAPI dans le devoir 2.

## Mode d'emploi
1. Ouvrir `index.html` dans un navigateur récent (aucun serveur nécessaire).
2. **Recherche** : taper dans le champ ; la recherche ignore la casse et les accents (« eloge » trouve « Éloge de la créolité »).
3. **Filtres** : catégorie et « Disponibles seulement » s'additionnent à la recherche ; « Effacer les filtres » (désactivé tant qu'aucun filtre n'est actif) remet tout à zéro.
4. **Tri** : titre ou année, croissant ou décroissant.
5. **Ajout** : remplir le formulaire en bas ; les erreurs s'affichent sous chaque champ.
6. **Suppression** : bouton « Supprimer » sur la carte, avec confirmation.
7. **Réinitialiser les données** : remet les 10 livres de départ.
Les modifications sont conservées dans le `localStorage`.

# Arborescence
```
devoir1/
  index.html
  css/styles.css
  js/data.js      (10 livres de départ)
  js/app.js       (affichage, recherche, ajout, suppression, persistance)
  captures/       (captures d'écran numérotées)
  README.md
```

## Choix de conception
- **État unique** (`etat`) : chaque action modifie l'état puis appelle `afficher()`, qui redessine la liste. Pas de duplication entre données et affichage.
- **Cartes générées par `<template>`** et `cloneNode`, avec `textContent` (jamais `innerHTML`) pour éviter l'injection de HTML.
- **Délégation d'événements** : un seul écouteur sur la liste gère tous les boutons « Supprimer ».
- **CSS mobile d'abord** : 1 colonne par défaut, 2 colonnes dès 40em (tablette), 3 dès 64em, 4 dès 90em. Le « dos » coloré de chaque carte indique la catégorie (la couleur n'est jamais le seul indicateur : la catégorie est écrite sur la carte).
- **Accessibilité** : lien d'évitement, `label` pour chaque champ, `aria-describedby` + `aria-live="polite"` pour les erreurs, `aria-invalid`, `:focus-visible` visible, couleurs contrastées, `prefers-reduced-motion` respecté.
- **Validation** : titre et auteur (2 caractères minimum), année entre 1450 et l'année en cours (calculée avec `new Date()`), catégorie obligatoire. Le premier champ en erreur reçoit le focus.
- **Persistance** : les données lues dans le `localStorage` sont vérifiées avant d'être utilisées ; sinon on retombe sur les données de départ.
- Aucune image n'est utilisée (donc aucun `alt` nécessaire) ; la police est celle du système.

## Questions d'explication

### 1. Pourquoi les balises sémantiques plutôt qu'une suite de `div` ?
- **Accessibilité** : `header`, `nav`, `main` et `footer` permettent aux lecteurs d'écran de sauter directement aux zones de la page.
- **Référencement** : les moteurs de recherche comprennent la structure et le poids des contenus (titres, sections).
- **Maintenance** : le code est lisible, on voit tout de suite le rôle de chaque bloc sans deviner à partir de noms de classes.
- **Navigation clavier** : les éléments natifs (`button`, `a`, `label`) fonctionnent au clavier sans code supplémentaire.
- **Cohérence** : le comportement est standardisé entre navigateurs et outils, contrairement aux `div` qui n'ont aucun sens propre.

### 2. Différence entre `map`, `filter` et `forEach`
- `forEach` parcourt un tableau pour exécuter une action et ne retourne rien.
- `map` retourne un nouveau tableau de même taille, où chaque élément est transformé.
- `filter` retourne un nouveau tableau ne contenant que les éléments pour lesquels la fonction renvoie vrai.
- **Recherche et filtrage** : j'ai utilisé `filter` (`livresAffiches`, `supprimerLivre`) et `.every` pour valider les données lues.
- J'ai aussi utilisé `map` pour transformer les livres en cartes DOM, et `forEach` pour afficher les erreurs de chaque champ.

## Difficultés rencontrées
- Rendre la recherche insensible aux accents : résolu avec `normalize('NFD')` et la propriété Unicode `\p{Diacritic}`.
- Annoncer les erreurs aux lecteurs d'écran sans les répéter : zone `aria-live` par champ, reliée par `aria-describedby`.
- Ne pas casser l'application si le `localStorage` est vide, corrompu ou indisponible : lecture dans un `try/catch` et validation des données.

## Sources et outils d'assistance utilisés
- Assistant IA : **Claude (Anthropic)** a servi à générer une première version du code et du README ; le code a ensuite été relu et doit être compris par l'auteur.
- Documentation : MDN Web Docs (DOM, `localStorage`, `String.prototype.normalize`, CSS Grid), validateur W3C.
- Livres de départ : titres réels, aucune image ni bibliothèque externe.

## Captures
1. Validation W3C : `captures/0-validation-w3c.png` _(à ajouter)_
2. Écran large : `captures/1-large-1440x900.png`
3. Tablette : `captures/2-tablette-768x1024.png`
4. Téléphone : `captures/3-telephone-390x844.png`

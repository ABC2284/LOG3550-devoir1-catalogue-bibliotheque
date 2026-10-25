// Application du catalogue : affichage, recherche, filtres, tri, ajout, suppression, persistance.
(function () {
  'use strict';

  const CLE_STOCKAGE = 'catalogue-livres';
  const ANNEE_MIN = 1450;
  const CATEGORIES = ['roman', 'science', 'histoire', 'informatique', 'autre'];
  const FILTRES_PAR_DEFAUT = { recherche: '', categorie: 'toutes', disponiblesSeulement: false };

  // État unique de l'application : la vue est toujours redessinée à partir de lui.
  const etat = {
    livres: [],
    filtres: { ...FILTRES_PAR_DEFAUT },
    tri: 'titre-asc'
  };

  // ---------- Références DOM ----------
  const el = {
    recherche: document.getElementById('recherche'),
    categorie: document.getElementById('filtre-categorie'),
    dispo: document.getElementById('filtre-dispo'),
    tri: document.getElementById('tri'),
    effacerFiltres: document.getElementById('btn-effacer-filtres'),
    compteur: document.getElementById('compteur'),
    statut: document.getElementById('statut'),
    liste: document.getElementById('liste-livres'),
    messageVide: document.getElementById('message-vide'),
    modele: document.getElementById('modele-livre'),
    formulaire: document.getElementById('formulaire-ajout'),
    reinitialiser: document.getElementById('btn-reinitialiser')
  };

  // ---------- Utilitaires ----------
  const copierLivres = (livres) => livres.map((livre) => ({ ...livre }));

  // Minuscules et sans accents : « Éloge » devient « eloge ».
  function normaliser(texte) {
    return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  }

  function prochainId(livres) {
    return livres.reduce((max, livre) => Math.max(max, livre.id), 0) + 1;
  }

  function majuscule(texte) {
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  // ---------- Persistance (localStorage) ----------
  function estLivreValide(livre) {
    return livre !== null && typeof livre === 'object'
      && Number.isInteger(livre.id)
      && typeof livre.titre === 'string'
      && typeof livre.auteur === 'string'
      && Number.isInteger(livre.annee)
      && CATEGORIES.includes(livre.categorie)
      && typeof livre.disponible === 'boolean';
  }

  function chargerLivres() {
    try {
      const brut = localStorage.getItem(CLE_STOCKAGE);
      if (brut) {
        const livres = JSON.parse(brut);
        if (Array.isArray(livres) && livres.every(estLivreValide)) return livres;
      }
    } catch (erreur) {
      console.warn('Lecture du localStorage impossible, données de départ utilisées.', erreur);
    }
    return copierLivres(LIVRES_INITIAUX);
  }

  function sauvegarderLivres() {
    try {
      localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat.livres));
    } catch (erreur) {
      console.warn('Sauvegarde impossible dans le localStorage.', erreur);
    }
  }

  // ---------- Recherche, filtres et tri ----------
  function correspondAuxFiltres(livre, filtres) {
    const requete = normaliser(filtres.recherche);
    const texte = normaliser(`${livre.titre} ${livre.auteur}`);
    return texte.includes(requete)
      && (filtres.categorie === 'toutes' || livre.categorie === filtres.categorie)
      && (!filtres.disponiblesSeulement || livre.disponible);
  }

  function comparateur(tri) {
    const [champ, sens] = tri.split('-');
    const facteur = sens === 'asc' ? 1 : -1;
    if (champ === 'annee') return (a, b) => (a.annee - b.annee) * facteur;
    return (a, b) => a.titre.localeCompare(b.titre, 'fr', { sensitivity: 'base' }) * facteur;
  }

  function livresAffiches() {
    return etat.livres
      .filter((livre) => correspondAuxFiltres(livre, etat.filtres))
      .sort(comparateur(etat.tri));
  }

  function filtresActifs() {
    const { recherche, categorie, disponiblesSeulement } = etat.filtres;
    return recherche.trim() !== '' || categorie !== 'toutes' || disponiblesSeulement;
  }

  // ---------- Affichage ----------
  function creerCarte(livre) {
    const carte = el.modele.content.firstElementChild.cloneNode(true);
    carte.dataset.id = livre.id;
    carte.dataset.categorie = livre.categorie;
    carte.querySelector('.carte__titre').textContent = livre.titre;
    carte.querySelector('.carte__auteur').textContent = livre.auteur;
    carte.querySelector('.carte__details').textContent = `${majuscule(livre.categorie)} · ${livre.annee}`;

    const etiquette = carte.querySelector('.etiquette');
    etiquette.textContent = livre.disponible ? 'Disponible' : 'Emprunté';
    etiquette.classList.add(livre.disponible ? 'etiquette--dispo' : 'etiquette--emprunte');

    const bouton = carte.querySelector('button');
    bouton.dataset.action = 'supprimer';
    bouton.setAttribute('aria-label', `Supprimer « ${livre.titre} »`);
    return carte;
  }

  function afficherCompteur(nombre) {
    const total = etat.livres.length;
    const mot = nombre > 1 ? 'résultats' : 'résultat';
    el.compteur.textContent = `${nombre} ${mot} sur ${total} livre${total > 1 ? 's' : ''}`;
  }

  function afficher() {
    const livres = livresAffiches();
    el.liste.replaceChildren(...livres.map(creerCarte));
    el.messageVide.hidden = livres.length > 0;
    afficherCompteur(livres.length);
    el.effacerFiltres.disabled = !filtresActifs();
  }

  function annoncer(message) {
    el.statut.textContent = message;
  }

  function mettreAJour(message) {
    sauvegarderLivres();
    afficher();
    if (message) annoncer(message);
  }

  // ---------- Filtres : lecture des contrôles ----------
  function lireFiltres() {
    etat.filtres = {
      recherche: el.recherche.value,
      categorie: el.categorie.value,
      disponiblesSeulement: el.dispo.checked
    };
    afficher();
  }

  function effacerFiltres() {
    etat.filtres = { ...FILTRES_PAR_DEFAUT };
    el.recherche.value = '';
    el.categorie.value = 'toutes';
    el.dispo.checked = false;
    afficher();
    el.recherche.focus();
  }

  // ---------- Suppression et réinitialisation ----------
  function supprimerLivre(id) {
    const livre = etat.livres.find((l) => l.id === id);
    if (!livre) return;
    if (!window.confirm(`Supprimer « ${livre.titre} » du catalogue ?`)) return;
    etat.livres = etat.livres.filter((l) => l.id !== id);
    mettreAJour(`« ${livre.titre} » a été supprimé.`);
  }

  function reinitialiserDonnees() {
    if (!window.confirm('Remettre les données de départ ? Vos ajouts et suppressions seront perdus.')) return;
    etat.livres = copierLivres(LIVRES_INITIAUX);
    mettreAJour('Les données de départ ont été rétablies.');
  }

  function surClicListe(evenement) {
    const bouton = evenement.target.closest('button[data-action="supprimer"]');
    if (!bouton) return;
    supprimerLivre(Number(bouton.closest('.carte').dataset.id));
  }

  // ---------- Formulaire : validation ----------
  function lireFormulaire() {
    const donnees = new FormData(el.formulaire);
    return {
      titre: donnees.get('titre').trim(),
      auteur: donnees.get('auteur').trim(),
      annee: donnees.get('annee').trim(),
      categorie: donnees.get('categorie'),
      disponible: donnees.get('disponible') !== null
    };
  }

  // Retourne un objet { champ: message } ; vide si tout est valide.
  function validerLivre(valeurs) {
    const erreurs = {};
    const anneeCourante = new Date().getFullYear();
    const annee = Number(valeurs.annee);

    if (valeurs.titre.length < 2) erreurs.titre = 'Le titre est obligatoire (2 caractères minimum).';
    if (valeurs.auteur.length < 2) erreurs.auteur = "L'auteur est obligatoire (2 caractères minimum).";
    if (valeurs.annee === '' || !Number.isInteger(annee) || annee < ANNEE_MIN || annee > anneeCourante) {
      erreurs.annee = `L'année doit être un nombre entier entre ${ANNEE_MIN} et ${anneeCourante}.`;
    }
    if (!CATEGORIES.includes(valeurs.categorie)) erreurs.categorie = 'Choisissez une catégorie.';
    return erreurs;
  }

  function afficherErreurs(erreurs) {
    ['titre', 'auteur', 'annee', 'categorie'].forEach((champ) => {
      const entree = document.getElementById(champ);
      const zone = document.getElementById(`erreur-${champ}`);
      zone.textContent = erreurs[champ] || '';
      if (erreurs[champ]) entree.setAttribute('aria-invalid', 'true');
      else entree.removeAttribute('aria-invalid');
    });
    const premier = Object.keys(erreurs)[0];
    if (premier) document.getElementById(premier).focus();
  }

  function surEnvoiFormulaire(evenement) {
    evenement.preventDefault();
    const valeurs = lireFormulaire();
    const erreurs = validerLivre(valeurs);
    afficherErreurs(erreurs);
    if (Object.keys(erreurs).length > 0) return;

    etat.livres.push({
      id: prochainId(etat.livres),
      titre: valeurs.titre,
      auteur: valeurs.auteur,
      annee: Number(valeurs.annee),
      categorie: valeurs.categorie,
      disponible: valeurs.disponible
    });
    el.formulaire.reset();
    mettreAJour(`« ${valeurs.titre} » a été ajouté au catalogue.`);
  }

  // ---------- Initialisation ----------
  function brancherEvenements() {
    el.recherche.addEventListener('input', lireFiltres);
    el.categorie.addEventListener('change', lireFiltres);
    el.dispo.addEventListener('change', lireFiltres);
    el.tri.addEventListener('change', () => { etat.tri = el.tri.value; afficher(); });
    el.effacerFiltres.addEventListener('click', effacerFiltres);
    el.liste.addEventListener('click', surClicListe);
    el.formulaire.addEventListener('submit', surEnvoiFormulaire);
    el.reinitialiser.addEventListener('click', reinitialiserDonnees);
  }

  function initialiser() {
    // La borne maximale de l'année suit l'année en cours.
    document.getElementById('annee').max = new Date().getFullYear();
    document.getElementById('annee').min = ANNEE_MIN;
    etat.livres = chargerLivres();
    brancherEvenements();
    afficher();
  }

  initialiser();
})();

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Utilisateur(db.Model):
    __tablename__ = 'utilisateurs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nom = db.Column(db.String(100), nullable=False)
    prenom = db.Column(db.String(100), nullable=False)
    telephone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=True)
    mot_de_passe = db.Column(db.String(255), nullable=False)
    type_utilisateur = db.Column(db.Enum('client', 'chauffeur', 'admin', 'controleur'), default='client')
    langue_preferee = db.Column(db.Enum('francais', 'fang', 'myene', 'nzebi', 'teke', 'punu'), default='francais')
    region_origine = db.Column(db.String(50), nullable=True)
    date_naissance = db.Column(db.Date, nullable=True)
    photo_profil = db.Column(db.String(255), nullable=True)
    est_verifie = db.Column(db.Boolean, default=False)
    est_actif = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Chauffeur(db.Model):
    __tablename__ = 'chauffeurs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id', ondelete='CASCADE'), nullable=False)
    numero_permis = db.Column(db.String(50), unique=True, nullable=False)
    categorie_permis = db.Column(db.String(10), nullable=False)
    date_expiration_permis = db.Column(db.Date, nullable=False)
    numero_cni = db.Column(db.String(50), unique=True, nullable=False)
    date_embauche = db.Column(db.Date, nullable=False)
    statut = db.Column(db.Enum('actif', 'suspendu', 'conge', 'inactif'), default='actif')
    note_moyenne = db.Column(db.Numeric(2, 1), default=0.0)
    total_courses = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Bus(db.Model):
    __tablename__ = 'bus'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    numero_bus = db.Column(db.String(20), unique=True, nullable=False)
    immatriculation = db.Column(db.String(20), unique=True, nullable=False)
    marque = db.Column(db.String(50), nullable=True)
    modele = db.Column(db.String(50), nullable=True)
    annee_fabrication = db.Column(db.Integer, nullable=True)
    capacite_passagers = db.Column(db.Integer, nullable=False)
    type_bus = db.Column(db.Enum('vip', 'standard', 'economique'), default='standard')
    statut = db.Column(db.Enum('actif', 'maintenance', 'hors_service'), default='actif')
    chauffeur_id = db.Column(db.Integer, db.ForeignKey('chauffeurs.id', ondelete='SET NULL'), nullable=True)
    latitude = db.Column(db.Numeric(10, 8), nullable=True)
    longitude = db.Column(db.Numeric(11, 8), nullable=True)
    derniere_mise_a_jour = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Ligne(db.Model):
    __tablename__ = 'lignes'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    numero_ligne = db.Column(db.String(10), unique=True, nullable=False)
    nom_ligne = db.Column(db.String(100), nullable=False)
    ville_depart = db.Column(db.String(50), nullable=False)
    ville_arrivee = db.Column(db.String(50), nullable=False)
    type_zone = db.Column(db.Enum('grand_libreville', 'interieur'), nullable=False)
    distance_km = db.Column(db.Numeric(6, 2), nullable=True)
    duree_estimee_minutes = db.Column(db.Integer, nullable=True)
    est_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Arret(db.Model):
    __tablename__ = 'arrets'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ligne_id = db.Column(db.Integer, db.ForeignKey('lignes.id', ondelete='CASCADE'), nullable=False)
    nom_arret = db.Column(db.String(100), nullable=False)
    ordre = db.Column(db.Integer, nullable=False)
    latitude = db.Column(db.Numeric(10, 8), nullable=True)
    longitude = db.Column(db.Numeric(11, 8), nullable=True)
    temps_arret_estime = db.Column(db.Integer, nullable=True)

class Trajet(db.Model):
    __tablename__ = 'trajets'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ligne_id = db.Column(db.Integer, db.ForeignKey('lignes.id'), nullable=False)
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id'), nullable=False)
    chauffeur_id = db.Column(db.Integer, db.ForeignKey('chauffeurs.id'), nullable=False)
    date_depart = db.Column(db.Date, nullable=False)
    heure_depart = db.Column(db.Time, nullable=False)
    heure_arrivee_estimee = db.Column(db.Time, nullable=True)
    heure_arrivee_reelle = db.Column(db.Time, nullable=True)
    statut = db.Column(db.Enum('planifie', 'en_cours', 'termine', 'annule', 'retarde'), default='planifie')
    places_disponibles = db.Column(db.Integer, nullable=False)
    places_reservees = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Tarif(db.Model):
    __tablename__ = 'tarifs'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ligne_id = db.Column(db.Integer, db.ForeignKey('lignes.id', ondelete='SET NULL'), nullable=True)
    type_zone = db.Column(db.Enum('grand_libreville', 'interieur'), nullable=False)
    type_ticket = db.Column(db.Enum('simple', 'aller_retour', 'journalier', 'eleve', 'etudiant', 'mensuel', 'familial'), nullable=False)
    classe = db.Column(db.Enum('vip', 'standard', 'economique'), default='standard')
    prix_fcfa = db.Column(db.Integer, nullable=False)
    duree_validite_jours = db.Column(db.Integer, default=1)
    est_actif = db.Column(db.Boolean, default=True)

class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    numero_unique = db.Column(db.String(50), unique=True, nullable=False)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    trajet_id = db.Column(db.Integer, db.ForeignKey('trajets.id', ondelete='SET NULL'), nullable=True)
    tarif_id = db.Column(db.Integer, db.ForeignKey('tarifs.id'), nullable=False)
    type_ticket = db.Column(db.Enum('simple', 'aller_retour', 'journalier', 'eleve', 'etudiant', 'mensuel', 'familial'), nullable=False)
    classe = db.Column(db.Enum('vip', 'standard', 'economique'), nullable=False)
    ville_depart = db.Column(db.String(50), nullable=False)
    ville_arrivee = db.Column(db.String(50), nullable=False)
    prix_fcfa = db.Column(db.Integer, nullable=False)
    date_achat = db.Column(db.DateTime, default=datetime.utcnow)
    date_debut_validite = db.Column(db.Date, nullable=False)
    date_fin_validite = db.Column(db.Date, nullable=False)
    heure_depart = db.Column(db.Time, nullable=True)
    heure_arrivee_estimee = db.Column(db.Time, nullable=True)
    numero_bus = db.Column(db.String(20), nullable=True)
    qr_code = db.Column(db.String(255), nullable=True)
    statut = db.Column(db.Enum('valide', 'utilise', 'annule', 'invalide'), default='valide')
    date_utilisation = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Paiement(db.Model):
    __tablename__ = 'paiements'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    montant_fcfa = db.Column(db.Integer, nullable=False)
    methode = db.Column(db.Enum('mobile_money', 'carte_bancaire', 'especes'), nullable=False)
    reference_transaction = db.Column(db.String(100), unique=True, nullable=True)
    statut = db.Column(db.Enum('en_attente', 'reussi', 'echoue', 'rembourse'), default='en_attente')
    date_paiement = db.Column(db.DateTime, default=datetime.utcnow)

class MessageChat(db.Model):
    __tablename__ = 'messages_chat'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    trajet_id = db.Column(db.Integer, db.ForeignKey('trajets.id', ondelete='CASCADE'), nullable=False)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    contenu = db.Column(db.Text, nullable=False)
    est_offline = db.Column(db.Boolean, default=False)
    date_envoi = db.Column(db.DateTime, default=datetime.utcnow)
    date_reception = db.Column(db.DateTime, nullable=True)

class PositionGPS(db.Model):
    __tablename__ = 'positions_gps'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id', ondelete='CASCADE'), nullable=False)
    latitude = db.Column(db.Numeric(10, 8), nullable=False)
    longitude = db.Column(db.Numeric(11, 8), nullable=False)
    vitesse_kmh = db.Column(db.Numeric(5, 2), nullable=True)
    altitude = db.Column(db.Numeric(8, 2), nullable=True)
    precision_gps = db.Column(db.Numeric(6, 2), nullable=True)
    date_enregistrement = db.Column(db.DateTime, default=datetime.utcnow)

class HistoriquePositionGPS(db.Model):
    __tablename__ = 'historique_positions_gps'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    bus_id = db.Column(db.Integer, db.ForeignKey('bus.id', ondelete='CASCADE'), nullable=False)
    latitude = db.Column(db.Numeric(10, 8), nullable=False)
    longitude = db.Column(db.Numeric(11, 8), nullable=False)
    vitesse_kmh = db.Column(db.Numeric(5, 2), nullable=True)
    date_enregistrement = db.Column(db.DateTime, default=datetime.utcnow)
    trajet_id = db.Column(db.Integer, db.ForeignKey('trajets.id', ondelete='SET NULL'), nullable=True)

class VerificationTicket(db.Model):
    __tablename__ = 'verifications_tickets'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    verifie_par = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    statut_verification = db.Column(db.Enum('valide', 'utilise', 'annule', 'invalide'), nullable=False)
    date_verification = db.Column(db.DateTime, default=datetime.utcnow)
    latitude = db.Column(db.Numeric(10, 8), nullable=True)
    longitude = db.Column(db.Numeric(11, 8), nullable=True)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id', ondelete='CASCADE'), nullable=False)
    titre = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum('info', 'alerte', 'promotion', 'rappel'), default='info')
    est_lue = db.Column(db.Boolean, default=False)
    date_envoi = db.Column(db.DateTime, default=datetime.utcnow)

class Evaluation(db.Model):
    __tablename__ = 'evaluations'
    
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    trajet_id = db.Column(db.Integer, db.ForeignKey('trajets.id'), nullable=False)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs.id'), nullable=False)
    chauffeur_id = db.Column(db.Integer, db.ForeignKey('chauffeurs.id'), nullable=False)
    note = db.Column(db.Integer, nullable=False)
    commentaire = db.Column(db.Text, nullable=True)
    date_evaluation = db.Column(db.DateTime, default=datetime.utcnow)

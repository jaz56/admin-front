export interface PaysResidence {
  value: string;
  label: string;
}

export interface Diplome {
  _id: string;
  titre: string;
  date: Date;
  etablissement: string;
}

export interface ConnaissanceLinguistique {
  _id: string;
  langue: string;
  niveau: string;
}

export interface Demande {
  _id: string;
  user: string;
  uniqueId: string;
  type: string;
  status: 'pre_selection' | 'selection' | 'accepte' | 'refuse' | 'en_attente';
  progress: string;
  eligibiliteNote: string;
  journeesDestination: string;
  paysResidence: PaysResidence;
  ouverteTouteOpportunites: boolean;
  besoinVisa: boolean;
  typeHebergement: boolean;
  maladieContagieuse: boolean;
  handicape: boolean;
  preinscription: boolean;
  existenceDeGarant: boolean;
  niveauEtude: string;
  nombreAnneesEtude: number;
  nombreMoisStage: number;
  activite: string;
  condidatStatutActuel: string;
  dernierPosteOccupe: string;
  fonction: string;
  nombreAnneesExperience: string;
  posteSouhaite: string;
  diplomes: Diplome[];
  connaissanceLinguistique: ConnaissanceLinguistique[];
  anneesDeEtudeAFinancier: string[];
  createdAt: Date;
  updatedAt: Date;
}
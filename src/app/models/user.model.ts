export interface Pays {
  value: string;
  label: string;
}

export interface StbInfo {
  stbSkills: string[];
  stbLanguages: string[];
  stbInterests: string[];
  interviewCompleted: boolean;
  stbProfileCompleted: boolean;
  stbVerificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyInfo {
  dossierJuridique: string[];
  dossierJuridiqueOriginalNames: string[];
  companyVerified: boolean;
  companyVerificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  email: string;
  uniqueId: string;
  nom: string;
  prenom: string;
  password?: string;
  acceptedTerms: boolean;
  nvRegister: boolean;
  progress: string;
  verifiedEmail: boolean;
  role: 'candidat' | 'admin' | 'company';
  dateDeNaissance: Date;
  sexe: 'H' | 'F';
  pays: Pays;
  numeroTel: string;
  interessesPar: string[];
  photoDeProfile: string;
  stbInfo: StbInfo;
  companyInfo: CompanyInfo;
  balance: number;
  cashback: number;
  favoriteJobs: string[];
  nationalite: string[];
  subscriptions: string[];
  providers: any[];
  balanceTransactions: any[];
  cashbackTransactions: any[];
  complettProfileEmailLastSent: Date | null;
  complettProfileEmailReminderCount: number;
  candidateVerified: boolean;
  candidateVerificationStatus: 'pending' | 'verified' | 'rejected';
  profileCompletionPercentage: number;
  lastProfileUpload: Date;
  address: string;
  codePostal: string;
  pieceIdentite: string;
  dernierePosteOccupe: string;
  fonction: string;
  langueDeProcedure: string;
  cinRecto: string;
  cinVerso: string;
  vocal: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
  total: number;
  page: number;
  limit: number;
}
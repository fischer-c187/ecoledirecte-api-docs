export interface LoginCredentials {
  username: string;
  password: string;
  isReLogin: boolean;
  uuid: string;
  fa?: Array<{ cn: string; cv: string }>;
}

export interface QcmResponse {
  cn: string;
  cv: string;
}

export interface EcoleDirecteResponse<T> {
  code: number;
  token: string;
  message: string;
  data: T;
  host?: string;
}

export interface QcmQuestion {
  question: string;
  propositions: string[];
}

export interface Account {
  id: number;
  typeCompte: string;
  nom: string;
  prenom: string;
  anneeScolaireCourante: string;
  nomEtablissement: string;
  email?: string;
  profile?: {
    sexe?: string;
    classe?: {
      id: number;
      code: string;
      libelle: string;
    };
  };
  // Autres propriétés selon besoin
}

export interface LoginResponseData {
  accounts: Account[];
}

export interface DoubleAuthResponse {
  cn: string;
  cv: string;
}

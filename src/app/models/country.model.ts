export interface Region {
  id: number;
  name: string;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  region: Region;
  jobCount: number;
  lastSynced: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface Region {
  id: number;
  name: string;
}

export interface Country {
  _id: string;
  id: number;
  code: string;
  name: string;
  region: Region;
  jobCount: number;
  lastSynced: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
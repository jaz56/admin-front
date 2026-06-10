export interface DocumentMetadata {
  _id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  fieldName: string;
}

export interface Booking {
  _id: string;
  user: string;
  demande: string;
  uniqueId: string;
  appointmentType: 'premium' | 'standard';
  appointmentDate: Date;
  appointmentTime: string;
  price: number;
  paymentStatus: 'paid' | 'pending' | 'failed';
  status: 'confirmed' | 'cancelled' | 'pending';
  journeesDestination: string;
  interviewCompleted: boolean;
  interviewScore: number;
  interviewRecording: string;
  interviewReport: string | null;
  interviewStatus: 'En attente' | 'Complété' | 'Annulé';
  statusUpdateDate: string;
  documents: { [key: string]: string[] };
  documentsMetadata: { [key: string]: DocumentMetadata[] };
  createdAt: Date;
  updatedAt: Date;
}
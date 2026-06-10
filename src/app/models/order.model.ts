export interface Order {
  _id: string;
  date: string;
  time: string;
  orderId: string;
  bookingId: string;
  type: 'standard' | 'premium';
  status: 'created' | 'paid' | 'cancelled' | 'completed';
  user: string;
  createdAt: Date;
  updatedAt: Date;
}
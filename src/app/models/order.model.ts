export interface Order {
  id: string;
  date?: string;
  time?: string;
  orderId: string;
  bookingId?: string;
  type: string; // simple, standard, premium, pro, balance_topup
  status: string;
  price?: number;
  amount?: number;
  amountInTND?: number;
  currency?: string;
  country?: string;
  userId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
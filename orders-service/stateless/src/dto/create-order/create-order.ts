export type OrderLine = {
  quantity: number;
  productId: string;
  total: number;
};

export type Order = {
  id?: string;
  orderTotal: number;
  orderStatus: 'VALID' | 'INVALID';
  orderLines: OrderLine[];
  created?: string;
};

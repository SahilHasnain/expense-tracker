export type TransactionType = "expense" | "income";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  note?: string;
  categoryId?: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type MonthlyBudget = {
  month: string;
  amount: number;
  updatedAt: string;
};

export type StoredFinanceData = {
  transactions: Transaction[];
  budgets: Record<string, MonthlyBudget>;
};

import { Category, Transaction } from "@/types/finance";

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

export function isInMonth(value: string, month = monthKey()) {
  return monthKey(new Date(value)) === month;
}

export function totalFor(
  transactions: Transaction[],
  type: Transaction["type"],
  predicate: (transaction: Transaction) => boolean = () => true,
) {
  return transactions
    .filter((transaction) => transaction.type === type && predicate(transaction))
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function categoryTotals(transactions: Transaction[], categories: Category[], month: string) {
  return categories
    .map((category) => ({
      category,
      amount: totalFor(
        transactions,
        "expense",
        (transaction) => transaction.categoryId === category.id && isInMonth(transaction.occurredAt, month),
      ),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function formatCurrency(amount: number) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

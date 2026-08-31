import { Category } from "@/types/finance";

export const categories: Category[] = [
  { id: "food", name: "Food", icon: "silverware-fork-knife", color: "#E8794F" },
  { id: "transport", name: "Transport", icon: "car-outline", color: "#4385E5" },
  { id: "shopping", name: "Shopping", icon: "shopping-outline", color: "#A469D6" },
  { id: "home", name: "Home", icon: "home-outline", color: "#D99B3D" },
  { id: "work", name: "Work", icon: "briefcase-outline", color: "#398C79" },
  { id: "entertainment", name: "Entertainment", icon: "movie-outline", color: "#D05A8E" },
  { id: "health", name: "Health", icon: "heart-pulse", color: "#D75D68" },
  { id: "education", name: "Education", icon: "book-open-outline", color: "#5E82C6" },
];

export function getCategory(id?: string) {
  return categories.find((category) => category.id === id) ?? categories[0];
}

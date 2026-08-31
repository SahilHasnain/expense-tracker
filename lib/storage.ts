import AsyncStorage from "@react-native-async-storage/async-storage";
import { StoredFinanceData } from "@/types/finance";

const STORAGE_KEY = "money-os-finance-data";

export async function loadFinanceData(): Promise<StoredFinanceData | null> {
  const value = await AsyncStorage.getItem(STORAGE_KEY);
  return value ? (JSON.parse(value) as StoredFinanceData) : null;
}

export async function saveFinanceData(data: StoredFinanceData) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

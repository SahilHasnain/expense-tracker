import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { categories, getCategory } from "@/data/categories";
import { categoryTotals, formatCurrency, isInMonth, isToday, monthKey, totalFor } from "@/lib/calculations";
import { loadFinanceData, saveFinanceData } from "@/lib/storage";
import { Transaction } from "@/types/finance";

const palette = {
  ink: "#17221E",
  muted: "#708078",
  paper: "#F7F8F4",
  card: "#FFFFFF",
  green: "#246B55",
  paleGreen: "#E4F1EA",
  line: "#E4E9E3",
  danger: "#C75555",
};

const initialBudget = 20000;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Index() {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Record<string, { month: string; amount: number; updatedAt: string }>>({});
  const [ready, setReady] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categories[0].id);
  const [showBudget, setShowBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const currentMonth = monthKey();
  const budget = budgets[currentMonth]?.amount ?? initialBudget;
  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => isInMonth(transaction.occurredAt, currentMonth)),
    [currentMonth, transactions],
  );
  const todaySpent = totalFor(transactions, "expense", (transaction) => isToday(transaction.occurredAt));
  const monthSpent = totalFor(monthTransactions, "expense");
  const monthIncome = totalFor(monthTransactions, "income");
  const remaining = budget - monthSpent;
  const summary = categoryTotals(transactions, categories, currentMonth);
  const visibleTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...transactions]
      .filter((transaction) => {
        if (!normalized) return true;
        const category = getCategory(transaction.categoryId);
        return `${transaction.title} ${transaction.note ?? ""} ${category.name}`.toLowerCase().includes(normalized);
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
      .slice(0, 20);
  }, [query, transactions]);

  useEffect(() => {
    loadFinanceData()
      .then((data) => {
        if (data) {
          setTransactions(data.transactions);
          setBudgets(data.budgets);
        }
      })
      .catch(() => Alert.alert("Couldn't load data", "Your local data could not be read."))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) void saveFinanceData({ transactions, budgets });
  }, [budgets, ready, transactions]);

  function resetForm() {
    setAmount("");
    setTitle("");
    setNote("");
    setSelectedCategory(categories[0].id);
    setEditing(null);
  }

  function openAdd(transaction?: Transaction) {
    if (transaction) {
      setEditing(transaction);
      setAmount(String(transaction.amount));
      setTitle(transaction.title);
      setNote(transaction.note ?? "");
      setSelectedCategory(transaction.categoryId ?? categories[0].id);
    } else {
      resetForm();
    }
    setShowAdd(true);
  }

  function saveTransaction() {
    const parsedAmount = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Enter an amount", "Use a number greater than zero.");
      return;
    }

    const now = new Date().toISOString();
    const next: Transaction = {
      id: editing?.id ?? makeId(),
      type: editing?.type ?? "expense",
      amount: Math.round(parsedAmount),
      title: title.trim() || getCategory(selectedCategory).name,
      note: note.trim() || undefined,
      categoryId: selectedCategory,
      occurredAt: editing?.occurredAt ?? now,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };

    setTransactions((current) => (editing ? current.map((item) => (item.id === editing.id ? next : item)) : [next, ...current]));
    setShowAdd(false);
    resetForm();
  }

  function removeTransaction(transaction: Transaction) {
    Alert.alert("Delete expense?", `Remove ${transaction.title} from your timeline?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setTransactions((current) => current.filter((item) => item.id !== transaction.id)) },
    ]);
  }

  function saveBudget() {
    const parsed = Number(budgetInput.replace(/,/g, ""));
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert("Enter a valid budget", "Use zero or a positive number.");
      return;
    }
    setBudgets((current) => ({ ...current, [currentMonth]: { month: currentMonth, amount: Math.round(parsed), updatedAt: new Date().toISOString() } }));
    setShowBudget(false);
  }

  if (!ready) {
    return (
      <View style={[styles.loading, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
            <Text style={styles.brand}>Expense Tracker</Text>
        <Text style={styles.muted}>Loading your timeline...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR MONEY, CLEARER</Text>
        <Text style={styles.brand}>Expense Tracker</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => { setBudgetInput(String(budget)); setShowBudget(true); }} accessibilityLabel="Edit monthly budget">
            <MaterialCommunityIcons name="tune-variant" size={21} color={palette.ink} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Spent today</Text>
              <Text style={styles.heroAmount}>{formatCurrency(todaySpent)}</Text>
            </View>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>{monthTransactions.length} this month</Text></View>
          </View>
          <View style={styles.heroRule} />
          <View style={styles.heroStats}>
            <View><Text style={styles.heroLabel}>Remaining budget</Text><Text style={styles.heroStatValue}>{formatCurrency(remaining)}</Text></View>
            <View><Text style={styles.heroLabel}>Top category</Text><Text style={styles.heroStatValue}>{summary[0]?.category.name ?? "None yet"}</Text></View>
          </View>
        </View>

        <Pressable style={styles.quickAdd} onPress={() => openAdd()}>
          <View style={styles.plus}><MaterialCommunityIcons name="plus" size={25} color="#FFFFFF" /></View>
          <View style={styles.quickCopy}><Text style={styles.quickTitle}>Add an expense</Text><Text style={styles.quickSubtitle}>Record it before it slips your mind</Text></View>
          <MaterialCommunityIcons name="arrow-right" size={22} color={palette.green} />
        </Pressable>

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Money timeline</Text><Text style={styles.sectionMeta}>{formatCurrency(monthSpent)} spent · {formatCurrency(monthIncome)} in</Text></View>
        <View style={styles.searchBox}><MaterialCommunityIcons name="magnify" size={21} color={palette.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search expenses" placeholderTextColor="#9AA59D" style={styles.searchInput} /></View>

        {visibleTransactions.length === 0 ? (
          <View style={styles.empty}><View style={styles.emptyIcon}><MaterialCommunityIcons name="clock-outline" size={26} color={palette.green} /></View><Text style={styles.emptyTitle}>{query ? "No matches" : "Your timeline starts here"}</Text><Text style={styles.muted}>{query ? "Try another word." : "Add your first expense in under 3 seconds."}</Text></View>
        ) : (
          <View style={styles.timeline}>{visibleTransactions.map((transaction, index) => { const category = getCategory(transaction.categoryId); return <View key={transaction.id} style={styles.transaction}><View style={[styles.categoryIcon, { backgroundColor: `${category.color}18` }]}><MaterialCommunityIcons name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={21} color={category.color} /></View><View style={styles.transactionBody}><View style={styles.transactionLine}><Text style={styles.transactionTitle}>{transaction.title}</Text><Text style={[styles.transactionAmount, transaction.type === "income" && styles.income]}>{transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}</Text></View><View style={styles.transactionLine}><Text style={styles.transactionMeta}>{category.name} · {formatTime(transaction.occurredAt)}</Text><View style={styles.actions}><Pressable onPress={() => openAdd(transaction)}><Text style={styles.actionText}>Edit</Text></Pressable><Pressable onPress={() => removeTransaction(transaction)}><Text style={[styles.actionText, styles.deleteText]}>Delete</Text></Pressable></View></View></View>{index < visibleTransactions.length - 1 && <View style={styles.connector} />}</View> })}</View>
        )}

        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>This month</Text><Text style={styles.sectionMeta}>{new Date().toLocaleDateString([], { month: "long", year: "numeric" })}</Text></View>
        <View style={styles.summaryCard}><View style={styles.summaryHeader}><View><Text style={styles.cardLabel}>Budget</Text><Text style={styles.cardAmount}>{formatCurrency(budget)}</Text></View><Pressable onPress={() => { setBudgetInput(String(budget)); setShowBudget(true); }}><Text style={styles.link}>Edit</Text></Pressable></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(monthSpent / Math.max(budget, 1), 1) * 100}%`, backgroundColor: remaining < 0 ? palette.danger : palette.green }]} /></View><View style={styles.budgetFooter}><Text style={styles.muted}>Spent {formatCurrency(monthSpent)}</Text><Text style={[styles.muted, remaining < 0 && styles.deleteText]}>{remaining < 0 ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}</Text></View>{summary.length > 0 && <View style={styles.categorySummary}>{summary.slice(0, 4).map(({ category, amount }) => <View style={styles.summaryRow} key={category.id}><View style={styles.summaryName}><View style={[styles.dot, { backgroundColor: category.color }]} /><Text style={styles.summaryText}>{category.name}</Text></View><Text style={styles.summaryValue}>{formatCurrency(amount)}</Text></View>)}</View>}</View>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={styles.sheetRoot} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setShowAdd(false)} accessibilityLabel="Close expense entry" />
          <View style={styles.modalCard} accessibilityViewIsModal onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} /><View style={styles.modalHeader}><View><Text style={styles.modalKicker}>{editing ? "UPDATE ENTRY" : "QUICK ADD"}</Text><Text style={styles.modalTitle}>{editing ? "Edit expense" : "Where did it go?"}</Text></View><Pressable onPress={() => setShowAdd(false)} accessibilityLabel="Close expense entry"><MaterialCommunityIcons name="close" size={24} color={palette.muted} /></Pressable></View><TextInput value={amount} onChangeText={setAmount} placeholder="₹ 0" placeholderTextColor="#B6C0B9" keyboardType="decimal-pad" autoFocus style={styles.amountInput} /><Text style={styles.fieldLabel}>Category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>{categories.map((category) => <Pressable key={category.id} style={[styles.categoryChoice, selectedCategory === category.id && { borderColor: category.color, backgroundColor: `${category.color}12` }]} onPress={() => setSelectedCategory(category.id)}><MaterialCommunityIcons name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={20} color={category.color} /><Text style={styles.categoryChoiceText}>{category.name}</Text></Pressable>)}</ScrollView><TextInput value={title} onChangeText={setTitle} placeholder="What was it? (optional)" placeholderTextColor="#9AA59D" style={styles.textInput} /><TextInput value={note} onChangeText={setNote} placeholder="Add a note (optional)" placeholderTextColor="#9AA59D" style={styles.textInput} /><Pressable style={styles.saveButton} onPress={saveTransaction}><Text style={styles.saveButtonText}>{editing ? "Update expense" : "Save expense"}</Text><MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" /></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showBudget} animationType="fade" transparent onRequestClose={() => setShowBudget(false)}><View style={styles.centerBackdrop}><View style={styles.budgetModal}><Text style={styles.modalKicker}>MONTHLY BUDGET</Text><Text style={styles.modalTitle}>Set your limit</Text><Text style={styles.muted}>A simple guardrail for {new Date().toLocaleDateString([], { month: "long" })}.</Text><TextInput value={budgetInput} onChangeText={setBudgetInput} keyboardType="decimal-pad" style={styles.textInput} autoFocus /><View style={styles.modalButtons}><Pressable style={styles.cancelButton} onPress={() => setShowBudget(false)}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable style={styles.saveSmall} onPress={saveBudget}><Text style={styles.saveButtonText}>Save budget</Text></Pressable></View></View></View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.paper },
  loading: { flex: 1, backgroundColor: palette.paper, justifyContent: "center", alignItems: "center", gap: 8 },
  content: { padding: 22, paddingBottom: 50 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  eyebrow: { color: palette.green, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  brand: { color: palette.ink, fontSize: 30, fontWeight: "800", letterSpacing: -1.2, marginTop: 3 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line },
  heroCard: { backgroundColor: palette.green, borderRadius: 24, padding: 22, shadowColor: palette.green, shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroLabel: { color: "#B9D5C8", fontSize: 12, fontWeight: "600", marginBottom: 6 },
  heroAmount: { color: "#FFFFFF", fontSize: 38, fontWeight: "800", letterSpacing: -1.5 },
  heroBadge: { backgroundColor: "#FFFFFF20", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7 },
  heroBadgeText: { color: "#D8EDE3", fontSize: 11, fontWeight: "700" },
  heroRule: { height: 1, backgroundColor: "#FFFFFF25", marginVertical: 19 },
  heroStats: { flexDirection: "row", justifyContent: "space-between" },
  heroStatValue: { color: "#FFFFFF", fontWeight: "800", fontSize: 18 },
  quickAdd: { marginTop: 14, padding: 15, backgroundColor: palette.paleGreen, borderRadius: 18, flexDirection: "row", alignItems: "center" },
  plus: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.green, alignItems: "center", justifyContent: "center" },
  quickCopy: { flex: 1, marginLeft: 12 },
  quickTitle: { color: palette.ink, fontSize: 15, fontWeight: "800" },
  quickSubtitle: { color: palette.muted, fontSize: 12, marginTop: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: palette.ink, fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
  sectionMeta: { color: palette.muted, fontSize: 11, fontWeight: "600" },
  searchBox: { height: 48, backgroundColor: palette.card, borderColor: palette.line, borderWidth: 1, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, marginBottom: 8 },
  searchInput: { flex: 1, color: palette.ink, fontSize: 14, marginLeft: 8 },
  timeline: { backgroundColor: palette.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: palette.line },
  transaction: { minHeight: 59, flexDirection: "row", position: "relative" },
  categoryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  transactionBody: { flex: 1, marginLeft: 11, paddingBottom: 13 },
  transactionLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  transactionTitle: { color: palette.ink, fontWeight: "700", fontSize: 14, flex: 1 },
  transactionAmount: { color: palette.ink, fontWeight: "800", fontSize: 14 },
  income: { color: palette.green },
  transactionMeta: { color: palette.muted, fontSize: 11, marginTop: 4 },
  actions: { flexDirection: "row", gap: 12 },
  actionText: { color: palette.green, fontSize: 11, fontWeight: "700" },
  deleteText: { color: palette.danger },
  connector: { position: "absolute", left: 19, top: 43, width: 1, height: 18, backgroundColor: palette.line },
  empty: { alignItems: "center", paddingVertical: 34, backgroundColor: palette.card, borderRadius: 18, borderWidth: 1, borderColor: palette.line },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: palette.paleGreen, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptyTitle: { color: palette.ink, fontWeight: "800", fontSize: 15, marginBottom: 5 },
  muted: { color: palette.muted, fontSize: 12 },
  summaryCard: { backgroundColor: palette.card, borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 17 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  cardAmount: { color: palette.ink, fontSize: 22, fontWeight: "800", marginTop: 4 },
  link: { color: palette.green, fontWeight: "800", fontSize: 12 },
  progressTrack: { height: 8, backgroundColor: "#EDF0EC", borderRadius: 10, overflow: "hidden", marginTop: 17 },
  progressFill: { height: "100%", borderRadius: 10 },
  budgetFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  categorySummary: { borderTopWidth: 1, borderTopColor: palette.line, marginTop: 15, paddingTop: 12, gap: 11 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryName: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  summaryText: { color: palette.ink, fontSize: 13, fontWeight: "600" },
  summaryValue: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#10231B70" },
  modalCard: { backgroundColor: palette.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: Platform.OS === "ios" ? 36 : 22 },
  modalHandle: { width: 38, height: 4, backgroundColor: "#CBD4CD", borderRadius: 4, alignSelf: "center", marginBottom: 23 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalKicker: { color: palette.green, fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 5 },
  modalTitle: { color: palette.ink, fontSize: 25, fontWeight: "800", letterSpacing: -0.8 },
  amountInput: { color: palette.ink, fontSize: 44, fontWeight: "800", borderBottomWidth: 2, borderBottomColor: palette.green, paddingVertical: 13, marginTop: 20 },
  fieldLabel: { color: palette.muted, fontSize: 12, fontWeight: "700", marginTop: 18, marginBottom: 9 },
  categoryList: { gap: 8, paddingBottom: 3 },
  categoryChoice: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, borderRadius: 13, paddingHorizontal: 11, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 6 },
  categoryChoiceText: { color: palette.ink, fontSize: 12, fontWeight: "700" },
  textInput: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, borderRadius: 13, height: 49, paddingHorizontal: 14, color: palette.ink, fontSize: 14, marginTop: 10 },
  saveButton: { backgroundColor: palette.green, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 9, marginTop: 18 },
  saveButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  centerBackdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "#10231B70" },
  budgetModal: { backgroundColor: palette.paper, borderRadius: 24, padding: 22 },
  modalButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelButton: { flex: 1, height: 48, borderRadius: 14, backgroundColor: palette.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.line },
  cancelText: { color: palette.muted, fontWeight: "800", fontSize: 13 },
  saveSmall: { flex: 1, height: 48, borderRadius: 14, backgroundColor: palette.green, alignItems: "center", justifyContent: "center" },
});

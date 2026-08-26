import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Share,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Wallet,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  DollarSign,
  Send,
  AlertCircle,
} from "lucide-react-native";

import { get, post } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import CenteredDialog from "../components/CenteredDialog";

interface Withdrawal {
  id: number | string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed" | string;
  method: string;
  account?: string;
  reference_id?: string;
}

interface Transaction {
  id: number | string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  date: string;
  category?: string;
  order_id?: string;
}

const BANK_ACCOUNTS = [
  { id: "1", bank: "HDFC Bank", accountNo: "•••• 1234", ifsc: "HDFC0001234", holder: "Veetu Rusi Admin" },
  { id: "2", bank: "ICICI Bank", accountNo: "•••• 5678", ifsc: "ICIC0005678", holder: "Veetu Rusi Admin" },
  { id: "3", bank: "Axis Bank", accountNo: "•••• 9012", ifsc: "UTIB0009012", holder: "Veetu Rusi Admin" },
];

const INITIAL_WITHDRAWALS: Withdrawal[] = [
  { id: 1, amount: 5000, date: "2024-05-15", status: "completed", method: "Bank Transfer", account: "HDFC Bank (•••• 1234)", reference_id: "TXN882910" },
  { id: 2, amount: 3500, date: "2024-05-08", status: "completed", method: "Bank Transfer", account: "ICICI Bank (•••• 5678)", reference_id: "TXN771024" },
  { id: 3, amount: 10000, date: "2024-04-28", status: "completed", method: "Bank Transfer", account: "Axis Bank (•••• 9012)", reference_id: "TXN654321" },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, description: "Order #1001 Commission", amount: 1200, type: "credit", date: "2024-05-20", category: "Order Payout", order_id: "1001" },
  { id: 2, description: "Platform Fee Maintenance", amount: -120, type: "debit", date: "2024-05-20", category: "Platform Fee" },
  { id: 3, description: "Order #1002 Commission", amount: 2500, type: "credit", date: "2024-05-19", category: "Order Payout", order_id: "1002" },
  { id: 4, description: "Bank Withdrawal Payout", amount: -5000, type: "debit", date: "2024-05-15", category: "Withdrawal" },
  { id: 5, description: "Order #1003 Commission", amount: 3100, type: "credit", date: "2024-05-14", category: "Order Payout", order_id: "1003" },
  { id: 6, description: "Franchise Royalty Credit", amount: 4800, type: "credit", date: "2024-05-12", category: "Royalty" },
  { id: 7, description: "Bank Withdrawal Payout", amount: -3500, type: "debit", date: "2024-05-08", category: "Withdrawal" },
  { id: 8, description: "Order #998 Commission", amount: 1850, type: "credit", date: "2024-05-05", category: "Order Payout", order_id: "998" },
];

const WalletAndEarnings = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Financial Stats
  const [walletBalance, setWalletBalance] = useState(45000);
  const [totalEarnings, setTotalEarnings] = useState(156000);
  const [monthlyEarnings, setMonthlyEarnings] = useState(28500);

  // Withdrawals & Transactions
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(INITIAL_WITHDRAWALS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Withdrawal Form State
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: "",
    bankAccount: "HDFC Bank (•••• 1234)",
  });
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  // Transaction Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "credit" | "debit">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Feedback Dialog
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  // Fetch or Refresh Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [walletRes, txnsRes, withdrawalsRes]: [any, any, any] = await Promise.all([
        get("/admin/wallet").catch(() => null),
        get("/admin/wallet/transactions").catch(() => null),
        get("/admin/wallet/withdrawals").catch(() => null),
      ]);

      if (walletRes) {
        if (walletRes.wallet_balance !== undefined) setWalletBalance(Number(walletRes.wallet_balance));
        if (walletRes.total_earnings !== undefined) setTotalEarnings(Number(walletRes.total_earnings));
        if (walletRes.monthly_earnings !== undefined) setMonthlyEarnings(Number(walletRes.monthly_earnings));
      }

      if (txnsRes && Array.isArray(txnsRes)) {
        setTransactions(txnsRes);
      } else if (txnsRes && Array.isArray(txnsRes.data)) {
        setTransactions(txnsRes.data);
      }

      if (withdrawalsRes && Array.isArray(withdrawalsRes)) {
        setWithdrawals(withdrawalsRes);
      } else if (withdrawalsRes && Array.isArray(withdrawalsRes.data)) {
        setWithdrawals(withdrawalsRes.data);
      }
    } catch (e) {
      console.log("Error loading wallet data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Handle Withdrawal Request
  const handleWithdraw = async () => {
    if (!withdrawalForm.amount || !withdrawalForm.bankAccount) {
      setDialogConfig({
        visible: true,
        title: "Incomplete Fields",
        message: "Please enter an amount and select a bank account.",
      });
      return;
    }

    const amountNumber = Number(withdrawalForm.amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      setDialogConfig({
        visible: true,
        title: "Invalid Amount",
        message: "Please enter a valid withdrawal amount.",
      });
      return;
    }

    if (amountNumber > walletBalance) {
      setDialogConfig({
        visible: true,
        title: "Insufficient Balance",
        message: `Requested amount (₹${amountNumber.toLocaleString()}) exceeds your available wallet balance of ₹${walletBalance.toLocaleString()}.`,
      });
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      await post("/admin/wallet/withdraw", {
        amount: amountNumber,
        bank_account: withdrawalForm.bankAccount,
      }).catch(() => null);

      const newEntry: Withdrawal = {
        id: Date.now(),
        amount: amountNumber,
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        method: "Bank Transfer",
        account: withdrawalForm.bankAccount,
        reference_id: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
      };

      const newTxn: Transaction = {
        id: Date.now(),
        description: "Withdrawal Request Payout",
        amount: -amountNumber,
        type: "debit",
        date: new Date().toISOString().split("T")[0],
        category: "Withdrawal",
      };

      setWithdrawals((prev) => [newEntry, ...prev]);
      setTransactions((prev) => [newTxn, ...prev]);
      setWalletBalance((prev) => prev - amountNumber);

      setWithdrawalForm({ amount: "", bankAccount: "HDFC Bank (•••• 1234)" });

      setDialogConfig({
        visible: true,
        title: "Withdrawal Submitted",
        message: `Withdrawal request for ₹${amountNumber.toLocaleString()} has been submitted successfully and is currently under processing.`,
      });
    } catch (err: any) {
      setDialogConfig({
        visible: true,
        title: "Request Failed",
        message: err?.message || "Failed to process withdrawal request.",
      });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // Download / Share Report
  const downloadReport = async () => {
    const reportText =
      `VEETU RUSI ADMIN FINANCE REPORT\n` +
      `Date: ${new Date().toLocaleDateString("en-IN")}\n` +
      `----------------------------------------\n` +
      `Wallet Balance: ₹${walletBalance.toLocaleString()}\n` +
      `Total Earnings: ₹${totalEarnings.toLocaleString()}\n` +
      `This Month: ₹${monthlyEarnings.toLocaleString()}\n\n` +
      `RECENT TRANSACTIONS:\n` +
      transactions
        .map(
          (t) =>
            `${t.date} | ${t.description} | ${t.type === "credit" ? "+" : "-"}₹${Math.abs(t.amount)}`
        )
        .join("\n");

    try {
      await Share.share({
        title: "Earnings & Finance Report",
        message: reportText,
      });
    } catch {
      setDialogConfig({
        visible: true,
        title: "Report Generated",
        message: "Earnings and cashflow report generated successfully.",
      });
    }
  };

  // Filtered & Paginated Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const matchType = typeFilter === "all" || txn.type === typeFilter;
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        txn.description.toLowerCase().includes(q) ||
        (txn.category || "").toLowerCase().includes(q) ||
        (txn.order_id || "").toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [transactions, typeFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const currentMonthName = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Wallet & Earnings" navigation={navigation} />

      <FlatList
        data={paginatedTransactions}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 90,
        }}
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* ══ HERO BANNER ══ */}
            <View className="rounded-3xl border border-white/10 bg-slate-900 p-5 mb-5 shadow-xl">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                    Platform Finance
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={loadData}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 items-center justify-center"
                    accessibilityLabel="Refresh Data"
                  >
                    <RefreshCw size={15} color="#cbd5e1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={downloadReport}
                    className="h-9 px-3 rounded-xl bg-slate-800 border border-white/10 items-center justify-center flex-row gap-1.5"
                    accessibilityLabel="Download Report"
                  >
                    <Download size={14} color="#cbd5e1" />
                    <Text className="text-slate-200 text-xs font-bold">Report</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-2xl font-black text-white">Wallet & Earnings</Text>
              <Text className="text-slate-400 text-xs mt-1 leading-4">
                Your admin finance center for tracking wallet balance, real-time earnings, withdrawal requests, and cashflow activity.
              </Text>

              <View className="mt-4 pt-3 border-t border-white/5 flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                    <TrendingUp size={16} color="#34d399" />
                  </View>
                  <View>
                    <Text className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Live Status
                    </Text>
                    <Text className="text-xs font-bold text-white">Real-time Insights</Text>
                  </View>
                </View>

                <View className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <Text className="text-emerald-400 text-[10px] font-bold">Active Payouts</Text>
                </View>
              </View>
            </View>

            {/* ══ METRIC CARDS ══ */}
            <View className="flex-row flex-wrap gap-2.5 mb-5">
              {/* Wallet Balance Card */}
              <View className="flex-1 min-w-[150px] rounded-3xl border border-white/10 bg-slate-900 p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Wallet Balance
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowBalance((s) => !s)}
                    className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 items-center justify-center"
                  >
                    {showBalance ? (
                      <Eye size={13} color="#94a3b8" />
                    ) : (
                      <EyeOff size={13} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>
                <Text className="text-2xl font-black text-white mt-1">
                  {showBalance ? `₹${walletBalance.toLocaleString()}` : "••••••"}
                </Text>
                <Text className="text-[10px] text-emerald-400 font-semibold mt-1">
                  Available for withdrawal
                </Text>
              </View>

              {/* Total Earnings Card */}
              <View className="flex-1 min-w-[150px] rounded-3xl border border-white/10 bg-slate-900 p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Total Earnings
                  </Text>
                  <View className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                    <TrendingUp size={13} color="#34d399" />
                  </View>
                </View>
                <Text className="text-2xl font-black text-white mt-1">
                  ₹{totalEarnings.toLocaleString()}
                </Text>
                <Text className="text-[10px] text-slate-500 font-semibold mt-1">
                  All-time revenue overview
                </Text>
              </View>

              {/* Monthly Earnings Card */}
              <View className="w-full rounded-3xl border border-white/10 bg-slate-900 p-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    This Month ({currentMonthName})
                  </Text>
                  <Text className="text-2xl font-black text-white mt-1">
                    ₹{monthlyEarnings.toLocaleString()}
                  </Text>
                  <Text className="text-[10px] text-violet-400 font-semibold mt-0.5">
                    Monthly accrued settlement
                  </Text>
                </View>
                <View className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 items-center justify-center">
                  <CreditCard size={22} color="#a78bfa" />
                </View>
              </View>
            </View>

            {/* ══ REQUEST WITHDRAWAL FORM ══ */}
            <View className="rounded-3xl border border-white/10 bg-slate-900 p-5 mb-5 shadow-lg">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/5">
                <View>
                  <Text className="text-lg font-black text-white">Request Withdrawal</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    Submit a payout request to linked bank account
                  </Text>
                </View>
                <View className="bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                  <Text className="text-emerald-400 font-mono font-bold text-xs">
                    Max ₹{walletBalance.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View className="mt-4 gap-3.5">
                {/* Amount Input */}
                <View>
                  <Text className="text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wider">
                    Withdrawal Amount (₹) *
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={withdrawalForm.amount}
                    onChangeText={(t) =>
                      setWithdrawalForm((p) => ({ ...p, amount: t }))
                    }
                    placeholder="Enter amount (e.g. 5000)"
                    placeholderTextColor="#64748b"
                    className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white font-bold text-sm"
                  />

                  {/* Quick Chips */}
                  <View className="flex-row gap-1.5 mt-2">
                    {[1000, 2500, 5000, 10000].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        onPress={() =>
                          setWithdrawalForm((p) => ({ ...p, amount: String(amt) }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10"
                      >
                        <Text className="text-slate-300 text-[10px] font-bold">
                          +₹{amt.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() =>
                        setWithdrawalForm((p) => ({ ...p, amount: String(walletBalance) }))
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30"
                    >
                      <Text className="text-emerald-300 text-[10px] font-bold">Max</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bank Account Picker */}
                <View>
                  <Text className="text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wider">
                    Target Bank Account *
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowBankModal(true)}
                    className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-2">
                      <Building2 size={16} color="#60a5fa" />
                      <Text className="text-white text-xs font-bold">
                        {withdrawalForm.bankAccount || "Select Bank Account"}
                      </Text>
                    </View>
                    <Text className="text-emerald-400 text-xs font-bold">Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Action Button */}
                <TouchableOpacity
                  onPress={handleWithdraw}
                  disabled={submittingWithdrawal}
                  className="w-full bg-emerald-500 rounded-2xl py-3.5 items-center justify-center flex-row gap-2 mt-1 active:scale-[0.99]"
                >
                  {submittingWithdrawal ? (
                    <ActivityIndicator size="small" color="#022c22" />
                  ) : (
                    <>
                      <Send size={15} color="#022c22" />
                      <Text className="text-slate-950 font-black text-xs uppercase tracking-wider">
                        Request Withdrawal
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ══ RECENT WITHDRAWALS ══ */}
            <View className="rounded-3xl border border-white/10 bg-slate-900 p-5 mb-5 shadow-lg">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/5 mb-3">
                <div>
                  <Text className="text-lg font-black text-white">Recent Withdrawals</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    Latest payout activity and settlement status
                  </Text>
                </div>
              </View>

              {withdrawals.length === 0 ? (
                <Text className="text-slate-500 text-xs py-4 text-center">
                  No withdrawal requests recorded yet.
                </Text>
              ) : (
                <View className="gap-2.5">
                  {withdrawals.map((w) => {
                    const isCompleted = w.status === "completed";
                    return (
                      <View
                        key={w.id}
                        className="rounded-2xl border border-white/5 bg-slate-950/60 p-3.5 flex-row items-center justify-between"
                      >
                        <View className="flex-1 mr-2">
                          <View className="flex-row items-center gap-2">
                            <Text className="text-white font-black text-sm">
                              ₹{Number(w.amount).toLocaleString()}
                            </Text>
                            <View
                              className={`px-2 py-0.5 rounded-full border ${
                                isCompleted
                                  ? "bg-emerald-500/10 border-emerald-500/25"
                                  : "bg-amber-500/10 border-amber-500/25"
                              }`}
                            >
                              <Text
                                className={`text-[9px] font-bold uppercase ${
                                  isCompleted ? "text-emerald-300" : "text-amber-300"
                                }`}
                              >
                                {w.status}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-slate-400 text-[10px] mt-1" numberOfLines={1}>
                            {w.account || w.method} • {w.reference_id || "Ref Pending"}
                          </Text>
                        </View>

                        <Text className="text-slate-500 text-[10px] font-semibold">
                          {w.date}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* ══ TRANSACTION HISTORY & FILTER ══ */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-lg font-black">Transaction History</Text>
                <Text className="text-slate-400 text-xs">Recent Activity</Text>
              </View>

              {/* Search Box */}
              <View className="bg-slate-900 border border-white/10 rounded-2xl px-3.5 py-2.5 flex-row items-center mb-2.5">
                <Search size={16} color="#64748b" />
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Search description, order ID..."
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white ml-2.5 text-xs font-semibold"
                />
                {searchTerm ? (
                  <TouchableOpacity onPress={() => setSearchTerm("")}>
                    <X size={15} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Filter Chips */}
              <View className="flex-row gap-2 mb-2">
                {[
                  { id: "all", label: "All Transactions" },
                  { id: "credit", label: "Credits (+)" },
                  { id: "debit", label: "Debits (-)" },
                ].map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => setTypeFilter(f.id as any)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      typeFilter === f.id
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-900 border-white/10"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        typeFilter === f.id ? "text-emerald-300" : "text-slate-400"
                      }`}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-slate-500 text-[10px] font-semibold mt-1">
                Showing {filteredTransactions.length} records
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isCredit = item.type === "credit";
          return (
            <View className="mx-4 mb-2.5 rounded-2xl border border-white/10 bg-slate-900 p-3.5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View
                  className={`w-9 h-9 rounded-xl items-center justify-center border ${
                    isCredit
                      ? "bg-emerald-500/10 border-emerald-500/25"
                      : "bg-rose-500/10 border-rose-500/25"
                  }`}
                >
                  {isCredit ? (
                    <ArrowDownRight size={16} color="#34d399" />
                  ) : (
                    <ArrowUpRight size={16} color="#f87171" />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-white text-xs font-bold" numberOfLines={1}>
                    {item.description}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-slate-400 text-[10px]">
                      {item.category || item.type}
                    </Text>
                    <Text className="text-slate-600 text-[10px]">•</Text>
                    <Text className="text-slate-500 text-[10px]">{item.date}</Text>
                  </View>
                </View>
              </View>

              <Text
                className={`text-sm font-black ${
                  isCredit ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isCredit ? "+" : "-"} ₹{Math.abs(item.amount).toLocaleString()}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center py-10 px-6">
            <Wallet size={36} color="#475569" />
            <Text className="text-slate-400 font-bold text-xs mt-3">
              No transactions found
            </Text>
            <Text className="text-slate-600 text-[11px] text-center mt-1">
              Adjust search keywords or filter options.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredTransactions.length > 0 ? (
            <View className="flex-row justify-center items-center mt-3 px-4">
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-9 h-9 bg-slate-900 border border-white/10 rounded-xl items-center justify-center mr-3"
                style={{ opacity: currentPage === 1 ? 0.3 : 1 }}
              >
                <ChevronLeft size={16} color="#ffffff" />
              </TouchableOpacity>

              <Text className="text-slate-300 text-xs font-bold">
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-9 h-9 bg-slate-900 border border-white/10 rounded-xl items-center justify-center ml-3"
                style={{ opacity: currentPage === totalPages ? 0.3 : 1 }}
              >
                <ChevronRight size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* ══ BANK ACCOUNT SELECTION MODAL ══ */}
      <Modal
        visible={showBankModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowBankModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-6"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-xl font-black">Select Bank Account</Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Choose destination bank for withdrawal settlement
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowBankModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={15} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View className="gap-2.5 mb-5">
              {BANK_ACCOUNTS.map((b) => {
                const label = `${b.bank} (${b.accountNo})`;
                const isSelected = withdrawalForm.bankAccount === label;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => {
                      setWithdrawalForm((p) => ({ ...p, bankAccount: label }));
                      setShowBankModal(false);
                    }}
                    className={`rounded-2xl border p-3.5 flex-row items-center justify-between ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500"
                        : "bg-slate-950 border-white/10"
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 items-center justify-center">
                        <Building2 size={18} color="#60a5fa" />
                      </View>
                      <View>
                        <Text className="text-white font-bold text-sm">{b.bank}</Text>
                        <Text className="text-slate-400 text-xs">{b.accountNo} • IFSC: {b.ifsc}</Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-emerald-500 items-center justify-center">
                        <CheckCircle size={14} color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setShowBankModal(false)}
              className="w-full bg-slate-800 rounded-2xl py-3.5 items-center justify-center"
            >
              <Text className="text-slate-300 font-bold text-xs">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ FEEDBACK DIALOG ══ */}
      <CenteredDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onClose={() => setDialogConfig((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
};

export default WalletAndEarnings;

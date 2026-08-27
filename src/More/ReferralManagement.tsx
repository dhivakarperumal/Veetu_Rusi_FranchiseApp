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
  Users,
  ShieldCheck,
  Wallet,
  Clock,
  Plus,
  X,
  Settings,
  ChefHat,
  Truck,
  AlertTriangle,
  TrendingUp,
  Search,
  CheckCircle,
  XCircle,
  Send,
  BarChart3,
  FileText,
  List,
  LayoutGrid,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react-native";

import { get, post, put } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

/* ─── helpers ─────────────────────────────────────────────────── */
const genCode = (prefix: string) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let c = prefix;
  for (let i = 0; i < 6; i++) {
    c += chars[Math.floor(Math.random() * chars.length)];
  }
  return c;
};

const STATUS_MAP: Record<string, { label: string; textCls: string; bgCls: string; borderCls: string }> = {
  rewarded: { label: "Rewarded", textCls: "text-emerald-400", bgCls: "bg-emerald-500/15", borderCls: "border-emerald-500/30" },
  pending: { label: "Pending", textCls: "text-amber-400", bgCls: "bg-amber-500/15", borderCls: "border-amber-500/30" },
  approved: {
    label: "Approved",
    textCls: "text-emerald-400",
    bgCls: "bg-emerald-500/15",
    borderCls: "border-emerald-500/30",
  },
  verified: { label: "Verified", textCls: "text-sky-400", bgCls: "bg-sky-500/15", borderCls: "border-sky-400/30" },
  rejected: { label: "Rejected", textCls: "text-rose-400", bgCls: "bg-rose-500/15", borderCls: "border-rose-500/30" },
  cancelled: { label: "Cancelled", textCls: "text-slate-400", bgCls: "bg-slate-500/15", borderCls: "border-slate-500/30" },
};

const StatusBadge = ({ status }: { status?: string }) => {
  const s = STATUS_MAP[status?.toLowerCase() || ""] || STATUS_MAP.pending;
  return (
    <View className={`items-center rounded-full border px-2.5 py-0.5 ${s.bgCls} ${s.borderCls}`}>
      <Text className={`text-[10px] font-bold ${s.textCls}`}>{s.label}</Text>
    </View>
  );
};

const TYPE_MAP: Record<string, { label: string; textCls: string; bgCls: string; borderCls: string }> = {
  customer: { label: "Customer", textCls: "text-sky-400", bgCls: "bg-sky-500/10", borderCls: "border-sky-500/20" },
  home_chef: { label: "Home Chef", textCls: "text-orange-400", bgCls: "bg-orange-500/10", borderCls: "border-orange-500/20" },
  delivery_partner: { label: "Delivery Partner", textCls: "text-purple-400", bgCls: "bg-purple-500/10", borderCls: "border-purple-500/20" },
};

const TypeBadge = ({ type }: { type?: string }) => {
  const t = TYPE_MAP[type || "customer"] || TYPE_MAP.customer;
  return (
    <View className={`items-center rounded-full border px-2.5 py-0.5 ${t.bgCls} ${t.borderCls}`}>
      <Text className={`text-[10px] font-bold ${t.textCls}`}>{t.label}</Text>
    </View>
  );
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "customer", label: "Customer", icon: Users },
  { id: "chef", label: "Home Chef", icon: ChefHat },
  { id: "delivery", label: "Delivery Partner", icon: Truck },
  { id: "reports", label: "Reports", icon: FileText },
];

/* ─── STATUS FLOW COMPONENT ───────────────────────────────────── */
const StatusFlow = () => {
  const steps = [
    "Invite Sent",
    "Registered",
    "Verification\nPending",
    "Eligible",
    "Reward\nApproved",
    "Wallet\nCredited",
    "Completed",
  ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
      <View className="flex-row items-center gap-1">
        {steps.map((step, i) => (
          <View key={step} className="flex-row items-center">
            <View className="items-center min-w-[70px]">
              <View className="h-2.5 w-2.5 rounded-full bg-emerald-400 mb-1" />
              <Text className="text-center text-[9px] font-bold text-slate-300 leading-tight">
                {step}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View className="h-[2px] w-5 bg-emerald-500/40 -mt-3" />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

/* ─── MAIN COMPONENT ──────────────────────────────────────────── */
const ReferralManagement = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  /* data */
  const [referrals, setReferrals] = useState<any[]>([]);
  const [reports, setReports] = useState<{ stats: any; wallet_balance?: number }>({
    stats: {},
    wallet_balance: 0,
  });
  const [settings, setSettings] = useState<any>({
    is_enabled: true,
    referrer_reward_amount: 50,
    referee_reward_amount: 30,
    reward_type: "wallet_credit",
    min_order_value: 200,
    first_order_only: true,
    reward_expiry_days: 30,
    max_referrals_per_user: 10,
    daily_referral_limit: 5,
    monthly_referral_limit: 20,
    chef_referrer_reward: 500,
    chef_referee_reward: 200,
    dp_referrer_reward: 500,
    dp_referee_reward: 200,
    dp_required_deliveries: 20,
    chef_referral_enabled: true,
    dp_referral_enabled: true,
  });

  /* filters */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [settingsTab, setSettingsTab] = useState<"customer" | "chef" | "dp">("customer");

  /* pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* modals */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingCode, setCreatingCode] = useState(false);
  const [createForm, setCreateForm] = useState({
    user_id: "",
    referral_code: "",
    type: "customer",
    notes: "",
  });

  /* feedback dialog */
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  /* ── load ── */
  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, reportsRes, referralsRes]: [any, any, any] = await Promise.all([
        get("/referrals/admin/settings").catch(() => ({})),
        get("/referrals/admin/reports").catch(() => ({ stats: {}, wallet_balance: 0 })),
        get("/referrals/admin/list").catch(() => []),
      ]);

      if (settingsRes && typeof settingsRes === "object") {
        setSettings((prev: any) => ({ ...prev, ...(settingsRes.data || settingsRes) }));
      }
      if (reportsRes) {
        setReports(reportsRes.data || reportsRes || { stats: {} });
      }
      if (Array.isArray(referralsRes)) {
        setReferrals(referralsRes);
      } else if (referralsRes && Array.isArray(referralsRes.data)) {
        setReferrals(referralsRes.data);
      } else {
        setReferrals([]);
      }
    } catch (err: any) {
      console.log("Error loading referral data:", err);
      setDialogConfig({
        visible: true,
        title: "Load Error",
        message: err?.message || "Unable to load referrals.",
      });
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

  const updateSetting = (k: string, v: any) =>
    setSettings((p: any) => ({ ...p, [k]: v }));

  const saveSettings = async () => {
    try {
      setSaving(true);
      await put("/referrals/admin/settings", settings);
      setDialogConfig({
        visible: true,
        title: "Settings Saved",
        message: "Referral program settings have been updated successfully.",
      });
      setShowSettingsModal(false);
      loadData();
    } catch (err: any) {
      setDialogConfig({
        visible: true,
        title: "Save Failed",
        message: err?.message || "Unable to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: number | string, action: string) => {
    try {
      await put(`/referrals/admin/${id}/status`, { status: action });
      setDialogConfig({
        visible: true,
        title: "Status Updated",
        message: `Referral status has been updated (${action}).`,
      });
      loadData();
    } catch (err: any) {
      setDialogConfig({
        visible: true,
        title: "Action Failed",
        message: err?.message || "Unable to update referral status.",
      });
    }
  };

  const exportCsv = async () => {
    const csvContent =
      "Code,Referrer,Referee,Type,Reward,Status,Date\n" +
      filtered
        .map(
          (r) =>
            `"${r.referral_code || ""}","${r.referrer_name || ""}","${r.referee_name || ""}","${r.referral_type || r.type || "customer"}","${r.reward_amount || 0}","${r.status || "pending"}","${r.created_at || ""}"`
        )
        .join("\n");

    try {
      await Share.share({
        title: "Referrals Export CSV",
        message: csvContent,
      });
    } catch (e: any) {
      setDialogConfig({
        visible: true,
        title: "Export Ready",
        message: `Exported ${filtered.length} referral records.`,
      });
    }
  };

  const loadUserOptions = async () => {
    try {
      setLoadingUsers(true);
      const res: any = await get("/admin/users");
      const list = Array.isArray(res) ? res : res?.data || [];
      setUserOptions(list);
    } catch {
      setUserOptions([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const openCreateModal = async () => {
    if (!userOptions.length) await loadUserOptions();
    setCreateForm({
      user_id: "",
      referral_code: genCode("CUS"),
      type: "customer",
      notes: "",
    });
    setShowCreateModal(true);
  };

  const handleCreateCode = async () => {
    if (!createForm.user_id) {
      setDialogConfig({
        visible: true,
        title: "Select User",
        message: "Please select a user to assign the referral code.",
      });
      return;
    }
    if (!createForm.referral_code.trim()) {
      setDialogConfig({
        visible: true,
        title: "Missing Code",
        message: "Please specify a referral code.",
      });
      return;
    }

    try {
      setCreatingCode(true);
      await post("/referrals/admin/create-code", createForm);
      setDialogConfig({
        visible: true,
        title: "Code Created",
        message: `Referral code ${createForm.referral_code} created successfully.`,
      });
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      setDialogConfig({
        visible: true,
        title: "Creation Failed",
        message: err?.message || "Unable to create referral code.",
      });
    } finally {
      setCreatingCode(false);
    }
  };

  /* ── derived stats ── */
  const stats = reports.stats || {};
  const totalReferrals = Number(stats.total_referrals || referrals.length || 0);
  const successful = Number(
    stats.successful ||
    referrals.filter(
      (r) => r.status === "approved" || r.status === "rewarded"
    ).length ||
    0
  );
  const pending = Number(
    stats.pending || referrals.filter((r) => r.status === "pending").length || 0
  );
  const rejected = Number(
    stats.rejected || referrals.filter((r) => r.status === "rejected").length || 0
  );
  const totalRewardPaid = Number(
    stats.total_rewards_paid ||
    referrals
      .filter((r) => r.status === "rewarded")
      .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0) ||
    0
  );
  const conversionRate = totalReferrals
    ? ((successful / totalReferrals) * 100).toFixed(1)
    : "0.0";

  /* ── filter logic ── */
  const typeFilterMap: Record<string, string | null> = {
    overview: null,
    customer: "customer",
    chef: "home_chef",
    delivery: "delivery_partner",
    reports: null,
  };
  const typeFilter = typeFilterMap[activeTab];

  const filtered = useMemo(() => {
    return referrals.filter((r) => {
      const matchType =
        !typeFilter || (r.referral_type || r.type || "customer") === typeFilter;
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (r.referrer_name || "").toLowerCase().includes(q) ||
        (r.referee_name || "").toLowerCase().includes(q) ||
        (r.referral_code || "").toLowerCase().includes(q) ||
        (r.referrer_email || "").toLowerCase().includes(q) ||
        (r.referee_email || "").toLowerCase().includes(q);
      return matchType && matchStatus && matchSearch;
    });
  }, [referrals, typeFilter, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedRows = filtered.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterStatus, search, viewMode]);

  /* top referrers for reports tab */
  const topReferrers = useMemo(() => {
    const map: Record<string, { name: string; count: number; earned: number }> = {};
    referrals.forEach((r) => {
      const k = r.referrer_user_id || r.referrer_name || r.referrer_email;
      if (!k) return;
      if (!map[k]) {
        map[k] = {
          name: r.referrer_name || r.referrer_email || `User #${k}`,
          count: 0,
          earned: 0,
        };
      }
      map[k].count++;
      if (r.status === "rewarded") {
        map[k].earned += Number(r.reward_amount || 0);
      }
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [referrals]);

  /* ── STAT CARD ── */
  const StatCard = ({
    label,
    value,
    icon: Icon,
    color = "#34d399",
    sub,
  }: {
    label: string;
    value: string | number;
    icon: any;
    color?: string;
    sub?: string;
  }) => (
    <View className="flex-1 min-w-[140px] rounded-3xl border border-white/10 bg-slate-900 p-4">
      <View className="flex-row items-center gap-2">
        <View
          style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
          className="w-8 h-8 rounded-xl border items-center justify-center"
        >
          <Icon size={16} color={color} />
        </View>
        <Text className="text-[11px] font-bold text-slate-400 flex-1" numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text className="mt-2.5 text-2xl font-black text-white">{value}</Text>
      {sub && <Text className="mt-0.5 text-[10px] text-slate-500">{sub}</Text>}
    </View>
  );

  /* ── LEDGER ROW / CARD RENDERER ── */
  const renderLedgerItem = (item: any) => {
    const currentStatus = String(item.status || "").toLowerCase();

    const isApproved =
      currentStatus === "approved" ||
      currentStatus === "rewarded";

    const isRejected = currentStatus === "rejected";

    if (viewMode === "table") {
      return (
        <View
          key={item.id || Math.random()}
          className="mx-4 mb-2.5 rounded-2xl border border-white/10 bg-slate-900 p-3.5"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg mr-2">
                <Text className="font-mono text-xs font-black text-emerald-400 uppercase">
                  {item.referral_code || "—"}
                </Text>
              </View>
              <TypeBadge type={item.referral_type || item.type || "customer"} />
            </View>
            <StatusBadge status={item.status} />
          </View>

          <View className="flex-row justify-between items-center mt-3 pt-2.5 border-t border-white/5">
            <View className="flex-1 mr-2">
              <Text className="text-slate-400 text-[10px] uppercase font-bold">Referrer</Text>
              <Text className="text-white text-xs font-bold" numberOfLines={1}>
                {item.referrer_name || item.referrer_email || "—"}
              </Text>
            </View>

            <View className="flex-1 mr-2">
              <Text className="text-slate-400 text-[10px] uppercase font-bold">Referee</Text>
              <Text className="text-white text-xs font-bold" numberOfLines={1}>
                {item.referee_name || item.referee_email || "—"}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-slate-400 text-[10px] uppercase font-bold">Reward</Text>
              <Text className="text-emerald-400 text-xs font-black">
                ₹{Number(item.reward_amount || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action Row */}
          <View className="flex-row items-center justify-end gap-2 mt-3 pt-2.5 border-t border-white/5">
            {!isApproved && (
              <TouchableOpacity
                onPress={() => changeStatus(item.id, "approve")}
                className="flex-row items-center gap-1 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1.5"
              >
                <CheckCircle size={12} color="#34d399" />
                <Text className="text-[10px] font-bold text-emerald-300">Approve</Text>
              </TouchableOpacity>
            )}
            {!isRejected && (
              <TouchableOpacity
                onPress={() => changeStatus(item.id, "reject")}
                className="flex-row items-center gap-1 rounded-xl border border-rose-500/25 bg-rose-500/10 px-2.5 py-1.5"
              >
                <XCircle size={12} color="#f87171" />
                <Text className="text-[10px] font-bold text-rose-300">Reject</Text>
              </TouchableOpacity>
            )}
            {/* <TouchableOpacity
              onPress={() => changeStatus(item.id, "resend")}
              className="flex-row items-center gap-1 rounded-xl border border-sky-500/25 bg-sky-500/10 px-2.5 py-1.5"
            >
              <Send size={12} color="#38bdf8" />
              <Text className="text-[10px] font-bold text-sky-300">Resend</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      );
    }

    /* Card Mode */
    return (
      <View
        key={item.id || Math.random()}
        className="mx-4 mb-3.5 rounded-3xl border border-white/10 bg-slate-900 p-4"
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-xl">
            <Text className="font-mono text-xs font-black text-emerald-400 uppercase">
              {item.referral_code || "—"}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View className="flex-row gap-3 my-2">
          <View className="flex-1 bg-slate-950/60 rounded-2xl p-2.5 border border-white/5">
            <Text className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">
              Referrer
            </Text>
            <Text className="text-white font-bold text-xs" numberOfLines={1}>
              {item.referrer_name || "—"}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-0.5" numberOfLines={1}>
              {item.referrer_email || item.referrer_user_id || ""}
            </Text>
          </View>

          <View className="flex-1 bg-slate-950/60 rounded-2xl p-2.5 border border-white/5">
            <Text className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">
              Referee
            </Text>
            <Text className="text-white font-bold text-xs" numberOfLines={1}>
              {item.referee_name || "—"}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-0.5" numberOfLines={1}>
              {item.referee_email || item.referee_user_id || ""}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-white/5">
          <TypeBadge type={item.referral_type || item.type || "customer"} />
          <View className="flex-row items-center gap-1.5">
            <Text className="text-slate-400 text-xs font-semibold">Reward:</Text>
            <Text className="font-black text-emerald-400 text-sm">
              ₹{Number(item.reward_amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center text-[10px] text-slate-500 mt-2">
          <Text className="text-[10px] text-slate-500">
            Date:{" "}
            {item.created_at
              ? new Date(item.created_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              : "—"}
          </Text>
        </View>

        <View className="flex-row gap-2 pt-3 mt-2 border-t border-white/5">
          {!isApproved && (
            <TouchableOpacity
              onPress={() => changeStatus(item.id, "approve")}
              className="flex-1 rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-2 items-center justify-center flex-row gap-1"
            >
              <CheckCircle size={13} color="#34d399" />
              <Text className="text-xs font-bold text-emerald-300">Approve</Text>
            </TouchableOpacity>
          )}
          {!isRejected && (
            <TouchableOpacity
              onPress={() => changeStatus(item.id, "reject")}
              className="flex-1 rounded-xl border border-rose-500/25 bg-rose-500/10 py-2 items-center justify-center flex-row gap-1"
            >
              <XCircle size={13} color="#f87171" />
              <Text className="text-xs font-bold text-rose-300">Reject</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => changeStatus(item.id, "resend")}
            className="flex-1 rounded-xl border border-sky-500/25 bg-sky-500/10 py-2 items-center justify-center flex-row gap-1"
          >
            <Send size={13} color="#38bdf8" />
            <Text className="text-xs font-bold text-sky-300">Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* ── RENDER LOADING ── */
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Referral Management" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Referral System...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Referral Management" navigation={navigation} />

      <FlatList
        data={activeTab === "reports" ? [] : paginatedRows}
        keyExtractor={(item, index) => String(item.id || index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListHeaderComponent={
          <View className="px-4 pt-4">
            {/* ── HEADER BANNER ── */}
            <View className="rounded-3xl border border-white/10 bg-slate-900 p-5 mb-5 shadow-lg">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Admin Panel
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={loadData}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 items-center justify-center"
                    accessibilityLabel="Refresh Data"
                  >
                    <RefreshCw size={15} color="#cbd5e1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={exportCsv}
                    className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 items-center justify-center"
                    accessibilityLabel="Export CSV"
                  >
                    <Download size={15} color="#cbd5e1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowSettingsModal(true)}
                    className="h-9 px-3 rounded-xl bg-emerald-600 items-center justify-center flex-row gap-1.5"
                  >
                    <Settings size={14} color="#ffffff" />
                    <Text className="text-white text-xs font-bold">Settings</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text className="text-2xl font-black text-white">Referral System</Text>
              <Text className="text-slate-400 text-xs mt-1 leading-4">
                Manage Customer, Home Chef & Delivery Partner referrals, reward triggers and fraud prevention.
              </Text>

              {/* Status Flow Stepper */}
              <View className="mt-4 pt-3 border-t border-white/5">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Referral Lifecycle Flow
                </Text>
                <StatusFlow />
              </View>
            </View>

            {/* ── TABS SELECTOR ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5 flex-row gap-2"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    className={`flex-row items-center gap-2 rounded-2xl px-4 py-3 mr-2 border ${active
                      ? "bg-emerald-600 border-emerald-500"
                      : "bg-slate-900 border-white/10"
                      }`}
                  >
                    <Icon size={15} color={active ? "#ffffff" : "#94a3b8"} />
                    <Text
                      className={`text-xs font-bold ${active ? "text-white" : "text-slate-300"
                        }`}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ══ OVERVIEW TAB CONTENT ══ */}
            {activeTab === "overview" && (
              <View className="mb-4">
                {/* Metric Cards Grid */}
                <View className="flex-row flex-wrap gap-2.5 mb-5">
                  <StatCard label="Total Referrals" value={totalReferrals} icon={Users} color="#38bdf8" />
                  <StatCard label="Successful" value={successful} icon={ShieldCheck} color="#34d399" />
                  <StatCard label="Pending" value={pending} icon={Clock} color="#fbbf24" />
                  <StatCard label="Rejected" value={rejected} icon={XCircle} color="#f87171" />
                  <StatCard label="Rewards Paid" value={`₹${totalRewardPaid}`} icon={Wallet} color="#a855f7" />
                  <StatCard label="Conversion" value={`${conversionRate}%`} icon={TrendingUp} color="#34d399" sub="Rewarded Ratio" />
                </View>

                {/* Type Breakdown Cards */}
                <Text className="text-white text-base font-black mb-3">Programs by Role</Text>
                <View className="gap-3 mb-6">
                  {[
                    {
                      type: "customer",
                      label: "Customer Referrals",
                      icon: Users,
                      rewardR: "₹50 wallet",
                      rewardE: "₹30 coupon",
                      min: "₹200 min order",
                      targetTab: "customer",
                    },
                    {
                      type: "home_chef",
                      label: "Home Chef Referrals",
                      icon: ChefHat,
                      rewardR: "₹500 wallet",
                      rewardE: "₹200 bonus",
                      min: "KYC + 1st order",
                      targetTab: "chef",
                    },
                    {
                      type: "delivery_partner",
                      label: "Delivery Partner Referrals",
                      icon: Truck,
                      rewardR: "₹500 bonus",
                      rewardE: "₹200 bonus",
                      min: "20 deliveries",
                      targetTab: "delivery",
                    },
                  ].map((t) => {
                    const count = referrals.filter(
                      (r) => (r.referral_type || r.type || "customer") === t.type
                    ).length;
                    const rew = referrals.filter(
                      (r) =>
                        (r.referral_type || r.type || "customer") === t.type &&
                        r.status === "rewarded"
                    ).length;
                    const tm = TYPE_MAP[t.type] || TYPE_MAP.customer;
                    const Icon = t.icon;

                    return (
                      <View
                        key={t.type}
                        className={`rounded-3xl border ${tm.borderCls} ${tm.bgCls} p-4`}
                      >
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="flex-row items-center gap-2">
                            <Icon size={18} color={t.type === "customer" ? "#38bdf8" : t.type === "home_chef" ? "#fb923c" : "#c084fc"} />
                            <Text className={`font-black text-sm ${tm.textCls}`}>{t.label}</Text>
                          </View>
                          <Text className="text-white font-black text-sm">{count} Total</Text>
                        </View>

                        <View className="bg-slate-950/40 rounded-2xl p-3 gap-1.5 mb-3 border border-white/5">
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Rewarded</Text>
                            <Text className="text-emerald-400 font-bold text-xs">{rew}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Referrer gets</Text>
                            <Text className="text-white font-bold text-xs">{t.rewardR}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Referee gets</Text>
                            <Text className="text-white font-bold text-xs">{t.rewardE}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Trigger condition</Text>
                            <Text className="text-amber-300 font-bold text-xs">{t.min}</Text>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() => setActiveTab(t.targetTab)}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 items-center justify-center"
                        >
                          <Text className={`text-xs font-bold ${tm.textCls}`}>
                            Manage {t.label} →
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>

                {/* Section Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white text-base font-black">Recent Referrals</Text>
                  {/* <TouchableOpacity
                    onPress={openCreateModal}
                    className="flex-row items-center gap-1 bg-emerald-600 px-3 py-1.5 rounded-xl"
                  >
                    <Plus size={14} color="#ffffff" />
                    <Text className="text-white text-xs font-bold">Add Code</Text>
                  </TouchableOpacity> */}
                </View>
              </View>
            )}

            {/* ══ ROLE SPECIFIC BANNERS ══ */}
            {activeTab === "customer" && (
              <View className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 mb-4">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Users size={16} color="#38bdf8" />
                  <Text className="text-sky-400 font-bold text-xs">Customer Referral Program</Text>
                </View>
                <Text className="text-slate-300 text-xs leading-4">
                  Referrer: <Text className="text-white font-bold">₹50 Wallet Credit</Text> • Referee:{" "}
                  <Text className="text-white font-bold">₹30 Coupon</Text> • Min Order:{" "}
                  <Text className="text-white font-bold">₹200</Text> • Trigger:{" "}
                  <Text className="text-emerald-400 font-bold">First successful paid order</Text>
                </Text>
              </View>
            )}

            {activeTab === "chef" && (
              <View className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 mb-4">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <ChefHat size={16} color="#fb923c" />
                  <Text className="text-orange-400 font-bold text-xs">Home Chef Referral Program</Text>
                </View>
                <Text className="text-slate-300 text-xs leading-4">
                  Referrer: <Text className="text-white font-bold">₹500 Wallet Credit</Text> • Referee:{" "}
                  <Text className="text-white font-bold">₹200 Bonus</Text> • Trigger:{" "}
                  <Text className="text-orange-300 font-bold">KYC + Approval + 1 Item + 1st Order</Text>
                </Text>
              </View>
            )}

            {activeTab === "delivery" && (
              <View className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 mb-4">
                <View className="flex-row items-center gap-1.5 mb-2">
                  <Truck size={16} color="#c084fc" />
                  <Text className="text-purple-400 font-bold text-xs">Delivery Partner Referral</Text>
                </View>
                <Text className="text-slate-300 text-xs leading-4">
                  Referrer: <Text className="text-white font-bold">₹500 Bonus</Text> • Referee:{" "}
                  <Text className="text-white font-bold">₹200 Bonus</Text> • Trigger:{" "}
                  <Text className="text-purple-300 font-bold">KYC + Vehicle + 20 Deliveries</Text>
                </Text>
              </View>
            )}

            {/* ══ REPORTS TAB CONTENT ══ */}
            {activeTab === "reports" && (
              <View className="mb-4">
                <View className="flex-row flex-wrap gap-2.5 mb-5">
                  <StatCard label="Total Referrals" value={totalReferrals} icon={Users} color="#38bdf8" />
                  <StatCard label="Rewards Credited" value={`₹${totalRewardPaid}`} icon={Wallet} color="#34d399" />
                  <StatCard label="Pending" value={pending} icon={Clock} color="#fbbf24" />
                  <StatCard label="Conversion" value={`${conversionRate}%`} icon={TrendingUp} color="#a855f7" />
                </View>

                {/* Top Referrers Leaderboard */}
                <View className="rounded-3xl border border-white/10 bg-slate-900 p-5 mb-5">
                  <Text className="text-white text-base font-black mb-1">Top Referrers</Text>
                  <Text className="text-slate-400 text-xs mb-4">
                    Users with the most successful referral conversions
                  </Text>

                  {topReferrers.length === 0 ? (
                    <Text className="text-slate-500 text-xs text-center py-4">
                      No referral data recorded yet.
                    </Text>
                  ) : (
                    <View className="gap-2">
                      {topReferrers.map((r, i) => (
                        <View
                          key={i}
                          className="flex-row items-center justify-between rounded-2xl border border-white/5 bg-slate-950/60 p-3"
                        >
                          <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                            <View
                              className={`w-7 h-7 rounded-xl items-center justify-center font-black ${i === 0
                                ? "bg-yellow-500/20 border border-yellow-500/40"
                                : i === 1
                                  ? "bg-slate-400/20 border border-slate-400/40"
                                  : i === 2
                                    ? "bg-amber-600/20 border border-amber-600/40"
                                    : "bg-slate-800"
                                }`}
                            >
                              <Text
                                className={`text-xs font-black ${i === 0
                                  ? "text-yellow-400"
                                  : i === 1
                                    ? "text-slate-300"
                                    : i === 2
                                      ? "text-amber-500"
                                      : "text-slate-500"
                                  }`}
                              >
                                #{i + 1}
                              </Text>
                            </View>
                            <Text className="text-white font-bold text-xs flex-1" numberOfLines={1}>
                              {r.name}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-3">
                            <Text className="text-slate-400 text-xs">{r.count} refs</Text>
                            <Text className="text-emerald-400 font-bold text-xs">
                              ₹{r.earned.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Program Type Stats breakdown */}
                <View className="gap-3 mb-5">
                  {[
                    { type: "customer", label: "Customer", icon: Users },
                    { type: "home_chef", label: "Home Chef", icon: ChefHat },
                    { type: "delivery_partner", label: "Delivery Partner", icon: Truck },
                  ].map((t) => {
                    const rows = referrals.filter(
                      (r) => (r.referral_type || r.type || "customer") === t.type
                    );
                    const rew = rows.filter((r) => r.status === "rewarded").length;
                    const pend = rows.filter((r) => r.status === "pending").length;
                    const rej = rows.filter((r) => r.status === "rejected").length;
                    const tm = TYPE_MAP[t.type] || TYPE_MAP.customer;
                    const Icon = t.icon;

                    return (
                      <View
                        key={t.type}
                        className={`rounded-3xl border ${tm.borderCls} ${tm.bgCls} p-4`}
                      >
                        <View className="flex-row items-center gap-2 mb-3">
                          <Icon size={16} color={t.type === "customer" ? "#38bdf8" : t.type === "home_chef" ? "#fb923c" : "#c084fc"} />
                          <Text className={`font-black text-sm ${tm.textCls}`}>{t.label}</Text>
                        </View>

                        <View className="bg-slate-950/60 rounded-2xl p-3 gap-1.5 border border-white/5">
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Total</Text>
                            <Text className="text-white font-bold text-xs">{rows.length}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Rewarded</Text>
                            <Text className="text-emerald-400 font-bold text-xs">{rew}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Pending</Text>
                            <Text className="text-amber-400 font-bold text-xs">{pend}</Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-slate-400 text-xs">Rejected</Text>
                            <Text className="text-rose-400 font-bold text-xs">{rej}</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>

                {/* Ledger section header in reports */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white text-base font-black">All Referral Records</Text>
                  <TouchableOpacity
                    onPress={exportCsv}
                    className="flex-row items-center gap-1 bg-slate-800 border border-white/10 px-3 py-1.5 rounded-xl"
                  >
                    <Download size={14} color="#cbd5e1" />
                    <Text className="text-slate-300 text-xs font-bold">Export</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── FILTER & SEARCH BAR ── */}
            <View className="mb-4">
              <View className="bg-slate-900 border border-white/10 rounded-2xl px-3.5 py-2.5 flex-row items-center mb-2.5">
                <Search size={16} color="#64748b" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name, email, or code..."
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white ml-2.5 text-xs font-semibold"
                />
                {search ? (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <X size={15} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View className="flex-row items-center justify-between">
                {/* Status Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                  {[
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "verified", label: "Verified" },
                    { id: "rewarded", label: "Rewarded" },
                    { id: "approved", label: "Approved" },
                    { id: "rejected", label: "Rejected" },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => setFilterStatus(s.id)}
                      className={`px-3 py-1.5 rounded-xl border mr-1.5 ${filterStatus === s.id
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-900 border-white/10"
                        }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${filterStatus === s.id ? "text-emerald-300" : "text-slate-400"
                          }`}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

              </View>

              <Text className="text-slate-500 text-[10px] font-semibold mt-2.5">
                Showing {filtered.length} matching referrals
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => renderLedgerItem(item)}
        ListEmptyComponent={
          <View className="items-center py-12 px-6">
            <Users size={40} color="#475569" />
            <Text className="text-slate-400 font-bold text-xs mt-3">
              No referral records found
            </Text>
            <Text className="text-slate-600 text-[11px] text-center mt-1">
              Tap + to create a custom referral code or adjust search filters.
            </Text>
          </View>
        }
        ListFooterComponent={
          filtered.length > 0 ? (
            <View className="flex-row justify-center items-center mt-4 px-4">
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

      {/* Floating Action Button */}
      <View
        style={{
          position: "absolute",
          right: 20,
          bottom: 25,
          zIndex: 9999,
          elevation: 20,
        }}
      >
        <FloatingActionButton onPress={openCreateModal} label="Add Code" />
      </View>

      {/* ══ CREATE REFERRAL CODE MODAL ══ */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/80"
        >
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-6"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-xl font-black">Create Referral Code</Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Generate and assign a referral code to a user
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={15} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[420px]">
              {/* Type Select */}
              <Text className="text-slate-300 text-xs font-bold mb-1.5">Referral Type</Text>
              <View className="flex-row gap-2 mb-4">
                {[
                  { id: "customer", label: "Customer", prefix: "CUS" },
                  { id: "home_chef", label: "Chef", prefix: "HC" },
                  { id: "delivery_partner", label: "Delivery", prefix: "DP" },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() =>
                      setCreateForm((p) => ({
                        ...p,
                        type: t.id,
                        referral_code: genCode(t.prefix),
                      }))
                    }
                    className={`flex-1 py-2.5 rounded-xl border items-center justify-center ${createForm.type === t.id
                      ? "bg-emerald-500/20 border-emerald-500"
                      : "bg-slate-950 border-white/10"
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${createForm.type === t.id ? "text-emerald-300" : "text-slate-400"
                        }`}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* User Selection */}
              <Text className="text-slate-300 text-xs font-bold mb-1.5">Assign User</Text>
              <View className="bg-slate-950 border border-white/10 rounded-2xl p-3 mb-4">
                {loadingUsers ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : userOptions.length === 0 ? (
                  <Text className="text-slate-500 text-xs">No users available</Text>
                ) : (
                  <ScrollView nestedScrollEnabled className="max-h-36">
                    {userOptions.map((u) => {
                      const uid = u.id || u.user_id;
                      const isSelected = String(createForm.user_id) === String(uid);
                      return (
                        <TouchableOpacity
                          key={uid}
                          onPress={() =>
                            setCreateForm((p) => ({ ...p, user_id: String(uid) }))
                          }
                          className={`py-2 px-2.5 rounded-xl flex-row items-center justify-between mb-1 ${isSelected ? "bg-emerald-600/20" : ""
                            }`}
                        >
                          <View className="flex-1 mr-2">
                            <Text
                              className={`text-xs font-bold ${isSelected ? "text-emerald-400" : "text-white"
                                }`}
                              numberOfLines={1}
                            >
                              {u.name || u.email || `User #${uid}`}
                            </Text>
                            <Text className="text-[10px] text-slate-400">
                              {u.email || u.phone || `ID: ${uid}`}
                            </Text>
                          </View>
                          {isSelected && <Check size={14} color="#34d399" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Referral Code */}
              <Text className="text-slate-300 text-xs font-bold mb-1.5">Referral Code</Text>
              <View className="flex-row gap-2 mb-4">
                <TextInput
                  value={createForm.referral_code}
                  onChangeText={(t) =>
                    setCreateForm((p) => ({ ...p, referral_code: t.toUpperCase() }))
                  }
                  placeholder="e.g. CUS1234"
                  placeholderTextColor="#64748b"
                  className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white font-mono font-bold text-sm"
                />
                <TouchableOpacity
                  onPress={() => {
                    const prefix =
                      createForm.type === "home_chef"
                        ? "HC"
                        : createForm.type === "delivery_partner"
                          ? "DP"
                          : "CUS";
                    setCreateForm((p) => ({ ...p, referral_code: genCode(prefix) }));
                  }}
                  className="w-12 bg-slate-800 border border-white/10 rounded-2xl items-center justify-center"
                >
                  <RefreshCw size={16} color="#cbd5e1" />
                </TouchableOpacity>
              </View>

              {/* Admin Notes */}
              <Text className="text-slate-300 text-xs font-bold mb-1.5">
                Admin Notes (Optional)
              </Text>
              <TextInput
                value={createForm.notes}
                onChangeText={(t) => setCreateForm((p) => ({ ...p, notes: t }))}
                placeholder="Optional notes for this referral code..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={2}
                className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs mb-4"
              />
            </ScrollView>

            <View className="flex-row gap-3 pt-3 border-t border-white/10">
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-slate-800 py-3.5 items-center justify-center"
              >
                <Text className="text-slate-300 font-bold text-xs">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateCode}
                disabled={creatingCode}
                className="flex-1 rounded-2xl bg-emerald-600 py-3.5 items-center justify-center"
              >
                {creatingCode ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase">Create Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ PROGRAM SETTINGS MODAL ══ */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/80"
        >
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-6"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-xl font-black">Program Settings</Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Configure referral rewards and rules across all roles
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={15} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Sub Tabs */}
            <View className="flex-row gap-2 mb-4">
              {[
                { id: "customer", label: "Customer", icon: Users },
                { id: "chef", label: "Home Chef", icon: ChefHat },
                { id: "dp", label: "Delivery", icon: Truck },
              ].map((t) => {
                const Icon = t.icon;
                const active = settingsTab === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setSettingsTab(t.id as any)}
                    className={`flex-1 py-2.5 rounded-xl border flex-row items-center justify-center gap-1.5 ${active
                      ? "bg-emerald-600 border-emerald-500"
                      : "bg-slate-950 border-white/10"
                      }`}
                  >
                    <Icon size={14} color={active ? "#ffffff" : "#94a3b8"} />
                    <Text
                      className={`text-xs font-bold ${active ? "text-white" : "text-slate-400"
                        }`}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[380px]">
              {/* Customer Settings */}
              {settingsTab === "customer" && (
                <View className="gap-3.5">
                  <TouchableOpacity
                    onPress={() => updateSetting("is_enabled", !settings.is_enabled)}
                    className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-3.5"
                  >
                    <Text className="text-white font-bold text-xs">Enable Customer Referral</Text>
                    <View
                      className={`w-10 h-6 rounded-full p-1 ${settings.is_enabled ? "bg-emerald-600" : "bg-slate-700"
                        }`}
                    >
                      <View
                        className={`w-4 h-4 rounded-full bg-white transition ${settings.is_enabled ? "self-end" : "self-start"
                          }`}
                      />
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Referrer Reward (₹)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.referrer_reward_amount || 0)}
                        onChangeText={(t) => updateSetting("referrer_reward_amount", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Referee Reward (₹)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.referee_reward_amount || 0)}
                        onChangeText={(t) => updateSetting("referee_reward_amount", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Min Order Value (₹)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.min_order_value || 0)}
                        onChangeText={(t) => updateSetting("min_order_value", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Expiry (Days)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.reward_expiry_days || 0)}
                        onChangeText={(t) => updateSetting("reward_expiry_days", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                  </View>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Daily Limit</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.daily_referral_limit || 0)}
                        onChangeText={(t) => updateSetting("daily_referral_limit", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Monthly Limit</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.monthly_referral_limit || 0)}
                        onChangeText={(t) => updateSetting("monthly_referral_limit", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Chef Settings */}
              {settingsTab === "chef" && (
                <View className="gap-3.5">
                  <TouchableOpacity
                    onPress={() => updateSetting("chef_referral_enabled", !settings.chef_referral_enabled)}
                    className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-3.5"
                  >
                    <Text className="text-white font-bold text-xs">Enable Home Chef Referral</Text>
                    <View
                      className={`w-10 h-6 rounded-full p-1 ${settings.chef_referral_enabled ? "bg-emerald-600" : "bg-slate-700"
                        }`}
                    >
                      <View
                        className={`w-4 h-4 rounded-full bg-white transition ${settings.chef_referral_enabled ? "self-end" : "self-start"
                          }`}
                      />
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Referrer Reward (₹)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.chef_referrer_reward || 0)}
                        onChangeText={(t) => updateSetting("chef_referrer_reward", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Joining Bonus (₹)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.chef_referee_reward || 0)}
                        onChangeText={(t) => updateSetting("chef_referee_reward", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                  </View>

                  <View className="rounded-2xl border border-white/5 bg-slate-950/70 p-3.5 gap-1">
                    <Text className="text-white font-bold text-xs mb-1">Trigger Verification Steps</Text>
                    <Text className="text-slate-400 text-[11px]">✓ Chef completes KYC</Text>
                    <Text className="text-slate-400 text-[11px]">✓ Admin approves chef account</Text>
                    <Text className="text-slate-400 text-[11px]">✓ Chef publishes 1st food item</Text>
                    <Text className="text-slate-400 text-[11px]">✓ 1st successful order fulfilled</Text>
                  </View>
                </View>
              )}

              {/* Delivery Settings */}
              {settingsTab === "dp" && (
                <View className="gap-3.5">
                  <TouchableOpacity
                    onPress={() => updateSetting("dp_referral_enabled", !settings.dp_referral_enabled)}
                    className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-slate-950 p-3.5"
                  >
                    <Text className="text-white font-bold text-xs">Enable Delivery Partner Referral</Text>
                    <View
                      className={`w-10 h-6 rounded-full p-1 ${settings.dp_referral_enabled ? "bg-emerald-600" : "bg-slate-700"
                        }`}
                    >
                      <View
                        className={`w-4 h-4 rounded-full bg-white transition ${settings.dp_referral_enabled ? "self-end" : "self-start"
                          }`}
                      />
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row gap-3">
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Referrer Reward (₹)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.dp_referrer_reward || 0)}
                        onChangeText={(t) => updateSetting("dp_referrer_reward", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-300 text-xs font-bold mb-1">Joining Bonus (₹)</Text>
                      <TextInput
                        keyboardType="numeric"
                        value={String(settings.dp_referee_reward || 0)}
                        onChangeText={(t) => updateSetting("dp_referee_reward", Number(t) || 0)}
                        className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-slate-300 text-xs font-bold mb-1">Required Deliveries for Reward</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={String(settings.dp_required_deliveries || 20)}
                      onChangeText={(t) => updateSetting("dp_required_deliveries", Number(t) || 0)}
                      className="bg-slate-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-white font-bold text-xs"
                    />
                  </View>

                  <View className="rounded-2xl border border-white/5 bg-slate-950/70 p-3.5 gap-1">
                    <Text className="text-white font-bold text-xs mb-1">Trigger Verification Steps</Text>
                    <Text className="text-slate-400 text-[11px]">✓ Delivery Partner KYC approved</Text>
                    <Text className="text-slate-400 text-[11px]">✓ Vehicle verified</Text>
                    <Text className="text-slate-400 text-[11px]">✓ Completes required delivery threshold</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View className="flex-row gap-3 pt-3 border-t border-white/10">
              <TouchableOpacity
                onPress={() => setShowSettingsModal(false)}
                className="flex-1 rounded-2xl border border-white/10 bg-slate-800 py-3.5 items-center justify-center"
              >
                <Text className="text-slate-300 font-bold text-xs">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveSettings}
                disabled={saving}
                className="flex-1 rounded-2xl bg-emerald-600 py-3.5 items-center justify-center"
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase">Save Settings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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

export default ReferralManagement;

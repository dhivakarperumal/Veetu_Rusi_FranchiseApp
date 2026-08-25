import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import {
  Search,
  Eye,
  FileText,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ChefHat,
  Store,
  Filter,
  Check,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get, patch, post } from "../services/api";

const STATUS_OPTIONS = [
  "All",
  "Pending",
  "Confirmed",
  "Preparing",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const ADMIN_BLOCKED_CANCEL = ["delivered", "completed", "cancelled"];

const ITEMS_PER_PAGE = 6;

type OrderItem = {
  id?: number | string;
  name?: string;
  food_name?: string;
  item_name?: string;
  quantity?: number | string;
  price?: number | string;
  final_price?: number | string;
  mrp?: number | string;
  chef_name?: string;
  chef?: string;
  created_by_name?: string;
  chef_email?: string;
  chef_phone?: string;
  chef_id?: number | string;
  image?: string;
};

type Order = {
  id: number | string;
  order_id?: string;
  status?: string;
  total_amount?: number | string;
  ordered_at?: string;
  created_at?: string;
  delivery_date?: string;
  delivery_time?: string;
  payment_method?: string;
  payment_status?: string;
  customer_name?: string;
  ordered_by_name?: string;
  name?: string;
  user_name?: string;
  customer_email?: string;
  ordered_by_email?: string;
  email?: string;
  user_email?: string;
  customer_phone?: string;
  ordered_by_phone?: string;
  phone?: string;
  user_phone?: string;
  user_id?: number | string;
  street_address?: string;
  city?: string;
  district?: string;
  state?: string;
  zip_code?: string;
  pincode?: string;
  items?: OrderItem[];
  franchise_id?: number | string;
  franchise_user_id?: number | string;
  franchise_name?: string;
};

type Chef = {
  id?: number | string;
  chef_id?: number | string;
  name?: string;
  kitchen_name?: string;
  mobile?: string;
};

const formatDate = (val?: string) => {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return val;
  }
};

const formatAmount = (val: any) => {
  const num = parseFloat(val);
  return !isNaN(num) ? `₹${num.toFixed(2)}` : "₹0.00";
};

const getItemUnitPrice = (item: OrderItem) => {
  return parseFloat(String(item.price || item.final_price || item.mrp || 0)) || 0;
};

const getItemTotal = (item: OrderItem) => {
  const quantity = Number(item.quantity) || 1;
  return getItemUnitPrice(item) * quantity;
};

const getChefGroups = (items: OrderItem[]) => {
  if (!Array.isArray(items)) return [];

  const groups = items.reduce((acc: any, item: OrderItem) => {
    const chefKey =
      item.chef_name ||
      item.chef ||
      item.created_by_name ||
      item.chef_email ||
      item.chef_phone ||
      "Home Chef";
    const chefName =
      item.chef_name || item.chef || item.created_by_name || "Home Chef";
    const quantity = Number(item.quantity) || 1;
    const price = getItemUnitPrice(item);

    if (!acc[chefKey]) {
      acc[chefKey] = {
        name: chefName,
        total_quantity: 0,
        total_amount: 0,
        items: [] as OrderItem[],
      };
    }

    acc[chefKey].items.push(item);
    acc[chefKey].total_quantity += quantity;
    acc[chefKey].total_amount += price * quantity;

    return acc;
  }, {});

  return Object.values(groups).map((group: any) => ({
    ...group,
    total_amount: parseFloat(group.total_amount.toFixed(2)),
  }));
};

const getStatusStyle = (status?: string) => {
  switch (status) {
    case "Confirmed":
      return {
        bg: "bg-blue-500/15",
        border: "border-blue-500/30",
        text: "text-blue-400",
      };
    case "Preparing":
      return {
        bg: "bg-violet-500/15",
        border: "border-violet-500/30",
        text: "text-violet-400",
      };
    case "Out for Delivery":
      return {
        bg: "bg-orange-500/15",
        border: "border-orange-500/30",
        text: "text-orange-400",
      };
    case "Delivered":
      return {
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
      };
    case "Cancelled":
      return {
        bg: "bg-red-500/15",
        border: "border-red-500/30",
        text: "text-red-400",
      };
    case "Pending":
    default:
      return {
        bg: "bg-amber-500/15",
        border: "border-amber-500/30",
        text: "text-amber-400",
      };
  }
};

const FoodOrders = () => {
  const insets = useSafeAreaInsets();

  const [orders, setOrders] = useState<Order[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [chefFilter, setChefFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showChefDropdown, setShowChefDropdown] = useState(false);

  // Selected Order for Details Popup
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalStatus, setModalStatus] = useState<string>("");

  // Cancel target
  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Receipt Modal
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptSettings, setReceiptSettings] = useState<any>(null);

  // --------------------------------------------------
  // LOAD USER & CHEFS
  // --------------------------------------------------
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await AsyncStorage.getItem("user");
        if (u) setCurrentUser(JSON.parse(u));
      } catch (e) {
        console.log("Error loading user in FoodOrders:", e);
      }
    };
    loadUser();
  }, []);

  const fetchChefs = async () => {
    try {
      const res: any = await get("/admin/homechefs");
      const data = res?.data ?? res;
      setChefs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Failed to load chefs in FoodOrders:", e);
    }
  };

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let queryString = "";
      const queryParts: string[] = [];

      if (statusFilter !== "All") {
        queryParts.push(`status=${encodeURIComponent(statusFilter)}`);
      }

      if (chefFilter !== "All") {
        queryParts.push(`chef_id=${encodeURIComponent(chefFilter)}`);
      }

      if (search.trim()) {
        queryParts.push(`search=${encodeURIComponent(search.trim())}`);
      }

      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const franchiseUserId = user?.franchise_user_id || user?.user_id || user?.id;

      if (franchiseUserId) {
        queryParts.push(`franchise_user_id=${encodeURIComponent(franchiseUserId)}`);
      }

      if (queryParts.length > 0) {
        queryString = `?${queryParts.join("&")}`;
      }

      const res: any = await get(`/user-food-orders${queryString}`);
      const data = res?.data ?? res;
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Food Orders Error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, chefFilter, search]);

  useEffect(() => {
    fetchChefs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchOrders();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChefs();
    fetchOrders();
  };

  // --------------------------------------------------
  // CHEF & FRANCHISE FILTERING
  // --------------------------------------------------
  const isOrderMatchingChef = useCallback(
    (order: Order, targetChefId: string) => {
      const targetChef = chefs.find(
        (c) =>
          String(c.chef_id ?? c.id) === String(targetChefId) ||
          String((c as any).user_id) === String(targetChefId)
      );

      const items = Array.isArray(order.items) ? order.items : [];

      // Check if any order item belongs to this chef
      return items.some((item) => {
        const itemChefId = item.chef_id != null ? String(item.chef_id) : null;
        if (itemChefId && itemChefId === String(targetChefId)) return true;

        if (targetChef) {
          const targetIds = [
            targetChef.id != null ? String(targetChef.id) : null,
            targetChef.chef_id != null ? String(targetChef.chef_id) : null,
            (targetChef as any).user_id != null ? String((targetChef as any).user_id) : null,
          ].filter(Boolean) as string[];

          if (itemChefId && targetIds.includes(itemChefId)) return true;

          const itemChefName = (item.chef_name || item.chef || item.created_by_name)?.trim().toLowerCase();
          const targetName = targetChef.name?.trim().toLowerCase();
          const targetKitchen = targetChef.kitchen_name?.trim().toLowerCase();

          if (itemChefName && targetName && itemChefName === targetName) return true;
          if (itemChefName && targetKitchen && itemChefName === targetKitchen) return true;
        }

        return false;
      });
    },
    [chefs]
  );

  const belongsToFranchise = useCallback(
    (order: Order) => {
      // If we have home chefs registered for this franchise admin, check if any order item belongs to them
      if (chefs.length > 0) {
        const matchesAnyChef = chefs.some((chef) => {
          const chefId = String(chef.chef_id ?? chef.id);
          return isOrderMatchingChef(order, chefId);
        });
        if (matchesAnyChef) return true;
      }

      // Check if order has franchise ID matching current franchise user
      const franchiseId =
        currentUser?.franchise_user_id ||
        currentUser?.franchise_id ||
        currentUser?.user_id ||
        currentUser?.id;

      if (franchiseId) {
        const orderFranchiseId =
          order.franchise_id != null
            ? String(order.franchise_id)
            : order.franchise_user_id != null
            ? String(order.franchise_user_id)
            : null;

        if (orderFranchiseId && orderFranchiseId === String(franchiseId)) {
          return true;
        }
      }

      if (currentUser?.franchise_name || currentUser?.name) {
        const franchiseName = (currentUser.franchise_name || currentUser.name)?.trim().toLowerCase();
        const orderFranchiseName = order.franchise_name?.trim().toLowerCase();
        if (franchiseName && orderFranchiseName && franchiseName === orderFranchiseName) {
          return true;
        }
      }

      return false;
    },
    [chefs, currentUser, isOrderMatchingChef]
  );

  // Filtered orders list scoped to franchise
  const franchiseOrders = useMemo(() => {
    return orders.filter((order) => {
      if (chefFilter !== "All") {
        return isOrderMatchingChef(order, chefFilter);
      }
      return belongsToFranchise(order);
    });
  }, [orders, chefFilter, isOrderMatchingChef, belongsToFranchise]);

  // Search & Status filtering
  const filteredOrders = useMemo(() => {
    return franchiseOrders.filter((order) => {
      const q = search.trim().toLowerCase();

      const matchesSearch = q
        ? [
            order.order_id,
            order.customer_name,
            order.ordered_by_name,
            order.name,
            order.customer_phone,
            order.phone,
            order.customer_email,
            order.email,
            order.city,
            order.district,
            order.street_address,
          ]
            .filter(Boolean)
            .some((val) => String(val).toLowerCase().includes(q)) ||
          (Array.isArray(order.items) &&
            order.items.some((it) =>
              [it.name, it.food_name, it.chef_name, it.chef]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
            ))
        : true;

      let matchesStatus = true;
      if (statusFilter === "Needs Review" || statusFilter === "In Progress") {
        matchesStatus =
          order.status === "Pending" ||
          order.status === "Confirmed" ||
          order.status === "Preparing";
      } else if (statusFilter !== "All") {
        matchesStatus = order.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [franchiseOrders, search, statusFilter]);

  // --------------------------------------------------
  // SUMMARY COUNTS
  // --------------------------------------------------
  const stats = useMemo(() => {
    const baseList = franchiseOrders;
    const total = baseList.length;
    const pending = baseList.filter((o) => o.status === "Pending").length;
    const preparing = baseList.filter(
      (o) => o.status === "Preparing" || o.status === "Confirmed"
    ).length;
    const delivered = baseList.filter((o) => o.status === "Delivered").length;
    const cancelled = baseList.filter((o) => o.status === "Cancelled").length;

    return {
      total,
      pending,
      preparing,
      delivered,
      cancelled,
    };
  }, [franchiseOrders]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --------------------------------------------------
  // ORDER ACTIONS
  // --------------------------------------------------
  const handleUpdateStatus = async (orderId: number | string, newStatus: string) => {
    try {
      setActionLoading(true);
      await patch(`/user-food-orders/status/${orderId}`, {
        status: newStatus,
      });

      Alert.alert("Success", `Order status updated to ${newStatus}`);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      console.log("Failed to update status:", err);
      Alert.alert("Error", err?.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelTargetOrder) return;
    try {
      setActionLoading(true);
      await post(`/user-food-orders/cancel/${cancelTargetOrder.id}`, {
        reason: cancelReason || "Cancelled by Franchise Admin",
      });

      Alert.alert("Success", "Order cancelled successfully");

      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelTargetOrder.id ? { ...o, status: "Cancelled" } : o
        )
      );

      if (selectedOrder?.id === cancelTargetOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: "Cancelled" });
      }

      setCancelTargetOrder(null);
      setCancelReason("");
    } catch (err: any) {
      console.log("Cancel Order Error:", err);
      Alert.alert("Error", err?.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  const openReceipt = async (order: Order) => {
    setReceiptOrder(order);
    try {
      const res: any = await get("/settings/delivery-partner");
      setReceiptSettings(res?.data?.data || res?.data || res || {});
    } catch {
      setReceiptSettings({});
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalStatus(order.status || "Pending");
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------
  if (loading && !refreshing && orders.length === 0) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-3 font-semibold text-xs">
          Loading Food Orders...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <FlatList
        data={paginatedOrders}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View className="px-4 pt-6">
            {/* ================= HEADER ================= */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-1">
                <Text className="text-white text-3xl font-black">
                  Food Orders
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Track and manage customer home chef orders
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                <ShoppingBag size={20} color="#34d399" />
              </View>
            </View>

            {/* ================= SUMMARY STAT CARDS ================= */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row mb-5"
            >
              {/* TOTAL */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                className={`w-32 mr-3 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "All"
                    ? "border-indigo-400"
                    : "border-indigo-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-indigo-500/15  items-center justify-center mb-2">
                  <ShoppingBag size={16} color="#a5b4fc" />
                </View>
                <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">
                  Total Orders
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {stats.total}
                </Text>
              </TouchableOpacity>

              {/* PENDING */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Pending");
                  setCurrentPage(1);
                }}
                className={`w-32 mr-3 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Pending"
                    ? "border-amber-400"
                    : "border-amber-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
                  <Clock size={16} color="#fcd34d" />
                </View>
                <Text className="text-amber-200/70 text-[9px] font-bold uppercase">
                  Pending
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {stats.pending}
                </Text>
              </TouchableOpacity>

              {/* IN PROGRESS */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Preparing");
                  setCurrentPage(1);
                }}
                className={`w-32 mr-3 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Preparing"
                    ? "border-purple-400"
                    : "border-purple-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-purple-500/15 items-center justify-center mb-2">
                  <ChefHat size={16} color="#c084fc" />
                </View>
                <Text className="text-purple-200/70 text-[9px] font-bold uppercase">
                  In Progress
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {stats.preparing}
                </Text>
              </TouchableOpacity>

              {/* DELIVERED */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Delivered");
                  setCurrentPage(1);
                }}
                className={`w-32 mr-3 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Delivered"
                    ? "border-emerald-400"
                    : "border-emerald-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <CheckCircle size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  Delivered
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {stats.delivered}
                </Text>
              </TouchableOpacity>

              {/* CANCELLED */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Cancelled");
                  setCurrentPage(1);
                }}
                className={`w-32 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Cancelled"
                    ? "border-rose-400"
                    : "border-rose-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-rose-500/15 items-center justify-center mb-2">
                  <XCircle size={16} color="#f87171" />
                </View>
                <Text className="text-rose-200/70 text-[9px] font-bold uppercase">
                  Cancelled
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {stats.cancelled}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search order ID, customer, phone, chef..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* ================= FILTERS ROW ================= */}
            <View className="flex-row items-center gap-2 mb-4">
              {/* Chef Filter */}
              {chefs.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowChefDropdown(true)}
                  className="flex-1 flex-row items-center justify-between bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5"
                >
                  <View className="flex-row items-center flex-1 mr-1">
                    <ChefHat size={14} color="#94a3b8" />
                    <Text
                      className="text-white text-xs font-bold ml-1.5"
                      numberOfLines={1}
                    >
                      {chefFilter === "All"
                        ? "All Chefs"
                        : chefs.find(
                            (c) => String(c.chef_id ?? c.id) === chefFilter
                          )?.name || "Chef"}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}

              {/* Status Filter */}
              <TouchableOpacity
                onPress={() => setShowStatusDropdown(true)}
                className="flex-1 flex-row items-center justify-between bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5"
              >
                <View className="flex-row items-center flex-1 mr-1">
                  <Filter size={14} color="#94a3b8" />
                  <Text
                    className="text-white text-xs font-bold ml-1.5"
                    numberOfLines={1}
                  >
                    {statusFilter === "All" ? "All Statuses" : statusFilter}
                  </Text>
                </View>
                <ChevronDown size={14} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* ================= RESULT COUNT ================= */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedOrders.length} of {filteredOrders.length} food orders
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Order }) => {
          const statusStyle = getStatusStyle(item.status);
          const items = Array.isArray(item.items) ? item.items : [];
          const chefGroups = getChefGroups(items);
          const customerName =
            item.customer_name ||
            item.ordered_by_name ||
            item.name ||
            item.user_name ||
            "Customer";
          const customerPhone =
            item.customer_phone ||
            item.ordered_by_phone ||
            item.phone ||
            item.user_phone;
          const address = [item.street_address, item.city, item.district]
            .filter(Boolean)
            .join(", ");
          const canCancel = !ADMIN_BLOCKED_CANCEL.includes(
            String(item.status || "").toLowerCase()
          );

          return (
            <View className="mx-4 mb-3 bg-slate-900 border border-white/10 rounded-2xl p-4">
              {/* ================= TOP INFO ================= */}
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/20 items-center justify-center">
                  <ShoppingBag size={22} color="#34d399" />
                </View>

                <View className="flex-1 ml-3">
                  <Text
                    className="text-white text-base font-black"
                    numberOfLines={1}
                  >
                    {item.order_id || `#${item.id}`}
                  </Text>
                  <Text
                    className="text-slate-400 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {formatDate(item.ordered_at || item.created_at)}
                  </Text>
                </View>

                <View
                  className={`px-2.5 py-1 rounded-lg border ${statusStyle.bg} ${statusStyle.border}`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase ${statusStyle.text}`}
                  >
                    {item.status || "Pending"}
                  </Text>
                </View>
              </View>

              {/* ================= CUSTOMER DETAILS ================= */}
              <View className="mt-3.5 flex-row items-center">
                <View className="flex-row items-center flex-1">
                  <User size={13} color="#64748b" />
                  <Text
                    className="text-slate-300 text-xs ml-1.5"
                    numberOfLines={1}
                  >
                    {customerName}
                  </Text>
                </View>

                {customerPhone ? (
                  <View className="flex-row items-center flex-1 ml-2">
                    <Phone size={13} color="#64748b" />
                    <Text
                      className="text-slate-400 text-xs ml-1.5 flex-1"
                      numberOfLines={1}
                    >
                      {customerPhone}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Address preview */}
              {address ? (
                <View className="flex-row items-center mt-2">
                  <MapPin size={13} color="#64748b" />
                  <Text
                    className="text-slate-400 text-xs ml-1.5 flex-1"
                    numberOfLines={1}
                  >
                    {address}
                  </Text>
                </View>
              ) : null}

              {/* Chef / Items Summary Badge */}
              {chefGroups.length > 0 && (
                <View className="mt-3 bg-slate-950/80 border border-white/5 rounded-xl px-3 py-2">
                  <Text
                    className="text-slate-300 text-xs font-semibold"
                    numberOfLines={1}
                  >
                    👨‍🍳 {chefGroups.map((g: any) => g.name).join(", ")}
                  </Text>
                  <Text className="text-slate-500 text-[11px] mt-0.5">
                    {items.length} items • Qty{" "}
                    {chefGroups.reduce(
                      (acc: number, g: any) => acc + g.total_quantity,
                      0
                    )}
                  </Text>
                </View>
              )}

              {/* ================= BOTTOM ROW / ACTIONS ================= */}
              <View className="flex-row items-center justify-between mt-3.5 pt-3 border-t border-white/10 gap-2">
                {/* Total Price */}
                <View className="flex-1">
                  <Text className="text-emerald-400 text-base font-black">
                    {formatAmount(item.total_amount)}
                  </Text>
                  <Text className="text-slate-500 text-[10px] uppercase font-bold">
                    {item.payment_method || "Payment"} •{" "}
                    {item.payment_status || "Pending"}
                  </Text>
                </View>

                {/* View Details Button */}
                <TouchableOpacity
                  onPress={() => openOrderDetails(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for order ${item.order_id}`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Eye size={15} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Receipt Button */}
                <TouchableOpacity
                  onPress={() => openReceipt(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Receipt for order ${item.order_id}`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <FileText size={15} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Cancel Button */}
                {canCancel && (
                  <TouchableOpacity
                    onPress={() => {
                      setCancelTargetOrder(item);
                      setCancelReason("");
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Cancel order ${item.order_id}`}
                    className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center"
                  >
                    <XCircle size={16} color="#f87171" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <ShoppingBag size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs">
              No food orders match your criteria.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredOrders.length > 0 ? (
            <View className="flex-row justify-center items-center mt-2 px-4">
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl items-center justify-center"
                style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={18} color="#ffffff" />
              </TouchableOpacity>

              <Text className="text-slate-300 text-xs font-bold mx-5">
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl items-center justify-center"
                style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* ================================================= */}
      {/* STATUS FILTER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={showStatusDropdown}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowStatusDropdown(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">
                  Filter by status
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Choose an order status
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStatusDropdown(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {STATUS_OPTIONS.map((status) => {
              const active = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                    setShowStatusDropdown(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                    active
                      ? "bg-emerald-500/15 border-emerald-500/40"
                      : "bg-slate-950 border-white/5"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      active ? "text-emerald-300" : "text-slate-300"
                    }`}
                  >
                    {status === "All" ? "All statuses" : status}
                  </Text>
                  {active ? <CheckCircle size={17} color="#34d399" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CHEF FILTER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={showChefDropdown}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowChefDropdown(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[75%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">
                  Filter by Chef
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Choose a home chef to display orders
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowChefDropdown(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setChefFilter("All");
                  setCurrentPage(1);
                  setShowChefDropdown(false);
                }}
                className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                  chefFilter === "All"
                    ? "bg-emerald-500/15 border-emerald-500/40"
                    : "bg-slate-950 border-white/5"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    chefFilter === "All"
                      ? "text-emerald-300"
                      : "text-slate-300"
                  }`}
                >
                  All Chefs
                </Text>
                {chefFilter === "All" ? (
                  <CheckCircle size={17} color="#34d399" />
                ) : null}
              </TouchableOpacity>

              {chefs.map((chef) => {
                const id = String(chef.chef_id ?? chef.id);
                const active = chefFilter === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => {
                      setChefFilter(id);
                      setCurrentPage(1);
                      setShowChefDropdown(false);
                    }}
                    className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                      active
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-950 border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        active ? "text-emerald-300" : "text-slate-300"
                      }`}
                    >
                      {chef.name || chef.kitchen_name || "Unnamed Chef"}
                    </Text>
                    {active ? (
                      <CheckCircle size={17} color="#34d399" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* ORDER DETAILS MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex-col"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            {/* Modal Header */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="text-white text-xl font-black"
                  numberOfLines={1}
                >
                  {selectedOrder?.order_id || `#${selectedOrder?.id}`}
                </Text>
                <Text className="text-emerald-200 text-sm font-bold uppercase tracking-wider mt-1">
                  Food Order Overview
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedOrder(null)}
                className="w-9 h-9 bg-black/20 rounded-full items-center justify-center"
              >
                <X size={21} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView
              className="p-5"
              showsVerticalScrollIndicator={false}
            >
              {/* Order Status & Total Card */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Current Status
                    </Text>
                    <View className="mt-1 self-start">
                      {(() => {
                        const st = getStatusStyle(selectedOrder?.status);
                        return (
                          <View
                            className={`px-3 py-1.5 rounded-lg border ${st.bg} ${st.border}`}
                          >
                            <Text
                              className={`text-xs font-black uppercase ${st.text}`}
                            >
                              {selectedOrder?.status || "Pending"}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Total Amount
                    </Text>
                    <Text className="text-emerald-400 text-2xl font-black mt-0.5">
                      {formatAmount(selectedOrder?.total_amount)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Update Quick Buttons */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  ⚡ Update Status
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {STATUS_OPTIONS.filter((s) => s !== "All").map((st) => {
                    const active = modalStatus === st;
                    const style = getStatusStyle(st);
                    return (
                      <TouchableOpacity
                        key={st}
                        onPress={() => setModalStatus(st)}
                        className={`px-3 py-2 rounded-xl border ${
                          active
                            ? `${style.bg} ${style.border}`
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-black uppercase ${
                            active ? style.text : "text-slate-400"
                          }`}
                        >
                          {st}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {modalStatus !== selectedOrder?.status && (
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedOrder) {
                        handleUpdateStatus(selectedOrder.id, modalStatus);
                      }
                    }}
                    disabled={actionLoading}
                    className="mt-3 bg-emerald-600 rounded-xl py-2.5 items-center"
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text className="text-white font-black text-xs uppercase tracking-wider">
                        Save Status: {modalStatus}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Customer Information */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  👤 Customer Information
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Name
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedOrder?.customer_name ||
                        selectedOrder?.ordered_by_name ||
                        selectedOrder?.name ||
                        "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Phone
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedOrder?.customer_phone ||
                        selectedOrder?.ordered_by_phone ||
                        selectedOrder?.phone ||
                        "—"}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Email
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedOrder?.customer_email ||
                        selectedOrder?.ordered_by_email ||
                        selectedOrder?.email ||
                        "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Delivery & Order Details */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  📍 Delivery & Timing
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Ordered At
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-1">
                      {formatDate(
                        selectedOrder?.ordered_at || selectedOrder?.created_at
                      )}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Delivery Slot
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-1">
                      {selectedOrder?.delivery_date || "Standard Delivery"}
                      {selectedOrder?.delivery_time
                        ? ` • ${selectedOrder.delivery_time}`
                        : ""}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Delivery Address
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {[
                        selectedOrder?.street_address,
                        selectedOrder?.city,
                        selectedOrder?.district,
                        selectedOrder?.state,
                        selectedOrder?.zip_code || selectedOrder?.pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "No address specified"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Payment Method
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedOrder?.payment_method || "Online"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Payment Status
                    </Text>
                    <Text className="text-emerald-400 text-sm font-bold mt-1">
                      {selectedOrder?.payment_status || "Pending"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Ordered Items Breakdown */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  🍲 Ordered Items (
                  {Array.isArray(selectedOrder?.items)
                    ? selectedOrder.items.length
                    : 0}
                  )
                </Text>

                {Array.isArray(selectedOrder?.items) &&
                  selectedOrder.items.map((it: OrderItem, idx: number) => {
                    const price = getItemUnitPrice(it);
                    const total = getItemTotal(it);
                    const chefName =
                      it.chef_name || it.chef || it.created_by_name;

                    return (
                      <View
                        key={idx}
                        className="py-3 border-b border-slate-800 last:border-b-0 flex-row items-center justify-between"
                      >
                        <View className="flex-1 pr-3">
                          <Text className="text-white text-sm font-bold">
                            {it.name || it.food_name || it.item_name || "Food Item"}
                          </Text>
                          <Text className="text-slate-400 text-xs mt-0.5">
                            Qty: {it.quantity || 1} • {formatAmount(price)} each
                          </Text>
                          {chefName ? (
                            <Text className="text-emerald-400 text-[11px] font-bold mt-0.5">
                              👨‍🍳 Chef: {chefName}
                            </Text>
                          ) : null}
                        </View>

                        <Text className="text-emerald-400 font-black text-sm">
                          {formatAmount(total)}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View className="p-4 border-t border-slate-800 bg-slate-950 flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  const target = selectedOrder;
                  setSelectedOrder(null);
                  if (target) openReceipt(target);
                }}
                className="px-4 bg-slate-800 py-3 rounded-2xl items-center flex-row"
              >
                <FileText size={17} color="#cbd5e1" />
                <Text className="text-slate-300 font-bold text-sm uppercase ml-1.5">
                  Receipt
                </Text>
              </TouchableOpacity>

              {!ADMIN_BLOCKED_CANCEL.includes(
                String(selectedOrder?.status || "").toLowerCase()
              ) && (
                <TouchableOpacity
                  onPress={() => {
                    const target = selectedOrder;
                    setSelectedOrder(null);
                    setCancelTargetOrder(target);
                    setCancelReason("");
                  }}
                  className="flex-1 bg-red-600 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    Cancel Order
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setSelectedOrder(null)}
                className="px-5 bg-slate-800 py-3 rounded-2xl items-center"
              >
                <Text className="text-slate-300 font-bold text-sm uppercase">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!cancelTargetOrder}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setCancelTargetOrder(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="w-12 h-12 rounded-2xl bg-red-500/15 items-center justify-center mb-4">
              <XCircle size={24} color="#f87171" />
            </View>

            <Text className="text-white text-lg font-black">
              Cancel Order {cancelTargetOrder?.order_id || `#${cancelTargetOrder?.id}`}?
            </Text>

            <Text className="text-slate-400 text-sm mt-2 leading-5">
              Are you sure you want to cancel this order? This will mark the order as Cancelled and notify the customer.
            </Text>

            <View className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-3 mt-4">
              <TextInput
                value={cancelReason}
                onChangeText={setCancelReason}
                placeholder="Reason for cancellation (optional)..."
                placeholderTextColor="#64748b"
                className="text-white text-xs"
              />
            </View>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setCancelTargetOrder(null)}
                disabled={actionLoading}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Keep Order
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelOrder}
                disabled={actionLoading}
                className="flex-1 bg-red-600 rounded-2xl py-3.5 items-center"
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase">
                    Confirm Cancel
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* OFFICIAL RECEIPT POPUP MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!receiptOrder}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setReceiptOrder(null)}
      >
        <View className="flex-1 bg-black/80 justify-center p-4">
          <View
            className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-h-[90%]"
          >
            {/* Top Accent bar */}
            <View className="h-1.5 bg-emerald-500 w-full" />

            {/* Receipt Header */}
            <View className="p-5 bg-slate-950 flex-row items-center justify-between border-b border-slate-800">
              <View>
                <Text className="text-white text-lg font-black">
                  Official Receipt
                </Text>
                <Text className="text-emerald-400 text-xs font-bold uppercase mt-0.5">
                  Veetu Rusi
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setReceiptOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Receipt Body */}
            <ScrollView
              className="p-5"
              showsVerticalScrollIndicator={false}
            >
              {/* Invoice & Date info */}
              <View className="flex-row justify-between pb-4 border-b border-slate-800">
                <View>
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Invoice No.
                  </Text>
                  <Text className="text-white font-mono text-xs font-bold mt-1">
                    {receiptOrder?.order_id || `#${receiptOrder?.id}`}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Date & Time
                  </Text>
                  <Text className="text-slate-300 text-xs font-medium mt-1">
                    {formatDate(receiptOrder?.ordered_at || receiptOrder?.created_at)}
                  </Text>
                </View>
              </View>

              {/* Items Table */}
              <View className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                <View className="flex-row bg-slate-900 px-4 py-2.5 border-b border-slate-800">
                  <Text className="flex-1 text-slate-400 text-[10px] font-bold uppercase">
                    Item
                  </Text>
                  <Text className="w-12 text-center text-slate-400 text-[10px] font-bold uppercase">
                    Qty
                  </Text>
                  <Text className="w-20 text-right text-slate-400 text-[10px] font-bold uppercase">
                    Total
                  </Text>
                </View>

                {Array.isArray(receiptOrder?.items) &&
                  receiptOrder.items.map((it: OrderItem, idx: number) => {
                    const total = getItemTotal(it);
                    return (
                      <View
                        key={idx}
                        className="flex-row px-4 py-3 border-b border-slate-800/60 last:border-b-0 items-center"
                      >
                        <Text
                          className="flex-1 text-slate-200 text-xs font-medium"
                          numberOfLines={1}
                        >
                          {it.name || it.food_name || "Food Item"}
                        </Text>
                        <Text className="w-12 text-center text-slate-400 text-xs">
                          {it.quantity || 1}
                        </Text>
                        <Text className="w-20 text-right text-emerald-400 font-mono text-xs font-bold">
                          {formatAmount(total)}
                        </Text>
                      </View>
                    );
                  })}
              </View>

              {/* Total Card */}
              <View className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex-row items-center justify-between">
                <Text className="text-emerald-400 font-bold uppercase text-xs tracking-wider">
                  Total Amount
                </Text>
                <Text className="text-emerald-400 font-black text-2xl font-mono">
                  {formatAmount(receiptOrder?.total_amount)}
                </Text>
              </View>

              {/* UPI QR if enabled */}
              {receiptSettings?.upi_id ? (
                <View className="mt-5 p-4 border border-dashed border-slate-800 rounded-2xl items-center">
                  <Text className="text-slate-400 text-xs font-bold mb-2">
                    Scan to Pay (UPI)
                  </Text>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        `upi://pay?pa=${receiptSettings.upi_id}&pn=VeetuRusi&am=${
                          receiptOrder?.total_amount || 0
                        }&tr=${receiptOrder?.order_id || ""}`
                      )}`,
                    }}
                    className="w-32 h-32 rounded-xl bg-white p-1"
                  />
                  <Text className="text-slate-500 text-[10px] mt-2">
                    UPI ID: {receiptSettings.upi_id}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Receipt Footer */}
            <View className="p-4 border-t border-slate-800 bg-slate-950">
              <TouchableOpacity
                onPress={() => setReceiptOrder(null)}
                className="bg-slate-800 py-3 rounded-2xl items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Close Receipt
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FoodOrders;
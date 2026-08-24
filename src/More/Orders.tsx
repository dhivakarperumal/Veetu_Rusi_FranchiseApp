import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Package,
  Search,
  Truck,
  X,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { get, put } from "../services/api";

type Order = {
  id: number | string;
  status?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  user_id?: string;
  total_amount?: number | string;
  payment_method?: string;
  created_at?: string;
};

const statuses = [
  "All",
  "Order Placed",
  "Packing",
  "Shipping",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const statusColors: Record<string, { background: string; text: string }> = {
  "Order Placed": { background: "#dbeafe", text: "#1d4ed8" },
  Packing: { background: "#ede9fe", text: "#6d28d9" },
  Shipping: { background: "#fef3c7", text: "#b45309" },
  "Out for Delivery": { background: "#cffafe", text: "#0e7490" },
  Delivered: { background: "#d1fae5", text: "#047857" },
  Cancelled: { background: "#ffe4e6", text: "#be123c" },
};

const orderFlow = [
  "Order Placed",
  "Packing",
  "Shipping",
  "Out for Delivery",
  "Delivered",
];

const Orders = () => {
  const navigation: any = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [modalStatus, setModalStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("");
  const [reason, setReason] = useState("");

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await get<Order[] | { data?: Order[] }>("/orders?status=All");
      const data = Array.isArray(response) ? response : response.data || [];
      setOrders(data);
    } catch (error) {
      console.log("Orders Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter(order => {
      const matchesStatus = activeStatus === "All" || order.status === activeStatus;
      const searchable = [
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        order.user_id,
        order.id?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && searchable.includes(query);
    });
  }, [activeStatus, orders, search]);

  const updateStatus = async (orderId: Order["id"], status: string, details?: Record<string, string>) => {
    try {
      setUpdating(true);
      await put(`/orders/${orderId}/status`, { status, ...details });
      setModalOrder(null);
      await fetchOrders();
    } catch (error: any) {
      console.log("Order Status Error:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = (order: Order, status: string) => {
    if (status === "Shipping" || status === "Cancelled") {
      setModalOrder(order);
      setModalStatus(status);
      setTracking("");
      setCourier("");
      setReason("");
      return;
    }
    updateStatus(order.id, status);
  };

  const submitModal = () => {
    if (modalStatus === "Shipping") {
      if (!tracking.trim() || !courier.trim()) return;
      updateStatus(modalOrder!.id, modalStatus, {
        tracking_number: tracking.trim(),
        courier_name: courier.trim(),
        shipped_at: new Date().toISOString(),
      });
    } else {
      if (!reason.trim()) return;
      updateStatus(modalOrder!.id, modalStatus, {
        cancellation_reason: reason.trim(),
        cancelled_at: new Date().toISOString(),
      });
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const color = statusColors[item.status || ""] || { background: "#f1f5f9", text: "#475569" };
    const currentIndex = orderFlow.indexOf(item.status || "");
    const options = currentIndex < 0
      ? [item.status || "New"]
      : orderFlow.slice(currentIndex).concat(currentIndex < 2 ? ["Cancelled"] : []);

    return (
      <View className="mb-3 rounded-3xl bg-white p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">#ORD-0{item.id}</Text>
            <Text className="mt-1 text-xs text-slate-400">
              {item.created_at ? new Date(item.created_at).toLocaleDateString("en-IN") : "Unknown date"}
            </Text>
          </View>
          <View style={{ backgroundColor: color.background }} className="rounded-lg px-3 py-2">
            <Text style={{ color: color.text }} className="text-[10px] font-bold">{item.status || "New"}</Text>
          </View>
        </View>

        <View className="mt-4 border-t border-slate-100 pt-3">
          <Text className="font-bold text-slate-800">{item.customer_name || "Guest"}</Text>
          <Text className="mt-1 text-xs text-slate-500">
            {item.customer_email || item.customer_phone || "No contact information"}
          </Text>
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-lg font-black text-slate-900">
              ₹{Number(item.total_amount || 0).toLocaleString("en-IN")}
            </Text>
            <Text className="text-xs font-semibold uppercase text-slate-400">{item.payment_method || "N/A"}</Text>
          </View>
        </View>

        {options.length > 1 && (
          <View className="mt-4 flex-row items-center border-t border-slate-100 pt-3">
            <Text className="mr-2 text-xs font-semibold text-slate-500">Update status</Text>
            <View className="flex-1 flex-row flex-wrap gap-2">
              {options.map(status => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleStatusChange(item, status)}
                  className="rounded-lg bg-slate-100 px-2.5 py-2"
                >
                  <Text className="text-[10px] font-bold text-slate-600">{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const pending = orders.filter(order => ["Order Placed", "Processing", "New"].includes(order.status || "")).length;
  const inTransit = orders.filter(order => ["Shipping", "Out for Delivery", "Shipped", "Packing"].includes(order.status || "")).length;
  const delivered = orders.filter(order => order.status === "Delivered").length;

  if (loading) {
    return <SafeAreaView className="flex-1 items-center justify-center bg-slate-100"><ActivityIndicator size="large" color="#059669" /></SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <FlatList
        data={filteredOrders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} />}
        ListHeaderComponent={
          <View>
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-bold text-slate-900">Orders</Text>
                <Text className="mt-1 text-sm text-slate-500">Manage the order pipeline</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.goBack()} className="rounded-xl bg-slate-200 p-3">
                <X size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <View className="mb-4 flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-slate-900 p-4"><Package size={20} color="#a5b4fc" /><Text className="mt-2 text-2xl font-black text-white">{orders.length}</Text><Text className="text-xs text-slate-300">Total orders</Text></View>
              <View className="flex-1 rounded-2xl bg-emerald-900 p-4"><Clock3 size={20} color="#6ee7b7" /><Text className="mt-2 text-2xl font-black text-white">{pending}</Text><Text className="text-xs text-emerald-200">Pending</Text></View>
            </View>
            <View className="mb-5 flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-amber-900 p-4"><Truck size={20} color="#fcd34d" /><Text className="mt-2 text-2xl font-black text-white">{inTransit}</Text><Text className="text-xs text-amber-200">In transit</Text></View>
              <View className="flex-1 rounded-2xl bg-blue-900 p-4"><CheckCircle2 size={20} color="#93c5fd" /><Text className="mt-2 text-2xl font-black text-white">{delivered}</Text><Text className="text-xs text-blue-200">Delivered</Text></View>
            </View>

            <View className="mb-4 flex-row items-center rounded-2xl bg-white px-4">
              <Search size={20} color="#94a3b8" />
              <TextInput value={search} onChangeText={setSearch} placeholder="Search orders or customers" className="ml-3 flex-1 py-4" />
            </View>
            <View className="mb-4 flex-row items-center">
              <ChevronDown size={17} color="#64748b" />
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={statuses}
                keyExtractor={status => status}
                renderItem={({ item: status }) => (
                  <TouchableOpacity onPress={() => setActiveStatus(status)} className={`ml-2 rounded-xl px-3 py-2 ${activeStatus === status ? "bg-slate-900" : "bg-white"}`}>
                    <Text className={`text-xs font-bold ${activeStatus === status ? "text-white" : "text-slate-600"}`}>{status}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        }
        ListEmptyComponent={<Text className="py-12 text-center text-sm text-slate-500">No orders found</Text>}
      />

      <Modal visible={!!modalOrder} transparent animationType="slide" onRequestClose={() => setModalOrder(null)}>
        <View className="flex-1 justify-end bg-slate-900/50">
          <View className="rounded-t-3xl bg-white p-6">
            <Text className="text-xl font-bold text-slate-900">{modalStatus} details</Text>
            <Text className="mt-1 text-sm text-slate-500">Order #ORD-0{modalOrder?.id}</Text>
            {modalStatus === "Shipping" ? (
              <>
                <TextInput value={tracking} onChangeText={setTracking} placeholder="Tracking / AWB number" className="mt-5 rounded-xl border border-slate-200 px-4 py-3" />
                <TextInput value={courier} onChangeText={setCourier} placeholder="Courier partner" className="mt-3 rounded-xl border border-slate-200 px-4 py-3" />
              </>
            ) : (
              <TextInput value={reason} onChangeText={setReason} placeholder="Cancellation reason" multiline className="mt-5 rounded-xl border border-slate-200 px-4 py-3" />
            )}
            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity onPress={() => setModalOrder(null)} className="flex-1 rounded-xl bg-slate-100 py-4"><Text className="text-center font-bold text-slate-600">Cancel</Text></TouchableOpacity>
              <TouchableOpacity disabled={updating} onPress={submitModal} className="flex-1 rounded-xl bg-emerald-600 py-4"><Text className="text-center font-bold text-white">{updating ? "Updating..." : "Confirm"}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Orders;
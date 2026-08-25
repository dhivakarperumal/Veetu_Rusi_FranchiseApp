import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock3,
  CreditCard,
  MapPin,
  Plus,
  Package,
  Search,
  Trash2,
  Truck,
  UserRound,
  X,
  ArrowRight,
  ShoppingBag,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { get, post, put } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import CenteredDialog from "../components/CenteredDialog";

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

const statusStyles: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  "Order Placed": {
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  Packing: {
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
    text: "text-purple-400",
  },
  Shipping: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
  "Out for Delivery": {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
  },
  Delivered: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
  },
  Cancelled: {
    bg: "bg-red-500/15",
    border: "border-red-500/30",
    text: "text-red-400",
  },
};

const orderFlow = [
  "Order Placed",
  "Packing",
  "Shipping",
  "Out for Delivery",
  "Delivered",
];

type Product = {
  id: number;
  name: string;
  product_code?: string;
  offer_price?: number | string;
  price?: number | string;
  category?: string;
};

type OrderItem = {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
};

type CreateOrderModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

const CreateOrderModal = ({
  visible,
  onClose,
  onCreated,
}: CreateOrderModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");
  const [paymentMethod, setPaymentMethod] = useState("Showroom");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!visible) return;
    const loadData = async () => {
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          get<any[]>("/franchise-products"),
          get<any[]>("/categories"),
        ]);
        if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
          setProducts(prodRes.value);
        }
        if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
          setCategories(catRes.value);
        }
      } catch (error) {
        console.log("Create Order Data Error:", error);
      }
    };
    loadData();
  }, [visible]);

  const reset = () => {
    setStep(1);
    setItems([]);
    setSelectedCategory("");
    setSelectedProduct(null);
    setProductSearch("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setStreetAddress("");
    setCity("");
    setDistrict("");
    setState("");
    setZipCode("");
    setCountry("India");
    setPaymentMethod("Showroom");
    setErrorMsg("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      (p.product_code || "").toLowerCase().includes(q);
    return matchesSearch && (!selectedCategory || p.category === selectedCategory);
  });

  const total = items.reduce((sum, item) => sum + item.total, 0);

  const addItem = (product: Product) => {
    const price = Number(product.offer_price || product.price || 0);
    const existing = items.findIndex((it) => it.product_id === product.id);
    if (existing >= 0) {
      const next = [...items];
      next[existing] = {
        ...next[existing],
        quantity: next[existing].quantity + 1,
        total: price * (next[existing].quantity + 1),
      };
      setItems(next);
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          name: product.name,
          price,
          quantity: 1,
          total: price,
        },
      ]);
    }
  };

  const createOrder = async () => {
    setErrorMsg("");
    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !streetAddress.trim() ||
      !city.trim() ||
      !state.trim() ||
      !zipCode.trim()
    ) {
      setErrorMsg("Please fill in all required customer details.");
      return;
    }
    try {
      setLoading(true);
      await post("/orders", {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        address: streetAddress.trim(),
        street_address: streetAddress.trim(),
        city: city.trim(),
        district: district.trim(),
        state: state.trim(),
        country: country.trim() || "India",
        zip_code: zipCode.trim(),
        payment_method: paymentMethod,
        items,
        total_amount: total,
        created_at: new Date().toISOString(),
      });
      await onCreated();
      close();
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-white/10 bg-slate-900 px-5 py-4">
          <View className="flex-row items-center">
            {step === 2 && (
              <TouchableOpacity onPress={() => setStep(1)} className="mr-3">
                <ChevronLeft size={22} color="#ffffff" />
              </TouchableOpacity>
            )}
            <View>
              <Text className="text-xl font-black text-white">
                Create New Order
              </Text>
              <Text className="text-xs text-slate-400">Step {step} of 2</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={close}
            className="rounded-xl bg-slate-800 p-2 border border-white/10"
          >
            <X size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {errorMsg ? (
            <View className="mb-4 bg-red-500/15 border border-red-500/30 rounded-2xl p-3.5">
              <Text className="text-red-400 text-xs font-bold">{errorMsg}</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <View>
              {/* Category Filter */}
              <View className="mb-4 rounded-3xl bg-slate-900 border border-white/10 p-4">
                <Text className="mb-2 text-xs font-black uppercase text-slate-400">
                  Select Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory("")}
                    className={`mr-2 rounded-xl px-3.5 py-2 ${
                      !selectedCategory
                        ? "bg-emerald-600"
                        : "bg-slate-950 border border-slate-800"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        !selectedCategory ? "text-white" : "text-slate-400"
                      }`}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCategory(c.name)}
                      className={`mr-2 rounded-xl px-3.5 py-2 ${
                        selectedCategory === c.name
                          ? "bg-emerald-600"
                          : "bg-slate-950 border border-slate-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selectedCategory === c.name
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Product Search */}
              <View className="mb-4 flex-row items-center rounded-2xl bg-slate-900 border border-white/10 px-4 py-3">
                <Search size={18} color="#64748b" />
                <TextInput
                  value={productSearch}
                  onChangeText={setProductSearch}
                  placeholder="Search catalog products..."
                  placeholderTextColor="#64748b"
                  className="ml-3 flex-1 text-white text-xs font-semibold"
                />
              </View>

              {/* Products List */}
              <Text className="mb-2 text-xs font-black uppercase text-slate-400">
                Tap to add products
              </Text>
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => addItem(product)}
                  className="mb-2.5 rounded-2xl bg-slate-900 border border-white/10 p-3.5 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="font-black text-white text-sm">
                      {product.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-slate-400">
                      ₹{Number(product.offer_price || product.price || 0)}
                    </Text>
                  </View>
                  <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center">
                    <Plus size={16} color="#34d399" />
                  </View>
                </TouchableOpacity>
              ))}

              {/* Cart Items */}
              <Text className="mb-2 mt-4 text-xs font-black uppercase text-slate-400">
                Order Cart ({items.length} items)
              </Text>
              {items.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-6 items-center">
                  <ShoppingBag size={28} color="#475569" />
                  <Text className="mt-2 text-center text-xs text-slate-500">
                    No items selected yet. Tap products above to add.
                  </Text>
                </View>
              ) : (
                items.map((item, index) => (
                  <View
                    key={item.product_id}
                    className="mb-2 flex-row items-center rounded-2xl bg-slate-900 border border-white/10 p-3"
                  >
                    <View className="flex-1">
                      <Text className="font-bold text-white text-xs">
                        {item.name}
                      </Text>
                      <Text className="text-[10px] text-slate-400">
                        ₹{item.price} each • Total: ₹{item.total}
                      </Text>
                    </View>
                    <TextInput
                      keyboardType="number-pad"
                      value={String(item.quantity)}
                      onChangeText={(value) => {
                        const qty = Math.max(1, Number(value) || 1);
                        setItems(
                          items.map((curr, idx) =>
                            idx === index
                              ? { ...curr, quantity: qty, total: curr.price * qty }
                              : curr
                          )
                        );
                      }}
                      className="w-12 rounded-xl bg-slate-950 border border-slate-800 py-1 text-center text-white font-bold text-xs"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setItems(items.filter((_, idx) => idx !== index))
                      }
                      className="ml-3 p-1.5 rounded-lg bg-red-500/10"
                    >
                      <Trash2 size={15} color="#f87171" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          ) : (
            <View>
              {/* Customer Details Form */}
              <View className="mb-4 rounded-3xl bg-slate-900 border border-white/10 p-5">
                <Text className="mb-4 text-base font-black text-white uppercase">
                  Customer & Delivery Details
                </Text>
                <TextInput
                  placeholder="Customer name *"
                  placeholderTextColor="#64748b"
                  value={customerName}
                  onChangeText={setCustomerName}
                  className="mb-3 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                />
                <TextInput
                  placeholder="Phone number *"
                  placeholderTextColor="#64748b"
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  keyboardType="phone-pad"
                  className="mb-3 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                />
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor="#64748b"
                  value={customerEmail}
                  onChangeText={setCustomerEmail}
                  keyboardType="email-address"
                  className="mb-3 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                />
                <TextInput
                  placeholder="Street address *"
                  placeholderTextColor="#64748b"
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  className="mb-3 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                />
                <View className="flex-row gap-2 mb-3">
                  <TextInput
                    placeholder="City *"
                    placeholderTextColor="#64748b"
                    value={city}
                    onChangeText={setCity}
                    className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                  />
                  <TextInput
                    placeholder="State *"
                    placeholderTextColor="#64748b"
                    value={state}
                    onChangeText={setState}
                    className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                  />
                </View>
                <TextInput
                  placeholder="Zip code *"
                  placeholderTextColor="#64748b"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="number-pad"
                  className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                />
              </View>

              {/* Payment Method */}
              <View className="mb-4 rounded-3xl bg-slate-900 border border-white/10 p-5">
                <Text className="mb-3 text-base font-black text-white uppercase">
                  Payment Method
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setPaymentMethod("Showroom")}
                    className={`flex-1 items-center rounded-2xl border p-4 ${
                      paymentMethod === "Showroom"
                        ? "border-emerald-500 bg-emerald-500/15"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <Truck
                      size={22}
                      color={paymentMethod === "Showroom" ? "#34d399" : "#64748b"}
                    />
                    <Text className="mt-2 text-xs font-bold text-white">
                      Showroom / Local
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPaymentMethod("Online")}
                    className={`flex-1 items-center rounded-2xl border p-4 ${
                      paymentMethod === "Online"
                        ? "border-emerald-500 bg-emerald-500/15"
                        : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <CreditCard
                      size={22}
                      color={paymentMethod === "Online" ? "#34d399" : "#64748b"}
                    />
                    <Text className="mt-2 text-xs font-bold text-white">
                      Online Payment
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View className="border-t border-white/10 bg-slate-900 p-4">
          <View className="mb-3 flex-row justify-between items-center">
            <Text className="font-bold text-slate-400">
              {items.length} Item(s)
            </Text>
            <Text className="text-xl font-black text-emerald-400">
              ₹{total.toLocaleString("en-IN")}
            </Text>
          </View>
          <TouchableOpacity
            disabled={loading}
            onPress={() =>
              step === 1
                ? items.length
                  ? setStep(2)
                  : setErrorMsg("Add at least one product to continue.")
                : createOrder()
            }
            className="flex-row items-center justify-center rounded-2xl bg-emerald-600 py-4"
          >
            <Text className="mr-2 font-black text-white text-xs uppercase tracking-wider">
              {loading
                ? "Creating..."
                : step === 1
                ? "Next: Customer Details"
                : "Confirm & Create Order"}
            </Text>
            {step === 1 && <ArrowRight size={16} color="white" />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Orders = () => {
  const navigation: any = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Status Change Modal
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [modalStatus, setModalStatus] = useState("");
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("");
  const [reason, setReason] = useState("");
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await get<any>("/orders?status=All");
      const data = Array.isArray(response) ? response : response?.data || [];
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
    return orders.filter((order) => {
      const matchesStatus =
        activeStatus === "All" || order.status === activeStatus;
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

  const updateStatus = async (
    orderId: Order["id"],
    status: string,
    details?: Record<string, string>
  ) => {
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

  const pending = orders.filter((order) =>
    ["Order Placed", "Processing", "New"].includes(order.status || "")
  ).length;
  const inTransit = orders.filter((order) =>
    ["Shipping", "Out for Delivery", "Shipped", "Packing"].includes(
      order.status || ""
    )
  ).length;
  const delivered = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Orders Pipeline" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Orders Pipeline...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Orders Pipeline" navigation={navigation} />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrders(true)}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Header Title */}
            <View className="mb-5 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-3xl font-black text-white">Orders</Text>
                <Text className="mt-1 text-xs text-slate-400">
                  Track and fulfill customer delivery pipeline
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setCreateModalVisible(true)}
                className="flex-row items-center rounded-2xl bg-emerald-600 px-4 py-3 shadow-lg"
              >
                <Plus size={16} color="#fff" />
                <Text className="ml-1.5 text-xs font-black uppercase text-white">
                  Add Order
                </Text>
              </TouchableOpacity>
            </View>

            {/* Summary Stat Cards */}
            <View className="mb-4 flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-slate-900 border border-indigo-400/25 p-3.5">
                <Package size={16} color="#a5b4fc" />
                <Text className="mt-2 text-2xl font-black text-white">
                  {orders.length}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-indigo-200/70">
                  Total Orders
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-slate-900 border border-emerald-400/25 p-3.5">
                <Clock3 size={16} color="#6ee7b7" />
                <Text className="mt-2 text-2xl font-black text-white">
                  {pending}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-emerald-200/70">
                  Pending
                </Text>
              </View>
            </View>

            <View className="mb-5 flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-slate-900 border border-amber-400/25 p-3.5">
                <Truck size={16} color="#fcd34d" />
                <Text className="mt-2 text-2xl font-black text-white">
                  {inTransit}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-amber-200/70">
                  In Transit
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-slate-900 border border-blue-400/25 p-3.5">
                <CheckCircle2 size={16} color="#93c5fd" />
                <Text className="mt-2 text-2xl font-black text-white">
                  {delivered}
                </Text>
                <Text className="text-[10px] uppercase font-bold text-blue-200/70">
                  Delivered
                </Text>
              </View>
            </View>

            {/* Search Input */}
            <View className="mb-4 flex-row items-center rounded-2xl bg-slate-900 border border-white/10 px-4 py-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search orders by customer or ID..."
                placeholderTextColor="#64748b"
                className="ml-3 flex-1 text-white text-xs font-semibold"
              />
            </View>

            {/* Horizontal Status Filter Chips */}
            <View className="mb-4 flex-row items-center">
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={statuses}
                keyExtractor={(status) => status}
                renderItem={({ item: status }) => {
                  const isSel = activeStatus === status;
                  return (
                    <TouchableOpacity
                      onPress={() => setActiveStatus(status)}
                      className={`mr-2 rounded-xl px-3.5 py-2 border ${
                        isSel
                          ? "bg-emerald-500/20 border-emerald-500/40"
                          : "bg-slate-900 border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSel ? "text-emerald-300" : "text-slate-400"
                        }`}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        }
        renderItem={({ item }: { item: Order }) => {
          const style =
            statusStyles[item.status || ""] || {
              bg: "bg-slate-800",
              border: "border-slate-700",
              text: "text-slate-300",
            };
          const currentIndex = orderFlow.indexOf(item.status || "");
          const options =
            currentIndex < 0
              ? [item.status || "New"]
              : orderFlow
                  .slice(currentIndex)
                  .concat(currentIndex < 2 ? ["Cancelled"] : []);

          return (
            <View className="mb-3.5 rounded-3xl bg-slate-900 border border-white/10 p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-base font-black text-white">
                    #ORD-{item.id}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-400 font-mono">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("en-IN")
                      : "Recent Order"}
                  </Text>
                </View>

                {/* Status Pill */}
                <View
                  className={`rounded-xl px-3 py-1.5 border ${style.bg} ${style.border}`}
                >
                  <Text className={`text-[10px] font-black uppercase ${style.text}`}>
                    {item.status || "New"}
                  </Text>
                </View>
              </View>

              {/* Customer and Total */}
              <View className="mt-3.5 border-t border-white/10 pt-3">
                <Text className="font-bold text-white text-sm">
                  {item.customer_name || "Guest Customer"}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-400">
                  {item.customer_email || item.customer_phone || "Direct Delivery"}
                </Text>

                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-lg font-black text-emerald-400">
                    ₹{Number(item.total_amount || 0).toLocaleString("en-IN")}
                  </Text>
                  <Text className="text-[10px] font-bold uppercase text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {item.payment_method || "Showroom"}
                  </Text>
                </View>
              </View>

              {/* Fast Status Transitions */}
              {options.length > 1 && (
                <View className="mt-3.5 flex-row items-center border-t border-white/10 pt-3">
                  <Text className="mr-2 text-[10px] font-bold uppercase text-slate-500">
                    Advance:
                  </Text>
                  <View className="flex-1 flex-row flex-wrap gap-1.5">
                    {options.map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() => handleStatusChange(item, status)}
                        className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1"
                      >
                        <Text className="text-[10px] font-bold text-slate-300">
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Package size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              No orders found matching the filter.
            </Text>
          </View>
        }
      />

      {/* Advanced Transition Modal (Courier or Reason) */}
      <Modal
        visible={!!modalOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOrder(null)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="rounded-t-3xl bg-slate-900 border-t border-white/10 p-6">
            <Text className="text-xl font-black text-white">
              {modalStatus} Details
            </Text>
            <Text className="mt-1 text-xs text-slate-400">
              Order #ORD-{modalOrder?.id}
            </Text>

            {modalStatus === "Shipping" ? (
              <>
                <TextInput
                  value={tracking}
                  onChangeText={setTracking}
                  placeholder="Tracking / AWB number *"
                  placeholderTextColor="#64748b"
                  className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                />
                <TextInput
                  value={courier}
                  onChangeText={setCourier}
                  placeholder="Courier partner name *"
                  placeholderTextColor="#64748b"
                  className="mt-3 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
                />
              </>
            ) : (
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Cancellation reason *"
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 px-4 py-3 text-white text-xs font-semibold"
              />
            )}

            <View className="mt-5 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalOrder(null)}
                className="flex-1 rounded-2xl bg-slate-800 border border-white/10 py-3.5 items-center"
              >
                <Text className="font-bold text-xs uppercase text-slate-300">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={updating}
                onPress={submitModal}
                className="flex-1 rounded-2xl bg-emerald-600 py-3.5 items-center"
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="font-black text-xs uppercase tracking-wider text-white">
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CreateOrderModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={() => fetchOrders(true)}
      />
    </View>
  );
};

export default Orders;
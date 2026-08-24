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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CheckCircle2,
  ChevronLeft,
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
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { get, post, put } from "../services/api";

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

type Product = {
  id: number;
  name: string;
  product_code?: string;
  offer_price?: number | string;
  price?: number | string;
  category?: string;
  variants?: ProductVariant[];
};

type ProductVariant = {
  color?: string;
  colorName?: string;
  images?: string[];
  sizesStock?: Record<string, number | string>;
};

type OrderItem = {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  variant_color: string;
  variant_size: string;
};

type CreateOrderModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

const CreateOrderModal = ({ visible, onClose, onCreated }: CreateOrderModalProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
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

  useEffect(() => {
    if (!visible) return;
    const loadProducts = async () => {
      try {
        const [productResponse, categoryResponse] = await Promise.all([
          get<Product[] | { data?: Product[] }>("/products"),
          get<Array<{ id: number; name: string }> | { data?: Array<{ id: number; name: string }> }>("/categories"),
        ]);
        setProducts(Array.isArray(productResponse) ? productResponse : productResponse.data || []);
        setCategories(Array.isArray(categoryResponse) ? categoryResponse : categoryResponse.data || []);
      } catch (error) {
        console.log("Create Order Data Error:", error);
      }
    };
    loadProducts();
  }, [visible]);

  const reset = () => {
    setStep(1);
    setItems([]);
    setSelectedCategory("");
    setSelectedProduct(null);
    setSelectedVariant(null);
    setSelectedSize("");
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
  };

  const close = () => {
    reset();
    onClose();
  };

  const filteredProducts = products.filter(product => {
    const query = productSearch.toLowerCase();
    const matchesSearch = product.name.toLowerCase().includes(query) || product.product_code?.toLowerCase().includes(query);
    return matchesSearch && (!selectedCategory || product.category === selectedCategory);
  });

  const total = items.reduce((sum, item) => sum + item.total, 0);

  const addItem = () => {
    if (!selectedProduct) return;
    const color = selectedVariant?.colorName || selectedVariant?.color || "Standard";
    if (selectedProduct.variants?.length && (!selectedVariant || !selectedSize)) {
      Alert.alert("Choose variant", "Select a color and size before adding the product.");
      return;
    }
    const price = Number(selectedProduct.offer_price || selectedProduct.price || 0);
    const existing = items.findIndex(item => item.product_id === selectedProduct.id && item.variant_color === color && item.variant_size === selectedSize);
    if (existing >= 0) {
      const next = [...items];
      next[existing] = { ...next[existing], quantity: next[existing].quantity + 1, total: price * (next[existing].quantity + 1) };
      setItems(next);
    } else {
      setItems([...items, { product_id: selectedProduct.id, name: selectedProduct.name, price, quantity: 1, total: price, variant_color: color, variant_size: selectedSize || "Standard" }]);
    }
    setSelectedProduct(null);
    setSelectedVariant(null);
    setSelectedSize("");
  };

  const createOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !streetAddress.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      Alert.alert("Required details", "Fill in name, phone, street, city, state, and zip code.");
      return;
    }
    try {
      setLoading(true);
      await post("/orders", {
        user_id: "",
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
      Alert.alert("Success", "Order created successfully.");
      await onCreated();
      close();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView className="flex-1 bg-slate-100">
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-4">
          <View className="flex-row items-center">
            {step === 2 && <TouchableOpacity onPress={() => setStep(1)} className="mr-3"><ChevronLeft size={24} color="#0f172a" /></TouchableOpacity>}
            <View><Text className="text-xl font-bold text-slate-900">Create New Order</Text><Text className="text-xs text-slate-500">Step {step} of 2</Text></View>
          </View>
          <TouchableOpacity onPress={close} className="rounded-xl bg-slate-100 p-2"><X size={20} color="#475569" /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <View>
              <View className="mb-4 rounded-3xl bg-white p-4">
                <Text className="mb-2 font-bold text-slate-800">Select category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity onPress={() => setSelectedCategory("")} className={`mr-2 rounded-xl px-3 py-2 ${!selectedCategory ? "bg-slate-900" : "bg-slate-100"}`}><Text className={!selectedCategory ? "text-white" : "text-slate-600"}>All</Text></TouchableOpacity>
                  {categories.map(category => <TouchableOpacity key={category.id} onPress={() => setSelectedCategory(category.name)} className={`mr-2 rounded-xl px-3 py-2 ${selectedCategory === category.name ? "bg-slate-900" : "bg-slate-100"}`}><Text className={selectedCategory === category.name ? "text-white" : "text-slate-600"}>{category.name}</Text></TouchableOpacity>)}
                </ScrollView>
              </View>
              <View className="mb-4 flex-row items-center rounded-2xl bg-white px-4"><Search size={19} color="#94a3b8" /><TextInput value={productSearch} onChangeText={setProductSearch} placeholder="Search products" className="ml-3 flex-1 py-4" /></View>
              {filteredProducts.map(product => <TouchableOpacity key={product.id} onPress={() => { setSelectedProduct(product); setSelectedVariant(null); setSelectedSize(""); }} className={`mb-3 rounded-2xl bg-white p-4 ${selectedProduct?.id === product.id ? "border-2 border-emerald-500" : ""}`}><View className="flex-row items-center justify-between"><View><Text className="font-bold text-slate-900">{product.name}</Text><Text className="mt-1 text-xs text-slate-500">{product.product_code || "Product"}  |  ₹{Number(product.offer_price || product.price || 0).toLocaleString("en-IN")}</Text></View><Plus size={20} color="#059669" /></View></TouchableOpacity>)}
              {selectedProduct && <View className="mb-4 rounded-3xl border border-emerald-100 bg-emerald-50 p-4"><Text className="font-bold text-emerald-800">{selectedProduct.name}</Text>{selectedProduct.variants?.length ? <><Text className="mb-2 mt-4 text-xs font-bold uppercase text-slate-500">Color</Text><View className="flex-row flex-wrap gap-2">{selectedProduct.variants.map((variant, index) => <TouchableOpacity key={index} onPress={() => { setSelectedVariant(variant); setSelectedSize(""); }} className={`rounded-xl border px-3 py-2 ${selectedVariant === variant ? "border-emerald-600 bg-emerald-600" : "border-slate-200 bg-white"}`}><Text className={selectedVariant === variant ? "text-white" : "text-slate-700"}>{variant.colorName || variant.color || `Color ${index + 1}`}</Text></TouchableOpacity>)}</View>{selectedVariant && <><Text className="mb-2 mt-4 text-xs font-bold uppercase text-slate-500">Size</Text><View className="flex-row flex-wrap gap-2">{Object.entries(selectedVariant.sizesStock || {}).map(([size, stock]) => <TouchableOpacity key={size} disabled={Number(stock) <= 0} onPress={() => setSelectedSize(size)} className={`rounded-xl px-3 py-2 ${Number(stock) <= 0 ? "bg-slate-200" : selectedSize === size ? "bg-emerald-600" : "bg-white"}`}><Text className={selectedSize === size ? "text-white" : "text-slate-700"}>{size} ({stock})</Text></TouchableOpacity>)}</View></>}</> : null}<TouchableOpacity onPress={addItem} className="mt-4 rounded-xl bg-emerald-600 py-3"><Text className="text-center font-bold text-white">Add to order</Text></TouchableOpacity></View>}
              <Text className="mb-2 mt-2 text-sm font-bold text-slate-700">Order items</Text>
              {items.length === 0 ? <View className="rounded-2xl border-2 border-dashed border-slate-200 p-8"><Text className="text-center text-slate-400">Your cart is empty</Text></View> : items.map((item, index) => <View key={`${item.product_id}-${item.variant_size}`} className="mb-2 flex-row items-center rounded-2xl bg-white p-3"><View className="flex-1"><Text className="font-bold text-slate-800">{item.name}</Text><Text className="text-xs text-slate-500">{item.variant_color} / {item.variant_size}  |  ₹{item.price}</Text></View><TextInput keyboardType="number-pad" value={String(item.quantity)} onChangeText={value => { const quantity = Math.max(1, Number(value) || 1); setItems(items.map((current, itemIndex) => itemIndex === index ? { ...current, quantity, total: current.price * quantity } : current)); }} className="w-12 rounded-lg bg-slate-100 px-2 py-2 text-center" /><TouchableOpacity onPress={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))} className="ml-3"><Trash2 size={19} color="#e11d48" /></TouchableOpacity></View>)}
            </View>
          ) : (
            <View>
              <View className="mb-4 rounded-3xl bg-white p-4"><Text className="mb-4 text-lg font-bold text-slate-900">Customer details</Text><Field icon={<UserRound size={17} color="#64748b" />} placeholder="Customer name *" value={customerName} onChangeText={setCustomerName} /><Field placeholder="Phone number *" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" /><Field placeholder="Email address" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" /><View className="mt-1 flex-row items-center"><MapPin size={17} color="#64748b" /><Text className="ml-2 text-xs font-bold uppercase text-slate-500">Shipping address</Text></View><Field placeholder="Street address *" value={streetAddress} onChangeText={setStreetAddress} /><Field placeholder="City *" value={city} onChangeText={setCity} /><Field placeholder="District" value={district} onChangeText={setDistrict} /><View className="flex-row gap-2"><Field containerClass="flex-1" placeholder="State *" value={state} onChangeText={setState} /><Field containerClass="flex-1" placeholder="Zip code *" value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" /></View><Field placeholder="Country" value={country} onChangeText={setCountry} /></View>
              <View className="mb-4 rounded-3xl bg-white p-4"><Text className="mb-3 font-bold text-slate-900">Payment method</Text><View className="flex-row gap-2"><TouchableOpacity onPress={() => setPaymentMethod("Showroom")} className={`flex-1 items-center rounded-2xl border p-4 ${paymentMethod === "Showroom" ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}><Truck size={22} color={paymentMethod === "Showroom" ? "#059669" : "#94a3b8"} /><Text className="mt-2 text-xs font-bold">Showroom / Local</Text></TouchableOpacity><TouchableOpacity onPress={() => setPaymentMethod("Online")} className={`flex-1 items-center rounded-2xl border p-4 ${paymentMethod === "Online" ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}><CreditCard size={22} color={paymentMethod === "Online" ? "#059669" : "#94a3b8"} /><Text className="mt-2 text-xs font-bold">Online payment</Text></TouchableOpacity></View></View>
            </View>
          )}
        </ScrollView>
        <View className="border-t border-slate-200 bg-white p-4"><View className="mb-3 flex-row justify-between"><Text className="font-bold text-slate-500">{items.length} item(s)</Text><Text className="text-xl font-black text-slate-900">₹{total.toLocaleString("en-IN")}</Text></View><TouchableOpacity disabled={loading} onPress={() => step === 1 ? (items.length ? setStep(2) : Alert.alert("Add products", "Add at least one product to continue.")) : createOrder()} className="flex-row items-center justify-center rounded-2xl bg-emerald-600 py-4"><Text className="mr-2 font-bold text-white">{loading ? "Creating..." : step === 1 ? "Next: customer details" : "Create order"}</Text>{step === 1 && <ArrowRight size={18} color="white" />}</TouchableOpacity></View>
      </SafeAreaView>
    </Modal>
  );
};

const Field = ({ placeholder, value, onChangeText, keyboardType, icon, containerClass = "" }: { placeholder: string; value: string; onChangeText: (value: string) => void; keyboardType?: "default" | "phone-pad" | "email-address" | "number-pad"; icon?: React.ReactNode; containerClass?: string }) => (
  <View className={`mb-3 flex-row items-center rounded-xl border border-slate-200 px-3 ${containerClass}`}>
    {icon}
    <TextInput placeholder={placeholder} value={value} onChangeText={onChangeText} keyboardType={keyboardType} className="flex-1 px-2 py-3" />
  </View>
);

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
  const [createModalVisible, setCreateModalVisible] = useState(false);

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
              <View className="flex-row items-center">
                <TouchableOpacity onPress={() => setCreateModalVisible(true)} className="mr-2 flex-row items-center rounded-xl bg-emerald-600 px-3 py-3">
                  <Plus size={18} color="#fff" />
                  <Text className="ml-1 text-xs font-bold text-white">Add order</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()} className="rounded-xl bg-slate-200 p-3">
                  <X size={20} color="#475569" />
                </TouchableOpacity>
              </View>
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
      <CreateOrderModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={fetchOrders}
      />
    </SafeAreaView>
  );
};

export default Orders;
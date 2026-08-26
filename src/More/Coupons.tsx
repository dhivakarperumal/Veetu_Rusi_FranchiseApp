import React, { useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Tag,
  Search,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar,
  Percent,
  Clock,
  Layers,
  ShoppingBag,
  Users,
  Eye,
  X,
  Check,
  ChefHat,
  Package,
} from "lucide-react-native";

import { get, post, put, del } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";
import DatePickerModal from "../components/DatePickerModal";

interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number | string;
  min_order_value?: number | string;
  start_date: string;
  expiry_date: string;
  usage_limit_global?: number | string;
  usage_limit_per_customer?: number | string;
  usage_count?: number;
  status: "active" | "inactive";
  coupon_scope?: string;
  applicable_home_chef_ids?: any[];
  applicable_product_ids?: any[];
  applicable_category_ids?: any[];
}

const Coupons = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [chefs, setChefs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected Coupon for Details Modal
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    min_order_value: "0",
    start_date: "",
    expiry_date: "",
    usage_limit_global: "",
    usage_limit_per_customer: "1",
    status: "active" as "active" | "inactive",
    coupon_scope: "all",
    applicable_home_chef_ids: [] as number[],
    applicable_product_ids: [] as number[],
    applicable_category_ids: [] as number[],
  });

  // DatePicker State
  const [datePickerConfig, setDatePickerConfig] = useState<{
    visible: boolean;
    title: string;
    field: "start_date" | "expiry_date";
    initialDate: string;
  }>({
    visible: false,
    title: "",
    field: "start_date",
    initialDate: "",
  });

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<Coupon | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Feedback Dialog
  const [feedbackDialog, setFeedbackDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  // --------------------------------------------------
  // FETCH DATA
  // --------------------------------------------------
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res: any = await get("/coupons");
      const list = Array.isArray(res) ? res : res?.coupons || res?.data || [];
      setCoupons(list);
    } catch (error) {
      console.log("Error fetching coupons:", error);
      setCoupons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAuxOptions = async () => {
    try {
      const [chefRes, prodRes, catRes]: [any, any, any] = await Promise.all([
        get("/admin/homechefs").catch(() => []),
        get("/chef-foods").catch(() => get("/products").catch(() => [])),
        get("/home-chef-categories").catch(() => get("/categories").catch(() => [])),
      ]);

      const chefList = (Array.isArray(chefRes) ? chefRes : chefRes?.data || []).map((c: any) => ({
        id: c.id,
        name: c.name || c.store_name || `Chef #${c.id}`,
        phone: c.phone || c.mobile || "",
      }));
      setChefs(chefList);

      const prodList = (Array.isArray(prodRes) ? prodRes : prodRes?.data || []).map((p: any) => ({
        id: p.id,
        name: p.name || p.food_name || `Item #${p.id}`,
      }));
      setProducts(prodList);

      const catList = (Array.isArray(catRes) ? catRes : catRes?.data || []).map((c: any) => ({
        id: c.id,
        name: c.c_name || c.name || `Category #${c.id}`,
      }));
      setCategories(catList);
    } catch (err) {
      console.log("Aux options fetch error:", err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCoupons();
      fetchAuxOptions();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoupons();
  };

  // --------------------------------------------------
  // METRICS & FILTERING
  // --------------------------------------------------
  const totalCount = coupons.length;
  const activeCount = coupons.filter((c) => c.status === "active").length;
  const inactiveCount = coupons.filter((c) => c.status === "inactive").length;

  const filteredCoupons = useMemo(() => {
    let list = [...coupons];
    const q = searchTerm.trim().toLowerCase();

    if (q) {
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((c) => c.status === statusFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((c) => c.discount_type === typeFilter);
    }

    return list;
  }, [coupons, searchTerm, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCoupons.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // --------------------------------------------------
  // FORM & MODAL HANDLERS
  // --------------------------------------------------
  const handleOpenAdd = () => {
    setEditingCoupon(null);
    const today = new Date().toISOString().split("T")[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    setFormData({
      code: "",
      name: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_value: "0",
      start_date: today,
      expiry_date: nextMonth,
      usage_limit_global: "",
      usage_limit_per_customer: "1",
      status: "active",
      coupon_scope: "all",
      applicable_home_chef_ids: [],
      applicable_product_ids: [],
      applicable_category_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      name: coupon.name || "",
      description: coupon.description || "",
      discount_type: coupon.discount_type || "percentage",
      discount_value: String(coupon.discount_value || ""),
      min_order_value: String(coupon.min_order_value || "0"),
      start_date: coupon.start_date ? coupon.start_date.split("T")[0].split(" ")[0] : "",
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split("T")[0].split(" ")[0] : "",
      usage_limit_global: coupon.usage_limit_global ? String(coupon.usage_limit_global) : "",
      usage_limit_per_customer: coupon.usage_limit_per_customer
        ? String(coupon.usage_limit_per_customer)
        : "1",
      status: coupon.status || "active",
      coupon_scope: coupon.coupon_scope || "all",
      applicable_home_chef_ids: Array.isArray(coupon.applicable_home_chef_ids)
        ? coupon.applicable_home_chef_ids
        : [],
      applicable_product_ids: Array.isArray(coupon.applicable_product_ids)
        ? coupon.applicable_product_ids
        : [],
      applicable_category_ids: Array.isArray(coupon.applicable_category_ids)
        ? coupon.applicable_category_ids
        : [],
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!formData.code.trim()) {
      setFeedbackDialog({
        visible: true,
        title: "Missing Code",
        message: "Please enter a unique coupon code.",
      });
      return;
    }

    if (!formData.name.trim()) {
      setFeedbackDialog({
        visible: true,
        title: "Missing Name",
        message: "Please provide a coupon title/name.",
      });
      return;
    }

    if (!formData.discount_value || Number(formData.discount_value) <= 0) {
      setFeedbackDialog({
        visible: true,
        title: "Invalid Discount",
        message: "Please enter a valid discount amount or percentage.",
      });
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        ...formData,
        start_date: formData.start_date ? `${formData.start_date} 00:00:00` : "",
        expiry_date: formData.expiry_date ? `${formData.expiry_date} 23:59:59` : "",
      };

      if (editingCoupon) {
        await put(`/coupons/${editingCoupon.id}`, payload);
        setFeedbackDialog({
          visible: true,
          title: "Coupon Updated",
          message: `Coupon ${formData.code} has been successfully updated.`,
        });
      } else {
        await post("/coupons", payload);
        setFeedbackDialog({
          visible: true,
          title: "Coupon Created",
          message: `Coupon ${formData.code} is now live and active.`,
        });
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setFeedbackDialog({
        visible: true,
        title: "Operation Failed",
        message: err.message || "Failed to save coupon.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // --------------------------------------------------
  // DELETE COUPON
  // --------------------------------------------------
  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    setActionLoading(true);
    try {
      await del(`/coupons/${deleteConfirmation.id}`);
      setFeedbackDialog({
        visible: true,
        title: "Coupon Deleted",
        message: `Coupon ${deleteConfirmation.code} has been permanently deleted.`,
      });
      setDeleteConfirmation(null);
      fetchCoupons();
    } catch (err: any) {
      setDeleteConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Delete Failed",
        message: err.message || "Failed to delete coupon.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // RENDER LOADING
  // --------------------------------------------------
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Coupons & Discounts" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Coupons Dashboard...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Coupons & Discounts" navigation={navigation} />

      <FlatList
        data={paginatedCoupons}
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
          <View className="px-4 pt-6">
            {/* ================= HEADER ================= */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-1">
                <Text className="text-white text-3xl font-black">
                  Coupons
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Manage promotional codes, discounts and validity
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                <Tag size={20} color="#34d399" />
              </View>
            </View>

            {/* ================= SUMMARY STAT METRICS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* TOTAL */}
              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "all"
                    ? "border-blue-400"
                    : "border-blue-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-blue-500/15 items-center justify-center mb-2">
                  <Tag size={16} color="#60a5fa" />
                </View>
                <Text className="text-blue-200/70 text-[9px] font-bold uppercase">
                  Total
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {totalCount}
                </Text>
              </TouchableOpacity>

              {/* ACTIVE */}
              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("active");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "active"
                    ? "border-emerald-400"
                    : "border-emerald-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <CheckCircle size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  Active
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {activeCount}
                </Text>
              </TouchableOpacity>

              {/* INACTIVE */}
              <TouchableOpacity
                onPress={() => {
                  setStatusFilter("inactive");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "inactive"
                    ? "border-rose-400"
                    : "border-rose-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-rose-500/15 items-center justify-center mb-2">
                  <XCircle size={16} color="#fda4af" />
                </View>
                <Text className="text-rose-200/70 text-[9px] font-bold uppercase">
                  Inactive
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {inactiveCount}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search by coupon code, name or description..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs font-semibold"
              />
              {searchTerm ? (
                <TouchableOpacity onPress={() => setSearchTerm("")}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ================= TYPE FILTERS ================= */}
            <View className="flex-row gap-2 mb-4">
              {[
                { label: "All Types", value: "all" },
                { label: "Percentage (%)", value: "percentage" },
                { label: "Fixed Amount (₹)", value: "fixed" },
              ].map((t) => {
                const isSelected = typeFilter === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setTypeFilter(t.value)}
                    className={`px-3.5 py-2 rounded-xl border ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-900 border-white/10"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? "text-emerald-300" : "text-slate-400"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* RESULT COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedCoupons.length} of {filteredCoupons.length} coupons
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Coupon }) => {
          const isActive = item.status === "active";
          const isPercentage = item.discount_type === "percentage";
          const discountLabel = isPercentage
            ? `${item.discount_value}% OFF`
            : `₹${item.discount_value} OFF`;

          const expiryDateStr = item.expiry_date
            ? new Date(item.expiry_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "No Expiry";

          return (
            <View className="mx-4 mb-3.5 bg-slate-900 border border-white/10 rounded-3xl p-4">
              {/* Header: Code Badge, Title & Status */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl flex-row items-center mr-2.5">
                    <Tag size={13} color="#34d399" />
                    <Text className="text-emerald-300 font-mono font-black text-xs uppercase ml-1.5">
                      {item.code}
                    </Text>
                  </View>

                  <Text
                    className="text-white font-black text-sm flex-1"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>

                {/* Status Pill */}
                <View
                  className={`px-2.5 py-0.5 rounded-lg border ${
                    isActive
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-rose-500/15 border-rose-500/30"
                  }`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase ${
                      isActive ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              {/* Description */}
              {item.description ? (
                <Text
                  className="text-slate-400 text-xs leading-4 mb-3"
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}

              {/* Discount & Metrics Grid */}
              <View className="bg-slate-950 border border-slate-800 rounded-2xl p-3 mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-400 text-[10px] uppercase font-bold">
                    Benefit
                  </Text>
                  <Text className="text-emerald-400 text-base font-black mt-0.5">
                    {discountLabel}
                  </Text>
                </View>

                <View className="items-center">
                  <Text className="text-slate-400 text-[10px] uppercase font-bold">
                    Scope
                  </Text>
                  <Text className="text-slate-300 text-xs font-bold mt-0.5 capitalize">
                    {item.coupon_scope ? item.coupon_scope.replace(/_/g, " ") : "All"}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-slate-400 text-[10px] uppercase font-bold">
                    Valid Until
                  </Text>
                  <Text className="text-amber-400 text-xs font-mono font-bold mt-0.5">
                    {expiryDateStr}
                  </Text>
                </View>
              </View>

              {/* Usage & Min Order Strip */}
              <View className="flex-row items-center justify-between text-slate-400 text-xs mb-3 px-1">
                <Text className="text-slate-400 text-[11px]">
                  Min Order:{" "}
                  <Text className="text-white font-bold">
                    ₹{item.min_order_value || 0}
                  </Text>
                </Text>

                <Text className="text-slate-400 text-[11px]">
                  Usage:{" "}
                  <Text className="text-white font-bold">
                    {item.usage_count || 0}{" "}
                    {item.usage_limit_global
                      ? `/ ${item.usage_limit_global}`
                      : "redeemed"}
                  </Text>
                </Text>
              </View>

              {/* Action Toolbar */}
              <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                <View className="flex-row items-center gap-2">
                  {/* View Details */}
                  <TouchableOpacity
                    onPress={() => setSelectedCoupon(item)}
                    className="w-9 h-9 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                  >
                    <Eye size={15} color="#cbd5e1" />
                  </TouchableOpacity>

                  {/* Edit */}
                  <TouchableOpacity
                    onPress={() => handleOpenEdit(item)}
                    className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl items-center justify-center"
                  >
                    <Edit2 size={15} color="#60a5fa" />
                  </TouchableOpacity>
                </View>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => setDeleteConfirmation(item)}
                  className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center"
                >
                  <Trash2 size={15} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <Tag size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              No coupons found.
            </Text>
            <Text className="text-slate-600 mt-1 text-[11px]">
              Tap the button below to register a new discount code.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredCoupons.length > 0 ? (
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
        <FloatingActionButton onPress={handleOpenAdd} label="Add coupon" />
      </View>

      {/* ================================================= */}
      {/* COUPON DETAILS MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!selectedCoupon}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedCoupon(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
                  <Tag size={18} color="#34d399" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-lg font-black" numberOfLines={1}>
                    {selectedCoupon?.name}
                  </Text>
                  <Text className="text-emerald-400 font-mono font-bold text-xs mt-0.5">
                    {selectedCoupon?.code}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedCoupon(null)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-3">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">
                Description
              </Text>
              <Text className="text-slate-300 text-xs leading-5">
                {selectedCoupon?.description || "No description provided."}
              </Text>
            </View>

            {/* Details Breakdown */}
            <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Discount:</Text>
                <Text className="text-emerald-400 font-bold text-xs">
                  {selectedCoupon?.discount_type === "percentage"
                    ? `${selectedCoupon.discount_value}%`
                    : `₹${selectedCoupon?.discount_value}`}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Min Order Value:</Text>
                <Text className="text-white font-bold text-xs">
                  ₹{selectedCoupon?.min_order_value || 0}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Validity Period:</Text>
                <Text className="text-amber-400 font-mono text-xs">
                  {selectedCoupon?.start_date ? selectedCoupon.start_date.split("T")[0] : "—"} to{" "}
                  {selectedCoupon?.expiry_date ? selectedCoupon.expiry_date.split("T")[0] : "—"}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Scope:</Text>
                <Text className="text-white font-bold text-xs capitalize">
                  {selectedCoupon?.coupon_scope ? selectedCoupon.coupon_scope.replace(/_/g, " ") : "All"}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Total Usage:</Text>
                <Text className="text-white font-bold text-xs">
                  {selectedCoupon?.usage_count || 0}{" "}
                  {selectedCoupon?.usage_limit_global
                    ? `/ ${selectedCoupon.usage_limit_global}`
                    : "redeemed"}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  const target = selectedCoupon;
                  setSelectedCoupon(null);
                  if (target) handleOpenEdit(target);
                }}
                className="flex-1 bg-blue-600 rounded-2xl py-3.5 items-center flex-row justify-center"
              >
                <Edit2 size={15} color="#fff" />
                <Text className="text-white font-black text-xs uppercase ml-1.5">
                  Edit Coupon
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const target = selectedCoupon;
                  setSelectedCoupon(null);
                  if (target) setDeleteConfirmation(target);
                }}
                className="px-5 bg-red-500/10 border border-red-500/20 rounded-2xl py-3.5 items-center justify-center"
              >
                <Trash2 size={16} color="#f87171" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* ADD / EDIT COUPON MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[88%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-lg font-black">
                  {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Configure discount settings, scope and limits
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {/* Code & Name */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Coupon Code *
                  </Text>
                  <TextInput
                    value={formData.code}
                    onChangeText={(text) =>
                      setFormData({ ...formData, code: text.toUpperCase() })
                    }
                    placeholder="e.g. SUMMER50"
                    placeholderTextColor="#64748b"
                    autoCapitalize="characters"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white font-mono text-xs font-bold"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Coupon Title *
                  </Text>
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="e.g. Summer Special"
                    placeholderTextColor="#64748b"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs font-bold"
                  />
                </View>
              </View>

              {/* Description */}
              <View>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Description
                </Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Brief description of the discount..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={2}
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs leading-5"
                />
              </View>

              {/* Discount Type & Value */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Discount Type *
                  </Text>
                  <View className="flex-row gap-1 bg-slate-950 border border-slate-800 rounded-2xl p-1">
                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, discount_type: "percentage" })
                      }
                      className={`flex-1 py-2 rounded-xl items-center ${
                        formData.discount_type === "percentage"
                          ? "bg-emerald-600 shadow-sm"
                          : ""
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          formData.discount_type === "percentage"
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        % Off
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        setFormData({ ...formData, discount_type: "fixed" })
                      }
                      className={`flex-1 py-2 rounded-xl items-center ${
                        formData.discount_type === "fixed"
                          ? "bg-emerald-600 shadow-sm"
                          : ""
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          formData.discount_type === "fixed"
                            ? "text-white"
                            : "text-slate-400"
                        }`}
                      >
                        ₹ Flat
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Discount Value *
                  </Text>
                  <TextInput
                    value={formData.discount_value}
                    onChangeText={(text) =>
                      setFormData({ ...formData, discount_value: text })
                    }
                    placeholder={formData.discount_type === "percentage" ? "50" : "100"}
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-emerald-400 text-xs font-bold"
                  />
                </View>
              </View>

              {/* Min Order Value */}
              <View>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Min Order Value (₹)
                </Text>
                <TextInput
                  value={formData.min_order_value}
                  onChangeText={(text) =>
                    setFormData({ ...formData, min_order_value: text })
                  }
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs font-bold"
                />
              </View>

              {/* Start Date & Expiry Date with DatePickerModal */}
              <View className="flex-row gap-3">
                {/* Start Date */}
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Start Date *
                  </Text>
                  <View className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex-row items-center justify-between">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setDatePickerConfig({
                          visible: true,
                          title: "Select Start Date",
                          field: "start_date",
                          initialDate: formData.start_date,
                        })
                      }
                      className="flex-row items-center flex-1 py-1"
                    >
                      <Calendar size={14} color="#34d399" />
                      <Text
                        className={`ml-2 text-xs font-mono font-bold ${
                          formData.start_date ? "text-white" : "text-slate-500"
                        }`}
                      >
                        {formData.start_date || "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Expiry Date */}
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Expiry Date *
                  </Text>
                  <View className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 flex-row items-center justify-between">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        setDatePickerConfig({
                          visible: true,
                          title: "Select Expiry Date",
                          field: "expiry_date",
                          initialDate: formData.expiry_date,
                        })
                      }
                      className="flex-row items-center flex-1 py-1"
                    >
                      <Calendar size={14} color="#f59e0b" />
                      <Text
                        className={`ml-2 text-xs font-mono font-bold ${
                          formData.expiry_date ? "text-white" : "text-slate-500"
                        }`}
                      >
                        {formData.expiry_date || "YYYY-MM-DD"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Usage Limits */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Global Limit
                  </Text>
                  <TextInput
                    value={formData.usage_limit_global}
                    onChangeText={(text) =>
                      setFormData({ ...formData, usage_limit_global: text })
                    }
                    placeholder="Unlimited"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs font-bold"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Per Customer
                  </Text>
                  <TextInput
                    value={formData.usage_limit_per_customer}
                    onChangeText={(text) =>
                      setFormData({ ...formData, usage_limit_per_customer: text })
                    }
                    placeholder="1"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs font-bold"
                  />
                </View>
              </View>

              {/* Status Selector */}
              <View>
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Coupon Status
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, status: "active" })}
                    className={`flex-1 py-3 rounded-2xl border items-center flex-row justify-center ${
                      formData.status === "active"
                        ? "bg-emerald-500/15 border-emerald-500/50"
                        : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <CheckCircle
                      size={14}
                      color={formData.status === "active" ? "#34d399" : "#64748b"}
                    />
                    <Text
                      className={`ml-1.5 text-xs font-bold uppercase ${
                        formData.status === "active"
                          ? "text-emerald-400"
                          : "text-slate-400"
                      }`}
                    >
                      Active
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setFormData({ ...formData, status: "inactive" })}
                    className={`flex-1 py-3 rounded-2xl border items-center flex-row justify-center ${
                      formData.status === "inactive"
                        ? "bg-rose-500/15 border-rose-500/50"
                        : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <XCircle
                      size={14}
                      color={formData.status === "inactive" ? "#f87171" : "#64748b"}
                    />
                    <Text
                      className={`ml-1.5 text-xs font-bold uppercase ${
                        formData.status === "inactive"
                          ? "text-rose-400"
                          : "text-slate-400"
                      }`}
                    >
                      Inactive
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Coupon Scope */}
              <View className="bg-slate-950 border border-slate-800 rounded-3xl p-4 mb-2">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                  Coupon Applies To
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                  {[
                    { label: "All Products (Global)", value: "all" },
                    { label: "First Order Only", value: "first_order_only" },
                    { label: "Specific Home Chef", value: "specific_home_chef" },
                    { label: "Specific Products", value: "specific_products" },
                    { label: "Specific Categories", value: "specific_categories" },
                  ].map((scope) => {
                    const isSelected = formData.coupon_scope === scope.value;
                    return (
                      <TouchableOpacity
                        key={scope.value}
                        onPress={() =>
                          setFormData({ ...formData, coupon_scope: scope.value })
                        }
                        className={`mr-2 px-3.5 py-2.5 rounded-xl border ${
                          isSelected
                            ? "bg-blue-500/15 border-blue-500/50"
                            : "bg-slate-900 border-slate-800"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-blue-400" : "text-slate-400"
                          }`}
                        >
                          {scope.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Sub-Selection based on Scope */}
                {formData.coupon_scope === "specific_home_chef" && (
                  <View>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1.5">
                      Select Chefs ({formData.applicable_home_chef_ids.length} selected)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {chefs.map((c) => {
                        const isChecked = formData.applicable_home_chef_ids.includes(c.id);
                        return (
                          <TouchableOpacity
                            key={c.id}
                            onPress={() => {
                              const ids = isChecked
                                ? formData.applicable_home_chef_ids.filter((i) => i !== c.id)
                                : [...formData.applicable_home_chef_ids, c.id];
                              setFormData({ ...formData, applicable_home_chef_ids: ids });
                            }}
                            className={`mr-2 px-3 py-2 rounded-xl border ${
                              isChecked
                                ? "bg-emerald-500/15 border-emerald-500/40"
                                : "bg-slate-900 border-slate-800"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isChecked ? "text-emerald-400" : "text-slate-300"
                              }`}
                            >
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {formData.coupon_scope === "specific_products" && (
                  <View>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1.5">
                      Select Products ({formData.applicable_product_ids.length} selected)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {products.map((p) => {
                        const isChecked = formData.applicable_product_ids.includes(p.id);
                        return (
                          <TouchableOpacity
                            key={p.id}
                            onPress={() => {
                              const ids = isChecked
                                ? formData.applicable_product_ids.filter((i) => i !== p.id)
                                : [...formData.applicable_product_ids, p.id];
                              setFormData({ ...formData, applicable_product_ids: ids });
                            }}
                            className={`mr-2 px-3 py-2 rounded-xl border ${
                              isChecked
                                ? "bg-emerald-500/15 border-emerald-500/40"
                                : "bg-slate-900 border-slate-800"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isChecked ? "text-emerald-400" : "text-slate-300"
                              }`}
                            >
                              {p.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {formData.coupon_scope === "specific_categories" && (
                  <View>
                    <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1.5">
                      Select Categories ({formData.applicable_category_ids.length} selected)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {categories.map((cat) => {
                        const isChecked = formData.applicable_category_ids.includes(cat.id);
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => {
                              const ids = isChecked
                                ? formData.applicable_category_ids.filter((i) => i !== cat.id)
                                : [...formData.applicable_category_ids, cat.id];
                              setFormData({ ...formData, applicable_category_ids: ids });
                            }}
                            className={`mr-2 px-3 py-2 rounded-xl border ${
                              isChecked
                                ? "bg-emerald-500/15 border-emerald-500/40"
                                : "bg-slate-900 border-slate-800"
                            }`}
                          >
                            <Text
                              className={`text-xs font-bold ${
                                isChecked ? "text-emerald-400" : "text-slate-300"
                              }`}
                            >
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                disabled={formSubmitting}
                onPress={handleSubmitForm}
                className="bg-emerald-600 rounded-2xl py-4 items-center mb-2 shadow-lg"
              >
                {formSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    {editingCoupon ? "Save Changes" : "Create Coupon"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* DATE PICKER MODAL */}
      {/* ================================================= */}
      <DatePickerModal
        visible={datePickerConfig.visible}
        title={datePickerConfig.title}
        initialDate={datePickerConfig.initialDate}
        onClose={() =>
          setDatePickerConfig((prev) => ({ ...prev, visible: false }))
        }
        onSelectDate={(dateStr) => {
          setFormData((prev) => ({ ...prev, [datePickerConfig.field]: dateStr }));
        }}
      />

      {/* ================================================= */}
      {/* DELETE CONFIRMATION POPUP */}
      {/* ================================================= */}
      <Modal
        visible={!!deleteConfirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDeleteConfirmation(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="w-14 h-14 rounded-2xl items-center justify-center mb-4 border bg-red-500/15 border-red-500/30">
              <Trash2 size={26} color="#f87171" />
            </View>

            <Text className="text-white text-xl font-black">
              Delete Coupon?
            </Text>

            <Text className="text-slate-400 text-sm mt-2 leading-5">
              Are you sure you want to permanently delete coupon code{" "}
              <Text className="text-white font-bold">{deleteConfirmation?.code}</Text>?
              Customers will no longer be able to apply this discount.
            </Text>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setDeleteConfirmation(null)}
                disabled={actionLoading}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmDelete}
                disabled={actionLoading}
                className="flex-1 rounded-2xl py-3.5 items-center bg-red-600"
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* FEEDBACK DIALOG */}
      {/* ================================================= */}
      <CenteredDialog
        visible={feedbackDialog.visible}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        onClose={() => setFeedbackDialog({ ...feedbackDialog, visible: false })}
        actionLabel="Done"
      />
    </View>
  );
};

export default Coupons;

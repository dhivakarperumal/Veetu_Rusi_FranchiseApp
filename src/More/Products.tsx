import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  Boxes,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Pencil,
  Plus,
  Heart,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Barcode,
} from "lucide-react-native";

import { get, del } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

interface VariantItem {
  weight?: string;
  mrp?: number | string;
  offerPercent?: number | string;
  offerPrice?: number | string;
}

interface ComboItem {
  name?: string;
  weight?: string;
  image?: string;
}

interface ProductItem {
  id: number;
  productId?: string;
  name: string;
  description?: string;
  category?: string;
  mrp?: number | string;
  offer?: number | string;
  offer_price?: number | string;
  total_stock?: number | string;
  totalWeight?: number | string;
  status?: string;
  images?: string[] | string;
  variants?: VariantItem[] | string;
  healthBenefits?: string[] | string;
  comboItems?: ComboItem[] | string;
  comboDetails?: any;
  manufactureDate?: string;
  expiryDate?: string;
  barcodeValue?: string;
  type?: "single" | "combo";
}

const parseJsonSafely = (val: any) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
};

const Products = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<"single" | "combo">("single");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [combos, setCombos] = useState<ProductItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected item for Details Modal
  const [selectedItem, setSelectedItem] = useState<ProductItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Delete Confirmation Modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    item: ProductItem;
    type: "single" | "combo";
  } | null>(null);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, comboRes] = await Promise.allSettled([
        get<any[]>("/franchise-products"),
        get<any[]>("/combos"),
      ]);

      if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
        setProducts(prodRes.value);
      } else {
        setProducts([]);
      }

      if (comboRes.status === "fulfilled" && Array.isArray(comboRes.value)) {
        setCombos(comboRes.value);
      } else {
        setCombos([]);
      }
    } catch (error) {
      console.log("Products load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --------------------------------------------------
  // METRICS & COUNTS
  // --------------------------------------------------
  const currentList = activeTab === "single" ? products : combos;

  const totalCount = currentList.length;
  const activeCount = currentList.filter(
    (p) => (p.status || "Active").toLowerCase() === "active"
  ).length;
  const inactiveCount = currentList.filter(
    (p) => (p.status || "").toLowerCase() === "inactive"
  ).length;

  // --------------------------------------------------
  // SEARCH & FILTER
  // --------------------------------------------------
  const filteredList = useMemo(() => {
    let result = [...currentList];
    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(query) ||
          (p.productId || "").toLowerCase().includes(query) ||
          (p.category || "").toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (p) => (p.status || "Active").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return result;
  }, [currentList, search, statusFilter]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedList = filteredList.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, activeTab]);

  // --------------------------------------------------
  // DELETE ACTION
  // --------------------------------------------------
  const handleDeletePrompt = (item: ProductItem) => {
    setDeleteConfirmation({
      item,
      type: activeTab,
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { item, type } = deleteConfirmation;
    setActionLoading(true);
    try {
      const endpoint =
        type === "single" ? `/franchise-products/${item.id}` : `/combos/${item.id}`;
      await del(endpoint);

      if (selectedItem?.id === item.id) {
        setIsDetailOpen(false);
        setSelectedItem(null);
      }

      setDeleteConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Item Deleted",
        message: `${item.name || "Item"} was successfully deleted.`,
      });
      fetchData();
    } catch (error: any) {
      setDeleteConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Delete Failed",
        message: error.message || "Failed to delete item.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openItemDetails = (item: ProductItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleEditNavigate = (item: ProductItem) => {
    setIsDetailOpen(false);
    navigation.navigate("AddProduct", {
      editItem: item,
      type: activeTab,
    });
  };

  const getImageUri = (item: ProductItem): string | null => {
    const images = parseJsonSafely(item.images);
    if (images && images.length > 0) return images[0];
    return null;
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Product Studio" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Products & Combos...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Products Studio" navigation={navigation} />

      <FlatList
        data={paginatedList}
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
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View className="px-4 pt-6">
            {/* ================= HEADER ================= */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-1">
                <Text className="text-white text-3xl font-black">
                  {activeTab === "single" ? "Single Products" : "Combo Packs"}
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  {activeTab === "single"
                    ? "Manage individual products, weights & variants"
                    : "Manage packaged combos, sets & special offerings"}
                </Text>
              </View>

              <View
                className={`w-10 h-10 rounded-xl items-center justify-center border ${
                  activeTab === "single"
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                }`}
              >
                {activeTab === "single" ? (
                  <Package size={20} color="#34d399" />
                ) : (
                  <Layers size={20} color="#fbbf24" />
                )}
              </View>
            </View>

            {/* ================= TAB SWITCHER ================= */}
            <View className="flex-row bg-slate-900 border border-white/10 rounded-2xl p-1.5 mb-5">
              <TouchableOpacity
                onPress={() => setActiveTab("single")}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                  activeTab === "single"
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : ""
                }`}
              >
                <Package
                  size={15}
                  color={activeTab === "single" ? "#34d399" : "#64748b"}
                />
                <Text
                  className={`ml-2 text-xs font-black uppercase tracking-wider ${
                    activeTab === "single" ? "text-emerald-300" : "text-slate-400"
                  }`}
                >
                  Single Products ({products.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("combo")}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                  activeTab === "combo"
                    ? "bg-amber-500/20 border border-amber-500/40"
                    : ""
                }`}
              >
                <Layers
                  size={15}
                  color={activeTab === "combo" ? "#fbbf24" : "#64748b"}
                />
                <Text
                  className={`ml-2 text-xs font-black uppercase tracking-wider ${
                    activeTab === "combo" ? "text-amber-300" : "text-slate-400"
                  }`}
                >
                  Combo Packs ({combos.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= SUMMARY METRICS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* TOTAL */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "All"
                    ? activeTab === "single"
                      ? "border-emerald-400"
                      : "border-amber-400"
                    : "border-indigo-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-indigo-500/15 items-center justify-center mb-2">
                  <Package size={16} color="#a5b4fc" />
                </View>
                <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">
                  Total {activeTab === "single" ? "Products" : "Combos"}
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {totalCount}
                </Text>
              </TouchableOpacity>

              {/* ACTIVE */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Active");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Active"
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
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Inactive");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Inactive"
                    ? "border-rose-400"
                    : "border-rose-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-rose-500/15 items-center justify-center mb-2">
                  <AlertTriangle size={16} color="#fda4af" />
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
                value={search}
                onChangeText={setSearch}
                placeholder={`Search ${activeTab === "single" ? "products" : "combos"} by name or SKU...`}
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
            </View>

            {/* ================= FILTERS ROW ================= */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Filter size={15} color="#94a3b8" />
                <Text className="text-slate-400 ml-1.5 text-[10px] font-bold uppercase">
                  Filter by status
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(true)}
                className="flex-row items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2"
              >
                <Text className="text-white text-xs font-bold mr-2">
                  {statusFilter === "All" ? "All Status" : statusFilter}
                </Text>
                <ChevronDown size={15} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* RESULT COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedList.length} of {filteredList.length}{" "}
              {activeTab === "single" ? "products" : "combo packs"}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: ProductItem }) => {
          const imgUri = getImageUri(item);
          const variants = parseJsonSafely(item.variants);
          const comboItems = parseJsonSafely(item.comboItems);
          const isActive = (item.status || "Active").toLowerCase() === "active";

          const displayPrice =
            item.offer_price ||
            (variants.length > 0 && variants[0].offerPrice) ||
            item.mrp ||
            (item.comboDetails && item.comboDetails.offerPrice) ||
            0;

          const originalMrp =
            item.mrp ||
            (variants.length > 0 && variants[0].mrp) ||
            (item.comboDetails && item.comboDetails.mrp) ||
            0;

          return (
            <View className="mx-4 mb-3 bg-slate-900 border border-white/10 rounded-2xl p-4">
              {/* ================= TOP INFO ================= */}
              <View className="flex-row items-start">
                {imgUri ? (
                  <Image
                    source={{ uri: imgUri }}
                    className="w-14 h-14 rounded-2xl border border-white/10"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 items-center justify-center">
                    {activeTab === "single" ? (
                      <Package size={24} color="#34d399" />
                    ) : (
                      <Layers size={24} color="#fbbf24" />
                    )}
                  </View>
                )}

                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-black" numberOfLines={1}>
                    {item.name}
                  </Text>

                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-slate-400 text-xs font-mono font-bold">
                      {item.productId || `#${item.id}`}
                    </Text>
                    {item.category && (
                      <Text className="text-slate-500 text-xs">• {item.category}</Text>
                    )}
                  </View>
                </View>

                {/* Status Pill */}
                <View
                  className={`px-2.5 py-1 rounded-lg border ${
                    isActive
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-red-500/15 border-red-500/30"
                  }`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase tracking-wider ${
                      isActive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {item.status || "Active"}
                  </Text>
                </View>
              </View>

              {/* ================= ESSENTIAL METRICS ================= */}
              <View className="mt-3.5 flex-row items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5">
                {/* Price */}
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-emerald-400 text-base font-black">
                    ₹{displayPrice}
                  </Text>
                  {Number(originalMrp) > Number(displayPrice) && (
                    <Text className="text-slate-500 text-xs line-through">
                      ₹{originalMrp}
                    </Text>
                  )}
                </View>

                {/* Variants / Items summary */}
                <View className="flex-row items-center">
                  <Tag size={13} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-1.5 font-bold">
                    {activeTab === "single"
                      ? `${variants.length || 1} Variant(s)`
                      : `${comboItems.length || 1} Pack Item(s)`}
                  </Text>
                </View>

                {/* Total Stock / Weight */}
                <View className="flex-row items-center">
                  <Boxes size={13} color="#64748b" />
                  <Text className="text-slate-300 text-xs ml-1.5 font-bold">
                    {item.total_stock || item.totalWeight || 0}{" "}
                    {activeTab === "single" ? "Qty" : "g"}
                  </Text>
                </View>
              </View>

              {/* ================= ACTION BUTTONS ================= */}
              <View className="flex-row items-center justify-between mt-3.5 pt-3 border-t border-white/10 gap-2">
                <Text className="text-slate-400 text-xs font-semibold flex-1" numberOfLines={1}>
                  {item.description || "Studio Product"}
                </Text>

                {/* Actions */}
                <View className="flex-row items-center gap-2">
                  {/* View Details */}
                  <TouchableOpacity
                    onPress={() => openItemDetails(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${item.name}`}
                    className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                  >
                    <Eye size={15} color="#cbd5e1" />
                  </TouchableOpacity>

                  {/* Edit */}
                  <TouchableOpacity
                    onPress={() => handleEditNavigate(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                    className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                  >
                    <Pencil size={16} color="#cbd5e1" />
                  </TouchableOpacity>

                  {/* Delete */}
                  <TouchableOpacity
                    onPress={() => handleDeletePrompt(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name}`}
                    className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center"
                  >
                    <Trash2 size={16} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <Package size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              No {activeTab === "single" ? "products" : "combo packs"} found.
            </Text>
            <Text className="text-slate-600 mt-1 text-[11px]">
              Tap the button below to register a new {activeTab === "single" ? "product" : "combo pack"}.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredList.length > 0 ? (
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
        <FloatingActionButton
          onPress={() =>
            navigation.navigate("AddProduct", {
              initialTab: activeTab,
            })
          }
          label={activeTab === "single" ? "Add single product" : "Add combo pack"}
        />
      </View>

      {/* ================================================= */}
      {/* PRODUCT DETAILS MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isDetailOpen && !!selectedItem}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex-col"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            {/* Modal Header */}
            <View
              className={`p-5 rounded-t-3xl flex-row items-center justify-between ${
                activeTab === "single" ? "bg-emerald-700" : "bg-amber-700"
              }`}
            >
              <View className="flex-1">
                <Text className="text-white text-xl font-black" numberOfLines={1}>
                  {selectedItem?.name}
                </Text>
                <Text className="text-white/80 text-xs font-bold uppercase tracking-wider mt-1">
                  {selectedItem?.productId} •{" "}
                  {activeTab === "single" ? "Single Product Studio" : "Combo Pack Studio"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="w-9 h-9 bg-black/20 rounded-full items-center justify-center"
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              {/* Product Images Carousel/Grid */}
              {(() => {
                const images = parseJsonSafely(selectedItem?.images);
                if (images.length > 0) {
                  return (
                    <View className="mb-4">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {images.map((img: string, idx: number) => (
                          <Image
                            key={idx}
                            source={{ uri: img }}
                            className="w-44 h-36 rounded-2xl mr-3 border border-slate-800"
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    </View>
                  );
                }
                return null;
              })()}

              {/* Description Card */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-2">
                  📝 Overview & Composition
                </Text>
                <Text className="text-slate-300 text-xs leading-5">
                  {selectedItem?.description || "No description provided."}
                </Text>

                <View className="flex-row flex-wrap mt-3 pt-3 border-t border-slate-900">
                  <View className="w-1/2 p-1">
                    <Text className="text-slate-500 text-[10px] font-bold uppercase">
                      Category
                    </Text>
                    <Text className="text-white text-xs font-bold mt-0.5">
                      {selectedItem?.category || "N/A"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1">
                    <Text className="text-slate-500 text-[10px] font-bold uppercase">
                      Status
                    </Text>
                    <Text className="text-emerald-400 text-xs font-bold mt-0.5">
                      {selectedItem?.status || "Active"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1">
                    <Text className="text-slate-500 text-[10px] font-bold uppercase">
                      Manufacture Date
                    </Text>
                    <Text className="text-white text-xs font-bold mt-0.5">
                      {selectedItem?.manufactureDate || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1">
                    <Text className="text-slate-500 text-[10px] font-bold uppercase">
                      Expiry Date
                    </Text>
                    <Text className="text-white text-xs font-bold mt-0.5">
                      {selectedItem?.expiryDate || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Variants / Combo Items Breakdown */}
              {activeTab === "single" ? (
                <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                  <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                    🏷️ Sales Variants & Pricing
                  </Text>
                  {parseJsonSafely(selectedItem?.variants).map((v: VariantItem, idx: number) => (
                    <View
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-2 flex-row justify-between items-center"
                    >
                      <View>
                        <Text className="text-white text-xs font-black">
                          {v.weight || "Standard Weight"}
                        </Text>
                        <Text className="text-slate-400 text-[10px] mt-0.5">
                          Discount: {v.offerPercent || 0}%
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-emerald-400 text-sm font-black">
                          ₹{v.offerPrice || v.mrp || 0}
                        </Text>
                        {Number(v.mrp) > Number(v.offerPrice) && (
                          <Text className="text-slate-500 text-[10px] line-through">
                            MRP: ₹{v.mrp}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                  <Text className="text-amber-400 text-sm font-black uppercase tracking-wider mb-3">
                    📦 Combo Items Breakdown
                  </Text>
                  {parseJsonSafely(selectedItem?.comboItems).map((ci: ComboItem, idx: number) => (
                    <View
                      key={idx}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-2 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        {ci.image ? (
                          <Image
                            source={{ uri: ci.image }}
                            className="w-8 h-8 rounded-lg mr-2.5"
                          />
                        ) : null}
                        <Text className="text-white text-xs font-bold">
                          {ci.name || `Item ${idx + 1}`}
                        </Text>
                      </View>
                      <Text className="text-amber-300 text-xs font-mono font-bold">
                        {ci.weight || "—"}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Health Benefits Card */}
              {(() => {
                const benefits = parseJsonSafely(selectedItem?.healthBenefits).filter(Boolean);
                if (benefits.length > 0) {
                  return (
                    <View className="bg-slate-950 rounded-2xl p-4 mb-4 border border-slate-800">
                      <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                        ❤️ Health Analysis Points
                      </Text>
                      {benefits.map((b: string, idx: number) => (
                        <View key={idx} className="flex-row items-center mb-2">
                          <Sparkles size={13} color="#34d399" />
                          <Text className="text-slate-300 text-xs ml-2 leading-4">{b}</Text>
                        </View>
                      ))}
                    </View>
                  );
                }
                return null;
              })()}
            </ScrollView>

            {/* Bottom Actions */}
            <View className="p-4 border-t border-slate-800 bg-slate-950 flex-row gap-2">
              <TouchableOpacity
                onPress={() => selectedItem && handleEditNavigate(selectedItem)}
                className="flex-1 bg-slate-800 py-3.5 rounded-2xl items-center flex-row justify-center"
              >
                <Pencil size={16} color="#cbd5e1" />
                <Text className="text-slate-300 font-bold text-xs uppercase ml-2">
                  Edit Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedItem && handleDeletePrompt(selectedItem)}
                className="px-4 bg-red-500/10 border border-red-500/20 py-3.5 rounded-2xl items-center justify-center"
              >
                <Trash2 size={18} color="#f87171" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="px-5 bg-slate-800 py-3.5 rounded-2xl items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* DELETE CONFIRMATION POPUP */}
      {/* ================================================= */}
      <Modal
        visible={!!deleteConfirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setDeleteConfirmation(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="w-14 h-14 rounded-2xl items-center justify-center mb-4 border bg-red-500/15 border-red-500/30">
              <Trash2 size={26} color="#f87171" />
            </View>

            <Text className="text-white text-xl font-black">
              Delete {deleteConfirmation?.type === "single" ? "Product" : "Combo Pack"}?
            </Text>

            {deleteConfirmation?.item && (
              <View className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 my-3 flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                  <Package size={18} color="#94a3b8" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>
                    {deleteConfirmation.item.name}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5">
                    {deleteConfirmation.item.productId || `#${deleteConfirmation.item.id}`}
                  </Text>
                </View>
              </View>
            )}

            <Text className="text-slate-400 text-sm leading-5">
              Are you sure you want to permanently delete{" "}
              <Text className="text-white font-bold">{deleteConfirmation?.item?.name}</Text>?
              This entry will be removed from your catalog and inventory.
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
      {/* STATUS FILTER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">
                  Filter by Status
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Choose active status criteria
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <View className="gap-2 mb-4">
              {["All", "Active", "Inactive"].map((status) => {
                const active = statusFilter === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => {
                      setStatusFilter(status);
                      setIsFilterModalOpen(false);
                    }}
                    className={`py-3.5 px-4 rounded-xl border flex-row items-center justify-between ${
                      active
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-950 border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase ${
                        active ? "text-emerald-300" : "text-slate-400"
                      }`}
                    >
                      {status === "All" ? "All Statuses" : status}
                    </Text>
                    {active && <CheckCircle size={16} color="#34d399" />}
                  </TouchableOpacity>
                );
              })}
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
        actionLabel="Okay"
      />
    </View>
  );
};

export default Products;
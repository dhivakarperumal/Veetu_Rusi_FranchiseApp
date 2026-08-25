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
} from "react-native";
import {
  Search,
  Package,
  AlertTriangle,
  Plus,
  Boxes,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  X,
} from "lucide-react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { get, put } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

interface Product {
  id: number;
  productId?: string;
  name: string;
  category?: string;
  product_code?: string;
  total_stock?: number | string;
  stock?: number | string;
  status?: string;
  offer_price?: number | string;
  mrp?: number | string;
}

const StockDetails = () => {
  const navigation: any = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<"All" | "Low" | "Out" | "Healthy">("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Quick Stock Replenish Modal
  const [replenishItem, setReplenishItem] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState("");
  const [replenishLoading, setReplenishLoading] = useState(false);

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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await get<any[]>("/franchise-products");
      if (Array.isArray(res)) {
        setProducts(res);
      } else {
        const altRes = await get<any[]>("/products");
        setProducts(Array.isArray(altRes) ? altRes : []);
      }
    } catch (error) {
      console.log("Stock Details load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchProducts();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const getStockNumber = (item: Product) => {
    return Number(item.total_stock ?? item.stock ?? 0);
  };

  // --------------------------------------------------
  // SUMMARY METRICS
  // --------------------------------------------------
  const totalItems = products.length;
  const outOfStock = products.filter((p) => getStockNumber(p) <= 0).length;
  const lowStock = products.filter(
    (p) => getStockNumber(p) > 0 && getStockNumber(p) < 10
  ).length;
  const healthyStock = products.filter((p) => getStockNumber(p) >= 10).length;

  // --------------------------------------------------
  // SEARCH & FILTER
  // --------------------------------------------------
  const filteredProducts = useMemo(() => {
    let list = [...products];
    const query = search.trim().toLowerCase();

    if (query) {
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(query) ||
          (p.productId || "").toLowerCase().includes(query) ||
          (p.product_code || "").toLowerCase().includes(query) ||
          (p.category || "").toLowerCase().includes(query)
      );
    }

    if (filterMode === "Low") {
      list = list.filter((p) => getStockNumber(p) > 0 && getStockNumber(p) < 10);
    } else if (filterMode === "Out") {
      list = list.filter((p) => getStockNumber(p) <= 0);
    } else if (filterMode === "Healthy") {
      list = list.filter((p) => getStockNumber(p) >= 10);
    }

    return list;
  }, [products, search, filterMode]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterMode]);

  // --------------------------------------------------
  // QUICK REPLENISH ACTION
  // --------------------------------------------------
  const handleSaveReplenish = async () => {
    if (!replenishItem) return;
    const qty = Number(addQty);
    if (isNaN(qty) || qty <= 0) return;

    setReplenishLoading(true);
    try {
      const currentStock = getStockNumber(replenishItem);
      const updatedStock = currentStock + qty;

      await put(`/franchise-products/${replenishItem.id}`, {
        ...replenishItem,
        total_stock: updatedStock,
      });

      setReplenishItem(null);
      setAddQty("");
      setFeedbackDialog({
        visible: true,
        title: "Stock Replenished",
        message: `Added ${qty} units to ${replenishItem.name}. New total: ${updatedStock} units.`,
      });
      fetchProducts();
    } catch (error: any) {
      setReplenishItem(null);
      setFeedbackDialog({
        visible: true,
        title: "Update Failed",
        message: error.message || "Failed to update stock.",
      });
    } finally {
      setReplenishLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Stock Details" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Inventory Levels...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Stock Details" navigation={navigation} />

      <FlatList
        data={paginatedProducts}
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
                  Stock Health
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Monitor and replenish warehouse and store stock
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
                <Boxes size={20} color="#fbbf24" />
              </View>
            </View>

            {/* ================= SUMMARY STAT METRICS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* HEALTHY */}
              <TouchableOpacity
                onPress={() => setFilterMode(filterMode === "Healthy" ? "All" : "Healthy")}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  filterMode === "Healthy" ? "border-emerald-400" : "border-emerald-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <CheckCircle size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  In Stock
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {healthyStock}
                </Text>
              </TouchableOpacity>

              {/* LOW STOCK */}
              <TouchableOpacity
                onPress={() => setFilterMode(filterMode === "Low" ? "All" : "Low")}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  filterMode === "Low" ? "border-amber-400" : "border-amber-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
                  <AlertTriangle size={16} color="#fcd34d" />
                </View>
                <Text className="text-amber-200/70 text-[9px] font-bold uppercase">
                  Low Stock
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {lowStock}
                </Text>
              </TouchableOpacity>

              {/* OUT OF STOCK */}
              <TouchableOpacity
                onPress={() => setFilterMode(filterMode === "Out" ? "All" : "Out")}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  filterMode === "Out" ? "border-rose-400" : "border-rose-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-rose-500/15 items-center justify-center mb-2">
                  <TrendingDown size={16} color="#fda4af" />
                </View>
                <Text className="text-rose-200/70 text-[9px] font-bold uppercase">
                  Out of Stock
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {outOfStock}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-4">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search stock by product name or SKU..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs font-semibold"
              />
            </View>

            {/* RESULT COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedProducts.length} of {filteredProducts.length} items
              {filterMode !== "All" ? ` (${filterMode} Stock)` : ""}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Product }) => {
          const stock = getStockNumber(item);
          const isOut = stock <= 0;
          const isLow = stock > 0 && stock < 10;

          return (
            <View className="mx-4 mb-3 bg-slate-900 border border-white/10 rounded-2xl p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-white text-base font-black" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5 font-mono font-bold">
                    {item.productId || item.product_code || `#${item.id}`} •{" "}
                    {item.category || "General"}
                  </Text>
                </View>

                {/* Stock Level Badge */}
                <View
                  className={`px-3 py-1.5 rounded-xl border items-end ${
                    isOut
                      ? "bg-red-500/15 border-red-500/30"
                      : isLow
                      ? "bg-amber-500/15 border-amber-500/30"
                      : "bg-emerald-500/15 border-emerald-500/30"
                  }`}
                >
                  <Text
                    className={`text-base font-black ${
                      isOut
                        ? "text-red-400"
                        : isLow
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {stock}
                  </Text>
                  <Text
                    className={`text-[8px] font-black uppercase ${
                      isOut
                        ? "text-red-400"
                        : isLow
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                  </Text>
                </View>
              </View>

              {/* Bottom Info & Quick Action */}
              <View className="flex-row items-center justify-between mt-3.5 pt-3 border-t border-white/10">
                <Text className="text-slate-400 text-xs font-bold">
                  Price: ₹{item.offer_price || item.mrp || 0}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setReplenishItem(item);
                    setAddQty("");
                  }}
                  className="bg-emerald-600/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl flex-row items-center"
                >
                  <Plus size={13} color="#34d399" />
                  <Text className="text-emerald-300 font-bold text-[10px] uppercase ml-1.5">
                    Replenish
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <Boxes size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              No matching inventory items found.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredProducts.length > 0 ? (
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
          onPress={() => navigation.navigate("AddStock")}
          label="Add inventory stock"
        />
      </View>

      {/* ================================================= */}
      {/* QUICK REPLENISH MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!replenishItem}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setReplenishItem(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-black">
                Quick Stock Replenishment
              </Text>
              <TouchableOpacity
                onPress={() => setReplenishItem(null)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {replenishItem && (
              <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4">
                <Text className="text-white text-sm font-bold">
                  {replenishItem.name}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-slate-400 text-xs">Current Stock:</Text>
                  <Text className="text-emerald-400 text-base font-black">
                    {getStockNumber(replenishItem)} units
                  </Text>
                </View>
              </View>
            )}

            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Quantity to Add
              </Text>
              <TextInput
                keyboardType="numeric"
                value={addQty}
                onChangeText={setAddQty}
                placeholder="e.g. 50"
                placeholderTextColor="#64748b"
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-base font-bold"
                autoFocus
              />
            </View>

            {Number(addQty) > 0 && replenishItem && (
              <View className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3.5 mb-5 flex-row items-center justify-between">
                <Text className="text-emerald-300 text-xs font-bold">
                  New Total Stock Preview:
                </Text>
                <Text className="text-emerald-400 text-lg font-black">
                  {getStockNumber(replenishItem) + Number(addQty)} units
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setReplenishItem(null)}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={replenishLoading || !Number(addQty)}
                onPress={handleSaveReplenish}
                className="flex-1 bg-emerald-600 rounded-2xl py-3.5 items-center"
              >
                {replenishLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Add Stock
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

export default StockDetails;
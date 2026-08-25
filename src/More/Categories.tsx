import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Modal,
  ScrollView,
} from "react-native";
import {
  Search,
  Plus,
  LayoutGrid,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Pencil,
  Eye,
  X,
  CheckCircle,
} from "lucide-react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { get, del } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

interface Category {
  id: number;
  catId: string;
  name?: string;
  cname?: string;
  description?: string;
  cdescription?: string;
  images?: string[] | string;
  cimgs?: string[] | string;
  created_at?: string;
  franchise_user_id?: string | number;
}

const parseImages = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const Categories = () => {
  const navigation: any = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected Category for Details Modal
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Delete Confirmation Modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<Category | null>(null);
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("user");
      let franchiseUserId = "";
      if (userData) {
        const user = JSON.parse(userData);
        franchiseUserId = user?.user_id || user?.id || user?.franchise_user_id || "";
      }

      const response = await get<any[]>(
        franchiseUserId ? `/categories?franchise_user_id=${franchiseUserId}` : "/categories"
      );

      const rawData = Array.isArray(response) ? response : [];
      const sanitized = rawData.map((cat: any) => ({
        ...cat,
        name: cat.name || cat.cname || "",
        description: cat.description || cat.cdescription || "",
        images: parseImages(cat.images || cat.cimgs),
      }));

      setCategories(sanitized);
    } catch (error) {
      console.log("Category Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCategories();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  // --------------------------------------------------
  // SEARCH & FILTER
  // --------------------------------------------------
  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter(
      (item) =>
        (item?.name || "").toLowerCase().includes(query) ||
        (item?.catId || "").toLowerCase().includes(query) ||
        (item?.description || "").toLowerCase().includes(query)
    );
  }, [categories, search]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedCategories = filteredCategories.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // --------------------------------------------------
  // EDIT CATEGORY ACTION
  // --------------------------------------------------
  const handleEdit = (category: Category) => {
    navigation.navigate("AddCategory", {
      editCategory: category,
      existingCategories: categories,
    });
  };

  // --------------------------------------------------
  // DELETE CATEGORY ACTION
  // --------------------------------------------------
  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    setActionLoading(true);
    try {
      await del(`/categories/${deleteConfirmation.id}`);
      setDeleteConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Category Deleted",
        message: `${deleteConfirmation.name || "Category"} was successfully removed.`,
      });
      fetchCategories();
    } catch (error: any) {
      setDeleteConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Delete Failed",
        message: error.message || "Failed to delete category.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Categories" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Categories...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Categories" navigation={navigation} />

      <FlatList
        data={paginatedCategories}
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
                  Categories
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Organize and manage catalog classifications
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center">
                <LayoutGrid size={20} color="#818cf8" />
              </View>
            </View>

            {/* ================= SUMMARY STAT METRICS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* TOTAL */}
              <View className="flex-1 bg-slate-900 border border-indigo-400/25 rounded-2xl p-3">
                <View className="w-8 h-8 rounded-lg bg-indigo-500/15 items-center justify-center mb-2">
                  <LayoutGrid size={16} color="#a5b4fc" />
                </View>
                <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">
                  Total Categories
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {categories.length}
                </Text>
              </View>

              {/* WITH PHOTOS */}
              <View className="flex-1 bg-slate-900 border border-emerald-400/25 rounded-2xl p-3">
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <ImageIcon size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  With Photos
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {categories.filter((c) => parseImages(c.images).length > 0).length}
                </Text>
              </View>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-4">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search category by name or ID..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs font-semibold"
              />
            </View>

            {/* RESULT COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedCategories.length} of {filteredCategories.length} categories
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Category }) => {
          const images = parseImages(item.images);
          const hasImage = images.length > 0;

          return (
            <View className="mx-4 mb-2.5 bg-slate-900 border border-white/10 rounded-2xl p-3 flex-row items-center">
              {/* Reduced Height Compact Left Thumbnail */}
              {hasImage ? (
                <Image
                  source={{ uri: images[0] }}
                  className="w-16 h-16 rounded-xl border border-white/10"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-16 h-16 rounded-xl bg-slate-950 border border-white/10 items-center justify-center">
                  <LayoutGrid size={22} color="#475569" />
                </View>
              )}

              {/* Center Content */}
              <View className="flex-1 ml-3 mr-2">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-white text-sm font-black flex-1" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View className="bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                    <Text className="text-indigo-300 font-mono font-bold text-[10px]">
                      {item.catId || `#${item.id}`}
                    </Text>
                  </View>
                </View>

                <Text
                  numberOfLines={1}
                  className="text-slate-400 text-xs mt-1 leading-4"
                >
                  {item.description || "Classification category"}
                </Text>

                {images.length > 1 && (
                  <Text className="text-slate-500 text-[10px] mt-1">
                    📷 {images.length} photos
                  </Text>
                )}
              </View>

              {/* Right Action Buttons: Edit & Delete */}
              <View className="flex-row items-center gap-1.5">
                {/* View Details */}
                <TouchableOpacity
                  onPress={() => setSelectedCategory(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details of ${item.name}`}
                  className="w-9 h-9 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Eye size={15} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Edit Category */}
                <TouchableOpacity
                  onPress={() => handleEdit(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name}`}
                  className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-xl items-center justify-center"
                >
                  <Pencil size={15} color="#60a5fa" />
                </TouchableOpacity>

                {/* Delete Category */}
                <TouchableOpacity
                  onPress={() => setDeleteConfirmation(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name}`}
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
            <LayoutGrid size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              No categories found.
            </Text>
            <Text className="text-slate-600 mt-1 text-[11px]">
              Tap the button below to add a new category.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredCategories.length > 0 ? (
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
            navigation.navigate("AddCategory", {
              existingCategories: categories,
            })
          }
          label="Add category"
        />
      </View>

      {/* ================================================= */}
      {/* CATEGORY DETAILS MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!selectedCategory}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setSelectedCategory(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-white text-xl font-black">
                  {selectedCategory?.name}
                </Text>
                <Text className="text-indigo-400 text-xs font-mono font-bold mt-0.5">
                  {selectedCategory?.catId}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={16} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Photos */}
            {selectedCategory && parseImages(selectedCategory.images).length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {parseImages(selectedCategory.images).map((img, idx) => (
                  <Image
                    key={idx}
                    source={{ uri: img }}
                    className="w-40 h-32 rounded-2xl mr-3 border border-slate-800"
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            )}

            {/* Description */}
            <View className="bg-slate-950 rounded-2xl p-4 mb-4 border border-slate-800">
              <Text className="text-indigo-400 text-xs font-black uppercase mb-1.5">
                Description
              </Text>
              <Text className="text-slate-300 text-xs leading-5">
                {selectedCategory?.description || "No description provided."}
              </Text>
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  const cat = selectedCategory;
                  setSelectedCategory(null);
                  if (cat) handleEdit(cat);
                }}
                className="flex-1 bg-blue-600 rounded-2xl py-3.5 items-center flex-row justify-center"
              >
                <Pencil size={15} color="#fff" />
                <Text className="text-white font-black text-xs uppercase ml-1.5">
                  Edit Category
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  const cat = selectedCategory;
                  setSelectedCategory(null);
                  if (cat) setDeleteConfirmation(cat);
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
              Delete Category?
            </Text>

            <Text className="text-slate-400 text-sm mt-2 leading-5">
              Are you sure you want to permanently delete category{" "}
              <Text className="text-white font-bold">{deleteConfirmation?.name}</Text>?
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

export default Categories;
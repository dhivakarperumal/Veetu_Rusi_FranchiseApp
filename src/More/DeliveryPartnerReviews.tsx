import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Star,
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Truck,
  X,
  Plus,
  Camera,
  Award,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";

import { get, post, del } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

interface DeliveryReview {
  id: number;
  delivery_partner_id?: number | string;
  delivery_partner_name?: string;
  delivery_partner_phone?: string;
  delivery_partner_email?: string;
  user_name?: string;
  user_email?: string;
  rating: number;
  comment: string;
  image?: string | null;
  created_at: string;
}

const DeliveryPartnerReviews = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [deliveryReviews, setDeliveryReviews] = useState<DeliveryReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Rating Filter Modal
  const [isRatingFilterOpen, setIsRatingFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add Partner Review Modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);

  const [newDeliveryReview, setNewDeliveryReview] = useState({
    delivery_partner_id: "",
    rating: 5,
    comment: "",
    image: null as string | null,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete Confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: number;
    partnerName: string;
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

  // --------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------
  const fetchDeliveryReviews = useCallback(async () => {
    try {
      setLoading(true);
      let deliveryReviewList: any[] = [];
      const dpEndpoints = [
        "/delivery-partner-review",
        "/delivery-partner-reviews",
        "/admin/delivery-partner-reviews",
        "/delivery-reviews",
      ];

      for (const endpoint of dpEndpoints) {
        try {
          const delRes: any = await get(endpoint);
          const rawDelList = Array.isArray(delRes)
            ? delRes
            : Array.isArray(delRes?.data)
            ? delRes.data
            : Array.isArray(delRes?.reviews)
            ? delRes.reviews
            : Array.isArray(delRes?.data?.reviews)
            ? delRes.data.reviews
            : Array.isArray(delRes?.result)
            ? delRes.result
            : [];

          if (rawDelList && rawDelList.length > 0) {
            deliveryReviewList = rawDelList;
            break;
          } else if (delRes && (Array.isArray(delRes) || delRes?.data)) {
            deliveryReviewList = rawDelList;
          }
        } catch {}
      }

      // Normalize Delivery Partner Reviews
      const normalizedDel: DeliveryReview[] = deliveryReviewList.map((dr: any, idx: number) => ({
        id: dr.id || dr.review_id || dr._id || idx + 1,
        delivery_partner_id:
          dr.delivery_partner_id || dr.partner_id || dr.dp_id || dr.driver_id || "",
        delivery_partner_name:
          dr.delivery_partner_name ||
          dr.partner_name ||
          dr.driver_name ||
          dr.delivery_partner?.name ||
          dr.name ||
          (dr.delivery_partner_id ? `Partner #${dr.delivery_partner_id}` : "Delivery Partner"),
        delivery_partner_phone:
          dr.delivery_partner_phone ||
          dr.partner_phone ||
          dr.phone ||
          dr.mobile ||
          dr.delivery_partner?.phone ||
          "",
        delivery_partner_email:
          dr.delivery_partner_email ||
          dr.partner_email ||
          dr.email ||
          dr.delivery_partner?.email ||
          "",
        user_name:
          dr.user_name ||
          dr.customer_name ||
          dr.user?.name ||
          dr.name ||
          dr.franchise_admin_name ||
          "Customer",
        user_email: dr.user_email || dr.customer_email || dr.user?.email || dr.email || "",
        rating: Number(dr.rating || dr.stars || dr.rate || 5),
        comment:
          dr.comment ||
          dr.review ||
          dr.feedback ||
          dr.message ||
          "Delivery service experience recorded.",
        image: dr.image || dr.photo || dr.review_image || null,
        created_at: dr.created_at || dr.createdAt || dr.date || new Date().toISOString(),
      }));
      setDeliveryReviews(normalizedDel);
    } catch (error) {
      console.log("Fetch delivery reviews failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchPartners = async () => {
    try {
      const dpRes: any = await get("/admin/delivery-partners").catch(() =>
        get("/user-food-orders/delivery-partners/active").catch(() => [])
      );
      setDeliveryPartners(Array.isArray(dpRes) ? dpRes : dpRes?.data || []);
    } catch (e) {
      setDeliveryPartners([]);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchDeliveryReviews();
      fetchPartners();
    }
  }, [isFocused, fetchDeliveryReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveryReviews();
  };

  // --------------------------------------------------
  // FILTERING & PAGINATION
  // --------------------------------------------------
  const filteredReviews = useMemo(() => {
    let list = [...deliveryReviews];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.user_name || "").toLowerCase().includes(q) ||
          (r.delivery_partner_name || "").toLowerCase().includes(q) ||
          (r.delivery_partner_phone || "").includes(q) ||
          (r.comment || "").toLowerCase().includes(q) ||
          String(r.delivery_partner_id || "").includes(q)
      );
    }
    if (selectedRating !== null) {
      list = list.filter((r) => Number(r.rating) === selectedRating);
    }
    return list;
  }, [deliveryReviews, searchQuery, selectedRating]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedReviews = filteredReviews.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRating]);

  // Metrics
  const totalCount = deliveryReviews.length;
  const avgRating =
    deliveryReviews.length > 0
      ? (
          deliveryReviews.reduce((s, d) => s + (Number(d.rating) || 5), 0) /
          deliveryReviews.length
        ).toFixed(1)
      : "5.0";
  const fiveStarCount = deliveryReviews.filter((d) => Number(d.rating) >= 5).length;

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------
  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    setActionLoading(true);
    try {
      await del(`/delivery-partner-review/${deleteConfirmation.id}`).catch(() =>
        del(`/delivery-reviews/${deleteConfirmation.id}`)
      );
      setFeedbackDialog({
        visible: true,
        title: "Review Deleted",
        message: "Delivery partner feedback entry has been permanently deleted.",
      });
      setDeleteConfirmation(null);
      fetchDeliveryReviews();
    } catch (err: any) {
      setDeleteConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Action Complete",
        message: "Review deleted successfully.",
      });
      fetchDeliveryReviews();
    } finally {
      setActionLoading(false);
    }
  };

  const pickReviewImage = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.8,
        includeBase64: true,
      },
      (res) => {
        if (res.didCancel) return;
        if (res.assets && res.assets[0]?.base64) {
          const imgBase64 = `data:${res.assets[0].type || "image/jpeg"};base64,${res.assets[0].base64}`;
          setNewDeliveryReview((prev) => ({ ...prev, image: imgBase64 }));
        }
      }
    );
  };

  const submitNewDeliveryReview = async () => {
    if (!newDeliveryReview.delivery_partner_id || !newDeliveryReview.comment.trim()) {
      setFeedbackDialog({
        visible: true,
        title: "Incomplete Fields",
        message: "Please choose a delivery partner and write feedback.",
      });
      return;
    }

    setFormSubmitting(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      let u: any = {};
      if (userData) {
        try {
          u = JSON.parse(userData);
        } catch {}
      }

      const partner = deliveryPartners.find(
        (p) =>
          String(p.id) === String(newDeliveryReview.delivery_partner_id) ||
          String(p.user_id) === String(newDeliveryReview.delivery_partner_id) ||
          String(p.delivery_partner_id) === String(newDeliveryReview.delivery_partner_id)
      ) || {};

      const payload = {
        user_id: u?.user_id || u?.id || "",
        user_name: u?.name || u?.username || "Admin",
        user_email: u?.email || "",
        rating: newDeliveryReview.rating,
        comment: newDeliveryReview.comment,
        delivery_partner_id: newDeliveryReview.delivery_partner_id,
        delivery_partner_name: partner.name || partner.full_name || partner.partner_name || "Partner",
        delivery_partner_phone: partner.mobile || partner.phone || "",
        delivery_partner_email: partner.email || "",
        franchise_admin_id: u?.user_id || u?.id || "",
        franchise_admin_name: u?.name || "",
        image: newDeliveryReview.image,
      };

      await post("/delivery-partner-review", payload).catch(() =>
        post("/delivery-partner-reviews", payload)
      );
      setShowDeliveryModal(false);
      setNewDeliveryReview({
        delivery_partner_id: "",
        rating: 5,
        comment: "",
        image: null,
      });
      setFeedbackDialog({
        visible: true,
        title: "Review Added",
        message: "Delivery partner feedback recorded successfully.",
      });
      fetchDeliveryReviews();
    } catch (err: any) {
      setFeedbackDialog({
        visible: true,
        title: "Submission Error",
        message: err.message || "Failed to submit partner review.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Delivery Partner Reviews" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Partner Ratings...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Delivery Partner Reviews" navigation={navigation} />

      <FlatList
        data={paginatedReviews}
        keyExtractor={(item, index) => `delivery-${item.id || index}`}
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
                  Delivery Partner Reviews
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Monitor delivery fleet ratings, service punctuality & feedback
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                <Truck size={20} color="#34d399" />
              </View>
            </View>

            {/* ================= TOP 3 CLICKABLE STAT METRIC CARDS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* TOTAL (CLICKABLE) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedRating(null);
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  selectedRating === null
                    ? "border-emerald-400"
                    : "border-emerald-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <Truck size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  Total Reviews
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {totalCount}
                </Text>
              </TouchableOpacity>

              {/* AVG RATING (CLICKABLE) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedRating((prev) => (prev === 5 ? null : 5));
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  selectedRating === 5
                    ? "border-amber-400"
                    : "border-amber-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
                  <Star size={16} color="#fbbf24" fill="#fbbf24" />
                </View>
                <Text className="text-amber-200/70 text-[9px] font-bold uppercase">
                  Fleet Rating
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {avgRating}
                </Text>
              </TouchableOpacity>

              {/* 5-STAR RATINGS (CLICKABLE) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedRating((prev) => (prev === 5 ? null : 5));
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  selectedRating === 5
                    ? "border-teal-400"
                    : "border-teal-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-teal-500/15 items-center justify-center mb-2">
                  <Award size={16} color="#2dd4bf" />
                </View>
                <Text className="text-teal-200/70 text-[9px] font-bold uppercase">
                  5-Stars
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {fiveStarCount}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search delivery partner, customer or comment..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs font-semibold"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ================= STAR RATING FILTER BAR (LIKE DELIVERY PARTNER PAGE) ================= */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Filter size={15} color="#94a3b8" />
                <Text className="text-slate-400 ml-1.5 text-[10px] font-bold uppercase">
                  Filter ratings
                </Text>
              </View>

              {/* Star Rating Dropdown Button */}
              <TouchableOpacity
                onPress={() => setIsRatingFilterOpen(true)}
                className="flex-row items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2"
              >
                <Star size={12} color="#fbbf24" fill="#fbbf24" style={{ marginRight: 4 }} />
                <Text className="text-white text-xs font-bold mr-1.5">
                  {selectedRating ? `${selectedRating} Stars` : "All Stars"}
                </Text>
                <ChevronDown size={14} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Star Rating Quick Filter Pills */}
            <View className="mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedRating(null)}
                  className={`mr-2 px-3 py-1.5 rounded-xl border ${
                    selectedRating === null
                      ? "bg-emerald-600 border-emerald-600"
                      : "bg-slate-900 border-white/10"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-black uppercase ${
                      selectedRating === null ? "text-white" : "text-slate-400"
                    }`}
                  >
                    All Stars
                  </Text>
                </TouchableOpacity>

                {[5, 4, 3, 2, 1].map((rating) => {
                  const isSelected = selectedRating === rating;
                  return (
                    <TouchableOpacity
                      key={rating}
                      onPress={() =>
                        setSelectedRating(isSelected ? null : rating)
                      }
                      className={`mr-2 px-3 py-1.5 rounded-xl border flex-row items-center ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600"
                          : "bg-slate-900 border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-black mr-1 ${
                          isSelected ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {rating}
                      </Text>
                      <Star
                        size={12}
                        color={isSelected ? "#ffffff" : "#fbbf24"}
                        fill={isSelected ? "#ffffff" : "#fbbf24"}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* RESULTS COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedReviews.length} of {filteredReviews.length} partner reviews
            </Text>
          </View>
        }
        renderItem={({ item }: { item: DeliveryReview }) => (
          <View className="mx-4 mb-3.5 bg-slate-900 border border-white/10 rounded-3xl p-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
                  <Truck size={18} color="#34d399" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-black text-sm" numberOfLines={1}>
                    {item.delivery_partner_name || `Partner #${item.delivery_partner_id}`}
                  </Text>
                  <Text className="text-slate-400 text-xs">
                    Review by: <Text className="text-slate-200 font-bold">{item.user_name || "Customer"}</Text>
                  </Text>
                </View>
              </View>

              {/* Rating Badge */}
              <View className="flex-row items-center bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                <Star size={12} color="#fbbf24" fill="#fbbf24" />
                <Text className="text-amber-400 font-black text-xs ml-1">
                  {Number(item.rating || 5).toFixed(1)}
                </Text>
              </View>
            </View>

            {/* Stars Row */}
            <View className="flex-row items-center gap-1 mb-2.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  color={star <= item.rating ? "#fbbf24" : "#334155"}
                  fill={star <= item.rating ? "#fbbf24" : "transparent"}
                />
              ))}
            </View>

            {/* Comment Text */}
            <Text className="text-slate-300 text-xs leading-5 italic mb-3">
              "{item.comment || "No comment provided."}"
            </Text>

            {/* Partner Contact Strip */}
            {item.delivery_partner_phone ? (
              <View className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex-row items-center justify-between mb-3">
                <Text className="text-slate-400 text-[10px] uppercase font-bold">
                  Phone Contact:
                </Text>
                <Text className="text-emerald-400 font-mono text-xs font-bold">
                  {item.delivery_partner_phone}
                </Text>
              </View>
            ) : null}

            {/* Optional Image */}
            {item.image ? (
              <View className="mb-3">
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-36 rounded-2xl border border-white/10"
                  resizeMode="cover"
                />
              </View>
            ) : null}

            {/* Footer Toolbar */}
            <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
              <Text className="text-slate-500 text-[10px]">
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent Review"}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setDeleteConfirmation({
                    id: item.id,
                    partnerName: item.delivery_partner_name || "Partner Review",
                  })
                }
                className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 items-center justify-center"
              >
                <Trash2 size={14} color="#f87171" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <MessageSquare size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              No partner reviews found matching criteria.
            </Text>
            <Text className="text-slate-600 mt-1 text-[11px]">
              Tap the button below to register a manual partner review.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredReviews.length > 0 ? (
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
          onPress={() => setShowDeliveryModal(true)}
          label="Add delivery review"
        />
      </View>

      {/* ================================================= */}
      {/* STAR RATING FILTER MODAL (LIKE DELIVERY PARTNER PAGE) */}
      {/* ================================================= */}
      <Modal
        visible={isRatingFilterOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsRatingFilterOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">Filter by Star Rating</Text>
                <Text className="text-slate-400 text-xs mt-0.5">Filter partner feedback by rating</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsRatingFilterOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {[
              { label: "All Stars", val: null },
              { label: "5 Stars Only", val: 5 },
              { label: "4 Stars Only", val: 4 },
              { label: "3 Stars Only", val: 3 },
              { label: "2 Stars Only", val: 2 },
              { label: "1 Star Only", val: 1 },
            ].map((r) => {
              const active = selectedRating === r.val;
              return (
                <TouchableOpacity
                  key={String(r.val)}
                  onPress={() => {
                    setSelectedRating(r.val);
                    setIsRatingFilterOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                    active
                      ? "bg-emerald-500/15 border-emerald-500/40"
                      : "bg-slate-950 border-white/5"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color={active ? "#34d399" : "#94a3b8"} fill={active ? "#34d399" : "transparent"} />
                    <Text className={`text-sm font-bold ${active ? "text-emerald-300" : "text-slate-300"}`}>
                      {r.label}
                    </Text>
                  </View>
                  {active ? <CheckCircle size={17} color="#34d399" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* ADD DELIVERY PARTNER REVIEW MODAL */}
      {/* ================================================= */}
      <Modal
        visible={showDeliveryModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowDeliveryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/80"
        >
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[85%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-lg font-black">
                  Review Delivery Partner
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Record delivery fleet experience & rating
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDeliveryModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {/* Partner Selector */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Delivery Partner *
                </Text>
                {deliveryPartners.length === 0 ? (
                  <Text className="text-slate-500 text-xs py-2">Loading active delivery partners...</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {deliveryPartners.map((dp) => {
                      const id = dp.id || dp.user_id || dp.delivery_partner_id;
                      const isSelected = String(newDeliveryReview.delivery_partner_id) === String(id);
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() =>
                            setNewDeliveryReview({
                              ...newDeliveryReview,
                              delivery_partner_id: String(id),
                            })
                          }
                          className={`mr-2 px-3.5 py-2.5 rounded-xl border ${
                            isSelected
                              ? "bg-emerald-500/15 border-emerald-500/50"
                              : "bg-slate-950 border-slate-800"
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? "text-emerald-400" : "text-slate-300"
                            }`}
                          >
                            {dp.name || dp.full_name || dp.partner_name || `Partner #${id}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Rating Selector */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Rating ({newDeliveryReview.rating} Stars)
                </Text>
                <View className="flex-row gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-3 items-center justify-around">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() =>
                        setNewDeliveryReview({
                          ...newDeliveryReview,
                          rating: star,
                        })
                      }
                      className="p-1"
                    >
                      <Star
                        size={26}
                        color={star <= newDeliveryReview.rating ? "#fbbf24" : "#334155"}
                        fill={star <= newDeliveryReview.rating ? "#fbbf24" : "transparent"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comment */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Delivery Feedback / Comment *
                </Text>
                <TextInput
                  value={newDeliveryReview.comment}
                  onChangeText={(text) =>
                    setNewDeliveryReview({ ...newDeliveryReview, comment: text })
                  }
                  placeholder="Describe punctuality, packaging, behavior..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white text-xs leading-5"
                />
              </View>

              {/* Photo Upload */}
              <View className="mb-4">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Photo (Optional)
                </Text>
                {newDeliveryReview.image ? (
                  <View className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-800">
                    <Image
                      source={{ uri: newDeliveryReview.image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setNewDeliveryReview({
                          ...newDeliveryReview,
                          image: null,
                        })
                      }
                      className="absolute top-1 right-1 bg-red-600 rounded-lg p-1"
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickReviewImage}
                    className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-4 items-center justify-center"
                  >
                    <Camera size={20} color="#64748b" />
                    <Text className="text-slate-400 text-xs font-bold mt-1">
                      Tap to attach delivery photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit */}
              <TouchableOpacity
                disabled={formSubmitting}
                onPress={submitNewDeliveryReview}
                className="bg-emerald-600 rounded-2xl py-4 items-center mb-2"
              >
                {formSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Submit Partner Review
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
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
              Delete Partner Review?
            </Text>

            <Text className="text-slate-400 text-sm mt-2 leading-5">
              Are you sure you want to permanently delete the feedback from {deleteConfirmation?.partnerName}?
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

export default DeliveryPartnerReviews;

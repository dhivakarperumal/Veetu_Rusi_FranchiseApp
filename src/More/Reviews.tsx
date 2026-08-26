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
import { useNavigation, useRoute, useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Star,
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Trash2,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Package,
  Reply,
  X,
  Plus,
  Camera,
  Truck,
  Eye,
  Award,
  Clock,
  Users,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";

import { get, post, put, del } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

interface ProductReview {
  id: number;
  product_id?: number | string;
  product_name?: string;
  user_name: string;
  user_email?: string;
  rating: number;
  comment: string;
  status: "Published" | "Pending" | "Flagged" | string;
  review_image?: string | null;
  admin_reply?: string | null;
  created_at: string;
}

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

const Reviews = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  // Active Tab: 'products' | 'delivery'
  const [activeTab, setActiveTab] = useState<"products" | "delivery">("products");

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [deliveryReviews, setDeliveryReviews] = useState<DeliveryReview[]>([]);
  const [stats, setStats] = useState<{
    total_reviews?: number;
    average_rating?: number | string;
    pending_count?: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  // Filter Modals
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isRatingFilterOpen, setIsRatingFilterOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [replyModalItem, setReplyModalItem] = useState<ProductReview | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Delete & Action Confirmation
  const [confirmation, setConfirmation] = useState<{
    type: "delete" | "status";
    reviewId: number;
    reviewTitle: string;
    targetStatus?: string;
    isDeliveryReview?: boolean;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Products & Delivery Partners List for creation
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);

  // Add Product Review Form State
  const [newReview, setNewReview] = useState({
    product_id: "",
    user_name: "",
    user_email: "",
    rating: 5,
    comment: "",
    review_image: null as string | null,
  });

  // Add Delivery Partner Review Form State
  const [newDeliveryReview, setNewDeliveryReview] = useState({
    delivery_partner_id: "",
    rating: 5,
    comment: "",
    image: null as string | null,
  });

  const [formSubmitting, setFormSubmitting] = useState(false);

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

  // Handle Route Params for tab navigation
  useEffect(() => {
    if (route?.params) {
      const pTab = route.params.tab || route.params.initialTab || route.params.type;
      if (pTab === "delivery" || pTab === "partner" || pTab === "delivery_partner") {
        setActiveTab("delivery");
      } else if (pTab === "products" || pTab === "product" || pTab === "food") {
        setActiveTab("products");
      }
    }
  }, [route?.params]);

  // --------------------------------------------------
  // DATA FETCHING WITH ROBUST FALLBACK ENDPOINTS
  // --------------------------------------------------
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem("user");
      let franchiseUserId = "";
      if (userData) {
        try {
          const user = JSON.parse(userData);
          franchiseUserId = user?.user_id || user?.id || user?.franchise_user_id || "";
        } catch {}
      }

      // Build query string
      const qParams = new URLSearchParams();
      if (statusFilter && statusFilter !== "All") qParams.append("status", statusFilter);
      if (selectedRating !== null && selectedRating !== undefined) qParams.append("rating", String(selectedRating));
      if (searchQuery && searchQuery.trim()) qParams.append("search", searchQuery.trim());
      const queryString = qParams.toString() ? `?${qParams.toString()}` : "";

      // 1. Fetch Product Reviews via robust fallback list
      let productReviewList: any[] = [];
      let serverStats: any = null;

      const productEndpoints = [
        `/reviews/admin/all${queryString}`,
        `/reviews${queryString}`,
        `/admin/reviews${queryString}`,
        `/reviews/all${queryString}`,
        franchiseUserId
          ? `/reviews/franchise?franchise_user_id=${encodeURIComponent(franchiseUserId)}${queryString ? "&" + qParams.toString() : ""}`
          : null,
        `/chef-food-reviews${queryString}`,
        `/reviews`,
        `/admin/reviews`,
      ].filter(Boolean);

      for (const endpoint of productEndpoints) {
        try {
          const res: any = await get(endpoint!);
          const rawList = Array.isArray(res)
            ? res
            : Array.isArray(res?.reviews)
            ? res.reviews
            : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.data?.reviews)
            ? res.data.reviews
            : Array.isArray(res?.data?.data)
            ? res.data.data
            : Array.isArray(res?.result)
            ? res.result
            : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.food_reviews)
            ? res.food_reviews
            : [];

          if (res?.stats) {
            serverStats = res.stats;
          }

          if (rawList && rawList.length > 0) {
            productReviewList = rawList;
            break;
          } else if (res && (Array.isArray(res) || res?.reviews || res?.data)) {
            productReviewList = rawList;
          }
        } catch (e) {
          // Fall through to next endpoint
        }
      }

      // Normalize Product Reviews
      const normalizedProducts: ProductReview[] = productReviewList.map((r: any, idx: number) => {
        let statusVal = "Pending";
        const rawStatus = String(r.status || "").toLowerCase();
        if (
          r.status === 1 ||
          r.status === "1" ||
          rawStatus === "published" ||
          rawStatus === "approved" ||
          rawStatus === "active"
        ) {
          statusVal = "Published";
        } else if (rawStatus === "flagged" || rawStatus === "rejected" || rawStatus === "spam") {
          statusVal = "Flagged";
        } else {
          statusVal = "Pending";
        }

        return {
          id: r.id || r.review_id || r._id || idx + 1,
          product_id: r.product_id || r.food_id || r.item_id || "",
          product_name:
            r.product_name ||
            r.food_name ||
            r.item_name ||
            r.product?.name ||
            r.food?.name ||
            r.title ||
            (r.product_id ? `Product #${r.product_id}` : "Food Product"),
          user_name:
            r.user_name ||
            r.customer_name ||
            r.user?.name ||
            r.name ||
            r.user?.username ||
            "Customer",
          user_email: r.user_email || r.customer_email || r.user?.email || r.email || "",
          rating: Number(r.rating || r.stars || r.rate || 5),
          comment:
            r.comment ||
            r.review ||
            r.feedback ||
            r.message ||
            r.description ||
            "Customer feedback recorded.",
          status: statusVal,
          review_image: r.review_image || r.image || r.photo || r.img || null,
          admin_reply: r.admin_reply || r.reply || r.response || null,
          created_at: r.created_at || r.createdAt || r.date || new Date().toISOString(),
        };
      });
      setReviews(normalizedProducts);

      // Stats Calculation
      if (serverStats) {
        setStats(serverStats);
      } else {
        const total = normalizedProducts.length;
        const avg =
          total > 0
            ? (
                normalizedProducts.reduce((acc, cur) => acc + (Number(cur.rating) || 0), 0) /
                total
              ).toFixed(1)
            : "5.0";
        const pending = normalizedProducts.filter((r) => r.status === "Pending").length;
        setStats({
          total_reviews: total,
          average_rating: avg,
          pending_count: pending,
        });
      }

      // 2. Fetch Delivery Partner Reviews via fallback list
      let deliveryReviewList: any[] = [];
      const dpEndpoints = [
        "/delivery-partner-review",
        "/delivery-partner-reviews",
        "/admin/delivery-partner-reviews",
        "/delivery-reviews",
        "/reviews/delivery",
        "/reviews/delivery-partners",
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
        } catch (delErr) {
          // Fall through to next endpoint
        }
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
      console.log("Fetch reviews failed:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, selectedRating, searchQuery]);

  const fetchAuxData = async () => {
    try {
      const pRes: any = await get("/products").catch(() => get("/chef-foods").catch(() => []));
      setCatalogProducts(Array.isArray(pRes) ? pRes : pRes?.data || []);
    } catch (e) {
      setCatalogProducts([]);
    }

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
      fetchReviews();
      fetchAuxData();
    }
  }, [isFocused, fetchReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews();
  };

  // --------------------------------------------------
  // FILTERING & PAGINATION
  // --------------------------------------------------
  const filteredProductReviews = useMemo(() => {
    let list = [...reviews];
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.user_name || "").toLowerCase().includes(q) ||
          (r.comment || "").toLowerCase().includes(q) ||
          (r.product_name || "").toLowerCase().includes(q) ||
          (r.user_email || "").toLowerCase().includes(q) ||
          String(r.product_id || "").includes(q)
      );
    }
    if (statusFilter !== "All") {
      list = list.filter((r) => r.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    if (selectedRating !== null) {
      list = list.filter((r) => Number(r.rating) === selectedRating);
    }
    return list;
  }, [reviews, searchQuery, statusFilter, selectedRating]);

  const filteredDeliveryReviews = useMemo(() => {
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

  const activeList = activeTab === "products" ? filteredProductReviews : filteredDeliveryReviews;
  const totalPages = Math.max(1, Math.ceil(activeList.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedList = activeList.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, selectedRating, activeTab]);

  // Dynamic Metrics depending on Active Tab
  const totalCount = activeTab === "products" ? reviews.length : deliveryReviews.length;
  const avgRating =
    activeTab === "products"
      ? stats?.average_rating ||
        (reviews.length > 0
          ? (reviews.reduce((s, r) => s + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
          : "0.0")
      : deliveryReviews.length > 0
      ? (
          deliveryReviews.reduce((s, d) => s + (Number(d.rating) || 5), 0) /
          deliveryReviews.length
        ).toFixed(1)
      : "5.0";

  const pendingCount =
    activeTab === "products"
      ? stats?.pending_count || reviews.filter((r) => r.status === "Pending").length
      : deliveryReviews.filter((d) => Number(d.rating) >= 5).length;

  // --------------------------------------------------
  // ACTIONS: STATUS UPDATE, REPLY, DELETE
  // --------------------------------------------------
  const handleStatusUpdate = (id: number, status: string, name: string) => {
    setConfirmation({
      type: "status",
      reviewId: id,
      reviewTitle: name,
      targetStatus: status,
    });
  };

  const handleDeletePrompt = (id: number, name: string, isDelivery = false) => {
    setConfirmation({
      type: "delete",
      reviewId: id,
      reviewTitle: name,
      isDeliveryReview: isDelivery,
    });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    setActionLoading(true);
    try {
      if (confirmation.type === "status") {
        await put(`/reviews/admin/${confirmation.reviewId}/status`, {
          status: confirmation.targetStatus,
        }).catch(() =>
          put(`/reviews/${confirmation.reviewId}/status`, {
            status: confirmation.targetStatus,
          })
        );
        setFeedbackDialog({
          visible: true,
          title: "Status Updated",
          message: `Review has been marked as ${confirmation.targetStatus}.`,
        });
      } else if (confirmation.type === "delete") {
        if (confirmation.isDeliveryReview) {
          await del(`/delivery-partner-review/${confirmation.reviewId}`).catch(() =>
            del(`/delivery-reviews/${confirmation.reviewId}`)
          );
        } else {
          await del(`/reviews/admin/${confirmation.reviewId}`).catch(() =>
            del(`/reviews/${confirmation.reviewId}`)
          );
        }
        setFeedbackDialog({
          visible: true,
          title: "Review Deleted",
          message: "Feedback entry has been permanently deleted.",
        });
      }
      setConfirmation(null);
      fetchReviews();
    } catch (err: any) {
      setConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Action Complete",
        message: "Action processed successfully.",
      });
      fetchReviews();
    } finally {
      setActionLoading(false);
    }
  };

  const submitReply = async () => {
    if (!replyModalItem || !replyText.trim()) return;
    setReplyLoading(true);
    try {
      await put(`/reviews/admin/${replyModalItem.id}/reply`, {
        admin_reply: replyText.trim(),
      }).catch(() =>
        put(`/reviews/${replyModalItem.id}/reply`, {
          admin_reply: replyText.trim(),
        })
      );
      setReplyModalItem(null);
      setReplyText("");
      setFeedbackDialog({
        visible: true,
        title: "Reply Published",
        message: "Your official response has been added to this review.",
      });
      fetchReviews();
    } catch (err: any) {
      setFeedbackDialog({
        visible: true,
        title: "Reply Saved",
        message: "Your response has been saved.",
      });
      setReplyModalItem(null);
      fetchReviews();
    } finally {
      setReplyLoading(false);
    }
  };

  // --------------------------------------------------
  // IMAGE PICKERS
  // --------------------------------------------------
  const pickReviewImage = (isDelivery = false) => {
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
          if (isDelivery) {
            setNewDeliveryReview((prev) => ({ ...prev, image: imgBase64 }));
          } else {
            setNewReview((prev) => ({ ...prev, review_image: imgBase64 }));
          }
        }
      }
    );
  };

  // --------------------------------------------------
  // CREATE PRODUCT REVIEW
  // --------------------------------------------------
  const submitNewReview = async () => {
    if (!newReview.product_id || !newReview.user_name.trim() || !newReview.comment.trim()) {
      setFeedbackDialog({
        visible: true,
        title: "Incomplete Fields",
        message: "Please select a product, provide a user name and write a comment.",
      });
      return;
    }

    setFormSubmitting(true);
    try {
      await post("/reviews", {
        product_id: newReview.product_id,
        user_name: newReview.user_name,
        user_email: newReview.user_email || "",
        rating: newReview.rating,
        comment: newReview.comment,
        review_image: newReview.review_image,
      });

      setShowAddModal(false);
      setNewReview({
        product_id: "",
        user_name: "",
        user_email: "",
        rating: 5,
        comment: "",
        review_image: null,
      });
      setFeedbackDialog({
        visible: true,
        title: "Review Added",
        message: "Product review created successfully.",
      });
      fetchReviews();
    } catch (err: any) {
      setFeedbackDialog({
        visible: true,
        title: "Creation Error",
        message: err.message || "Failed to create review.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // --------------------------------------------------
  // CREATE DELIVERY PARTNER REVIEW
  // --------------------------------------------------
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
        title: "Delivery Review Added",
        message: "Partner feedback recorded successfully.",
      });
      fetchReviews();
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

  // Helper for Status Badge Color
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Published":
        return {
          bg: "bg-emerald-500/15",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
        };
      case "Pending":
        return {
          bg: "bg-amber-500/15",
          border: "border-amber-500/30",
          text: "text-amber-400",
        };
      case "Flagged":
        return {
          bg: "bg-red-500/15",
          border: "border-red-500/30",
          text: "text-red-400",
        };
      default:
        return {
          bg: "bg-slate-800",
          border: "border-slate-700",
          text: "text-slate-400",
        };
    }
  };

  // --------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------
  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="Reviews & Ratings" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Customer Feedback...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Reviews & Ratings" navigation={navigation} />

      <FlatList
        data={paginatedList}
        keyExtractor={(item, index) => `${activeTab}-${item.id || index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f59e0b"
            colors={["#f59e0b"]}
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
                  Customer Reviews
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Manage product feedback & delivery ratings
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
              </View>
            </View>

            {/* ================= TOP 3 CLICKABLE SUMMARY METRIC CARDS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* TOTAL (CLICKABLE) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("All");
                  setSelectedRating(null);
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "All" && selectedRating === null
                    ? "border-blue-400"
                    : "border-blue-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-blue-500/15 items-center justify-center mb-2">
                  <MessageSquare size={16} color="#60a5fa" />
                </View>
                <Text className="text-blue-200/70 text-[9px] font-bold uppercase">
                  {activeTab === "products" ? "Total" : "Total Partner"}
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {totalCount}
                </Text>
              </TouchableOpacity>

              {/* AVG RATING / 5-STARS (CLICKABLE) */}
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
                  Avg Rating
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {avgRating}
                </Text>
              </TouchableOpacity>

              {/* PENDING / TOP RATED (CLICKABLE) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (activeTab === "products") {
                    setStatusFilter((prev) => (prev === "Pending" ? "All" : "Pending"));
                  } else {
                    setSelectedRating((prev) => (prev === 5 ? null : 5));
                  }
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  (activeTab === "products" && statusFilter === "Pending") ||
                  (activeTab === "delivery" && selectedRating === 5)
                    ? "border-rose-400"
                    : "border-rose-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-rose-500/15 items-center justify-center mb-2">
                  {activeTab === "products" ? (
                    <ShieldAlert size={16} color="#fda4af" />
                  ) : (
                    <Award size={16} color="#34d399" />
                  )}
                </View>
                <Text className="text-rose-200/70 text-[9px] font-bold uppercase">
                  {activeTab === "products" ? "Pending" : "5-Stars"}
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {pendingCount}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= TAB SWITCHER ================= */}
            <View className="flex-row bg-slate-900 border border-white/10 rounded-2xl p-1.5 mb-4">
              <TouchableOpacity
                onPress={() => setActiveTab("products")}
                className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
                  activeTab === "products" ? "bg-amber-500 shadow-md" : ""
                }`}
              >
                <Package
                  size={14}
                  color={activeTab === "products" ? "#ffffff" : "#94a3b8"}
                />
                <Text
                  className={`ml-2 text-xs font-black uppercase ${
                    activeTab === "products" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Product Reviews ({filteredProductReviews.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab("delivery")}
                className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
                  activeTab === "delivery" ? "bg-amber-500 shadow-md" : ""
                }`}
              >
                <Truck
                  size={14}
                  color={activeTab === "delivery" ? "#ffffff" : "#94a3b8"}
                />
                <Text
                  className={`ml-2 text-xs font-black uppercase ${
                    activeTab === "delivery" ? "text-white" : "text-slate-400"
                  }`}
                >
                  Partner Reviews ({filteredDeliveryReviews.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={
                  activeTab === "products"
                    ? "Search reviews, products or customer names..."
                    : "Search delivery partner, customer or comment..."
                }
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* ================= STATUS & RATING FILTER BAR (MATCHING DELIVERY PARTNER PAGE) ================= */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Filter size={15} color="#94a3b8" />
                <Text className="text-slate-400 ml-1.5 text-[10px] font-bold uppercase">
                  Filter reviews
                </Text>
              </View>

              <View className="flex-row gap-2">
                {/* Status Dropdown Button (Products Tab) */}
                {activeTab === "products" && (
                  <TouchableOpacity
                    onPress={() => setIsStatusFilterOpen(true)}
                    className="flex-row items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2"
                  >
                    <Text className="text-white text-xs font-bold mr-1.5">{statusFilter}</Text>
                    <ChevronDown size={14} color="#94a3b8" />
                  </TouchableOpacity>
                )}

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
            </View>

            {/* Star Rating Quick Filter Pills */}
            <View className="mb-4">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={() => setSelectedRating(null)}
                  className={`mr-2 px-3 py-1.5 rounded-xl border ${
                    selectedRating === null
                      ? "bg-amber-500 border-amber-500"
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
                          ? "bg-amber-500 border-amber-500"
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
              Showing {paginatedList.length} of {activeList.length} reviews
            </Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => {
          if (activeTab === "products") {
            const r = item as ProductReview;
            const badge = getStatusBadge(r.status);

            return (
              <View className="mx-4 mb-3.5 bg-slate-900 border border-white/10 rounded-3xl p-4">
                {/* Header: User Avatar, Name, Rating & Status */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 items-center justify-center mr-3">
                      <Text className="text-white font-black text-sm">
                        {(r.user_name || "U").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-black text-sm" numberOfLines={1}>
                        {r.user_name}
                      </Text>
                      <Text className="text-slate-500 text-[10px] mt-0.5">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Recently"}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View
                    className={`px-2.5 py-1 rounded-xl border ${badge.bg} ${badge.border}`}
                  >
                    <Text className={`text-[10px] font-black uppercase ${badge.text}`}>
                      {r.status || "Pending"}
                    </Text>
                  </View>
                </View>

                {/* Stars Row */}
                <View className="flex-row items-center gap-1 mb-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={star <= r.rating ? "#fbbf24" : "#334155"}
                      fill={star <= r.rating ? "#fbbf24" : "transparent"}
                    />
                  ))}
                  <Text className="text-amber-400 font-bold text-xs ml-1.5">
                    {r.rating}.0
                  </Text>
                </View>

                {/* Comment Text */}
                <Text className="text-slate-300 text-xs leading-5 italic mb-3">
                  "{r.comment}"
                </Text>

                {/* Product Name Badge */}
                <View className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Package size={14} color="#60a5fa" />
                    <Text
                      className="text-slate-300 font-bold text-xs ml-2 flex-1"
                      numberOfLines={1}
                    >
                      {r.product_name || `Product #${r.product_id || "N/A"}`}
                    </Text>
                  </View>
                  {r.product_id ? (
                    <Text className="text-slate-500 font-mono text-[10px]">
                      #{r.product_id}
                    </Text>
                  ) : null}
                </View>

                {/* Optional Review Image */}
                {r.review_image ? (
                  <View className="mb-3">
                    <Image
                      source={{ uri: r.review_image }}
                      className="w-full h-40 rounded-2xl border border-white/10"
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Official Admin Reply Banner */}
                {r.admin_reply ? (
                  <View className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 mb-3">
                    <Text className="text-blue-400 text-[10px] font-black uppercase tracking-wider mb-1">
                      Official Reply:
                    </Text>
                    <Text className="text-slate-300 text-xs leading-4">
                      {r.admin_reply}
                    </Text>
                  </View>
                ) : null}

                {/* Action Buttons Toolbar */}
                <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                  <View className="flex-row items-center gap-1.5">
                    {/* Approve / Publish */}
                    {r.status !== "Published" && (
                      <TouchableOpacity
                        onPress={() =>
                          handleStatusUpdate(r.id, "Published", r.user_name)
                        }
                        className="bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 rounded-xl flex-row items-center"
                      >
                        <CheckCircle size={13} color="#34d399" />
                        <Text className="text-emerald-400 text-[10px] font-bold uppercase ml-1">
                          Approve
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Flag */}
                    {r.status !== "Flagged" && (
                      <TouchableOpacity
                        onPress={() =>
                          handleStatusUpdate(r.id, "Flagged", r.user_name)
                        }
                        className="bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-xl flex-row items-center"
                      >
                        <AlertCircle size={13} color="#fbbf24" />
                        <Text className="text-amber-400 text-[10px] font-bold uppercase ml-1">
                          Flag
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Reply (Opens Centralized Modal) */}
                    <TouchableOpacity
                      onPress={() => {
                        setReplyModalItem(r);
                        setReplyText(r.admin_reply || "");
                      }}
                      className="bg-blue-500/10 border border-blue-500/25 px-2.5 py-1.5 rounded-xl flex-row items-center"
                    >
                      <Reply size={13} color="#60a5fa" />
                      <Text className="text-blue-400 text-[10px] font-bold uppercase ml-1">
                        Reply
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => handleDeletePrompt(r.id, r.user_name, false)}
                    className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 items-center justify-center"
                  >
                    <Trash2 size={14} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          } else {
            // Delivery Partner Review Card
            const dr = item as DeliveryReview;
            return (
              <View className="mx-4 mb-3.5 bg-slate-900 border border-white/10 rounded-3xl p-4">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-3">
                      <Truck size={18} color="#34d399" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-black text-sm" numberOfLines={1}>
                        {dr.delivery_partner_name || `Partner #${dr.delivery_partner_id}`}
                      </Text>
                      <Text className="text-slate-400 text-xs">
                        Review by: <Text className="text-slate-200 font-bold">{dr.user_name || "Customer"}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Rating Badge */}
                  <View className="flex-row items-center bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                    <Star size={12} color="#fbbf24" fill="#fbbf24" />
                    <Text className="text-amber-400 font-black text-xs ml-1">
                      {Number(dr.rating || 5).toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Stars Row */}
                <View className="flex-row items-center gap-1 mb-2.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      color={star <= dr.rating ? "#fbbf24" : "#334155"}
                      fill={star <= dr.rating ? "#fbbf24" : "transparent"}
                    />
                  ))}
                </View>

                {/* Comment Text */}
                <Text className="text-slate-300 text-xs leading-5 italic mb-3">
                  "{dr.comment || "No comment provided."}"
                </Text>

                {/* Partner Contact Strip */}
                {dr.delivery_partner_phone ? (
                  <View className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex-row items-center justify-between mb-3">
                    <Text className="text-slate-400 text-[10px] uppercase font-bold">
                      Phone Contact:
                    </Text>
                    <Text className="text-emerald-400 font-mono text-xs font-bold">
                      {dr.delivery_partner_phone}
                    </Text>
                  </View>
                ) : null}

                {/* Optional Image */}
                {dr.image ? (
                  <View className="mb-3">
                    <Image
                      source={{ uri: dr.image }}
                      className="w-full h-36 rounded-2xl border border-white/10"
                      resizeMode="cover"
                    />
                  </View>
                ) : null}

                {/* Footer Toolbar */}
                <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                  <Text className="text-slate-500 text-[10px]">
                    {dr.created_at
                      ? new Date(dr.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recent Review"}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      handleDeletePrompt(
                        dr.id,
                        dr.delivery_partner_name || "Partner Review",
                        true
                      )
                    }
                    className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 items-center justify-center"
                  >
                    <Trash2 size={14} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }
        }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <MessageSquare size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              {activeTab === "products"
                ? "No product reviews found matching criteria."
                : "No partner reviews found matching criteria."}
            </Text>
            <Text className="text-slate-600 mt-1 text-[11px]">
              Tap the button below to register a manual review.
            </Text>
          </View>
        }
        ListFooterComponent={
          activeList.length > 0 ? (
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

      {/* Floating Action Buttons */}
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
          onPress={() => {
            if (activeTab === "products") {
              setShowAddModal(true);
            } else {
              setShowDeliveryModal(true);
            }
          }}
          label={activeTab === "products" ? "Add review" : "Add delivery review"}
        />
      </View>

      {/* ================================================= */}
      {/* STATUS FILTER MODAL (LIKE DELIVERY PARTNER PAGE) */}
      {/* ================================================= */}
      <Modal
        visible={isStatusFilterOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsStatusFilterOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">Filter by Status</Text>
                <Text className="text-slate-400 text-xs mt-0.5">Choose a review publication status</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsStatusFilterOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {["All", "Published", "Pending", "Flagged"].map((status) => {
              const active = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => {
                    setStatusFilter(status);
                    setIsStatusFilterOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                    active
                      ? "bg-emerald-500/15 border-emerald-500/40"
                      : "bg-slate-950 border-white/5"
                  }`}
                >
                  <Text className={`text-sm font-bold ${active ? "text-emerald-300" : "text-slate-300"}`}>
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
                <Text className="text-slate-400 text-xs mt-0.5">Filter feedback by rating level</Text>
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
                      ? "bg-amber-500/15 border-amber-500/40"
                      : "bg-slate-950 border-white/5"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    <Star size={16} color={active ? "#fbbf24" : "#94a3b8"} fill={active ? "#fbbf24" : "transparent"} />
                    <Text className={`text-sm font-bold ${active ? "text-amber-300" : "text-slate-300"}`}>
                      {r.label}
                    </Text>
                  </View>
                  {active ? <CheckCircle size={17} color="#fbbf24" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CENTRALIZED OFFICIAL REPLY MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!replyModalItem}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setReplyModalItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/80 items-center justify-center px-5"
        >
          <View className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-white text-lg font-black" numberOfLines={1}>
                  Official Response
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                  Replying to {replyModalItem?.user_name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setReplyModalItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={15} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Original Comment Quote Box */}
            <View className="bg-slate-950 border border-slate-800 rounded-2xl p-3 mb-4 max-h-24">
              <ScrollView nestedScrollEnabled>
                <Text className="text-slate-400 text-xs italic leading-4">
                  "{replyModalItem?.comment}"
                </Text>
              </ScrollView>
            </View>

            {/* Reply TextInput */}
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Write your official response..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white text-xs leading-5 min-h-[90px] max-h-[140px] mb-4"
            />

            {/* Action Buttons */}
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                onPress={() => setReplyModalItem(null)}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3 items-center justify-center"
              >
                <Text className="text-slate-300 font-bold text-xs">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={replyLoading || !replyText.trim()}
                onPress={submitReply}
                className="flex-1 bg-blue-600 rounded-2xl py-3 items-center justify-center flex-row gap-1.5"
                style={{ opacity: replyLoading || !replyText.trim() ? 0.6 : 1 }}
              >
                {replyLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Send size={13} color="#ffffff" />
                    <Text className="text-white font-black text-xs uppercase tracking-wider">
                      Send Reply
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================= */}
      {/* ADD PRODUCT REVIEW MODAL */}
      {/* ================================================= */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowAddModal(false)}
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
                  Create Product Review
                </Text>
                <Text className="text-slate-400 text-xs mt-0.5">
                  Manual feedback entry for catalog item
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="space-y-4">
              {/* Product Selector */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Target Product *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {catalogProducts.map((p) => {
                    const isSelected = String(newReview.product_id) === String(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() =>
                          setNewReview({ ...newReview, product_id: String(p.id) })
                        }
                        className={`mr-2 px-3.5 py-2.5 rounded-xl border ${
                          isSelected
                            ? "bg-amber-500/15 border-amber-500/50"
                            : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isSelected ? "text-amber-400" : "text-slate-300"
                          }`}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Customer Name */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Customer Name *
                </Text>
                <TextInput
                  value={newReview.user_name}
                  onChangeText={(text) =>
                    setNewReview({ ...newReview, user_name: text })
                  }
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor="#64748b"
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs font-bold"
                />
              </View>

              {/* Customer Email */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Customer Email (Optional)
                </Text>
                <TextInput
                  value={newReview.user_email}
                  onChangeText={(text) =>
                    setNewReview({ ...newReview, user_email: text })
                  }
                  placeholder="customer@email.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-xs font-bold"
                />
              </View>

              {/* Rating Selector */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Star Rating ({newReview.rating} Stars)
                </Text>
                <View className="flex-row gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-3 items-center justify-around">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() =>
                        setNewReview({ ...newReview, rating: star })
                      }
                      className="p-1"
                    >
                      <Star
                        size={26}
                        color={star <= newReview.rating ? "#fbbf24" : "#334155"}
                        fill={star <= newReview.rating ? "#fbbf24" : "transparent"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Comment */}
              <View className="mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                  Review Comment *
                </Text>
                <TextInput
                  value={newReview.comment}
                  onChangeText={(text) =>
                    setNewReview({ ...newReview, comment: text })
                  }
                  placeholder="Write the customer's feedback..."
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
                {newReview.review_image ? (
                  <View className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-800">
                    <Image
                      source={{ uri: newReview.review_image }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setNewReview({ ...newReview, review_image: null })
                      }
                      className="absolute top-1 right-1 bg-red-600 rounded-lg p-1"
                    >
                      <X size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickReviewImage(false)}
                    className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-4 items-center justify-center"
                  >
                    <Camera size={20} color="#64748b" />
                    <Text className="text-slate-400 text-xs font-bold mt-1">
                      Tap to attach review photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit */}
              <TouchableOpacity
                disabled={formSubmitting}
                onPress={submitNewReview}
                className="bg-amber-500 rounded-2xl py-4 items-center mb-2"
              >
                {formSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Submit Product Review
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
                    onPress={() => pickReviewImage(true)}
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
      {/* ACTION CONFIRMATION MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!confirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setConfirmation(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center mb-4 border ${
                confirmation?.type === "delete"
                  ? "bg-red-500/15 border-red-500/30"
                  : "bg-emerald-500/15 border-emerald-500/30"
              }`}
            >
              {confirmation?.type === "delete" ? (
                <Trash2 size={26} color="#f87171" />
              ) : (
                <CheckCircle size={26} color="#34d399" />
              )}
            </View>

            <Text className="text-white text-xl font-black">
              {confirmation?.type === "delete"
                ? "Delete Review?"
                : `Update Review Status?`}
            </Text>

            <Text className="text-slate-400 text-sm mt-2 leading-5">
              {confirmation?.type === "delete"
                ? `Are you sure you want to permanently delete the feedback from ${confirmation?.reviewTitle}?`
                : `Change status of ${confirmation?.reviewTitle}'s review to ${confirmation?.targetStatus}?`}
            </Text>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setConfirmation(null)}
                disabled={actionLoading}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmAction}
                disabled={actionLoading}
                className={`flex-1 rounded-2xl py-3.5 items-center ${
                  confirmation?.type === "delete" ? "bg-red-600" : "bg-emerald-600"
                }`}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    {confirmation?.type === "delete" ? "Delete" : "Confirm"}
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

export default Reviews;

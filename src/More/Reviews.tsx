import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import {
  Star,
  MessageSquare,
  Package,
  Truck,
  ArrowRight,
  ShieldAlert,
  Award,
  CheckCircle,
} from "lucide-react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import InnerHeader from "../components/InnerHeader";
import { get } from "../services/api";

const Reviews = () => {
  const navigation: any = useNavigation();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({
    productReviewsCount: 0,
    deliveryReviewsCount: 0,
    avgProductRating: "5.0",
    avgDeliveryRating: "5.0",
    pendingCount: 0,
    totalReviewsCount: 0,
    overallAvgRating: "5.0",
  });

  const fetchStats = async () => {
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

      // 1. Fetch Product Reviews with fallback chain
      let productReviews: any[] = [];
      let productStats: any = null;

      const productEndpoints = [
        "/reviews/admin/all",
        "/reviews",
        "/admin/reviews",
        "/reviews/all",
        franchiseUserId ? `/reviews/franchise?franchise_user_id=${encodeURIComponent(franchiseUserId)}` : null,
        "/chef-food-reviews",
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
            : Array.isArray(res?.result)
            ? res.result
            : [];

          if (res?.stats) {
            productStats = res.stats;
          }

          if (rawList && rawList.length > 0) {
            productReviews = rawList;
            break;
          } else if (res && (Array.isArray(res) || res?.reviews || res?.data)) {
            productReviews = rawList;
          }
        } catch {}
      }

      // 2. Fetch Delivery Partner Reviews with fallback chain
      let deliveryReviews: any[] = [];
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
            : [];

          if (rawDelList && rawDelList.length > 0) {
            deliveryReviews = rawDelList;
            break;
          } else if (delRes && (Array.isArray(delRes) || delRes?.data)) {
            deliveryReviews = rawDelList;
          }
        } catch {}
      }

      // Calculations
      const prodTotal = productReviews.length;
      const delTotal = deliveryReviews.length;
      const totalReviews = prodTotal + delTotal;

      const avgProd =
        productStats?.average_rating ||
        (prodTotal > 0
          ? (productReviews.reduce((acc, cur) => acc + (Number(cur.rating) || 5), 0) / prodTotal).toFixed(1)
          : "5.0");

      const avgDel =
        delTotal > 0
          ? (deliveryReviews.reduce((acc, cur) => acc + (Number(cur.rating) || 5), 0) / delTotal).toFixed(1)
          : "5.0";

      const pending =
        productStats?.pending_count !== undefined
          ? Number(productStats.pending_count)
          : productReviews.filter(
              (r) => String(r.status || "").toLowerCase() === "pending"
            ).length;

      const combinedRatingSum =
        productReviews.reduce((acc, cur) => acc + (Number(cur.rating) || 5), 0) +
        deliveryReviews.reduce((acc, cur) => acc + (Number(cur.rating) || 5), 0);

      const overallAvg =
        totalReviews > 0 ? (combinedRatingSum / totalReviews).toFixed(1) : "5.0";

      setStats({
        productReviewsCount: prodTotal,
        deliveryReviewsCount: delTotal,
        avgProductRating: String(avgProd),
        avgDeliveryRating: String(avgDel),
        pendingCount: pending,
        totalReviewsCount: totalReviews,
        overallAvgRating: String(overallAvg),
      });
    } catch (e) {
      console.log("Reviews Hub fetch stats error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchStats();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const menuItems = [
    {
      title: "Customer Reviews",
      subtitle: "Food & product reviews, ratings, flags & official replies",
      icon: Package,
      screen: "CustomerReviews",
      color: "#f59e0b",
      badge: `${stats.productReviewsCount} Reviews`,
      avgBadge: `${stats.avgProductRating} ★`,
    },
    {
      title: "Delivery Partner Reviews",
      subtitle: "Delivery partner fleet ratings, punctuality & feedback",
      icon: Truck,
      screen: "DeliveryPartnerReviews",
      color: "#10b981",
      badge: `${stats.deliveryReviewsCount} Reviews`,
      avgBadge: `${stats.avgDeliveryRating} ★`,
    },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Reviews Hub" navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f59e0b"
            colors={["#f59e0b"]}
          />
        }
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 40,
        }}
      >
        {/* ================= HEADER ================= */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-3xl font-black">
                Reviews Hub
              </Text>
              <Text className="text-slate-400 mt-1 text-xs">
                Manage your product feedback, customer ratings & delivery fleet reviews
              </Text>
            </View>

            <View className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
              <Star size={20} color="#f59e0b" fill="#f59e0b" />
            </View>
          </View>
        </View>

        {/* ================= SUMMARY STAT CARDS ================= */}
        <View className="flex-row gap-2 px-4 mb-6">
          {/* TOTAL REVIEWS */}
          <View className="flex-1 bg-slate-900 border border-blue-400/25 rounded-2xl p-3.5">
            <View className="w-8 h-8 rounded-lg bg-blue-500/15 items-center justify-center mb-2">
              <MessageSquare size={16} color="#60a5fa" />
            </View>
            <Text className="text-blue-200/70 text-[9px] font-bold uppercase">
              Total Reviews
            </Text>
            <Text className="text-white text-2xl font-black mt-0.5">
              {loading ? "-" : stats.totalReviewsCount}
            </Text>
          </View>

          {/* AVG RATING */}
          <View className="flex-1 bg-slate-900 border border-amber-400/25 rounded-2xl p-3.5">
            <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
            </View>
            <Text className="text-amber-200/70 text-[9px] font-bold uppercase">
              Avg Rating
            </Text>
            <Text className="text-white text-2xl font-black mt-0.5">
              {loading ? "-" : stats.overallAvgRating}
            </Text>
          </View>

          {/* PENDING / ATTENTION */}
          <View className="flex-1 bg-slate-900 border border-rose-400/25 rounded-2xl p-3.5">
            <View className="w-8 h-8 rounded-lg bg-rose-500/15 items-center justify-center mb-2">
              <ShieldAlert size={16} color="#fda4af" />
            </View>
            <Text className="text-rose-200/70 text-[9px] font-bold uppercase">
              Pending
            </Text>
            <Text className="text-white text-2xl font-black mt-0.5">
              {loading ? "-" : stats.pendingCount}
            </Text>
          </View>
        </View>

        {/* ================= SECTION TITLE ================= */}
        <View className="px-4 mb-3">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-wider">
            Review Management Modules
          </Text>
        </View>

        {/* ================= MENU ITEMS ================= */}
        <View className="px-4 space-y-3">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(item.screen)}
                className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex-row items-center mb-3"
              >
                {/* ICON */}
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center border"
                  style={{
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}30`,
                  }}
                >
                  <IconComponent color={item.color} size={22} />
                </View>

                {/* TEXT */}
                <View className="flex-1 ml-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white text-base font-black">
                      {item.title}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <View className="bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded-lg">
                        <Text className="text-[10px] font-black text-amber-300">
                          {item.avgBadge}
                        </Text>
                      </View>
                      <View className="bg-slate-800 border border-white/10 px-2 py-0.5 rounded-lg">
                        <Text className="text-[10px] font-bold text-slate-300">
                          {item.badge}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text
                    className="text-slate-400 text-xs mt-1"
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                </View>

                {/* ARROW */}
                <View className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 items-center justify-center ml-2.5">
                  <ArrowRight size={16} color="#64748b" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Reviews;

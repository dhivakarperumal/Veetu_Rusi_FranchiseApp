import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";

import {
  Users,
  ShoppingBag,
  Store,
  Bike,
} from "lucide-react-native";

import { get } from "../services/api";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const data = await get("/dashboard");
      setDashboard(data);
    } catch (err) {
      console.log("Dashboard Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text className="text-white mt-3 text-base">
          Loading Dashboard...
        </Text>
      </View>
    );
  }

  const cards = dashboard?.cards || {};

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View className="p-4">

        {/* Header */}

        <Text className="text-white text-3xl font-bold">
          Dashboard
        </Text>

        <Text className="text-slate-400 mt-1 mb-6">
          Welcome Back Franchise Admin
        </Text>

        {/* Users */}

        <View className="flex-row flex-wrap justify-between">

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <Users size={28} color="#8B5CF6" />

            <Text className="text-slate-400 mt-3">
              Total Users
            </Text>

            <Text className="text-white text-2xl font-bold mt-1">
              {cards.totalUsers || 0}
            </Text>
          </View>

          {/* Orders */}

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <ShoppingBag size={28} color="#3B82F6" />

            <Text className="text-slate-400 mt-3">
              Orders
            </Text>

            <Text className="text-white text-2xl font-bold mt-1">
              {cards.totalOrders || 0}
            </Text>
          </View>

          {/* Restaurants */}

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <Store size={28} color="#10B981" />

            <Text className="text-slate-400 mt-3">
              Restaurants
            </Text>

            <Text className="text-white text-2xl font-bold mt-1">
              {cards.totalRestaurants || 0}
            </Text>
          </View>

          {/* Delivery */}

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <Bike size={28} color="#F59E0B" />

            <Text className="text-slate-400 mt-3">
              Delivery Partners
            </Text>

            <Text className="text-white text-2xl font-bold mt-1">
              {cards.totalDeliveryPartners || 0}
            </Text>
          </View>
        </View>

        {/* Revenue */}

        <View className="bg-emerald-600 rounded-3xl p-5 mt-2">
          <Text className="text-emerald-100 text-base">
            Total Revenue
          </Text>

          <Text className="text-white text-4xl font-bold mt-2">
            ₹{cards.totalRevenue || 0}
          </Text>
        </View>

        {/* Home Chef */}

        <View className="bg-slate-900 rounded-3xl p-5 mt-4">
          <Text className="text-slate-400">
            Total Home Chefs
          </Text>

          <Text className="text-white text-3xl font-bold mt-2">
            {cards.totalHomeChefs || 0}
          </Text>
        </View>

        {/* Products */}

        <View className="bg-slate-900 rounded-3xl p-5 mt-4">
          <Text className="text-slate-400">
            Total Products
          </Text>

          <Text className="text-white text-3xl font-bold mt-2">
            {cards.totalProducts || 0}
          </Text>
        </View>

        {/* Pending Approvals */}

        <View className="bg-slate-900 rounded-3xl p-5 mt-4 mb-10">
          <Text className="text-slate-400">
            Pending Approvals
          </Text>

          <Text className="text-white text-3xl font-bold mt-2">
            {cards.pendingApprovals || 0}
          </Text>
        </View>

      </View>
    </ScrollView>
  );
};

export default Dashboard;
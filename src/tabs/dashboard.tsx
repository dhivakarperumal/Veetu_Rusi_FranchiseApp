import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";

import {
  Users,
  ShoppingBag,
  Store,
  Bike,
} from "lucide-react-native";

import { LineChart } from "react-native-chart-kit";
import api from "../api";

const screenWidth = Dimensions.get("window").width;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get("/dashboard");
      setDashboard(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-3">
          Loading Dashboard...
        </Text>
      </View>
    );
  }

  const cards = dashboard?.cards || {};
  const charts = dashboard?.charts || {};

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      showsVerticalScrollIndicator={false}
    >
      <View className="p-4">

        {/* Header */}

        <Text className="text-white text-3xl font-bold mb-6">
          Dashboard
        </Text>

        {/* Cards */}

        <View className="flex-row flex-wrap justify-between">

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <Users color="#8B5CF6" size={28} />
            <Text className="text-slate-400 mt-3">
              Users
            </Text>
            <Text className="text-white text-2xl font-bold">
              {cards.totalUsers || 0}
            </Text>
          </View>

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <ShoppingBag color="#3B82F6" size={28} />
            <Text className="text-slate-400 mt-3">
              Orders
            </Text>
            <Text className="text-white text-2xl font-bold">
              {cards.totalOrders || 0}
            </Text>
          </View>

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <Store color="#10B981" size={28} />
            <Text className="text-slate-400 mt-3">
              Restaurants
            </Text>
            <Text className="text-white text-2xl font-bold">
              {cards.totalRestaurants || 0}
            </Text>
          </View>

          <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4">
            <Bike color="#F59E0B" size={28} />
            <Text className="text-slate-400 mt-3">
              Delivery
            </Text>
            <Text className="text-white text-2xl font-bold">
              {cards.totalDeliveryPartners || 0}
            </Text>
          </View>

        </View>

        {/* Revenue Card */}

        <View className="bg-emerald-600 rounded-3xl p-5 mt-2">
          <Text className="text-emerald-100">
            Total Revenue
          </Text>

          <Text className="text-white text-3xl font-bold mt-2">
            ₹{cards.totalRevenue || 0}
          </Text>
        </View>

        {/* Revenue Chart */}

        {charts?.revenueAnalytics?.length > 0 && (
          <View className="bg-slate-900 rounded-3xl mt-5 p-4">

            <Text className="text-white text-lg font-bold mb-4">
              Revenue Trends
            </Text>

            <LineChart
              data={{
                labels: charts.revenueAnalytics.map(
                  (item: any) => item.name
                ),
                datasets: [
                  {
                    data: charts.revenueAnalytics.map(
                      (item: any) => item.revenue
                    ),
                  },
                ],
              }}
              width={screenWidth - 64}
              height={220}
              bezier
              chartConfig={{
                backgroundGradientFrom: "#0f172a",
                backgroundGradientTo: "#0f172a",
                decimalPlaces: 0,
                color: (opacity = 1) =>
                  `rgba(16,185,129,${opacity})`,
                labelColor: () => "#fff",
              }}
            />
          </View>
        )}

      </View>
    </ScrollView>
  );
};

export default Dashboard;
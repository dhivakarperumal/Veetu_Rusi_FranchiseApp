import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { get } from "../services/api";

const FoodOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await get("/user-food-orders");

      setOrders(response.data || response);
    } catch (error) {
      console.log("Food Orders Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-green-400";
      case "Pending":
        return "text-yellow-400";
      case "Preparing":
        return "text-purple-400";
      case "Out for Delivery":
        return "text-orange-400";
      case "Cancelled":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const renderOrder = ({ item }: any) => (
    <TouchableOpacity className="bg-slate-900 mx-4 mb-4 p-4 rounded-xl">
      <View className="flex-row justify-between items-center">
        <Text className="text-white text-lg font-bold">
          {item.order_id}
        </Text>

        <Text className={`font-bold ${getStatusColor(item.status)}`}>
          {item.status}
        </Text>
      </View>

      <Text className="text-slate-300 mt-2">
        Customer: {item.customer_name || item.ordered_by_name}
      </Text>

      <Text className="text-slate-300">
        Amount: ₹{item.total_amount}
      </Text>

      <Text className="text-slate-400 mt-1">
        Items: {item.items?.length || 0}
      </Text>

      <Text className="text-slate-500 mt-1">
        {item.ordered_at}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-slate-950"
    >
      <View className="px-4 py-4">
        <Text className="text-white text-2xl font-bold">
          Food Orders
        </Text>

        <Text className="text-slate-400 mt-1">
          Total Orders: {orders.length}
        </Text>
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id?.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <Text className="text-center text-slate-400 mt-10">
            No Orders Found
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default FoodOrders;
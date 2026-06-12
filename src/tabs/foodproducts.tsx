import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { get } from "../services/api";

const FoodProducts = () => {
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFoods = async () => {
    try {
      const response = await get("/chef-foods");

      setFoods(response.data || response);
    } catch (error) {
      console.log("Food Products Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFoods();
  };

  const renderFood = ({ item }: any) => (
    <View className="bg-slate-900 mx-4 mb-4 rounded-xl overflow-hidden">
      {item.image && (
        <Image
          source={{ uri: item.image }}
          className="w-full h-40"
          resizeMode="cover"
        />
      )}

      <View className="p-4">
        <Text className="text-white text-lg font-bold">
          {item.name}
        </Text>

        <Text className="text-slate-400 mt-1">
          {item.category}
        </Text>

        <Text className="text-slate-300 mt-2">
          Chef: {item.chef_name || item.kitchen_name}
        </Text>

        <Text className="text-slate-300">
          Cuisine: {item.cuisine || "-"}
        </Text>

        <Text className="text-emerald-400 font-bold mt-2">
          ₹{item.final_price || item.mrp || 0}
        </Text>

        <View className="mt-3">
          <Text
            className={`font-bold ${
              item.status === "Active" ||
              item.status === "Approved"
                ? "text-green-400"
                : item.status === "Pending"
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
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
          Food Products
        </Text>

        <Text className="text-slate-400 mt-1">
          Total Products: {foods.length}
        </Text>
      </View>

      <FlatList
        data={foods}
        renderItem={renderFood}
        keyExtractor={(item) => item.id?.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <Text className="text-center text-slate-400 mt-10">
            No Food Products Found
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default FoodProducts;
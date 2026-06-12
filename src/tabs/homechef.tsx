import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { get } from "../services/api";
import { TouchableOpacity } from "react-native";

const HomeChef = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chefs, setChefs] = useState<any[]>([]);

  useEffect(() => {
    fetchHomeChefs();
  }, []);

  const fetchHomeChefs = async () => {
    try {
      const data: any = await get("/superadmin/homechefs");

      if (Array.isArray(data)) {
        setChefs(data);
      } else {
        setChefs([]);
      }
    } catch (error) {
      console.log("Home Chef Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeChefs();
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        className="flex-1 bg-slate-950"
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#14b8a6" />
          <Text className="text-white mt-3">
            Loading Home Chefs...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-slate-950"
    >

      {/* Header */}

      <View className="flex-row justify-between items-center px-4 pt-6 pb-4">
        <View>
          <Text className="text-white text-3xl font-bold">
            Home Chefs
          </Text>

          <Text className="text-slate-400 mt-1">
            Total Home Chefs: {chefs.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("AddHomeChef")}
          className="bg-emerald-600 px-4 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">
            Add Chef
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chefs}
        keyExtractor={(item: any) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
        }}
        renderItem={({ item }: any) => (
          <View className="bg-slate-900 rounded-3xl p-4 mb-4">

            <Text className="text-white text-xl font-bold">
              {item.name || "-"}
            </Text>

            <Text className="text-slate-300 mt-2">
              Email: {item.email || "-"}
            </Text>

            <Text className="text-slate-300 mt-1">
              Mobile: {item.mobile || "-"}
            </Text>

            <Text className="text-slate-300 mt-1">
              Address: {item.address || "-"}
            </Text>

            <Text className="text-slate-300 mt-1">
              FSSAI: {item.fssai_number || "-"}
            </Text>

            <View className="mt-3">
              <Text
                className={`font-bold ${item.status === "Approved"
                    ? "text-green-400"
                    : item.status === "Pending"
                      ? "text-yellow-400"
                      : item.status === "Suspended"
                        ? "text-red-400"
                        : "text-slate-400"
                  }`}
              >
                Status: {item.status || "-"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Text className="text-slate-400">
              No Home Chefs Found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default HomeChef;
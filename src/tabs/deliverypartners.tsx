import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bike } from "lucide-react-native";

import { get } from "../services/api";
import { TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

const DeliveryPartners = () => {
  const navigation = useNavigation<any>();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPartners = async () => {
    try {
      const response = await get("/superadmin/delivery-partners");

      // adjust if your API wrapper returns differently
      setPartners(response.data || response);
    } catch (error) {
      console.log("Delivery Partner Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPartners();
  };

  const renderItem = ({ item }: any) => (
    <View className="bg-slate-900 rounded-xl p-4 mb-3 mx-4">
      <View className="flex-row items-center">
        <Bike size={20} color="#10b981" />
        <Text className="text-white text-lg font-bold ml-2">
          {item.name}
        </Text>
      </View>

      <Text className="text-slate-300 mt-2">
        Mobile: {item.mobile}
      </Text>

      <Text className="text-slate-300">
        Vehicle: {item.vehicle_type} - {item.vehicle_number}
      </Text>

      <Text className="text-slate-300">
        Deliveries: {item.total_deliveries || 0}
      </Text>

      <Text className="text-emerald-400 font-bold">
        Earnings: ₹{item.earnings || 0}
      </Text>

      <Text
        className={`mt-2 font-bold ${item.status === "Approved"
            ? "text-green-400"
            : item.status === "Pending"
              ? "text-yellow-400"
              : "text-red-400"
          }`}
      >
        {item.status}
      </Text>
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
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-white text-2xl font-bold">
          Delivery Partners
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("AddDeliveryPartner")
          }
          className="bg-emerald-600 px-4 py-2 rounded-xl flex-row items-center"
        >
          <Plus size={18} color="white" />
          <Text className="text-white font-bold ml-2">
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={partners}
        keyExtractor={(item: any) => item.id?.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          <Text className="text-slate-400 text-center mt-10">
            No Delivery Partners Found
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default DeliveryPartners;
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Package,
  LayoutGrid,
  Boxes,
  ChevronRight,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

const Inventory = () => {
  const navigation: any = useNavigation();

  const menuItems = [
    {
      title: "Products",
      subtitle: "Manage all products",
      icon: Package,
      screen: "Products",
    },
    {
      title: "Categories",
      subtitle: "Manage product categories",
      icon: LayoutGrid,
      screen: "Categories",
    },
    {
      title: "Stock Details",
      subtitle: "Manage inventory stock",
      icon: Boxes,
      screen: "StockDetails",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <View className="px-5 pt-4">
        <Text className="text-3xl font-bold text-slate-900">
          Inventory
        </Text>

        <Text className="text-slate-500 mt-1">
          Manage products, categories & stock
        </Text>
      </View>

      <View className="px-5 mt-6">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(item.screen)}
              className="bg-white rounded-3xl p-5 mb-4 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-2xl bg-emerald-100 items-center justify-center">
                  <Icon size={28} color="#059669" />
                </View>

                <View className="ml-4">
                  <Text className="text-lg font-bold text-slate-900">
                    {item.title}
                  </Text>

                  <Text className="text-slate-500">
                    {item.subtitle}
                  </Text>
                </View>
              </View>

              <ChevronRight size={24} color="#64748b" />
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

export default Inventory;
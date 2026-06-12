import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FoodOrders = () => {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-slate-950 justify-center items-center"
    >
      <Text className="text-white text-2xl font-bold">
        Food Orders Screen
      </Text>
      <Text className="text-slate-400 mt-2">
        This is a dummy page for Food Orders.
      </Text>
    </SafeAreaView>
  );
};

export default FoodOrders;

import React from "react";
import { View, Text } from "react-native";

const FoodOrders = () => {
  return (
    <View className="flex-1 justify-center items-center bg-slate-950">
      <Text className="text-white text-2xl font-bold">
        Food Orders Screen
      </Text>
      <Text className="text-slate-400 mt-2">
        This is a dummy page for Food Orders.
      </Text>
    </View>
  );
};

export default FoodOrders;

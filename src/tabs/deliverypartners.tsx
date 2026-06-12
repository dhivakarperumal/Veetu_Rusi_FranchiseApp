import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DeliveryPartners = () => {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-slate-950 justify-center items-center"
    >
      <Text className="text-white text-2xl font-bold">
        Delivery Partners Screen
      </Text>
      <Text className="text-slate-400 mt-2">
        This is a dummy page for Delivery Partners.
      </Text>
    </SafeAreaView>
  );
};

export default DeliveryPartners;

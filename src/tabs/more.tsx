import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MoreSettings = () => {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-slate-950"
    >
      <View className="flex-1 p-4 pt-6">
        <Text className="text-white text-3xl font-bold">
          More
        </Text>
        <Text className="text-slate-400 mt-1 mb-6">
          Additional Settings & Options
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default MoreSettings;

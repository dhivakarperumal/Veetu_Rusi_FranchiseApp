import "./global.css";
import React from "react";
import { View, Text } from "react-native";

export default function App() {
  return (
    <View className="flex-1 justify-center items-center bg-red-500">
      <Text className="text-white text-2xl">
        Tailwind Working
      </Text>
    </View>
  );
}
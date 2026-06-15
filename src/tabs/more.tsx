import React, { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";
import { LogOut } from "lucide-react-native";

const MoreSettings = () => {
  const auth = useContext(AuthContext);

  const handleLogout = async () => {
    await auth?.signOut();
  };

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

        <TouchableOpacity 
          onPress={handleLogout}
          className="flex-row items-center bg-red-500/10 p-4 rounded-2xl mt-auto mb-4"
        >
          <LogOut color="#ef4444" size={24} />
          <Text className="text-red-500 font-bold text-lg ml-3">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MoreSettings;

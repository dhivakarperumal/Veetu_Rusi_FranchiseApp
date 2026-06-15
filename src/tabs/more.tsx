import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";

import {
  Settings,
  Users,
  BarChart3,
  Wallet,
  FileText,
  ArrowRight,
} from "lucide-react-native";

import { useNavigation } from "@react-navigation/native";

const More = () => {
  const navigation = useNavigation<any>();

  const menuItems = [
    {
      id: "user-management",
      label: "User Management",
      description: "Manage system users and roles",
      icon: Users,
      color: "#3b82f6",
      bgColor: "#dbeafe",
      onPress: () => navigation.navigate("UserManagement"),
    },
    {
      id: "settings",
      label: "Settings",
      description: "App settings and preferences",
      icon: Settings,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      onPress: () => {},
    },
    {
      id: "reports",
      label: "Reports",
      description: "View system reports and analytics",
      icon: BarChart3,
      color: "#10b981",
      bgColor: "#d1fae5",
      onPress: () => {},
    },
    {
      id: "financials",
      label: "Financials",
      description: "Financial records and transactions",
      icon: Wallet,
      color: "#f59e0b",
      bgColor: "#fef3c7",
      onPress: () => {},
    },
    {
      id: "documentation",
      label: "Documentation",
      description: "Help and documentation",
      icon: FileText,
      color: "#ef4444",
      bgColor: "#fee2e2",
      onPress: () => {},
    },
  ];

  const renderMenuItem = (item: any) => {
    const IconComponent = item.icon;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={item.onPress}
        className="mx-4 mb-4 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow"
      >
        <View className="flex-1 flex-row items-center">
          <View
            style={{
              backgroundColor: item.bgColor,
            }}
            className="mr-4 h-14 w-14 items-center justify-center rounded-xl"
          >
            <IconComponent
              color={item.color}
              size={28}
            />
          </View>

          <View className="flex-1">
            <Text className="mb-1 text-base font-bold text-slate-900">
              {item.label}
            </Text>

            <Text className="text-sm text-slate-500">
              {item.description}
            </Text>
          </View>
        </View>

        <ArrowRight
          size={20}
          color="#cbd5e1"
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 80,
        }}
      >
        <View className="mb-6 px-4">
          <Text className="mb-2 text-3xl font-bold text-slate-900">
            More Options
          </Text>

          <Text className="text-sm text-slate-500">
            Manage your application
          </Text>
        </View>

        {menuItems.map(renderMenuItem)}
      </ScrollView>
    </SafeAreaView>
  );
};

export default More;
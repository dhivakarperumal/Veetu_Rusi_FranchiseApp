import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,

} from "react-native";

import {
  Settings,
  Users,
  BarChart3,
  Wallet,
  FileText,
  ClipboardList,
  ArrowRight,
  Star,
  Tag,
  Share2,
  Store,
  CalendarDays,
  Bike,
  ChefHat,
  X,
} from "lucide-react-native";

import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { Modal } from "react-native";

const More = () => {
  const navigation = useNavigation<any>();
  const [attendanceMenuOpen, setAttendanceMenuOpen] = useState(false);

  const menuItems = [
    {
      id: "attendance",
      label: "Attendance",
      description: "View delivery partner or home chef attendance",
      icon: CalendarDays,
      color: "#10b981",
      bgColor: "#d1fae5",
      onPress: () => setAttendanceMenuOpen(true),
    },
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
      id: "inventory",
      label: "Inventory",
      description: "Manage inventory and stock levels",
      icon: Settings,
      color: "#8b5cf6",
      bgColor: "#ede9fe",
      onPress: () => navigation.navigate("Inventory"),
    },
    {
      id: "orders",
      label: "Orders",
      description: "Manage orders and delivery status",
      icon: ClipboardList,
      color: "#0f766e",
      bgColor: "#ccfbf1",
      onPress: () => navigation.navigate("Orders"),
    },
    {
      id: "reviews",
      label: "Reviews & Ratings",
      description: "Manage product & delivery feedback",
      icon: Star,
      color: "#f59e0b",
      bgColor: "#fef3c7",
      onPress: () => navigation.navigate("Reviews"),
    },
    {
      id: "coupons",
      label: "Coupons & Discounts",
      description: "Manage promo codes and offers",
      icon: Tag,
      color: "#10b981",
      bgColor: "#d1fae5",
      onPress: () => navigation.navigate("Coupons"),
    },
    {
      id: "referrals",
      label: "Referral Management",
      description: "Manage customer, chef & DP referrals",
      icon: Share2,
      color: "#6366f1",
      bgColor: "#e0e7ff",
      onPress: () => navigation.navigate("ReferralManagement"),
    },
    {
      id: "wallet-earnings",
      label: "Wallet & Earnings",
      description: "Track balance, cashflow & payouts",
      icon: Wallet,
      color: "#f59e0b",
      bgColor: "#fef3c7",
      onPress: () => navigation.navigate("WalletAndEarnings"),
    },
    {
      id: "dealers",
      label: "Dealers",
      description: "Manage dealers and partnerships",
      icon: Store,
      color: "#06b6d4",
      bgColor: "#cffafe",
      onPress: () => navigation.navigate("Dealers"),
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
    <View className="flex-1 bg-slate-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: 80,
        }}
      >
        {/* HEADER */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-3xl font-black">
                More Options
              </Text>

              <Text className="text-slate-400 mt-1 text-xs">
                Manage your application
              </Text>
            </View>

            <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
              <Settings size={20} color="#34d399" />
            </View>
          </View>
        </View>

        {/* MENU ITEMS */}
        {menuItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={item.onPress}
              className="mx-4 mb-3 bg-slate-900 border border-white/10 rounded-2xl p-4"
            >
              <View className="flex-row items-center">
                {/* ICON */}
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center border"
                  style={{
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}30`,
                  }}
                >
                  <IconComponent
                    color={item.color}
                    size={22}
                  />
                </View>

                {/* TEXT */}
                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-black">
                    {item.label}
                  </Text>

                  <Text
                    className="text-slate-400 text-xs mt-1"
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                </View>

                {/* ARROW */}
                <View className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 items-center justify-center">
                  <ArrowRight
                    size={16}
                    color="#64748b"
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal
        visible={attendanceMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAttendanceMenuOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View className="rounded-t-3xl border-t border-white/10 bg-slate-900 p-5 pb-8">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-black text-white">Choose attendance</Text>
              <TouchableOpacity
                onPress={() => setAttendanceMenuOpen(false)}
                accessibilityLabel="Close attendance options"
                className="h-9 w-9 items-center justify-center rounded-xl bg-slate-800"
              >
                <X size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
            {[
              {
                label: "Delivery Partner Attendance",
                icon: Bike,
                route: "DeliveryPartnerAttendance",
              },
              {
                label: "Home Chef Attendance",
                icon: ChefHat,
                route: "HomeChefAttendance",
              },
            ].map((option) => {
              const Icon = option.icon;
              return (
                <TouchableOpacity
                  key={option.route}
                  onPress={() => {
                    setAttendanceMenuOpen(false);
                    navigation.navigate(option.route);
                  }}
                  className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-slate-950 p-4"
                >
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                    <Icon size={21} color="#6ee7b7" />
                  </View>
                  <Text className="flex-1 text-sm font-bold text-white">{option.label}</Text>
                  <ArrowRight size={17} color="#94a3b8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default More;
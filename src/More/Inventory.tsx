import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Package,
  LayoutGrid,
  Boxes,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import InnerHeader from "../components/InnerHeader";
import { get } from "../services/api";

const Inventory = () => {
  const navigation: any = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    productsCount: 0,
    combosCount: 0,
    categoriesCount: 0,
    lowStockCount: 0,
  });

  const fetchStats = async () => {
    try {
      const [prodRes, comboRes, catRes] = await Promise.allSettled([
        get<any[]>("/franchise-products"),
        get<any[]>("/combos"),
        get<any[]>("/categories"),
      ]);

      const products =
        prodRes.status === "fulfilled" && Array.isArray(prodRes.value)
          ? prodRes.value
          : [];
      const combos =
        comboRes.status === "fulfilled" && Array.isArray(comboRes.value)
          ? comboRes.value
          : [];
      const categories =
        catRes.status === "fulfilled" && Array.isArray(catRes.value)
          ? catRes.value
          : [];

      const lowStock = products.filter(
        (p: any) => Number(p.total_stock || p.stock || 0) < 10
      ).length;

      setStats({
        productsCount: products.length,
        combosCount: combos.length,
        categoriesCount: categories.length,
        lowStockCount: lowStock,
      });
    } catch (e) {
      console.log("Inventory fetch stats error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const menuItems = [
    {
      title: "Products & Combos",
      subtitle: "Single products, combo packs & variants",
      icon: Package,
      screen: "Products",
      color: "#10b981",
      badge: `${stats.productsCount + stats.combosCount} Items`,
    },
    {
      title: "Categories",
      subtitle: "Organize catalog by food & product types",
      icon: LayoutGrid,
      screen: "Categories",
      color: "#6366f1",
      badge: `${stats.categoriesCount} Categories`,
    },
    {
      title: "Stock Details",
      subtitle: "Monitor inventory levels, low stock & replenishments",
      icon: Boxes,
      screen: "StockDetails",
      color: "#f59e0b",
      badge: `${stats.lowStockCount} Low/Out`,
    },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Inventory Hub" navigation={navigation} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: 40,
        }}
      >
        {/* ================= HEADER ================= */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white text-3xl font-black">
                Inventory Hub
              </Text>
              <Text className="text-slate-400 mt-1 text-xs">
                Manage your products, combo packs, categories & stock
              </Text>
            </View>

            <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
              <Boxes size={20} color="#34d399" />
            </View>
          </View>
        </View>

        {/* ================= SUMMARY STAT CARDS ================= */}
        <View className="flex-row gap-2 px-4 mb-6">
          {/* TOTAL ITEMS */}
          <View className="flex-1 bg-slate-900 border border-indigo-400/25 rounded-2xl p-3.5">
            <View className="w-8 h-8 rounded-lg bg-indigo-500/15 items-center justify-center mb-2">
              <Package size={16} color="#a5b4fc" />
            </View>
            <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">
              Total Items
            </Text>
            <Text className="text-white text-2xl font-black mt-0.5">
              {loading ? "-" : stats.productsCount + stats.combosCount}
            </Text>
          </View>

          {/* CATEGORIES */}
          <View className="flex-1 bg-slate-900 border border-emerald-400/25 rounded-2xl p-3.5">
            <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
              <LayoutGrid size={16} color="#6ee7b7" />
            </View>
            <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
              Categories
            </Text>
            <Text className="text-white text-2xl font-black mt-0.5">
              {loading ? "-" : stats.categoriesCount}
            </Text>
          </View>

          {/* LOW STOCK */}
          <View className="flex-1 bg-slate-900 border border-amber-400/25 rounded-2xl p-3.5">
            <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
              <AlertTriangle size={16} color="#fcd34d" />
            </View>
            <Text className="text-amber-200/70 text-[9px] font-bold uppercase">
              Low Stock
            </Text>
            <Text className="text-white text-2xl font-black mt-0.5">
              {loading ? "-" : stats.lowStockCount}
            </Text>
          </View>
        </View>

        {/* ================= SECTION TITLE ================= */}
        <View className="px-4 mb-3">
          <Text className="text-slate-400 text-xs font-black uppercase tracking-wider">
            Inventory Management Modules
          </Text>
        </View>

        {/* ================= MENU ITEMS ================= */}
        <View className="px-4 space-y-3">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => navigation.navigate(item.screen)}
                className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex-row items-center mb-3"
              >
                {/* ICON */}
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center border"
                  style={{
                    backgroundColor: `${item.color}15`,
                    borderColor: `${item.color}30`,
                  }}
                >
                  <IconComponent color={item.color} size={22} />
                </View>

                {/* TEXT */}
                <View className="flex-1 ml-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white text-base font-black">
                      {item.title}
                    </Text>
                    <View className="bg-slate-800 border border-white/10 px-2 py-0.5 rounded-lg">
                      <Text className="text-[10px] font-bold text-slate-300">
                        {item.badge}
                      </Text>
                    </View>
                  </View>

                  <Text
                    className="text-slate-400 text-xs mt-1"
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                </View>

                {/* ARROW */}
                <View className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 items-center justify-center ml-2.5">
                  <ArrowRight size={16} color="#64748b" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default Inventory;
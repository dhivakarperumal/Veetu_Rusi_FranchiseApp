import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Phone,
  Shield,
  CreditCard,
  Wallet,
  MapPin,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { AuthContext } from "../context/AuthContext";
import InnerHeader from "../components/InnerHeader";
import LogoutConfirmModal from "../components/LogoutConfirmModal";
import { get } from "../services/api";

const Profile = ({ navigation }: any) => {
  const auth = useContext(AuthContext);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }

      // Try fetching latest profile from backend
      try {
        const res = await get<any>("/auth/profile");
        if (res?.user) {
          setUser((prev: any) => ({ ...prev, ...res.user, ...(res.franchise || {}) }));
          await AsyncStorage.setItem("user", JSON.stringify({ ...res.user, ...(res.franchise || {}) }));
        }
      } catch {
        // Fallback to stored user
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitial = () => {
    const name = user?.name || user?.username || user?.full_name || user?.email || "U";
    return name.charAt(0).toUpperCase();
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await auth?.signOut();
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="My Profile" navigation={navigation} />

      <SafeAreaView edges={["bottom"]} className="flex-1 bg-slate-950">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top User Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 items-center shadow-xl mb-6">
            <View className="w-24 h-24 rounded-full bg-teal-500/15 border-2 border-teal-400 items-center justify-center mb-4 shadow-lg">
              <Text className="text-teal-300 text-3xl font-black">{getInitial()}</Text>
            </View>

            <Text className="text-white text-2xl font-black text-center">
              {user?.name || user?.username || user?.full_name || "Franchise Partner"}
            </Text>

            <View className="flex-row items-center mt-2">
              <View className="bg-teal-500/20 border border-teal-500/30 px-3 py-1 rounded-full flex-row items-center mr-2">
                <Shield size={12} color="#5eead4" />
                <Text className="text-teal-300 text-xs font-bold ml-1 tracking-wider uppercase">
                  {user?.role === "admin" ? "Franchise Admin" : user?.role || "Franchise"}
                </Text>
              </View>

              <View className="bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                <Text className="text-emerald-300 text-xs font-bold">
                  {user?.status || "Active"}
                </Text>
              </View>
            </View>

            {user?.email && (
              <Text className="text-slate-400 text-sm text-center mt-2">{user.email}</Text>
            )}
          </View>

          {/* Account Information Card */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 shadow-lg">
            <Text className="text-teal-400 text-xs font-black tracking-widest uppercase mb-4">
              Account Information
            </Text>

            {/* Name */}
            <View className="flex-row items-center py-3 border-b border-slate-800/80">
              <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                <User size={18} color="#5eead4" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-xs font-medium">Full Name / Username</Text>
                <Text className="text-white font-bold text-sm mt-0.5">
                  {user?.name || user?.username || user?.full_name || "—"}
                </Text>
              </View>
            </View>

            {/* Email */}
            <View className="flex-row items-center py-3 border-b border-slate-800/80">
              <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                <Mail size={18} color="#5eead4" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-xs font-medium">Email Address</Text>
                <Text className="text-white font-bold text-sm mt-0.5">
                  {user?.email || "—"}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View className="flex-row items-center py-3 border-b border-slate-800/80">
              <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                <Phone size={18} color="#5eead4" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-xs font-medium">Phone Number</Text>
                <Text className="text-white font-bold text-sm mt-0.5">
                  {user?.phone || user?.mobile_number || "—"}
                </Text>
              </View>
            </View>

            {/* User ID / Role */}
            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                <Shield size={18} color="#5eead4" />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-xs font-medium">Franchise User ID</Text>
                <Text className="text-white font-bold text-sm mt-0.5">
                  {user?.user_id || user?.franch_user_id || user?.id || "—"}
                </Text>
              </View>
            </View>

            {/* Location / Territory (if available) */}
            {(user?.district || user?.area || user?.pincode) && (
              <View className="flex-row items-center py-3 border-t border-slate-800/80">
                <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                  <MapPin size={18} color="#5eead4" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-400 text-xs font-medium">Territory / Area</Text>
                  <Text className="text-white font-bold text-sm mt-0.5">
                    {[user?.area, user?.district, user?.pincode].filter(Boolean).join(", ")}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions / Shortcuts */}
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 shadow-lg">
            <Text className="text-teal-400 text-xs font-black tracking-widest uppercase mb-4">
              Franchise Services
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("SubscriptionPlans")}
              className="flex-row items-center justify-between py-3.5 border-b border-slate-800/80"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-teal-500/15 items-center justify-center mr-3">
                  <CreditCard size={19} color="#2dd4bf" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">Subscription Plans</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Manage or renew your franchise plan</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("WalletAndEarnings")}
              className="flex-row items-center justify-between py-3.5"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-10 h-10 rounded-xl bg-amber-500/15 items-center justify-center mr-3">
                  <Wallet size={19} color="#fbbf24" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">Wallet & Earnings</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">View balance, payouts & transactions</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.8}
            className="w-full bg-rose-500/10 border border-rose-500/30 rounded-2xl py-4 items-center justify-center flex-row mb-6"
          >
            <LogOut size={20} color="#fb7185" />
            <Text className="text-rose-400 font-bold text-base ml-2">Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Customized Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />
    </View>
  );
};

export default Profile;

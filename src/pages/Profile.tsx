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
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [franchise, setFranchise] = useState<any>(null);
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
          const franchiseData = res?.franchise || null;
          const history = Array.isArray(res?.subscriptionHistory)
            ? res.subscriptionHistory
            : [];

          setFranchise(franchiseData);
          setSubscriptionHistory(history);

          const updatedUser = {
            ...res.user,
            ...(franchiseData || {}),
          };

          setUser((prev: any) => ({
            ...prev,
            ...updatedUser,
          }));

          await AsyncStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
          );
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

  const formatDate = (value: any) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

          {/* Subscription Card */}
          {franchise && (
            <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-6 shadow-lg">

              {/* Header */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="flex-1">
                  <Text className="text-teal-400 text-xs font-black tracking-widest uppercase">
                    Subscription
                  </Text>

                  <Text className="text-white text-xl font-black mt-1">
                    Current Plan
                  </Text>

                  <Text className="text-slate-400 text-sm mt-1">
                    Current plan and previous purchases
                  </Text>
                </View>

                <View
                  className={`px-3 py-2 rounded-full border ${franchise?.isExpired ||
                      franchise?.subscriptionStatus !== "Active"
                      ? "bg-rose-500/10 border-rose-500/30"
                      : "bg-emerald-500/10 border-emerald-500/30"
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${franchise?.isExpired ||
                        franchise?.subscriptionStatus !== "Active"
                        ? "text-rose-400"
                        : "text-emerald-400"
                      }`}
                  >
                    {franchise?.isExpired
                      ? "Expired"
                      : franchise?.subscriptionStatus || "Inactive"}
                  </Text>
                </View>
              </View>

              {/* Subscription Stats */}
              <View className="flex-row flex-wrap -mx-1.5">

                {/* Days Remaining */}
                <View className="w-1/3 px-1.5">
                  <View className="bg-slate-800 rounded-2xl p-4 min-h-[105px]">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Days Remaining
                    </Text>

                    <Text
                      className={`text-2xl font-black mt-2 ${franchise?.daysRemaining !== null &&
                          franchise?.daysRemaining !== undefined &&
                          franchise?.daysRemaining <= 7
                          ? "text-rose-400"
                          : "text-emerald-400"
                        }`}
                    >
                      {franchise?.daysRemaining === null ||
                        franchise?.daysRemaining === undefined
                        ? "-"
                        : Math.max(0, franchise.daysRemaining)}
                    </Text>
                  </View>
                </View>

                {/* Started */}
                <View className="w-1/3 px-1.5">
                  <View className="bg-slate-800 rounded-2xl p-4 min-h-[105px]">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Started
                    </Text>

                    <Text className="text-white text-sm font-bold mt-2">
                      {formatDate(franchise?.start_date)}
                    </Text>
                  </View>
                </View>

                {/* Expires */}
                <View className="w-1/3 px-1.5">
                  <View className="bg-slate-800 rounded-2xl p-4 min-h-[105px]">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      Expires
                    </Text>

                    <Text className="text-white text-sm font-bold mt-2">
                      {formatDate(franchise?.expiry_date)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Purchase History */}
              <View className="mt-6">
                <Text className="text-slate-300 text-sm font-black uppercase tracking-wider mb-3">
                  Purchase History
                </Text>

                {subscriptionHistory.length === 0 ? (
                  <View className="bg-slate-800 rounded-2xl p-4">
                    <Text className="text-slate-400 text-sm">
                      No purchased plans found.
                    </Text>
                  </View>
                ) : (
                  subscriptionHistory.map((payment: any, index: number) => (
                    <View
                      key={payment?.id || index}
                      className="bg-slate-800 border border-slate-700 rounded-2xl p-4 mb-3"
                    >
                      {/* Plan */}
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-3">
                          <Text className="text-slate-400 text-xs">
                            Plan
                          </Text>

                          <Text className="text-white font-black text-base mt-1">
                            {payment?.plan_name ||
                              payment?.plan_id ||
                              "Plan"}
                          </Text>
                        </View>

                        {/* Amount */}
                        <View className="items-end">
                          <Text className="text-slate-400 text-xs">
                            Amount
                          </Text>

                          <Text className="text-teal-300 font-black text-base mt-1">
                            {payment?.currency || "INR"}{" "}
                            {Number(
                              payment?.plan_amount ??
                              payment?.amount ??
                              0
                            ).toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Details */}
                      <View className="flex-row mt-4">

                        <View className="flex-1">
                          <Text className="text-slate-500 text-xs">
                            Duration
                          </Text>

                          <Text className="text-slate-200 text-sm font-bold mt-1">
                            {payment?.duration_days
                              ? `${payment.duration_days} days`
                              : "-"}
                          </Text>
                        </View>

                        <View className="flex-1">
                          <Text className="text-slate-500 text-xs">
                            Purchased
                          </Text>

                          <Text className="text-slate-200 text-sm font-bold mt-1">
                            {formatDate(payment?.created_at)}
                          </Text>
                        </View>
                      </View>

                      {/* Plan Period */}
                      <View className="mt-4 pt-3 border-t border-slate-700">
                        <Text className="text-slate-500 text-xs">
                          Plan Period
                        </Text>

                        <Text className="text-slate-200 text-sm font-bold mt-1">
                          {formatDate(payment?.subscription_start_date)}
                          {"  →  "}
                          {formatDate(payment?.subscription_expiry_date)}
                        </Text>
                      </View>

                      {/* Payment ID */}
                      <View className="mt-3">
                        <Text className="text-slate-500 text-xs">
                          Payment ID
                        </Text>

                        <Text
                          className="text-slate-300 text-xs font-mono mt-1"
                          numberOfLines={1}
                        >
                          {payment?.payment_id || "-"}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}


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

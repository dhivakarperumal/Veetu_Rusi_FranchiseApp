import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChefHat,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  ShieldAlert,
  Trash2,
  Edit3,
  Calendar,
  CreditCard,
  FileText,
  Utensils,
  Share2,
  ExternalLink,
  Check,
} from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { get, patch, del } from "../services/api";

const HomeChefDetails = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { chefId, chef: initialChef } = route.params || {};

  const [chef, setChef] = useState<any>(initialChef || null);
  const [loading, setLoading] = useState(!initialChef && !!chefId);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (chefId) {
      fetchChefDetails();
    }
  }, [chefId]);

  const fetchChefDetails = async () => {
    try {
      setLoading(true);
      const res: any = await get(`/admin/homechefs/${chefId}`);
      if (res && res.data) {
        setChef(res.data);
      } else if (res) {
        setChef(res);
      }
    } catch (err) {
      console.log("Error loading chef details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!chef?.id) return;
    Alert.alert(
      `${newStatus} Home Chef`,
      `Are you sure you want to change the status of ${chef.name} to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading(true);
              await patch(`/admin/homechefs/${chef.id}/status`, {
                status: newStatus,
              });
              setChef((prev: any) => ({ ...prev, status: newStatus }));
              Alert.alert("Success", `Home chef marked as ${newStatus}`);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to update status");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!chef?.id) return;
    Alert.alert(
      "Delete Home Chef",
      `Are you sure you want to delete ${chef.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              await del(`/admin/homechefs/${chef.id}`);
              Alert.alert("Deleted", "Home chef removed successfully.");
              navigation.goBack();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete home chef");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-3 text-xs font-semibold">
          Loading Home Chef Details...
        </Text>
      </View>
    );
  }

  if (!chef) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center p-6">
        <ChefHat size={48} color="#475569" />
        <Text className="text-white text-base font-bold mt-4">
          Home Chef Not Found
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 px-6 py-2.5 bg-slate-800 rounded-xl"
        >
          <Text className="text-emerald-400 font-bold text-xs">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isApproved = chef.status === "Approved";
  const isPending = chef.status === "Pending";

  const availableDaysText = Array.isArray(chef.available_days)
    ? chef.available_days.join(", ")
    : chef.available_days || "All Days";

  const availableSlotsText = Array.isArray(chef.available_slots)
    ? chef.available_slots.join(", ")
    : chef.available_slots || "All Slots";

  const cuisinesText = Array.isArray(chef.cuisine_type)
    ? chef.cuisine_type.join(", ")
    : chef.cuisine_type || "N/A";

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 items-center justify-center"
        >
          <ArrowLeft size={18} color="#ffffff" />
        </TouchableOpacity>

        <View className="flex-1 ml-3">
          <Text className="text-white text-base font-black" numberOfLines={1}>
            {chef.name || `${chef.first_name || ""} ${chef.last_name || ""}`.trim()}
          </Text>
          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            {chef.chef_unique_code ? `Code: ${chef.chef_unique_code}` : "Chef Overview"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("EditHomeChef", {
              chefId: chef.id,
              chef,
            })
          }
          className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 items-center justify-center mr-2"
        >
          <Edit3 size={16} color="#34d399" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 items-center justify-center"
        >
          <Trash2 size={16} color="#f87171" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Status Badge Card */}
        <View className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-xl bg-emerald-600/20 items-center justify-center">
              <ChefHat size={24} color="#34d399" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white font-black text-base">
                {chef.kitchen_name || "Home Kitchen"}
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {chef.kitchen_type || "Home Kitchen"} &bull; {chef.veg_nonveg || "Veg"}
              </Text>
            </View>
          </View>
          <View
            className={`px-3 py-1.5 rounded-xl border ${
              isApproved
                ? "bg-emerald-500/20 border-emerald-500/30"
                : isPending
                ? "bg-amber-500/20 border-amber-500/30"
                : "bg-red-500/20 border-red-500/30"
            }`}
          >
            <Text
              className={`text-[10px] font-black uppercase ${
                isApproved
                  ? "text-emerald-400"
                  : isPending
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {chef.status || "Pending"}
            </Text>
          </View>
        </View>

        {/* 👤 Personal Information */}
        <View className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-4">
          <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            👤 Personal Details
          </Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Full Name
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.name || `${chef.first_name || ""} ${chef.last_name || ""}`.trim() || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Gender / Age
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.gender || "—"}{" "}
                {chef.age ? `(${chef.age} yrs)` : ""}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Mobile Number
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.mobile || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Alternate Mobile
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.alt_mobile || "—"}
              </Text>
            </View>
            <View className="w-full p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Email Address
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.email || "—"}
              </Text>
            </View>
            {chef.date_of_birth && (
              <View className="w-1/2 p-1.5">
                <Text className="text-slate-400 text-[10px] font-bold uppercase">
                  Date of Birth
                </Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {chef.date_of_birth.substring(0, 10)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 📍 Address & Live GPS */}
        <View className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-4">
          <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            📍 Address & Location
          </Text>
          <View className="p-1.5">
            <Text className="text-slate-400 text-[10px] font-bold uppercase">
              Kitchen / Pickup Address
            </Text>
            <Text className="text-white text-xs font-semibold mt-0.5">
              {[
                chef.house_number || chef.door_number,
                chef.street || chef.street_name,
                chef.area || chef.area_name,
                chef.city,
                chef.state,
                chef.pincode,
                chef.country,
              ]
                .filter(Boolean)
                .join(", ") || chef.address || "—"}
            </Text>
          </View>
          {chef.google_map_location || chef.map_link ? (
            <TouchableOpacity
              onPress={() => {
                const link = chef.google_map_location || chef.map_link;
                if (link) Linking.openURL(link);
              }}
              className="mt-2 bg-emerald-600/20 border border-emerald-500/30 p-2.5 rounded-xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1">
                <MapPin size={16} color="#34d399" />
                <Text className="text-emerald-300 text-xs font-bold ml-2 flex-1" numberOfLines={1}>
                  Open Google Maps Location
                </Text>
              </View>
              <ExternalLink size={14} color="#34d399" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* 🍳 Kitchen & Food Details */}
        <View className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-4">
          <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            🍳 Kitchen & Food Details
          </Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Experience
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.experience_years ? `${chef.experience_years} Years` : "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Daily Capacity
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.daily_order_capacity ? `${chef.daily_order_capacity} Orders/day` : "—"}
              </Text>
            </View>
            <View className="w-full p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Speciality Cuisines
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {cuisinesText}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Delivery Radius
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.delivery_radius || "5 KM"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Preorder Available
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.preorder_available ? "Yes" : "No"}
              </Text>
            </View>
            {(chef.opening_time || chef.closing_time) && (
              <View className="w-full p-1.5">
                <Text className="text-slate-400 text-[10px] font-bold uppercase">
                  Operating Hours
                </Text>
                <Text className="text-white text-xs font-bold mt-0.5">
                  {chef.opening_time || "—"} to {chef.closing_time || "—"}{" "}
                  {chef.cutoff_time ? `(Cutoff: ${chef.cutoff_time})` : ""}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 📅 Availability */}
        <View className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-4">
          <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            📅 Food Availability
          </Text>
          <View className="p-1.5">
            <Text className="text-slate-400 text-[10px] font-bold uppercase">
              Available Days
            </Text>
            <Text className="text-white text-xs font-bold mt-0.5">
              {availableDaysText}
            </Text>
          </View>
          <View className="p-1.5 mt-2">
            <Text className="text-slate-400 text-[10px] font-bold uppercase">
              Available Slots
            </Text>
            <Text className="text-white text-xs font-bold mt-0.5">
              {availableSlotsText}
            </Text>
          </View>
        </View>

        {/* 🏦 Banking & Business */}
        <View className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-4">
          <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
            🏦 Business & Banking
          </Text>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Account Holder
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.account_holder_name || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Bank Branch
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.bank_branch || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                A/C Number
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.bank_account_number || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                IFSC Code
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.ifsc_code || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                UPI ID
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.upi_id || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                Aadhaar / PAN
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                {chef.aadhaar_number || "—"} &bull; {chef.pan_number || "—"}
              </Text>
            </View>
            <View className="w-1/2 p-1.5">
              <Text className="text-slate-400 text-[10px] font-bold uppercase">
                FSSAI / GST
              </Text>
              <Text className="text-white text-xs font-bold mt-0.5">
                FSSAI: {chef.fssai_available || "No"} &bull; GST: {chef.gst_available || "No"}
              </Text>
            </View>
          </View>
        </View>

        {/* 📖 Creator Story */}
        {(chef.about_me || chef.cooking_story || chef.why_choose_me) && (
          <View className="bg-slate-900 border border-white/10 rounded-2xl p-4 mb-4">
            <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-3">
              📖 Creator Story
            </Text>
            {chef.about_me ? (
              <View className="p-1.5">
                <Text className="text-slate-400 text-[10px] font-bold uppercase">
                  About Chef
                </Text>
                <Text className="text-white text-xs leading-relaxed mt-0.5">
                  {chef.about_me}
                </Text>
              </View>
            ) : null}
            {chef.cooking_story ? (
              <View className="p-1.5 mt-2">
                <Text className="text-slate-400 text-[10px] font-bold uppercase">
                  Cooking Story
                </Text>
                <Text className="text-white text-xs leading-relaxed mt-0.5">
                  {chef.cooking_story}
                </Text>
              </View>
            ) : null}
            {chef.why_choose_me ? (
              <View className="p-1.5 mt-2">
                <Text className="text-slate-400 text-[10px] font-bold uppercase">
                  Why Customers Love My Food
                </Text>
                <Text className="text-white text-xs leading-relaxed mt-0.5">
                  {chef.why_choose_me}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View className="p-4 border-t border-white/10 bg-slate-900 flex-row gap-3">
        {!isApproved && (
          <TouchableOpacity
            disabled={actionLoading}
            onPress={() => handleStatusChange("Approved")}
            className="flex-1 bg-emerald-600 py-3.5 rounded-xl items-center flex-row justify-center"
          >
            <Check size={18} color="#ffffff" />
            <Text className="text-white font-black text-xs uppercase tracking-wider ml-1.5">
              Approve Chef
            </Text>
          </TouchableOpacity>
        )}

        {isApproved && (
          <TouchableOpacity
            disabled={actionLoading}
            onPress={() => handleStatusChange("Suspended")}
            className="flex-1 bg-amber-600 py-3.5 rounded-xl items-center flex-row justify-center"
          >
            <ShieldAlert size={18} color="#ffffff" />
            <Text className="text-white font-black text-xs uppercase tracking-wider ml-1.5">
              Suspend Chef
            </Text>
          </TouchableOpacity>
        )}

        {isPending && (
          <TouchableOpacity
            disabled={actionLoading}
            onPress={() => handleStatusChange("Rejected")}
            className="flex-1 bg-red-600 py-3.5 rounded-xl items-center flex-row justify-center"
          >
            <Text className="text-white font-black text-xs uppercase tracking-wider">
              Reject Application
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HomeChefDetails;

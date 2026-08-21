import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Users,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Edit3,
  Check,
  ShieldAlert,
  Trash2,
  MapPin,
  Phone,
  Mail,
  ChefHat,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ExternalLink,
} from "lucide-react-native";

import { get, patch, del } from "../services/api";

const HomeChef = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chefs, setChefs] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected chef for Details Modal
  const [selectedChef, setSelectedChef] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    fetchHomeChefs();
  }, []);

  const fetchHomeChefs = async () => {
    try {
      const data: any = await get("/admin/homechefs");
      if (Array.isArray(data)) {
        setChefs(data);
      } else if (data && Array.isArray(data.data)) {
        setChefs(data.data);
      } else {
        setChefs([]);
      }
    } catch (error) {
      console.log("Home Chef Error:", error);
      setChefs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeChefs();
  };

  // --------------------------------------------------
  // COUNTS
  // --------------------------------------------------
  const approvedCount = chefs.filter(
    (chef) => chef.status === "Approved"
  ).length;

  const pendingCount = chefs.filter(
    (chef) => chef.status === "Pending"
  ).length;

  const suspendedCount = chefs.filter((chef) =>
    ["Suspended", "Rejected"].includes(chef.status)
  ).length;

  // --------------------------------------------------
  // SEARCH + FILTER
  // --------------------------------------------------
  const filteredChefs = useMemo(() => {
    let result = [...chefs];
    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((chef) => {
        return (
          chef.name?.toLowerCase().includes(query) ||
          chef.email?.toLowerCase().includes(query) ||
          chef.mobile?.includes(query) ||
          chef.kitchen_name?.toLowerCase().includes(query) ||
          chef.city?.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter((chef) => chef.status === statusFilter);
    }

    return result;
  }, [chefs, search, statusFilter]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredChefs.length / itemsPerPage)
  );

  const paginatedChefs = filteredChefs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // --------------------------------------------------
  // STATUS COLOR
  // --------------------------------------------------
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Approved":
        return {
          bg: "bg-emerald-500/15",
          border: "border-emerald-500/30",
          text: "text-emerald-400",
        };
      case "Pending":
        return {
          bg: "bg-amber-500/15",
          border: "border-amber-500/30",
          text: "text-amber-400",
        };
      case "Suspended":
      case "Rejected":
        return {
          bg: "bg-red-500/15",
          border: "border-red-500/30",
          text: "text-red-400",
        };
      default:
        return {
          bg: "bg-slate-500/15",
          border: "border-slate-500/30",
          text: "text-slate-400",
        };
    }
  };

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------
  const handleStatusChange = async (chef: any, newStatus: string) => {
    Alert.alert(
      `${newStatus} Home Chef`,
      `Are you sure you want to change status of ${chef.name} to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await patch(`/admin/homechefs/${chef.id}/status`, {
                status: newStatus,
              });
              Alert.alert("Success", `Status updated to ${newStatus}`);
              if (selectedChef?.id === chef.id) {
                setSelectedChef({ ...selectedChef, status: newStatus });
              }
              fetchHomeChefs();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to update status.");
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (chef: any) => {
    Alert.alert(
      "Delete Home Chef",
      `Are you sure you want to delete ${chef.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await del(`/admin/homechefs/${chef.id}`);
              Alert.alert("Deleted", "Home chef removed successfully.");
              if (selectedChef?.id === chef.id) {
                setIsDetailOpen(false);
                setSelectedChef(null);
              }
              fetchHomeChefs();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete home chef.");
            }
          },
        },
      ]
    );
  };

  const openChefDetails = (chef: any) => {
    setSelectedChef(chef);
    setIsDetailOpen(true);
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-3 font-semibold text-xs">
          Loading Home Chefs...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <View className="flex-1 bg-slate-950">
      <FlatList
        data={paginatedChefs}
        keyExtractor={(item: any) => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={["#10b981"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 40,
        }}
        ListHeaderComponent={
          <View className="px-4 pt-6">
            {/* ================= HEADER ================= */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-1">
                <Text className="text-white text-3xl font-black">
                  Home Chefs
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Manage and monitor home chefs
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate("AddHomeChef")}
                className="bg-emerald-600 px-4 py-3 rounded-xl flex-row items-center"
              >
                <Plus size={18} color="#ffffff" />
                <Text className="text-white font-bold ml-1 text-xs">Add</Text>
              </TouchableOpacity>
            </View>

            {/* ================= SUMMARY CARDS ================= */}
            <View className="flex-row mb-3">
              {/* TOTAL */}
              <View className="flex-1 bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 mr-2">
                <View className="flex-row items-center">
                  <View className="w-11 h-11 rounded-xl bg-indigo-600/20 items-center justify-center">
                    <Users size={21} color="#818cf8" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-indigo-300/70 text-[9px] font-bold uppercase">
                      Total
                    </Text>
                    <Text className="text-white text-2xl font-black mt-0.5">
                      {chefs.length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* APPROVED */}
              <View className="flex-1 bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 ml-2">
                <View className="flex-row items-center">
                  <View className="w-11 h-11 rounded-xl bg-emerald-600/20 items-center justify-center">
                    <CheckCircle size={21} color="#34d399" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-emerald-300/70 text-[9px] font-bold uppercase">
                      Approved
                    </Text>
                    <Text className="text-white text-2xl font-black mt-0.5">
                      {approvedCount}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* PENDING CARD */}
            <View className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 mb-5">
              <View className="flex-row items-center">
                <View className="w-11 h-11 rounded-xl bg-amber-600/20 items-center justify-center">
                  <Clock size={21} color="#fbbf24" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-amber-300/70 text-[9px] font-bold uppercase">
                    Pending & Suspended
                  </Text>
                  <Text className="text-white text-2xl font-black mt-0.5">
                    {pendingCount + suspendedCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* ================= SEARCH ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, email, mobile, kitchen..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
            </View>

            {/* ================= FILTER ================= */}
            <View className="flex-row items-center mb-4">
              <Filter size={15} color="#94a3b8" />
              <Text className="text-slate-400 ml-1.5 mr-2 text-[10px] font-bold">
                STATUS
              </Text>
              {["All", "Pending", "Approved", "Suspended", "Rejected"].map(
                (status) => {
                  const active = statusFilter === status;
                  return (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 rounded-lg mr-1.5 ${
                        active
                          ? "bg-emerald-600"
                          : "bg-slate-900 border border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${
                          active ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            {/* RESULT COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedChefs.length} of {filteredChefs.length} home chefs
            </Text>
          </View>
        }
        renderItem={({ item }: any) => {
          const statusStyle = getStatusStyle(item.status);

          return (
            <View className="mx-4 mb-4 bg-slate-900 border border-white/10 rounded-2xl p-4">
              {/* ================= CHEF HEADER ================= */}
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-xl bg-emerald-600/15 items-center justify-center">
                  <ChefHat size={23} color="#34d399" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-black">
                    {item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "-"}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5 font-medium">
                    {item.kitchen_name || "No Kitchen Details"}
                  </Text>
                </View>

                {/* STATUS */}
                <View
                  className={`px-2.5 py-1 rounded-lg border ${statusStyle.bg} ${statusStyle.border}`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase ${statusStyle.text}`}
                  >
                    {item.status || "Unknown"}
                  </Text>
                </View>
              </View>

              {/* ================= INFO ================= */}
              <View className="mt-4 space-y-1.5">
                {/* EMAIL */}
                <View className="flex-row items-center mb-1.5">
                  <Mail size={14} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-2 flex-1">
                    {item.email || "-"}
                  </Text>
                </View>

                {/* MOBILE */}
                <View className="flex-row items-center mb-1.5">
                  <Phone size={14} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-2">
                    {item.mobile || "-"}
                  </Text>
                </View>

                {/* CUISINE */}
                <View className="flex-row items-start mb-1.5">
                  <Utensils size={14} color="#64748b" style={{ marginTop: 2 }} />
                  <Text className="text-slate-400 text-xs ml-2 flex-1">
                    {Array.isArray(item.cuisine_type)
                      ? item.cuisine_type.join(", ")
                      : item.cuisine_type || "N/A"}
                  </Text>
                </View>

                {/* LOCATION */}
                <View className="flex-row items-center">
                  <MapPin size={14} color="#64748b" />
                  <Text
                    className="text-slate-400 text-xs ml-2 flex-1"
                    numberOfLines={1}
                  >
                    {[item.city, item.state, item.pincode]
                      .filter(Boolean)
                      .join(", ") || "N/A"}
                  </Text>
                </View>
              </View>

              {/* ================= EXTRA DETAILS ================= */}
              <View className="flex-row mt-3.5 gap-2">
                <View className="flex-1 bg-slate-950 rounded-xl p-2.5">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Delivery Radius
                  </Text>
                  <Text className="text-white text-xs font-bold mt-0.5">
                    {item.delivery_radius || "5 KM"}
                  </Text>
                </View>

                <View className="flex-1 bg-slate-950 rounded-xl p-2.5">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Daily Capacity
                  </Text>
                  <Text className="text-white text-xs font-bold mt-0.5">
                    {item.daily_order_capacity || "N/A"}
                  </Text>
                </View>
              </View>

              {/* ================= LOGIN ================= */}
              {item.status === "Approved" && (
                <View className="mt-3 bg-slate-950 rounded-xl p-3">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Login Credentials
                  </Text>
                  <Text className="text-slate-300 text-xs mt-1">
                    User:{" "}
                    <Text className="text-white font-bold">
                      {item.username || item.email || "N/A"}
                    </Text>
                  </Text>
                  <Text className="text-slate-300 text-xs mt-0.5">
                    Pass: <Text className="text-slate-500">********</Text>
                  </Text>
                </View>
              )}

              {/* ================= ACTIONS ================= */}
              <View className="flex-row items-center mt-4 pt-3 border-t border-white/10 gap-2">
                {/* VIEW DETAILS */}
                <TouchableOpacity
                  onPress={() => openChefDetails(item)}
                  className="flex-1 bg-slate-800 border border-white/10 rounded-xl py-2.5 flex-row items-center justify-center"
                >
                  <Eye size={15} color="#cbd5e1" />
                  <Text className="text-slate-200 text-xs font-bold ml-1.5">
                    Details
                  </Text>
                </TouchableOpacity>

                {/* EDIT */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("EditHomeChef", {
                      chefId: item.id,
                      chef: item,
                    })
                  }
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Edit3 size={16} color="#cbd5e1" />
                </TouchableOpacity>

                {/* APPROVE */}
                {item.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Approved")}
                    className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl items-center justify-center"
                  >
                    <Check size={17} color="#34d399" />
                  </TouchableOpacity>
                )}

                {/* SUSPEND */}
                {item.status === "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Suspended")}
                    className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center"
                  >
                    <ShieldAlert size={17} color="#fbbf24" />
                  </TouchableOpacity>
                )}

                {/* DELETE */}
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center"
                >
                  <Trash2 size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <ChefHat size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs">
              No home chefs match your criteria.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredChefs.length > 0 ? (
            <View className="flex-row justify-center items-center mt-2 px-4">
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl items-center justify-center"
                style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={18} color="#ffffff" />
              </TouchableOpacity>

              <Text className="text-slate-300 text-xs font-bold mx-5">
                Page {currentPage} of {totalPages}
              </Text>

              <TouchableOpacity
                disabled={currentPage === totalPages}
                onPress={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl items-center justify-center"
                style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* ================================================= */}
      {/* CHEF DETAILS POPUP MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isDetailOpen && !!selectedChef}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex-col">
            {/* Modal Header */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-black" numberOfLines={1}>
                  {selectedChef?.name ||
                    `${selectedChef?.first_name || ""} ${
                      selectedChef?.last_name || ""
                    }`.trim()}
                </Text>
                <Text className="text-emerald-200 text-xs font-bold uppercase tracking-wider mt-0.5">
                  Home Chef Overview
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="p-1.5 bg-black/20 rounded-full"
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView className="p-5 space-y-4">
              {/* Personal Section */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  👤 Personal Details
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Mobile
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.mobile || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Alt Mobile
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.alt_mobile || "—"}
                    </Text>
                  </View>
                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Email
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.email || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Gender / Age
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.gender || "—"}{" "}
                      {selectedChef?.age ? `(${selectedChef.age} yrs)` : ""}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      DOB
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.date_of_birth
                        ? selectedChef.date_of_birth.substring(0, 10)
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Kitchen Section */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  🍳 Kitchen & Speciality
                </Text>
                <View className="p-1.5">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase">
                    Kitchen Name
                  </Text>
                  <Text className="text-white text-xs font-semibold mt-0.5">
                    {selectedChef?.kitchen_name || "—"}
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Type / Veg
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.kitchen_type || "Home Kitchen"} &bull;{" "}
                      {selectedChef?.veg_nonveg || "Veg"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Experience
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.experience_years
                        ? `${selectedChef.experience_years} Years`
                        : "—"}
                    </Text>
                  </View>
                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Speciality Cuisines
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {Array.isArray(selectedChef?.cuisine_type)
                        ? selectedChef.cuisine_type.join(", ")
                        : selectedChef?.cuisine_type || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Daily Capacity
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.daily_order_capacity || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Delivery Radius
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.delivery_radius || "5 KM"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Address Section */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  📍 Address & Location
                </Text>
                <View className="p-1.5">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase">
                    Full Address
                  </Text>
                  <Text className="text-white text-xs font-semibold mt-0.5">
                    {[
                      selectedChef?.house_number || selectedChef?.door_number,
                      selectedChef?.street || selectedChef?.street_name,
                      selectedChef?.area || selectedChef?.area_name,
                      selectedChef?.city,
                      selectedChef?.state,
                      selectedChef?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || selectedChef?.address || "—"}
                  </Text>
                </View>
                {selectedChef?.google_map_location || selectedChef?.map_link ? (
                  <TouchableOpacity
                    onPress={() => {
                      const link =
                        selectedChef.google_map_location || selectedChef.map_link;
                      if (link) Linking.openURL(link);
                    }}
                    className="mt-2 bg-emerald-600/20 border border-emerald-500/30 p-2.5 rounded-xl flex-row items-center justify-between"
                  >
                    <Text className="text-emerald-300 text-xs font-bold">
                      Open Map Location
                    </Text>
                    <ExternalLink size={14} color="#34d399" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Bank & Business Section */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  🏦 Banking & Business
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Account Holder
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.account_holder_name || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Branch
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.bank_branch || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      A/C Number
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.bank_account_number || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      IFSC / UPI
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedChef?.ifsc_code || "—"} &bull;{" "}
                      {selectedChef?.upi_id || "—"}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View className="p-4 border-t border-slate-800 bg-slate-950 flex-row gap-2">
              <TouchableOpacity
                onPress={() => {
                  const target = selectedChef;
                  setIsDetailOpen(false);
                  navigation.navigate("EditHomeChef", {
                    chefId: target.id,
                    chef: target,
                  });
                }}
                className="px-4 bg-slate-800 py-3 rounded-2xl items-center flex-row"
              >
                <Edit3 size={15} color="#cbd5e1" />
                <Text className="text-slate-300 font-bold text-xs uppercase ml-1.5">
                  Edit
                </Text>
              </TouchableOpacity>

              {selectedChef?.status !== "Approved" && (
                <TouchableOpacity
                  onPress={() => {
                    handleStatusChange(selectedChef, "Approved");
                  }}
                  className="flex-1 bg-emerald-600 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Approve Chef
                  </Text>
                </TouchableOpacity>
              )}

              {selectedChef?.status === "Approved" && (
                <TouchableOpacity
                  onPress={() => {
                    handleStatusChange(selectedChef, "Suspended");
                  }}
                  className="flex-1 bg-amber-600 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Suspend Chef
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="px-5 bg-slate-800 py-3 rounded-2xl items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeChef;
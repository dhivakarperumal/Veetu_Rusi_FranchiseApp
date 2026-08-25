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
  ChefHat,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ChevronDown,
  Pencil,
} from "lucide-react-native";

import { get, patch, del } from "../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingActionButton from "../components/FloatingActionButton";

const HomeChef = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chefs, setChefs] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected chef for Details Modal
  const [selectedChef, setSelectedChef] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{ type: "approve" | "suspend" | "delete"; chef: any } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    if (newStatus === "Suspended" || newStatus === "Approved") {
      setConfirmation({ type: newStatus === "Approved" ? "approve" : "suspend", chef });
      return;
    }
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
    setConfirmation({ type: "delete", chef });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const { type, chef } = confirmation;
    setActionLoading(true);
    try {
      if (type === "delete") {
        await del(`/admin/homechefs/${chef.id}`);
        setIsDetailOpen(false);
        setSelectedChef(null);
      } else {
        const nextStatus = type === "approve" ? "Approved" : "Suspended";
        await patch(`/admin/homechefs/${chef.id}/status`, { status: nextStatus });
        if (selectedChef?.id === chef.id) setSelectedChef({ ...selectedChef, status: nextStatus });
      }
      setConfirmation(null);
      fetchHomeChefs();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Action could not be completed.");
    } finally {
      setActionLoading(false);
    }
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

              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                <ChefHat size={20} color="#34d399" />
              </View>
            </View>

            {/* ================= SUMMARY CARDS ================= */}
            <View className="flex-row gap-2 mb-5">

              {/* TOTAL */}
              <View
                className="flex-1 bg-slate-900 border border-indigo-400/25 rounded-2xl p-3"
                style={{ height: 100 }}
              >
                <View className="w-8 h-8 rounded-lg bg-indigo-500/15 items-center justify-center mb-2">
                  <Users size={16} color="#a5b4fc" />
                </View>

                <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">
                  Total
                </Text>

                <Text className="text-white text-2xl font-black mt-0.5">
                  {chefs.length}
                </Text>
              </View>

              {/* APPROVED */}
              <View
                className="flex-1 bg-slate-900 border border-emerald-400/25 rounded-2xl p-3"
                style={{ height: 100 }}
              >
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <CheckCircle size={16} color="#6ee7b7" />
                </View>

                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  Approved
                </Text>

                <Text className="text-white text-2xl font-black mt-0.5">
                  {approvedCount}
                </Text>
              </View>

              {/* NEEDS REVIEW */}
              <View
                className="flex-1 bg-slate-900 border border-amber-400/25 rounded-2xl p-3"
                style={{ height: 100 }}
              >
                <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
                  <Clock size={16} color="#fcd34d" />
                </View>

                <Text className="text-amber-200/70 text-[9px] font-bold uppercase">
                  Needs review
                </Text>

                <Text className="text-white text-2xl font-black mt-0.5">
                  {pendingCount + suspendedCount}
                </Text>
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
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center"><Filter size={15} color="#94a3b8" /><Text className="text-slate-400 ml-1.5 text-[10px] font-bold uppercase">Filter chefs</Text></View>
              <TouchableOpacity onPress={() => setIsFilterOpen(true)} className="flex-row items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
                <Text className="text-white text-xs font-bold mr-2">{statusFilter}</Text><ChevronDown size={15} color="#94a3b8" />
              </TouchableOpacity>
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
              <View className="mt-4 gap-2">
                {/* MOBILE */}
                <View className="flex-row items-center">
                  <Phone size={14} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-2">
                    {item.mobile || "-"}
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

              {/* ================= ACTIONS ================= */}
              <View className="flex-row items-center mt-4 pt-3 border-t border-white/10 gap-2">
                <Text className="text-slate-300 text-xs font-semibold flex-1" numberOfLines={1}>
                  {item.kitchen_name || item.cuisine_type || "Home kitchen"}
                </Text>
                {/* VIEW DETAILS */}
                <TouchableOpacity
                  onPress={() => openChefDetails(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${item.name || "chef"}`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Eye size={15} color="#cbd5e1" />
                </TouchableOpacity>

                {/* EDIT */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("EditHomeChef", {
                      chefId: item.id,
                      chef: item,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name || "chef"}`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Pencil size={16} color="#cbd5e1" />
                </TouchableOpacity>

                {/* APPROVE */}
                {item.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Approved")}
                    accessibilityRole="button"
                    accessibilityLabel={`Approve ${item.name || "chef"}`}
                    className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl items-center justify-center"
                  >
                    <Check size={17} color="#34d399" />
                  </TouchableOpacity>
                )}

                {/* SUSPEND */}
                {item.status === "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Suspended")}
                    accessibilityRole="button"
                    accessibilityLabel={`Suspend ${item.name || "chef"}`}
                    className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center"
                  >
                    <ShieldAlert size={17} color="#fbbf24" />
                  </TouchableOpacity>
                )}

                {/* DELETE */}
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name || "chef"}`}
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

      <FloatingActionButton
        onPress={() => navigation.navigate("AddHomeChef")}
        label="Add home chef"
      />

      <Modal
        visible={!!confirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setConfirmation(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
            {confirmation?.type === "delete" ? <Trash2 size={25} color="#f87171" /> : confirmation?.type === "approve" ? <CheckCircle size={25} color="#34d399" /> : <ShieldAlert size={25} color="#fbbf24" />}
            <Text className="text-white text-lg font-black mt-4">{confirmation?.type === "delete" ? "Remove this chef?" : confirmation?.type === "approve" ? "Approve this chef?" : "Suspend this chef?"}</Text>
            <Text className="text-slate-400 text-sm mt-2">{confirmation?.chef?.name || "This chef"} will be {confirmation?.type === "delete" ? "removed from" : confirmation?.type === "approve" ? "approved for" : "blocked from"} your home chef network.</Text>
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity onPress={() => setConfirmation(null)} disabled={actionLoading} className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"><Text className="text-slate-300 font-bold text-xs uppercase">Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={confirmAction} disabled={actionLoading} className={`flex-1 rounded-2xl py-3.5 items-center ${confirmation?.type === "delete" ? "bg-red-600" : confirmation?.type === "approve" ? "bg-emerald-600" : "bg-amber-500"}`}>{actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-white font-black text-xs uppercase">{confirmation?.type === "delete" ? "Remove chef" : confirmation?.type === "approve" ? "Approve chef" : "Suspend chef"}</Text>}</TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isFilterOpen} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => setIsFilterOpen(false)}>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
            <View className="flex-row items-center justify-between mb-4"><Text className="text-white text-base font-black">Filter chefs</Text><TouchableOpacity onPress={() => setIsFilterOpen(false)}><X size={18} color="#cbd5e1" /></TouchableOpacity></View>
            {["All", "Pending", "Approved", "Suspended", "Rejected"].map((status) => <TouchableOpacity key={status} onPress={() => { setStatusFilter(status); setIsFilterOpen(false); }} className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${statusFilter === status ? "bg-emerald-500/15 border-emerald-500/40" : "bg-slate-950 border-white/5"}`}><Text className={`text-sm font-bold ${statusFilter === status ? "text-emerald-300" : "text-slate-300"}`}>{status === "All" ? "All chefs" : status}</Text>{statusFilter === status ? <CheckCircle size={17} color="#34d399" /> : null}</TouchableOpacity>)}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CHEF DETAILS POPUP MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isDetailOpen && !!selectedChef}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex-col" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
            {/* Modal Header */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-black" numberOfLines={1}>
                  {selectedChef?.name ||
                    `${selectedChef?.first_name || ""} ${selectedChef?.last_name || ""
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
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.mobile || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Alt Mobile
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.alt_mobile || "—"}
                    </Text>
                  </View>
                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Email
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.email || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Gender / Age
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.gender || "—"}{" "}
                      {selectedChef?.age ? `(${selectedChef.age} yrs)` : ""}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      DOB
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
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
                  <Text className="text-white text-sm font-semibold mt-0.5">
                    {selectedChef?.kitchen_name || "—"}
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Type / Veg
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.kitchen_type || "Home Kitchen"} &bull;{" "}
                      {selectedChef?.veg_nonveg || "Veg"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Experience
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.experience_years
                        ? `${selectedChef.experience_years} Years`
                        : "—"}
                    </Text>
                  </View>
                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Speciality Cuisines
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {Array.isArray(selectedChef?.cuisine_type)
                        ? selectedChef.cuisine_type.join(", ")
                        : selectedChef?.cuisine_type || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Daily Capacity
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.daily_order_capacity || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Delivery Radius
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
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
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.account_holder_name || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Branch
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
                      {selectedChef?.bank_branch || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      A/C Number
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-0.5">
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
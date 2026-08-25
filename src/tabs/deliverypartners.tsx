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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bike,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  ShieldAlert,
  Trash2,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  ChevronDown,
  Pencil,
  Briefcase,
} from "lucide-react-native";

import { get, patch, del } from "../services/api";
import FloatingActionButton from "../components/FloatingActionButton";

const DeliveryPartners = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected partner for Details Modal
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    type: "suspend" | "delete";
    partner: any;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const data: any = await get("/admin/delivery-partners");
      if (Array.isArray(data)) {
        setPartners(data);
      } else if (data && Array.isArray(data.data)) {
        setPartners(data.data);
      } else {
        setPartners([]);
      }
    } catch (error) {
      console.log("Delivery Partner Error:", error);
      setPartners([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPartners();
  };

  // --------------------------------------------------
  // SUMMARY COUNTS
  // --------------------------------------------------
  const approvedCount = partners.filter(
    (p) => p.status === "Approved"
  ).length;

  const pendingCount = partners.filter(
    (p) => p.status === "Pending"
  ).length;

  const suspendedCount = partners.filter((p) =>
    ["Suspended", "Rejected"].includes(p.status)
  ).length;

  // --------------------------------------------------
  // SEARCH & FILTER
  // --------------------------------------------------
  const filteredPartners = useMemo(() => {
    let result = [...partners];
    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((p) => {
        return (
          p.name?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.mobile?.includes(query) ||
          p.vehicle_number?.toLowerCase().includes(query) ||
          p.vehicle_model?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter((p) => p.status === statusFilter);
    }

    return result;
  }, [partners, search, statusFilter]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPartners.length / itemsPerPage)
  );

  const paginatedPartners = filteredPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // --------------------------------------------------
  // STATUS STYLE
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
  const handleStatusChange = async (partner: any, newStatus: string) => {
    if (newStatus === "Suspended") {
      setConfirmation({ type: "suspend", partner });
      return;
    }

    try {
      await patch(`/admin/delivery-partners/${partner.id}/status`, {
        status: newStatus,
      });
      Alert.alert("Success", `Status updated to ${newStatus}`);
      if (selectedPartner?.id === partner.id) {
        setSelectedPartner({ ...selectedPartner, status: newStatus });
      }
      fetchPartners();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update status.");
    }
  };

  const handleDelete = async (partner: any) => {
    setConfirmation({ type: "delete", partner });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const { type, partner } = confirmation;
    setActionLoading(true);
    try {
      if (type === "delete") {
        await del(`/admin/delivery-partners/${partner.id}`);
        setIsDetailOpen(false);
        setSelectedPartner(null);
      } else {
        await patch(`/admin/delivery-partners/${partner.id}/status`, {
          status: "Suspended",
        });
        if (selectedPartner?.id === partner.id) {
          setSelectedPartner({ ...selectedPartner, status: "Suspended" });
        }
      }
      setConfirmation(null);
      fetchPartners();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  };

  const openPartnerDetails = (partner: any) => {
    setSelectedPartner(partner);
    setIsDetailOpen(true);
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------
  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-3 font-semibold text-xs">
          Loading Delivery Partners...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // RENDER MAIN SCREEN
  // --------------------------------------------------
  return (
    <View className="flex-1 bg-slate-950">
      <FlatList
        data={paginatedPartners}
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
                  Delivery Partners
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Manage and monitor delivery fleet
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                <Bike size={20} color="#34d399" />
              </View>
            </View>

            {/* ================= SUMMARY METRICS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* TOTAL */}
              <View className="flex-1 bg-slate-900 border border-indigo-400/25 rounded-2xl p-3">
                <View className="w-8 h-8 rounded-lg bg-indigo-500/15 items-center justify-center mb-2">
                  <Users size={16} color="#a5b4fc" />
                </View>
                <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">Total</Text>
                <Text className="text-white text-2xl font-black mt-0.5">{partners.length}</Text>
              </View>

              {/* APPROVED */}
              <View className="flex-1 bg-slate-900 border border-emerald-400/25 rounded-2xl p-3">
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <CheckCircle size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">Approved</Text>
                <Text className="text-white text-2xl font-black mt-0.5">{approvedCount}</Text>
              </View>

              {/* PENDING & SUSPENDED CARD */}
              <View className="flex-1 bg-slate-900 border border-amber-400/25 rounded-2xl p-3">
                <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
                  <Clock size={16} color="#fcd34d" />
                </View>
                <Text className="text-amber-200/70 text-[9px] font-bold uppercase">Needs review</Text>
                <Text className="text-white text-2xl font-black mt-0.5">{pendingCount + suspendedCount}</Text>
              </View>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, mobile, vehicle number..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
            </View>

            {/* ================= STATUS FILTER ================= */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Filter size={15} color="#94a3b8" />
                <Text className="text-slate-400 ml-1.5 text-[10px] font-bold uppercase">Filter partners</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterOpen(true)}
                className="flex-row items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2"
              >
                <Text className="text-white text-xs font-bold mr-2">{statusFilter}</Text>
                <ChevronDown size={15} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* RESULT COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedPartners.length} of {filteredPartners.length}{" "}
              delivery partners
            </Text>
          </View>
        }
        renderItem={({ item }: any) => {
          const statusStyle = getStatusStyle(item.status);

          return (
            <View className="mx-4 mb-3 bg-slate-900 border border-white/10 rounded-2xl p-4">
              {/* ================= TOP INFO ================= */}
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-xl bg-emerald-600/15 items-center justify-center">
                  <Bike size={24} color="#34d399" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-black">
                    {item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "-"}
                  </Text>
                  <Text
                    className="text-slate-400 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {item.email || "No email"}
                  </Text>
                </View>

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

              {/* ================= ESSENTIAL DETAILS ================= */}
              <View className="mt-3.5 flex-row items-center">
                {/* Mobile */}
                <View className="flex-row items-center flex-1">
                  <Phone size={14} color="#64748b" />
                  <Text className="text-slate-300 text-xs ml-2" numberOfLines={1}>
                    {item.mobile || "-"}
                  </Text>
                </View>

                {/* Location */}
                <View className="flex-row items-center flex-1 ml-2">
                  <MapPin size={14} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-2 flex-1" numberOfLines={1}>
                    {[item.city, item.state, item.pincode]
                      .filter(Boolean)
                      .join(", ") ||
                      item.current_address ||
                      item.live_location ||
                      "N/A"}
                  </Text>
                </View>
              </View>

              {/* ================= ACTION BUTTONS ================= */}
              <View className="flex-row items-center justify-between mt-3.5 pt-3 border-t border-white/10 gap-2">

                {/* Bike Number - Left */}
                <Text
                  className="text-slate-300 text-xs font-semibold flex-1"
                  numberOfLines={1}
                >
                  {item.vehicle_type || "Bike"} • {item.vehicle_number || "No Vehicle No"}
                </Text>

                {/* Details Button */}
                <TouchableOpacity
                  onPress={() => openPartnerDetails(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${item.name || "partner"}`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Eye size={15} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("EditDeliveryPartner", {
                      partnerId: item.id,
                      partner: item,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name || "partner"}`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Pencil size={16} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Approve Button */}
                {item.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Approved")}
                    accessibilityRole="button"
                    accessibilityLabel={`Approve ${item.name || "partner"}`}
                    className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl items-center justify-center"
                  >
                    <Check size={17} color="#34d399" />
                  </TouchableOpacity>
                )}

                {/* Suspend Button */}
                {item.status === "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Suspended")}
                    accessibilityRole="button"
                    accessibilityLabel={`Suspend ${item.name || "partner"}`}
                    className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center"
                  >
                    <ShieldAlert size={17} color="#fbbf24" />
                  </TouchableOpacity>
                )}

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name || "partner"}`}
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
            <Bike size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs">
              No delivery partners match your criteria.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredPartners.length > 0 ? (
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

      <View
        style={{
          position: "absolute",
          right: 20,
          bottom: 25,
          zIndex: 9999,
          elevation: 20,
        }}
      >
        <FloatingActionButton
          onPress={() => navigation.navigate("AddDeliveryPartner")}
          label="Add delivery partner"
        />
      </View>

      <Modal
        visible={!!confirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setConfirmation(null)}
      >
        <View className="flex-1 bg-black justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 ${confirmation?.type === "delete" ? "bg-red-500/15" : "bg-amber-500/15"}`}>
              {confirmation?.type === "delete" ? (
                <Trash2 size={23} color="#f87171" />
              ) : (
                <ShieldAlert size={23} color="#fbbf24" />
              )}
            </View>
            <Text className="text-white text-lg font-black">
              {confirmation?.type === "delete" ? "Remove this partner?" : "Suspend this partner?"}
            </Text>
            <Text className="text-slate-400 text-sm mt-2 leading-5">
              {confirmation?.type === "delete"
                ? `${confirmation?.partner?.name || "This partner"} will be permanently removed from your delivery fleet.`
                : `${confirmation?.partner?.name || "This partner"} will lose active delivery access until approved again.`}
            </Text>
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setConfirmation(null)}
                disabled={actionLoading}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmAction}
                disabled={actionLoading}
                className={`flex-1 rounded-2xl py-3.5 items-center ${confirmation?.type === "delete" ? "bg-red-600" : "bg-amber-500"}`}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase">
                    {confirmation?.type === "delete" ? "Remove partner" : "Suspend partner"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status filter dropdown */}
      <Modal
        visible={isFilterOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">Filter partners</Text>
                <Text className="text-slate-400 text-xs mt-1">Choose a partner status</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
            {["All", "Pending", "Approved", "Suspended", "Rejected"].map((status) => {
              const active = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => {
                    setStatusFilter(status);
                    setIsFilterOpen(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${active
                    ? "bg-emerald-500/15 border-emerald-500/40"
                    : "bg-slate-950 border-white/5"
                    }`}
                >
                  <Text className={`text-sm font-bold ${active ? "text-emerald-300" : "text-slate-300"}`}>
                    {status === "All" ? "All partners" : status}
                  </Text>
                  {active ? <CheckCircle size={17} color="#34d399" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* PARTNER DETAILS POPUP MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isDetailOpen && !!selectedPartner}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex-col">

            {/* ================= MODAL HEADER ================= */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="text-white text-xl font-black"
                  numberOfLines={1}
                >
                  {selectedPartner?.name ||
                    `${selectedPartner?.first_name || ""} ${selectedPartner?.last_name || ""
                      }`.trim()}
                </Text>

                <Text className="text-emerald-200 text-sm font-bold uppercase tracking-wider mt-1">
                  Delivery Partner Overview
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="w-9 h-9 bg-black/20 rounded-full items-center justify-center"
              >
                <X size={21} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* ================= MODAL BODY ================= */}
            <ScrollView
              className="p-5"
              showsVerticalScrollIndicator={false}
            >

              {/* ================= PERSONAL INFORMATION ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  👤 Personal Information
                </Text>

                <View className="flex-row flex-wrap">

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Mobile
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.mobile || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Alt Mobile
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.alt_mobile || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Email
                    </Text>
                    <Text
                      className="text-white text-sm font-semibold mt-1"
                      numberOfLines={1}
                    >
                      {selectedPartner?.email || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Gender / Blood
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.gender || "—"} &bull;{" "}
                      {selectedPartner?.blood_group || "—"}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      DOB & Age
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.date_of_birth
                        ? selectedPartner.date_of_birth.substring(0, 10)
                        : "—"}{" "}
                      {selectedPartner?.age
                        ? `(${selectedPartner.age} yrs)`
                        : ""}
                    </Text>
                  </View>

                </View>
              </View>

              {/* ================= ADDRESS ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  📍 Address & Live GPS
                </Text>

                <View className="p-1.5">
                  <Text className="text-slate-400 text-xs font-bold uppercase">
                    Current Address
                  </Text>
                  <Text className="text-white text-sm font-semibold mt-1">
                    {selectedPartner?.current_address || "—"}
                  </Text>
                </View>

                <View className="p-1.5">
                  <Text className="text-slate-400 text-xs font-bold uppercase">
                    City, State & Pincode
                  </Text>
                  <Text className="text-white text-sm font-semibold mt-1">
                    {[
                      selectedPartner?.city,
                      selectedPartner?.state,
                      selectedPartner?.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </Text>
                </View>

                <View className="p-1.5">
                  <Text className="text-slate-400 text-xs font-bold uppercase">
                    Live GPS / Location
                  </Text>
                  <Text className="text-emerald-400 text-sm font-mono font-bold mt-1">
                    {selectedPartner?.live_location || "—"}
                  </Text>
                </View>
              </View>

              {/* ================= EMERGENCY CONTACT ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  📞 Emergency Contact
                </Text>

                <View className="flex-row flex-wrap">

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Contact Name
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.emergency_contact_name || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Relationship
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.emergency_contact_relationship || "—"}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Emergency Phone
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.emergency_contact_mobile || "—"}
                    </Text>
                  </View>

                </View>
              </View>

              {/* ================= VEHICLE & LICENSE ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  🛵 Vehicle & License
                </Text>

                <View className="flex-row flex-wrap">

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Vehicle Type
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.vehicle_type || "Bike"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Brand / Model
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.vehicle_brand}{" "}
                      {selectedPartner?.vehicle_model}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Vehicle Number
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.vehicle_number || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      License Number
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.license_number || "—"}
                    </Text>
                  </View>

                </View>
              </View>

              {/* ================= BANK & IDENTITY ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  🏦 Bank & Identity
                </Text>

                <View className="flex-row flex-wrap">

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Bank Name
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.bank_name || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      A/C Number
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.bank_account_number || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      IFSC / UPI
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.ifsc_code || "—"} &bull;{" "}
                      {selectedPartner?.upi_id || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Aadhaar / PAN
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.aadhaar_number || "—"} &bull;{" "}
                      {selectedPartner?.pan_number || "—"}
                    </Text>
                  </View>

                </View>
              </View>

              {/* ================= WORK PREFERENCES ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  ⚙️ Work Preferences
                </Text>

                <View className="p-1.5">
                  <Text className="text-slate-400 text-xs font-bold uppercase">
                    Delivery Zones
                  </Text>
                  <Text className="text-white text-sm font-semibold mt-1">
                    {selectedPartner?.available_areas || "—"}
                  </Text>
                </View>

                <View className="flex-row flex-wrap">

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Preferred Distance
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.preferred_distance || "3 KM"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Driving Exp
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedPartner?.driving_experience
                        ? `${selectedPartner.driving_experience} Years`
                        : "—"}
                    </Text>
                  </View>

                </View>
              </View>

            </ScrollView>

            {/* ================= BOTTOM ACTIONS ================= */}
            <View className="p-4 border-t border-slate-800 bg-slate-950 flex-row gap-2">

              <TouchableOpacity
                onPress={() => {
                  const target = selectedPartner;
                  setIsDetailOpen(false);

                  navigation.navigate("EditDeliveryPartner", {
                    partnerId: target.id,
                    partner: target,
                  });
                }}
                className="px-4 bg-slate-800 py-3 rounded-2xl items-center flex-row"
              >
                <Briefcase size={17} color="#cbd5e1" />

                <Text className="text-slate-300 font-bold text-sm uppercase ml-1.5">
                  Edit
                </Text>
              </TouchableOpacity>

              {selectedPartner?.status !== "Approved" && (
                <TouchableOpacity
                  onPress={() => {
                    handleStatusChange(selectedPartner, "Approved");
                  }}
                  className="flex-1 bg-emerald-600 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    Approve Partner
                  </Text>
                </TouchableOpacity>
              )}

              {selectedPartner?.status === "Pending" && (
                <TouchableOpacity
                  onPress={() => {
                    handleStatusChange(selectedPartner, "Rejected");
                  }}
                  className="flex-1 bg-red-600 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    Reject Partner
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="px-5 bg-slate-800 py-3 rounded-2xl items-center"
              >
                <Text className="text-slate-300 font-bold text-sm uppercase">
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

export default DeliveryPartners;
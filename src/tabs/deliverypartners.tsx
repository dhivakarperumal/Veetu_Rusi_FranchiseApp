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
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  X,
  CreditCard,
  FileText,
  Briefcase,
  ShieldCheck,
} from "lucide-react-native";

import { get, patch, del } from "../services/api";

const DeliveryPartners = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected partner for Details Modal
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
    Alert.alert(
      `${newStatus} Partner`,
      `Are you sure you want to change status of ${partner.name} to ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
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
          },
        },
      ]
    );
  };

  const handleDelete = async (partner: any) => {
    Alert.alert(
      "Delete Partner",
      `Are you sure you want to remove ${partner.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await del(`/admin/delivery-partners/${partner.id}`);
              Alert.alert("Deleted", "Delivery partner removed successfully.");
              if (selectedPartner?.id === partner.id) {
                setIsDetailOpen(false);
                setSelectedPartner(null);
              }
              fetchPartners();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete partner.");
            }
          },
        },
      ]
    );
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

              <TouchableOpacity
                onPress={() => navigation.navigate("AddDeliveryPartner")}
                className="bg-emerald-600 px-4 py-3 rounded-xl flex-row items-center"
              >
                <Plus size={18} color="#ffffff" />
                <Text className="text-white font-bold ml-1 text-xs">Add</Text>
              </TouchableOpacity>
            </View>

            {/* ================= SUMMARY METRICS ================= */}
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
                      {partners.length}
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

            {/* PENDING & SUSPENDED CARD */}
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

            {/* ================= STATUS FILTERS ================= */}
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
              Showing {paginatedPartners.length} of {filteredPartners.length}{" "}
              delivery partners
            </Text>
          </View>
        }
        renderItem={({ item }: any) => {
          const statusStyle = getStatusStyle(item.status);

          return (
            <View className="mx-4 mb-4 bg-slate-900 border border-white/10 rounded-2xl p-4">
              {/* ================= TOP INFO ================= */}
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-xl bg-emerald-600/15 items-center justify-center">
                  <Bike size={24} color="#34d399" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-black">
                    {item.name || `${item.first_name || ""} ${item.last_name || ""}`.trim() || "-"}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5 font-medium">
                    {item.vehicle_type || "Bike"} &bull; {item.vehicle_number || "No Vehicle No"}
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

              {/* ================= DETAILS LIST ================= */}
              <View className="mt-4 space-y-1.5">
                {/* Mobile */}
                <View className="flex-row items-center mb-1.5">
                  <Phone size={14} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-2">
                    {item.mobile || "-"}
                  </Text>
                </View>

                {/* Email */}
                {item.email ? (
                  <View className="flex-row items-center mb-1.5">
                    <Mail size={14} color="#64748b" />
                    <Text className="text-slate-400 text-xs ml-2">
                      {item.email}
                    </Text>
                  </View>
                ) : null}

                {/* Location */}
                <View className="flex-row items-center">
                  <MapPin size={14} color="#64748b" />
                  <Text
                    className="text-slate-400 text-xs ml-2 flex-1"
                    numberOfLines={1}
                  >
                    {[item.city, item.state, item.pincode]
                      .filter(Boolean)
                      .join(", ") ||
                      item.current_address ||
                      item.live_location ||
                      "N/A"}
                  </Text>
                </View>
              </View>

              {/* ================= EXTRA METRICS ================= */}
              <View className="flex-row mt-3.5 gap-2">
                <View className="flex-1 bg-slate-950 rounded-xl p-2.5">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Vehicle Model
                  </Text>
                  <Text
                    className="text-white text-xs font-bold mt-0.5"
                    numberOfLines={1}
                  >
                    {item.vehicle_brand
                      ? `${item.vehicle_brand} ${item.vehicle_model || ""}`
                      : item.vehicle_model || "N/A"}
                  </Text>
                </View>

                <View className="flex-1 bg-slate-950 rounded-xl p-2.5">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Preferred Radius
                  </Text>
                  <Text className="text-white text-xs font-bold mt-0.5">
                    {item.preferred_distance ||
                      (item.delivery_radius
                        ? `${item.delivery_radius} KM`
                        : "N/A")}
                  </Text>
                </View>
              </View>

              {/* ================= LOGIN CREDENTIALS ================= */}
              {item.status === "Approved" && (
                <View className="mt-3 bg-slate-950 rounded-xl p-3">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Login Credentials
                  </Text>
                  <Text className="text-slate-300 text-xs mt-1">
                    User:{" "}
                    <Text className="text-white font-bold">
                      {item.email || item.mobile || "N/A"}
                    </Text>
                  </Text>
                  <Text className="text-slate-300 text-xs mt-0.5">
                    Pass: <Text className="text-slate-500">********</Text>
                  </Text>
                </View>
              )}

              {/* ================= ACTION BUTTONS ================= */}
              <View className="flex-row items-center mt-4 pt-3 border-t border-white/10 gap-2">
                {/* Details Button */}
                <TouchableOpacity
                  onPress={() => openPartnerDetails(item)}
                  className="flex-1 bg-slate-800 border border-white/10 rounded-xl py-2.5 flex-row items-center justify-center"
                >
                  <Eye size={15} color="#cbd5e1" />
                  <Text className="text-slate-200 text-xs font-bold ml-1.5">
                    Details
                  </Text>
                </TouchableOpacity>

                {/* Edit Button */}
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("EditDeliveryPartner", {
                      partnerId: item.id,
                      partner: item,
                    })
                  }
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Briefcase size={16} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Approve Button */}
                {item.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Approved")}
                    className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl items-center justify-center"
                  >
                    <Check size={17} color="#34d399" />
                  </TouchableOpacity>
                )}

                {/* Suspend Button */}
                {item.status === "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Suspended")}
                    className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center"
                  >
                    <ShieldAlert size={17} color="#fbbf24" />
                  </TouchableOpacity>
                )}

                {/* Delete Button */}
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
            {/* Modal Header */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-lg font-black" numberOfLines={1}>
                  {selectedPartner?.name ||
                    `${selectedPartner?.first_name || ""} ${
                      selectedPartner?.last_name || ""
                    }`.trim()}
                </Text>
                <Text className="text-emerald-200 text-xs font-bold uppercase tracking-wider mt-0.5">
                  Delivery Partner Overview
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
                  👤 Personal Information
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Mobile
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.mobile || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Alt Mobile
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.alt_mobile || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Email
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.email || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Gender / Blood
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.gender || "—"} &bull;{" "}
                      {selectedPartner?.blood_group || "—"}
                    </Text>
                  </View>
                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      DOB & Age
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.date_of_birth
                        ? selectedPartner.date_of_birth.substring(0, 10)
                        : "—"}{" "}
                      {selectedPartner?.age ? `(${selectedPartner.age} yrs)` : ""}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Address Section */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  📍 Address & Live GPS
                </Text>
                <View className="p-1.5">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase">
                    Current Address
                  </Text>
                  <Text className="text-white text-xs font-semibold mt-0.5">
                    {selectedPartner?.current_address || "—"}
                  </Text>
                </View>
                <View className="p-1.5">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase">
                    City, State & Pincode
                  </Text>
                  <Text className="text-white text-xs font-semibold mt-0.5">
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
                  <Text className="text-slate-400 text-[10px] font-bold uppercase">
                    Live GPS / Location
                  </Text>
                  <Text className="text-emerald-400 text-xs font-mono font-bold mt-0.5">
                    {selectedPartner?.live_location || "—"}
                  </Text>
                </View>
              </View>

              {/* Emergency Contact */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  📞 Emergency Contact
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Contact Name
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.emergency_contact_name || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Relationship
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.emergency_contact_relationship || "—"}
                    </Text>
                  </View>
                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Emergency Phone
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.emergency_contact_mobile || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vehicle & License Section */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  🛵 Vehicle & License
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Vehicle Type
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.vehicle_type || "Bike"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Brand / Model
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.vehicle_brand}{" "}
                      {selectedPartner?.vehicle_model}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Vehicle Number
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.vehicle_number || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      License Number
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.license_number || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bank & Identity */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  🏦 Bank & Identity
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Bank Name
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.bank_name || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      A/C Number
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.bank_account_number || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      IFSC / UPI
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.ifsc_code || "—"} &bull;{" "}
                      {selectedPartner?.upi_id || "—"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Aadhaar / PAN
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.aadhaar_number || "—"} &bull;{" "}
                      {selectedPartner?.pan_number || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Preferences */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800">
                <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-2">
                  ⚙️ Work Preferences
                </Text>
                <View className="p-1.5">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase">
                    Delivery Zones
                  </Text>
                  <Text className="text-white text-xs font-semibold mt-0.5">
                    {selectedPartner?.available_areas || "—"}
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Preferred Distance
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.preferred_distance || "3 KM"}
                    </Text>
                  </View>
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      Driving Exp
                    </Text>
                    <Text className="text-white text-xs font-semibold mt-0.5">
                      {selectedPartner?.driving_experience
                        ? `${selectedPartner.driving_experience} Years`
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom Actions */}
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
                <Briefcase size={15} color="#cbd5e1" />
                <Text className="text-slate-300 font-bold text-xs uppercase ml-1.5">
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
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
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
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    Reject Partner
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

export default DeliveryPartners;
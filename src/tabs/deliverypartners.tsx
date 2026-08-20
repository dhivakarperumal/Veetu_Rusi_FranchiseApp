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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Bike,
  CheckCircle,
  Clock,
  Search,
  Filter,
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
          p.vehicle_model?.toLowerCase().includes(query)
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
              fetchPartners();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete partner.");
            }
          },
        },
      ]
    );
  };

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
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-1">
                <Text className="text-white text-3xl font-black">
                  Delivery Partners
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Manage and onboard fleet partners
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

            {/* Summary Cards */}
            <View className="flex-row mb-3">
              <View className="flex-1 bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 mr-2">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-indigo-600/20 items-center justify-center">
                    <Users size={20} color="#818cf8" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-indigo-300/70 text-[9px] font-bold uppercase">
                      Total
                    </Text>
                    <Text className="text-white text-xl font-black mt-0.5">
                      {partners.length}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-1 bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 ml-2">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-emerald-600/20 items-center justify-center">
                    <CheckCircle size={20} color="#34d399" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-emerald-300/70 text-[9px] font-bold uppercase">
                      Approved
                    </Text>
                    <Text className="text-white text-xl font-black mt-0.5">
                      {approvedCount}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 mb-5">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-amber-600/20 items-center justify-center">
                  <Clock size={20} color="#fbbf24" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-amber-300/70 text-[9px] font-bold uppercase">
                    Pending & Suspended
                  </Text>
                  <Text className="text-white text-xl font-black mt-0.5">
                    {pendingCount + suspendedCount}
                  </Text>
                </View>
              </View>
            </View>

            {/* Search */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, mobile, vehicle..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
            </View>

            {/* Filters */}
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
                      className={`px-2.5 py-1.5 rounded-lg mr-1.5 ${
                        active
                          ? "bg-emerald-600"
                          : "bg-slate-900 border border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-[9px] font-bold ${
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
              {/* Top info */}
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-xl bg-emerald-600/15 items-center justify-center">
                  <Bike size={22} color="#34d399" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-black">
                    {item.name || `${item.first_name || ""} ${item.last_name || ""}`}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5 font-medium">
                    {item.vehicle_type} &bull; {item.vehicle_number || "No Vehicle Number"}
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

              {/* Info details */}
              <View className="mt-4 space-y-1.5">
                <View className="flex-row items-center mb-1.5">
                  <Phone size={14} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-2">
                    {item.mobile || "—"}
                  </Text>
                </View>

                {item.email ? (
                  <View className="flex-row items-center mb-1.5">
                    <Mail size={14} color="#64748b" />
                    <Text className="text-slate-400 text-xs ml-2">
                      {item.email}
                    </Text>
                  </View>
                ) : null}

                <View className="flex-row items-center">
                  <MapPin size={14} color="#64748b" />
                  <Text className="text-slate-400 text-xs ml-2 flex-1" numberOfLines={1}>
                    {item.city || item.current_address || "No Address"}
                  </Text>
                </View>
              </View>

              {/* Login Credentials if Approved */}
              {item.status === "Approved" && (
                <View className="mt-3 bg-slate-950 rounded-xl p-3">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Login Credentials
                  </Text>
                  <Text className="text-slate-300 text-xs mt-1">
                    User: <Text className="text-white font-bold">{item.email || item.mobile}</Text>
                  </Text>
                  <Text className="text-slate-300 text-xs mt-0.5">
                    Pass: <Text className="text-slate-500">********</Text>
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row items-center mt-4 pt-3 border-t border-white/10 gap-2">
                {item.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Approved")}
                    className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-2.5 flex-row items-center justify-center"
                  >
                    <Check size={16} color="#34d399" />
                    <Text className="text-emerald-400 text-xs font-bold ml-1.5">
                      Approve
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === "Approved" && (
                  <TouchableOpacity
                    onPress={() => handleStatusChange(item, "Suspended")}
                    className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl py-2.5 flex-row items-center justify-center"
                  >
                    <ShieldAlert size={16} color="#fbbf24" />
                    <Text className="text-amber-400 text-xs font-bold ml-1.5">
                      Suspend
                    </Text>
                  </TouchableOpacity>
                )}

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
    </View>
  );
};

export default DeliveryPartners;
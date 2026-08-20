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
} from "lucide-react-native";

import { get } from "../services/api";

const HomeChef = () => {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [chefs, setChefs] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  useEffect(() => {
    fetchHomeChefs();
  }, []);

  const fetchHomeChefs = async () => {
    try {
      const data: any = await get("/superadmin/homechefs");

      if (Array.isArray(data)) {
        setChefs(data);
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
          chef.kitchen_name?.toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (chef) => chef.status === statusFilter
      );
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

  const handleApprove = async (chef: any) => {
    Alert.alert(
      "Approve Home Chef",
      `Approve ${chef.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Approve",
          onPress: async () => {
            try {
              /*
               * If your mobile API has the same endpoint as web:
               *
               * await patch(`/admin/homechefs/${chef.id}/status`, {
               *   status: "Approved",
               * });
               *
               * Add patch() to api.ts if needed.
               */

              Alert.alert(
                "Info",
                "Connect the status update API here."
              );
            } catch (error) {
              console.log("Approve Error:", error);
            }
          },
        },
      ]
    );
  };

  const handleSuspend = async (chef: any) => {
    Alert.alert(
      "Suspend Home Chef",
      `Suspend ${chef.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Suspend",
          style: "destructive",
          onPress: async () => {
            try {
              Alert.alert(
                "Info",
                "Connect the status update API here."
              );
            } catch (error) {
              console.log("Suspend Error:", error);
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
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              Alert.alert(
                "Info",
                "Connect the delete API here."
              );
            } catch (error) {
              console.log("Delete Error:", error);
            }
          },
        },
      ]
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator
          size="large"
          color="#10b981"
        />

        <Text className="text-white mt-3 font-semibold">
          Loading Home Chefs...
        </Text>
      </View>
    );
  }

  // --------------------------------------------------
  // HEADER
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

                <Text className="text-slate-400 mt-1">
                  Manage and monitor home chefs
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AddHomeChef")
                }
                className="bg-emerald-600 px-4 py-3 rounded-xl flex-row items-center"
              >
                <Plus
                  size={18}
                  color="#ffffff"
                />

                <Text className="text-white font-bold ml-1">
                  Add
                </Text>
              </TouchableOpacity>

            </View>

            {/* ================= SUMMARY CARDS ================= */}

            <View className="flex-row mb-5">

              {/* TOTAL */}

              <View className="flex-1 bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 mr-2">

                <View className="flex-row items-center">

                  <View className="w-11 h-11 rounded-xl bg-indigo-600/20 items-center justify-center">
                    <Users
                      size={21}
                      color="#818cf8"
                    />
                  </View>

                  <View className="ml-3 flex-1">

                    <Text className="text-indigo-300/70 text-[10px] font-bold uppercase">
                      Total
                    </Text>

                    <Text className="text-white text-2xl font-black mt-1">
                      {chefs.length}
                    </Text>

                  </View>

                </View>

              </View>

              {/* APPROVED */}

              <View className="flex-1 bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 ml-2">

                <View className="flex-row items-center">

                  <View className="w-11 h-11 rounded-xl bg-emerald-600/20 items-center justify-center">
                    <CheckCircle
                      size={21}
                      color="#34d399"
                    />
                  </View>

                  <View className="ml-3 flex-1">

                    <Text className="text-emerald-300/70 text-[10px] font-bold uppercase">
                      Approved
                    </Text>

                    <Text className="text-white text-2xl font-black mt-1">
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
                  <Clock
                    size={21}
                    color="#fbbf24"
                  />
                </View>

                <View className="ml-3 flex-1">

                  <Text className="text-amber-300/70 text-[10px] font-bold uppercase">
                    Pending & Suspended
                  </Text>

                  <Text className="text-white text-2xl font-black mt-1">
                    {pendingCount + suspendedCount}
                  </Text>

                </View>

              </View>

            </View>

            {/* ================= SEARCH ================= */}

            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">

              <Search
                size={19}
                color="#64748b"
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, email, mobile..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3"
              />

            </View>

            {/* ================= FILTER ================= */}

            <View className="flex-row items-center mb-5">

              <Filter
                size={17}
                color="#94a3b8"
              />

              <Text className="text-slate-400 ml-2 mr-3 text-xs font-bold">
                STATUS
              </Text>

              {[
                "All",
                "Pending",
                "Approved",
                "Suspended",
                "Rejected",
              ].map((status) => {

                const active =
                  statusFilter === status;

                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() =>
                      setStatusFilter(status)
                    }
                    className={`px-3 py-2 rounded-lg mr-2 ${
                      active
                        ? "bg-emerald-600"
                        : "bg-slate-900 border border-white/10"
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        active
                          ? "text-white"
                          : "text-slate-400"
                      }`}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}

            </View>

            {/* RESULT COUNT */}

            <Text className="text-slate-500 text-xs mb-3">
              Showing {paginatedChefs.length} of{" "}
              {filteredChefs.length} home chefs
            </Text>

          </View>
        }

        renderItem={({ item }: any) => {

          const statusStyle =
            getStatusStyle(item.status);

          return (
            <View className="mx-4 mb-4 bg-slate-900 border border-white/10 rounded-2xl p-4">

              {/* ================= CHEF HEADER ================= */}

              <View className="flex-row items-start">

                <View className="w-12 h-12 rounded-xl bg-emerald-600/15 items-center justify-center">

                  <ChefHat
                    size={23}
                    color="#34d399"
                  />

                </View>

                <View className="flex-1 ml-3">

                  <Text className="text-white text-base font-black">
                    {item.name || "-"}
                  </Text>

                  <Text className="text-slate-400 text-xs mt-1">
                    {item.kitchen_name ||
                      "No Kitchen Details"}
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

              <View className="mt-4">

                {/* EMAIL */}

                <View className="flex-row items-center mb-2">

                  <Mail
                    size={15}
                    color="#64748b"
                  />

                  <Text className="text-slate-400 text-xs ml-2 flex-1">
                    {item.email || "-"}
                  </Text>

                </View>

                {/* MOBILE */}

                <View className="flex-row items-center mb-2">

                  <Phone
                    size={15}
                    color="#64748b"
                  />

                  <Text className="text-slate-400 text-xs ml-2">
                    {item.mobile || "-"}
                  </Text>

                </View>

                {/* CUISINE */}

                <View className="flex-row items-start mb-2">

                  <Utensils
                    size={15}
                    color="#64748b"
                    style={{ marginTop: 2 }}
                  />

                  <Text className="text-slate-400 text-xs ml-2 flex-1">

                    {item.cuisine_type ||
                      "N/A"}

                  </Text>

                </View>

                {/* LOCATION */}

                <View className="flex-row items-center">

                  <MapPin
                    size={15}
                    color="#64748b"
                  />

                  <Text className="text-slate-400 text-xs ml-2 flex-1">

                    {[
                      item.city,
                      item.state,
                      item.pincode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "N/A"}

                  </Text>

                </View>

              </View>

              {/* ================= EXTRA DETAILS ================= */}

              <View className="flex-row mt-4">

                <View className="flex-1 bg-slate-950 rounded-xl p-3 mr-2">

                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Delivery Radius
                  </Text>

                  <Text className="text-white text-xs font-bold mt-1">
                    {item.delivery_radius ||
                      "N/A"}
                  </Text>

                </View>

                <View className="flex-1 bg-slate-950 rounded-xl p-3 ml-2">

                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Daily Capacity
                  </Text>

                  <Text className="text-white text-xs font-bold mt-1">
                    {item.daily_order_capacity ||
                      "N/A"}
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
                      {item.username ||
                        item.email ||
                        "N/A"}
                    </Text>
                  </Text>

                  <Text className="text-slate-300 text-xs mt-1">
                    Pass:{" "}
                    <Text className="text-slate-500">
                      ********
                    </Text>
                  </Text>

                </View>
              )}

              {/* ================= ACTIONS ================= */}

              <View className="flex-row items-center mt-4 pt-3 border-t border-white/10">

                {/* VIEW */}

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "HomeChefDetails",
                      {
                        chefId: item.id,
                      }
                    )
                  }
                  className="flex-1 bg-slate-800 border border-white/10 rounded-xl py-2.5 flex-row items-center justify-center mr-1"
                >

                  <Eye
                    size={16}
                    color="#cbd5e1"
                  />

                  <Text className="text-slate-200 text-xs font-bold ml-1">
                    Details
                  </Text>

                </TouchableOpacity>

                {/* EDIT */}

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      "EditHomeChef",
                      {
                        chefId: item.id,
                        chef: item,
                      }
                    )
                  }
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center mx-1"
                >

                  <Edit3
                    size={16}
                    color="#cbd5e1"
                  />

                </TouchableOpacity>

                {/* APPROVE */}

                {item.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() =>
                      handleApprove(item)
                    }
                    className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl items-center justify-center mx-1"
                  >

                    <Check
                      size={17}
                      color="#34d399"
                    />

                  </TouchableOpacity>
                )}

                {/* SUSPEND */}

                {item.status === "Approved" && (
                  <TouchableOpacity
                    onPress={() =>
                      handleSuspend(item)
                    }
                    className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center mx-1"
                  >

                    <ShieldAlert
                      size={17}
                      color="#fbbf24"
                    />

                  </TouchableOpacity>
                )}

                {/* DELETE */}

                <TouchableOpacity
                  onPress={() =>
                    handleDelete(item)
                  }
                  className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center ml-1"
                >

                  <Trash2
                    size={16}
                    color="#f87171"
                  />

                </TouchableOpacity>

              </View>

            </View>
          );
        }}

        ListEmptyComponent={
          <View className="items-center mt-16 px-5">

            <ChefHat
              size={45}
              color="#475569"
            />

            <Text className="text-slate-400 mt-4 text-sm">
              No home chefs match your criteria.
            </Text>

          </View>
        }

        ListFooterComponent={
          filteredChefs.length > 0 ? (
            <View className="flex-row justify-center items-center mt-2 px-4">

              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl items-center justify-center"
                style={{
                  opacity:
                    currentPage === 1 ? 0.4 : 1,
                }}
              >
                <ChevronLeft
                  size={18}
                  color="#ffffff"
                />
              </TouchableOpacity>

              <Text className="text-slate-300 text-xs font-bold mx-5">
                Page {currentPage} of{" "}
                {totalPages}
              </Text>

              <TouchableOpacity
                disabled={
                  currentPage === totalPages
                }
                onPress={() =>
                  setCurrentPage((prev) =>
                    Math.min(
                      prev + 1,
                      totalPages
                    )
                  )
                }
                className="w-10 h-10 bg-slate-900 border border-white/10 rounded-xl items-center justify-center"
                style={{
                  opacity:
                    currentPage === totalPages
                      ? 0.4
                      : 1,
                }}
              >
                <ChevronRight
                  size={18}
                  color="#ffffff"
                />
              </TouchableOpacity>

            </View>
          ) : null
        }
      />

    </View>
  );
};

export default HomeChef;
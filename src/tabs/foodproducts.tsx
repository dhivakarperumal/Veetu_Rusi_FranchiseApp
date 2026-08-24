import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import {
  Search,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  X,
  Check,
  FastForward,
  Utensils,
} from "lucide-react-native";
import { get, put, del } from "../services/api";
// If your api file doesn't export del, change del(...) to your delete method.

const API_BASE_URL = "https://veeturusi.qtechx.com";

type Food = {
  id: number | string;
  name?: string;
  product_code?: string;
  category?: string;
  cuisine?: string;
  product_type?: string;
  description?: string;
  chef_name?: string;
  kitchen_name?: string;
  chef_phone?: string;
  mobile?: string;
  created_by?: string;
  franchise_name?: string;
  final_price?: number;
  mrp?: number;
  status?: string;
  image?: string;
  images?: string | string[];
};

type Chef = {
  id?: number | string;
  chef_id?: number | string;
  name?: string;
};

const STATUS_OPTIONS = [
  "All",
  "Approved",
  "Not Approved",
  "Active",
  "Inactive",
  "Pending",
  "Suspended",
  "Rejected",
];

const ITEMS_PER_PAGE = 10;

const FoodProducts = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedChef, setSelectedChef] = useState("All");

  const [activeTab, setActiveTab] = useState<"food" | "foodProducts">(
    "food"
  );

  const [currentPage, setCurrentPage] = useState(1);

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showChefDropdown, setShowChefDropdown] = useState(false);

  const [approvalItem, setApprovalItem] = useState<Food | null>(null);

  const [approvalChecklist, setApprovalChecklist] = useState({
    taste: false,
    quality: false,
    packaging: false,
  });

  /*
   * -------------------------------------------------------
   * IMAGE URL
   * Same logic as web version
   * -------------------------------------------------------
   */
  const getImageUrl = (item: Food) => {
    let imgPath: string | null = null;

    let parsedImages: any = item.images;

    if (typeof parsedImages === "string") {
      try {
        parsedImages = JSON.parse(parsedImages);
      } catch {
        // Not JSON
      }
    }

    if (
      parsedImages &&
      Array.isArray(parsedImages) &&
      parsedImages.length > 0
    ) {
      imgPath = parsedImages[0];
    } else if (item.image) {
      imgPath = item.image;
    }

    if (!imgPath || typeof imgPath !== "string") {
      return null;
    }

    if (
      imgPath.startsWith("http") ||
      imgPath.startsWith("data:")
    ) {
      return imgPath;
    }

    return `${API_BASE_URL}${imgPath.startsWith("/") ? "" : "/"
      }${imgPath}`;
  };

  /*
   * -------------------------------------------------------
   * FETCH CHEFS
   * -------------------------------------------------------
   */
  const fetchChefs = async () => {
    try {
      const response = await get<any>("/admin/homechefs");

      const data = response?.data ?? response;

      setChefs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Failed to load chefs:", error);
    }
  };

  /*
   * -------------------------------------------------------
   * FETCH FOODS
   * -------------------------------------------------------
   */
  const fetchFoods = useCallback(async () => {
    try {
      setLoading(true);

      let endpoint =
        activeTab === "food"
          ? "/chef-foods"
          : "/products";

      const params: any = {};

      /*
       * Chef filter
       */
      if (selectedChef !== "All") {
        params.chef_id = selectedChef;
      }

      /*
       * Search
       *
       * Backend may support search.
       * Status filtering is intentionally done locally,
       * same as web version.
       */
      if (search.trim()) {
        params.search = search.trim();
      }

      /*
       * Food Products tab
       */
      if (activeTab === "foodProducts") {
        params.source = "chef_products";
      }

      /*
       * IMPORTANT:
       * If you have auth context, you can add the same
       * role-based restrictions here.
       *
       * Example:
       *
       * if (user?.role === "home_chef") {
       *   params.chef_user_id = user.user_id || user.id;
       * }
       */

      let response: any;

      /*
       * Most API wrappers accept params as the second argument.
       */
      response = await get<any>(endpoint, params);

      const data = response?.data ?? response;

      setFoods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Food Products Error:", error);
      setFoods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedChef, search]);

  /*
   * -------------------------------------------------------
   * INITIAL LOAD
   * -------------------------------------------------------
   */
  useEffect(() => {
    fetchChefs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchFoods();
  }, [activeTab, selectedChef]);

  /*
   * Search with small delay
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchFoods();
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /*
   * -------------------------------------------------------
   * REFRESH
   * -------------------------------------------------------
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchFoods();
  };

  /*
   * -------------------------------------------------------
   * STATUS FILTER
   * Same logic as web
   * -------------------------------------------------------
   */
  const filteredFoods = useMemo(() => {
    return foods.filter((item) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch = searchText
        ? [
          item.name,
          item.product_code,
          item.category,
          item.cuisine,
          item.product_type,
          item.chef_name,
          item.chef_phone,
          item.created_by,
          item.franchise_name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(searchText)
          )
        : true;

      let matchesStatus = true;

      if (statusFilter === "Approved") {
        matchesStatus =
          item.status === "Active" ||
          item.status === "Approved";
      } else if (statusFilter === "Not Approved") {
        matchesStatus =
          item.status !== "Active" &&
          item.status !== "Approved";
      } else if (statusFilter !== "All") {
        matchesStatus = item.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [foods, search, statusFilter]);

  /*
   * -------------------------------------------------------
   * SUMMARY
   * Same as web
   * -------------------------------------------------------
   */
  const summary = useMemo(() => {
    const total = foods.length;

    const active = foods.filter(
      (item) =>
        item.status === "Active" ||
        item.status === "Approved"
    ).length;

    const inactive = foods.filter((item) =>
      ["Inactive", "Suspended", "Rejected"].includes(
        item.status || ""
      )
    ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [foods]);

  /*
   * -------------------------------------------------------
   * PAGINATION
   * -------------------------------------------------------
   */
  const totalPages = Math.ceil(
    filteredFoods.length / ITEMS_PER_PAGE
  );

  const paginatedFoods = filteredFoods.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /*
   * -------------------------------------------------------
   * HELPERS
   * -------------------------------------------------------
   */
  const getKitchenName = (item: Food) =>
    item.chef_name ||
    item.kitchen_name ||
    item.created_by ||
    item.franchise_name ||
    "N/A";

  const getTypeDisplay = (item: Food) =>
    item.cuisine ||
    item.product_type ||
    item.category ||
    "-";

  const getMobile = (item: Food) =>
    item.chef_phone ||
    item.mobile ||
    "-";

  const getDescription = (item: Food) =>
    item.description ||
    item.category ||
    item.product_type ||
    "No description";

  /*
   * -------------------------------------------------------
   * STATUS COLOR
   * -------------------------------------------------------
   */
  const getStatusColor = (status?: string) => {
    if (
      status === "Active" ||
      status === "Approved"
    ) {
      return {
        bg: "#064e3b",
        text: "#34d399",
      };
    }

    if (status === "Pending") {
      return {
        bg: "#713f12",
        text: "#facc15",
      };
    }

    return {
      bg: "#7f1d1d",
      text: "#f87171",
    };
  };

  /*
   * -------------------------------------------------------
   * UPDATE STATUS
   * -------------------------------------------------------
   */
  const handleStatusUpdate = async (
    item: Food,
    newStatus: string
  ) => {
    try {
      const endpoint =
        activeTab === "food"
          ? `/chef-foods/${item.id}`
          : `/products/${item.id}`;

      await put(endpoint, {
        status: newStatus,
      });

      Alert.alert(
        "Success",
        `Food status updated to ${newStatus}`
      );

      fetchFoods();
    } catch (error) {
      console.log(
        "Failed to update food status:",
        error
      );

      Alert.alert(
        "Error",
        "Failed to update food status"
      );
    }
  };

  /*
   * -------------------------------------------------------
   * APPROVAL MODAL
   * -------------------------------------------------------
   */
  const openApprovalModal = (item: Food) => {
    setApprovalItem(item);

    setApprovalChecklist({
      taste: false,
      quality: false,
      packaging: false,
    });
  };

  const closeApprovalModal = () => {
    setApprovalItem(null);

    setApprovalChecklist({
      taste: false,
      quality: false,
      packaging: false,
    });
  };

  const toggleChecklist = (
    key: "taste" | "quality" | "packaging"
  ) => {
    setApprovalChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const canApprove =
    approvalChecklist.taste &&
    approvalChecklist.quality &&
    approvalChecklist.packaging;

  const handleApprove = async () => {
    if (!approvalItem || !canApprove) return;

    await handleStatusUpdate(
      approvalItem,
      "Active"
    );

    closeApprovalModal();
  };

  /*
   * -------------------------------------------------------
   * DELETE
   * -------------------------------------------------------
   */
  const handleDelete = (item: Food) => {
    Alert.alert(
      "Delete Food",
      "Are you sure you want to delete this item?",
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
              const endpoint =
                activeTab === "food"
                  ? `/chef-foods/${item.id}`
                  : `/products/${item.id}`;

              await del(endpoint);

              Alert.alert(
                "Success",
                "Item deleted successfully"
              );

              fetchFoods();
            } catch (error) {
              console.log("Delete error:", error);

              Alert.alert(
                "Error",
                "Failed to delete item"
              );
            }
          },
        },
      ]
    );
  };

  /*
   * -------------------------------------------------------
   * STATUS DROPDOWN
   * -------------------------------------------------------
   */
  const renderStatusDropdown = () => (
    <Modal
      visible={showStatusDropdown}
      transparent
      animationType="fade"
      onRequestClose={() =>
        setShowStatusDropdown(false)
      }
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() =>
          setShowStatusDropdown(false)
        }
        className="flex-1 bg-black/60 justify-center px-6"
      >
        <View className="bg-slate-900 rounded-2xl overflow-hidden">
          <Text className="text-white text-lg font-bold px-5 py-4 border-b border-slate-700">
            Select Status
          </Text>

          {STATUS_OPTIONS.map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => {
                setStatusFilter(status);
                setCurrentPage(1);
                setShowStatusDropdown(false);
              }}
              className={`px-5 py-4 border-b border-slate-800 ${statusFilter === status
                  ? "bg-emerald-900/40"
                  : ""
                }`}
            >
              <Text
                className={`font-semibold ${statusFilter === status
                    ? "text-emerald-400"
                    : "text-slate-200"
                  }`}
              >
                {status === "All"
                  ? "All Statuses"
                  : status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  /*
   * -------------------------------------------------------
   * CHEF DROPDOWN
   * -------------------------------------------------------
   */
  const renderChefDropdown = () => (
    <Modal
      visible={showChefDropdown}
      transparent
      animationType="fade"
      onRequestClose={() =>
        setShowChefDropdown(false)
      }
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() =>
          setShowChefDropdown(false)
        }
        className="flex-1 bg-black/60 justify-center px-6"
      >
        <View className="bg-slate-900 rounded-2xl overflow-hidden">
          <Text className="text-white text-lg font-bold px-5 py-4 border-b border-slate-700">
            Select Chef
          </Text>

          <TouchableOpacity
            onPress={() => {
              setSelectedChef("All");
              setCurrentPage(1);
              setShowChefDropdown(false);
            }}
            className={`px-5 py-4 border-b border-slate-800 ${selectedChef === "All"
                ? "bg-emerald-900/40"
                : ""
              }`}
          >
            <Text
              className={`font-semibold ${selectedChef === "All"
                  ? "text-emerald-400"
                  : "text-slate-200"
                }`}
            >
              All Chefs
            </Text>
          </TouchableOpacity>

          {chefs.map((chef) => {
            const id = String(
              chef.chef_id ?? chef.id
            );

            return (
              <TouchableOpacity
                key={id}
                onPress={() => {
                  setSelectedChef(id);
                  setCurrentPage(1);
                  setShowChefDropdown(false);
                }}
                className={`px-5 py-4 border-b border-slate-800 ${selectedChef === id
                    ? "bg-emerald-900/40"
                    : ""
                  }`}
              >
                <Text
                  className={`font-semibold ${selectedChef === id
                      ? "text-emerald-400"
                      : "text-slate-200"
                    }`}
                >
                  {chef.name || "Unnamed Chef"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  /*
   * -------------------------------------------------------
   * SUMMARY CARD
   * -------------------------------------------------------
   */
  const SummaryCard = ({
    title,
    value,
    icon,
    active,
    onPress,
    iconBg,
    iconColor,
  }: any) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-3xl p-5 mr-3 w-64 ${active
          ? "bg-slate-800"
          : "bg-slate-900"
        }`}
      style={{
        borderWidth: active ? 2 : 1,
        borderColor: active
          ? iconColor
          : "#1e293b",
      }}
    >
      <View className="flex-row items-center justify-between">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{
            backgroundColor: iconBg,
          }}
        >
          <Text className="text-2xl">
            {icon}
          </Text>
        </View>

        <Text className="text-slate-400 text-[10px] font-bold uppercase">
          {title}
        </Text>
      </View>

      <Text className="text-white text-4xl font-black mt-5">
        {value}
      </Text>

      <Text className="text-slate-400 text-xs mt-2">
        {title === "Total Foods"
          ? "All chef food items currently loaded."
          : title === "Active Foods"
            ? "Active food items ready for sale."
            : "Food items currently inactive or blocked."}
      </Text>
    </TouchableOpacity>
  );

  /*
   * -------------------------------------------------------
   * FOOD CARD
   * -------------------------------------------------------
   */
  const renderFood = ({
    item,
    index,
  }: {
    item: Food;
    index: number;
  }) => {
    const imageUrl = getImageUrl(item);

    const statusColor = getStatusColor(
      item.status
    );

    return (
      <View className="bg-white mx-4 mb-5 rounded-3xl overflow-hidden border border-slate-200">
        {/* Header / Image */}
        <View className="bg-slate-950 h-48 relative overflow-hidden">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
            />
          ) : null}

          <View
            className="absolute inset-0"
            style={{
              backgroundColor: imageUrl
                ? "rgba(2,6,23,0.60)"
                : "#020617",
            }}
          />

          <View className="absolute inset-0 p-5 flex-row justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                {item.category || "Food Product"}
              </Text>

              <Text
                className="text-white text-xl font-black mt-2"
                numberOfLines={2}
              >
                {item.name ||
                  item.product_code ||
                  "Unnamed Food"}
              </Text>
            </View>

            <View
              className="px-3 py-1.5 rounded-full self-start"
              style={{
                backgroundColor:
                  statusColor.bg,
              }}
            >
              <Text
                className="text-[10px] font-black uppercase"
                style={{
                  color: statusColor.text,
                }}
              >
                {item.status || "Unknown"}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View className="p-5">
          <Text
            className="text-slate-600 text-sm"
            numberOfLines={2}
          >
            {getDescription(item)}
          </Text>

          <View className="mt-4">
            <InfoRow
              label="Kitchen"
              value={getKitchenName(item)}
            />

            <InfoRow
              label="Cuisine"
              value={getTypeDisplay(item)}
            />

            <InfoRow
              label="Phone"
              value={getMobile(item)}
            />
          </View>

          {/* Price + Approve */}
          <View className="flex-row items-center justify-between mt-5">
            <View>
              <Text className="text-slate-400 text-[10px] uppercase font-bold">
                Price
              </Text>

              <Text className="text-slate-900 text-xl font-black mt-1">
                ₹
                {item.final_price ??
                  item.mrp ??
                  "0.00"}
              </Text>
            </View>

            {item.status !== "Active" ? (
              <TouchableOpacity
                onPress={() =>
                  openApprovalModal(item)
                }
                className="bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-2xl"
              >
                <Text className="text-emerald-700 text-xs font-black uppercase">
                  Approve
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() =>
                  handleStatusUpdate(
                    item,
                    "Inactive"
                  )
                }
                className="bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl"
              >
                <Text className="text-rose-700 text-xs font-black uppercase">
                  Deactivate
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          <View className="flex-row gap-2 mt-4">
            <TouchableOpacity
              onPress={() => {
                // Connect your navigation here
                Alert.alert(
                  "View",
                  `View food #${item.id}`
                );
              }}
              className="flex-1 flex-row items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl py-3"
            >
              <Eye size={16} color="#475569" />

              <Text className="text-slate-700 text-xs font-black ml-2">
                VIEW
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // Connect your navigation here
                Alert.alert(
                  "Edit",
                  `Edit food #${item.id}`
                );
              }}
              className="flex-1 flex-row items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl py-3"
            >
              <Pencil size={16} color="#475569" />

              <Text className="text-slate-700 text-xs font-black ml-2">
                EDIT
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                handleDelete(item)
              }
              className="flex-1 flex-row items-center justify-center bg-rose-50 border border-rose-200 rounded-2xl py-3"
            >
              <Trash2 size={16} color="#e11d48" />

              <Text className="text-rose-700 text-xs font-black ml-2">
                DELETE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /*
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */
  if (loading && !refreshing && foods.length === 0) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator
          size="large"
          color="#14B8A6"
        />

        <Text className="text-slate-400 mt-4">
          Loading food products...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <FlatList
        data={paginatedFoods}
        renderItem={renderFood}
        keyExtractor={(item, index) =>
          String(item.id ?? index)
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14B8A6"
            colors={["#14B8A6"]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Title */}
            <View className="px-4 pt-5 pb-4">
              <Text className="text-white text-2xl font-black">
                Food Products
              </Text>

              <Text className="text-slate-400 mt-1">
                Manage chef food items and products
              </Text>
            </View>

            {/* Summary cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingBottom: 18,
              }}
            >
              <SummaryCard
                title="Total Foods"
                value={summary.total}
                icon="🥘"
                active={statusFilter === "All"}
                onPress={() => {
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                iconBg="#4c1d95"
                iconColor="#8b5cf6"
              />

              <SummaryCard
                title="Active Foods"
                value={summary.active}
                icon="✅"
                active={
                  statusFilter === "Approved"
                }
                onPress={() => {
                  setStatusFilter("Approved");
                  setCurrentPage(1);
                }}
                iconBg="#064e3b"
                iconColor="#10b981"
              />

              <SummaryCard
                title="Inactive / Suspended"
                value={summary.inactive}
                icon="⛔"
                active={
                  statusFilter === "Not Approved"
                }
                onPress={() => {
                  setStatusFilter("Not Approved");
                  setCurrentPage(1);
                }}
                iconBg="#7f1d1d"
                iconColor="#f43f5e"
              />
            </ScrollView>

            {/* Search */}
            <View className="px-4">
              <View className="bg-slate-900 border border-slate-700 rounded-2xl flex-row items-center px-4">
                <Search size={20} color="#94a3b8" />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search food, chef, category..."
                  placeholderTextColor="#64748b"
                  className="flex-1 text-white py-4 ml-3"
                />
              </View>
            </View>

            {/* Filters */}
            <View className="px-4 mt-3 flex-row gap-3">
              {/* Chef */}
              {chefs.length > 0 && (
                <TouchableOpacity
                  onPress={() =>
                    setShowChefDropdown(true)
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-slate-500 text-[9px] uppercase font-bold">
                      Chef
                    </Text>

                    <Text
                      className="text-white text-xs font-bold mt-1"
                      numberOfLines={1}
                    >
                      {selectedChef === "All"
                        ? "All Chefs"
                        : chefs.find(
                          (chef) =>
                            String(
                              chef.chef_id ??
                              chef.id
                            ) ===
                            selectedChef
                        )?.name ||
                        "Selected Chef"}
                    </Text>
                  </View>

                  <ChevronDown size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}

              {/* Status */}
              <TouchableOpacity
                onPress={() =>
                  setShowStatusDropdown(true)
                }
                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-slate-500 text-[9px] uppercase font-bold">
                    Status
                  </Text>

                  <Text className="text-white text-xs font-bold mt-1">
                    {statusFilter === "All"
                      ? "All Statuses"
                      : statusFilter}
                  </Text>
                </View>

                <ChevronDown size={16} color="#94a3b8" /> 
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View className="mx-4 mt-4 bg-slate-900 p-1 rounded-2xl flex-row border border-slate-800">
              <TouchableOpacity
                onPress={() =>
                  setActiveTab("food")
                }
                className={`flex-1 py-3 rounded-xl items-center ${activeTab === "food"
                    ? "bg-white"
                    : ""
                  }`}
              >
                <Text
                  className={`font-bold text-sm ${activeTab === "food"
                      ? "text-emerald-700"
                      : "text-slate-400"
                    }`}
                >
                  Food
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  setActiveTab("foodProducts")
                }
                className={`flex-1 py-3 rounded-xl items-center ${activeTab === "foodProducts"
                    ? "bg-white"
                    : ""
                  }`}
              >
                <Text
                  className={`font-bold text-sm ${activeTab === "foodProducts"
                      ? "text-emerald-700"
                      : "text-slate-400"
                    }`}
                >
                  Food Products
                </Text>
              </TouchableOpacity>
            </View>

            {/* Result info */}
            <View className="px-4 py-4">
              <Text className="text-slate-400 text-xs">
                {activeTab === "food"
                  ? "Showing chef food items from chef_food_table."
                  : "Showing chef products from chef_products table."}
              </Text>

              <Text className="text-slate-500 text-xs mt-1">
                Showing{" "}
                {paginatedFoods.length} of{" "}
                {filteredFoods.length} items
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center py-16">
            <Utensils size={50} color="#475569" />

            <Text className="text-slate-400 mt-4 font-semibold">
              No food products found.
            </Text>
          </View>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View className="flex-row items-center justify-center gap-3 py-6">
              <TouchableOpacity
                disabled={currentPage === 1}
                onPress={() =>
                  setCurrentPage((prev) =>
                    Math.max(prev - 1, 1)
                  )
                }
                className={`px-5 py-3 rounded-xl ${currentPage === 1
                    ? "bg-slate-900"
                    : "bg-slate-700"
                  }`}
              >
                <Text
                  className={`font-bold ${currentPage === 1
                      ? "text-slate-600"
                      : "text-white"
                    }`}
                >
                  Previous
                </Text>
              </TouchableOpacity>

              <Text className="text-slate-300 font-semibold">
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
                className={`px-5 py-3 rounded-xl ${currentPage === totalPages
                    ? "bg-slate-900"
                    : "bg-slate-700"
                  }`}
              >
                <Text
                  className={`font-bold ${currentPage === totalPages
                      ? "text-slate-600"
                      : "text-white"
                    }`}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="h-8" />
          )
        }
      />

      {/* Dropdowns */}
      {renderStatusDropdown()}
      {renderChefDropdown()}

      {/* Approval Modal */}
      <Modal
        visible={!!approvalItem}
        transparent
        animationType="slide"
        onRequestClose={closeApprovalModal}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-950 rounded-t-[32px] p-6 max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-white text-2xl font-black">
                    Approve Food Item
                  </Text>

                  <Text className="text-slate-400 text-sm mt-2">
                    Complete all required checks before approving.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={closeApprovalModal}
                  className="bg-slate-800 rounded-xl p-2"
                >
                  <X size={22} color="#cbd5e1" />
                </TouchableOpacity>
              </View>

              {/* Food */}
              <View className="mt-6 bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  Food
                </Text>

                <Text className="text-white text-xl font-black mt-2">
                  {approvalItem?.name ||
                    "Unnamed Food"}
                </Text>

                <Text className="text-slate-500 text-sm mt-1">
                  {approvalItem?.category ||
                    "No category specified"}
                </Text>
              </View>

              {/* Checklist */}
              <View className="mt-5 bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">
                  Approval Checklist
                </Text>

                <ChecklistRow
                  title="Taste"
                  checked={
                    approvalChecklist.taste
                  }
                  onPress={() =>
                    toggleChecklist("taste")
                  }
                />

                <ChecklistRow
                  title="Quality"
                  checked={
                    approvalChecklist.quality
                  }
                  onPress={() =>
                    toggleChecklist("quality")
                  }
                />

                <ChecklistRow
                  title="Packaging"
                  checked={
                    approvalChecklist.packaging
                  }
                  onPress={() =>
                    toggleChecklist("packaging")
                  }
                />
              </View>

              <Text className="text-slate-500 text-xs mt-4">
                Only when all checklist items are
                selected will the approve button
                become available.
              </Text>

              <TouchableOpacity
                disabled={!canApprove}
                onPress={handleApprove}
                className={`mt-6 rounded-2xl py-4 items-center ${canApprove
                    ? "bg-emerald-500"
                    : "bg-slate-800"
                  }`}
              >
                <Text
                  className={`font-black uppercase tracking-widest ${canApprove
                      ? "text-white"
                      : "text-slate-500"
                    }`}
                >
                  Approve Product
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeApprovalModal}
                className="mt-3 border border-slate-700 rounded-2xl py-4 items-center"
              >
                <Text className="text-slate-300 font-black uppercase tracking-widest">
                  Cancel
                </Text>
              </TouchableOpacity>

              <View className="h-5" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

/*
 * -------------------------------------------------------
 * INFO ROW
 * -------------------------------------------------------
 */
const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <View className="flex-row justify-between py-2">
    <Text className="text-slate-900 text-sm font-black">
      {label}
    </Text>

    <Text
      className="text-slate-500 text-sm flex-1 text-right ml-4"
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

/*
 * -------------------------------------------------------
 * CHECKLIST ROW
 * -------------------------------------------------------
 */
const ChecklistRow = ({
  title,
  checked,
  onPress,
}: {
  title: string;
  checked: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 mt-3"
  >
    <View
      className={`w-6 h-6 rounded-lg items-center justify-center border ${checked
          ? "bg-emerald-500 border-emerald-500"
          : "border-slate-500"
        }`}
    >
      {checked && (
        <Check size={16} color="white" />
      )}
    </View>

    <Text className="text-white font-bold ml-3">
      {title}
    </Text>
  </TouchableOpacity>
);

export default FoodProducts;
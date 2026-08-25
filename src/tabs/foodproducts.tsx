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
  Utensils,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  ShieldAlert,
  Trash2,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Pencil,
  ChefHat,
  Package,
} from "lucide-react-native";
import { get, put, del } from "../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// import FloatingActionButton from "../components/FloatingActionButton";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

const ITEMS_PER_PAGE = 6;

const FoodProducts = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [foods, setFoods] = useState<Food[]>([]);
  const [chefs, setChefs] = useState<Chef[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedChef, setSelectedChef] = useState("All");

  const [activeTab, setActiveTab] = useState<"food" | "foodProducts">("food");
  const [currentPage, setCurrentPage] = useState(1);

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showChefDropdown, setShowChefDropdown] = useState(false);

  // Selected food for details modal
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const [approvalItem, setApprovalItem] = useState<Food | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: "activate" | "deactivate" | "delete";
    item: Food;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [approvalChecklist, setApprovalChecklist] = useState({
    taste: false,
    quality: false,
    packaging: false,
  });

  /*
   * -------------------------------------------------------
   * IMAGE URL
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

    if (imgPath.startsWith("http") || imgPath.startsWith("data:")) {
      return imgPath;
    }

    return `${API_BASE_URL}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`;
  };

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          setCurrentUser(JSON.parse(userData));
        }
      } catch (e) {
        console.log("Error loading user:", e);
      }
    };
    loadUser();
  }, []);

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
      const endpoint =
        activeTab === "food" ? "/chef-foods" : "/products";
      let queryString = "";
      const queryParts: string[] = [];

      if (search.trim()) {
        queryParts.push(`search=${encodeURIComponent(search.trim())}`);
      }

      if (activeTab === "foodProducts") {
        queryParts.push(`source=chef_products`);
      }

      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const franchiseUserId = user?.franchise_user_id || user?.user_id || user?.id;

      if (franchiseUserId) {
        queryParts.push(`franchise_user_id=${encodeURIComponent(franchiseUserId)}`);
      }

      if (queryParts.length > 0) {
        queryString = `?${queryParts.join("&")}`;
      }

      const response: any = await get<any>(`${endpoint}${queryString}`);
      const data = response?.data ?? response;
      setFoods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Food Products Error:", error);
      setFoods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchChefs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchFoods();
  }, [activeTab, fetchFoods]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchFoods();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, fetchFoods]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChefs();
    fetchFoods();
  };

  /*
   * -------------------------------------------------------
   * CHEF & FRANCHISE MATCHING HELPERS
   * -------------------------------------------------------
   */
  const isChefMatch = useCallback(
    (item: Food, targetChefId: string) => {
      if (targetChefId === "All") return true;

      const targetChef = chefs.find(
        (c) =>
          String(c.id) === String(targetChefId) ||
          String(c.chef_id) === String(targetChefId) ||
          String((c as any).user_id) === String(targetChefId) ||
          String(c.name).trim().toLowerCase() === String(targetChefId).trim().toLowerCase()
      );

      const rawItem = item as any;

      // Target identifiers list
      const targetIds: string[] = [String(targetChefId)];
      if (targetChef) {
        if (targetChef.id != null) targetIds.push(String(targetChef.id));
        if (targetChef.chef_id != null) targetIds.push(String(targetChef.chef_id));
        if ((targetChef as any).user_id != null) targetIds.push(String((targetChef as any).user_id));
      }

      // Item identifiers
      const itemChefId = rawItem.chef_id != null ? String(rawItem.chef_id) : null;
      const itemChefUserId = rawItem.chef_user_id != null ? String(rawItem.chef_user_id) : null;
      const itemUserId = rawItem.user_id != null ? String(rawItem.user_id) : null;
      const itemCreatedById = rawItem.created_by_id != null ? String(rawItem.created_by_id) : null;
      const itemCreatedBy = rawItem.created_by != null ? String(rawItem.created_by).trim() : null;

      // 1. Direct ID comparison
      for (const tId of targetIds) {
        if (
          (itemChefId && itemChefId === tId) ||
          (itemChefUserId && itemChefUserId === tId) ||
          (itemUserId && itemUserId === tId) ||
          (itemCreatedById && itemCreatedById === tId) ||
          (itemCreatedBy && itemCreatedBy === tId)
        ) {
          return true;
        }
      }

      // 2. Matching against target chef's details
      if (targetChef) {
        const normItemNames = [
          rawItem.chef_name?.trim().toLowerCase(),
          rawItem.chef?.trim().toLowerCase(),
          rawItem.kitchen_name?.trim().toLowerCase(),
          rawItem.created_by_name?.trim().toLowerCase(),
          itemCreatedBy?.toLowerCase(),
        ].filter(Boolean) as string[];

        const normTargetNames = [
          targetChef.name?.trim().toLowerCase(),
          `${(targetChef as any).first_name || ""} ${(targetChef as any).last_name || ""}`.trim().toLowerCase(),
          (targetChef as any).kitchen_name?.trim().toLowerCase(),
        ].filter(Boolean) as string[];

        for (const iName of normItemNames) {
          for (const tName of normTargetNames) {
            if (iName === tName || (iName.length > 2 && tName.length > 2 && (iName.includes(tName) || tName.includes(iName)))) {
              return true;
            }
          }
        }

        const normItemPhones = [
          (rawItem.chef_phone || rawItem.mobile)?.trim(),
        ].filter(Boolean) as string[];

        const normTargetPhones = [
          ((targetChef as any).mobile || (targetChef as any).phone)?.trim(),
        ].filter(Boolean) as string[];

        for (const iPhone of normItemPhones) {
          for (const tPhone of normTargetPhones) {
            if (iPhone === tPhone || iPhone.endsWith(tPhone) || tPhone.endsWith(iPhone)) {
              return true;
            }
          }
        }
      }

      return false;
    },
    [chefs]
  );

  const belongsToFranchiseChef = useCallback(
    (item: Food) => {
      // If we have home chefs registered for this franchise admin, check if item belongs to one of them
      if (chefs.length > 0) {
        const matchesAnyChef = chefs.some((chef) => {
          const chefId = String(chef.id ?? chef.chef_id);
          return isChefMatch(item, chefId);
        });

        if (matchesAnyChef) return true;
      }

      // Check if product has franchise ID matching the current franchise user
      const rawItem = item as any;
      const franchiseId =
        currentUser?.franchise_user_id ||
        currentUser?.franchise_id ||
        currentUser?.user_id ||
        currentUser?.id;

      if (franchiseId) {
        const itemFranchiseId =
          rawItem.franchise_id != null
            ? String(rawItem.franchise_id)
            : rawItem.franchise_user_id != null
            ? String(rawItem.franchise_user_id)
            : null;

        if (itemFranchiseId && itemFranchiseId === String(franchiseId)) {
          return true;
        }
      }

      if (currentUser?.franchise_name || currentUser?.name) {
        const franchiseName = (currentUser.franchise_name || currentUser.name)?.trim().toLowerCase();
        const itemFranchiseName = item.franchise_name?.trim().toLowerCase();
        if (franchiseName && itemFranchiseName && franchiseName === itemFranchiseName) {
          return true;
        }
      }

      return false;
    },
    [chefs, currentUser, isChefMatch]
  );

  /*
   * -------------------------------------------------------
   * STATUS STYLE
   * -------------------------------------------------------
   */
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case "Approved":
      case "Active":
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
      case "Inactive":
      case "Suspended":
      case "Rejected":
      case "Not Approved":
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

  /*
   * -------------------------------------------------------
   * FRANCHISE CHEF FILTERED LIST
   * -------------------------------------------------------
   */
  const franchiseFoods = useMemo(() => {
    return foods.filter((item) => {
      if (selectedChef !== "All") {
        return isChefMatch(item, selectedChef);
      }
      return belongsToFranchiseChef(item);
    });
  }, [foods, selectedChef, isChefMatch, belongsToFranchiseChef]);

  /*
   * -------------------------------------------------------
   * STATUS FILTER & SEARCH
   * -------------------------------------------------------
   */
  const filteredFoods = useMemo(() => {
    return franchiseFoods.filter((item) => {
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
              String(value).toLowerCase().includes(searchText)
            )
        : true;

      let matchesStatus = true;

      if (statusFilter === "Approved") {
        matchesStatus =
          item.status === "Active" || item.status === "Approved";
      } else if (statusFilter === "Not Approved") {
        matchesStatus =
          item.status !== "Active" && item.status !== "Approved";
      } else if (statusFilter !== "All") {
        matchesStatus = item.status === statusFilter;
      }

      return matchesSearch && matchesStatus;
    });
  }, [franchiseFoods, search, statusFilter]);

  /*
   * -------------------------------------------------------
   * SUMMARY METRICS
   * -------------------------------------------------------
   */
  const summary = useMemo(() => {
    const baseList = franchiseFoods;
    const total = baseList.length;
    const active = baseList.filter(
      (item) => item.status === "Active" || item.status === "Approved"
    ).length;
    const inactive = baseList.filter(
      (item) =>
        ["Inactive", "Suspended", "Rejected", "Not Approved"].includes(
          item.status || ""
        ) ||
        (item.status !== "Active" && item.status !== "Approved")
    ).length;

    return {
      total,
      active,
      inactive,
    };
  }, [franchiseFoods]);

  /*
   * -------------------------------------------------------
   * PAGINATION
   * -------------------------------------------------------
   */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFoods.length / ITEMS_PER_PAGE)
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
    item.cuisine || item.product_type || item.category || "-";

  const getMobile = (item: Food) =>
    item.chef_phone || item.mobile || "-";

  /*
   * -------------------------------------------------------
   * UPDATE STATUS
   * -------------------------------------------------------
   */
  const handleStatusUpdate = async (item: Food, newStatus: string) => {
    try {
      const endpoint =
        activeTab === "food"
          ? `/chef-foods/${item.id}`
          : `/products/${item.id}`;

      await put(endpoint, {
        status: newStatus,
      });

      if (selectedFood?.id === item.id) {
        setSelectedFood({ ...selectedFood, status: newStatus });
      }

      fetchFoods();
    } catch (error) {
      console.log("Failed to update food status:", error);
      Alert.alert("Error", "Failed to update food status");
    }
  };

  /*
   * -------------------------------------------------------
   * APPROVAL CHECKLIST
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

  const toggleChecklist = (key: "taste" | "quality" | "packaging") => {
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
    await handleStatusUpdate(approvalItem, "Active");
    closeApprovalModal();
  };

  const requestStatusUpdate = (item: Food, status: "Active" | "Inactive") => {
    setConfirmation({
      type: status === "Active" ? "activate" : "deactivate",
      item,
    });
  };

  const handleDelete = (item: Food) => {
    setConfirmation({ type: "delete", item });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const { type, item } = confirmation;
    setActionLoading(true);
    try {
      const endpoint =
        activeTab === "food"
          ? `/chef-foods/${item.id}`
          : `/products/${item.id}`;
      if (type === "delete") {
        await del(endpoint);
        if (selectedFood?.id === item.id) {
          setSelectedFood(null);
        }
      } else {
        await handleStatusUpdate(
          item,
          type === "activate" ? "Active" : "Inactive"
        );
      }
      setConfirmation(null);
      if (type === "delete") fetchFoods();
    } catch (error) {
      console.log("Food action error:", error);
      Alert.alert("Error", "The food product action could not be completed.");
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * -------------------------------------------------------
   * LOADING STATE
   * -------------------------------------------------------
   */
  if (loading && !refreshing && foods.length === 0) {
    return (
      <View className="flex-1 bg-slate-950 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-3 font-semibold text-xs">
          Loading Food Products...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <FlatList
        data={paginatedFoods}
        keyExtractor={(item, index) => String(item.id ?? index)}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                  Food Products
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Manage and monitor food catalog & items
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                <Utensils size={20} color="#34d399" />
              </View>
            </View>

            {/* ================= SUMMARY METRICS ================= */}
            <View className="flex-row gap-2 mb-5">
              {/* TOTAL */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "All"
                    ? "border-indigo-400"
                    : "border-indigo-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-indigo-500/15 items-center justify-center mb-2">
                  <Utensils size={16} color="#a5b4fc" />
                </View>
                <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">
                  Total
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {summary.total}
                </Text>
              </TouchableOpacity>

              {/* APPROVED / ACTIVE */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Approved");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Approved"
                    ? "border-emerald-400"
                    : "border-emerald-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <CheckCircle size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  Active
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {summary.active}
                </Text>
              </TouchableOpacity>

              {/* NEEDS REVIEW / INACTIVE */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Not Approved");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Not Approved"
                    ? "border-amber-400"
                    : "border-amber-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-amber-500/15 items-center justify-center mb-2">
                  <Clock size={16} color="#fcd34d" />
                </View>
                <Text className="text-amber-200/70 text-[9px] font-bold uppercase">
                  Needs review
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {summary.inactive}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= TAB SWITCHER ================= */}
            <View className="flex-row bg-slate-900 border border-white/10 rounded-2xl p-1 mb-4">
              <TouchableOpacity
                onPress={() => {
                  setActiveTab("food");
                  setCurrentPage(1);
                }}
                className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
                  activeTab === "food"
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : ""
                }`}
              >
                <Utensils
                  size={14}
                  color={activeTab === "food" ? "#34d399" : "#64748b"}
                />
                <Text
                  className={`ml-2 text-xs font-bold ${
                    activeTab === "food"
                      ? "text-emerald-300"
                      : "text-slate-400"
                  }`}
                >
                  Chef Foods
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab("foodProducts");
                  setCurrentPage(1);
                }}
                className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
                  activeTab === "foodProducts"
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : ""
                }`}
              >
                <Package
                  size={14}
                  color={activeTab === "foodProducts" ? "#34d399" : "#64748b"}
                />
                <Text
                  className={`ml-2 text-xs font-bold ${
                    activeTab === "foodProducts"
                      ? "text-emerald-300"
                      : "text-slate-400"
                  }`}
                >
                  Products
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search food, chef, cuisine, category..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            {/* ================= FILTERS ROW ================= */}
            <View className="flex-row items-center gap-2 mb-4">
              {/* Chef Filter */}
              {chefs.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowChefDropdown(true)}
                  className="flex-1 flex-row items-center justify-between bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5"
                >
                  <View className="flex-row items-center flex-1 mr-1">
                    <ChefHat size={14} color="#94a3b8" />
                    <Text
                      className="text-white text-xs font-bold ml-1.5"
                      numberOfLines={1}
                    >
                      {selectedChef === "All"
                        ? "All Chefs"
                        : chefs.find(
                            (c) =>
                              String(c.id) === selectedChef ||
                              String(c.chef_id) === selectedChef ||
                              String(c.chef_id ?? c.id) === selectedChef ||
                              String(c.id ?? c.chef_id) === selectedChef
                          )?.name || "Chef"}
                    </Text>
                  </View>
                  <ChevronDown size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}

              {/* Status Filter */}
              <TouchableOpacity
                onPress={() => setShowStatusDropdown(true)}
                className="flex-1 flex-row items-center justify-between bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5"
              >
                <View className="flex-row items-center flex-1 mr-1">
                  <Filter size={14} color="#94a3b8" />
                  <Text
                    className="text-white text-xs font-bold ml-1.5"
                    numberOfLines={1}
                  >
                    {statusFilter === "All" ? "All Statuses" : statusFilter}
                  </Text>
                </View>
                <ChevronDown size={14} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* ================= RESULT COUNT ================= */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedFoods.length} of {filteredFoods.length}{" "}
              {activeTab === "food" ? "food items" : "products"}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: Food }) => {
          const statusStyle = getStatusStyle(item.status);
          const imageUrl = getImageUrl(item);
          const kitchen = getKitchenName(item);
          const cuisine = getTypeDisplay(item);
          const mobile = getMobile(item);
          const price = item.final_price ?? item.mrp ?? "0.00";

          return (
            <View className="mx-4 mb-3 bg-slate-900 border border-white/10 rounded-2xl p-4">
              {/* ================= TOP INFO ================= */}
              <View className="flex-row items-start">
                {imageUrl ? (
                  <View className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                    <Image
                      source={{ uri: imageUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <View className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/20 items-center justify-center">
                    <Utensils size={22} color="#34d399" />
                  </View>
                )}

                <View className="flex-1 ml-3">
                  <Text
                    className="text-white text-base font-black"
                    numberOfLines={1}
                  >
                    {item.name || item.product_code || "Unnamed Food"}
                  </Text>
                  <Text
                    className="text-slate-400 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {item.category || item.product_type || "Food Product"}
                    {cuisine && cuisine !== "-" ? ` • ${cuisine}` : ""}
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
                {/* Kitchen / Chef */}
                <View className="flex-row items-center flex-1">
                  <ChefHat size={14} color="#64748b" />
                  <Text
                    className="text-slate-300 text-xs ml-2"
                    numberOfLines={1}
                  >
                    {kitchen}
                  </Text>
                </View>

                {/* Mobile */}
                {mobile && mobile !== "-" && (
                  <View className="flex-row items-center flex-1 ml-2">
                    <Phone size={14} color="#64748b" />
                    <Text
                      className="text-slate-400 text-xs ml-2 flex-1"
                      numberOfLines={1}
                    >
                      {mobile}
                    </Text>
                  </View>
                )}
              </View>

              {/* Description preview */}
              {item.description ? (
                <Text
                  className="text-slate-400 text-xs mt-2.5 leading-4"
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}

              {/* ================= ACTION BUTTONS & PRICE ================= */}
              <View className="flex-row items-center justify-between mt-3.5 pt-3 border-t border-white/10 gap-2">
                {/* Price Tag - Left */}
                <View className="flex-row items-baseline flex-1">
                  <Text className="text-emerald-400 text-base font-black">
                    ₹{price}
                  </Text>
                  {item.mrp &&
                  item.final_price &&
                  Number(item.mrp) > Number(item.final_price) ? (
                    <Text className="text-slate-500 text-xs line-through ml-1.5 font-semibold">
                      ₹{item.mrp}
                    </Text>
                  ) : null}
                </View>

                {/* Details Button */}
                <TouchableOpacity
                  onPress={() => setSelectedFood(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${
                    item.name || "food"
                  }`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Eye size={15} color="#cbd5e1" />
                </TouchableOpacity>

                {/* Edit Button */}
                {/* <TouchableOpacity
                  onPress={() => {
                    navigation.navigate("AddProduct");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${item.name || "food"}`}
                  className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                >
                  <Pencil size={16} color="#cbd5e1" />
                </TouchableOpacity> */}

                {/* Approve Button */}
                {item.status !== "Active" && item.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() => openApprovalModal(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Approve ${item.name || "food"}`}
                    className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl items-center justify-center"
                  >
                    <Check size={17} color="#34d399" />
                  </TouchableOpacity>
                )}

                {/* Suspend / Deactivate Button */}
                {(item.status === "Active" || item.status === "Approved") && (
                  <TouchableOpacity
                    onPress={() => requestStatusUpdate(item, "Inactive")}
                    accessibilityRole="button"
                    accessibilityLabel={`Deactivate ${item.name || "food"}`}
                    className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center"
                  >
                    <ShieldAlert size={17} color="#fbbf24" />
                  </TouchableOpacity>
                )}

                {/* Delete Button */}
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name || "food"}`}
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
            <Utensils size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs">
              No food products match your criteria.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredFoods.length > 0 ? (
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

      {/* Floating Action Button */}
      {/* <View
        style={{
          position: "absolute",
          right: 20,
          bottom: 25,
          zIndex: 9999,
          elevation: 20,
        }}
      >
        <FloatingActionButton
          onPress={() => navigation.navigate("AddProduct")}
          label="Add food product"
        />
      </View> */}

      {/* ================================================= */}
      {/* STATUS FILTER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={showStatusDropdown}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowStatusDropdown(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">
                  Filter products
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Choose a product status
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowStatusDropdown(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {STATUS_OPTIONS.map((status) => {
              const active = statusFilter === status;
              return (
                <TouchableOpacity
                  key={status}
                  onPress={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                    setShowStatusDropdown(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                    active
                      ? "bg-emerald-500/15 border-emerald-500/40"
                      : "bg-slate-950 border-white/5"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      active ? "text-emerald-300" : "text-slate-300"
                    }`}
                  >
                    {status === "All" ? "All statuses" : status}
                  </Text>
                  {active ? <CheckCircle size={17} color="#34d399" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CHEF FILTER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={showChefDropdown}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setShowChefDropdown(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[75%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">
                  Filter by Chef
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Choose a chef to display foods
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowChefDropdown(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedChef("All");
                  setCurrentPage(1);
                  setShowChefDropdown(false);
                }}
                className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                  selectedChef === "All"
                    ? "bg-emerald-500/15 border-emerald-500/40"
                    : "bg-slate-950 border-white/5"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    selectedChef === "All"
                      ? "text-emerald-300"
                      : "text-slate-300"
                  }`}
                >
                  All Chefs
                </Text>
                {selectedChef === "All" ? (
                  <CheckCircle size={17} color="#34d399" />
                ) : null}
              </TouchableOpacity>

              {chefs.map((chef) => {
                const id = String(chef.id ?? chef.chef_id);
                const active =
                  selectedChef === id ||
                  selectedChef === String(chef.id) ||
                  selectedChef === String(chef.chef_id);
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => {
                      setSelectedChef(id);
                      setCurrentPage(1);
                      setShowChefDropdown(false);
                    }}
                    className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl mb-2 border ${
                      active
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-950 border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        active ? "text-emerald-300" : "text-slate-300"
                      }`}
                    >
                      {chef.name || (chef as any).kitchen_name || "Unnamed Chef"}
                    </Text>
                    {active ? (
                      <CheckCircle size={17} color="#34d399" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CONFIRMATION MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!confirmation}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setConfirmation(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 ${
                confirmation?.type === "delete"
                  ? "bg-red-500/15"
                  : confirmation?.type === "activate"
                  ? "bg-emerald-500/15"
                  : "bg-amber-500/15"
              }`}
            >
              {confirmation?.type === "delete" ? (
                <Trash2 size={23} color="#f87171" />
              ) : confirmation?.type === "activate" ? (
                <Check size={23} color="#34d399" />
              ) : (
                <ShieldAlert size={23} color="#fbbf24" />
              )}
            </View>

            <Text className="text-white text-lg font-black">
              {confirmation?.type === "delete"
                ? "Remove this food item?"
                : confirmation?.type === "activate"
                ? "Activate this food item?"
                : "Deactivate this food item?"}
            </Text>

            <Text className="text-slate-400 text-sm mt-2 leading-5">
              {confirmation?.type === "delete"
                ? `${
                    confirmation?.item?.name || "This food product"
                  } will be permanently removed.`
                : confirmation?.type === "activate"
                ? `${
                    confirmation?.item?.name || "This food product"
                  } will be made available for customer orders.`
                : `${
                    confirmation?.item?.name || "This food product"
                  } will be taken offline and hidden from the catalog.`}
            </Text>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => setConfirmation(null)}
                disabled={actionLoading}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmAction}
                disabled={actionLoading}
                className={`flex-1 rounded-2xl py-3.5 items-center ${
                  confirmation?.type === "delete"
                    ? "bg-red-600"
                    : confirmation?.type === "activate"
                    ? "bg-emerald-600"
                    : "bg-amber-500"
                }`}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase">
                    {confirmation?.type === "delete"
                      ? "Remove item"
                      : confirmation?.type === "activate"
                      ? "Activate item"
                      : "Deactivate item"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* APPROVAL CHECKLIST MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!approvalItem}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closeApprovalModal}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[85%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-xl font-black">
                  Approve Food Item
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Complete required checks before activation
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeApprovalModal}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Item Preview */}
            <View className="bg-slate-950 rounded-2xl p-4 mb-4 border border-slate-800">
              <Text className="text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
                Item Overview
              </Text>
              <Text className="text-white text-base font-bold">
                {approvalItem?.name ||
                  approvalItem?.product_code ||
                  "Unnamed Item"}
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {approvalItem?.category || "No Category"} • ₹
                {approvalItem?.final_price ??
                  approvalItem?.mrp ??
                  "0.00"}
              </Text>
            </View>

            {/* Checklist items */}
            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              Quality Checklist
            </Text>

            <TouchableOpacity
              onPress={() => toggleChecklist("taste")}
              className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 mb-2"
            >
              <View
                className={`w-6 h-6 rounded-lg items-center justify-center border ${
                  approvalChecklist.taste
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-600 bg-slate-900"
                }`}
              >
                {approvalChecklist.taste && <Check size={14} color="white" />}
              </View>
              <Text className="text-white font-bold ml-3 text-sm">
                Taste & Flavor Verified
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleChecklist("quality")}
              className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 mb-2"
            >
              <View
                className={`w-6 h-6 rounded-lg items-center justify-center border ${
                  approvalChecklist.quality
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-600 bg-slate-900"
                }`}
              >
                {approvalChecklist.quality && <Check size={14} color="white" />}
              </View>
              <Text className="text-white font-bold ml-3 text-sm">
                Ingredients & Hygiene Checked
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleChecklist("packaging")}
              className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 mb-2"
            >
              <View
                className={`w-6 h-6 rounded-lg items-center justify-center border ${
                  approvalChecklist.packaging
                    ? "bg-emerald-500 border-emerald-500"
                    : "border-slate-600 bg-slate-900"
                }`}
              >
                {approvalChecklist.packaging && (
                  <Check size={14} color="white" />
                )}
              </View>
              <Text className="text-white font-bold ml-3 text-sm">
                Packaging & Presentation Standard
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={closeApprovalModal}
                className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!canApprove}
                onPress={handleApprove}
                className={`flex-1 rounded-2xl py-3.5 items-center ${
                  canApprove ? "bg-emerald-600" : "bg-slate-800 opacity-50"
                }`}
              >
                <Text className="text-white font-black text-xs uppercase">
                  Approve Item
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* FOOD DETAILS POPUP MODAL */}
      {/* ================================================= */}
      <Modal
        visible={!!selectedFood}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setSelectedFood(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex-col"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            {/* ================= MODAL HEADER ================= */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text
                  className="text-white text-xl font-black"
                  numberOfLines={1}
                >
                  {selectedFood?.name ||
                    selectedFood?.product_code ||
                    "Food Details"}
                </Text>
                <Text className="text-emerald-200 text-sm font-bold uppercase tracking-wider mt-1">
                  Food Product Overview
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setSelectedFood(null)}
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
              {/* Image Banner if available */}
              {selectedFood && getImageUrl(selectedFood) ? (
                <View className="w-full h-44 rounded-2xl overflow-hidden mb-3 border border-slate-800 bg-slate-950">
                  <Image
                    source={{ uri: getImageUrl(selectedFood)! }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* ================= FOOD INFORMATION ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  🍲 Food Information
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Name
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.name || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Product Code
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.product_code || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Category
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.category || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Cuisine / Type
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.cuisine ||
                        selectedFood?.product_type ||
                        "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Final Price
                    </Text>
                    <Text className="text-emerald-400 text-sm font-bold mt-1">
                      ₹
                      {selectedFood?.final_price ??
                        selectedFood?.mrp ??
                        "0.00"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      MRP
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      ₹{selectedFood?.mrp ?? "—"}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Status
                    </Text>
                    <View className="mt-1 self-start">
                      {(() => {
                        const st = getStatusStyle(selectedFood?.status);
                        return (
                          <View
                            className={`px-2.5 py-1 rounded-lg border ${st.bg} ${st.border}`}
                          >
                            <Text
                              className={`text-[9px] font-black uppercase ${st.text}`}
                            >
                              {selectedFood?.status || "Unknown"}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  </View>
                </View>
              </View>

              {/* ================= CHEF & KITCHEN ================= */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  👨‍🍳 Chef & Kitchen Details
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Chef Name
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.chef_name || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Kitchen
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.kitchen_name ||
                        selectedFood?.franchise_name ||
                        "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Chef Phone
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.chef_phone ||
                        selectedFood?.mobile ||
                        "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Created By
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedFood?.created_by || "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ================= DESCRIPTION ================= */}
              {selectedFood?.description ? (
                <View className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800">
                  <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                    📝 Description
                  </Text>
                  <Text className="text-slate-300 text-sm leading-5">
                    {selectedFood.description}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* ================= BOTTOM ACTIONS ================= */}
            <View className="p-4 border-t border-slate-800 bg-slate-950 flex-row gap-2">
              {/* <TouchableOpacity
                onPress={() => {
                  setSelectedFood(null);
                  navigation.navigate("AddProduct");
                }}
                className="px-4 bg-slate-800 py-3 rounded-2xl items-center flex-row"
              >
                <Pencil size={17} color="#cbd5e1" />
                <Text className="text-slate-300 font-bold text-sm uppercase ml-1.5">
                  Edit
                </Text>
              </TouchableOpacity> */}

              {selectedFood?.status !== "Active" &&
                selectedFood?.status !== "Approved" && (
                  <TouchableOpacity
                    onPress={() => {
                      const target = selectedFood;
                      setSelectedFood(null);
                      if (target) {
                        openApprovalModal(target);
                      }
                    }}
                    className="flex-1 bg-emerald-600 py-3 rounded-2xl items-center"
                  >
                    <Text className="text-white font-black text-sm uppercase tracking-wider">
                      Approve Item
                    </Text>
                  </TouchableOpacity>
                )}

              {(selectedFood?.status === "Active" ||
                selectedFood?.status === "Approved") && (
                <TouchableOpacity
                  onPress={() => {
                    const target = selectedFood;
                    setSelectedFood(null);
                    if (target) {
                      requestStatusUpdate(target, "Inactive");
                    }
                  }}
                  className="flex-1 bg-amber-500 py-3 rounded-2xl items-center"
                >
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    Deactivate Item
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setSelectedFood(null)}
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

export default FoodProducts;
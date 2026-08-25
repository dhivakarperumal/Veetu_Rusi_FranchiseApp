import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Pencil,
  Plus,
  Lock,
  User,
  AlertTriangle,
} from "lucide-react-native";

import { get, post, put, patch, del } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

interface UserItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  active?: string | number | boolean;
  created_at?: string;
  updated_at?: string;
}

const AVAILABLE_ROLES = [
  { label: "User", value: "user" },
  { label: "Admin", value: "admin" },
  { label: "Superadmin", value: "superadmin" },
  { label: "Chef", value: "chef" },
  { label: "Franchise", value: "franchise" },
  { label: "Delivery Partner", value: "delivery_partner" },
];

const UserManagement = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Selected user for Details Modal
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form Modal (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    id: null as number | null,
    name: "",
    email: "",
    phone: "",
    role: "user",
    password: "",
  });

  // Action Confirmation (Block / Unblock / Delete)
  const [confirmation, setConfirmation] = useState<{
    type: "block" | "unblock" | "delete";
    user: UserItem;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Success Feedback Dialog (Custom Popup)
  const [feedbackDialog, setFeedbackDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res: any = await get("/admin/users");
      if (Array.isArray(res)) {
        setUsers(res);
      } else if (res && Array.isArray(res.data)) {
        setUsers(res.data);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      console.log("User Management Fetch Error:", error);
      setUsers([]);
      setFeedbackDialog({
        visible: true,
        title: "Load Failed",
        message: error.message || "Failed to load user accounts.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  // Helper to test if user is active
  const isUserActive = (u: UserItem): boolean => {
    if (u.active === undefined || u.active === null) return false;
    const str = String(u.active).trim().toLowerCase();
    return str === "active" || str === "1" || str === "true";
  };

  // --------------------------------------------------
  // SUMMARY COUNTS
  // --------------------------------------------------
  const activeCount = useMemo(
    () => users.filter((u) => isUserActive(u)).length,
    [users]
  );

  const blockedCount = useMemo(
    () => users.filter((u) => !isUserActive(u)).length,
    [users]
  );

  // --------------------------------------------------
  // SEARCH & FILTER
  // --------------------------------------------------
  const filteredUsers = useMemo(() => {
    let result = [...users];
    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.phone && u.phone.includes(query))
      );
    }

    if (roleFilter !== "All") {
      result = result.filter(
        (u) => (u.role || "user").toLowerCase() === roleFilter.toLowerCase()
      );
    }

    if (statusFilter === "Active") {
      result = result.filter((u) => isUserActive(u));
    } else if (statusFilter === "Blocked") {
      result = result.filter((u) => !isUserActive(u));
    }

    return result;
  }, [users, search, roleFilter, statusFilter]);

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const currentPageIndex = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (currentPageIndex - 1) * itemsPerPage,
    currentPageIndex * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, roleFilter]);

  // --------------------------------------------------
  // ROLE & STATUS STYLING
  // --------------------------------------------------
  const getRoleStyle = (role?: string) => {
    const r = String(role || "user").toLowerCase();
    if (r === "superadmin") {
      return {
        bg: "bg-purple-500/15",
        border: "border-purple-500/30",
        text: "text-purple-400",
      };
    }
    if (r === "admin") {
      return {
        bg: "bg-blue-500/15",
        border: "border-blue-500/30",
        text: "text-blue-400",
      };
    }
    if (r === "chef") {
      return {
        bg: "bg-orange-500/15",
        border: "border-orange-500/30",
        text: "text-orange-400",
      };
    }
    if (r === "franchise" || r === "franchise admin") {
      return {
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
      };
    }
    if (r === "delivery_partner" || r === "delivery partner") {
      return {
        bg: "bg-sky-500/15",
        border: "border-sky-500/30",
        text: "text-sky-400",
      };
    }
    return {
      bg: "bg-slate-500/15",
      border: "border-slate-500/30",
      text: "text-slate-400",
    };
  };

  const getStatusStyle = (user: UserItem) => {
    const active = isUserActive(user);
    if (active) {
      return {
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        label: "Active",
      };
    }
    return {
      bg: "bg-red-500/15",
      border: "border-red-500/30",
      text: "text-red-400",
      label: "Blocked",
    };
  };

  // --------------------------------------------------
  // MODAL HANDLERS (ADD / EDIT)
  // --------------------------------------------------
  const openAddModal = () => {
    setModalMode("add");
    setFormError("");
    setFormData({
      id: null,
      name: "",
      email: "",
      phone: "",
      role: "user",
      password: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserItem) => {
    setModalMode("edit");
    setFormError("");
    setFormData({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "user",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async () => {
    setFormError("");
    if (!formData.name.trim()) {
      setFormError("Username / customer name is required.");
      return;
    }
    if (!formData.email.trim()) {
      setFormError("Email address is required.");
      return;
    }
    if (modalMode === "add" && !formData.password.trim()) {
      setFormError("Password is required for new accounts.");
      return;
    }

    setFormLoading(true);
    try {
      if (modalMode === "add") {
        await post("/admin/users", formData);
        setIsModalOpen(false);
        setFeedbackDialog({
          visible: true,
          title: "User Registered",
          message: `${formData.name} has been successfully added to the system.`,
        });
      } else {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        await put(`/admin/users/${formData.id}`, payload);

        if (selectedUser?.id === formData.id) {
          setSelectedUser({
            ...selectedUser,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
          });
        }
        setIsModalOpen(false);
        setFeedbackDialog({
          visible: true,
          title: "User Updated",
          message: `${formData.name}'s account details were successfully updated.`,
        });
      }
      fetchUsers();
    } catch (error: any) {
      setFormError(error.message || `Failed to ${modalMode === "add" ? "add" : "update"} user.`);
    } finally {
      setFormLoading(false);
    }
  };

  // --------------------------------------------------
  // ACTION PROMPT HANDLERS (CUSTOMIZED POPUPS)
  // --------------------------------------------------
  const handleToggleStatusPrompt = (user: UserItem) => {
    const active = isUserActive(user);
    setConfirmation({
      type: active ? "block" : "unblock",
      user,
    });
  };

  const handleDeletePrompt = (user: UserItem) => {
    setConfirmation({
      type: "delete",
      user,
    });
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const { type, user } = confirmation;
    setActionLoading(true);
    try {
      if (type === "delete") {
        await del(`/admin/users/${user.id}`);
        if (selectedUser?.id === user.id) {
          setIsDetailOpen(false);
          setSelectedUser(null);
        }
        setConfirmation(null);
        setFeedbackDialog({
          visible: true,
          title: "Account Deleted",
          message: `${user.name || "User account"} has been permanently removed from the system.`,
        });
      } else {
        const nextActive = type === "unblock" ? 1 : 0;
        await patch(`/admin/users/status/${user.id}`, { active: nextActive });
        if (selectedUser?.id === user.id) {
          setSelectedUser({
            ...selectedUser,
            active: nextActive === 1 ? "Active" : "Blocked",
          });
        }
        setConfirmation(null);
        setFeedbackDialog({
          visible: true,
          title: type === "unblock" ? "Account Activated" : "Account Blocked",
          message:
            type === "unblock"
              ? `${user.name || "User"} is now unblocked and has active access to the platform.`
              : `${user.name || "User"} has been blocked and restricted from logging in.`,
        });
      }
      fetchUsers();
    } catch (error: any) {
      setConfirmation(null);
      setFeedbackDialog({
        visible: true,
        title: "Action Failed",
        message: error.message || "Action could not be completed. Please try again.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openUserDetails = (user: UserItem) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------
  if (loading) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader title="User Management" navigation={navigation} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Users...
          </Text>
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // RENDER MAIN SCREEN
  // --------------------------------------------------
  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="User Management" navigation={navigation} />

      <FlatList
        data={paginatedUsers}
        keyExtractor={(item: UserItem) => String(item.id)}
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
                  User Management
                </Text>
                <Text className="text-slate-400 mt-1 text-xs">
                  Manage registered users, roles and access
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
                <Users size={20} color="#34d399" />
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
                  <Users size={16} color="#a5b4fc" />
                </View>
                <Text className="text-indigo-200/70 text-[9px] font-bold uppercase">
                  Total Users
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {users.length}
                </Text>
              </TouchableOpacity>

              {/* ACTIVE */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Active");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Active"
                    ? "border-emerald-400"
                    : "border-emerald-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-emerald-500/15 items-center justify-center mb-2">
                  <UserCheck size={16} color="#6ee7b7" />
                </View>
                <Text className="text-emerald-200/70 text-[9px] font-bold uppercase">
                  Active
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {activeCount}
                </Text>
              </TouchableOpacity>

              {/* BLOCKED */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setStatusFilter("Blocked");
                  setCurrentPage(1);
                }}
                className={`flex-1 bg-slate-900 border rounded-2xl p-3 ${
                  statusFilter === "Blocked"
                    ? "border-rose-400"
                    : "border-rose-400/25"
                }`}
              >
                <View className="w-8 h-8 rounded-lg bg-rose-500/15 items-center justify-center mb-2">
                  <UserX size={16} color="#fda4af" />
                </View>
                <Text className="text-rose-200/70 text-[9px] font-bold uppercase">
                  Blocked
                </Text>
                <Text className="text-white text-2xl font-black mt-0.5">
                  {blockedCount}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================= SEARCH INPUT ================= */}
            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-3">
              <Search size={18} color="#64748b" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, email or phone..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs"
              />
            </View>

            {/* ================= FILTERS ROW ================= */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Filter size={15} color="#94a3b8" />
                <Text className="text-slate-400 ml-1.5 text-[10px] font-bold uppercase">
                  Filter users
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(true)}
                className="flex-row items-center bg-slate-900 border border-white/10 rounded-xl px-3 py-2"
              >
                <Text className="text-white text-xs font-bold mr-2">
                  {statusFilter !== "All"
                    ? statusFilter
                    : roleFilter !== "All"
                    ? roleFilter.replace(/_/g, " ")
                    : "All Users"}
                </Text>
                <ChevronDown size={15} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* RESULT COUNT */}
            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
            </Text>
          </View>
        }
        renderItem={({ item }: { item: UserItem }) => {
          const statusStyle = getStatusStyle(item);
          const roleStyle = getRoleStyle(item.role);

          return (
            <View className="mx-4 mb-3 bg-slate-900 border border-white/10 rounded-2xl p-4">
              {/* ================= TOP INFO ================= */}
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 items-center justify-center">
                  <Users size={22} color="#60a5fa" />
                </View>

                <View className="flex-1 ml-3">
                  <Text className="text-white text-base font-black">
                    {item.name || "Unnamed User"}
                  </Text>
                  <Text
                    className="text-slate-400 text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {item.email || "No email provided"}
                  </Text>
                </View>

                {/* Status Pill */}
                <View
                  className={`px-2.5 py-1 rounded-lg border ${statusStyle.bg} ${statusStyle.border}`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase tracking-wider ${statusStyle.text}`}
                  >
                    {statusStyle.label}
                  </Text>
                </View>
              </View>

              {/* ================= ESSENTIAL DETAILS ================= */}
              <View className="mt-3.5 flex-row items-center">
                {/* Mobile */}
                <View className="flex-row items-center flex-1">
                  <Phone size={14} color="#64748b" />
                  <Text
                    className="text-slate-300 text-xs ml-2"
                    numberOfLines={1}
                  >
                    {item.phone || "N/A"}
                  </Text>
                </View>

                {/* Registered Date */}
                <View className="flex-row items-center flex-1 ml-2">
                  <Calendar size={14} color="#64748b" />
                  <Text
                    className="text-slate-400 text-xs ml-2 flex-1"
                    numberOfLines={1}
                  >
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </Text>
                </View>
              </View>

              {/* ================= ACTION BUTTONS ================= */}
              <View className="flex-row items-center justify-between mt-3.5 pt-3 border-t border-white/10 gap-2">
                {/* Role Pill - Left */}
                <View
                  className={`px-2.5 py-1 rounded-lg border ${roleStyle.bg} ${roleStyle.border}`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase tracking-wider ${roleStyle.text}`}
                  >
                    {item.role?.replace(/_/g, " ") || "user"}
                  </Text>
                </View>

                {/* Right Action Icons */}
                <View className="flex-row items-center gap-2">
                  {/* View Details */}
                  <TouchableOpacity
                    onPress={() => openUserDetails(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`View details for ${item.name || "user"}`}
                    className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                  >
                    <Eye size={15} color="#cbd5e1" />
                  </TouchableOpacity>

                  {/* Edit User */}
                  {/* <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name || "user"}`}
                    className="w-10 h-10 bg-slate-800 border border-white/10 rounded-xl items-center justify-center"
                  >
                    <Pencil size={16} color="#cbd5e1" />
                  </TouchableOpacity> */}

                  {/* Toggle Status (Block / Unblock) */}
                  {isUserActive(item) ? (
                    <TouchableOpacity
                      onPress={() => handleToggleStatusPrompt(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Block ${item.name || "user"}`}
                      className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl items-center justify-center"
                    >
                      <ShieldAlert size={17} color="#fbbf24" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleToggleStatusPrompt(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Unblock ${item.name || "user"}`}
                      className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl items-center justify-center"
                    >
                      <ShieldCheck size={17} color="#34d399" />
                    </TouchableOpacity>
                  )}

                  {/* Delete User */}
                  <TouchableOpacity
                    onPress={() => handleDeletePrompt(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name || "user"}`}
                    className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-xl items-center justify-center"
                  >
                    <Trash2 size={16} color="#f87171" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16 px-5">
            <Users size={45} color="#475569" />
            <Text className="text-slate-400 mt-4 text-xs font-semibold">
              No users found matching your criteria.
            </Text>
            <Text className="text-slate-600 mt-1 text-[11px]">
              Try adjusting your search or filters.
            </Text>
          </View>
        }
        ListFooterComponent={
          filteredUsers.length > 0 ? (
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
        <FloatingActionButton onPress={openAddModal} label="Add new user" />
      </View> */}

      {/* ================================================= */}
      {/* ADD / EDIT USER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 bg-black/80 justify-end"
        >
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[90%] flex-col"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            {/* Modal Header */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-xl font-black">
                  {modalMode === "add" ? "Register New User" : "Edit User Account"}
                </Text>
                <Text className="text-emerald-200 text-xs font-bold uppercase tracking-wider mt-1">
                  {modalMode === "add"
                    ? "Add a new user to the system"
                    : `Updating ${formData.name || "User"}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="w-9 h-9 bg-black/20 rounded-full items-center justify-center"
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Form Content */}
            <ScrollView
              className="p-5"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Error Banner */}
              {formError ? (
                <View className="mb-4 bg-red-500/15 border border-red-500/30 rounded-2xl p-3.5 flex-row items-center">
                  <AlertTriangle size={18} color="#f87171" />
                  <Text className="text-red-400 text-xs font-bold ml-2.5 flex-1">
                    {formError}
                  </Text>
                </View>
              ) : null}

              {/* Username */}
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Username / Customer Name *
                </Text>
                <View className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                  <User size={16} color="#64748b" />
                  <TextInput
                    value={formData.name}
                    onChangeText={(text) => {
                      setFormError("");
                      setFormData({ ...formData, name: text });
                    }}
                    placeholder="e.g. John Doe"
                    placeholderTextColor="#64748b"
                    className="flex-1 text-white ml-3 text-sm font-semibold"
                  />
                </View>
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Email Address *
                </Text>
                <View className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                  <Mail size={16} color="#64748b" />
                  <TextInput
                    value={formData.email}
                    onChangeText={(text) => {
                      setFormError("");
                      setFormData({ ...formData, email: text });
                    }}
                    placeholder="e.g. john@example.com"
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 text-white ml-3 text-sm font-semibold"
                  />
                </View>
              </View>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Phone / Mobile
                </Text>
                <View className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                  <Phone size={16} color="#64748b" />
                  <TextInput
                    value={formData.phone}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phone: text })
                    }
                    placeholder="e.g. 9876543210"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    className="flex-1 text-white ml-3 text-sm font-semibold"
                  />
                </View>
              </View>

              {/* Assign Role */}
              <View className="mb-4">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Assign Role *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {AVAILABLE_ROLES.map((role) => {
                    const isSelected =
                      (formData.role || "user").toLowerCase() ===
                      role.value.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={role.value}
                        onPress={() =>
                          setFormData({ ...formData, role: role.value })
                        }
                        className={`px-3.5 py-2.5 rounded-xl border ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/50"
                            : "bg-slate-950 border-slate-800"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isSelected ? "text-emerald-300" : "text-slate-400"
                          }`}
                        >
                          {role.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  Password {modalMode === "add" ? "*" : "(Leave empty to keep current)"}
                </Text>
                <View className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                  <Lock size={16} color="#64748b" />
                  <TextInput
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormError("");
                      setFormData({ ...formData, password: text });
                    }}
                    placeholder={
                      modalMode === "add"
                        ? "Enter a secure password"
                        : "Enter new password (optional)"
                    }
                    placeholderTextColor="#64748b"
                    secureTextEntry
                    className="flex-1 text-white ml-3 text-sm font-semibold"
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-2">
                <TouchableOpacity
                  onPress={() => setIsModalOpen(false)}
                  disabled={formLoading}
                  className="flex-1 bg-slate-800 border border-white/10 rounded-2xl py-3.5 items-center"
                >
                  <Text className="text-slate-300 font-bold text-xs uppercase">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleModalSubmit}
                  disabled={formLoading}
                  className="flex-1 bg-emerald-600 rounded-2xl py-3.5 items-center"
                >
                  {formLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-black text-xs uppercase tracking-wider">
                      {modalMode === "add" ? "Register User" : "Update User"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================================================= */}
      {/* USER DETAILS MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isDetailOpen && !!selectedUser}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex-col"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            {/* Modal Header */}
            <View className="p-5 bg-emerald-700 rounded-t-3xl flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  className="text-white text-xl font-black"
                  numberOfLines={1}
                >
                  {selectedUser?.name || "User Details"}
                </Text>
                <Text className="text-emerald-200 text-xs font-bold uppercase tracking-wider mt-1">
                  User Account Overview
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="w-9 h-9 bg-black/20 rounded-full items-center justify-center"
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
              {/* Personal Information */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-3 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  👤 Account Information
                </Text>

                <View className="flex-row flex-wrap">
                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      User ID
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      #{selectedUser?.id}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Account Status
                    </Text>
                    <Text
                      className={`text-sm font-bold mt-1 ${
                        selectedUser && isUserActive(selectedUser)
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {selectedUser && isUserActive(selectedUser)
                        ? "Active"
                        : "Blocked"}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Username
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedUser?.name || "—"}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Email Address
                    </Text>
                    <Text
                      className="text-white text-sm font-semibold mt-1"
                      numberOfLines={1}
                    >
                      {selectedUser?.email || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Phone Number
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedUser?.phone || "—"}
                    </Text>
                  </View>

                  <View className="w-1/2 p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Assigned Role
                    </Text>
                    <Text className="text-emerald-400 text-sm font-bold uppercase mt-1">
                      {selectedUser?.role?.replace(/_/g, " ") || "user"}
                    </Text>
                  </View>

                  <View className="w-full p-1.5">
                    <Text className="text-slate-400 text-xs font-bold uppercase">
                      Registration Date
                    </Text>
                    <Text className="text-white text-sm font-semibold mt-1">
                      {selectedUser?.created_at
                        ? new Date(selectedUser.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "—"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Roles & Permissions Box */}
              <View className="bg-slate-950 rounded-2xl p-4 mb-6 border border-slate-800">
                <Text className="text-emerald-400 text-sm font-black uppercase tracking-wider mb-3">
                  🛡️ Access & Permissions
                </Text>
                <View className="p-1.5">
                  <Text className="text-slate-400 text-xs font-bold uppercase">
                    System Level
                  </Text>
                  <Text className="text-slate-300 text-xs mt-1 leading-5">
                    {selectedUser?.role === "superadmin"
                      ? "Full administrative access with user and role management authority."
                      : selectedUser?.role === "admin"
                      ? "Administrative dashboard access with order, product and partner management."
                      : selectedUser?.role === "chef"
                      ? "Home chef portal access for managing kitchen orders and menu."
                      : selectedUser?.role === "delivery_partner"
                      ? "Delivery partner access for active fleet and deliveries."
                      : "Standard customer account with order placement capabilities."}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="p-4 border-t border-slate-800 bg-slate-950 flex-row gap-2">
              {/* <TouchableOpacity
                onPress={() => {
                  const target = selectedUser;
                  setIsDetailOpen(false);
                  if (target) openEditModal(target);
                }}
                className="px-4 bg-slate-800 py-3 rounded-2xl items-center flex-row"
              >
                <Pencil size={17} color="#cbd5e1" />
                <Text className="text-slate-300 font-bold text-sm uppercase ml-1.5">
                  Edit
                </Text>
              </TouchableOpacity> */}

              {/* Toggle Status Action */}
              {selectedUser && (
                <TouchableOpacity
                  onPress={() => {
                    const target = selectedUser;
                    setIsDetailOpen(false);
                    handleToggleStatusPrompt(target);
                  }}
                  className={`flex-1 py-3 rounded-2xl items-center ${
                    isUserActive(selectedUser) ? "bg-amber-600" : "bg-emerald-600"
                  }`}
                >
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    {isUserActive(selectedUser) ? "Block User" : "Unblock User"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Delete Action */}
              {selectedUser && (
                <TouchableOpacity
                  onPress={() => {
                    const target = selectedUser;
                    setIsDetailOpen(false);
                    handleDeletePrompt(target);
                  }}
                  className="px-3.5 bg-red-500/10 border border-red-500/20 py-3 rounded-2xl items-center justify-center"
                >
                  <Trash2 size={18} color="#f87171" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setIsDetailOpen(false)}
                className="px-4 bg-slate-800 py-3 rounded-2xl items-center"
              >
                <Text className="text-slate-300 font-bold text-sm uppercase">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CUSTOMIZED CONFIRMATION MODAL (DELETE / BLOCK / UNBLOCK) */}
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
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            {/* Header Icon */}
            <View
              className={`w-14 h-14 rounded-2xl items-center justify-center mb-4 border ${
                confirmation?.type === "delete"
                  ? "bg-red-500/15 border-red-500/30"
                  : confirmation?.type === "block"
                  ? "bg-amber-500/15 border-amber-500/30"
                  : "bg-emerald-500/15 border-emerald-500/30"
              }`}
            >
              {confirmation?.type === "delete" ? (
                <Trash2 size={26} color="#f87171" />
              ) : confirmation?.type === "block" ? (
                <ShieldAlert size={26} color="#fbbf24" />
              ) : (
                <ShieldCheck size={26} color="#34d399" />
              )}
            </View>

            {/* Modal Title */}
            <Text className="text-white text-xl font-black">
              {confirmation?.type === "delete"
                ? "Delete User Account?"
                : confirmation?.type === "block"
                ? "Block User Account?"
                : "Unblock User Account?"}
            </Text>

            {/* User Details Mini Badge */}
            {confirmation?.user && (
              <View className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 my-3 flex-row items-center">
                <View className="w-10 h-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                  <User size={18} color="#94a3b8" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>
                    {confirmation.user.name || "User"}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                    {confirmation.user.email || confirmation.user.phone || "No contact info"}
                  </Text>
                </View>
                <View
                  className={`px-2 py-1 rounded-lg border ${
                    getRoleStyle(confirmation.user.role).bg
                  } ${getRoleStyle(confirmation.user.role).border}`}
                >
                  <Text
                    className={`text-[9px] font-black uppercase ${
                      getRoleStyle(confirmation.user.role).text
                    }`}
                  >
                    {confirmation.user.role?.replace(/_/g, " ") || "user"}
                  </Text>
                </View>
              </View>
            )}

            {/* Detailed Description */}
            <Text className="text-slate-400 text-sm leading-5">
              {confirmation?.type === "delete"
                ? `Are you sure you want to permanently delete the account for ${
                    confirmation?.user?.name || "this user"
                  }? This action cannot be undone and all associated records will be removed.`
                : confirmation?.type === "block"
                ? `${
                    confirmation?.user?.name || "This user"
                  } will be suspended and immediately blocked from logging into the platform until unblocked.`
                : `${
                    confirmation?.user?.name || "This user"
                  }'s account will be restored and they will regain immediate access to login and use the platform.`}
            </Text>

            {/* Modal Action Buttons */}
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
                    : confirmation?.type === "block"
                    ? "bg-amber-500"
                    : "bg-emerald-600"
                }`}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs uppercase tracking-wider">
                    {confirmation?.type === "delete"
                      ? "Delete Account"
                      : confirmation?.type === "block"
                      ? "Block User"
                      : "Unblock User"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* STATUS & ROLE FILTER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isFilterModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsFilterModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-white text-base font-black">
                  Filter Users
                </Text>
                <Text className="text-slate-400 text-xs mt-1">
                  Choose status or role criteria
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsFilterModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            {/* Status Section */}
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
              By Status
            </Text>
            <View className="flex-row gap-2 mb-4">
              {["All", "Active", "Blocked"].map((status) => {
                const active = statusFilter === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setStatusFilter(status)}
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      active
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-950 border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase ${
                        active ? "text-emerald-300" : "text-slate-400"
                      }`}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Role Section */}
            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
              By Role
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
            >
              <View className="flex-row gap-2">
                {[
                  { label: "All Roles", value: "All" },
                  ...AVAILABLE_ROLES,
                ].map((role) => {
                  const active =
                    roleFilter.toLowerCase() === role.value.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={role.value}
                      onPress={() => setRoleFilter(role.value)}
                      className={`px-4 py-3 rounded-xl border ${
                        active
                          ? "bg-indigo-500/15 border-indigo-500/40"
                          : "bg-slate-950 border-white/5"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold uppercase ${
                          active ? "text-indigo-300" : "text-slate-400"
                        }`}
                      >
                        {role.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsFilterModalOpen(false)}
              className="w-full bg-emerald-600 py-3.5 rounded-2xl items-center"
            >
              <Text className="text-white font-black text-xs uppercase tracking-wider">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* CUSTOM FEEDBACK POPUP DIALOG */}
      {/* ================================================= */}
      <CenteredDialog
        visible={feedbackDialog.visible}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        onClose={() => setFeedbackDialog({ ...feedbackDialog, visible: false })}
        actionLabel="Okay"
      />
    </View>
  );
};

export default UserManagement;

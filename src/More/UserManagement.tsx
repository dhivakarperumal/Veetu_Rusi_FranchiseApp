import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import InnerHeader from "../components/InnerHeader";

import {
    Users,
    UserCheck,
    UserX,
    Search,
    Plus,
    Edit2,
    Trash2,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react-native";

import {
    get,
    post,
    put,
    del,
    patch,
} from "../services/api";

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    active?: string;
    created_at?: string;
}

const UserManagement = () => {
    const navigation = useNavigation<any>();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] =
        useState("All");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [page, setPage] = useState(1);

    const itemsPerPage = 10;

    const [modalVisible, setModalVisible] =
        useState(false);

    const [isEdit, setIsEdit] =
        useState(false);

    const [formData, setFormData] =
        useState({
            id: null as number | null,
            name: "",
            email: "",
            phone: "",
            role: "user",
            password: "",
        });

    const fetchUsers = async () => {
        try {
            setLoading(true);

            const res = await get<User[]>(
                "/superadmin/users"
            );

            setUsers(res);
        } catch (error) {
            Alert.alert(
                "Error",
                "Failed to load users"
            );
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

    const filteredUsers = useMemo(() => {
        let result = users;

        if (search.trim()) {
            const value =
                search.toLowerCase();

            result = result.filter(
                (u) =>
                    u.name
                        ?.toLowerCase()
                        .includes(value) ||
                    u.email
                        ?.toLowerCase()
                        .includes(value) ||
                    u.phone?.includes(value)
            );
        }

        if (roleFilter !== "All") {
            result = result.filter(
                (u) =>
                    u.role?.toLowerCase() ===
                    roleFilter.toLowerCase()
            );
        }

        if (statusFilter === "Active") {
            result = result.filter(
                (u) =>
                    String(u.active).toLowerCase() ===
                    "active"
            );
        }

        if (statusFilter === "Blocked") {
            result = result.filter(
                (u) =>
                    String(u.active).toLowerCase() !==
                    "active"
            );
        }

        return result;
    }, [
        users,
        search,
        roleFilter,
        statusFilter,
    ]);

    const totalPages = Math.ceil(
        filteredUsers.length /
        itemsPerPage
    );

    const paginatedUsers =
        filteredUsers.slice(
            (page - 1) * itemsPerPage,
            page * itemsPerPage
        );

    const handleAddUser =
        async () => {
            try {
                await post(
                    "/superadmin/users",
                    formData
                );

                Alert.alert(
                    "Success",
                    "User added successfully"
                );

                setModalVisible(false);

                fetchUsers();
            } catch {
                Alert.alert(
                    "Error",
                    "Failed to add user"
                );
            }
        };

    const handleUpdateUser =
        async () => {
            try {
                const payload: any = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    role: formData.role,
                    ...(formData.password
                        ? { password: formData.password }
                        : {}),
                };

                await put(
                    `/superadmin/users/${formData.id}`,
                    payload
                );

                Alert.alert(
                    "Success",
                    "User updated successfully"
                );

                setModalVisible(false);

                fetchUsers();
            } catch {
                Alert.alert(
                    "Error",
                    "Failed to update user"
                );
            }
        };

    const handleDelete =
        (id: number) => {
            Alert.alert(
                "Delete User",
                "Are you sure?",
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
                                await del(
                                    `/superadmin/users/${id}`
                                );

                                fetchUsers();
                            } catch {
                                Alert.alert(
                                    "Error",
                                    "Delete failed"
                                );
                            }
                        },
                    },
                ]
            );
        };

    const toggleStatus =
        async (
            id: number,
            currentStatus: string
        ) => {
            try {
                const active =
                    currentStatus?.toLowerCase() ===
                        "active"
                        ? 0
                        : 1;

                await patch(
                    `/superadmin/users/status/${id}`,
                    { active }
                );

                fetchUsers();
            } catch {
                Alert.alert(
                    "Error",
                    "Status update failed"
                );
            }
        };

    const openAddModal = () => {
        setIsEdit(false);

        setFormData({
            id: null,
            name: "",
            email: "",
            phone: "",
            role: "user",
            password: "",
        });

        setModalVisible(true);
    };

    const openEditModal = (user: User) => {
        setIsEdit(true);

        setFormData({
            id: user.id,
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "user",
            password: "",
        });

        setModalVisible(true);
    };

    const getRoleColor = (
        role?: string
    ) => {
        switch (
        role?.toLowerCase()
        ) {
            case "admin":
                return "#2563eb";

            case "superadmin":
                return "#7c3aed";

            case "chef":
                return "#ea580c";

            case "franchise":
                return "#ca8a04";

            case "delivery_partner":
                return "#0284c7";

            default:
                return "#64748b";
        }
    };

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator
                    size="large"
                />

                <Text
                    style={{
                        marginTop: 10,
                    }}
                >
                    Loading Users...
                </Text>
            </View>
        );
    }

    const renderUser = ({
        item,
    }: {
        item: User;
    }) => (
        <View
            style={{
                backgroundColor:
                    "#fff",
                marginHorizontal: 20,
                marginBottom: 12,
                padding: 15,
                borderRadius: 16,
            }}
        >

            <Text
                style={{
                    fontSize: 16,
                    fontWeight: "700",
                }}
            >
                {item.name}
            </Text>

            <Text>
                {item.email}
            </Text>

            <Text>
                {item.phone ||
                    "N/A"}
            </Text>

            <View
                style={{
                    marginTop: 10,
                }}
            >
                <Text
                    style={{
                        color:
                            getRoleColor(
                                item.role
                            ),
                        fontWeight:
                            "600",
                    }}
                >
                    {item.role}
                </Text>
            </View>

            <View
                style={{
                    flexDirection:
                        "row",
                    marginTop: 15,
                    justifyContent:
                        "space-between",
                }}
            >

                <TouchableOpacity
                    onPress={() =>
                        toggleStatus(
                            item.id,
                            item.active ||
                            ""
                        )
                    }
                >
                    {String(
                        item.active
                    ).toLowerCase() ===
                        "active" ? (
                        <ShieldAlert
                            color="red"
                        />
                    ) : (
                        <ShieldCheck
                            color="green"
                        />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        openEditModal(
                            item
                        )
                    }
                >
                    <Edit2
                        color="#2563eb"
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        handleDelete(
                            item.id
                        )
                    }
                >
                    <Trash2
                        color="red"
                    />
                </TouchableOpacity>

            </View>

        </View>
    );

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            Alert.alert(
                "Validation",
                "Name is required"
            );
            return;
        }

        if (!formData.email.trim()) {
            Alert.alert(
                "Validation",
                "Email is required"
            );
            return;
        }

        if (
            !isEdit &&
            !formData.password.trim()
        ) {
            Alert.alert(
                "Validation",
                "Password is required"
            );
            return;
        }

        if (isEdit) {
            handleUpdateUser();
        } else {
            handleAddUser();
        }
    };

    return (
        <View
            className="flex-1 bg-slate-50"
        >
            <InnerHeader title="User Management" navigation={navigation} />
            <FlatList
                data={paginatedUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderUser}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
                contentContainerStyle={{
                    paddingBottom: 100,
                }}
                ListHeaderComponent={
                    <>
                        <View className="p-5">
                            <View className="flex-row items-center justify-end">
                                <TouchableOpacity
                                    onPress={openAddModal}
                                    className="flex-row items-center rounded-xl bg-slate-800 px-4 py-2.5"
                                >
                                    <Plus
                                        size={18}
                                        color="#fff"
                                    />

                                    <Text className="ml-1.5 font-semibold text-white">
                                        Add User
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-5"
                            contentContainerStyle={{
                                paddingHorizontal: 20,
                            }}
                        >
                            {/* Total Users */}
                            <View className="mr-3 w-[170px] rounded-3xl bg-[#131127] p-[18px]">
                                <Users
                                    color="#fff"
                                    size={28}
                                />

                                <Text className="mt-2.5 text-slate-400">
                                    Total Users
                                </Text>

                                <Text className="text-[28px] font-bold text-white">
                                    {users.length}
                                </Text>
                            </View>

                            {/* Active Users */}
                            <View className="mr-3 w-[170px] rounded-3xl bg-green-950 p-[18px]">
                                <UserCheck
                                    color="#fff"
                                    size={28}
                                />

                                <Text className="mt-2.5 text-green-300">
                                    Active
                                </Text>

                                <Text className="text-[28px] font-bold text-white">
                                    {
                                        users.filter(
                                            (u) =>
                                                String(u.active).toLowerCase() ===
                                                "active"
                                        ).length
                                    }
                                </Text>
                            </View>

                            {/* Blocked Users */}
                            <View className="w-[170px] rounded-3xl bg-red-950 p-[18px]">
                                <UserX
                                    color="#fff"
                                    size={28}
                                />

                                <Text className="mt-2.5 text-red-300">
                                    Blocked
                                </Text>

                                <Text className="text-[28px] font-bold text-white">
                                    {
                                        users.filter(
                                            (u) =>
                                                String(u.active).toLowerCase() !==
                                                "active"
                                        ).length
                                    }
                                </Text>
                            </View>
                        </ScrollView>

                        <View className="mb-4 px-5">
                            <View className="h-14 flex-row items-center rounded-2xl bg-white px-4">
                                <Search
                                    size={20}
                                    color="#64748b"
                                />

                                <TextInput
                                    placeholder="Search users..."
                                    value={search}
                                    onChangeText={setSearch}
                                    className="ml-3 flex-1 text-base text-slate-900"
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        </View>
                    </>
                }
                ListFooterComponent={
                    <View className="items-center p-5">
                        <Text className="mb-4 text-slate-500">
                            Page {page} of {totalPages || 1}
                        </Text>

                        <View className="flex-row">
                            <TouchableOpacity
                                disabled={page === 1}
                                onPress={() => setPage(page - 1)}
                                className={`mr-3 rounded-xl px-5 py-2.5 ${page === 1
                                    ? "bg-slate-300"
                                    : "bg-blue-600"
                                    }`}
                            >
                                <Text className="font-semibold text-white">
                                    Prev
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={
                                    page === totalPages ||
                                    totalPages === 0
                                }
                                onPress={() => setPage(page + 1)}
                                className={`rounded-xl px-5 py-2.5 ${page === totalPages ||
                                    totalPages === 0
                                    ? "bg-slate-300"
                                    : "bg-blue-600"
                                    }`}
                            >
                                <Text className="font-semibold text-white">
                                    Next
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
            />

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
            >
                <View
                    className="flex-1 justify-center p-5"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                >
                    <View
                        className="rounded-3xl bg-white p-5"
                        style={{
                            maxHeight: "90%",
                        }}
                    >
                        <ScrollView>
                            <Text className="mb-5 text-[22px] font-bold text-slate-900">
                                {isEdit ? "Edit User" : "Add User"}
                            </Text>

                            <TextInput
                                placeholder="Name"
                                value={formData.name}
                                onChangeText={(text) =>
                                    setFormData({
                                        ...formData,
                                        name: text,
                                    })
                                }
                                className="mb-3 rounded-xl border border-slate-200 p-3"
                            />

                            <TextInput
                                placeholder="Email"
                                value={formData.email}
                                onChangeText={(text) =>
                                    setFormData({
                                        ...formData,
                                        email: text,
                                    })
                                }
                                className="mb-3 rounded-xl border border-slate-200 p-3"
                            />

                            <TextInput
                                placeholder="Phone"
                                value={formData.phone}
                                onChangeText={(text) =>
                                    setFormData({
                                        ...formData,
                                        phone: text,
                                    })
                                }
                                className="mb-3 rounded-xl border border-slate-200 p-3"
                            />

                            <TextInput
                                placeholder="Role"
                                value={formData.role}
                                onChangeText={(text) =>
                                    setFormData({
                                        ...formData,
                                        role: text,
                                    })
                                }
                                className="mb-3 rounded-xl border border-slate-200 p-3"
                            />

                            <TextInput
                                placeholder={
                                    isEdit
                                        ? "Leave empty to keep password"
                                        : "Password"
                                }
                                secureTextEntry
                                value={formData.password}
                                onChangeText={(text) =>
                                    setFormData({
                                        ...formData,
                                        password: text,
                                    })
                                }
                                className="mb-5 rounded-xl border border-slate-200 p-3"
                            />

                            <View className="flex-row justify-end">
                                <TouchableOpacity
                                    onPress={() =>
                                        setModalVisible(false)
                                    }
                                    className="mr-3 px-5 py-2.5"
                                >
                                    <Text className="font-semibold text-slate-700">
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    className="rounded-xl bg-blue-600 px-5 py-2.5"
                                >
                                    <Text className="font-semibold text-white">
                                        {isEdit
                                            ? "Update"
                                            : "Add User"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default UserManagement;

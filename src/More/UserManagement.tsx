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
            style={{
                flex: 1,
                backgroundColor: "#f8fafc",
            }}
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
                        <View
                            style={{
                                padding: 20,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 24,
                                        fontWeight: "700",
                                    }}
                                >
                                    User Management
                                </Text>

                                <TouchableOpacity
                                    onPress={openAddModal}
                                    style={{
                                        backgroundColor: "#2a3042",
                                        paddingHorizontal: 15,
                                        paddingVertical: 10,
                                        borderRadius: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Plus
                                        size={18}
                                        color="#fff"
                                    />

                                    <Text
                                        style={{
                                            color: "#fff",
                                            marginLeft: 6,
                                            fontWeight: "600",
                                        }}
                                    >
                                        Add User
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={{
                                paddingHorizontal: 20,
                                marginBottom: 20,
                            }}
                        >
                            <View
                                style={{
                                    width: 170,
                                    backgroundColor: "#131127",
                                    padding: 18,
                                    borderRadius: 20,
                                    marginRight: 12,
                                }}
                            >
                                <Users
                                    color="#fff"
                                    size={28}
                                />

                                <Text
                                    style={{
                                        color: "#94a3b8",
                                        marginTop: 10,
                                    }}
                                >
                                    Total Users
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 28,
                                        fontWeight: "700",
                                        color: "#fff",
                                    }}
                                >
                                    {users.length}
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: 170,
                                    backgroundColor: "#052e16",
                                    padding: 18,
                                    borderRadius: 20,
                                    marginRight: 12,
                                }}
                            >
                                <UserCheck
                                    color="#fff"
                                    size={28}
                                />

                                <Text
                                    style={{
                                        color: "#86efac",
                                        marginTop: 10,
                                    }}
                                >
                                    Active
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 28,
                                        fontWeight: "700",
                                        color: "#fff",
                                    }}
                                >
                                    {users.filter(
                                        (u) =>
                                            String(u.active).toLowerCase() ===
                                            "active"
                                    ).length}
                                </Text>
                            </View>

                            <View
                                style={{
                                    width: 170,
                                    backgroundColor: "#450a0a",
                                    padding: 18,
                                    borderRadius: 20,
                                }}
                            >
                                <UserX
                                    color="#fff"
                                    size={28}
                                />

                                <Text
                                    style={{
                                        color: "#fca5a5",
                                        marginTop: 10,
                                    }}
                                >
                                    Blocked
                                </Text>

                                <Text
                                    style={{
                                        fontSize: 28,
                                        fontWeight: "700",
                                        color: "#fff",
                                    }}
                                >
                                    {users.filter(
                                        (u) =>
                                            String(u.active).toLowerCase() !==
                                            "active"
                                    ).length}
                                </Text>
                            </View>
                        </ScrollView>

                        <View
                            style={{
                                paddingHorizontal: 20,
                                marginBottom: 15,
                            }}
                        >
                            <View
                                style={{
                                    backgroundColor: "#fff",
                                    borderRadius: 15,
                                    paddingHorizontal: 15,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    height: 55,
                                }}
                            >
                                <Search
                                    size={20}
                                    color="#64748b"
                                />

                                <TextInput
                                    placeholder="Search users..."
                                    value={search}
                                    onChangeText={setSearch}
                                    style={{
                                        flex: 1,
                                        marginLeft: 10,
                                    }}
                                />
                            </View>
                        </View>
                    </>
                }
                ListFooterComponent={
                    <View
                        style={{
                            padding: 20,
                            alignItems: "center",
                        }}
                    >
                        <Text
                            style={{
                                marginBottom: 15,
                                color: "#64748b",
                            }}
                        >
                            Page {page} of {totalPages || 1}
                        </Text>

                        <View
                            style={{
                                flexDirection: "row",
                            }}
                        >
                            <TouchableOpacity
                                disabled={page === 1}
                                onPress={() => setPage(page - 1)}
                                style={{
                                    backgroundColor:
                                        page === 1 ? "#cbd5e1" : "#2563eb",
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    marginRight: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontWeight: "600",
                                    }}
                                >
                                    Prev
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                disabled={page === totalPages || totalPages === 0}
                                onPress={() => setPage(page + 1)}
                                style={{
                                    backgroundColor:
                                        page === totalPages || totalPages === 0
                                            ? "#cbd5e1"
                                            : "#2563eb",
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#fff",
                                        fontWeight: "600",
                                    }}
                                >
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
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "center",
                        padding: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: 20,
                            maxHeight: "90%",
                        }}
                    >
                        <ScrollView>
                            <Text
                                style={{
                                    fontSize: 22,
                                    fontWeight: "700",
                                    marginBottom: 20,
                                }}
                            >
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
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#e2e8f0",
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 12,
                                }}
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
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#e2e8f0",
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 12,
                                }}
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
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#e2e8f0",
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 12,
                                }}
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
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#e2e8f0",
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 12,
                                }}
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
                                style={{
                                    borderWidth: 1,
                                    borderColor: "#e2e8f0",
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 20,
                                }}
                            />

                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setModalVisible(false)}
                                    style={{
                                        paddingHorizontal: 20,
                                        paddingVertical: 10,
                                        marginRight: 10,
                                    }}
                                >
                                    <Text
                                        style={{
                                            fontWeight: "600",
                                        }}
                                    >
                                        Cancel
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    style={{
                                        backgroundColor: "#2563eb",
                                        paddingHorizontal: 20,
                                        paddingVertical: 10,
                                        borderRadius: 10,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: "#fff",
                                            fontWeight: "600",
                                        }}
                                    >
                                        {isEdit ? "Update" : "Add User"}
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

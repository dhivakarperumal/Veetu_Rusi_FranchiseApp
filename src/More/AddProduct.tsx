import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { get, post, put, del } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AddProduct = () => {
    const navigation: any = useNavigation();
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const randomId =
            "PR" +
            Math.floor(
                1000 + Math.random() * 9000
            );

        setForm(prev => ({
            ...prev,
            productId: randomId,
        }));
    }, []);

    const [form, setForm] = useState({
        productId: "",
        name: "",
        description: "",
        category: "",
        mrp: "",
        stock: "",
        manufactureDate: "",
        expiryDate: "",
        status: "Active",
    });

    const handleSubmit = async () => {
        try {
            if (
                !form.name ||
                !form.category ||
                !form.mrp
            ) {
                Alert.alert(
                    "Validation",
                    "Please fill all required fields"
                );
                return;
            }

            setLoading(true);

            const userData = await AsyncStorage.getItem("user");

            const user = userData
                ? JSON.parse(userData)
                : null;

            console.log("User Object:", JSON.stringify(user, null, 2));

            const payload = {
                productId: form.productId,
                name: form.name,
                description: form.description,
                category: form.category,

                mrp: Number(form.mrp),

                total_stock: Number(form.stock),

                manufactureDate:
                    form.manufactureDate,

                expiryDate:
                    form.expiryDate,

                status: "Active",
            };

            console.log("Payload:", JSON.stringify(payload, null, 2));

            const response = await post(
                "/products",
                payload
            );

            console.log(response);

            Alert.alert(
                "Success",
                "Product Created Successfully"
            );

            navigation.goBack();
        } catch (error: any) {
            console.log(error);

            Alert.alert(
                "Error",
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Header */}

                <View className="flex-row items-center px-4 py-4">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                    >
                        <ArrowLeft size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <Text className="text-2xl font-bold ml-4">
                        Add Product
                    </Text>
                </View>

                {/* Form */}

                <View className="px-4">
                    {/* Product ID */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Product ID
                        </Text>

                        <TextInput
                            placeholder="PR001"
                            value={form.productId}
                            onChangeText={(text) =>
                                setForm({ ...form, productId: text })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* Product Name */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Product Name
                        </Text>

                        <TextInput
                            placeholder="Enter Product Name"
                            value={form.name}
                            onChangeText={(text) =>
                                setForm({ ...form, name: text })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* Description */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Description
                        </Text>

                        <TextInput
                            multiline
                            numberOfLines={4}
                            placeholder="Product Description"
                            value={form.description}
                            onChangeText={(text) =>
                                setForm({ ...form, description: text })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* Category */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Category
                        </Text>

                        <TextInput
                            placeholder="Category"
                            value={form.category}
                            onChangeText={(text) =>
                                setForm({ ...form, category: text })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* MRP */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            MRP
                        </Text>

                        <TextInput
                            keyboardType="numeric"
                            placeholder="100"
                            value={form.mrp}
                            onChangeText={(text) =>
                                setForm({ ...form, mrp: text })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* Stock */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Total Stock
                        </Text>

                        <TextInput
                            keyboardType="numeric"
                            placeholder="50"
                            value={form.stock}
                            onChangeText={(text) =>
                                setForm({ ...form, stock: text })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* Manufacture Date */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Manufacture Date
                        </Text>

                        <TextInput
                            placeholder="YYYY-MM-DD"
                            value={form.manufactureDate}
                            onChangeText={(text) =>
                                setForm({
                                    ...form,
                                    manufactureDate: text,
                                })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* Expiry Date */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Expiry Date
                        </Text>

                        <TextInput
                            placeholder="YYYY-MM-DD"
                            value={form.expiryDate}
                            onChangeText={(text) =>
                                setForm({
                                    ...form,
                                    expiryDate: text,
                                })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                        />
                    </View>

                    {/* Save Button */}

                    <TouchableOpacity
                        disabled={loading}
                        onPress={handleSubmit}
                        className="bg-emerald-600 rounded-2xl py-4 mt-4"
                    >
                        <Text className="text-center text-white font-bold">
                            {loading
                                ? "Saving..."
                                : "Save Product"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddProduct;
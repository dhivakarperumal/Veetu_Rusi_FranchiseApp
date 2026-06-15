import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image, 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, Package } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { get } from "../services/api";

interface Product {
    id: number;
    name: string;
    description: string;
    category: string;
    mrp: string;
    offer_price: string;
    product_code: string;
    total_stock: number;
    status: string;
    images?: string[];
    variants?: any[];
}

const Products = () => {
    const navigation: any = useNavigation();

    const [products, setProducts] = useState<Product[]>([]);
    const [filteredData, setFilteredData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");

    const fetchProducts = async () => {
        try {
            setLoading(true);

            const response = await get<any[]>("/products");

            console.log("Products:", response);

            setProducts(response || []);
            setFilteredData(response || []);
        } catch (error) {
            console.log("Products Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSearch = (text: string) => {
        setSearch(text);

        const filtered = products.filter(
            (item) =>
                item?.name?.toLowerCase().includes(text.toLowerCase()) ||
                item?.product_code?.toLowerCase().includes(text.toLowerCase())
        );

        setFilteredData(filtered);
    };

    const renderItem = ({ item }: { item: Product }) => {
        const image =
            item?.images?.length > 0
                ? item.images[0]
                : null;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                className="bg-white rounded-3xl p-4 mb-4"
            >
                <View className="flex-row">
                    {image ? (
                        <Image
                            source={{ uri: image }}
                            className="w-24 h-24 rounded-2xl"
                        />
                    ) : (
                        <View className="w-24 h-24 rounded-2xl bg-slate-200 items-center justify-center">
                            <Package
                                size={30}
                                color="#64748b"
                            />
                        </View>
                    )}

                    <View className="flex-1 ml-4">
                        <Text className="text-lg font-bold text-slate-900">
                            {item.name}
                        </Text>

                        <Text className="text-slate-500 mt-1">
                            {item.product_code}
                        </Text>

                        <Text className="text-slate-500 mt-1">
                            {item.category}
                        </Text>

                        <View className="flex-row justify-between mt-3">
                            <Text className="font-bold text-emerald-600">
                                ₹{item.offer_price}
                            </Text>

                            <Text className="text-slate-500">
                                Stock: {item.total_stock}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#059669" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            {/* Header */}

            <View className="px-4 pt-2 pb-4 flex-row items-center justify-between">
                <Text className="text-3xl font-bold text-slate-900">
                    Products
                </Text>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("AddProduct")}
                    className="bg-emerald-600 w-12 h-12 rounded-full items-center justify-center"
                >
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            {/* Search */}

            <View className="px-4 mb-4">
                <View className="bg-white rounded-2xl px-4 flex-row items-center">
                    <Search color="#64748b" size={20} />

                    <TextInput
                        placeholder="Search Product..."
                        value={search}
                        onChangeText={handleSearch}
                        className="flex-1 py-4 ml-3"
                    />
                </View>
            </View>

            {/* List */}

            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingBottom: 100,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            fetchProducts();
                        }}
                    />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <Package size={60} color="#94a3b8" />

                        <Text className="text-slate-500 mt-3">
                            No Products Found
                        </Text>
                    </View>
                }
                renderItem={renderItem}
            />
        </SafeAreaView>
    );
};

export default Products;
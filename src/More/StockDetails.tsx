import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Search,
  Package,
  AlertTriangle,
  Plus,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { get } from "../../services/api";

interface Product {
  id: number;
  name: string;
  category: string;
  product_code: string;
  total_stock: number;
  status: string;
  offer_price: string;
}

const StockDetails = () => {
  const navigation: any = useNavigation();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredData, setFilteredData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      const response = await get<Product[]>("/products");

      setProducts(response || []);
      setFilteredData(response || []);
    } catch (error) {
      console.log(error);
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
      item =>
        item.name
          ?.toLowerCase()
          .includes(text.toLowerCase()) ||
        item.product_code
          ?.toLowerCase()
          .includes(text.toLowerCase())
    );

    setFilteredData(filtered);
  };

  const getStatusColor = (
    stock: number
  ) => {
    if (stock <= 0)
      return "text-red-500";

    if (stock < 10)
      return "text-orange-500";

    return "text-emerald-600";
  };

  const getStatusText = (
    stock: number
  ) => {
    if (stock <= 0)
      return "Out Of Stock";

    if (stock < 10)
      return "Low Stock";

    return "In Stock";
  };

  const renderItem = ({
    item,
  }: {
    item: Product;
  }) => (
    <View className="bg-white rounded-3xl p-4 mb-3">
      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">
            {item.name}
          </Text>

          <Text className="text-slate-500 mt-1">
            {item.product_code}
          </Text>

          <Text className="text-slate-500 mt-1">
            {item.category}
          </Text>
        </View>

        <View className="items-end">
          <Text className="font-bold text-slate-900">
            Stock
          </Text>

          <Text
            className={`font-bold text-lg ${getStatusColor(
              item.total_stock
            )}`}
          >
            {item.total_stock}
          </Text>
        </View>
      </View>

      <View className="border-t border-slate-100 mt-4 pt-3 flex-row justify-between">
        <Text className="text-slate-500">
          ₹{item.offer_price}
        </Text>

        <Text
          className={`font-semibold ${getStatusColor(
            item.total_stock
          )}`}
        >
          {getStatusText(
            item.total_stock
          )}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator
          size="large"
          color="#059669"
        />
      </SafeAreaView>
    );
  }

  const lowStock = products.filter(
    item =>
      item.total_stock > 0 &&
      item.total_stock < 10
  ).length;

  const outOfStock =
    products.filter(
      item => item.total_stock <= 0
    ).length;

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      {/* Header */}

      <View className="px-4 pt-2 pb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-slate-900">
          Stock Details
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              "AddStock"
            )
          }
          className="bg-emerald-600 w-12 h-12 rounded-full items-center justify-center"
        >
          <Plus
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}

      <View className="flex-row px-4 mb-4">
        <View className="flex-1 bg-orange-100 rounded-2xl p-4 mr-2">
          <AlertTriangle
            color="#ea580c"
            size={24}
          />

          <Text className="text-orange-600 font-bold mt-2">
            Low Stock
          </Text>

          <Text className="text-2xl font-bold text-orange-700">
            {lowStock}
          </Text>
        </View>

        <View className="flex-1 bg-red-100 rounded-2xl p-4 ml-2">
          <Package
            color="#dc2626"
            size={24}
          />

          <Text className="text-red-600 font-bold mt-2">
            Out Stock
          </Text>

          <Text className="text-2xl font-bold text-red-700">
            {outOfStock}
          </Text>
        </View>
      </View>

      {/* Search */}

      <View className="px-4 mb-4">
        <View className="bg-white rounded-2xl px-4 flex-row items-center">
          <Search
            size={20}
            color="#64748b"
          />

          <TextInput
            placeholder="Search Product"
            value={search}
            onChangeText={handleSearch}
            className="flex-1 py-4 ml-3"
          />
        </View>
      </View>

      {/* List */}

      <FlatList
        data={filteredData}
        keyExtractor={item =>
          item.id.toString()
        }
        renderItem={renderItem}
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
      />
    </SafeAreaView>
  );
};

export default StockDetails;
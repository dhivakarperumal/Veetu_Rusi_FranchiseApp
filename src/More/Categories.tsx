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
import {
  Search,
  Plus,
  LayoutGrid,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { get } from "../services/api";

interface Category {
  id: number;
  catId: string;
  name: string;
  description: string;
  images?: string[];
}

const Categories = () => {
  const navigation: any = useNavigation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredData, setFilteredData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchCategories = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");

      if (!userData) return;

      const user = JSON.parse(userData);

      const franchiseUserId =
        user?.user_id ||
        user?.id ||
        user?.franchise_user_id;

      const response = await get<any[]>(
        `/categories?franchise_user_id=${franchiseUserId}`
      );

      const data = response || [];

      setCategories(data);
      setFilteredData(data);
    } catch (error) {
      console.log("Category Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);

    const filtered = categories.filter(
      (item) =>
        item?.name
          ?.toLowerCase()
          .includes(text.toLowerCase()) ||
        item?.catId
          ?.toLowerCase()
          .includes(text.toLowerCase())
    );

    setFilteredData(filtered);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      activeOpacity={0.8}
      className="bg-white rounded-3xl mb-4 overflow-hidden"
    >
      {item?.images?.length > 0 ? (
        <Image
          source={{
            uri: item.images[0],
          }}
          className="w-full h-40"
          resizeMode="cover"
        />
      ) : (
        <View className="h-40 bg-slate-200 items-center justify-center">
          <LayoutGrid
            size={50}
            color="#64748b"
          />
        </View>
      )}

      <View className="p-4">
        <Text className="text-lg font-bold text-slate-900">
          {item.name}
        </Text>

        <Text className="text-slate-500 mt-1">
          {item.catId}
        </Text>

        <Text
          numberOfLines={2}
          className="text-slate-500 mt-2"
        >
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
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

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      {/* Header */}

      <View className="px-4 pt-2 pb-4 flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-slate-900">
          Categories
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              "AddCategory"
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

      {/* Search */}

      <View className="px-4 mb-4">
        <View className="bg-white rounded-2xl px-4 flex-row items-center">
          <Search
            size={20}
            color="#64748b"
          />

          <TextInput
            placeholder="Search Category"
            value={search}
            onChangeText={handleSearch}
            className="flex-1 py-4 ml-3"
          />
        </View>
      </View>

      {/* Category List */}

      <FlatList
        data={filteredData}
        keyExtractor={(item) =>
          item.id.toString()
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchCategories();
            }}
          />
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <LayoutGrid
              size={60}
              color="#94a3b8"
            />

            <Text className="text-slate-500 mt-3">
              No Categories Found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Categories;
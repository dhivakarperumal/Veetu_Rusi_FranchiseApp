import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { get, put } from "../../services/api";

interface Product {
  id: number;
  name: string;
  product_code: string;
  total_stock: number;
  status: string;
}

const AddStock = () => {
  const navigation: any = useNavigation();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [quantity, setQuantity] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const fetchProducts = async () => {
    try {
      const response =
        await get<Product[]>("/products");

      setProducts(response || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async () => {
    try {
      if (!selectedProduct) {
        Alert.alert(
          "Select Product"
        );
        return;
      }

      if (!quantity) {
        Alert.alert(
          "Enter Quantity"
        );
        return;
      }

      setLoading(true);

      const currentStock =
        Number(
          selectedProduct.total_stock
        ) || 0;

      const addQty =
        Number(quantity);

      const updatedStock =
        currentStock + addQty;

      const payload = {
        ...selectedProduct,
        total_stock:
          updatedStock,
      };

      await put(
        `/products/${selectedProduct.id}`,
        payload
      );

      Alert.alert(
        "Success",
        "Stock Updated"
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
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        {/* Header */}

        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity
            onPress={() =>
              navigation.goBack()
            }
          >
            <ArrowLeft
              size={24}
              color="#0f172a"
            />
          </TouchableOpacity>

          <Text className="text-2xl font-bold ml-4">
            Add Stock
          </Text>
        </View>

        <View className="px-4">
          {/* Product */}

          <View className="bg-white rounded-3xl p-4 mb-4">
            <Text className="font-bold mb-2">
              Select Product
            </Text>

            <Picker
              selectedValue={
                selectedProduct?.id
              }
              onValueChange={value => {
                const product =
                  products.find(
                    p =>
                      p.id === value
                  );

                setSelectedProduct(
                  product || null
                );
              }}
            >
              <Picker.Item
                label="Choose Product"
                value=""
              />

              {products.map(item => (
                <Picker.Item
                  key={item.id}
                  label={`${item.name} (${item.product_code})`}
                  value={item.id}
                />
              ))}
            </Picker>
          </View>

          {/* Current Stock */}

          <View className="bg-white rounded-3xl p-4 mb-4">
            <Text className="font-bold">
              Current Stock
            </Text>

            <Text className="text-3xl font-bold text-emerald-600 mt-2">
              {selectedProduct
                ?.total_stock || 0}
            </Text>
          </View>

          {/* Quantity */}

          <View className="bg-white rounded-3xl p-4 mb-4">
            <Text className="font-bold mb-2">
              Quantity To Add
            </Text>

            <TextInput
              keyboardType="numeric"
              placeholder="Enter Quantity"
              value={quantity}
              onChangeText={
                setQuantity
              }
              className="border border-slate-200 rounded-xl px-4 py-3"
            />
          </View>

          {/* Preview */}

          {selectedProduct &&
            quantity && (
              <View className="bg-emerald-50 rounded-3xl p-4 mb-4">
                <Text className="font-bold">
                  Updated Stock
                </Text>

                <Text className="text-3xl font-bold text-emerald-700 mt-2">
                  {Number(
                    selectedProduct.total_stock
                  ) +
                    Number(
                      quantity
                    )}
                </Text>
              </View>
            )}

          {/* Save */}

          <TouchableOpacity
            disabled={loading}
            onPress={handleSave}
            className="bg-emerald-600 rounded-2xl py-4"
          >
            <Text className="text-center text-white font-bold text-lg">
              {loading
                ? "Saving..."
                : "Update Stock"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddStock;
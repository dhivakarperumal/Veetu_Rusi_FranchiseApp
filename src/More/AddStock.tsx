import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Boxes,
  Plus,
  AlertTriangle,
  ChevronDown,
  X,
  CheckCircle,
  Package,
} from "lucide-react-native";

import { get, put } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import CenteredDialog from "../components/CenteredDialog";

interface Product {
  id: number;
  name: string;
  productId?: string;
  product_code?: string;
  total_stock?: number | string;
  stock?: number | string;
  status?: string;
}

const AddStock = () => {
  const navigation: any = useNavigation();

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [feedbackDialog, setFeedbackDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onSuccessGoBack?: boolean;
  }>({
    visible: false,
    title: "",
    message: "",
    onSuccessGoBack: false,
  });

  const fetchProducts = async () => {
    try {
      const response = await get<any[]>("/franchise-products");
      if (Array.isArray(response)) {
        setProducts(response);
      } else {
        const altRes = await get<any[]>("/products");
        setProducts(Array.isArray(altRes) ? altRes : []);
      }
    } catch (error) {
      console.log("AddStock fetch products error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getStockNumber = (item: Product | null) => {
    if (!item) return 0;
    return Number(item.total_stock ?? item.stock ?? 0);
  };

  const handleSave = async () => {
    setErrorMessage("");
    if (!selectedProduct) {
      setErrorMessage("Please select a product from your catalog.");
      return;
    }

    const addQty = Number(quantity);
    if (!quantity || isNaN(addQty) || addQty <= 0) {
      setErrorMessage("Please enter a valid stock quantity to add.");
      return;
    }

    setLoading(true);
    try {
      const currentStock = getStockNumber(selectedProduct);
      const updatedStock = currentStock + addQty;

      await put(`/franchise-products/${selectedProduct.id}`, {
        ...selectedProduct,
        total_stock: updatedStock,
      });

      setFeedbackDialog({
        visible: true,
        title: "Stock Updated",
        message: `Successfully added ${addQty} units to ${selectedProduct.name}. New total: ${updatedStock} units.`,
        onSuccessGoBack: true,
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to update stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Add Inventory Stock" navigation={navigation} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 40,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Bar */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1">
              <Text className="text-white text-3xl font-black">
                Stock Replenish
              </Text>
              <Text className="text-slate-400 mt-1 text-xs">
                Increase warehouse stock levels for catalog products
              </Text>
            </View>

            <View className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
              <Boxes size={20} color="#fbbf24" />
            </View>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View className="mb-4 bg-red-500/15 border border-red-500/30 rounded-2xl p-3.5 flex-row items-center">
              <AlertTriangle size={18} color="#f87171" />
              <Text className="text-red-400 text-xs font-bold ml-2.5 flex-1">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-5">
            {/* Select Product */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Target Product *
              </Text>
              <TouchableOpacity
                onPress={() => setIsProductModalOpen(true)}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedProduct ? "text-white" : "text-slate-500"
                  }`}
                  numberOfLines={1}
                >
                  {selectedProduct
                    ? `${selectedProduct.name} (${selectedProduct.productId || selectedProduct.product_code || `#${selectedProduct.id}`})`
                    : "Choose catalog product..."}
                </Text>
                <ChevronDown size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Current Stock */}
            {selectedProduct && (
              <View className="bg-slate-950 border border-slate-800 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    Current In-Stock
                  </Text>
                  <Text className="text-white text-2xl font-black mt-1">
                    {getStockNumber(selectedProduct)} units
                  </Text>
                </View>
                <Package size={28} color="#64748b" />
              </View>
            )}

            {/* Quantity to Add */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Quantity To Add *
              </Text>
              <TextInput
                keyboardType="numeric"
                placeholder="e.g. 100"
                placeholderTextColor="#64748b"
                value={quantity}
                onChangeText={(text) => {
                  setErrorMessage("");
                  setQuantity(text);
                }}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-base font-bold"
              />
            </View>

            {/* Live Preview */}
            {selectedProduct && Number(quantity) > 0 && (
              <View className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 flex-row items-center justify-between">
                <View>
                  <Text className="text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    Updated Stock Level
                  </Text>
                  <Text className="text-emerald-400 text-2xl font-black mt-0.5">
                    {getStockNumber(selectedProduct) + Number(quantity)} units
                  </Text>
                </View>
                <CheckCircle size={24} color="#34d399" />
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSave}
            className="bg-emerald-600 rounded-2xl py-4 items-center shadow-lg"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-black text-sm uppercase tracking-wider">
                Update Stock Level
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Product Selection Modal */}
      <Modal
        visible={isProductModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsProductModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[75%]"
            style={{ paddingBottom: 24 }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-black">
                Choose Product
              </Text>
              <TouchableOpacity
                onPress={() => setIsProductModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-2">
              {products.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      setSelectedProduct(p);
                      setIsProductModalOpen(false);
                    }}
                    className={`py-3.5 px-4 rounded-xl border flex-row items-center justify-between mb-2 ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-950 border-white/5"
                    }`}
                  >
                    <View className="flex-1">
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {p.name}
                      </Text>
                      <Text className="text-slate-400 text-[10px] mt-0.5 font-mono">
                        {p.productId || p.product_code || `#${p.id}`} • Current:{" "}
                        {getStockNumber(p)} units
                      </Text>
                    </View>
                    {isSelected && <CheckCircle size={16} color="#34d399" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Feedback Dialog */}
      <CenteredDialog
        visible={feedbackDialog.visible}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        onClose={() => {
          setFeedbackDialog({ ...feedbackDialog, visible: false });
          if (feedbackDialog.onSuccessGoBack) {
            navigation.goBack();
          }
        }}
        actionLabel="Done"
      />
    </View>
  );
};

export default AddStock;
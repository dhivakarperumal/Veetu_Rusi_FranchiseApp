import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  Layers,
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Calendar as CalendarIcon,
  Tag,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Boxes,
  Barcode,
  ChevronDown,
  X,
} from "lucide-react-native";
import { launchImageLibrary } from "react-native-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { get, post, put } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import CenteredDialog from "../components/CenteredDialog";
import DatePickerModal from "../components/DatePickerModal";

const parseJsonSafely = (val: any) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  return [];
};

const parseQuantityValue = (value: any) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return { unit: "count", normalized: 0, original: "" };
  const rawNumber = text.match(/[0-9]+(?:[.,][0-9]+)?/g)?.join("") || "";
  const number = parseFloat(rawNumber.replace(/,/g, "")) || 0;
  let unit = "count";

  if (/kg|kilogram|kilograms/.test(text)) unit = "kg";
  else if (/\b(?:g|gram|grams)\b/.test(text)) unit = "g";
  else if (/\b(?:l|liter|litre|liters|litres)\b/.test(text)) unit = "l";
  else if (/\b(?:ml|milliliter|millilitre|milliliters|millilitres)\b/.test(text)) unit = "ml";
  else if (/packet|packets|pcs|pieces|piece|pkt\b/.test(text)) unit = "packet";

  const normalized =
    unit === "kg" ? number * 1000 : unit === "g" ? number : unit === "l" ? number * 1000 : unit === "ml" ? number : number;
  return { unit, normalized, number, original: text };
};

const computeQuantitySummary = (items: any[]) => {
  const parsed = items.map((item) => parseQuantityValue(item.weight || item.quantity || ""));
  const normalizedSum = parsed.reduce((sum, item) => sum + item.normalized, 0);
  const display = normalizedSum >= 1000 ? `${(normalizedSum / 1000).toFixed(2)}kg` : `${normalizedSum}g`;
  return { normalizedSum, display };
};

const AddProduct = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const editItem = route.params?.editItem;
  const initialTab = route.params?.initialTab || (editItem?.type === "combo" || editItem?.comboItems ? "combo" : "single");

  const [activeTab, setActiveTab] = useState<"single" | "combo">(initialTab);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [existingProducts, setExistingProducts] = useState<any[]>([]);
  const [franchiseId, setFranchiseId] = useState<any>(null);
  const [franchiseUserId, setFranchiseUserId] = useState<any>(null);

  // Category Picker Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);

  // Date Picker Modal state
  const [datePickerConfig, setDatePickerConfig] = useState<{
    visible: boolean;
    title: string;
    targetField: "mfg" | "exp";
    isSingle: boolean;
    initialDate: string;
  }>({
    visible: false,
    title: "",
    targetField: "mfg",
    isSingle: true,
    initialDate: "",
  });

  // Product Selection Modal for Combo Items
  const [comboItemIndexForPicker, setComboItemIndexForPicker] = useState<number | null>(null);

  // Feedback Dialog
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

  const [errorMessage, setErrorMessage] = useState("");

  // --------------------------------------------------
  // SINGLE PRODUCT FORM STATE
  // --------------------------------------------------
  const [singleForm, setSingleForm] = useState({
    productId: "",
    name: "",
    description: "",
    category: "",
    status: "Active",
    manufactureDate: "",
    expiryDate: "",
    totalStock: "0",
    totalWeight: 0,
    barcodeValue: "",
    images: [] as string[],
    healthBenefits: [""] as string[],
    variants: [
      { weight: "250g", mrp: "", offerPercent: "", offerPrice: "" },
    ],
  });
  const [singleManualWeight, setSingleManualWeight] = useState(false);

  // --------------------------------------------------
  // COMBO PACK FORM STATE
  // --------------------------------------------------
  const [comboForm, setComboForm] = useState({
    productId: "",
    name: "",
    description: "",
    category: "Combo Packs",
    status: "Active",
    manufactureDate: "",
    expiryDate: "",
    totalStock: "0",
    totalWeight: 0,
    barcodeValue: "",
    images: [] as string[],
    healthBenefits: [""] as string[],
    comboItems: [{ name: "", weight: "", image: "" }],
    comboDetails: { mrp: "", offerPercent: "", offerPrice: "", totalWeight: 0 },
  });
  const [comboManualWeight, setComboManualWeight] = useState(false);
  const [comboManualStock, setComboManualStock] = useState(false);

  // --------------------------------------------------
  // LOAD USER PROFILE & CATEGORIES & PRODUCTS
  // --------------------------------------------------
  useEffect(() => {
    const initData = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const fUserId = user?.franchise_user_id || user?.user_id || user?.id;
          const fId = user?.franchise_id || user?.id;
          setFranchiseUserId(fUserId);
          setFranchiseId(fId);

          const [catRes, prodRes] = await Promise.allSettled([
            get<any[]>(`/categories?franchise_user_id=${fUserId}`),
            get<any[]>("/franchise-products"),
          ]);

          if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
            setCategories(catRes.value);
          }
          if (prodRes.status === "fulfilled" && Array.isArray(prodRes.value)) {
            setExistingProducts(prodRes.value);
          }
        }
      } catch (e) {
        console.log("AddProduct init error:", e);
      }
    };
    initData();
  }, []);

  // --------------------------------------------------
  // POPULATE EDIT ITEM OR GENERATE NEW ID
  // --------------------------------------------------
  useEffect(() => {
    if (editItem) {
      const isCombo = editItem.type === "combo" || editItem.comboItems;
      if (isCombo) {
        setActiveTab("combo");
        const parsedDetails =
          typeof editItem.comboDetails === "string"
            ? JSON.parse(editItem.comboDetails || "{}")
            : editItem.comboDetails || {};

        setComboForm({
          productId: editItem.productId || `KPR${Math.floor(100 + Math.random() * 900)}`,
          name: editItem.name || "",
          description: editItem.description || "",
          category: editItem.category || "Combo Packs",
          status: editItem.status || "Active",
          manufactureDate: editItem.manufactureDate || editItem.mfg_date || "",
          expiryDate: editItem.expiryDate || editItem.exp_date || "",
          totalStock: String(editItem.total_stock || editItem.stock || "0"),
          totalWeight: Number(parsedDetails.totalWeight || editItem.totalWeight || 0),
          barcodeValue: editItem.barcodeValue || editItem.productId || "",
          images: parseJsonSafely(editItem.images),
          healthBenefits: parseJsonSafely(editItem.healthBenefits).length
            ? parseJsonSafely(editItem.healthBenefits)
            : [""],
          comboItems: parseJsonSafely(editItem.comboItems).length
            ? parseJsonSafely(editItem.comboItems)
            : [{ name: "", weight: "", image: "" }],
          comboDetails: {
            mrp: String(parsedDetails.mrp || editItem.mrp || ""),
            offerPercent: String(parsedDetails.offerPercent || editItem.offer || ""),
            offerPrice: String(parsedDetails.offerPrice || editItem.offer_price || ""),
            totalWeight: Number(parsedDetails.totalWeight || 0),
          },
        });
      } else {
        setActiveTab("single");
        const parsedVariants = parseJsonSafely(editItem.variants);
        setSingleForm({
          productId: editItem.productId || `PR${Math.floor(100 + Math.random() * 900)}`,
          name: editItem.name || "",
          description: editItem.description || "",
          category: editItem.category || "",
          status: editItem.status || "Active",
          manufactureDate: editItem.manufactureDate || editItem.mfg_date || "",
          expiryDate: editItem.expiryDate || editItem.exp_date || "",
          totalStock: String(editItem.total_stock || editItem.stock || "0"),
          totalWeight: Number(editItem.totalWeight || 0),
          barcodeValue: editItem.barcodeValue || editItem.productId || "",
          images: parseJsonSafely(editItem.images),
          healthBenefits: parseJsonSafely(editItem.healthBenefits).length
            ? parseJsonSafely(editItem.healthBenefits)
            : [""],
          variants: parsedVariants.length
            ? parsedVariants
            : [{ weight: "250g", mrp: String(editItem.mrp || ""), offerPercent: "", offerPrice: String(editItem.offer_price || "") }],
        });
      }
    } else {
      // Generate default ID
      const randomNum = Math.floor(100 + Math.random() * 900);
      setSingleForm((prev) => ({
        ...prev,
        productId: `PR${randomNum}`,
      }));
      setComboForm((prev) => ({
        ...prev,
        productId: `KPR${randomNum}`,
      }));
    }
  }, [editItem]);

  // --------------------------------------------------
  // AUTO-SUM CALCULATIONS FOR SINGLE FORM
  // --------------------------------------------------
  const singleSummary = useMemo(
    () => computeQuantitySummary(singleForm.variants),
    [singleForm.variants]
  );

  useEffect(() => {
    if (!singleManualWeight) {
      setSingleForm((prev) => ({
        ...prev,
        totalStock: String(singleSummary.normalizedSum),
        totalWeight: singleSummary.normalizedSum,
      }));
    }
  }, [singleSummary, singleManualWeight]);

  // --------------------------------------------------
  // AUTO-SUM CALCULATIONS FOR COMBO FORM
  // --------------------------------------------------
  const comboSummary = useMemo(
    () => computeQuantitySummary(comboForm.comboItems),
    [comboForm.comboItems]
  );

  useEffect(() => {
    if (!comboManualWeight) {
      setComboForm((prev) => ({
        ...prev,
        totalWeight: comboSummary.normalizedSum,
        comboDetails: {
          ...prev.comboDetails,
          totalWeight: comboSummary.normalizedSum,
        },
        totalStock: comboManualStock ? prev.totalStock : String(comboSummary.normalizedSum),
      }));
    }
  }, [comboSummary, comboManualWeight, comboManualStock]);

  // --------------------------------------------------
  // DATE PICKER HANDLER
  // --------------------------------------------------
  const openDatePicker = (
    field: "mfg" | "exp",
    isSingle: boolean,
    title: string
  ) => {
    const initialDate = isSingle
      ? field === "mfg"
        ? singleForm.manufactureDate
        : singleForm.expiryDate
      : field === "mfg"
      ? comboForm.manufactureDate
      : comboForm.expiryDate;

    setDatePickerConfig({
      visible: true,
      title,
      targetField: field,
      isSingle,
      initialDate,
    });
  };

  const handleDateSelected = (selectedDateStr: string) => {
    const { targetField, isSingle } = datePickerConfig;
    if (isSingle) {
      if (targetField === "mfg") {
        setSingleForm((prev) => ({ ...prev, manufactureDate: selectedDateStr }));
      } else {
        setSingleForm((prev) => ({ ...prev, expiryDate: selectedDateStr }));
      }
    } else {
      if (targetField === "mfg") {
        setComboForm((prev) => ({ ...prev, manufactureDate: selectedDateStr }));
      } else {
        setComboForm((prev) => ({ ...prev, expiryDate: selectedDateStr }));
      }
    }
  };

  // --------------------------------------------------
  // IMAGE PICKER
  // --------------------------------------------------
  const handlePickImages = (isSingle: boolean) => {
    launchImageLibrary(
      {
        mediaType: "photo",
        selectionLimit: 5,
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.assets) {
          const base64List = response.assets
            .filter((item) => item.base64)
            .map((item) => `data:${item.type || "image/jpeg"};base64,${item.base64}`);

          if (isSingle) {
            setSingleForm((prev) => ({
              ...prev,
              images: [...prev.images, ...base64List],
            }));
          } else {
            setComboForm((prev) => ({
              ...prev,
              images: [...prev.images, ...base64List],
            }));
          }
        }
      }
    );
  };

  // --------------------------------------------------
  // SUBMIT SINGLE PRODUCT
  // --------------------------------------------------
  const handleSubmitSingle = async () => {
    setErrorMessage("");
    if (!singleForm.name.trim()) {
      setErrorMessage("Product title is required.");
      return;
    }
    if (!singleForm.category.trim()) {
      setErrorMessage("Category selection is required.");
      return;
    }

    const validVariants = singleForm.variants.filter((v) => Number(v.mrp) > 0);
    if (validVariants.length === 0) {
      setErrorMessage("Please enter MRP for at least one sales variant.");
      return;
    }

    setLoading(true);
    try {
      const computedMrp = Number(validVariants[0].mrp);
      const computedOfferPercent = Number(validVariants[0].offerPercent || 0);
      const computedOfferPrice = Number(
        validVariants[0].offerPrice ||
          (computedOfferPercent > 0
            ? Math.round(computedMrp - (computedMrp * computedOfferPercent) / 100)
            : computedMrp)
      );

      const payload = {
        ...singleForm,
        mrp: computedMrp,
        offer: computedOfferPercent,
        offer_price: computedOfferPrice,
        total_stock: Number(singleForm.totalStock || 0),
        franchise_id: franchiseId,
        franchise_user_id: franchiseUserId,
        type: "single",
      };

      if (editItem) {
        await put(`/franchise-products/${editItem.id}`, payload);
      } else {
        await post("/franchise-products", payload);
      }

      setFeedbackDialog({
        visible: true,
        title: editItem ? "Product Updated" : "Product Created",
        message: `${singleForm.name} has been successfully saved to your catalog.`,
        onSuccessGoBack: true,
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // SUBMIT COMBO PACK
  // --------------------------------------------------
  const handleSubmitCombo = async () => {
    setErrorMessage("");
    if (!comboForm.name.trim()) {
      setErrorMessage("Combo pack name is required.");
      return;
    }
    if (!comboForm.comboDetails.mrp || Number(comboForm.comboDetails.mrp) <= 0) {
      setErrorMessage("Market MRP is required for the combo pack.");
      return;
    }

    setLoading(true);
    try {
      const mrpValue = Number(comboForm.comboDetails.mrp);
      const offerPercent = Number(comboForm.comboDetails.offerPercent || 0);
      const offerPrice = Number(
        comboForm.comboDetails.offerPrice ||
          (offerPercent > 0 ? Math.round(mrpValue - (mrpValue * offerPercent) / 100) : mrpValue)
      );

      const payload = {
        ...comboForm,
        mrp: mrpValue,
        offer: offerPercent,
        offer_price: offerPrice,
        total_stock: Number(comboForm.totalStock || 0),
        comboDetails: {
          ...comboForm.comboDetails,
          totalWeight: comboForm.totalWeight,
          mrp: mrpValue,
          offerPercent,
          offerPrice,
        },
        franchise_id: franchiseId,
        franchise_user_id: franchiseUserId,
        type: "combo",
      };

      if (editItem) {
        await put(`/combos/${editItem.id}`, payload);
      } else {
        await post("/combos", payload);
      }

      setFeedbackDialog({
        visible: true,
        title: editItem ? "Combo Updated" : "Combo Pack Created",
        message: `${comboForm.name} has been successfully saved.`,
        onSuccessGoBack: true,
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to save combo pack.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader
        title={editItem ? "Edit Product Studio" : "Product Studio"}
        navigation={navigation}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 60,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================= TAB SELECTOR ================= */}
          <View className="px-4 mb-6">
            <View className="flex-row bg-slate-900 border border-white/10 rounded-2xl p-1.5">
              <TouchableOpacity
                onPress={() => {
                  setActiveTab("single");
                  setErrorMessage("");
                }}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                  activeTab === "single"
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : ""
                }`}
              >
                <Package
                  size={16}
                  color={activeTab === "single" ? "#34d399" : "#64748b"}
                />
                <Text
                  className={`ml-2 text-xs font-black uppercase tracking-wider ${
                    activeTab === "single" ? "text-emerald-300" : "text-slate-400"
                  }`}
                >
                  Single Product
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab("combo");
                  setErrorMessage("");
                }}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                  activeTab === "combo"
                    ? "bg-amber-500/20 border border-amber-500/40"
                    : ""
                }`}
              >
                <Layers
                  size={16}
                  color={activeTab === "combo" ? "#fbbf24" : "#64748b"}
                />
                <Text
                  className={`ml-2 text-xs font-black uppercase tracking-wider ${
                    activeTab === "combo" ? "text-amber-300" : "text-slate-400"
                  }`}
                >
                  Combo Pack
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================= ERROR BANNER ================= */}
          {errorMessage ? (
            <View className="mx-4 mb-5 bg-red-500/15 border border-red-500/30 rounded-2xl p-3.5 flex-row items-center">
              <AlertTriangle size={18} color="#f87171" />
              <Text className="text-red-400 text-xs font-bold ml-2.5 flex-1">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* ================================================= */}
          {/* SINGLE PRODUCT FORM */}
          {/* ================================================= */}
          {activeTab === "single" ? (
            <View className="px-4 space-y-4">
              {/* Identity & Basic Info */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-6 bg-emerald-500 rounded-full mr-2.5" />
                    <Text className="text-white text-base font-black uppercase">
                      Identity & Details
                    </Text>
                  </View>
                  <View className="bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl">
                    <Text className="text-emerald-400 font-mono font-bold text-xs">
                      {singleForm.productId}
                    </Text>
                  </View>
                </View>

                {/* Product Title */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Product Title *
                  </Text>
                  <TextInput
                    value={singleForm.name}
                    onChangeText={(text) =>
                      setSingleForm({ ...singleForm, name: text })
                    }
                    placeholder="e.g. Premium Roasted Almonds"
                    placeholderTextColor="#64748b"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold"
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Composition / Description *
                  </Text>
                  <TextInput
                    value={singleForm.description}
                    onChangeText={(text) =>
                      setSingleForm({ ...singleForm, description: text })
                    }
                    placeholder="Describe quality, origin, benefits..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={3}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs leading-5"
                  />
                </View>

                {/* Category & Status Row */}
                <View className="flex-row gap-3 mb-4">
                  {/* Category Picker Trigger */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Category *
                    </Text>
                    <TouchableOpacity
                      onPress={() => setIsCatModalOpen(true)}
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                    >
                      <Text
                        className={`text-xs font-bold ${
                          singleForm.category ? "text-emerald-400" : "text-slate-500"
                        }`}
                        numberOfLines={1}
                      >
                        {singleForm.category || "Select Category"}
                      </Text>
                      <ChevronDown size={14} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  {/* Status Toggle */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Status *
                    </Text>
                    <View className="flex-row bg-slate-950 border border-slate-800 rounded-2xl p-1">
                      {["Active", "Inactive"].map((st) => {
                        const isSel = singleForm.status === st;
                        return (
                          <TouchableOpacity
                            key={st}
                            onPress={() =>
                              setSingleForm({ ...singleForm, status: st })
                            }
                            className={`flex-1 py-2.5 rounded-xl items-center ${
                              isSel
                                ? st === "Active"
                                  ? "bg-emerald-500/20"
                                  : "bg-red-500/20"
                                : ""
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-black uppercase ${
                                isSel
                                  ? st === "Active"
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                  : "text-slate-500"
                              }`}
                            >
                              {st}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                {/* Manufacture & Expiry Dates with DatePicker Modal Trigger */}
                <View className="flex-row gap-3 mb-4">
                  {/* Manufacture Date */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Manufacture Date
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        openDatePicker(
                          "mfg",
                          true,
                          "Select Manufacture Date"
                        )
                      }
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 mr-1">
                        <CalendarIcon size={14} color="#34d399" />
                        <Text
                          className={`ml-2 text-xs font-mono font-bold ${
                            singleForm.manufactureDate
                              ? "text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {singleForm.manufactureDate || "YYYY-MM-DD"}
                        </Text>
                      </View>
                      {singleForm.manufactureDate ? (
                        <TouchableOpacity
                          onPress={() =>
                            setSingleForm((prev) => ({
                              ...prev,
                              manufactureDate: "",
                            }))
                          }
                          className="p-1"
                        >
                          <X size={12} color="#94a3b8" />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  </View>

                  {/* Expiry Date */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Expiry Date
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        openDatePicker(
                          "exp",
                          true,
                          "Select Expiry Date"
                        )
                      }
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 mr-1">
                        <CalendarIcon size={14} color="#f59e0b" />
                        <Text
                          className={`ml-2 text-xs font-mono font-bold ${
                            singleForm.expiryDate
                              ? "text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {singleForm.expiryDate || "YYYY-MM-DD"}
                        </Text>
                      </View>
                      {singleForm.expiryDate ? (
                        <TouchableOpacity
                          onPress={() =>
                            setSingleForm((prev) => ({
                              ...prev,
                              expiryDate: "",
                            }))
                          }
                          className="p-1"
                        >
                          <X size={12} color="#94a3b8" />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Total Quantity / Weight Sync */}
                <View>
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      Total Quantity / Stock
                    </Text>
                    <Text
                      className={`text-[9px] font-black uppercase ${
                        singleManualWeight ? "text-amber-400" : "text-emerald-400"
                      }`}
                    >
                      {singleManualWeight ? "Manual Override" : "Auto-Calculated"}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      keyboardType="numeric"
                      value={String(singleForm.totalStock)}
                      onChangeText={(text) => {
                        setSingleManualWeight(true);
                        setSingleForm({
                          ...singleForm,
                          totalStock: text,
                          totalWeight: Number(text) || 0,
                        });
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm font-bold"
                    />
                    {singleManualWeight && (
                      <TouchableOpacity
                        onPress={() => setSingleManualWeight(false)}
                        className="bg-slate-800 border border-white/10 w-11 h-11 rounded-2xl items-center justify-center"
                      >
                        <RotateCcw size={16} color="#34d399" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text className="text-slate-500 text-[10px] mt-1">
                    {singleManualWeight
                      ? "Type to override • tap ↺ to auto-sync from variants"
                      : `Auto-summed from sales variants (${singleSummary.display})`}
                  </Text>
                </View>
              </View>

              {/* ================= SALES VARIANTS ================= */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-6 bg-orange-500 rounded-full mr-2.5" />
                    <Text className="text-white text-base font-black uppercase">
                      Sales Variants
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setSingleForm((prev) => ({
                        ...prev,
                        variants: [
                          ...prev.variants,
                          { weight: "", mrp: "", offerPercent: "", offerPrice: "" },
                        ],
                      }))
                    }
                    className="bg-emerald-600 px-3 py-1.5 rounded-xl flex-row items-center"
                  >
                    <Plus size={13} color="#fff" />
                    <Text className="text-white font-bold text-[10px] uppercase ml-1">
                      Add Variant
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Variants List */}
                {singleForm.variants.map((v, i) => (
                  <View
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-3"
                  >
                    <View className="flex-row justify-between items-center mb-2.5">
                      <Text className="text-emerald-400 font-bold text-xs">
                        Variant #{i + 1}
                      </Text>
                      {singleForm.variants.length > 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            setSingleForm((prev) => ({
                              ...prev,
                              variants: prev.variants.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="p-1 rounded-lg bg-red-500/10"
                        >
                          <Trash2 size={13} color="#f87171" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View className="flex-row gap-2 mb-2">
                      {/* Weight */}
                      <View className="flex-1">
                        <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">
                          Weight / Size
                        </Text>
                        <TextInput
                          value={v.weight}
                          onChangeText={(text) => {
                            const updated = [...singleForm.variants];
                            updated[i].weight = text;
                            setSingleForm({ ...singleForm, variants: updated });
                          }}
                          placeholder="e.g. 250g / 1kg"
                          placeholderTextColor="#64748b"
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold"
                        />
                      </View>

                      {/* MRP */}
                      <View className="flex-1">
                        <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">
                          MRP (₹) *
                        </Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(v.mrp || "")}
                          onChangeText={(text) => {
                            const updated = [...singleForm.variants];
                            updated[i].mrp = text;
                            const mrpNum = Number(text) || 0;
                            const offNum = Number(updated[i].offerPercent) || 0;
                            updated[i].offerPrice = String(
                              offNum > 0 ? Math.round(mrpNum - (mrpNum * offNum) / 100) : mrpNum
                            );
                            setSingleForm({ ...singleForm, variants: updated });
                          }}
                          placeholder="500"
                          placeholderTextColor="#64748b"
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 text-xs font-bold"
                        />
                      </View>
                    </View>

                    <View className="flex-row gap-2 items-center">
                      {/* Discount % */}
                      <View className="flex-1">
                        <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">
                          Discount %
                        </Text>
                        <TextInput
                          keyboardType="numeric"
                          value={String(v.offerPercent || "")}
                          onChangeText={(text) => {
                            const updated = [...singleForm.variants];
                            updated[i].offerPercent = text;
                            const mrpNum = Number(updated[i].mrp) || 0;
                            const offNum = Number(text) || 0;
                            updated[i].offerPrice = String(
                              offNum > 0 ? Math.round(mrpNum - (mrpNum * offNum) / 100) : mrpNum
                            );
                            setSingleForm({ ...singleForm, variants: updated });
                          }}
                          placeholder="10"
                          placeholderTextColor="#64748b"
                          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-orange-400 text-xs font-bold"
                        />
                      </View>

                      {/* Final Price */}
                      <View className="flex-1">
                        <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">
                          Final Price (₹)
                        </Text>
                        <View className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3 py-2 items-center justify-center">
                          <Text className="text-emerald-400 text-xs font-black">
                            ₹{v.offerPrice || v.mrp || 0}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* ================= VISUAL ASSETS ================= */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-6 bg-blue-500 rounded-full mr-2.5" />
                    <Text className="text-white text-base font-black uppercase">
                      Visual Assets
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handlePickImages(true)}
                    className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center"
                  >
                    <Plus size={13} color="#fff" />
                    <Text className="text-white font-bold text-[10px] uppercase ml-1">
                      Upload Photos
                    </Text>
                  </TouchableOpacity>
                </View>

                {singleForm.images.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {singleForm.images.map((img, i) => (
                      <View
                        key={i}
                        className="relative w-24 h-24 rounded-2xl overflow-hidden mr-3 border border-slate-800"
                      >
                        <Image
                          source={{ uri: img }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setSingleForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="absolute right-1 top-1 bg-red-600/90 rounded-lg p-1.5"
                        >
                          <Trash2 size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <TouchableOpacity
                    onPress={() => handlePickImages(true)}
                    className="border-2 border-dashed border-slate-800 rounded-2xl p-6 items-center justify-center bg-slate-950"
                  >
                    <ImageIcon size={28} color="#64748b" />
                    <Text className="text-slate-400 text-xs font-bold mt-2">
                      Tap to select product images
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ================= HEALTH ANALYSIS POINTS ================= */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-6 bg-emerald-500 rounded-full mr-2.5" />
                    <Text className="text-white text-base font-black uppercase">
                      Health Analysis Points
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      setSingleForm((prev) => ({
                        ...prev,
                        healthBenefits: [...prev.healthBenefits, ""],
                      }))
                    }
                    className="bg-emerald-600 px-3 py-1.5 rounded-xl flex-row items-center"
                  >
                    <Plus size={13} color="#fff" />
                    <Text className="text-white font-bold text-[10px] uppercase ml-1">
                      Add Point
                    </Text>
                  </TouchableOpacity>
                </View>

                {singleForm.healthBenefits.map((benefit, idx) => (
                  <View key={idx} className="flex-row items-center gap-2 mb-2.5">
                    <TextInput
                      value={benefit}
                      onChangeText={(text) => {
                        const updated = [...singleForm.healthBenefits];
                        updated[idx] = text;
                        setSingleForm({ ...singleForm, healthBenefits: updated });
                      }}
                      placeholder="e.g. Rich in Omega-3 Fatty Acids"
                      placeholderTextColor="#64748b"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-xs font-semibold"
                    />
                    {singleForm.healthBenefits.length > 1 && (
                      <TouchableOpacity
                        onPress={() =>
                          setSingleForm((prev) => ({
                            ...prev,
                            healthBenefits: prev.healthBenefits.filter(
                              (_, i) => i !== idx
                            ),
                          }))
                        }
                        className="bg-red-500/10 p-2.5 rounded-xl"
                      >
                        <Trash2 size={14} color="#f87171" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* Submit Single Button */}
              <TouchableOpacity
                disabled={loading}
                onPress={handleSubmitSingle}
                className="bg-emerald-600 rounded-2xl py-4 items-center shadow-lg mb-8"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    {editItem ? "Update Product Details" : "Save Product Details"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ================================================= */
            /* COMBO PACK FORM */
            /* ================================================= */
            <View className="px-4 space-y-4">
              {/* Pack Identity */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-6 bg-amber-500 rounded-full mr-2.5" />
                    <Text className="text-white text-base font-black uppercase">
                      Pack Identity & Scope
                    </Text>
                  </View>
                  <View className="bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-xl">
                    <Text className="text-amber-400 font-mono font-bold text-xs">
                      {comboForm.productId}
                    </Text>
                  </View>
                </View>

                {/* Combo Name */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Combo Pack Name *
                  </Text>
                  <TextInput
                    value={comboForm.name}
                    onChangeText={(text) =>
                      setComboForm({ ...comboForm, name: text })
                    }
                    placeholder="e.g. Healthy Morning Combo Pack"
                    placeholderTextColor="#64748b"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold"
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Description *
                  </Text>
                  <TextInput
                    value={comboForm.description}
                    onChangeText={(text) =>
                      setComboForm({ ...comboForm, description: text })
                    }
                    placeholder="Describe pack contents and specialties..."
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={3}
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs leading-5"
                  />
                </View>

                {/* Status Row */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Status *
                    </Text>
                    <View className="flex-row bg-slate-950 border border-slate-800 rounded-2xl p-1">
                      {["Active", "Inactive"].map((st) => {
                        const isSel = comboForm.status === st;
                        return (
                          <TouchableOpacity
                            key={st}
                            onPress={() =>
                              setComboForm({ ...comboForm, status: st })
                            }
                            className={`flex-1 py-2.5 rounded-xl items-center ${
                              isSel
                                ? st === "Active"
                                  ? "bg-emerald-500/20"
                                  : "bg-red-500/20"
                                : ""
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-black uppercase ${
                                isSel
                                  ? st === "Active"
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                  : "text-slate-500"
                              }`}
                            >
                              {st}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Pack Items Count
                    </Text>
                    <View className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 items-center justify-center">
                      <Text className="text-amber-400 text-sm font-black">
                        {comboForm.comboItems.length} Item(s)
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Dates with DatePicker Modal Trigger */}
                <View className="flex-row gap-3 mb-4">
                  {/* Manufacture Date */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Manufacture Date
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        openDatePicker(
                          "mfg",
                          false,
                          "Select Combo Manufacture Date"
                        )
                      }
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 mr-1">
                        <CalendarIcon size={14} color="#fbbf24" />
                        <Text
                          className={`ml-2 text-xs font-mono font-bold ${
                            comboForm.manufactureDate
                              ? "text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {comboForm.manufactureDate || "YYYY-MM-DD"}
                        </Text>
                      </View>
                      {comboForm.manufactureDate ? (
                        <TouchableOpacity
                          onPress={() =>
                            setComboForm((prev) => ({
                              ...prev,
                              manufactureDate: "",
                            }))
                          }
                          className="p-1"
                        >
                          <X size={12} color="#94a3b8" />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  </View>

                  {/* Expiry Date */}
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Expiry Date
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        openDatePicker(
                          "exp",
                          false,
                          "Select Combo Expiry Date"
                        )
                      }
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 mr-1">
                        <CalendarIcon size={14} color="#f59e0b" />
                        <Text
                          className={`ml-2 text-xs font-mono font-bold ${
                            comboForm.expiryDate
                              ? "text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {comboForm.expiryDate || "YYYY-MM-DD"}
                        </Text>
                      </View>
                      {comboForm.expiryDate ? (
                        <TouchableOpacity
                          onPress={() =>
                            setComboForm((prev) => ({
                              ...prev,
                              expiryDate: "",
                            }))
                          }
                          className="p-1"
                        >
                          <X size={12} color="#94a3b8" />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Included Combo Items Range */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-6 bg-blue-500 rounded-full mr-2.5" />
                    <Text className="text-white text-base font-black uppercase">
                      Included Range
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setComboForm((prev) => ({
                        ...prev,
                        comboItems: [
                          ...prev.comboItems,
                          { name: "", weight: "", image: "" },
                        ],
                      }))
                    }
                    className="bg-blue-600 px-3 py-1.5 rounded-xl flex-row items-center"
                  >
                    <Plus size={13} color="#fff" />
                    <Text className="text-white font-bold text-[10px] uppercase ml-1">
                      Add Item
                    </Text>
                  </TouchableOpacity>
                </View>

                {comboForm.comboItems.map((item, i) => (
                  <View
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-3"
                  >
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-amber-400 font-bold text-xs">
                        Item #{i + 1}
                      </Text>
                      {comboForm.comboItems.length > 1 && (
                        <TouchableOpacity
                          onPress={() =>
                            setComboForm((prev) => ({
                              ...prev,
                              comboItems: prev.comboItems.filter(
                                (_, idx) => idx !== i
                              ),
                            }))
                          }
                          className="p-1 rounded-lg bg-red-500/10"
                        >
                          <Trash2 size={13} color="#f87171" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Choose from existing product button */}
                    <TouchableOpacity
                      onPress={() => setComboItemIndexForPicker(i)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 mb-2.5 flex-row items-center justify-between"
                    >
                      <Text
                        className={`text-xs font-bold ${
                          item.name ? "text-white" : "text-slate-500"
                        }`}
                        numberOfLines={1}
                      >
                        {item.name || "Select from catalog products"}
                      </Text>
                      <ChevronDown size={14} color="#64748b" />
                    </TouchableOpacity>

                    {/* Weight Input */}
                    <View>
                      <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">
                        Weight / Quantity
                      </Text>
                      <TextInput
                        value={item.weight}
                        onChangeText={(text) => {
                          const updated = [...comboForm.comboItems];
                          updated[i].weight = text;
                          setComboForm({ ...comboForm, comboItems: updated });
                        }}
                        placeholder="e.g. 250g / 1L / 2pcs"
                        placeholderTextColor="#64748b"
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold"
                      />
                    </View>
                  </View>
                ))}
              </View>

              {/* Financial Summary & Pricing */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-4">
                <View className="flex-row items-center mb-4">
                  <View className="w-2.5 h-6 bg-amber-500 rounded-full mr-2.5" />
                  <Text className="text-white text-base font-black uppercase">
                    Financial Summary & Stock
                  </Text>
                </View>

                {/* Stock Level */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                    Inventory Stock Level *
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={String(comboForm.totalStock)}
                    onChangeText={(text) => {
                      setComboManualStock(true);
                      setComboForm({ ...comboForm, totalStock: text });
                    }}
                    placeholder="e.g. 50"
                    placeholderTextColor="#64748b"
                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold"
                  />
                </View>

                {/* MRP & Discount */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Market MRP (₹) *
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={String(comboForm.comboDetails.mrp || "")}
                      onChangeText={(text) => {
                        const updated = { ...comboForm.comboDetails, mrp: text };
                        const mrpNum = Number(text) || 0;
                        const offNum = Number(updated.offerPercent) || 0;
                        updated.offerPrice = String(
                          offNum > 0 ? Math.round(mrpNum - (mrpNum * offNum) / 100) : mrpNum
                        );
                        setComboForm({ ...comboForm, comboDetails: updated });
                      }}
                      placeholder="e.g. 1500"
                      placeholderTextColor="#64748b"
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-sm font-bold"
                    />
                  </View>

                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                      Discount %
                    </Text>
                    <TextInput
                      keyboardType="numeric"
                      value={String(comboForm.comboDetails.offerPercent || "")}
                      onChangeText={(text) => {
                        const updated = { ...comboForm.comboDetails, offerPercent: text };
                        const mrpNum = Number(updated.mrp) || 0;
                        const offNum = Number(text) || 0;
                        updated.offerPrice = String(
                          offNum > 0 ? Math.round(mrpNum - (mrpNum * offNum) / 100) : mrpNum
                        );
                        setComboForm({ ...comboForm, comboDetails: updated });
                      }}
                      placeholder="e.g. 15"
                      placeholderTextColor="#64748b"
                      className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-orange-400 text-sm font-bold"
                    />
                  </View>
                </View>

                {/* Final Price Card */}
                <View className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 flex-row items-center justify-between">
                  <View>
                    <Text className="text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      Premium Strategy Price
                    </Text>
                    <Text className="text-amber-400 text-2xl font-black mt-0.5">
                      ₹{comboForm.comboDetails.offerPrice || comboForm.comboDetails.mrp || 0}
                    </Text>
                  </View>
                  <Tag size={24} color="#fbbf24" />
                </View>
              </View>

              {/* Pack Photography */}
              <View className="bg-slate-900 border border-white/10 rounded-3xl p-5 mb-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-2.5 h-6 bg-orange-500 rounded-full mr-2.5" />
                    <Text className="text-white text-base font-black uppercase">
                      Pack Photography
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handlePickImages(false)}
                    className="bg-orange-600 px-3 py-1.5 rounded-xl flex-row items-center"
                  >
                    <Plus size={13} color="#fff" />
                    <Text className="text-white font-bold text-[10px] uppercase ml-1">
                      Upload
                    </Text>
                  </TouchableOpacity>
                </View>

                {comboForm.images.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {comboForm.images.map((img, i) => (
                      <View
                        key={i}
                        className="relative w-24 h-24 rounded-2xl overflow-hidden mr-3 border border-slate-800"
                      >
                        <Image
                          source={{ uri: img }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setComboForm((prev) => ({
                              ...prev,
                              images: prev.images.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="absolute right-1 top-1 bg-red-600/90 rounded-lg p-1.5"
                        >
                          <Trash2 size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <TouchableOpacity
                    onPress={() => handlePickImages(false)}
                    className="border-2 border-dashed border-slate-800 rounded-2xl p-6 items-center justify-center bg-slate-950"
                  >
                    <ImageIcon size={28} color="#64748b" />
                    <Text className="text-slate-400 text-xs font-bold mt-2">
                      Tap to select pack images
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Combo Button */}
              <TouchableOpacity
                disabled={loading}
                onPress={handleSubmitCombo}
                className="bg-amber-600 rounded-2xl py-4 items-center shadow-lg mb-8"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-sm uppercase tracking-wider">
                    {editItem ? "Update Premium Combo" : "Finalize Premium Combo"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ================================================= */}
      {/* DATE PICKER MODAL */}
      {/* ================================================= */}
      <DatePickerModal
        visible={datePickerConfig.visible}
        title={datePickerConfig.title}
        initialDate={datePickerConfig.initialDate}
        onClose={() =>
          setDatePickerConfig((prev) => ({ ...prev, visible: false }))
        }
        onSelectDate={handleDateSelected}
      />

      {/* ================================================= */}
      {/* CATEGORY PICKER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isCatModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsCatModalOpen(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[70%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-black">
                Select Product Category
              </Text>
              <TouchableOpacity
                onPress={() => setIsCatModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-2">
              {categories.map((c: any) => {
                const label = c.name || c.cname || c.catId || `Category ${c.id}`;
                const isSelected = singleForm.category === label;

                return (
                  <TouchableOpacity
                    key={c.id || label}
                    onPress={() => {
                      setSingleForm({ ...singleForm, category: label });
                      setIsCatModalOpen(false);
                    }}
                    className={`py-3.5 px-4 rounded-xl border flex-row items-center justify-between mb-2 ${
                      isSelected
                        ? "bg-emerald-500/15 border-emerald-500/40"
                        : "bg-slate-950 border-white/5"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold uppercase ${
                        isSelected ? "text-emerald-300" : "text-slate-300"
                      }`}
                    >
                      {label}
                    </Text>
                    {isSelected && <CheckCircle size={16} color="#34d399" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* COMBO ITEM PRODUCT PICKER MODAL */}
      {/* ================================================= */}
      <Modal
        visible={comboItemIndexForPicker !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setComboItemIndexForPicker(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[75%]"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-base font-black">
                Select Catalog Product
              </Text>
              <TouchableOpacity
                onPress={() => setComboItemIndexForPicker(null)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X size={17} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-2">
              {existingProducts.map((p: any) => {
                const variants = parseJsonSafely(p.variants);
                const images = parseJsonSafely(p.images);

                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      if (comboItemIndexForPicker !== null) {
                        const updated = [...comboForm.comboItems];
                        updated[comboItemIndexForPicker] = {
                          name: p.name,
                          weight: variants[0]?.weight || "Standard",
                          image: images[0] || "",
                        };
                        setComboForm({ ...comboForm, comboItems: updated });
                        setComboItemIndexForPicker(null);
                      }
                    }}
                    className="py-3 px-4 rounded-xl border border-white/5 bg-slate-950 flex-row items-center justify-between mb-2"
                  >
                    <View className="flex-1">
                      <Text className="text-white text-xs font-bold">
                        {p.name}
                      </Text>
                      <Text className="text-slate-400 text-[10px] mt-0.5">
                        {p.productId || `#${p.id}`} • {p.category || "General"}
                      </Text>
                    </View>
                    <Plus size={16} color="#34d399" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* FEEDBACK DIALOG */}
      {/* ================================================= */}
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

export default AddProduct;
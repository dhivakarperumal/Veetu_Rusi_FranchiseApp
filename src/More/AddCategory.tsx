import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  LayoutGrid,
  Plus,
  Trash2,
  ImageIcon,
  AlertTriangle,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";

import { post } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import CenteredDialog from "../components/CenteredDialog";

const AddCategory = () => {
  const navigation: any = useNavigation();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    catId: "",
    name: "",
    description: "",
  });
  const [images, setImages] = useState<string[]>([]);
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

  useEffect(() => {
    const random = "CAT" + Math.floor(100 + Math.random() * 900);
    setForm((prev) => ({
      ...prev,
      catId: random,
    }));
  }, []);

  const pickImages = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        selectionLimit: 5,
        includeBase64: true,
      },
      (response) => {
        if (response.didCancel) return;
        if (response.assets) {
          const base64Images = response.assets
            .filter((item) => item.base64)
            .map((item) => `data:${item.type || "image/jpeg"};base64,${item.base64}`);

          setImages((prev) => [...prev, ...base64Images]);
        }
      }
    );
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    if (!form.name.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }
    if (!form.description.trim()) {
      setErrorMessage("Category description is required.");
      return;
    }

    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      const franchiseUserId =
        user?.user_id || user?.id || user?.franchise_user_id;

      const payload = {
        catId: form.catId,
        name: form.name,
        description: form.description,
        images,
        franchise_user_id: franchiseUserId,
      };

      await post("/categories", payload);

      setFeedbackDialog({
        visible: true,
        title: "Category Created",
        message: `${form.name} was added to your categories.`,
        onSuccessGoBack: true,
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to create category.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Add Category" navigation={navigation} />

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
                New Category
              </Text>
              <Text className="text-slate-400 mt-1 text-xs">
                Create a category to group products & dishes
              </Text>
            </View>

            <View className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 items-center justify-center">
              <LayoutGrid size={20} color="#818cf8" />
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
            {/* Category ID */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Category Code
              </Text>
              <View className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between">
                <Text className="text-indigo-400 font-mono font-bold text-sm">
                  {form.catId}
                </Text>
                <Text className="text-slate-500 text-[10px] uppercase font-bold">
                  Auto-Assigned
                </Text>
              </View>
            </View>

            {/* Category Name */}
            <View className="mb-4">
              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Category Name *
              </Text>
              <TextInput
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
                placeholder="e.g. Traditional Sweets & Snacks"
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
                value={form.description}
                onChangeText={(text) =>
                  setForm({ ...form, description: text })
                }
                placeholder="Describe what items belong in this category..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={4}
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs leading-5"
              />
            </View>

            {/* Images */}
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  Category Photos
                </Text>
                <TouchableOpacity
                  onPress={pickImages}
                  className="bg-indigo-600 px-3 py-1.5 rounded-xl flex-row items-center"
                >
                  <Plus size={13} color="#fff" />
                  <Text className="text-white font-bold text-[10px] uppercase ml-1">
                    Add Photos
                  </Text>
                </TouchableOpacity>
              </View>

              {images.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((img, i) => (
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
                          setImages(images.filter((_, idx) => idx !== i))
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
                  onPress={pickImages}
                  className="border-2 border-dashed border-slate-800 rounded-2xl p-6 items-center justify-center bg-slate-950"
                >
                  <ImageIcon size={28} color="#64748b" />
                  <Text className="text-slate-400 text-xs font-bold mt-2">
                    Tap to upload category banner images
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            disabled={loading}
            onPress={handleSubmit}
            className="bg-emerald-600 rounded-2xl py-4 items-center shadow-lg"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-black text-sm uppercase tracking-wider">
                Create Category
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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

export default AddCategory;
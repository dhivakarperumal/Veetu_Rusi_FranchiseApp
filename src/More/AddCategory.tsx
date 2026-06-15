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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";
import { Image } from "react-native";

import { post } from "../services/api";

const AddCategory = () => {
    const navigation: any = useNavigation();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        catId: "",
        name: "",
        description: "",
    });

    const [images, setImages] = useState<string[]>([]);

    const pickImages = async () => {
        launchImageLibrary(
            {
                mediaType: "photo",
                selectionLimit: 5,
                includeBase64: true,
            },
            response => {
                if (response.didCancel) return;

                if (response.assets) {
                    const base64Images =
                        response.assets
                            .filter(item => item.base64)
                            .map(
                                item =>
                                    `data:${item.type};base64,${item.base64}`
                            );

                    setImages(base64Images);
                }
            }
        );
    };

    useEffect(() => {
        const generateId = () => {
            const random =
                "CAT" +
                Math.floor(
                    100 + Math.random() * 900
                );

            setForm(prev => ({
                ...prev,
                catId: random,
            }));
        };

        generateId();
    }, []);

    const handleSubmit = async () => {
        try {
            if (
                !form.name.trim() ||
                !form.description.trim()
            ) {
                Alert.alert(
                    "Validation",
                    "Please fill all fields"
                );
                return;
            }

            setLoading(true);

            const userData =
                await AsyncStorage.getItem(
                    "user"
                );

            const user = userData
                ? JSON.parse(userData)
                : null;

            const franchiseUserId =
                user?.user_id ||
                user?.id ||
                user?.franchise_user_id;

            const payload = {
                catId: form.catId,
                name: form.name,
                description: form.description,
                images,
                franchise_user_id: franchiseUserId,
            };

            await post(
                "/categories",
                payload
            );

            Alert.alert(
                "Success",
                "Category Created Successfully"
            );

            navigation.goBack();
        } catch (error: any) {
            console.log(error);

            Alert.alert(
                "Error",
                error.message ||
                "Failed To Create Category"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-100">
            <ScrollView
                showsVerticalScrollIndicator={false}
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
                        Add Category
                    </Text>
                </View>

                {/* Form */}

                <View className="px-4">
                    {/* Category ID */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Category ID
                        </Text>

                        <TextInput
                            editable={false}
                            value={form.catId}
                            className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-100"
                        />
                    </View>

                    {/* Name */}

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-2">
                            Category Name
                        </Text>

                        <TextInput
                            placeholder="Enter Category Name"
                            value={form.name}
                            onChangeText={(text) =>
                                setForm({
                                    ...form,
                                    name: text,
                                })
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
                            numberOfLines={5}
                            placeholder="Enter Description"
                            value={form.description}
                            onChangeText={(text) =>
                                setForm({
                                    ...form,
                                    description: text,
                                })
                            }
                            className="border border-slate-200 rounded-xl px-4 py-3"
                            textAlignVertical="top"
                        />
                    </View>

                    <View className="bg-white p-4 rounded-3xl mb-4">
                        <Text className="font-semibold mb-3">
                            Category Images
                        </Text>

                        <TouchableOpacity
                            onPress={pickImages}
                            className="bg-emerald-600 rounded-2xl py-3"
                        >
                            <Text className="text-center text-white font-bold">
                                Select Images
                            </Text>
                        </TouchableOpacity>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mt-4"
                        >
                            {images.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img }}
                                    className="w-24 h-24 rounded-2xl mr-3"
                                />
                            ))}
                        </ScrollView>
                    </View>

                    {/* Save */}

                    <TouchableOpacity
                        disabled={loading}
                        onPress={handleSubmit}
                        className="bg-emerald-600 rounded-2xl py-4 mt-2"
                    >
                        <Text className="text-center text-white text-lg font-bold">
                            {loading
                                ? "Saving..."
                                : "Save Category"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default AddCategory;
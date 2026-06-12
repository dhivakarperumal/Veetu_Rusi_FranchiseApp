import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { X } from "lucide-react-native";

import { post } from "../services/api";

const AddHomeChef = () => {
    const navigation = useNavigation<any>();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        mobile: "",
        email: "",
        kitchen_name: "",
        cuisine_type: "",
        city: "",
        password: "",
    });

    const saveChef = async () => {
        try {
            const payload = {
                first_name: form.first_name,
                last_name: form.last_name,
                mobile: form.mobile,
                email: form.email,
                password: form.password,
                kitchen_name: form.kitchen_name,
                cuisine_type: form.cuisine_type,
                city: form.city,
            };

            const response = await post(
                "/superadmin/homechefs",
                payload
            );

            console.log(response);

            Alert.alert(
                "Success",
                "Home Chef Created Successfully"
            );

            navigation.goBack();
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.message || "Failed to create chef"
            );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            {/* Header with Close Button */}
            <View className="flex-row justify-between items-center px-4 pt-4 pb-4 border-b border-slate-800">
                <Text className="text-white text-2xl font-bold">
                    Add Home Chef
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <ScrollView className="p-4">

                <TextInput
                    placeholder="First Name"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-4"
                    value={form.first_name}
                    onChangeText={(text) =>
                        setForm({ ...form, first_name: text })
                    }
                />

                <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-4"
                    value={form.last_name}
                    onChangeText={(text) =>
                        setForm({ ...form, last_name: text })
                    }
                />

                <TextInput
                    placeholder="Mobile"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-4"
                    value={form.mobile}
                    onChangeText={(text) =>
                        setForm({ ...form, mobile: text })
                    }
                />

                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-4"
                    value={form.email}
                    onChangeText={(text) =>
                        setForm({ ...form, email: text })
                    }
                />

                <TextInput
                    placeholder="Kitchen Name"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-4"
                    value={form.kitchen_name}
                    onChangeText={(text) =>
                        setForm({ ...form, kitchen_name: text })
                    }
                />

                <TextInput
                    placeholder="Cuisine Type"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-4"
                    value={form.cuisine_type}
                    onChangeText={(text) =>
                        setForm({ ...form, cuisine_type: text })
                    }
                />

                <TextInput
                    placeholder="City"
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-4"
                    value={form.city}
                    onChangeText={(text) =>
                        setForm({ ...form, city: text })
                    }
                />

                <TextInput
                    placeholder="Password"
                    secureTextEntry
                    placeholderTextColor="#94a3b8"
                    className="bg-slate-900 text-white rounded-xl p-4 mb-6"
                    value={form.password}
                    onChangeText={(text) =>
                        setForm({ ...form, password: text })
                    }
                />

                <TouchableOpacity
                    onPress={saveChef}
                    className="bg-emerald-600 rounded-xl p-4"
                >
                    <Text className="text-center text-white font-bold">
                        Save Home Chef
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

export default AddHomeChef;
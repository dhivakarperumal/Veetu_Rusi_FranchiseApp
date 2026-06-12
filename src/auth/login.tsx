import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ImageBackground,
    SafeAreaView,
    StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "../services/api";
import Ionicons from "react-native-vector-icons/Ionicons";

const LoginScreen = ({ navigation }: any) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!identifier.trim()) {
            Alert.alert("Error", "Please enter email or username");
            return;
        }

        if (!password.trim()) {
            Alert.alert("Error", "Please enter password");
            return;
        }

        try {
            setLoading(true);

            const res = await login({
                identifier,
                password,
            });

            if (res?.token) {
                await AsyncStorage.setItem("token", res.token);
            }

            if (res?.user) {
                await AsyncStorage.setItem(
                    "user",
                    JSON.stringify(res.user)
                );
            }

            const role = res?.user?.role;

            navigation.replace("Main");
        } catch (error: any) {
            Alert.alert(
                "Login Failed",
                error?.message || "Invalid Credentials"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" />

            <ImageBackground
                source={{
                    uri: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
                }}
                resizeMode="cover"
                className="flex-1"
            >
                <View className="flex-1 bg-black/40">
                    <SafeAreaView className="flex-1 justify-center px-6">
                        <View className="bg-white rounded-3xl p-8 shadow-xl">
                            {/* Logo / Title */}

                            <Text className="text-4xl font-bold text-gray-800">
                                Veetu Rusi
                            </Text>

                            <Text className="text-gray-500 mt-2 mb-8">
                                Welcome Back
                            </Text>

                            {/* Email */}

                            <View className="mb-5">
                                <Text className="text-gray-700 font-semibold mb-2">
                                    Email / Username
                                </Text>

                                <TextInput
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    placeholder="Enter Email or Username"
                                    placeholderTextColor="#999"
                                    className="border border-gray-300 rounded-2xl px-4 py-4 text-black bg-gray-50"
                                />
                            </View>

                            {/* Password */}

                            <View className="mb-3">
                                <Text className="text-gray-700 font-semibold mb-2">
                                    Password
                                </Text>

                                <View className="relative">
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        placeholder="Enter Password"
                                        placeholderTextColor="#999"
                                        className="border border-gray-300 rounded-2xl px-4 py-4 pr-14 text-black bg-gray-50"
                                    />

                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-4"
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye-off-outline" : "eye-outline"}
                                            size={24}
                                            color="#14b8a6"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot Password */}

                            <TouchableOpacity className="mb-6">
                                <Text className="text-right text-teal-600 font-semibold">
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>

                            {/* Login Button */}

                            <TouchableOpacity
                                disabled={loading}
                                onPress={handleLogin}
                                className="bg-teal-500 py-4 rounded-2xl items-center"
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">
                                        Login
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {/* Register */}

                            <View className="flex-row justify-center mt-8">
                                <Text className="text-gray-500">
                                    Don't have an account?
                                </Text>

                                <TouchableOpacity>
                                    <Text className="text-teal-600 font-bold ml-1">
                                        Sign Up
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            </ImageBackground>
        </>
    );
};

export default LoginScreen;
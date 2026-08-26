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
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react-native";
import SubscriptionAlert from "../components/SubscriptionAlert";

import { AuthContext } from "../context/AuthContext";

const LoginScreen = ({ navigation }: any) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const auth = React.useContext(AuthContext);
    const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

    const [subscriptionInfo, setSubscriptionInfo] = useState<any>({
        isExpired: false,
        daysRemaining: null,
        status: "Inactive",
    });

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
                await auth?.signIn(res.token, res.user);
            }
        } catch (error: any) {

            const status = error?.response?.status;
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Login failed";

            const subscription =
                error?.response?.data?.subscriptionInfo;

            if (
                status === 403 &&
                subscription
            ) {
                setSubscriptionInfo(subscription);
                setShowSubscriptionAlert(true);
                return;
            }

            Alert.alert("Login Failed", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            <ImageBackground
                source={{
                    uri: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
                }}
                resizeMode="cover"
                className="flex-1 bg-slate-950"
            >
                <View className="flex-1 bg-slate-950/80">
                    <SafeAreaView className="flex-1 justify-center px-6">
                        <View className="bg-slate-900 border border-slate-700 rounded-3xl p-7 shadow-xl">
                            {/* Logo / Title */}

                            <View className="w-14 h-14 rounded-2xl bg-teal-500 items-center justify-center mb-5">
                                <Text className="text-slate-950 text-3xl font-black">V</Text>
                            </View>
                            <Text className="text-teal-400 text-xs font-black tracking-[3px]">
                                Veetu Rusi
                            </Text>

                            <Text className="text-white text-3xl font-black mt-3 mb-2">
                                Welcome back
                            </Text>
                            <Text className="text-slate-400 mb-8">
                                Sign in to manage your franchise
                            </Text>

                            {/* Email */}

                            <View className="mb-5">
                                <Text className="text-slate-300 font-semibold mb-2">
                                    Email / Username
                                </Text>

                                <View className="flex-row items-center border border-slate-700 rounded-2xl px-4 bg-slate-800">
                                    <UserRound size={19} color="#5eead4" />
                                    <TextInput
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        placeholder="Enter Email or Username"
                                        placeholderTextColor="#64748b"
                                        autoCapitalize="none"
                                        className="flex-1 text-white px-3 py-4"
                                    />
                                </View>
                            </View>

                            {/* Password */}

                            <View className="mb-3">
                                <Text className="text-slate-300 font-semibold mb-2">
                                    Password
                                </Text>

                                <View className="relative flex-row items-center border border-slate-700 rounded-2xl px-4 bg-slate-800">
                                    <LockKeyhole size={19} color="#5eead4" />
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        placeholder="Enter Password"
                                        placeholderTextColor="#999"
                                        className="flex-1 text-white px-3 py-4 pr-10"
                                    />

                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-4"
                                    >
                                        {showPassword ? <EyeOff size={21} color="#5eead4" /> : <Eye size={21} color="#5eead4" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot Password */}

                            <TouchableOpacity className="mb-6">
                                <Text className="text-right text-teal-400 font-semibold">
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>

                            {/* Login Button */}

                            <TouchableOpacity
                                disabled={loading}
                                onPress={handleLogin}
                                className="bg-teal-500 py-4 rounded-2xl items-center flex-row justify-center"
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                    <Text className="text-slate-950 font-black text-lg mr-2">
                                        Sign in
                                    </Text>
                                    <ArrowRight size={20} color="#0f172a" />
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Register */}

                            <View className="flex-row justify-center mt-8">
                                <Text className="text-slate-400">
                                    Don't have an account?
                                </Text>

                                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                                    <Text className="text-teal-400 font-bold ml-1">
                                        Sign Up
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            </ImageBackground>

            <SubscriptionAlert
                visible={showSubscriptionAlert}
                subscriptionInfo={subscriptionInfo}
                onClose={() => setShowSubscriptionAlert(false)}
                onBuyClick={() => {
                    setShowSubscriptionAlert(false);

                    navigation.navigate("SubscriptionPlans", {
                        franchiseId: subscriptionInfo.franchiseId,
                    });
                }}
            />
        </>
    );
};

export default LoginScreen;
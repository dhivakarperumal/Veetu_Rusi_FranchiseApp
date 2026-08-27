import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, post } from "../services/api";
import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    UserRound,
    Shield,
    Sparkles,
} from "lucide-react-native";
import SubscriptionAlert from "../components/SubscriptionAlert";
import { AuthContext } from "../context/AuthContext";

const LoginScreen = ({ navigation }: any) => {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const auth = React.useContext(AuthContext);
    const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

    const [subscriptionInfo, setSubscriptionInfo] = useState<any>({
        isExpired: false,
        daysRemaining: null,
        status: "Inactive",
    });

    const handleLogin = async () => {
        if (!identifier.trim()) {
            Alert.alert("Required", "Please enter your email or username");
            return;
        }

        if (!password.trim()) {
            Alert.alert("Required", "Please enter your password");
            return;
        }

        try {
            setLoading(true);

            const res = await login({
                identifier: identifier.trim(),
                password,
            });

            if (res?.token) {
                await auth?.signIn(res.token, res.user);
            }
        } catch (error: any) {
            const status = error?.response?.status;
            const errorData = error?.response?.data || {};

            const message =
                errorData.message ||
                error?.message ||
                "Login failed";

            const subscription = errorData.subscriptionInfo;
            const isSubscriptionIssue =
                status === 403 &&
                (message.toLowerCase().includes("no active subscription") ||
                 message.toLowerCase().includes("subscription") ||
                 Boolean(subscription));

            if (isSubscriptionIssue) {
                let resolvedFranchiseId =
                    errorData.franchiseId ||
                    errorData.franchise_id ||
                    errorData.franchise?.id ||
                    errorData.franchise?.franchise_id ||
                    subscription?.franchiseId ||
                    subscription?.franchise_id ||
                    subscription?.franchise?.id ||
                    subscription?.franchise?.franchise_id ||
                    errorData.user?.franchiseId ||
                    errorData.user?.franchise_id ||
                    subscription?.id;

                if (!resolvedFranchiseId) {
                    try {
                        const lookupRes = await post<any>("/subscriptions/lookup", {
                            identifier: identifier.trim(),
                        });
                        resolvedFranchiseId = lookupRes?.franchiseId || lookupRes?.franchise?.id;
                    } catch (e) {
                        console.warn("Franchise lookup failed:", e);
                    }
                }

                if (errorData.token) {
                    await AsyncStorage.setItem("token", errorData.token);
                }
                if (errorData.user) {
                    await AsyncStorage.setItem("user", JSON.stringify(errorData.user));
                }
                if (resolvedFranchiseId) {
                    await AsyncStorage.setItem("franchiseId", String(resolvedFranchiseId));
                }

                setSubscriptionInfo({
                    ...errorData,
                    ...(subscription || {}),
                    user: errorData.user,
                    franchise: errorData.franchise || subscription?.franchise,
                    franchiseId: resolvedFranchiseId,
                    identifier: identifier.trim(),
                    isExpired: subscription?.isExpired ?? true,
                    daysRemaining: subscription?.daysRemaining ?? 0,
                    status: subscription?.status || "Inactive",
                });

                setShowSubscriptionAlert(true);
                return;
            }

            Alert.alert("Login Failed", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            <StatusBar barStyle="light-content" backgroundColor="#020617" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        paddingHorizontal: 24,
                        paddingVertical: 32,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Brand Header */}
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 bg-slate-900 border-2 border-teal-500/30 rounded-3xl p-2 items-center justify-center mb-4 shadow-xl shadow-teal-500/10">
                            <Image
                                source={require("../images/logo2.png")}
                                style={{ width: 60, height: 60 }}
                                resizeMode="contain"
                            />
                        </View>

                        <View className="flex-row items-center mb-1">
                            <Text className="text-white text-3xl font-black tracking-tight">
                                Veetu Rusi
                            </Text>
                        </View>

                        <View className="bg-teal-500/15 border border-teal-500/25 px-3.5 py-1 rounded-full flex-row items-center mt-1 mb-2">
                            <Shield size={12} color="#5eead4" />
                            <Text className="text-teal-300 text-xs font-black tracking-widest ml-1.5 uppercase">
                                Franchise Portal
                            </Text>
                        </View>

                        <Text className="text-slate-400 text-sm text-center max-w-[280px] leading-5">
                            Sign in to manage orders, chefs, deliveries & daily revenue
                        </Text>
                    </View>

                    {/* Main Form Card */}
                    <View className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl shadow-black">
                        {/* Identifier Field */}
                        <View className="mb-5">
                            <Text className="text-slate-300 font-semibold text-xs tracking-wider uppercase mb-2">
                                Email / Username
                            </Text>

                            <View
                                className={`flex-row items-center border rounded-2xl px-4 bg-slate-950/90 ${
                                    isIdentifierFocused
                                        ? "border-teal-400 shadow-md shadow-teal-500/10"
                                        : "border-slate-800"
                                }`}
                            >
                                <UserRound size={18} color={isIdentifierFocused ? "#5eead4" : "#64748b"} />
                                <TextInput
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    onFocus={() => setIsIdentifierFocused(true)}
                                    onBlur={() => setIsIdentifierFocused(false)}
                                    placeholder="Enter your email or username"
                                    placeholderTextColor="#475569"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    className="flex-1 text-white px-3 py-4 text-sm"
                                />
                            </View>
                        </View>

                        {/* Password Field */}
                        <View className="mb-3">
                            <Text className="text-slate-300 font-semibold text-xs tracking-wider uppercase mb-2">
                                Password
                            </Text>

                            <View
                                className={`relative flex-row items-center border rounded-2xl px-4 bg-slate-950/90 ${
                                    isPasswordFocused
                                        ? "border-teal-400 shadow-md shadow-teal-500/10"
                                        : "border-slate-800"
                                }`}
                            >
                                <LockKeyhole size={18} color={isPasswordFocused ? "#5eead4" : "#64748b"} />
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() => setIsPasswordFocused(true)}
                                    onBlur={() => setIsPasswordFocused(false)}
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter your account password"
                                    placeholderTextColor="#475569"
                                    className="flex-1 text-white px-3 py-4 pr-10 text-sm"
                                />

                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 p-1"
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    {showPassword ? (
                                        <EyeOff size={18} color="#5eead4" />
                                    ) : (
                                        <Eye size={18} color="#64748b" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity className="self-end mb-6 py-1">
                            <Text className="text-teal-400 text-xs font-bold">
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleLogin}
                            activeOpacity={0.85}
                            className="bg-teal-500 py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-teal-500/30"
                        >
                            {loading ? (
                                <ActivityIndicator color="#020617" size="small" />
                            ) : (
                                <>
                                    <Text className="text-slate-950 font-black text-base mr-2">
                                        Sign In
                                    </Text>
                                    <ArrowRight size={18} color="#020617" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Sign Up Prompt */}
                    <View className="flex-row justify-center items-center mt-8">
                        <Text className="text-slate-400 text-sm">
                            Don't have a franchise account?
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate("Register")}
                            className="ml-1.5 py-1"
                        >
                            <Text className="text-teal-400 font-bold text-sm">
                                Register
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Subscription Alert */}
            <SubscriptionAlert
                visible={showSubscriptionAlert}
                subscriptionInfo={subscriptionInfo}
                onClose={() => setShowSubscriptionAlert(false)}
                onBuyClick={() => {
                    setShowSubscriptionAlert(false);

                    navigation.navigate("SubscriptionPlans", {
                        franchiseId: subscriptionInfo?.franchiseId,
                        identifier: identifier.trim(),
                        subscriptionInfo,
                        user: subscriptionInfo?.user,
                    });
                }}
            />
        </SafeAreaView>
    );
};

export default LoginScreen;
import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StatusBar,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, post } from "../services/api";

import {
    ArrowRight,
    Eye,
    EyeOff,
    LockKeyhole,
    UserRound,
    ShieldCheck,
    Sparkles,
    ChefHat,
} from "lucide-react-native";

import SubscriptionAlert from "../components/SubscriptionAlert";
import { AuthContext } from "../context/AuthContext";

const LoginScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();
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

    // ---------------------------------------------------------
    // LOGIN LOGIC - KEPT SAME
    // ---------------------------------------------------------

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
                (
                    message.toLowerCase().includes("no active subscription") ||
                    message.toLowerCase().includes("subscription") ||
                    Boolean(subscription)
                );

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
                        const lookupRes = await post<any>(
                            "/subscriptions/lookup",
                            {
                                identifier: identifier.trim(),
                            }
                        );

                        resolvedFranchiseId =
                            lookupRes?.franchiseId ||
                            lookupRes?.franchise?.id;
                    } catch (e) {
                        console.warn("Franchise lookup failed:", e);
                    }
                }

                if (errorData.token) {
                    await AsyncStorage.setItem(
                        "token",
                        errorData.token
                    );
                }

                if (errorData.user) {
                    await AsyncStorage.setItem(
                        "user",
                        JSON.stringify(errorData.user)
                    );
                }

                if (resolvedFranchiseId) {
                    await AsyncStorage.setItem(
                        "franchiseId",
                        String(resolvedFranchiseId)
                    );
                }

                setSubscriptionInfo({
                    ...errorData,
                    ...(subscription || {}),
                    user: errorData.user,
                    franchise:
                        errorData.franchise ||
                        subscription?.franchise,
                    franchiseId: resolvedFranchiseId,
                    identifier: identifier.trim(),
                    isExpired:
                        subscription?.isExpired ?? true,
                    daysRemaining:
                        subscription?.daysRemaining ?? 0,
                    status:
                        subscription?.status || "Inactive",
                });

                setShowSubscriptionAlert(true);
                return;
            }

            Alert.alert("Login Failed", message);
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#F8FAFC",
            }}
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor="#0F172A"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        backgroundColor: "#F8FAFC",
                    }}
                >
                    {/* ================================================= */}
                    {/* COMPACT HEADER */}
                    {/* ================================================= */}

                    <View
                        style={{
                            backgroundColor: "#0F172A",
                            paddingHorizontal: 20,
                            paddingTop: Math.max(insets.top, 14),
                            paddingBottom: 30,
                            borderBottomLeftRadius: 24,
                            borderBottomRightRadius: 24,
                        }}
                    >
                        {/* TOP BAR */}

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 15,
                            }}
                        >
                            {/* BRAND */}

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        width: 38,
                                        height: 38,
                                        borderRadius: 11,
                                        backgroundColor: "#FFFFFF",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginRight: 9,
                                    }}
                                >
                                    <Image
                                        source={require("../images/logo2.png")}
                                        style={{
                                            width: 28,
                                            height: 28,
                                        }}
                                        resizeMode="contain"
                                    />
                                </View>

                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontSize: 16,
                                        fontWeight: "800",
                                    }}
                                >
                                    Veetu Rusi
                                </Text>
                            </View>

                            {/* SECURE */}

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor:
                                        "rgba(255,255,255,0.08)",
                                    borderWidth: 1,
                                    borderColor:
                                        "rgba(255,255,255,0.10)",
                                    borderRadius: 20,
                                    paddingHorizontal: 9,
                                    paddingVertical: 6,
                                }}
                            >
                                <ShieldCheck
                                    size={14}
                                    color="#5EEAD4"
                                />

                                <Text
                                    style={{
                                        color: "#5EEAD4",
                                        fontSize: 9,
                                        fontWeight: "800",
                                        marginLeft: 4,
                                    }}
                                >
                                    SECURE
                                </Text>
                            </View>
                        </View>

                        {/* HERO CONTENT */}

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            {/* TEXT */}

                            <View
                                style={{
                                    flex: 1,
                                    paddingRight: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        color: "#5EEAD4",
                                        fontSize: 10,
                                        fontWeight: "800",
                                        letterSpacing: 1.2,
                                        marginBottom: 5,
                                    }}
                                >
                                    FRANCHISE PORTAL
                                </Text>

                                <Text
                                    style={{
                                        color: "#FFFFFF",
                                        fontSize: 27,
                                        fontWeight: "900",
                                        lineHeight: 31,
                                    }}
                                >
                                    Welcome Back!
                                </Text>

                                <Text
                                    style={{
                                        color: "#94A3B8",
                                        fontSize: 12,
                                        lineHeight: 17,
                                        marginTop: 5,
                                    }}
                                >
                                    Manage your franchise, orders and
                                    daily operations from one place.
                                </Text>
                            </View>

                            {/* LOGO */}

                            <View
                                style={{
                                    width: 68,
                                    height: 68,
                                    borderRadius: 19,
                                    backgroundColor: "#FFFFFF",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    elevation: 6,
                                    shadowColor: "#000000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 4,
                                    },
                                    shadowOpacity: 0.18,
                                    shadowRadius: 6,
                                }}
                            >
                                <Image
                                    source={require("../images/logo2.png")}
                                    style={{
                                        width: 51,
                                        height: 51,
                                    }}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>

                        {/* FEATURES */}

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 13,
                            }}
                        >
                            {/* KITCHEN */}

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    marginRight: 18,
                                }}
                            >
                                <View
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        backgroundColor:
                                            "rgba(45,212,191,0.12)",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <ChefHat
                                        size={14}
                                        color="#5EEAD4"
                                    />
                                </View>

                                <Text
                                    style={{
                                        color: "#94A3B8",
                                        fontSize: 10,
                                        marginLeft: 6,
                                    }}
                                >
                                    Kitchen
                                </Text>
                            </View>

                            {/* OPERATIONS */}

                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <View
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        backgroundColor:
                                            "rgba(45,212,191,0.12)",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Sparkles
                                        size={14}
                                        color="#5EEAD4"
                                    />
                                </View>

                                <Text
                                    style={{
                                        color: "#94A3B8",
                                        fontSize: 10,
                                        marginLeft: 6,
                                    }}
                                >
                                    Operations
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ================================================= */}
                    {/* LOGIN SECTION */}
                    {/* ================================================= */}

                    <View
                        style={{
                            backgroundColor: "#F8FAFC",
                            paddingHorizontal: 20,
                            paddingTop: 24,
                            paddingBottom: Math.max(insets.bottom, 24),
                        }}
                    >
                        {/* TITLE */}

                        <View
                            style={{
                                marginBottom: 22,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#0F172A",
                                    fontSize: 25,
                                    fontWeight: "900",
                                }}
                            >
                                Sign in
                            </Text>

                            <Text
                                style={{
                                    color: "#64748B",
                                    fontSize: 13,
                                    marginTop: 3,
                                }}
                            >
                                Enter your account details to continue
                            </Text>
                        </View>

                        {/* ================================================= */}
                        {/* EMAIL / USERNAME */}
                        {/* ================================================= */}

                        <View
                            style={{
                                marginBottom: 17,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#334155",
                                    fontSize: 10,
                                    fontWeight: "800",
                                    marginBottom: 9,
                                    marginLeft: 2,
                                    letterSpacing: 0.4,
                                }}
                            >
                                EMAIL OR USERNAME
                            </Text>

                            <View
                                style={{
                                    height: 52,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 15,
                                    borderWidth: 1.3,
                                    borderColor: isIdentifierFocused
                                        ? "#14B8A6"
                                        : "#CBD5E1",
                                    paddingHorizontal: 12,
                                    elevation: 2,
                                    shadowColor: "#0F172A",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.04,
                                    shadowRadius: 4,
                                }}
                            >
                                <View
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 10,
                                        backgroundColor:
                                            isIdentifierFocused
                                                ? "#CCFBF1"
                                                : "#F1F5F9",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <UserRound
                                        size={17}
                                        color={
                                            isIdentifierFocused
                                                ? "#0D9488"
                                                : "#94A3B8"
                                        }
                                    />
                                </View>

                                <TextInput
                                    value={identifier}
                                    onChangeText={setIdentifier}
                                    onFocus={() =>
                                        setIsIdentifierFocused(true)
                                    }
                                    onBlur={() =>
                                        setIsIdentifierFocused(false)
                                    }
                                    placeholder="Enter email or username"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={{
                                        flex: 1,
                                        color: "#0F172A",
                                        fontSize: 14,
                                        paddingHorizontal: 11,
                                        paddingVertical: 0,
                                    }}
                                />
                            </View>
                        </View>

                        {/* ================================================= */}
                        {/* PASSWORD */}
                        {/* ================================================= */}

                        <View
                            style={{
                                marginBottom: 11,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#334155",
                                    fontSize: 10,
                                    fontWeight: "800",
                                    marginBottom: 9,
                                    marginLeft: 2,
                                    letterSpacing: 0.4,
                                }}
                            >
                                PASSWORD
                            </Text>

                            <View
                                style={{
                                    height: 52,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 15,
                                    borderWidth: 1.3,
                                    borderColor: isPasswordFocused
                                        ? "#14B8A6"
                                        : "#CBD5E1",
                                    paddingHorizontal: 12,
                                    elevation: 2,
                                    shadowColor: "#0F172A",
                                    shadowOffset: {
                                        width: 0,
                                        height: 2,
                                    },
                                    shadowOpacity: 0.04,
                                    shadowRadius: 4,
                                }}
                            >
                                <View
                                    style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 10,
                                        backgroundColor:
                                            isPasswordFocused
                                                ? "#CCFBF1"
                                                : "#F1F5F9",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <LockKeyhole
                                        size={17}
                                        color={
                                            isPasswordFocused
                                                ? "#0D9488"
                                                : "#94A3B8"
                                        }
                                    />
                                </View>

                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    onFocus={() =>
                                        setIsPasswordFocused(true)
                                    }
                                    onBlur={() =>
                                        setIsPasswordFocused(false)
                                    }
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#94A3B8"
                                    autoCapitalize="none"
                                    style={{
                                        flex: 1,
                                        color: "#0F172A",
                                        fontSize: 14,
                                        paddingHorizontal: 11,
                                        paddingVertical: 0,
                                    }}
                                />

                                <TouchableOpacity
                                    onPress={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    style={{
                                        padding: 6,
                                    }}
                                >
                                    {showPassword ? (
                                        <EyeOff
                                            size={19}
                                            color="#0D9488"
                                        />
                                    ) : (
                                        <Eye
                                            size={19}
                                            color="#94A3B8"
                                        />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* FORGOT PASSWORD */}

                        <TouchableOpacity
                            activeOpacity={0.7}
                            style={{
                                alignSelf: "flex-end",
                                paddingVertical: 7,
                                marginBottom: 16,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#0D9488",
                                    fontSize: 11,
                                    fontWeight: "800",
                                }}
                            >
                                Forgot Password?
                            </Text>
                        </TouchableOpacity>

                        {/* ================================================= */}
                        {/* SIGN IN */}
                        {/* ================================================= */}

                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleLogin}
                            activeOpacity={0.85}
                            style={{
                                height: 52,
                                borderRadius: 15,
                                backgroundColor: loading
                                    ? "#5EEAD4"
                                    : "#0F766E",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                elevation: 4,
                                shadowColor: "#0F766E",
                                shadowOffset: {
                                    width: 0,
                                    height: 5,
                                },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator
                                    color="#FFFFFF"
                                    size="small"
                                />
                            ) : (
                                <>
                                    <Text
                                        style={{
                                            color: "#FFFFFF",
                                            fontSize: 15,
                                            fontWeight: "900",
                                            marginRight: 10,
                                        }}
                                    >
                                        Sign In
                                    </Text>

                                    <View
                                        style={{
                                            width: 27,
                                            height: 27,
                                            borderRadius: 14,
                                            backgroundColor:
                                                "rgba(255,255,255,0.16)",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <ArrowRight
                                            size={16}
                                            color="#FFFFFF"
                                        />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* ================================================= */}
                        {/* DIVIDER */}
                        {/* ================================================= */}

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginVertical: 13,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    height: 1,
                                    backgroundColor: "#E2E8F0",
                                }}
                            />

                            <Text
                                style={{
                                    color: "#94A3B8",
                                    fontSize: 9,
                                    fontWeight: "800",
                                    marginHorizontal: 10,
                                }}
                            >
                                NEW TO VEETU RUSI?
                            </Text>

                            <View
                                style={{
                                    flex: 1,
                                    height: 1,
                                    backgroundColor: "#E2E8F0",
                                }}
                            />
                        </View>

                        {/* ================================================= */}
                        {/* FOOTER */}
                        {/* ================================================= */}

                        <View
                            style={{
                                alignItems: "center",
                                marginTop: 12,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#94A3B8",
                                    fontSize: 9,
                                }}
                            >
                                Veetu Rusi Franchise Management
                            </Text>

                            <Text
                                style={{
                                    color: "#CBD5E1",
                                    fontSize: 8,
                                    marginTop: 3,
                                }}
                            >
                                Secure • Simple • Smart
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ================================================= */}
            {/* SUBSCRIPTION ALERT */}
            {/* ================================================= */}

            <SubscriptionAlert
                visible={showSubscriptionAlert}
                subscriptionInfo={subscriptionInfo}
                onClose={() =>
                    setShowSubscriptionAlert(false)
                }
                onBuyClick={() => {
                    setShowSubscriptionAlert(false);

                    navigation.navigate(
                        "SubscriptionPlans",
                        {
                            franchiseId:
                                subscriptionInfo?.franchiseId,
                            identifier:
                                identifier.trim(),
                            subscriptionInfo,
                            user:
                                subscriptionInfo?.user,
                        }
                    );
                }}
            />
        </View>
    );
};

export default LoginScreen;
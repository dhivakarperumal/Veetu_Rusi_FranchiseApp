import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Modal,
} from "react-native";
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    CreditCard,
    Sparkles,
    X,
} from "lucide-react-native";
import { get, getSubscriptionPlans, post } from "../services/api";
import RazorpayCheckout from "react-native-razorpay";
import { useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getFranchiseId = (data: any) =>
    data?.franchiseId ||
    data?.franchise_id ||
    data?.franchise?.id ||
    data?.franchise?.franchiseId ||
    data?.franchise?.franchise_id ||
    data?.subscription?.franchiseId ||
    data?.subscription?.franchise_id ||
    data?.subscription?.franchise?.id ||
    data?.subscription?.franchise?.franchise_id ||
    data?.subscription?.id ||
    data?.user?.franchiseId ||
    data?.user?.franchise_id ||
    null;

const formatDisplayDate = (dateStr: any) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        return d.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return String(dateStr);
    }
};

type AlertConfig = {
    visible: boolean;
    title: string;
    message: string;
    type: "error" | "warning" | "info" | "success";
    confirmText?: string;
    onConfirm?: () => void;
};

type SuccessModalData = {
    planName: string;
    amount: string | number;
    currency?: string;
    durationDays?: number;
    expiryDate?: string;
};

const SubscriptionPlansScreen = ({ navigation }: any) => {
    const route = useRoute<any>();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const [franchiseId, setFranchiseId] = useState<any>(
        route.params?.franchiseId ||
        route.params?.franchise_id ||
        route.params?.subscriptionInfo?.franchiseId ||
        route.params?.subscriptionInfo?.franchise_id ||
        route.params?.subscriptionInfo?.franchise?.id ||
        route.params?.user?.franchiseId ||
        route.params?.user?.franchise_id ||
        null
    );

    // Custom Alert Dialog State
    const [alertConfig, setAlertConfig] = useState<AlertConfig>({
        visible: false,
        title: "",
        message: "",
        type: "info",
        confirmText: "OK",
    });

    // Custom Activated Success Modal State
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState<SuccessModalData | null>(null);

    const showAlert = (
        title: string,
        message: string,
        type: "error" | "warning" | "info" | "success" = "info",
        confirmText: string = "OK",
        onConfirm?: () => void
    ) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            confirmText,
            onConfirm,
        });
    };

    const closeAlert = () => {
        const cb = alertConfig.onConfirm;
        setAlertConfig((prev) => ({ ...prev, visible: false }));
        if (cb) cb();
    };

    useEffect(() => {
        fetchPlans();

        const resolveFranchiseId = async () => {
            if (franchiseId) return;

            try {
                // 1. Try AsyncStorage franchiseId
                const storedFId = await AsyncStorage.getItem("franchiseId");
                if (storedFId) {
                    setFranchiseId(storedFId);
                    return;
                }

                // 2. Try AsyncStorage user
                const user = JSON.parse((await AsyncStorage.getItem("user")) || "null");
                const storedUserFId = getFranchiseId(user);
                if (storedUserFId) {
                    setFranchiseId(storedUserFId);
                    await AsyncStorage.setItem("franchiseId", String(storedUserFId));
                    return;
                }

                // 3. Try lookup with identifier if passed
                const identifier =
                    route.params?.identifier ||
                    user?.email ||
                    user?.username ||
                    user?.mobile ||
                    user?.mobile_number;

                if (identifier) {
                    const lookupRes = await post<any>("/subscriptions/lookup", { identifier });
                    const lookupFId = lookupRes?.franchiseId || lookupRes?.franchise?.id;
                    if (lookupFId) {
                        setFranchiseId(lookupFId);
                        await AsyncStorage.setItem("franchiseId", String(lookupFId));
                        return;
                    }
                }

                // 4. Try from /subscriptions/status
                const response = await get<any>("/subscriptions/status");
                const statusFId = getFranchiseId(response);
                if (statusFId) {
                    setFranchiseId(statusFId);
                    await AsyncStorage.setItem("franchiseId", String(statusFId));
                }
            } catch (err) {
                console.warn("Could not resolve franchise ID:", err);
            }
        };

        resolveFranchiseId();
    }, [franchiseId, route.params]);

    const fetchPlans = async () => {
        try {
            setLoading(true);

            const data = await getSubscriptionPlans();

            setPlans(data || []);

            if (data?.length > 0) {
                setSelectedPlan(data[0]);
            }

        } catch (error: any) {
            console.log("Subscription plans error:", error);

            showAlert(
                "Unable to Load Plans",
                error?.message || "Failed to load subscription plans. Please check your network and try again.",
                "error",
                "Retry",
                () => fetchPlans()
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        let activeFranchiseId = franchiseId;

        if (!activeFranchiseId) {
            try {
                const storedFId = await AsyncStorage.getItem("franchiseId");
                if (storedFId) {
                    activeFranchiseId = storedFId;
                    setFranchiseId(storedFId);
                } else {
                    const user = JSON.parse((await AsyncStorage.getItem("user")) || "null");
                    const identifier = route.params?.identifier || user?.email || user?.username;
                    if (identifier) {
                        const lookupRes = await post<any>("/subscriptions/lookup", { identifier });
                        const lookupFId = lookupRes?.franchiseId || lookupRes?.franchise?.id;
                        if (lookupFId) {
                            activeFranchiseId = lookupFId;
                            setFranchiseId(lookupFId);
                            await AsyncStorage.setItem("franchiseId", String(lookupFId));
                        }
                    }
                }
            } catch (e) {
                console.warn("Payment resolve attempt failed:", e);
            }
        }

        if (!selectedPlan || !activeFranchiseId) {
            showAlert(
                "Unable to Continue",
                "We could not identify your franchise. Please sign in again.",
                "warning",
                "Sign In Again",
                () => {
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    } else {
                        navigation.navigate("Login");
                    }
                }
            );
            return;
        }

        try {
            setPaymentProcessing(true);
            const checkout = await post<any>("/subscriptions/checkout", {
                franchiseId: activeFranchiseId,
                planId: selectedPlan.id,
            });

            const payment = checkout.key_id
                ? await RazorpayCheckout.open({
                    key: checkout.key_id,
                    amount: checkout.order.amount,
                    currency: checkout.plan.currency,
                    name: "Veetu Rusi",
                    description: `${checkout.plan.name} Subscription`,
                    order_id: checkout.order.id,
                    prefill: { name: "Franchise Owner" },
                    notes: { franchiseId: String(activeFranchiseId), planId: String(selectedPlan.id) },
                    theme: { color: "#14B8A6" },
                })
                : {
                    razorpay_payment_id: `TEST_PAYMENT_${Date.now()}`,
                    razorpay_order_id: checkout.order.id,
                    razorpay_signature: "",
                };

            const confirmRes = await post<any>("/subscriptions/confirm", {
                franchiseId: activeFranchiseId,
                planId: selectedPlan.id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_signature: payment.razorpay_signature,
            });

            // Calculate formatted expiry date for display
            const calculatedExpiry = confirmRes?.expiry_date
                ? formatDisplayDate(confirmRes.expiry_date)
                : formatDisplayDate(new Date(Date.now() + (selectedPlan.durationDays || 30) * 24 * 60 * 60 * 1000));

            setSuccessData({
                planName: selectedPlan.name,
                amount: selectedPlan.amount,
                currency: selectedPlan.currency || "INR",
                durationDays: selectedPlan.durationDays,
                expiryDate: calculatedExpiry,
            });

            setShowSuccessModal(true);
        } catch (error: any) {
            if (error?.code !== 2) {
                showAlert(
                    "Payment Failed",
                    error?.message || "Payment could not be completed. Please try again.",
                    "error",
                    "Try Again"
                );
            }
        } finally {
            setPaymentProcessing(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center">

                <ActivityIndicator
                    size="large"
                    color="#14B8A6"
                />

                <Text className="text-slate-400 mt-4 font-medium">
                    Loading subscription plans...
                </Text>

            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-950">

            {/* Header */}
            <View className="bg-slate-900 px-6 pt-5 pb-7 border-b border-slate-800">

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 items-center justify-center mb-5"
                >
                    <ArrowLeft size={21} color="#5eead4" />
                </TouchableOpacity>

                <Text className="text-white text-3xl font-black">
                    Choose Your Plan
                </Text>

                <Text className="text-slate-400 mt-2 leading-6">
                    Keep your franchise tools active with a plan that fits your rhythm.
                </Text>

            </View>


            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 20,
                    paddingBottom: 40,
                }}
                showsVerticalScrollIndicator={false}
            >

                {plans.length === 0 ? (

                    <View className="bg-slate-900 border border-slate-800 rounded-3xl p-8 items-center mt-5">

                        <AlertCircle size={50} color="#fbbf24" />

                        <Text className="text-xl font-bold text-white mt-4">
                            No Plans Available
                        </Text>

                        <Text className="text-slate-400 text-center mt-2">
                            Please check back later or contact support.
                        </Text>

                    </View>

                ) : (

                    plans.map((plan) => {

                        const selected =
                            selectedPlan?.id === plan.id;

                        return (
                            <TouchableOpacity
                                key={plan.id}
                                activeOpacity={0.85}
                                onPress={() =>
                                    setSelectedPlan(plan)
                                }
                                className={`bg-slate-900 rounded-3xl p-5 mb-4 border-2 ${
                                    selected
                                        ? "border-teal-400"
                                        : "border-slate-800"
                                }`}
                            >

                                <View className="flex-row justify-between items-start">

                                    <View className="flex-1">

                                        <Text className="text-xl font-black text-white">
                                            {plan.name}
                                        </Text>

                                        <View className="flex-row items-baseline mt-2">

                                            <Text className="text-3xl font-black text-teal-400">
                                                ₹{plan.amount}
                                            </Text>

                                        </View>

                                        <Text className="text-slate-400 mt-2">
                                            {plan.durationDays === 30
                                                ? "Billed Monthly"
                                                : plan.durationDays === 90
                                                ? "Billed Quarterly"
                                                : plan.durationDays === 365
                                                ? "Billed Annually"
                                                : `${plan.durationDays} Days Access`}
                                        </Text>

                                    </View>


                                    {/* Radio */}
                                    <View
                                        className={`w-7 h-7 rounded-full border-2 items-center justify-center ${
                                                selected
                                                ? "border-teal-400"
                                                : "border-slate-600"
                                        }`}
                                    >

                                        {selected && (
                                            <View className="w-3.5 h-3.5 rounded-full bg-teal-400" />
                                        )}

                                    </View>

                                </View>


                                {/* Best Value */}
                                {plan.durationDays >= 90 && (
                                    <View className="self-start bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full mt-4 flex-row items-center">

                                        <Sparkles size={13} color="#5eead4" />
                                        <Text className="text-teal-300 text-xs font-bold ml-1">
                                            BEST VALUE
                                        </Text>

                                    </View>
                                )}

                            </TouchableOpacity>
                        );
                    })
                )}


                {/* Continue Button */}
                {plans.length > 0 && (

                    <TouchableOpacity
                        disabled={!selectedPlan || paymentProcessing}
                        activeOpacity={0.85}
                        onPress={handlePayment}
                        className="bg-teal-500 rounded-2xl py-4 items-center mt-4"
                    >

                        <View className="flex-row items-center">

                            {paymentProcessing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <CreditCard size={21} color="#0f172a" />
                            )}

                            <Text className="text-white font-bold text-lg ml-2">
                                {paymentProcessing ? "Processing..." : "Proceed to Checkout"}
                            </Text>

                        </View>

                    </TouchableOpacity>

                )}

            </ScrollView>

            {/* ========================================================= */}
            {/* Custom Subscription Activated Success Modal               */}
            {/* ========================================================= */}
            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => {
                    setShowSuccessModal(false);
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    } else {
                        navigation.navigate("Login");
                    }
                }}
            >
                <View className="flex-1 bg-slate-950/85 items-center justify-center px-5">
                    <View className="w-full max-w-[390px] bg-slate-900 border border-teal-500/30 rounded-3xl overflow-hidden shadow-2xl">
                        {/* Header Banner */}
                        <View className="bg-teal-950/90 pt-8 pb-6 px-6 items-center border-b border-teal-500/20">
                            <View className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/40 items-center justify-center mb-4">
                                <CheckCircle2 size={36} color="#2dd4bf" />
                            </View>

                            <View className="bg-teal-500/20 border border-teal-500/30 px-3 py-1 rounded-full mb-2 flex-row items-center">
                                <Sparkles size={12} color="#5eead4" />
                                <Text className="text-teal-300 text-xs font-bold ml-1 tracking-wider uppercase">
                                    Subscription Active
                                </Text>
                            </View>

                            <Text className="text-white text-2xl font-black text-center">
                                Plan Activated!
                            </Text>

                            <Text className="text-slate-300 text-sm text-center mt-1.5 leading-5">
                                Your franchise subscription is now active and ready.
                            </Text>
                        </View>

                        {/* Plan Details Breakdown */}
                        <View className="p-6">
                            <View className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80 mb-5">
                                <View className="flex-row justify-between items-center pb-3 border-b border-slate-700/60">
                                    <Text className="text-slate-400 font-medium text-sm">Plan</Text>
                                    <Text className="text-white font-bold text-base">
                                        {successData?.planName || "Franchise Plan"}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between items-center py-2.5 border-b border-slate-700/60">
                                    <Text className="text-slate-400 font-medium text-sm">Amount Paid</Text>
                                    <Text className="text-teal-400 font-black text-lg">
                                        ₹{successData?.amount || "0"}
                                    </Text>
                                </View>

                                <View className="flex-row justify-between items-center py-2.5 border-b border-slate-700/60">
                                    <Text className="text-slate-400 font-medium text-sm">Duration</Text>
                                    <Text className="text-slate-200 font-semibold text-sm">
                                        {successData?.durationDays ? `${successData.durationDays} Days Access` : "Active"}
                                    </Text>
                                </View>

                                {Boolean(successData?.expiryDate) && (
                                    <View className="flex-row justify-between items-center pt-2.5">
                                        <Text className="text-slate-400 font-medium text-sm">Valid Until</Text>
                                        <Text className="text-teal-300 font-semibold text-sm">
                                            {successData?.expiryDate}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Features highlights */}
                            <View className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-3.5 mb-6">
                                <View className="flex-row items-center mb-2">
                                    <CheckCircle2 size={16} color="#2dd4bf" />
                                    <Text className="text-slate-300 text-xs font-medium ml-2.5">
                                        Full Franchise Dashboard Access
                                    </Text>
                                </View>
                                <View className="flex-row items-center mb-2">
                                    <CheckCircle2 size={16} color="#2dd4bf" />
                                    <Text className="text-slate-300 text-xs font-medium ml-2.5">
                                        Real-time Orders & Chef Management
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <CheckCircle2 size={16} color="#2dd4bf" />
                                    <Text className="text-slate-300 text-xs font-medium ml-2.5">
                                        Delivery Partner Operations
                                    </Text>
                                </View>
                            </View>

                            {/* Primary Action Button */}
                            <TouchableOpacity
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    if (navigation.canGoBack()) {
                                        navigation.goBack();
                                    } else {
                                        navigation.navigate("Login");
                                    }
                                }}
                                className="w-full bg-teal-500 rounded-2xl py-4 items-center shadow-lg shadow-teal-500/30 flex-row justify-center"
                            >
                                <Text className="text-slate-950 font-black text-base mr-2">
                                    Sign In to Continue
                                </Text>
                                <ArrowRight size={19} color="#0f172a" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ========================================================= */}
            {/* Custom Alert / Error / Warning Dialog                     */}
            {/* ========================================================= */}
            <Modal
                visible={alertConfig.visible}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={closeAlert}
            >
                <View className="flex-1 bg-slate-950/85 items-center justify-center px-6">
                    <View className="w-full max-w-[370px] bg-slate-900 border border-slate-700 rounded-3xl p-6 items-center shadow-2xl relative">
                        {/* Close button */}
                        <TouchableOpacity
                            onPress={closeAlert}
                            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
                        >
                            <X size={15} color="#94a3b8" />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View
                            className={`w-16 h-16 rounded-2xl items-center justify-center mb-4 ${
                                alertConfig.type === "error"
                                    ? "bg-rose-500/15 border border-rose-500/30"
                                    : alertConfig.type === "warning"
                                    ? "bg-amber-500/15 border border-amber-500/30"
                                    : "bg-teal-500/15 border border-teal-500/30"
                            }`}
                        >
                            {alertConfig.type === "error" ? (
                                <AlertCircle size={32} color="#fb7185" />
                            ) : alertConfig.type === "warning" ? (
                                <AlertTriangle size={32} color="#fbbf24" />
                            ) : (
                                <CheckCircle2 size={32} color="#2dd4bf" />
                            )}
                        </View>

                        {/* Title & Message */}
                        <Text className="text-white text-xl font-black text-center">
                            {alertConfig.title}
                        </Text>
                        <Text className="text-slate-400 text-sm text-center leading-5 mt-2.5 px-2">
                            {alertConfig.message}
                        </Text>

                        {/* Action Button */}
                        <TouchableOpacity
                            onPress={closeAlert}
                            className={`w-full rounded-2xl py-3.5 items-center mt-6 ${
                                alertConfig.type === "error"
                                    ? "bg-rose-500"
                                    : "bg-teal-500"
                            }`}
                        >
                            <Text className={`font-black text-sm uppercase tracking-wider ${
                                alertConfig.type === "error" ? "text-white" : "text-slate-950"
                            }`}>
                                {alertConfig.confirmText || "OK"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
};

export default SubscriptionPlansScreen;
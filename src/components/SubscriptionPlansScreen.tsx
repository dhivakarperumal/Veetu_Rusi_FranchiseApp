import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    SafeAreaView,
    Alert,
} from "react-native";
import { AlertCircle, ArrowLeft, CreditCard, Sparkles } from "lucide-react-native";
import { getSubscriptionPlans, post } from "../services/api";
import RazorpayCheckout from "react-native-razorpay";

const SubscriptionPlansScreen = ({ navigation }: any) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    const franchiseId = navigation.getState()?.routes?.find(
        (route: any) => route.name === "SubscriptionPlans"
    )?.params?.franchiseId;

    useEffect(() => {
        fetchPlans();
    }, []);

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

            Alert.alert(
                "Error",
                error?.message || "Failed to load subscription plans"
            );
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedPlan || !franchiseId) {
            Alert.alert("Unable to continue", "Your franchise could not be identified.");
            return;
        }

        try {
            setPaymentProcessing(true);
            const checkout = await post<any>("/subscriptions/checkout", {
                franchiseId,
                planId: selectedPlan.id,
            });

            if (!checkout.key_id) {
                Alert.alert("Subscription activated", "Demo mode is enabled for this account.", [
                    { text: "Done", onPress: () => navigation.goBack() },
                ]);
                return;
            }

            const payment = await RazorpayCheckout.open({
                key: checkout.key_id,
                amount: checkout.order.amount,
                currency: checkout.plan.currency,
                name: "Veetu Rusi",
                description: `${checkout.plan.name} Subscription`,
                order_id: checkout.order.id,
                prefill: { name: "Franchise Owner" },
                notes: { franchiseId: String(franchiseId), planId: String(selectedPlan.id) },
                theme: { color: "#14B8A6" },
            });

            await post("/subscriptions/confirm", {
                franchiseId,
                planId: selectedPlan.id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_signature: payment.razorpay_signature,
            });

            Alert.alert("Payment successful", "Your subscription has been activated.", [
                { text: "Done", onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            if (error?.code !== 2) {
                Alert.alert("Payment failed", error?.message || "Please try again.");
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
        <SafeAreaView className="flex-1 bg-slate-950">

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

        </SafeAreaView>
    );
};

export default SubscriptionPlansScreen;
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
import Ionicons from "react-native-vector-icons/Ionicons";
import { getSubscriptionPlans } from "../services/api";

const SubscriptionPlansScreen = ({ navigation }: any) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

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

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">

                <ActivityIndicator
                    size="large"
                    color="#14B8A6"
                />

                <Text className="text-gray-500 mt-4 font-medium">
                    Loading subscription plans...
                </Text>

            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">

            {/* Header */}
            <View className="bg-[#0E2A14] px-6 pt-5 pb-7 rounded-b-[30px]">

                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mb-5"
                >
                    <Ionicons
                        name="arrow-back"
                        size={23}
                        color="#fff"
                    />
                </TouchableOpacity>

                <Text className="text-white text-3xl font-bold">
                    Choose Your Plan
                </Text>

                <Text className="text-teal-100 mt-2 leading-6">
                    Renew your subscription and continue using Veetu Rusi.
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

                    <View className="bg-white rounded-3xl p-8 items-center mt-5">

                        <Ionicons
                            name="alert-circle-outline"
                            size={50}
                            color="#F59E0B"
                        />

                        <Text className="text-xl font-bold text-gray-800 mt-4">
                            No Plans Available
                        </Text>

                        <Text className="text-gray-500 text-center mt-2">
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
                                className={`bg-white rounded-3xl p-5 mb-4 border-2 ${
                                    selected
                                        ? "border-teal-500"
                                        : "border-gray-100"
                                }`}
                            >

                                <View className="flex-row justify-between items-start">

                                    <View className="flex-1">

                                        <Text className="text-xl font-bold text-gray-900">
                                            {plan.name}
                                        </Text>

                                        <View className="flex-row items-baseline mt-2">

                                            <Text className="text-3xl font-extrabold text-indigo-600">
                                                ₹{plan.amount}
                                            </Text>

                                        </View>

                                        <Text className="text-gray-500 mt-2">
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
                                                ? "border-teal-500"
                                                : "border-gray-300"
                                        }`}
                                    >

                                        {selected && (
                                            <View className="w-3.5 h-3.5 rounded-full bg-teal-500" />
                                        )}

                                    </View>

                                </View>


                                {/* Best Value */}
                                {plan.durationDays >= 90 && (
                                    <View className="self-start bg-indigo-100 px-3 py-1 rounded-full mt-4">

                                        <Text className="text-indigo-700 text-xs font-bold">
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
                        disabled={!selectedPlan}
                        activeOpacity={0.85}
                        onPress={() => {
                            // Razorpay will be connected in next step
                            Alert.alert(
                                "Selected Plan",
                                `${selectedPlan.name} selected`
                            );
                        }}
                        className="bg-blue-600 rounded-2xl py-4 items-center mt-4"
                    >

                        <View className="flex-row items-center">

                            <Ionicons
                                name="card-outline"
                                size={22}
                                color="#fff"
                            />

                            <Text className="text-white font-bold text-lg ml-2">
                                Proceed to Checkout
                            </Text>

                        </View>

                    </TouchableOpacity>

                )}

            </ScrollView>

        </SafeAreaView>
    );
};

export default SubscriptionPlansScreen;
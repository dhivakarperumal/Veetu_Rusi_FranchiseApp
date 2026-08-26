import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, X } from "lucide-react-native";

const SubscriptionAlert = ({
  visible,
  subscriptionInfo,
  onClose,
  onBuyClick,
}: any) => {
  if (!subscriptionInfo) return null;

  const { isExpired, daysRemaining, status } = subscriptionInfo;

  const isExpiredOrInactive =
    isExpired ||
    status !== "Active" ||
    daysRemaining === 0 ||
    daysRemaining == null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View className="flex-1 bg-slate-950/90 justify-center items-center px-5">

        {/* CARD */}
        <View
          className="w-full max-w-[390px] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden"
        >

          {/* HEADER */}
          <View
            className={`px-6 pt-10 pb-8 items-center ${
              isExpiredOrInactive ? "bg-rose-950" : "bg-amber-950"
            }`}
          >
            <View className="w-16 h-16 rounded-2xl bg-white/10 items-center justify-center mb-5">
              {isExpiredOrInactive ? <AlertTriangle size={32} color="#fb7185" /> : <Clock3 size={32} color="#fbbf24" />}
            </View>

            <Text className="text-white text-[26px] font-bold text-center">
              {isExpiredOrInactive
                ? "Subscription Expired"
                : "Subscription Expiring Soon"}
            </Text>

            <Text className="text-white/90 text-center mt-2 leading-6">
              {isExpiredOrInactive
                ? "Your access has been restricted. Renew your subscription to continue using Veetu Rusi."
                : `Your subscription expires in ${daysRemaining} day${
                    daysRemaining !== 1 ? "s" : ""
                  }.`}
            </Text>
          </View>

          {/* CONTENT */}
          <View className="px-6 py-6 bg-slate-900">

            {/* Action Box */}
            <View className="bg-slate-800 rounded-2xl p-4 border border-slate-700 mb-6">

              <View className="flex-row">

                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center ${
                    isExpiredOrInactive
                      ? "bg-rose-500/15"
                      : "bg-amber-500/15"
                  }`}
                >
                  <AlertTriangle size={24} color={isExpiredOrInactive ? "#fb7185" : "#fbbf24"} />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-white font-bold text-base">
                    {isExpiredOrInactive
                      ? "Action Required"
                      : "Renew Before Expiry"}
                  </Text>

                  <Text className="text-slate-400 mt-1 text-sm leading-5">
                    {isExpiredOrInactive
                      ? "Purchase a subscription plan to restore your account and continue receiving orders."
                      : "Renew now and avoid interruption of your franchise services."}
                  </Text>
                </View>

              </View>

            </View>

            {/* STATUS */}
            <View className="mb-6">

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-slate-400 font-semibold">
                  Current Status
                </Text>

                <View
                  className={`px-3 py-1 rounded-full ${
                    isExpiredOrInactive
                      ? "bg-rose-500/15"
                      : "bg-amber-500/15"
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      isExpiredOrInactive
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              {!isExpiredOrInactive && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400 font-semibold">
                    Days Remaining
                  </Text>

                  <Text className="text-teal-400 font-bold text-xl">
                    {daysRemaining}
                  </Text>
                </View>
              )}
            </View>

            {/* FEATURES */}
            <View className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 mb-6">

              {[
                "Unlimited Order Processing",
                "Business Analytics Dashboard",
                "Priority Customer Support",
              ].map((item) => (
                <View key={item} className="flex-row items-center mb-3">
                  <CheckCircle2 size={19} color="#2dd4bf" />
                  <Text className="ml-3 text-slate-300">{item}</Text>
                </View>
              ))}

            </View>

            {/* BUTTON */}
            <TouchableOpacity
              onPress={onBuyClick}
              className="bg-teal-500 rounded-2xl py-4 items-center"
            >
              <View className="flex-row items-center">
                <CreditCard size={21} color="#0f172a" />

                <Text className="text-slate-950 font-black text-base ml-2">
                  {isExpiredOrInactive
                    ? "View Subscription Plans"
                    : "Renew Subscription Now"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Maybe Later */}
            {!isExpiredOrInactive && (
              <TouchableOpacity
                onPress={onClose}
                className="mt-4 items-center"
              >
                <Text className="text-slate-500 font-semibold">
                  Maybe Later
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SubscriptionAlert;
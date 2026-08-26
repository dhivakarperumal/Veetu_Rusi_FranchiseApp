import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width } = Dimensions.get("window");

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
      <View className="flex-1 bg-black/70 justify-center items-center px-5">

        {/* CARD */}
        <View
          style={{ width: width - 40 }}
          className="bg-white rounded-[30px] overflow-hidden"
        >

          {/* HEADER */}
          <View
            className={`px-6 pt-10 pb-8 items-center ${
              isExpiredOrInactive ? "bg-red-600" : "bg-orange-500"
            }`}
          >
            <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-5">
              <Ionicons
                name={
                  isExpiredOrInactive
                    ? "alert-circle"
                    : "time-outline"
                }
                size={52}
                color="#fff"
              />
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
          <View className="px-6 py-6 bg-gray-50">

            {/* Action Box */}
            <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-6">

              <View className="flex-row">

                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center ${
                    isExpiredOrInactive
                      ? "bg-red-100"
                      : "bg-orange-100"
                  }`}
                >
                  <Ionicons
                    name="warning"
                    size={24}
                    color={
                      isExpiredOrInactive
                        ? "#DC2626"
                        : "#EA580C"
                    }
                  />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-bold text-base">
                    {isExpiredOrInactive
                      ? "Action Required"
                      : "Renew Before Expiry"}
                  </Text>

                  <Text className="text-gray-500 mt-1 text-sm leading-5">
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
                <Text className="text-gray-500 font-semibold">
                  Current Status
                </Text>

                <View
                  className={`px-3 py-1 rounded-full ${
                    isExpiredOrInactive
                      ? "bg-red-100"
                      : "bg-orange-100"
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      isExpiredOrInactive
                        ? "text-red-700"
                        : "text-orange-700"
                    }`}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              {!isExpiredOrInactive && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-500 font-semibold">
                    Days Remaining
                  </Text>

                  <Text className="text-blue-600 font-bold text-xl">
                    {daysRemaining}
                  </Text>
                </View>
              )}
            </View>

            {/* FEATURES */}
            <View className="bg-teal-50 rounded-2xl p-4 mb-6">

              {[
                "Unlimited Order Processing",
                "Business Analytics Dashboard",
                "Priority Customer Support",
              ].map((item) => (
                <View key={item} className="flex-row items-center mb-3">
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#14B8A6"
                  />
                  <Text className="ml-3 text-gray-700">{item}</Text>
                </View>
              ))}

            </View>

            {/* BUTTON */}
            <TouchableOpacity
              onPress={onBuyClick}
              className="bg-blue-600 rounded-2xl py-4 items-center"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="card-outline"
                  size={22}
                  color="#fff"
                />

                <Text className="text-white font-bold text-lg ml-2">
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
                <Text className="text-gray-500 font-semibold">
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
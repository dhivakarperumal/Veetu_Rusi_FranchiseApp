import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { AlertTriangle, X } from "lucide-react-native";
import { registerAlertListener, AlertRequest } from "../services/customAlert";

const AppAlertHost = () => {
  const [request, setRequest] = useState<AlertRequest | null>(null);

  useEffect(() => registerAlertListener(setRequest), []);

  if (!request) return null;

  const buttons = request.buttons?.length
    ? request.buttons
    : [{ text: "OK", onPress: () => undefined }];
  const close = () => setRequest(null);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <View className="flex-1 bg-black/80 items-center justify-center px-6">
        <View className="w-full max-w-sm bg-slate-900 border border-emerald-500/25 rounded-3xl p-6">
          <View className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center self-center mb-4">
            <AlertTriangle size={28} color="#34d399" />
          </View>
          <Text className="text-white text-xl font-black text-center">{request.title}</Text>
          {request.message ? (
            <Text className="text-slate-400 text-sm text-center leading-5 mt-2">
              {request.message}
            </Text>
          ) : null}
          <View className="flex-row gap-3 mt-6">
            {buttons.map((button, index) => {
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  onPress={() => {
                    close();
                    button.onPress?.();
                  }}
                  className={`flex-1 rounded-2xl py-3.5 items-center ${
                    isCancel
                      ? "bg-slate-800 border border-white/10"
                      : isDestructive
                      ? "bg-red-600"
                      : "bg-emerald-600"
                  }`}
                >
                  <Text className="text-white font-black text-xs uppercase">
                    {button.text || "OK"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 items-center justify-center"
          >
            <X size={15} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AppAlertHost;

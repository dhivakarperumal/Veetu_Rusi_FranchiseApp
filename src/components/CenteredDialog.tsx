import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { CheckCircle, X } from "lucide-react-native";

type CenteredDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  actionLabel?: string;
};

const CenteredDialog = ({
  visible,
  title,
  message,
  onClose,
  actionLabel = "Done",
}: CenteredDialogProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    navigationBarTranslucent
    onRequestClose={onClose}
  >
    <View className="flex-1 bg-black/80 items-center justify-center px-6">
      <View className="w-full max-w-sm bg-slate-900 border border-emerald-500/25 rounded-3xl p-6 items-center">
        <View className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mb-4">
          <CheckCircle size={32} color="#34d399" />
        </View>
        <Text className="text-white text-xl font-black text-center">{title}</Text>
        <Text className="text-slate-400 text-sm text-center leading-5 mt-2">{message}</Text>
        <TouchableOpacity
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="w-full bg-emerald-600 rounded-2xl py-3.5 items-center mt-6"
        >
          <Text className="text-white font-black text-xs uppercase">{actionLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
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

export default CenteredDialog;

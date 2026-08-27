import React from "react";
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { LogOut, X } from "lucide-react-native";

type LogoutConfirmModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

const LogoutConfirmModal = ({
  visible,
  onConfirm,
  onCancel,
  loading = false,
}: LogoutConfirmModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-slate-950/85 items-center justify-center px-6">
        <View className="w-full max-w-[360px] bg-slate-900 border border-slate-700 rounded-3xl p-6 items-center shadow-2xl relative">
          {/* Close button */}
          <TouchableOpacity
            onPress={onCancel}
            disabled={loading}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700"
          >
            <X size={15} color="#94a3b8" />
          </TouchableOpacity>

          {/* Icon */}
          <View className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 items-center justify-center mb-4">
            <LogOut size={28} color="#fb7185" />
          </View>

          {/* Title & Message */}
          <Text className="text-white text-xl font-black text-center">
            Sign Out?
          </Text>
          <Text className="text-slate-400 text-sm text-center leading-5 mt-2 px-2">
            Are you sure you want to log out of your franchise portal?
          </Text>

          {/* Action Buttons */}
          <View className="w-full flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl py-3.5 items-center justify-center"
            >
              <Text className="text-slate-300 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className="flex-1 bg-rose-600 rounded-2xl py-3.5 items-center justify-center flex-row"
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <LogOut size={16} color="#fff" />
                  <Text className="text-white font-black text-sm ml-1.5">
                    Log Out
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutConfirmModal;

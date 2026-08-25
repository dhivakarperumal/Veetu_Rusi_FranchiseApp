import React from "react";
import { TouchableOpacity } from "react-native";
import { Plus } from "lucide-react-native";

type FloatingActionButtonProps = {
  onPress: () => void;
  label?: string;
};

const FloatingActionButton = ({
  onPress,
  label = "Create new item",
}: FloatingActionButtonProps) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    className="absolute right-5 bottom-6 w-16 h-16 rounded-full bg-emerald-600 items-center justify-center shadow-lg"
    style={{ elevation: 9 }}
  >
    <Plus size={30} color="#ffffff" strokeWidth={2.5} />
  </TouchableOpacity>
);

export default FloatingActionButton;

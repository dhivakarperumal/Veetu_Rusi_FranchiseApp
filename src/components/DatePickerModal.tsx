import React from "react";
import { Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

interface DatePickerModalProps {
  visible: boolean;
  title?: string;
  initialDate?: string; // "YYYY-MM-DD"
  onClose: () => void;
  onSelectDate: (dateString: string) => void;
}

const safeParseDate = (dateStr?: string): Date => {
  if (dateStr && typeof dateStr === "string") {
    const cleanStr = dateStr.split("T")[0].split(" ")[0].trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
      const parts = cleanStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date();
};

const formatDateString = (d: Date): string => {
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  initialDate,
  onClose,
  onSelectDate,
}) => {
  if (!visible) return null;

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    onClose();
    if (event.type === "set" && selectedDate) {
      const str = formatDateString(selectedDate);
      if (str) {
        onSelectDate(str);
      }
    }
  };

  return (
    <DateTimePicker
      value={safeParseDate(initialDate)}
      mode="date"
      display={Platform.OS === "ios" ? "spinner" : "default"}
      onChange={handleChange}
    />
  );
};

export default DatePickerModal;

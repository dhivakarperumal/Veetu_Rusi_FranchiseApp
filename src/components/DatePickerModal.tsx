import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
} from "react-native";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Check,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DatePickerModalProps {
  visible: boolean;
  title?: string;
  initialDate?: string; // "YYYY-MM-DD"
  onClose: () => void;
  onSelectDate: (dateString: string) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  title = "Select Date",
  initialDate,
  onClose,
  onSelectDate,
}) => {
  const insets = useSafeAreaInsets();

  const parseInitialDate = () => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const parts = initialDate.split("-").map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(parseInitialDate());
  const [selectedDate, setSelectedDate] = useState<Date>(parseInitialDate());

  useEffect(() => {
    if (visible) {
      const parsed = parseInitialDate();
      setCurrentMonth(parsed);
      setSelectedDate(parsed);
    }
  }, [visible, initialDate]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
  };

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const handleConfirm = () => {
    onSelectDate(formatDateString(selectedDate));
    onClose();
  };

  const setPresetDays = (monthsToAdd: number) => {
    const now = new Date();
    now.setMonth(now.getMonth() + monthsToAdd);
    setSelectedDate(now);
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const isSelected = (day: number) => {
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  // Generate 7-column rows
  const gridCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    gridCells.push(day);
  }
  while (gridCells.length % 7 !== 0) {
    gridCells.push(null);
  }

  const rows: (number | null)[][] = [];
  for (let i = 0; i < gridCells.length; i += 7) {
    rows.push(gridCells.slice(i, i + 7));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View
          className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 16 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mr-2.5">
                <CalendarIcon size={16} color="#34d399" />
              </View>
              <Text className="text-white text-base font-black uppercase tracking-wide">
                {title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 items-center justify-center"
            >
              <X size={16} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View className="flex-row gap-1.5 mb-4">
            <TouchableOpacity
              onPress={() => setPresetDays(0)}
              className="flex-1 bg-slate-950 border border-slate-800 py-2 rounded-xl items-center"
            >
              <Text className="text-emerald-400 text-[10px] font-black uppercase">
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPresetDays(3)}
              className="flex-1 bg-slate-950 border border-slate-800 py-2 rounded-xl items-center"
            >
              <Text className="text-slate-300 text-[10px] font-bold uppercase">
                +3 Months
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPresetDays(6)}
              className="flex-1 bg-slate-950 border border-slate-800 py-2 rounded-xl items-center"
            >
              <Text className="text-slate-300 text-[10px] font-bold uppercase">
                +6 Months
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPresetDays(12)}
              className="flex-1 bg-slate-950 border border-slate-800 py-2 rounded-xl items-center"
            >
              <Text className="text-slate-300 text-[10px] font-bold uppercase">
                +1 Year
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View className="flex-row items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 mb-3.5">
            <TouchableOpacity
              onPress={prevMonth}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 items-center justify-center"
            >
              <ChevronLeft size={16} color="#ffffff" />
            </TouchableOpacity>

            <Text className="text-white font-black text-sm uppercase tracking-wider">
              {MONTH_NAMES[month]} {year}
            </Text>

            <TouchableOpacity
              onPress={nextMonth}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 items-center justify-center"
            >
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header (7 Equal Columns) */}
          <View className="flex-row mb-2">
            {DAYS_OF_WEEK.map((d, i) => (
              <View key={i} className="flex-1 items-center justify-center py-1">
                <Text className="text-slate-500 font-bold text-[10px] uppercase">
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid (Strict 7 Columns per Row) */}
          <View className="mb-4">
            {rows.map((row, rIdx) => (
              <View key={rIdx} className="flex-row mb-1.5">
                {row.map((day, cIdx) => {
                  if (day === null) {
                    return (
                      <View
                        key={cIdx}
                        className="flex-1 aspect-square p-0.5"
                      />
                    );
                  }

                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <View key={cIdx} className="flex-1 aspect-square p-0.5">
                      <TouchableOpacity
                        onPress={() => handleDateClick(day)}
                        className={`w-full h-full rounded-xl items-center justify-center ${
                          selected
                            ? "bg-emerald-600 shadow-md"
                            : today
                            ? "bg-slate-800 border border-emerald-500/40"
                            : "bg-slate-950 border border-slate-800/60"
                        }`}
                      >
                        <Text
                          className={`text-xs font-black ${
                            selected
                              ? "text-white"
                              : today
                              ? "text-emerald-400"
                              : "text-slate-300"
                          }`}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Selected Date Summary & Actions with Safe Area Bottom Padding */}
          <View className="flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
            <View className="flex-1">
              <Text className="text-slate-400 text-[10px] font-black uppercase">
                Selected Date
              </Text>
              <Text className="text-emerald-400 font-mono font-bold text-sm mt-0.5">
                {formatDateString(selectedDate)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleConfirm}
              className="bg-emerald-600 px-6 py-3.5 rounded-2xl flex-row items-center justify-center shadow-lg"
            >
              <Check size={16} color="#ffffff" />
              <Text className="text-white font-black text-xs uppercase tracking-wider ml-1.5">
                Set Date
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DatePickerModal;

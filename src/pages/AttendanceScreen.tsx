import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import InnerHeader from "../components/InnerHeader";
import { Alert } from "../services/customAlert";
import { get } from "../services/api";

type AttendanceKind = "deliveryPartner" | "homeChef";
type DateFilter = "today" | "7days" | "30days" | "custom";

type AttendanceScreenProps = {
  kind: AttendanceKind;
};

type AttendanceRecord = {
  id: string | number;
  attendance_date?: string;
  check_in_at?: string;
  check_out_at?: string | null;
  check_in_address?: string;
  check_out_address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  check_out_latitude?: number | string | null;
  check_out_longitude?: number | string | null;
  mobile?: string;
  delivery_partner_name?: string;
  delivery_partner_user_id?: string | number;
  home_chef_name?: string;
  home_chef_user_id?: string | number;
};

const PAGE_SIZE = 10;
const dateFilters: { label: string; value: DateFilter }[] = [
  { label: "Today", value: "today" },
  { label: "7 days", value: "7days" },
  { label: "30 days", value: "30days" },
  { label: "Custom", value: "custom" },
];

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const getDateRange = (filter: DateFilter, startDate: string, endDate: string) => {
  const end = new Date();
  const start = new Date();
  if (filter === "7days") start.setDate(start.getDate() - 6);
  if (filter === "30days") start.setDate(start.getDate() - 29);
  return filter === "custom"
    ? { startDate, endDate }
    : { startDate: toDateKey(start), endDate: toDateKey(end) };
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = fromDateKey(value.slice(0, 10));
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};

const AttendanceScreen = ({ kind }: AttendanceScreenProps) => {
  const navigation = useNavigation<any>();
  const isPartner = kind === "deliveryPartner";
  const title = isPartner ? "Delivery partner attendance" : "Home chef attendance";
  const endpoint = isPartner
    ? "/admin/delivery-partners/attendance"
    : "/admin/home-chefs/attendance";
  const nameField = isPartner ? "delivery_partner_name" : "home_chef_name";
  const idField = isPartner ? "delivery_partner_user_id" : "home_chef_user_id";
  const defaultName = isPartner ? "Delivery Partner" : "Home Chef";

  const today = toDateKey(new Date());
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [customStartDate, setCustomStartDate] = useState(today);
  const [customEndDate, setCustomEndDate] = useState(today);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [personFilter, setPersonFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [datePicker, setDatePicker] = useState<"start" | "end" | null>(null);
  const [draftDate, setDraftDate] = useState(new Date());

  const loadAttendance = useCallback(async () => {
    const range = getDateRange(dateFilter, customStartDate, customEndDate);
    const query = `?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}`;
    const response: any = await get(`${endpoint}${query}`);
    const data = Array.isArray(response) ? response : response?.data;
    return Array.isArray(data) ? data as AttendanceRecord[] : [];
  }, [customEndDate, customStartDate, dateFilter, endpoint]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadAttendance()
      .then((data) => {
        if (active) setRecords(data);
      })
      .catch((error: any) => {
        if (active) Alert.alert("Unable to load attendance", error?.message || "Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadAttendance]);

  const refreshAttendance = async () => {
    setRefreshing(true);
    try {
      setRecords(await loadAttendance());
    } catch (error: any) {
      Alert.alert("Unable to refresh attendance", error?.message || "Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const getPersonName = useCallback(
    (record: AttendanceRecord) => String(record[nameField as keyof AttendanceRecord] || defaultName),
    [defaultName, nameField]
  );
  const getPersonId = useCallback(
    (record: AttendanceRecord) => String(record[idField as keyof AttendanceRecord] || ""),
    [idField]
  );

  const people = useMemo(() => {
    const uniquePeople = new Map<string, string>();
    records.forEach((record) => {
      const id = getPersonId(record);
      const name = getPersonName(record);
      uniquePeople.set(id || `name:${name}`, name);
    });
    return [...uniquePeople.entries()];
  }, [getPersonId, getPersonName, records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const id = getPersonId(record);
      const name = getPersonName(record);
      const key = id || `name:${name}`;
      const matchesSearch = !query || `${name} ${id}`.toLowerCase().includes(query);
      return (personFilter === "all" || personFilter === key) && matchesSearch;
    });
  }, [getPersonId, getPersonName, personFilter, records, search]);

  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const pageRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeCount = records.filter((record) => !record.check_out_at).length;
  const completedCount = records.length - activeCount;

  const changeDateFilter = (filter: DateFilter) => {
    setDateFilter(filter);
    setCurrentPage(1);
  };

  const applyDate = (date: Date) => {
    if (datePicker === "start") {
      const nextStart = toDateKey(date);
      setCustomStartDate(nextStart);
      if (nextStart > customEndDate) setCustomEndDate(nextStart);
    } else if (datePicker === "end") {
      const nextEnd = toDateKey(date);
      setCustomEndDate(nextEnd);
      if (nextEnd < customStartDate) setCustomStartDate(nextEnd);
    }
    setCurrentPage(1);
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") {
      setDatePicker(null);
      return;
    }
    if (!date) return;
    setDraftDate(date);
    if (Platform.OS === "android") {
      applyDate(date);
      setDatePicker(null);
    }
  };

  const openMap = (latitude?: number | string | null, longitude?: number | string | null) => {
    if (latitude == null || longitude == null || latitude === "" || longitude === "") return;
    Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`).catch(() => {
      Alert.alert("Unable to open map", "Please check that a maps app is available.");
    });
  };

  const renderSession = ({ item }: { item: AttendanceRecord }) => {
    const name = getPersonName(item);
    const userId = getPersonId(item);
    const hasCheckInLocation = item.latitude != null && item.longitude != null;
    const hasCheckOutLocation = item.check_out_latitude != null && item.check_out_longitude != null;
    return (
      <View className="mb-3 rounded-2xl border border-white/10 bg-slate-900 p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-extrabold text-white">{name}</Text>
            <Text className="mt-1 text-xs text-slate-400">{userId ? `ID ${userId} · ` : ""}{formatDate(item.attendance_date)}</Text>
          </View>
          <View className={`rounded-full px-3 py-1 ${item.check_out_at ? "bg-slate-700" : "bg-emerald-500/15"}`}>
            <Text className={`text-xs font-bold ${item.check_out_at ? "text-slate-300" : "text-emerald-300"}`}>
              {item.check_out_at ? "Completed" : "Active"}
            </Text>
          </View>
        </View>
        <View className="mt-4 flex-row gap-3">
          <View className="flex-1 rounded-xl bg-slate-950 p-3">
            <View className="flex-row items-center gap-2"><Clock3 size={14} color="#34d399" /><Text className="text-[11px] font-bold uppercase text-slate-400">Check-in</Text></View>
            <Text className="mt-2 text-sm font-bold text-white">{formatTime(item.check_in_at)}</Text>
            <Text className="mt-1 text-xs leading-5 text-slate-400">{item.check_in_address || "Address unavailable"}</Text>
            {hasCheckInLocation && <TouchableOpacity onPress={() => openMap(item.latitude, item.longitude)} className="mt-3 flex-row items-center gap-1"><MapPin size={14} color="#6ee7b7" /><Text className="text-xs font-bold text-emerald-300">Open map</Text></TouchableOpacity>}
          </View>
          <View className="flex-1 rounded-xl bg-slate-950 p-3">
            <View className="flex-row items-center gap-2"><Clock3 size={14} color="#94a3b8" /><Text className="text-[11px] font-bold uppercase text-slate-400">Check-out</Text></View>
            <Text className="mt-2 text-sm font-bold text-white">{formatTime(item.check_out_at)}</Text>
            {item.check_out_at ? <Text className="mt-1 text-xs leading-5 text-slate-400">{item.check_out_address || "Address unavailable"}</Text> : <Text className="mt-1 text-xs leading-5 text-slate-500">Session in progress</Text>}
            {item.check_out_at && hasCheckOutLocation && <TouchableOpacity onPress={() => openMap(item.check_out_latitude, item.check_out_longitude)} className="mt-3 flex-row items-center gap-1"><MapPin size={14} color="#6ee7b7" /><Text className="text-xs font-bold text-emerald-300">Open map</Text></TouchableOpacity>}
          </View>
        </View>
        {!!item.mobile && <Text className="mt-3 text-xs text-slate-400">Phone: {item.mobile}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["bottom"]}>
      <InnerHeader title={title} navigation={navigation} />
      <FlatList
        data={pageRecords}
        keyExtractor={(item, index) => String(item.id ?? `${getPersonId(item)}-${item.check_in_at}-${index}`)}
        renderItem={renderSession}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAttendance} tintColor="#34d399" colors={["#34d399"]} />}
        ListHeaderComponent={(
          <View>
            <View className="mb-4 mt-5 flex-row gap-2">
              {[
                { label: "Sessions", value: records.length, color: "text-white" },
                { label: "Active", value: activeCount, color: "text-emerald-300" },
                { label: "Completed", value: completedCount, color: "text-slate-300" },
              ].map((item) => (
                <View key={item.label} className="flex-1 rounded-2xl border border-white/10 bg-slate-900 p-3">
                  <Text className="text-[10px] font-bold uppercase text-slate-400">{item.label}</Text>
                  <Text className={`mt-1 text-2xl font-black ${item.color}`}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View className="mb-4 rounded-2xl border border-white/10 bg-slate-900 p-3">
              <View className="flex-row items-center rounded-xl border border-white/10 bg-slate-950 px-3">
                <Search size={17} color="#94a3b8" />
                <TextInput
                  value={search}
                  onChangeText={(value) => { setSearch(value); setCurrentPage(1); }}
                  placeholder={`Search ${isPartner ? "delivery partners" : "home chefs"}...`}
                  placeholderTextColor="#64748b"
                  className="ml-2 flex-1 py-3 text-sm text-white"
                  accessibilityLabel={`Search ${isPartner ? "delivery partner" : "home chef"} attendance`}
                />
                {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><X size={16} color="#94a3b8" /></TouchableOpacity>}
              </View>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {dateFilters.map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    onPress={() => changeDateFilter(filter.value)}
                    className={`rounded-xl border px-3 py-2 ${dateFilter === filter.value ? "border-emerald-500/40 bg-emerald-500/15" : "border-white/10 bg-slate-950"}`}
                  >
                    <Text className={`text-xs font-bold ${dateFilter === filter.value ? "text-emerald-300" : "text-slate-400"}`}>{filter.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setFilterOpen(true)} className="flex-row items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2">
                  <SlidersHorizontal size={14} color="#cbd5e1" />
                  <Text className="max-w-36 text-xs font-bold text-slate-300" numberOfLines={1}>{personFilter === "all" ? "All people" : people.find(([key]) => key === personFilter)?.[1] || "Person"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={refreshAttendance} disabled={loading || refreshing} accessibilityLabel="Refresh attendance" className="ml-auto h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-950">
                  <RefreshCw size={15} color="#cbd5e1" />
                </TouchableOpacity>
              </View>
              {dateFilter === "custom" && (
                <View className="mt-3 flex-row gap-2">
                  {(["start", "end"] as const).map((edge) => (
                    <TouchableOpacity key={edge} onPress={() => { setDraftDate(fromDateKey(edge === "start" ? customStartDate : customEndDate)); setDatePicker(edge); }} className="flex-1 flex-row items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5">
                      <CalendarDays size={15} color="#34d399" />
                      <Text className="text-xs font-semibold text-slate-200">{edge === "start" ? customStartDate : customEndDate}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-base font-extrabold text-white">Attendance sessions</Text>
              <Text className="text-xs text-slate-400">{filteredRecords.length} {filteredRecords.length === 1 ? "session" : "sessions"}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={loading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="#34d399" />
            <Text className="mt-3 text-sm text-slate-400">Loading attendance</Text>
          </View>
        ) : (
          <View className="items-center rounded-2xl border border-white/10 bg-slate-900 px-5 py-10">
            <CalendarDays size={28} color="#64748b" />
            <Text className="mt-3 text-center font-bold text-slate-200">{records.length ? "No sessions match these filters." : "No attendance sessions in this date range."}</Text>
            <Text className="mt-2 text-center text-xs text-slate-400">Sessions will appear here when they are recorded.</Text>
          </View>
        )}
        ListFooterComponent={filteredRecords.length > 0 ? (
          <View className="mb-4 mt-1 flex-row items-center justify-between">
            <Text className="text-xs text-slate-400">Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}</Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity disabled={safePage === 1} onPress={() => setCurrentPage((page) => Math.max(1, page - 1))} className="h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900" style={{ opacity: safePage === 1 ? 0.4 : 1 }}><ChevronLeft size={17} color="#e2e8f0" /></TouchableOpacity>
              <Text className="text-xs text-slate-300">Page {safePage} of {totalPages}</Text>
              <TouchableOpacity disabled={safePage === totalPages} onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-slate-900" style={{ opacity: safePage === totalPages ? 0.4 : 1 }}><ChevronRight size={17} color="#e2e8f0" /></TouchableOpacity>
            </View>
          </View>
        ) : null}
      />

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <View className="flex-1 justify-end bg-black/70">
          <View className="rounded-t-3xl border-t border-white/10 bg-slate-900 p-5">
            <View className="mb-4 flex-row items-center justify-between"><Text className="text-base font-black text-white">Filter by {isPartner ? "delivery partner" : "home chef"}</Text><TouchableOpacity onPress={() => setFilterOpen(false)}><X size={19} color="#cbd5e1" /></TouchableOpacity></View>
            <TouchableOpacity onPress={() => { setPersonFilter("all"); setCurrentPage(1); setFilterOpen(false); }} className={`mb-2 rounded-xl border px-4 py-3 ${personFilter === "all" ? "border-emerald-500/40 bg-emerald-500/15" : "border-white/10 bg-slate-950"}`}><Text className={`text-sm font-bold ${personFilter === "all" ? "text-emerald-300" : "text-slate-300"}`}>All people</Text></TouchableOpacity>
            <FlatList
              data={people}
              keyExtractor={([key]) => key}
              style={{ maxHeight: 320 }}
              renderItem={({ item: [key, name] }) => (
                <TouchableOpacity onPress={() => { setPersonFilter(key); setCurrentPage(1); setFilterOpen(false); }} className={`mb-2 rounded-xl border px-4 py-3 ${personFilter === key ? "border-emerald-500/40 bg-emerald-500/15" : "border-white/10 bg-slate-950"}`}>
                  <Text className={`text-sm font-bold ${personFilter === key ? "text-emerald-300" : "text-slate-300"}`}>{name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={datePicker !== null} transparent animationType="fade" onRequestClose={() => setDatePicker(null)}>
        <View className="flex-1 items-center justify-center bg-black/70 px-5">
          <View className="w-full rounded-2xl bg-slate-900 p-4">
            <View className="mb-2 flex-row items-center justify-between"><Text className="font-bold text-white">Select {datePicker === "start" ? "start" : "end"} date</Text><TouchableOpacity onPress={() => setDatePicker(null)}><X size={18} color="#cbd5e1" /></TouchableOpacity></View>
            {datePicker && <DateTimePicker value={draftDate} mode="date" display="spinner" maximumDate={new Date()} onChange={handleDateChange} />}
            <TouchableOpacity onPress={() => { if (Platform.OS === "ios") applyDate(draftDate); setDatePicker(null); }} className="mt-2 items-center rounded-xl bg-emerald-600 py-3"><Text className="font-bold text-white">Done</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AttendanceScreen;
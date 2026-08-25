import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Camera,
  Image as ImageIcon,
  X,
  UploadCloud,
  CheckCircle,
} from "lucide-react-native";
import {
  launchImageLibrary,
  launchCamera,
  ImageLibraryOptions,
  CameraOptions,
  Asset,
} from "react-native-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { get, put } from "../services/api";
import CenteredDialog from "../components/CenteredDialog";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Puducherry",
];

const VEHICLE_BRANDS = [
  "Honda",
  "Yamaha",
  "Bajaj",
  "Hero",
  "TVS",
  "Suzuki",
  "Royal Enfield",
  "KTM",
  "Kawasaki",
  "Ather",
  "Ola Electric",
  "Other",
];

const STEPS = [
  { id: 1, label: "Personal", title: "Personal Details" },
  { id: 2, label: "Address", title: "Address & Location" },
  { id: 3, label: "Emergency", title: "Emergency Contact" },
  { id: 4, label: "Vehicle", title: "Vehicle Information" },
  { id: 5, label: "Driving", title: "Driving License" },
  { id: 6, label: "Bank", title: "Bank & Identity" },
  { id: 7, label: "Documents", title: "Document Uploads" },
  { id: 8, label: "Preferences", title: "Work Preferences" },
  { id: 9, label: "Review", title: "Review & Update" },
];

const EditDeliveryPartner = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { partnerId, partner: initialPartner } = route.params || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialPartner && !!partnerId);

  const [form, setForm] = useState<any>({
    first_name: "",
    last_name: "",
    gender: "Male",
    date_of_birth: "",
    age: "",
    blood_group: "O+",
    mobile: "",
    alt_mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_photo: null as Asset | string | null,

    current_address: "",
    permanent_address: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    latitude: "",
    longitude: "",
    live_location: "",

    emergency_contact_name: "",
    emergency_contact_relationship: "Parent",
    emergency_contact_mobile: "",

    vehicle_type: "Bike",
    vehicle_brand: "Honda",
    vehicle_model: "",
    vehicle_number: "",
    vehicle_color: "Black",
    vehicle_front_photo: null as Asset | string | null,
    vehicle_back_photo: null as Asset | string | null,

    license_number: "",
    license_holder_name: "",
    license_issue_date: "",
    license_expiry_date: "",
    license_front_image: null as Asset | string | null,
    license_back_image: null as Asset | string | null,

    account_holder_name: "",
    bank_name: "",
    bank_account_number: "",
    ifsc_code: "",
    branch_name: "",
    upi_id: "",
    aadhaar_number: "",
    pan_number: "",

    aadhaar_front_url: null as Asset | string | null,
    aadhaar_back_url: null as Asset | string | null,
    pan_card_url: null as Asset | string | null,
    selfie_verification_url: null as Asset | string | null,
    selfie_with_vehicle: null as Asset | string | null,
    selfie_with_aadhaar: null as Asset | string | null,

    available_areas: "",
    available_time_morning: true,
    available_time_afternoon: true,
    available_time_evening: true,
    available_time_night: false,
    preferred_distance: "3 KM",
    delivery_radius: "5",
    driving_experience: "2",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Pickers modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string>("date_of_birth");
  const [tempYear, setTempYear] = useState(1995);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(15);

  const [showStateModal, setShowStateModal] = useState(false);
  const [stateSearch, setStateSearch] = useState("");

  const [showBrandModal, setShowBrandModal] = useState(false);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [currentUploadKey, setCurrentUploadKey] = useState<string>("");
  const [successVisible, setSuccessVisible] = useState(false);

  const loadPartner = useCallback(async () => {
    try {
      setInitialLoading(true);
      const res: any = await get(`/admin/delivery-partners/${partnerId}`);
      const data = res?.data || res;
      if (data) {
        populatePartnerData(data);
      }
    } catch (e) {
      console.log("Failed to load delivery partner for edit", e);
    } finally {
      setInitialLoading(false);
    }
  }, [partnerId]);

  useEffect(() => {
    if (initialPartner) {
      populatePartnerData(initialPartner);
    } else if (partnerId) {
      loadPartner();
    }
  }, [partnerId, initialPartner, loadPartner]);

  const populatePartnerData = (p: any) => {
    setForm({
      first_name: p.first_name || p.name?.split(" ")[0] || "",
      last_name: p.last_name || p.name?.split(" ").slice(1).join(" ") || "",
      gender: p.gender || "Male",
      date_of_birth: p.date_of_birth ? p.date_of_birth.substring(0, 10) : "",
      age: p.age ? String(p.age) : "",
      blood_group: p.blood_group || "O+",
      mobile: p.mobile || "",
      alt_mobile: p.alt_mobile || "",
      email: p.email || "",
      password: "",
      confirmPassword: "",
      profile_photo: p.profile_photo || null,

      current_address: p.current_address || "",
      permanent_address: p.permanent_address || "",
      city: p.city || "",
      state: p.state || "Tamil Nadu",
      pincode: p.pincode || "",
      latitude: p.latitude ? String(p.latitude) : "",
      longitude: p.longitude ? String(p.longitude) : "",
      live_location: p.live_location || "",

      emergency_contact_name: p.emergency_contact_name || "",
      emergency_contact_relationship: p.emergency_contact_relationship || "Parent",
      emergency_contact_mobile: p.emergency_contact_mobile || "",

      vehicle_type: p.vehicle_type || "Bike",
      vehicle_brand: p.vehicle_brand || "Honda",
      vehicle_model: p.vehicle_model || "",
      vehicle_number: p.vehicle_number || "",
      vehicle_color: p.vehicle_color || "Black",
      vehicle_front_photo: p.vehicle_front_photo || null,
      vehicle_back_photo: p.vehicle_back_photo || null,

      license_number: p.license_number || "",
      license_holder_name: p.license_holder_name || "",
      license_issue_date: p.license_issue_date ? p.license_issue_date.substring(0, 10) : "",
      license_expiry_date: p.license_expiry_date ? p.license_expiry_date.substring(0, 10) : "",
      license_front_image: p.license_front_image || null,
      license_back_image: p.license_back_image || null,

      account_holder_name: p.account_holder_name || "",
      bank_name: p.bank_name || "",
      bank_account_number: p.bank_account_number || "",
      ifsc_code: p.ifsc_code || "",
      branch_name: p.branch_name || "",
      upi_id: p.upi_id || "",
      aadhaar_number: p.aadhaar_number || "",
      pan_number: p.pan_number || "",

      aadhaar_front_url: p.aadhaar_front_url || null,
      aadhaar_back_url: p.aadhaar_back_url || null,
      pan_card_url: p.pan_card_url || null,
      selfie_verification_url: p.selfie_verification_url || null,
      selfie_with_vehicle: p.selfie_with_vehicle || null,
      selfie_with_aadhaar: p.selfie_with_aadhaar || null,

      available_areas: p.available_areas || "",
      available_time_morning: !!p.available_time_morning,
      available_time_afternoon: !!p.available_time_afternoon,
      available_time_evening: !!p.available_time_evening,
      available_time_night: !!p.available_time_night,
      preferred_distance: p.preferred_distance || "3 KM",
      delivery_radius: p.delivery_radius ? String(p.delivery_radius) : "5",
      driving_experience: p.driving_experience ? String(p.driving_experience) : "2",
    });
  };

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const openDatePickerModal = (field: string) => {
    setDatePickerField(field);
    const curVal = form[field];
    if (curVal && curVal.includes("-")) {
      const parts = curVal.split("-");
      setTempYear(parseInt(parts[0], 10) || 1995);
      setTempMonth(parseInt(parts[1], 10) || 1);
      setTempDay(parseInt(parts[2], 10) || 15);
    }
    setShowDatePicker(true);
  };

  const confirmDate = () => {
    const formatted = `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(
      tempDay
    ).padStart(2, "0")}`;
    updateField(datePickerField, formatted);
    if (datePickerField === "date_of_birth") {
      const b = new Date(formatted);
      const t = new Date();
      let a = t.getFullYear() - b.getFullYear();
      const m = t.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
      updateField("age", a >= 0 ? String(a) : "");
    }
    setShowDatePicker(false);
  };

  const openMediaPicker = (key: string) => {
    setCurrentUploadKey(key);
    setUploadModalVisible(true);
  };

  const handlePickFromLibrary = async () => {
    setUploadModalVisible(false);
    const options: ImageLibraryOptions = {
      mediaType: "photo",
      quality: 0.8,
    };
    const res = await launchImageLibrary(options);
    if (res.assets && res.assets.length > 0) {
      updateField(currentUploadKey, res.assets[0]);
    }
  };

  const handleTakePhoto = async () => {
    setUploadModalVisible(false);
    const options: CameraOptions = {
      mediaType: "photo",
      quality: 0.8,
    };
    const res = await launchCamera(options);
    if (res.assets && res.assets.length > 0) {
      updateField(currentUploadKey, res.assets[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const targetId = partnerId || initialPartner?.id;
      if (!targetId) {
        Alert.alert("Error", "No delivery partner ID specified.");
        return;
      }

      const formData = new FormData();
      formData.append(
        "name",
        `${form.first_name || ""} ${form.last_name || ""}`.trim()
      );
      formData.append("first_name", form.first_name);
      formData.append("last_name", form.last_name);
      formData.append("gender", form.gender);
      formData.append("date_of_birth", form.date_of_birth);
      formData.append("age", form.age);
      formData.append("blood_group", form.blood_group);
      formData.append("mobile", form.mobile);
      formData.append("alt_mobile", form.alt_mobile);
      formData.append("email", form.email);
      if (form.password) {
        formData.append("password", form.password);
      }

      formData.append("current_address", form.current_address);
      formData.append("permanent_address", form.permanent_address);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("pincode", form.pincode);
      formData.append("latitude", form.latitude);
      formData.append("longitude", form.longitude);
      formData.append("live_location", form.live_location);

      formData.append("emergency_contact_name", form.emergency_contact_name);
      formData.append("emergency_contact_relationship", form.emergency_contact_relationship);
      formData.append("emergency_contact_mobile", form.emergency_contact_mobile);

      formData.append("vehicle_type", form.vehicle_type);
      formData.append("vehicle_brand", form.vehicle_brand);
      formData.append("vehicle_model", form.vehicle_model);
      formData.append("vehicle_number", form.vehicle_number);
      formData.append("vehicle_color", form.vehicle_color);

      formData.append("license_number", form.license_number);
      formData.append("license_holder_name", form.license_holder_name);
      formData.append("license_issue_date", form.license_issue_date);
      formData.append("license_expiry_date", form.license_expiry_date);

      formData.append("account_holder_name", form.account_holder_name);
      formData.append("bank_name", form.bank_name);
      formData.append("bank_account_number", form.bank_account_number);
      formData.append("ifsc_code", form.ifsc_code);
      formData.append("branch_name", form.branch_name);
      formData.append("upi_id", form.upi_id);
      formData.append("aadhaar_number", form.aadhaar_number);
      formData.append("pan_number", form.pan_number);

      formData.append("available_areas", form.available_areas);
      formData.append("available_time_morning", form.available_time_morning ? "1" : "0");
      formData.append("available_time_afternoon", form.available_time_afternoon ? "1" : "0");
      formData.append("available_time_evening", form.available_time_evening ? "1" : "0");
      formData.append("available_time_night", form.available_time_night ? "1" : "0");
      formData.append("preferred_distance", form.preferred_distance);
      formData.append("delivery_radius", form.delivery_radius);
      formData.append("driving_experience", form.driving_experience);

      const fileKeys = [
        "profile_photo",
        "vehicle_front_photo",
        "vehicle_back_photo",
        "license_front_image",
        "license_back_image",
        "aadhaar_front_url",
        "aadhaar_back_url",
        "pan_card_url",
        "selfie_verification_url",
        "selfie_with_vehicle",
        "selfie_with_aadhaar",
      ];

      fileKeys.forEach((key) => {
        const val = form[key];
        if (val && typeof val === "object" && val.uri) {
          formData.append(key, {
            uri: val.uri,
            name: val.fileName || `${key}.jpg`,
            type: val.type || "image/jpeg",
          } as any);
        }
      });

      await put(`/admin/delivery-partners/${targetId}`, formData);

      setSuccessVisible(true);
    } catch (err: any) {
      console.log("Delivery partner update error:", err);
      Alert.alert("Error", err.message || "Failed to update delivery partner.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-3 text-xs font-semibold">
          Loading Partner Information...
        </Text>
      </View>
    );
  }

  const renderFileInput = (key: string, label: string) => {
    const val = form[key];
    const hasFile = val !== null && val !== undefined;

    return (
      <View className="mb-4">
        <Text className="text-slate-300 text-xs font-bold uppercase mb-2">
          {label}
        </Text>
        <TouchableOpacity
          onPress={() => openMediaPicker(key)}
          className="bg-slate-900 border border-dashed border-emerald-500/40 rounded-2xl p-4 items-center justify-center"
        >
          <UploadCloud size={24} color="#34d399" />
          <Text className="text-white text-xs font-bold mt-2">
            {hasFile ? "Change File" : "Tap to Upload"}
          </Text>
        </TouchableOpacity>

        {hasFile && (
          <View className="mt-2">
            {typeof val === "object" && val?.uri ? (
              <View className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                <Image source={{ uri: val.uri }} className="w-full h-full" resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => updateField(key, null)}
                  className="absolute top-1 right-1 bg-red-600 rounded-full p-1"
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : typeof val === "string" ? (
              <View className="bg-slate-800 px-3 py-1.5 rounded-xl border border-white/10 flex-row items-center justify-between">
                <Text className="text-slate-300 text-xs font-mono flex-1" numberOfLines={1}>
                  Current: {val}
                </Text>
                <TouchableOpacity onPress={() => updateField(key, null)}>
                  <X size={14} color="#f87171" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-900/80">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 items-center justify-center"
          >
            <ChevronLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          <View className="flex-1 ml-3">
            <Text className="text-white text-base font-black">
              Edit Delivery Partner
            </Text>
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Step {currentStep} of {STEPS.length} &bull; {STEPS[currentStep - 1]?.label}
            </Text>
          </View>
        </View>

        {/* Step Indicator Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-slate-900 border-b border-white/10 py-2.5 px-3 max-h-14"
        >
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <TouchableOpacity
                key={step.id}
                onPress={() => setCurrentStep(step.id)}
                className={`px-3 py-1.5 rounded-xl mr-2 flex-row items-center border ${
                  isActive
                    ? "bg-emerald-600 border-emerald-500"
                    : isCompleted
                    ? "bg-slate-800 border-emerald-500/30"
                    : "bg-slate-900 border-white/5"
                }`}
              >
                <Text
                  className={`text-[10px] font-black mr-1.5 ${
                    isActive ? "text-white" : isCompleted ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : step.id}
                </Text>
                <Text
                  className={`text-xs font-bold ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Step Content */}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 60 }}
        >
          {/* STEP 1: PERSONAL */}
          {currentStep === 1 && (
            <View className="space-y-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    First Name *
                  </Text>
                  <TextInput
                    value={form.first_name}
                    onChangeText={(t) => updateField("first_name", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="First name"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Last Name *
                  </Text>
                  <TextInput
                    value={form.last_name}
                    onChangeText={(t) => updateField("last_name", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Last name"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Gender
                  </Text>
                  <View className="flex-row gap-2">
                    {["Male", "Female"].map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => updateField("gender", g)}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${
                          form.gender === g
                            ? "bg-emerald-600/20 border-emerald-500"
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            form.gender === g ? "text-emerald-400" : "text-slate-400"
                          }`}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View className="w-28">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Blood Group
                  </Text>
                  <TextInput
                    value={form.blood_group}
                    onChangeText={(t) => updateField("blood_group", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs text-center font-bold"
                    placeholder="e.g. O+"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Date of Birth
                  </Text>
                  <TouchableOpacity
                    onPress={() => openDatePickerModal("date_of_birth")}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-white text-xs">
                      {form.date_of_birth || "YYYY-MM-DD"}
                    </Text>
                    <Calendar size={16} color="#34d399" />
                  </TouchableOpacity>
                </View>
                <View className="w-24">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Age
                  </Text>
                  <TextInput
                    value={form.age}
                    readOnly
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-slate-400 text-xs font-bold text-center"
                    placeholder="Auto"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Mobile *
                  </Text>
                  <TextInput
                    value={form.mobile}
                    onChangeText={(t) => updateField("mobile", t)}
                    keyboardType="phone-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="10-digit mobile"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Alt Mobile
                  </Text>
                  <TextInput
                    value={form.alt_mobile}
                    onChangeText={(t) => updateField("alt_mobile", t)}
                    keyboardType="phone-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Alt mobile"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Email
                </Text>
                <TextInput
                  value={form.email}
                  onChangeText={(t) => updateField("email", t)}
                  keyboardType="email-address"
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="name@example.com"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Password (Leave empty to keep unchanged)
                </Text>
                <TextInput
                  value={form.password}
                  onChangeText={(t) => updateField("password", t)}
                  secureTextEntry
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="New password (optional)"
                  placeholderTextColor="#64748b"
                />
              </View>

              {renderFileInput("profile_photo", "Profile Photo")}
            </View>
          )}

          {/* STEP 2: ADDRESS */}
          {currentStep === 2 && (
            <View className="space-y-4">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Current Address
                </Text>
                <TextInput
                  value={form.current_address}
                  onChangeText={(t) => updateField("current_address", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="House no, Street, Area"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Permanent Address
                </Text>
                <TextInput
                  value={form.permanent_address}
                  onChangeText={(t) => updateField("permanent_address", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="Permanent address"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    City
                  </Text>
                  <TextInput
                    value={form.city}
                    onChangeText={(t) => updateField("city", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="City"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    State
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowStateModal(true)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3"
                  >
                    <Text className="text-white text-xs">{form.state || "Select State"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Pincode
                  </Text>
                  <TextInput
                    value={form.pincode}
                    onChangeText={(t) => updateField("pincode", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Pincode"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Live GPS Location
                  </Text>
                  <TextInput
                    value={form.live_location}
                    onChangeText={(t) => updateField("live_location", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Coordinates or area"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: EMERGENCY */}
          {currentStep === 3 && (
            <View className="space-y-4">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Emergency Contact Name
                </Text>
                <TextInput
                  value={form.emergency_contact_name}
                  onChangeText={(t) => updateField("emergency_contact_name", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="Contact person name"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Relationship
                  </Text>
                  <TextInput
                    value={form.emergency_contact_relationship}
                    onChangeText={(t) => updateField("emergency_contact_relationship", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Parent / Spouse / Sibling"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Emergency Phone
                  </Text>
                  <TextInput
                    value={form.emergency_contact_mobile}
                    onChangeText={(t) => updateField("emergency_contact_mobile", t)}
                    keyboardType="phone-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="10-digit mobile"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 4: VEHICLE */}
          {currentStep === 4 && (
            <View className="space-y-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Vehicle Type
                  </Text>
                  <View className="flex-row gap-2">
                    {["Bike", "Scooter"].map((vt) => (
                      <TouchableOpacity
                        key={vt}
                        onPress={() => updateField("vehicle_type", vt)}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${
                          form.vehicle_type === vt
                            ? "bg-emerald-600/20 border-emerald-500"
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            form.vehicle_type === vt ? "text-emerald-400" : "text-slate-400"
                          }`}
                        >
                          {vt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Vehicle Brand
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowBrandModal(true)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3"
                  >
                    <Text className="text-white text-xs">{form.vehicle_brand || "Select Brand"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Vehicle Model
                  </Text>
                  <TextInput
                    value={form.vehicle_model}
                    onChangeText={(t) => updateField("vehicle_model", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="e.g. Splendor Plus"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Vehicle Number
                  </Text>
                  <TextInput
                    value={form.vehicle_number}
                    onChangeText={(t) => updateField("vehicle_number", t.toUpperCase())}
                    autoCapitalize="characters"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="TN01AB1234"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              {renderFileInput("vehicle_front_photo", "Vehicle Front Photo")}
              {renderFileInput("vehicle_back_photo", "Vehicle Back Photo")}
            </View>
          )}

          {/* STEP 5: DRIVING */}
          {currentStep === 5 && (
            <View className="space-y-4">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Driving License Number
                </Text>
                <TextInput
                  value={form.license_number}
                  onChangeText={(t) => updateField("license_number", t.toUpperCase())}
                  autoCapitalize="characters"
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="e.g. DL-1420110012345"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  License Holder Name
                </Text>
                <TextInput
                  value={form.license_holder_name}
                  onChangeText={(t) => updateField("license_holder_name", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="As per Driving License"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Issue Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => openDatePickerModal("license_issue_date")}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-white text-xs">{form.license_issue_date || "YYYY-MM-DD"}</Text>
                    <Calendar size={16} color="#34d399" />
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Expiry Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => openDatePickerModal("license_expiry_date")}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-white text-xs">{form.license_expiry_date || "YYYY-MM-DD"}</Text>
                    <Calendar size={16} color="#34d399" />
                  </TouchableOpacity>
                </View>
              </View>

              {renderFileInput("license_front_image", "License Front Image")}
              {renderFileInput("license_back_image", "License Back Image")}
            </View>
          )}

          {/* STEP 6: BANK */}
          {currentStep === 6 && (
            <View className="space-y-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Bank Name
                  </Text>
                  <TextInput
                    value={form.bank_name}
                    onChangeText={(t) => updateField("bank_name", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Bank name"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Account Number
                  </Text>
                  <TextInput
                    value={form.bank_account_number}
                    onChangeText={(t) => updateField("bank_account_number", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="A/C number"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    IFSC Code
                  </Text>
                  <TextInput
                    value={form.ifsc_code}
                    onChangeText={(t) => updateField("ifsc_code", t.toUpperCase())}
                    autoCapitalize="characters"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="IFSC code"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    UPI ID
                  </Text>
                  <TextInput
                    value={form.upi_id}
                    onChangeText={(t) => updateField("upi_id", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="partner@upi"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Aadhaar Number
                  </Text>
                  <TextInput
                    value={form.aadhaar_number}
                    onChangeText={(t) => updateField("aadhaar_number", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="12-digit Aadhaar"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    PAN Number
                  </Text>
                  <TextInput
                    value={form.pan_number}
                    onChangeText={(t) => updateField("pan_number", t.toUpperCase())}
                    autoCapitalize="characters"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="ABCDE1234F"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 7: DOCUMENTS */}
          {currentStep === 7 && (
            <View className="space-y-4">
              {renderFileInput("aadhaar_front_url", "Aadhaar Card - Front")}
              {renderFileInput("aadhaar_back_url", "Aadhaar Card - Back")}
              {renderFileInput("pan_card_url", "PAN Card")}
              {renderFileInput("selfie_verification_url", "Identity Selfie")}
              {renderFileInput("selfie_with_vehicle", "Selfie With Vehicle")}
              {renderFileInput("selfie_with_aadhaar", "Selfie With Aadhaar")}
            </View>
          )}

          {/* STEP 8: PREFERENCES */}
          {currentStep === 8 && (
            <View className="space-y-4">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Available Areas
                </Text>
                <TextInput
                  value={form.available_areas}
                  onChangeText={(t) => updateField("available_areas", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="e.g. Anna Nagar, T Nagar, Kodambakkam"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-2">
                  Preferred Distance
                </Text>
                <View className="flex-row gap-2">
                  {["3 KM", "5 KM", "10 KM"].map((dist) => (
                    <TouchableOpacity
                      key={dist}
                      onPress={() => updateField("preferred_distance", dist)}
                      className={`flex-1 py-3 rounded-xl border items-center ${
                        form.preferred_distance === dist
                          ? "bg-emerald-600 border-emerald-500"
                          : "bg-slate-900 border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          form.preferred_distance === dist ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {dist}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Delivery Radius (KM)
                  </Text>
                  <TextInput
                    value={form.delivery_radius}
                    onChangeText={(t) => updateField("delivery_radius", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="e.g. 5"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Driving Experience (Yrs)
                  </Text>
                  <TextInput
                    value={form.driving_experience}
                    onChangeText={(t) => updateField("driving_experience", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="e.g. 2"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 9: REVIEW */}
          {currentStep === 9 && (
            <View className="space-y-4">
              <View className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
                <Text className="text-emerald-400 font-black text-sm uppercase mb-3">
                  Summary of Changes
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Partner Name: </Text>
                  {form.first_name} {form.last_name}
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Vehicle: </Text>
                  {form.vehicle_brand} {form.vehicle_model} ({form.vehicle_number})
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Mobile: </Text>
                  {form.mobile}
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">City: </Text>
                  {form.city}, {form.state}
                </Text>
                <Text className="text-white text-xs">
                  <Text className="text-slate-400 font-bold">Preferred Distance: </Text>
                  {form.preferred_distance}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View className="p-4 border-t border-white/10 bg-slate-900 flex-row justify-between items-center">
          {currentStep > 1 ? (
            <TouchableOpacity
              onPress={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
              className="px-5 py-3 rounded-xl bg-slate-800 border border-white/10"
            >
              <Text className="text-slate-300 font-bold text-xs uppercase">Previous</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {currentStep < STEPS.length ? (
            <TouchableOpacity
              onPress={() => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))}
              className="px-6 py-3 rounded-xl bg-emerald-600 flex-row items-center"
            >
              <Text className="text-white font-bold text-xs uppercase mr-1">Next</Text>
              <ChevronRight size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              disabled={loading}
              onPress={handleSubmit}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 flex-row items-center"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle size={18} color="#fff" />
                  <Text className="text-white font-black text-xs uppercase ml-1.5">
                    Save Changes
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm">
            <Text className="text-white font-black text-base mb-4 text-center">
              Select Date
            </Text>
            <View className="flex-row gap-2 mb-5">
              <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 text-center">
                  Day
                </Text>
                <TextInput
                  value={String(tempDay)}
                  onChangeText={(t) => setTempDay(parseInt(t, 10) || 1)}
                  keyboardType="number-pad"
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-center font-bold"
                />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 text-center">
                  Month
                </Text>
                <TextInput
                  value={String(tempMonth)}
                  onChangeText={(t) => setTempMonth(parseInt(t, 10) || 1)}
                  keyboardType="number-pad"
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-center font-bold"
                />
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 text-center">
                  Year
                </Text>
                <TextInput
                  value={String(tempYear)}
                  onChangeText={(t) => setTempYear(parseInt(t, 10) || 1995)}
                  keyboardType="number-pad"
                  className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-center font-bold"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="flex-1 bg-slate-800 py-3 rounded-xl items-center"
              >
                <Text className="text-slate-300 font-bold text-xs">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDate}
                className="flex-1 bg-emerald-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-xs">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* State Modal */}
      <Modal
        visible={showStateModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[70%] p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-black text-base">Select State</Text>
              <TouchableOpacity onPress={() => setShowStateModal(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <TextInput
              value={stateSearch}
              onChangeText={setStateSearch}
              placeholder="Search state..."
              placeholderTextColor="#64748b"
              className="bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-xs mb-3"
            />
            <ScrollView>
              {INDIAN_STATES.filter((s) =>
                s.toLowerCase().includes(stateSearch.toLowerCase())
              ).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    updateField("state", s);
                    setShowStateModal(false);
                  }}
                  className="py-3 border-b border-white/5"
                >
                  <Text className="text-white text-xs font-semibold">{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Brand Modal */}
      <Modal
        visible={showBrandModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View
            className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[60%] p-5"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-black text-base">Select Brand</Text>
              <TouchableOpacity onPress={() => setShowBrandModal(false)}>
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {VEHICLE_BRANDS.map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => {
                    updateField("vehicle_brand", b);
                    setShowBrandModal(false);
                  }}
                  className="py-3 border-b border-white/5"
                >
                  <Text className="text-white text-xs font-semibold">{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Upload Choice Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm">
            <Text className="text-white font-black text-base mb-4 text-center">
              Choose Upload Source
            </Text>
            <TouchableOpacity
              onPress={handlePickFromLibrary}
              className="bg-slate-800 border border-white/10 rounded-2xl p-4 flex-row items-center mb-3"
            >
              <ImageIcon size={20} color="#34d399" />
              <Text className="text-white font-bold text-xs ml-3">
                Choose from Gallery
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleTakePhoto}
              className="bg-slate-800 border border-white/10 rounded-2xl p-4 flex-row items-center mb-4"
            >
              <Camera size={20} color="#34d399" />
              <Text className="text-white font-bold text-xs ml-3">
                Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUploadModalVisible(false)}
              className="bg-slate-950 py-3 rounded-xl items-center"
            >
              <Text className="text-slate-400 font-bold text-xs">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CenteredDialog
        visible={successVisible}
        title="Partner updated"
        message="The delivery partner details were updated successfully."
        onClose={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
};

export default EditDeliveryPartner;

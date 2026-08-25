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
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Clock,
  Camera,
  Image as ImageIcon,
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

const CUISINES = [
  "South Indian",
  "North Indian",
  "Chinese",
  "Andhra",
  "Kerala",
  "Healthy Foods",
  "Millet Foods",
  "Desserts",
  "Others",
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SLOTS = ["Breakfast", "Lunch", "Dinner", "Evening Snacks"];

const STEPS = [
  { id: 1, label: "Personal", title: "Personal Information" },
  { id: 2, label: "Address", title: "Address Information" },
  { id: 3, label: "Kitchen", title: "Kitchen Information" },
  { id: 4, label: "Availability", title: "Food Availability" },
  { id: 5, label: "Business", title: "Business Details" },
  { id: 6, label: "Social", title: "Social Media" },
  { id: 7, label: "Creator", title: "Creator Profile" },
  { id: 8, label: "Verification", title: "Proof Verification" },
  { id: 9, label: "Delivery", title: "Delivery Preferences" },
  { id: 10, label: "Review", title: "Review & Update" },
];

const EditHomeChef = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { chefId, chef: initialChef } = route.params || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!initialChef && !!chefId);

  // Form State
  const [form, setForm] = useState<any>({
    first_name: "",
    last_name: "",
    gender: "Male",
    date_of_birth: "",
    age: "",
    mobile: "",
    alt_mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile_photo: null as Asset | string | null,

    house_number: "",
    street: "",
    area: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    country: "India",
    google_map_location: "",
    latitude: "",
    longitude: "",

    kitchen_name: "",
    kitchen_address: "",
    kitchen_type: "Home Kitchen",
    veg_nonveg: "Veg",
    experience_years: "",
    cuisine_type: [] as string[],
    daily_order_capacity: "",
    kitchen_photos: [] as (Asset | string)[],
    kitchen_videos: [] as (Asset | string)[],
    cooking_area_photo: null as Asset | string | null,

    available_days: [] as string[],
    available_slots: [] as string[],

    fssai_available: "No",
    gst_available: "No",
    aadhaar_number: "",
    pan_number: "",
    bank_account_number: "",
    ifsc_code: "",
    account_holder_name: "",
    bank_branch: "",
    upi_id: "",
    passbook_image: null as Asset | string | null,

    instagram_url: "",
    facebook_url: "",
    youtube_url: "",
    website_url: "",

    about_me: "",
    cooking_story: "",
    why_choose_me: "",
    languages_known: "",
    introduction_video: null as Asset | string | null,

    aadhaar_front_url: null as Asset | string | null,
    aadhaar_back_url: null as Asset | string | null,
    pan_card_url: null as Asset | string | null,
    selfie_verification_url: null as Asset | string | null,

    delivery_radius: "5 KM",
    preorder_available: false,
    cutoff_time: "",
    opening_time: "",
    closing_time: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Pickers modal states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(1995);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(15);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerField, setTimePickerField] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState("08");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  const [showStateModal, setShowStateModal] = useState(false);
  const [stateSearch, setStateSearch] = useState("");

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [currentUploadKey, setCurrentUploadKey] = useState<string>("");
  const [isMultiUpload, setIsMultiUpload] = useState(false);
  const [uploadMediaType, setUploadMediaType] = useState<"photo" | "video">("photo");
  const [successVisible, setSuccessVisible] = useState(false);

  const populateChefData = useCallback((chef: any) => {
    let cuisines: string[] = [];
    if (Array.isArray(chef.cuisine_type)) {
      cuisines = chef.cuisine_type;
    } else if (typeof chef.cuisine_type === "string" && chef.cuisine_type) {
      cuisines = chef.cuisine_type.split(",").map((s: string) => s.trim());
    }

    let days: string[] = [];
    if (Array.isArray(chef.available_days)) {
      days = chef.available_days;
    } else if (typeof chef.available_days === "string" && chef.available_days) {
      days = chef.available_days.split(",").map((s: string) => s.trim());
    }

    let slots: string[] = [];
    if (Array.isArray(chef.available_slots)) {
      slots = chef.available_slots;
    } else if (typeof chef.available_slots === "string" && chef.available_slots) {
      slots = chef.available_slots.split(",").map((s: string) => s.trim());
    }

    setForm({
      first_name: chef.first_name || chef.name?.split(" ")[0] || "",
      last_name: chef.last_name || chef.name?.split(" ").slice(1).join(" ") || "",
      gender: chef.gender || "Male",
      date_of_birth: chef.date_of_birth ? chef.date_of_birth.substring(0, 10) : "",
      age: chef.age ? String(chef.age) : "",
      mobile: chef.mobile || "",
      alt_mobile: chef.alt_mobile || "",
      email: chef.email || "",
      password: "",
      confirmPassword: "",
      profile_photo: chef.profile_photo || null,

      house_number: chef.house_number || chef.door_number || "",
      street: chef.street || chef.street_name || "",
      area: chef.area || chef.area_name || "",
      city: chef.city || "",
      state: chef.state || "Tamil Nadu",
      pincode: chef.pincode || "",
      country: chef.country || "India",
      google_map_location: chef.google_map_location || chef.map_link || "",
      latitude: chef.latitude ? String(chef.latitude) : "",
      longitude: chef.longitude ? String(chef.longitude) : "",

      kitchen_name: chef.kitchen_name || "",
      kitchen_address: chef.kitchen_address || "",
      kitchen_type: chef.kitchen_type || "Home Kitchen",
      veg_nonveg: chef.veg_nonveg || "Veg",
      experience_years: chef.experience_years ? String(chef.experience_years) : "",
      cuisine_type: cuisines,
      daily_order_capacity: chef.daily_order_capacity ? String(chef.daily_order_capacity) : "",
      kitchen_photos: Array.isArray(chef.kitchen_photos) ? chef.kitchen_photos : [],
      kitchen_videos: Array.isArray(chef.kitchen_videos) ? chef.kitchen_videos : [],
      cooking_area_photo: chef.cooking_area_photo || null,

      available_days: days,
      available_slots: slots,

      fssai_available: chef.fssai_available || "No",
      gst_available: chef.gst_available || "No",
      aadhaar_number: chef.aadhaar_number || "",
      pan_number: chef.pan_number || "",
      bank_account_number: chef.bank_account_number || "",
      ifsc_code: chef.ifsc_code || "",
      account_holder_name: chef.account_holder_name || "",
      bank_branch: chef.bank_branch || "",
      upi_id: chef.upi_id || "",
      passbook_image: chef.passbook_image || null,

      instagram_url: chef.instagram_url || "",
      facebook_url: chef.facebook_url || "",
      youtube_url: chef.youtube_url || "",
      website_url: chef.website_url || "",

      about_me: chef.about_me || "",
      cooking_story: chef.cooking_story || "",
      why_choose_me: chef.why_choose_me || "",
      languages_known: chef.languages_known || "",
      introduction_video: chef.introduction_video || null,

      aadhaar_front_url: chef.aadhaar_front_url || null,
      aadhaar_back_url: chef.aadhaar_back_url || null,
      pan_card_url: chef.pan_card_url || null,
      selfie_verification_url: chef.selfie_verification_url || null,

      delivery_radius: chef.delivery_radius || "5 KM",
      preorder_available: !!chef.preorder_available,
      cutoff_time: chef.cutoff_time || "",
      opening_time: chef.opening_time || "",
      closing_time: chef.closing_time || "",
    });
  }, []);

  const loadChef = useCallback(async () => {
    try {
      setInitialLoading(true);
      const res: any = await get(`/admin/homechefs/${chefId}`);
      const data = res?.data || res;
      if (data) {
        populateChefData(data);
      }
    } catch (e) {
      console.log("Failed to load chef for edit", e);
    } finally {
      setInitialLoading(false);
    }
  }, [chefId, populateChefData]);

  useEffect(() => {
    if (initialChef) {
      populateChefData(initialChef);
    } else if (chefId) {
      loadChef();
    }
  }, [chefId, initialChef, loadChef, populateChefData]);

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

  const computeAge = (dobString: string) => {
    if (!dobString) return "";
    const b = new Date(dobString);
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
    return a >= 0 ? String(a) : "";
  };

  const openDobPicker = () => {
    if (form.date_of_birth) {
      const parts = form.date_of_birth.split("-");
      if (parts.length === 3) {
        setTempYear(parseInt(parts[0], 10) || 1995);
        setTempMonth(parseInt(parts[1], 10) || 1);
        setTempDay(parseInt(parts[2], 10) || 15);
      }
    }
    setShowDatePicker(true);
  };

  const confirmDob = () => {
    const formatted = `${tempYear}-${String(tempMonth).padStart(2, "0")}-${String(
      tempDay
    ).padStart(2, "0")}`;
    updateField("date_of_birth", formatted);
    updateField("age", computeAge(formatted));
    setShowDatePicker(false);
  };

  const openTimePicker = (field: string) => {
    setTimePickerField(field);
    const cur = form[field];
    if (cur && cur.includes(":")) {
      const parts = cur.split(" ");
      const timeParts = parts[0].split(":");
      setSelectedHour(timeParts[0] || "08");
      setSelectedMinute(timeParts[1] || "00");
      setSelectedPeriod(parts[1] || "AM");
    }
    setShowTimePicker(true);
  };

  const confirmTime = () => {
    const formatted = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    updateField(timePickerField, formatted);
    setShowTimePicker(false);
  };

  const fetchLatLng = async () => {
    try {
      const query = [form.area, form.city, form.state, form.pincode, form.country]
        .filter(Boolean)
        .join(", ");
      if (!query.trim()) {
        Alert.alert("Error", "Please fill in Area, City, and State first.");
        return;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`,
        { headers: { "User-Agent": "VeetuRusiFranchiseApp/1.0" } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = data[0].lat;
        const lon = data[0].lon;
        updateField("latitude", lat);
        updateField("longitude", lon);
        updateField("google_map_location", `https://www.google.com/maps?q=${lat},${lon}`);
        Alert.alert("Success", "Coordinates fetched from address!");
      } else {
        Alert.alert("Notice", "Could not locate exact coordinates. You can enter them manually.");
      }
    } catch {
      Alert.alert("Error", "Failed to fetch GPS coordinates.");
    }
  };

  const openMediaPicker = (key: string, isMulti = false, mediaType: "photo" | "video" = "photo") => {
    setCurrentUploadKey(key);
    setIsMultiUpload(isMulti);
    setUploadMediaType(mediaType);
    setUploadModalVisible(true);
  };

  const handlePickFromLibrary = async () => {
    setUploadModalVisible(false);
    const options: ImageLibraryOptions = {
      mediaType: uploadMediaType === "video" ? "video" : "photo",
      selectionLimit: isMultiUpload ? 5 : 1,
      quality: 0.8,
    };
    const res = await launchImageLibrary(options);
    if (res.assets && res.assets.length > 0) {
      if (isMultiUpload) {
        const currentList = Array.isArray(form[currentUploadKey]) ? form[currentUploadKey] : [];
        updateField(currentUploadKey, [...currentList, ...res.assets]);
      } else {
        updateField(currentUploadKey, res.assets[0]);
      }
    }
  };

  const handleTakePhoto = async () => {
    setUploadModalVisible(false);
    const options: CameraOptions = {
      mediaType: uploadMediaType === "video" ? "video" : "photo",
      quality: 0.8,
    };
    const res = await launchCamera(options);
    if (res.assets && res.assets.length > 0) {
      if (isMultiUpload) {
        const currentList = Array.isArray(form[currentUploadKey]) ? form[currentUploadKey] : [];
        updateField(currentUploadKey, [...currentList, ...res.assets]);
      } else {
        updateField(currentUploadKey, res.assets[0]);
      }
    }
  };

  const toggleArrayItem = (key: string, item: string) => {
    const list = Array.isArray(form[key]) ? form[key] : [];
    if (list.includes(item)) {
      updateField(
        key,
        list.filter((i: string) => i !== item)
      );
    } else {
      updateField(key, [...list, item]);
    }
  };

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!form.first_name.trim()) errors.first_name = "First name is required";
      if (!form.last_name.trim()) errors.last_name = "Last name is required";
      if (!form.mobile.trim()) errors.mobile = "Mobile number is required";
      if (!form.email.trim()) errors.email = "Email is required";
    } else if (currentStep === 2) {
      if (!form.city.trim()) errors.city = "City is required";
      if (!form.state.trim()) errors.state = "State is required";
      if (!form.pincode.trim()) errors.pincode = "Pincode is required";
    } else if (currentStep === 3) {
      if (!form.kitchen_name.trim()) errors.kitchen_name = "Kitchen name is required";
      if (form.cuisine_type.length === 0) errors.cuisine_type = "Select at least one cuisine";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      Alert.alert("Validation Error", "Please fill required fields before proceeding.");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const targetId = chefId || initialChef?.id;
      if (!targetId) {
        Alert.alert("Error", "No Home Chef ID specified for update.");
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
      formData.append("mobile", form.mobile);
      formData.append("alt_mobile", form.alt_mobile);
      formData.append("email", form.email);
      if (form.password) {
        formData.append("password", form.password);
      }

      formData.append("door_number", form.house_number);
      formData.append("street_name", form.street);
      formData.append("area_name", form.area);
      formData.append("city", form.city);
      formData.append("state", form.state);
      formData.append("pincode", form.pincode);
      formData.append("country", form.country);
      formData.append("map_link", form.google_map_location);
      formData.append("latitude", form.latitude);
      formData.append("longitude", form.longitude);

      formData.append("kitchen_name", form.kitchen_name);
      formData.append("kitchen_address", form.kitchen_address);
      formData.append("kitchen_type", form.kitchen_type);
      formData.append("veg_nonveg", form.veg_nonveg);
      formData.append("experience_years", form.experience_years);
      formData.append("daily_order_capacity", form.daily_order_capacity);
      formData.append("cuisine_type", form.cuisine_type.join(","));

      formData.append("available_days", form.available_days.join(","));
      formData.append("available_slots", form.available_slots.join(","));

      formData.append("fssai_available", form.fssai_available);
      formData.append("gst_available", form.gst_available);
      formData.append("aadhaar_number", form.aadhaar_number);
      formData.append("pan_number", form.pan_number);
      formData.append("account_holder_name", form.account_holder_name);
      formData.append("bank_branch", form.bank_branch);
      formData.append("bank_account_number", form.bank_account_number);
      formData.append("ifsc_code", form.ifsc_code);
      formData.append("upi_id", form.upi_id);

      formData.append("instagram_url", form.instagram_url);
      formData.append("facebook_url", form.facebook_url);
      formData.append("youtube_url", form.youtube_url);
      formData.append("website_url", form.website_url);

      formData.append("about_me", form.about_me);
      formData.append("cooking_story", form.cooking_story);
      formData.append("why_choose_me", form.why_choose_me);
      formData.append("languages_known", form.languages_known);

      formData.append("delivery_radius", form.delivery_radius);
      formData.append("preorder_available", form.preorder_available ? "1" : "0");
      formData.append("cutoff_time", form.cutoff_time);
      formData.append("opening_time", form.opening_time);
      formData.append("closing_time", form.closing_time);

      // Attach newly uploaded files if they are Assets
      const fileKeys = [
        "profile_photo",
        "cooking_area_photo",
        "passbook_image",
        "introduction_video",
        "aadhaar_front_url",
        "aadhaar_back_url",
        "pan_card_url",
        "selfie_verification_url",
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

      if (Array.isArray(form.kitchen_photos)) {
        form.kitchen_photos.forEach((photo: any, index: number) => {
          if (photo && typeof photo === "object" && photo.uri) {
            formData.append(`kitchen_photos`, {
              uri: photo.uri,
              name: photo.fileName || `kitchen_photo_${index}.jpg`,
              type: photo.type || "image/jpeg",
            } as any);
          }
        });
      }

      await put(`/admin/homechefs/${targetId}`, formData);

      setSuccessVisible(true);
    } catch (err: any) {
      console.log("Chef update error:", err);
      Alert.alert("Error", err.message || "Failed to update home chef profile.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-white mt-3 text-xs font-semibold">
          Loading Chef Information...
        </Text>
      </View>
    );
  }

  const renderFileInput = (
    key: string,
    label: string,
    isMulti = false,
    mediaType: "photo" | "video" = "photo"
  ) => {
    const val = form[key];
    const hasFiles = isMulti
      ? Array.isArray(val) && val.length > 0
      : val !== null && val !== undefined;

    return (
      <View className="mb-4">
        <Text className="text-slate-300 text-xs font-bold uppercase mb-2">
          {label}
        </Text>
        <TouchableOpacity
          onPress={() => openMediaPicker(key, isMulti, mediaType)}
          className="bg-slate-900 border border-dashed border-emerald-500/40 rounded-2xl p-4 items-center justify-center"
        >
          <UploadCloud size={24} color="#34d399" />
          <Text className="text-white text-xs font-bold mt-2">
            {hasFiles ? "Change / Add Files" : "Tap to Upload"}
          </Text>
          <Text className="text-slate-500 text-[10px] mt-0.5">
            {isMulti ? "Supports multiple items" : "Camera or Gallery"}
          </Text>
        </TouchableOpacity>

        {/* Previews */}
        {hasFiles && (
          <View className="flex-row flex-wrap gap-2 mt-2">
            {isMulti && Array.isArray(val) ? (
              val.map((item: any, idx: number) => (
                <View key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                  {typeof item === "string" ? (
                    <Text className="text-slate-400 text-[9px] p-1 font-mono" numberOfLines={2}>
                      {item}
                    </Text>
                  ) : item.uri ? (
                    <Image source={{ uri: item.uri }} className="w-full h-full" resizeMode="cover" />
                  ) : null}
                  <TouchableOpacity
                    onPress={() => {
                      updateField(
                        key,
                        val.filter((_: any, i: number) => i !== idx)
                      );
                    }}
                    className="absolute top-1 right-1 bg-red-600 rounded-full p-1"
                  >
                    <X size={10} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))
            ) : typeof val === "object" && val?.uri ? (
              <View className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-800 border border-white/10 mt-1">
                <Image source={{ uri: val.uri }} className="w-full h-full" resizeMode="cover" />
                <TouchableOpacity
                  onPress={() => updateField(key, null)}
                  className="absolute top-1 right-1 bg-red-600 rounded-full p-1"
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : typeof val === "string" ? (
              <View className="bg-slate-800 px-3 py-1.5 rounded-xl border border-white/10 flex-row items-center justify-between flex-1">
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
              Edit Home Chef
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
        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 60 }}>
          {/* STEP 1: PERSONAL */}
          {currentStep === 1 && (
            <View className="gap-5">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    First Name *
                  </Text>
                  <TextInput
                    value={form.first_name}
                    onChangeText={(t) => updateField("first_name", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Enter first name"
                    placeholderTextColor="#64748b"
                  />
                  {validationErrors.first_name && (
                    <Text className="text-red-400 text-[10px] mt-1 font-bold">
                      {validationErrors.first_name}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Last Name *
                  </Text>
                  <TextInput
                    value={form.last_name}
                    onChangeText={(t) => updateField("last_name", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Enter last name"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              {/* Gender Selection */}
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Gender *
                </Text>
                <View className="flex-row gap-2">
                  {["Male", "Female", "Other"].map((g) => (
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

              {/* DOB & Age */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Date of Birth
                  </Text>
                  <TouchableOpacity
                    onPress={openDobPicker}
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

              {/* Contact */}
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
                    placeholder="Alternate mobile"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Email *
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
                  Update Password (Leave blank to keep unchanged)
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
            <View className="gap-5">
              <View className="flex-row gap-3">
                <View className="w-1/3">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Door / Flat No
                  </Text>
                  <TextInput
                    value={form.house_number}
                    onChangeText={(t) => updateField("house_number", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="e.g. 12B"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Street Name
                  </Text>
                  <TextInput
                    value={form.street}
                    onChangeText={(t) => updateField("street", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Street name"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Area / Locality
                </Text>
                <TextInput
                  value={form.area}
                  onChangeText={(t) => updateField("area", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="Area / Locality"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    City *
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
                    State *
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
                    Pincode *
                  </Text>
                  <TextInput
                    value={form.pincode}
                    onChangeText={(t) => updateField("pincode", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="6-digit pincode"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Country
                  </Text>
                  <TextInput
                    value={form.country}
                    readOnly
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-slate-400 text-xs"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={fetchLatLng}
                className="bg-emerald-600/20 border border-emerald-500/40 rounded-2xl p-3.5 flex-row items-center justify-center mt-2"
              >
                <MapPin size={18} color="#34d399" />
                <Text className="text-emerald-400 font-bold text-xs ml-2">
                  📍 Auto-Fetch GPS Coordinates
                </Text>
              </TouchableOpacity>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Google Maps URL
                </Text>
                <TextInput
                  value={form.google_map_location}
                  onChangeText={(t) => updateField("google_map_location", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-mono"
                  placeholder="https://maps.google.com/?q=..."
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
          )}

          {/* STEP 3: KITCHEN */}
          {currentStep === 3 && (
            <View className="gap-5">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Kitchen Name *
                </Text>
                <TextInput
                  value={form.kitchen_name}
                  onChangeText={(t) => updateField("kitchen_name", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="e.g. Priya's South Kitchen"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View className="flex-row gap-2">
                {["Home Kitchen", "Cloud Kitchen", "Traditional"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => updateField("kitchen_type", type)}
                    className={`flex-1 py-2.5 rounded-xl border items-center ${
                      form.kitchen_type === type
                        ? "bg-emerald-600/20 border-emerald-500"
                        : "bg-slate-900 border-white/10"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        form.kitchen_type === type ? "text-emerald-400" : "text-slate-400"
                      }`}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Food Type
                  </Text>
                  <View className="flex-row gap-2">
                    {["Veg", "Non-Veg", "Both"].map((v) => (
                      <TouchableOpacity
                        key={v}
                        onPress={() => updateField("veg_nonveg", v)}
                        className={`flex-1 py-2.5 rounded-xl border items-center ${
                          form.veg_nonveg === v
                            ? "bg-emerald-600/20 border-emerald-500"
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            form.veg_nonveg === v ? "text-emerald-400" : "text-slate-400"
                          }`}
                        >
                          {v}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="w-32">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Experience (Yrs)
                  </Text>
                  <TextInput
                    value={form.experience_years}
                    onChangeText={(t) => updateField("experience_years", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs text-center"
                    placeholder="e.g. 5"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              {/* Cuisines selection */}
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-2">
                  Speciality Cuisines *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {CUISINES.map((c) => {
                    const selected = form.cuisine_type.includes(c);
                    return (
                      <TouchableOpacity
                        key={c}
                        onPress={() => toggleArrayItem("cuisine_type", c)}
                        className={`px-3 py-2 rounded-xl border ${
                          selected
                            ? "bg-emerald-600 border-emerald-500"
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {c}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Daily Order Capacity
                </Text>
                <TextInput
                  value={form.daily_order_capacity}
                  onChangeText={(t) => updateField("daily_order_capacity", t)}
                  keyboardType="number-pad"
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="e.g. 50"
                  placeholderTextColor="#64748b"
                />
              </View>

              {renderFileInput("kitchen_photos", "Kitchen Photos", true, "photo")}
              {renderFileInput("cooking_area_photo", "Cooking Area Photo", false, "photo")}
            </View>
          )}

          {/* STEP 4: AVAILABILITY */}
          {currentStep === 4 && (
            <View className="gap-5">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-2">
                  Available Days
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {DAYS.map((d) => {
                    const selected = form.available_days.includes(d);
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => toggleArrayItem("available_days", d)}
                        className={`px-3.5 py-2.5 rounded-xl border ${
                          selected
                            ? "bg-emerald-600 border-emerald-500"
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View className="mt-4">
                <Text className="text-slate-300 text-xs font-bold uppercase mb-2">
                  Available Meal Slots
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {SLOTS.map((s) => {
                    const selected = form.available_slots.includes(s);
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => toggleArrayItem("available_slots", s)}
                        className={`px-3.5 py-2.5 rounded-xl border ${
                          selected
                            ? "bg-emerald-600 border-emerald-500"
                            : "bg-slate-900 border-white/10"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            selected ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* STEP 5: BUSINESS & BANK */}
          {currentStep === 5 && (
            <View className="gap-5">
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

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Account Holder Name
                </Text>
                <TextInput
                  value={form.account_holder_name}
                  onChangeText={(t) => updateField("account_holder_name", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="As per bank passbook"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Account Number
                  </Text>
                  <TextInput
                    value={form.bank_account_number}
                    onChangeText={(t) => updateField("bank_account_number", t)}
                    keyboardType="number-pad"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Bank account number"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    IFSC Code
                  </Text>
                  <TextInput
                    value={form.ifsc_code}
                    onChangeText={(t) => updateField("ifsc_code", t.toUpperCase())}
                    autoCapitalize="characters"
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="SBIN0001234"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Bank Branch
                  </Text>
                  <TextInput
                    value={form.bank_branch}
                    onChangeText={(t) => updateField("bank_branch", t)}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                    placeholder="Branch name"
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
                    placeholder="username@upi"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              {renderFileInput("passbook_image", "Bank Passbook / Cheque")}
            </View>
          )}

          {/* STEP 6: SOCIAL */}
          {currentStep === 6 && (
            <View className="gap-5">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Instagram Profile URL
                </Text>
                <TextInput
                  value={form.instagram_url}
                  onChangeText={(t) => updateField("instagram_url", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="https://instagram.com/chef"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Facebook Page URL
                </Text>
                <TextInput
                  value={form.facebook_url}
                  onChangeText={(t) => updateField("facebook_url", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="https://facebook.com/chef"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  YouTube Channel URL
                </Text>
                <TextInput
                  value={form.youtube_url}
                  onChangeText={(t) => updateField("youtube_url", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="https://youtube.com/@chef"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Personal Website
                </Text>
                <TextInput
                  value={form.website_url}
                  onChangeText={(t) => updateField("website_url", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="https://chefkitchen.com"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
          )}

          {/* STEP 7: CREATOR */}
          {currentStep === 7 && (
            <View className="gap-5">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  About Me
                </Text>
                <TextInput
                  value={form.about_me}
                  onChangeText={(t) => updateField("about_me", t)}
                  multiline
                  numberOfLines={3}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="Introduce yourself to your customers..."
                  placeholderTextColor="#64748b"
                />
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Cooking Story
                </Text>
                <TextInput
                  value={form.cooking_story}
                  onChangeText={(t) => updateField("cooking_story", t)}
                  multiline
                  numberOfLines={3}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="How did you start cooking? What inspires you?"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Why Customers Love My Food
                </Text>
                <TextInput
                  value={form.why_choose_me}
                  onChangeText={(t) => updateField("why_choose_me", t)}
                  multiline
                  numberOfLines={3}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="Quality ingredients, authentic taste, etc."
                  placeholderTextColor="#64748b"
                />
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Languages Known
                </Text>
                <TextInput
                  value={form.languages_known}
                  onChangeText={(t) => updateField("languages_known", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="Tamil, English, Hindi..."
                  placeholderTextColor="#64748b"
                />
              </View>

              {renderFileInput("introduction_video", "Introduction Video", false, "video")}
            </View>
          )}

          {/* STEP 8: VERIFICATION */}
          {currentStep === 8 && (
            <View className="gap-5">
              {renderFileInput("aadhaar_front_url", "Aadhaar Card - Front")}
              {renderFileInput("aadhaar_back_url", "Aadhaar Card - Back")}
              {renderFileInput("pan_card_url", "PAN Card")}
              {renderFileInput("selfie_verification_url", "Selfie With Aadhaar")}
            </View>
          )}

          {/* STEP 9: DELIVERY */}
          {currentStep === 9 && (
            <View className="gap-5">
              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-2">
                  Delivery Radius
                </Text>
                <View className="flex-row gap-2">
                  {["2 KM", "3 KM", "5 KM", "10 KM"].map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => updateField("delivery_radius", r)}
                      className={`flex-1 py-3 rounded-xl border items-center ${
                        form.delivery_radius === r
                          ? "bg-emerald-600 border-emerald-500"
                          : "bg-slate-900 border-white/10"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          form.delivery_radius === r ? "text-white" : "text-slate-400"
                        }`}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Opening Time
                  </Text>
                  <TouchableOpacity
                    onPress={() => openTimePicker("opening_time")}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-white text-xs">{form.opening_time || "Set Time"}</Text>
                    <Clock size={16} color="#34d399" />
                  </TouchableOpacity>
                </View>

                <View className="flex-1">
                  <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                    Closing Time
                  </Text>
                  <TouchableOpacity
                    onPress={() => openTimePicker("closing_time")}
                    className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-white text-xs">{form.closing_time || "Set Time"}</Text>
                    <Clock size={16} color="#34d399" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-slate-300 text-xs font-bold uppercase mb-1.5">
                  Cutoff Note
                </Text>
                <TextInput
                  value={form.cutoff_time}
                  onChangeText={(t) => updateField("cutoff_time", t)}
                  className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs"
                  placeholder="e.g. Order before 9 PM for next day lunch"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
          )}

          {/* STEP 10: REVIEW & SUBMIT */}
          {currentStep === 10 && (
            <View className="space-y-4">
              <View className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
                <Text className="text-emerald-400 font-black text-sm uppercase mb-3">
                  Summary of Changes
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Chef Name: </Text>
                  {form.first_name} {form.last_name}
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Kitchen Name: </Text>
                  {form.kitchen_name} ({form.kitchen_type})
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Contact: </Text>
                  {form.mobile} &bull; {form.email}
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Location: </Text>
                  {form.city}, {form.state} ({form.pincode})
                </Text>
                <Text className="text-white text-xs mb-1">
                  <Text className="text-slate-400 font-bold">Cuisines: </Text>
                  {form.cuisine_type.join(", ") || "None"}
                </Text>
                <Text className="text-white text-xs">
                  <Text className="text-slate-400 font-bold">Delivery Radius: </Text>
                  {form.delivery_radius}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View className="p-4 border-t border-white/10 bg-slate-900 flex-row justify-between items-center">
          {currentStep > 1 ? (
            <TouchableOpacity
              onPress={handleBack}
              className="px-5 py-3 rounded-xl bg-slate-800 border border-white/10"
            >
              <Text className="text-slate-300 font-bold text-xs uppercase">
                Previous
              </Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {currentStep < STEPS.length ? (
            <TouchableOpacity
              onPress={handleNext}
              className="px-6 py-3 rounded-xl bg-emerald-600 flex-row items-center"
            >
              <Text className="text-white font-bold text-xs uppercase mr-1">
                Next
              </Text>
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
      <Modal visible={showDatePicker} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm">
            <Text className="text-white font-black text-base mb-4 text-center">
              Select Date of Birth
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
                onPress={confirmDob}
                className="flex-1 bg-emerald-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-xs">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm">
            <Text className="text-white font-black text-base mb-4 text-center">
              Select Time
            </Text>
            <View className="flex-row gap-2 mb-5 justify-center">
              <TextInput
                value={selectedHour}
                onChangeText={setSelectedHour}
                keyboardType="number-pad"
                maxLength={2}
                className="w-16 bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-center text-lg font-bold"
              />
              <Text className="text-white text-2xl font-bold self-center">:</Text>
              <TextInput
                value={selectedMinute}
                onChangeText={setSelectedMinute}
                keyboardType="number-pad"
                maxLength={2}
                className="w-16 bg-slate-950 border border-white/10 rounded-xl p-3 text-white text-center text-lg font-bold"
              />
              <TouchableOpacity
                onPress={() =>
                  setSelectedPeriod(selectedPeriod === "AM" ? "PM" : "AM")
                }
                className="bg-emerald-600/30 border border-emerald-500/50 rounded-xl px-4 justify-center"
              >
                <Text className="text-emerald-300 font-black text-base">
                  {selectedPeriod}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowTimePicker(false)}
                className="flex-1 bg-slate-800 py-3 rounded-xl items-center"
              >
                <Text className="text-slate-300 font-bold text-xs">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmTime}
                className="flex-1 bg-emerald-600 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-xs">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* State Selection Modal */}
      <Modal visible={showStateModal} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent>
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[70%] p-5" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
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

      {/* Upload Choice Modal */}
      <Modal visible={uploadModalVisible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
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
                Take Photo / Video
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
        title="Chef updated"
        message="The home chef details were updated successfully."
        onClose={() => {
          setSuccessVisible(false);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
};

export default EditHomeChef;

import React, { useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import {
    MapPin,
    Navigation,
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    Eye,
    EyeOff,
    Calendar,
    Clock,
    Camera,
    Image as ImageIcon,
    Video,
    Trash2,
    UploadCloud,
    Sparkles,
    User,
    Store,
    Clock3,
    FileText,
    Share2,
    ShieldCheck,
    Truck,
    CheckCircle,
} from "lucide-react-native";
import {
    launchImageLibrary,
    launchCamera,
    ImageLibraryOptions,
    CameraOptions,
    Asset,
} from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";

import { post } from "../services/api";

// ============================================================
// CONSTANTS
// ============================================================

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
    { id: 10, label: "Review", title: "Review & Submit" },
];

const emptyForm = {
    // Step 1: Personal Information
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
    profile_photo: null as Asset | null,

    // Step 2: Address Information
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

    // Step 3: Kitchen Information
    kitchen_name: "",
    kitchen_address: "",
    kitchen_type: "Home Kitchen",
    veg_nonveg: "Veg",
    experience_years: "",
    cuisine_type: [] as string[],
    daily_order_capacity: "",
    kitchen_photos: [] as Asset[],
    kitchen_videos: null as Asset | null,
    cooking_area_photo: null as Asset | null,

    // Step 4: Food Availability
    available_days: [] as string[],
    available_slots: [] as string[],

    // Step 5: Business Details
    fssai_available: "No",
    gst_available: "No",
    aadhaar_number: "",
    pan_number: "",
    account_holder_name: "",
    bank_branch: "",
    bank_account_number: "",
    ifsc_code: "",
    upi_id: "",
    passbook_image: null as Asset | null,

    // Step 6: Social Media
    instagram_url: "",
    facebook_url: "",
    youtube_url: "",
    website_url: "",

    // Step 7: Creator Profile
    about_me: "",
    cooking_story: "",
    why_choose_me: "",
    languages_known: "",
    introduction_video: null as Asset | null,

    // Step 8: Proof Verification
    aadhaar_front_url: null as Asset | null,
    aadhaar_back_url: null as Asset | null,
    pan_card_url: null as Asset | null,
    selfie_verification_url: null as Asset | null,

    // Step 9: Delivery Preferences
    delivery_radius: "5 KM",
    preorder_available: false,
    cutoff_time: "",
    opening_time: "",
    closing_time: "",
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AddHomeChef = () => {
    const navigation = useNavigation<any>();

    const [form, setForm] = useState(emptyForm);
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    // Visibility toggles
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Modals
    const [pickerModalVisible, setPickerModalVisible] = useState(false);
    const [activePickerField, setActivePickerField] = useState<{
        field: string;
        mediaType: "photo" | "video";
        multiple: boolean;
    } | null>(null);

    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [tempYear, setTempYear] = useState("1995");
    const [tempMonth, setTempMonth] = useState("08");
    const [tempDay, setTempDay] = useState("15");

    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [activeTimeField, setActiveTimeField] = useState<string | null>(null);
    const [tempHour, setTempHour] = useState("09");
    const [tempMinute, setTempMinute] = useState("00");
    const [tempPeriod, setTempPeriod] = useState("AM");

    const [stateModalVisible, setStateModalVisible] = useState(false);
    const [stateSearch, setStateSearch] = useState("");

    // ============================================================
    // FIELD UPDATER
    // ============================================================

    const updateField = (field: string, value: any) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // ============================================================
    // DOB CHANGE & AGE CALCULATION
    // ============================================================

    const handleDobChange = (dob: string) => {
        let calculatedAge = "";
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            let ageVal = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                ageVal--;
            }
            calculatedAge = ageVal >= 0 ? ageVal.toString() : "";
        }
        setForm((prev) => ({
            ...prev,
            date_of_birth: dob,
            age: calculatedAge,
        }));
    };

    // ============================================================
    // FILL SAMPLE DATA
    // ============================================================

    const fillSampleChefData = () => {
        setForm({
            first_name: "Priya",
            last_name: "Rao",
            gender: "Female",
            date_of_birth: "1992-08-15",
            age: "32",
            mobile: "9876543210",
            alt_mobile: "9123456780",
            email: "priya.rao@example.com",
            password: "Test@1234",
            confirmPassword: "Test@1234",
            profile_photo: null,

            house_number: "22B",
            street: "Maple Avenue",
            area: "Shanti Nagar",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600042",
            country: "India",
            google_map_location: "https://maps.google.com/?q=13.0827,80.2707",
            latitude: "13.0827",
            longitude: "80.2707",

            kitchen_name: "Priya's Home Kitchen",
            kitchen_address: "22B, Maple Avenue, Shanti Nagar, Chennai",
            kitchen_type: "Home Kitchen",
            veg_nonveg: "Veg",
            experience_years: "10",
            cuisine_type: ["South Indian", "Healthy Foods"],
            daily_order_capacity: "40",
            kitchen_photos: [],
            kitchen_videos: null,
            cooking_area_photo: null,

            available_days: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ],
            available_slots: ["Breakfast", "Lunch", "Dinner", "Evening Snacks"],

            fssai_available: "Yes",
            gst_available: "No",
            aadhaar_number: "987654321012",
            pan_number: "ABCDE1234F",
            account_holder_name: "Priya Rao",
            bank_branch: "Anna Nagar Branch",
            bank_account_number: "123456789012",
            ifsc_code: "SBIN0001234",
            upi_id: "priya@okaxis",
            passbook_image: null,

            instagram_url: "https://instagram.com/priya_chef",
            facebook_url: "https://facebook.com/priyahomechef",
            youtube_url: "https://youtube.com/@priyafood",
            website_url: "https://priyahomekitchen.example.com",

            about_me:
                "I am a passionate home chef specializing in authentic South Indian meals.",
            cooking_story:
                "Cooking for family and friends inspired me to share home-cooked flavors with the neighborhood.",
            why_choose_me:
                "Fresh ingredients, traditional recipes, and fast delivery make every meal special.",
            languages_known: "Tamil, English, Hindi",
            introduction_video: null,

            aadhaar_front_url: null,
            aadhaar_back_url: null,
            pan_card_url: null,
            selfie_verification_url: null,

            delivery_radius: "5 KM",
            preorder_available: true,
            cutoff_time: "09:00 PM",
            opening_time: "07:00 AM",
            closing_time: "10:00 PM",
        });
        Alert.alert("Sample Loaded", "Sample chef details populated successfully!");
    };

    // ============================================================
    // MEDIA PICKER HANDLERS
    // ============================================================

    const openMediaOptions = (
        field: string,
        mediaType: "photo" | "video" = "photo",
        multiple: boolean = false
    ) => {
        setActivePickerField({ field, mediaType, multiple });
        setPickerModalVisible(true);
    };

    const handlePickFromGallery = async () => {
        if (!activePickerField) return;
        setPickerModalVisible(false);

        const options: ImageLibraryOptions = {
            mediaType: activePickerField.mediaType,
            selectionLimit: activePickerField.multiple ? 5 : 1,
            quality: 0.8,
        };

        try {
            const result = await launchImageLibrary(options);
            if (result.didCancel || !result.assets || result.assets.length === 0) {
                return;
            }

            if (activePickerField.multiple) {
                const current = (form as any)[activePickerField.field] || [];
                updateField(activePickerField.field, [
                    ...current,
                    ...result.assets,
                ]);
            } else {
                updateField(activePickerField.field, result.assets[0]);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to pick file");
        }
    };

    const handleTakePhoto = async () => {
        if (!activePickerField) return;
        setPickerModalVisible(false);

        const options: CameraOptions = {
            mediaType: activePickerField.mediaType,
            quality: 0.8,
            saveToPhotos: false,
        };

        try {
            const result = await launchCamera(options);
            if (result.didCancel || !result.assets || result.assets.length === 0) {
                return;
            }

            if (activePickerField.multiple) {
                const current = (form as any)[activePickerField.field] || [];
                updateField(activePickerField.field, [
                    ...current,
                    result.assets[0],
                ]);
            } else {
                updateField(activePickerField.field, result.assets[0]);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to take photo");
        }
    };

    // ============================================================
    // FETCH LAT/LNG VIA OPENSTREETMAP
    // ============================================================

    const fetchLatLng = async () => {
        if (!form.area || !form.city || !form.state || !form.pincode) {
            Alert.alert(
                "Address Incomplete",
                "Please enter Area, City, State and Pincode before fetching coordinates."
            );
            return;
        }

        try {
            setFetchingLocation(true);

            const address = [
                form.area,
                form.city,
                form.state,
                form.pincode,
                form.country || "India",
            ]
                .filter(Boolean)
                .join(", ");

            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                address
            )}`;

            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "User-Agent": "VeetuRusiFranchiseApp/1.0",
                },
            });

            if (!response.ok) {
                throw new Error("Location request failed");
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                Alert.alert(
                    "Location Not Found",
                    "Could not find coordinates for this address. Please check and try again."
                );
                return;
            }

            const lat = String(data[0].lat);
            const lon = String(data[0].lon);

            updateField("latitude", lat);
            updateField("longitude", lon);
            updateField(
                "google_map_location",
                `https://www.google.com/maps?q=${lat},${lon}`
            );

            Alert.alert(
                "Location Found",
                `Latitude: ${lat}\nLongitude: ${lon}\nGoogle Map link updated.`
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to fetch location.");
        } finally {
            setFetchingLocation(false);
        }
    };

    // ============================================================
    // FORM VALIDATION & SUBMISSION
    // ============================================================

    const validateStep = (step: number): boolean => {
        if (step === 1) {
            if (!form.first_name.trim()) {
                Alert.alert("Required", "Please enter First Name.");
                return false;
            }
            if (!form.mobile.trim() || form.mobile.length < 10) {
                Alert.alert("Required", "Please enter a valid 10-digit mobile number.");
                return false;
            }
            if (!form.email.trim()) {
                Alert.alert("Required", "Please enter Email address.");
                return false;
            }
            if (!form.password) {
                Alert.alert("Required", "Please enter a Password.");
                return false;
            }
            if (form.password !== form.confirmPassword) {
                Alert.alert("Mismatch", "Password and Confirm Password do not match.");
                return false;
            }
        } else if (step === 2) {
            if (!form.house_number.trim() || !form.street.trim() || !form.area.trim()) {
                Alert.alert("Required", "Please enter House Number, Street and Area.");
                return false;
            }
            if (!form.city.trim() || !form.pincode.trim()) {
                Alert.alert("Required", "Please enter City and Pincode.");
                return false;
            }
        } else if (step === 3) {
            if (!form.kitchen_name.trim()) {
                Alert.alert("Required", "Please enter Kitchen Name.");
                return false;
            }
            if (form.cuisine_type.length === 0) {
                Alert.alert("Required", "Please select at least one Speciality Cuisine.");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 10));
        }
    };

    const previousStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!form.first_name.trim() || !form.mobile.trim() || !form.email.trim()) {
            Alert.alert("Validation Error", "Please fill in all mandatory personal details.");
            setCurrentStep(1);
            return;
        }

        try {
            setSaving(true);

            const formData = new FormData();

            // Personal
            formData.append("first_name", form.first_name);
            formData.append("last_name", form.last_name);
            formData.append(
                "name",
                [form.first_name, form.last_name].filter(Boolean).join(" ")
            );
            formData.append("gender", form.gender);
            formData.append("date_of_birth", form.date_of_birth);
            if (form.age) formData.append("age", form.age);
            formData.append("mobile", form.mobile);
            formData.append("alt_mobile", form.alt_mobile);
            formData.append("email", form.email);
            formData.append("password", form.password);

            // Address
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
            formData.append(
                "address",
                [
                    form.house_number,
                    form.street,
                    form.area,
                    form.city,
                    form.state,
                    form.pincode,
                ]
                    .filter(Boolean)
                    .join(", ")
            );

            // Kitchen
            formData.append("kitchen_name", form.kitchen_name);
            formData.append("kitchen_address", form.kitchen_address);
            formData.append("kitchen_type", form.kitchen_type);
            formData.append("veg_nonveg", form.veg_nonveg);
            formData.append("experience_years", form.experience_years);
            formData.append("cuisine_type", form.cuisine_type.join(","));
            formData.append("daily_order_capacity", form.daily_order_capacity);

            // Availability
            formData.append("available_days", form.available_days.join(","));
            formData.append("available_slots", form.available_slots.join(","));

            // Business
            formData.append("fssai_available", form.fssai_available);
            formData.append("gst_available", form.gst_available);
            formData.append("aadhaar_number", form.aadhaar_number);
            formData.append("pan_number", form.pan_number);
            formData.append("account_holder_name", form.account_holder_name);
            formData.append("bank_branch", form.bank_branch);
            formData.append("bank_account_number", form.bank_account_number);
            formData.append("ifsc_code", form.ifsc_code);
            formData.append("upi_id", form.upi_id);

            // Social
            formData.append("instagram_url", form.instagram_url);
            formData.append("facebook_url", form.facebook_url);
            formData.append("youtube_url", form.youtube_url);
            formData.append("website_url", form.website_url);

            // Creator
            formData.append("about_me", form.about_me);
            formData.append("cooking_story", form.cooking_story);
            formData.append("why_choose_me", form.why_choose_me);
            formData.append("languages_known", form.languages_known);

            // Delivery
            formData.append("delivery_radius", form.delivery_radius);
            formData.append("preorder_available", form.preorder_available ? "1" : "0");
            formData.append("cutoff_time", form.cutoff_time);
            formData.append("opening_time", form.opening_time);
            formData.append("closing_time", form.closing_time);

            // File Attachments
            const appendFile = (key: string, asset: Asset | null) => {
                if (asset && asset.uri) {
                    formData.append(key, {
                        uri: asset.uri,
                        type: asset.type || "image/jpeg",
                        name: asset.fileName || `${key}.jpg`,
                    } as any);
                }
            };

            appendFile("profile_photo", form.profile_photo);
            appendFile("cooking_area_photo", form.cooking_area_photo);
            appendFile("passbook_image", form.passbook_image);
            appendFile("aadhaar_front_url", form.aadhaar_front_url);
            appendFile("aadhaar_back_url", form.aadhaar_back_url);
            appendFile("pan_card_url", form.pan_card_url);
            appendFile("selfie_verification_url", form.selfie_verification_url);
            appendFile("introduction_video", form.introduction_video);
            appendFile("kitchen_videos", form.kitchen_videos);

            if (form.kitchen_photos && form.kitchen_photos.length > 0) {
                form.kitchen_photos.forEach((photo, idx) => {
                    if (photo && photo.uri) {
                        formData.append("kitchen_photos", {
                            uri: photo.uri,
                            type: photo.type || "image/jpeg",
                            name: photo.fileName || `kitchen_${idx}.jpg`,
                        } as any);
                    }
                });
            }

            await post("/admin/homechefs", formData);

            Alert.alert(
                "Success 🎉",
                "Home Chef registered successfully!",
                [
                    {
                        text: "Done",
                        onPress: () => navigation.goBack(),
                    },
                ]
            );
        } catch (error: any) {
            console.log("Create Home Chef Error:", error);
            Alert.alert("Submission Failed", error.message || "Failed to create home chef.");
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // UI REUSABLE COMPONENTS
    // ============================================================

    const inputClass =
        "bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-white font-medium";
    const labelClass =
        "text-[11px] text-slate-300 font-bold uppercase tracking-widest mb-2";

    const renderFileUploadBox = (
        label: string,
        field: string,
        value: Asset | Asset[] | null,
        mediaType: "photo" | "video" = "photo",
        multiple: boolean = false
    ) => {
        const isMultiple = Array.isArray(value);

        return (
            <View className="mb-5">
                <Text className={labelClass}>{label}</Text>

                {isMultiple ? (
                    <View>
                        {value && value.length > 0 && (
                            <View className="flex-row flex-wrap gap-2 mb-3">
                                {value.map((item, idx) => (
                                    <View
                                        key={idx}
                                        className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-900"
                                    >
                                        <Image
                                            source={{ uri: item.uri }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            onPress={() => {
                                                const updated = value.filter(
                                                    (_, i) => i !== idx
                                                );
                                                updateField(field, updated);
                                            }}
                                            className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 items-center justify-center"
                                        >
                                            <X size={12} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() =>
                                openMediaOptions(field, mediaType, true)
                            }
                            className="border border-dashed border-emerald-500/40 bg-slate-900/80 rounded-2xl p-4 items-center justify-center flex-row"
                        >
                            <UploadCloud size={20} color="#10B981" />
                            <Text className="text-emerald-400 font-bold ml-2 text-xs uppercase tracking-wider">
                                {value && value.length > 0
                                    ? `Add More Photos (${value.length} selected)`
                                    : "Upload Photos"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        {value && (value as Asset).uri ? (
                            <View className="flex-row items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-2">
                                <View className="flex-row items-center flex-1 mr-2">
                                    {mediaType === "video" ? (
                                        <View className="w-12 h-12 rounded-xl bg-indigo-500/20 items-center justify-center mr-3">
                                            <Video size={22} color="#818CF8" />
                                        </View>
                                    ) : (
                                        <Image
                                            source={{
                                                uri: (value as Asset).uri,
                                            }}
                                            className="w-12 h-12 rounded-xl mr-3 bg-slate-800"
                                            resizeMode="cover"
                                        />
                                    )}
                                    <View className="flex-1">
                                        <Text
                                            className="text-white text-xs font-bold"
                                            numberOfLines={1}
                                        >
                                            {(value as Asset).fileName ||
                                                "Uploaded File"}
                                        </Text>
                                        <Text className="text-emerald-400 text-[10px] mt-0.5">
                                            Ready to upload
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    onPress={() => updateField(field, null)}
                                    className="p-2 bg-red-500/10 rounded-xl"
                                >
                                    <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() =>
                                    openMediaOptions(field, mediaType, false)
                                }
                                className="border border-dashed border-slate-700 bg-slate-900/60 rounded-2xl p-4 items-center justify-center flex-row"
                            >
                                <UploadCloud size={20} color="#64748B" />
                                <Text className="text-slate-300 font-bold ml-2 text-xs uppercase tracking-wider">
                                    Select {mediaType === "video" ? "Video" : "File"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const ReviewItem = ({
        label,
        value,
    }: {
        label: string;
        value: any;
    }) => (
        <View className="w-1/2 p-2">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                {label}
            </Text>
            <Text className="text-white text-sm font-semibold mt-0.5">
                {value ? String(value) : "—"}
            </Text>
        </View>
    );

    // ============================================================
    // RENDER SCREEN
    // ============================================================

    return (
        <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                {/* ================= HEADER ================= */}
                <View className="px-5 pt-3 pb-3 border-b border-slate-800 flex-row items-center justify-between">
                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                className="mr-3 p-1.5 bg-slate-900 rounded-xl border border-slate-800"
                            >
                                <ChevronLeft size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                            <View>
                                <Text className="text-white text-xl font-black">
                                    Add Home Chef
                                </Text>
                                <Text className="text-emerald-400 text-xs font-bold">
                                    Step {currentStep} of 10: {STEPS[currentStep - 1]?.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={fillSampleChefData}
                        className="bg-indigo-600/20 border border-indigo-500/30 px-3 py-2 rounded-xl flex-row items-center"
                    >
                        <Sparkles size={14} color="#818CF8" />
                        <Text className="text-indigo-300 font-bold text-[11px] ml-1.5">
                            Sample
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View className="h-1 bg-slate-900">
                    <View
                        className="h-full bg-emerald-500"
                        style={{ width: `${(currentStep / 10) * 100}%` }}
                    />
                </View>

                {/* Step Tabs Horizontal Scroll */}
                <View className="border-b border-slate-800 bg-slate-950 py-2">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    >
                        {STEPS.map((step) => {
                            const active = currentStep === step.id;
                            const done = currentStep > step.id;
                            return (
                                <TouchableOpacity
                                    key={step.id}
                                    onPress={() => setCurrentStep(step.id)}
                                    className={`px-3 py-1.5 rounded-xl border flex-row items-center ${
                                        active
                                            ? "bg-emerald-600 border-emerald-500"
                                            : done
                                            ? "bg-slate-900 border-emerald-500/30"
                                            : "bg-slate-900 border-slate-800"
                                    }`}
                                >
                                    <Text
                                        className={`text-[10px] font-black ${
                                            active
                                                ? "text-white"
                                                : done
                                                ? "text-emerald-400"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {done ? "✓ " : `${step.id}. `}
                                        {step.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingTop: 20,
                        paddingBottom: 40,
                    }}
                >
                    {/* ================================================= */}
                    {/* STEP 1 — PERSONAL INFORMATION */}
                    {/* ================================================= */}
                    {currentStep === 1 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                👤 Personal Information
                            </Text>

                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>First Name *</Text>
                                    <TextInput
                                        value={form.first_name}
                                        onChangeText={(v) => updateField("first_name", v)}
                                        placeholder="Priya"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Last Name *</Text>
                                    <TextInput
                                        value={form.last_name}
                                        onChangeText={(v) => updateField("last_name", v)}
                                        placeholder="Rao"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            {renderFileUploadBox("Profile Photo", "profile_photo", form.profile_photo, "photo", false)}

                            {/* Gender */}
                            <View className="mb-5">
                                <Text className={labelClass}>Gender *</Text>
                                <View className="flex-row gap-2">
                                    {["Male", "Female", "Other"].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            onPress={() => updateField("gender", g)}
                                            className={`flex-1 py-3 rounded-2xl border items-center ${
                                                form.gender === g
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    form.gender === g
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {g}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Date of Birth Picker */}
                            <View className="mb-5">
                                <Text className={labelClass}>Date of Birth *</Text>
                                <TouchableOpacity
                                    onPress={() => setDateModalVisible(true)}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                >
                                    <View className="flex-row items-center">
                                        <Calendar size={18} color="#10B981" />
                                        <Text
                                            className={`ml-3 text-sm font-medium ${
                                                form.date_of_birth
                                                    ? "text-white"
                                                    : "text-slate-500"
                                            }`}
                                        >
                                            {form.date_of_birth
                                                ? `${form.date_of_birth} ${
                                                      form.age ? `(${form.age} yrs)` : ""
                                                  }`
                                                : "Select Date of Birth"}
                                        </Text>
                                    </View>
                                    <Text className="text-emerald-400 text-xs font-bold uppercase">
                                        Pick
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Mobile & Alt Mobile */}
                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Mobile Number *</Text>
                                    <TextInput
                                        value={form.mobile}
                                        onChangeText={(v) =>
                                            updateField("mobile", v.replace(/[^0-9]/g, ""))
                                        }
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        placeholder="10-digit mobile"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Alt Mobile</Text>
                                    <TextInput
                                        value={form.alt_mobile}
                                        onChangeText={(v) =>
                                            updateField("alt_mobile", v.replace(/[^0-9]/g, ""))
                                        }
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        placeholder="Optional"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            {/* Email */}
                            <View className="mb-5">
                                <Text className={labelClass}>Email Address *</Text>
                                <TextInput
                                    value={form.email}
                                    onChangeText={(v) => updateField("email", v)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="chef@example.com"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Password */}
                            <View className="mb-5">
                                <Text className={labelClass}>Password *</Text>
                                <View className="relative">
                                    <TextInput
                                        value={form.password}
                                        onChangeText={(v) => updateField("password", v)}
                                        secureTextEntry={!showPassword}
                                        placeholder="Password"
                                        placeholderTextColor="#64748b"
                                        className={`${inputClass} pr-12`}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} color="#94A3B8" />
                                        ) : (
                                            <Eye size={18} color="#94A3B8" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password */}
                            <View className="mb-6">
                                <Text className={labelClass}>Confirm Password *</Text>
                                <View className="relative">
                                    <TextInput
                                        value={form.confirmPassword}
                                        onChangeText={(v) =>
                                            updateField("confirmPassword", v)
                                        }
                                        secureTextEntry={!showConfirmPassword}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#64748b"
                                        className={`${inputClass} pr-12`}
                                    />
                                    <TouchableOpacity
                                        onPress={() =>
                                            setShowConfirmPassword(!showConfirmPassword)
                                        }
                                        className="absolute right-4 top-3.5"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={18} color="#94A3B8" />
                                        ) : (
                                            <Eye size={18} color="#94A3B8" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 2 — ADDRESS INFORMATION */}
                    {/* ================================================= */}
                    {currentStep === 2 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                📍 Address Information
                            </Text>

                            <View className="flex-row gap-3 mb-5">
                                <View className="w-1/3">
                                    <Text className={labelClass}>Door / Flat *</Text>
                                    <TextInput
                                        value={form.house_number}
                                        onChangeText={(v) =>
                                            updateField("house_number", v)
                                        }
                                        placeholder="22B"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Street Name *</Text>
                                    <TextInput
                                        value={form.street}
                                        onChangeText={(v) => updateField("street", v)}
                                        placeholder="Maple Avenue"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Area / Locality *</Text>
                                <TextInput
                                    value={form.area}
                                    onChangeText={(v) => updateField("area", v)}
                                    placeholder="Shanti Nagar"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>City *</Text>
                                    <TextInput
                                        value={form.city}
                                        onChangeText={(v) => updateField("city", v)}
                                        placeholder="Chennai"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Pincode *</Text>
                                    <TextInput
                                        value={form.pincode}
                                        onChangeText={(v) =>
                                            updateField("pincode", v.replace(/[^0-9]/g, ""))
                                        }
                                        keyboardType="numeric"
                                        maxLength={6}
                                        placeholder="600042"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            {/* State Selection */}
                            <View className="mb-5">
                                <Text className={labelClass}>State *</Text>
                                <TouchableOpacity
                                    onPress={() => setStateModalVisible(true)}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                >
                                    <Text className="text-white text-sm font-medium">
                                        {form.state || "Select State"}
                                    </Text>
                                    <Text className="text-emerald-400 text-xs font-bold uppercase">
                                        Change
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Country */}
                            <View className="mb-5">
                                <Text className={labelClass}>Country *</Text>
                                <TextInput
                                    value={form.country}
                                    onChangeText={(v) => updateField("country", v)}
                                    className={inputClass}
                                />
                            </View>

                            {/* Coordinates / Map Section */}
                            <TouchableOpacity
                                onPress={fetchLatLng}
                                disabled={fetchingLocation}
                                className="bg-emerald-600/20 border border-emerald-500/40 rounded-2xl p-4 flex-row items-center justify-center mb-5"
                            >
                                {fetchingLocation ? (
                                    <ActivityIndicator size="small" color="#10B981" />
                                ) : (
                                    <>
                                        <MapPin size={18} color="#10B981" />
                                        <Text className="text-emerald-400 font-bold ml-2 text-xs uppercase tracking-wider">
                                            📍 Get Latitude & Longitude
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Latitude</Text>
                                    <TextInput
                                        value={form.latitude}
                                        editable={false}
                                        placeholder="Auto-fetched"
                                        placeholderTextColor="#64748b"
                                        className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-3.5 text-emerald-400 font-mono text-xs"
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Longitude</Text>
                                    <TextInput
                                        value={form.longitude}
                                        editable={false}
                                        placeholder="Auto-fetched"
                                        placeholderTextColor="#64748b"
                                        className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-3.5 text-emerald-400 font-mono text-xs"
                                    />
                                </View>
                            </View>

                            <View className="mb-6">
                                <Text className={labelClass}>Google Map URL</Text>
                                <TextInput
                                    value={form.google_map_location}
                                    onChangeText={(v) =>
                                        updateField("google_map_location", v)
                                    }
                                    placeholder="https://maps.google.com/?q=..."
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 3 — KITCHEN INFORMATION */}
                    {/* ================================================= */}
                    {currentStep === 3 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                🍳 Kitchen Information
                            </Text>

                            <View className="mb-5">
                                <Text className={labelClass}>Kitchen Name *</Text>
                                <TextInput
                                    value={form.kitchen_name}
                                    onChangeText={(v) => updateField("kitchen_name", v)}
                                    placeholder="Example: Priya's Home Kitchen"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Kitchen Address</Text>
                                <TextInput
                                    value={form.kitchen_address}
                                    onChangeText={(v) => updateField("kitchen_address", v)}
                                    placeholder="Complete kitchen pickup address"
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white min-h-[90px]"
                                />
                            </View>

                            {/* Kitchen Type */}
                            <View className="mb-5">
                                <Text className={labelClass}>Kitchen Type *</Text>
                                <View className="flex-row gap-2">
                                    {[
                                        "Home Kitchen",
                                        "Cloud Kitchen",
                                        "Traditional Kitchen",
                                    ].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() =>
                                                updateField("kitchen_type", type)
                                            }
                                            className={`flex-1 py-3 px-2 rounded-2xl border items-center ${
                                                form.kitchen_type === type
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-[11px] font-bold text-center ${
                                                    form.kitchen_type === type
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Veg / Non-Veg */}
                            <View className="mb-5">
                                <Text className={labelClass}>Food Preference *</Text>
                                <View className="flex-row gap-2">
                                    {["Veg", "Non-Veg"].map((pref) => (
                                        <TouchableOpacity
                                            key={pref}
                                            onPress={() => updateField("veg_nonveg", pref)}
                                            className={`flex-1 py-3 rounded-2xl border items-center ${
                                                form.veg_nonveg === pref
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    form.veg_nonveg === pref
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {pref}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Experience & Capacity */}
                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Years Experience *</Text>
                                    <TextInput
                                        value={form.experience_years}
                                        onChangeText={(v) =>
                                            updateField("experience_years", v)
                                        }
                                        keyboardType="numeric"
                                        placeholder="e.g. 5"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Daily Capacity *</Text>
                                    <TextInput
                                        value={form.daily_order_capacity}
                                        onChangeText={(v) =>
                                            updateField("daily_order_capacity", v)
                                        }
                                        keyboardType="numeric"
                                        placeholder="e.g. 30 orders"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            {/* Speciality Cuisines */}
                            <View className="mb-5">
                                <Text className={labelClass}>Speciality Cuisine *</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {CUISINES.map((cuisine) => {
                                        const selected =
                                            form.cuisine_type.includes(cuisine);
                                        return (
                                            <TouchableOpacity
                                                key={cuisine}
                                                onPress={() => {
                                                    const updated = selected
                                                        ? form.cuisine_type.filter(
                                                              (c) => c !== cuisine
                                                          )
                                                        : [
                                                              ...form.cuisine_type,
                                                              cuisine,
                                                          ];
                                                    updateField(
                                                        "cuisine_type",
                                                        updated
                                                    );
                                                }}
                                                className={`px-3.5 py-2.5 rounded-xl border flex-row items-center ${
                                                    selected
                                                        ? "bg-emerald-600 border-emerald-500"
                                                        : "bg-slate-900 border-slate-800"
                                                }`}
                                            >
                                                {selected && (
                                                    <Check
                                                        size={14}
                                                        color="#fff"
                                                        style={{ marginRight: 4 }}
                                                    />
                                                )}
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        selected
                                                            ? "text-white"
                                                            : "text-slate-300"
                                                    }`}
                                                >
                                                    {cuisine}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {renderFileUploadBox("Kitchen Photos * (Multiple)", "kitchen_photos", form.kitchen_photos, "photo", true)}
                            {renderFileUploadBox("Kitchen Video", "kitchen_videos", form.kitchen_videos, "video", false)}
                            {renderFileUploadBox("Cooking Area Photo *", "cooking_area_photo", form.cooking_area_photo, "photo", false)}
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 4 — FOOD AVAILABILITY */}
                    {/* ================================================= */}
                    {currentStep === 4 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                📅 Food Availability
                            </Text>

                            {/* Available Days */}
                            <View className="mb-6">
                                <Text className={labelClass}>Available Days</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {DAYS.map((day) => {
                                        const selected =
                                            form.available_days.includes(day);
                                        return (
                                            <TouchableOpacity
                                                key={day}
                                                onPress={() => {
                                                    const updated = selected
                                                        ? form.available_days.filter(
                                                              (d) => d !== day
                                                          )
                                                        : [
                                                              ...form.available_days,
                                                              day,
                                                          ];
                                                    updateField(
                                                        "available_days",
                                                        updated
                                                    );
                                                }}
                                                className={`px-4 py-3 rounded-xl border flex-row items-center ${
                                                    selected
                                                        ? "bg-emerald-600 border-emerald-500"
                                                        : "bg-slate-900 border-slate-800"
                                                }`}
                                            >
                                                {selected && (
                                                    <Check
                                                        size={14}
                                                        color="#fff"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                )}
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        selected
                                                            ? "text-white"
                                                            : "text-slate-300"
                                                    }`}
                                                >
                                                    {day}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Available Slots */}
                            <View className="mb-6">
                                <Text className={labelClass}>Available Time Slots</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {SLOTS.map((slot) => {
                                        const selected =
                                            form.available_slots.includes(slot);
                                        return (
                                            <TouchableOpacity
                                                key={slot}
                                                onPress={() => {
                                                    const updated = selected
                                                        ? form.available_slots.filter(
                                                              (s) => s !== slot
                                                          )
                                                        : [
                                                              ...form.available_slots,
                                                              slot,
                                                          ];
                                                    updateField(
                                                        "available_slots",
                                                        updated
                                                    );
                                                }}
                                                className={`px-4 py-3 rounded-xl border flex-row items-center ${
                                                    selected
                                                        ? "bg-emerald-600 border-emerald-500"
                                                        : "bg-slate-900 border-slate-800"
                                                }`}
                                            >
                                                {selected && (
                                                    <Check
                                                        size={14}
                                                        color="#fff"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                )}
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        selected
                                                            ? "text-white"
                                                            : "text-slate-300"
                                                    }`}
                                                >
                                                    {slot}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 5 — BUSINESS & BANK DETAILS */}
                    {/* ================================================= */}
                    {currentStep === 5 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                💼 Business & Bank Details
                            </Text>

                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>FSSAI Certificate?</Text>
                                    <View className="flex-row gap-2">
                                        {["Yes", "No"].map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                onPress={() =>
                                                    updateField("fssai_available", opt)
                                                }
                                                className={`flex-1 py-3 rounded-2xl border items-center ${
                                                    form.fssai_available === opt
                                                        ? "bg-emerald-600/20 border-emerald-500"
                                                        : "bg-slate-900 border-slate-800"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        form.fssai_available === opt
                                                            ? "text-emerald-400 font-black"
                                                            : "text-slate-300"
                                                    }`}
                                                >
                                                    {opt}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View className="flex-1">
                                    <Text className={labelClass}>GST Available?</Text>
                                    <View className="flex-row gap-2">
                                        {["Yes", "No"].map((opt) => (
                                            <TouchableOpacity
                                                key={opt}
                                                onPress={() =>
                                                    updateField("gst_available", opt)
                                                }
                                                className={`flex-1 py-3 rounded-2xl border items-center ${
                                                    form.gst_available === opt
                                                        ? "bg-emerald-600/20 border-emerald-500"
                                                        : "bg-slate-900 border-slate-800"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        form.gst_available === opt
                                                            ? "text-emerald-400 font-black"
                                                            : "text-slate-300"
                                                    }`}
                                                >
                                                    {opt}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Aadhaar Number *</Text>
                                    <TextInput
                                        value={form.aadhaar_number}
                                        onChangeText={(v) =>
                                            updateField(
                                                "aadhaar_number",
                                                v.replace(/[^0-9]/g, "")
                                            )
                                        }
                                        keyboardType="numeric"
                                        maxLength={12}
                                        placeholder="12-digit number"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>PAN Number *</Text>
                                    <TextInput
                                        value={form.pan_number}
                                        onChangeText={(v) =>
                                            updateField("pan_number", v.toUpperCase())
                                        }
                                        autoCapitalize="characters"
                                        maxLength={10}
                                        placeholder="ABCDE1234F"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Account Holder Name *</Text>
                                <TextInput
                                    value={form.account_holder_name}
                                    onChangeText={(v) =>
                                        updateField("account_holder_name", v)
                                    }
                                    placeholder="Account Holder Name"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Bank Account Number *</Text>
                                <TextInput
                                    value={form.bank_account_number}
                                    onChangeText={(v) =>
                                        updateField("bank_account_number", v)
                                    }
                                    keyboardType="numeric"
                                    placeholder="Account Number"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>IFSC Code *</Text>
                                    <TextInput
                                        value={form.ifsc_code}
                                        onChangeText={(v) =>
                                            updateField("ifsc_code", v.toUpperCase())
                                        }
                                        autoCapitalize="characters"
                                        placeholder="SBIN0001234"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Branch Name *</Text>
                                    <TextInput
                                        value={form.bank_branch}
                                        onChangeText={(v) =>
                                            updateField("bank_branch", v)
                                        }
                                        placeholder="Branch Name"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>UPI ID *</Text>
                                <TextInput
                                    value={form.upi_id}
                                    onChangeText={(v) => updateField("upi_id", v)}
                                    autoCapitalize="none"
                                    placeholder="username@upi"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {renderFileUploadBox("Passbook / Cheque Photo *", "passbook_image", form.passbook_image, "photo", false)}
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 6 — SOCIAL MEDIA */}
                    {/* ================================================= */}
                    {currentStep === 6 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                🌐 Social Media Links
                            </Text>

                            <View className="mb-5">
                                <Text className={labelClass}>Instagram URL</Text>
                                <TextInput
                                    value={form.instagram_url}
                                    onChangeText={(v) =>
                                        updateField("instagram_url", v)
                                    }
                                    autoCapitalize="none"
                                    placeholder="https://instagram.com/username"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Facebook URL</Text>
                                <TextInput
                                    value={form.facebook_url}
                                    onChangeText={(v) =>
                                        updateField("facebook_url", v)
                                    }
                                    autoCapitalize="none"
                                    placeholder="https://facebook.com/page"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>YouTube Channel URL</Text>
                                <TextInput
                                    value={form.youtube_url}
                                    onChangeText={(v) =>
                                        updateField("youtube_url", v)
                                    }
                                    autoCapitalize="none"
                                    placeholder="https://youtube.com/@channel"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="mb-6">
                                <Text className={labelClass}>Website URL</Text>
                                <TextInput
                                    value={form.website_url}
                                    onChangeText={(v) => updateField("website_url", v)}
                                    autoCapitalize="none"
                                    placeholder="https://yourwebsite.com"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 7 — CREATOR PROFILE */}
                    {/* ================================================= */}
                    {currentStep === 7 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                ✨ Creator Profile
                            </Text>

                            <View className="mb-5">
                                <Text className={labelClass}>About Me *</Text>
                                <TextInput
                                    value={form.about_me}
                                    onChangeText={(v) => updateField("about_me", v)}
                                    placeholder="Tell customers about yourself..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white min-h-[90px]"
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Cooking Story *</Text>
                                <TextInput
                                    value={form.cooking_story}
                                    onChangeText={(v) =>
                                        updateField("cooking_story", v)
                                    }
                                    placeholder="Share your cooking journey..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white min-h-[90px]"
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Why Customers Should Order From Me *
                                </Text>
                                <TextInput
                                    value={form.why_choose_me}
                                    onChangeText={(v) =>
                                        updateField("why_choose_me", v)
                                    }
                                    placeholder="Tell customers why they should choose you..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white min-h-[90px]"
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Languages Known *</Text>
                                <TextInput
                                    value={form.languages_known}
                                    onChangeText={(v) =>
                                        updateField("languages_known", v)
                                    }
                                    placeholder="Tamil, English, Hindi..."
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {renderFileUploadBox("Introduction Video *", "introduction_video", form.introduction_video, "video", false)}
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 8 — PROOF VERIFICATION */}
                    {/* ================================================= */}
                    {currentStep === 8 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                🛡️ Proof Verification
                            </Text>

                            {renderFileUploadBox("Aadhaar Card Front *", "aadhaar_front_url", form.aadhaar_front_url, "photo", false)}
                            {renderFileUploadBox("Aadhaar Card Back *", "aadhaar_back_url", form.aadhaar_back_url, "photo", false)}
                            {renderFileUploadBox("PAN Card *", "pan_card_url", form.pan_card_url, "photo", false)}
                            {renderFileUploadBox("Selfie with Aadhaar *", "selfie_verification_url", form.selfie_verification_url, "photo", false)}
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 9 — DELIVERY PREFERENCES */}
                    {/* ================================================= */}
                    {currentStep === 9 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                🚚 Delivery Preferences
                            </Text>

                            {/* Delivery Radius */}
                            <View className="mb-5">
                                <Text className={labelClass}>Delivery Radius *</Text>
                                <View className="flex-row gap-2">
                                    {["2 KM", "3 KM", "5 KM"].map((r) => (
                                        <TouchableOpacity
                                            key={r}
                                            onPress={() =>
                                                updateField("delivery_radius", r)
                                            }
                                            className={`flex-1 py-3 rounded-2xl border items-center ${
                                                form.delivery_radius === r
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    form.delivery_radius === r
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {r}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Preorder Available */}
                            <View className="mb-5">
                                <Text className={labelClass}>Preorder Available?</Text>
                                <View className="flex-row gap-2">
                                    {[true, false].map((opt) => (
                                        <TouchableOpacity
                                            key={String(opt)}
                                            onPress={() =>
                                                updateField("preorder_available", opt)
                                            }
                                            className={`flex-1 py-3 rounded-2xl border items-center ${
                                                form.preorder_available === opt
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    form.preorder_available === opt
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {opt ? "Yes" : "No"}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Opening & Closing Times */}
                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Opening Time</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setActiveTimeField("opening_time");
                                            setTimeModalVisible(true);
                                        }}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center">
                                            <Clock size={16} color="#10B981" />
                                            <Text className="text-white text-xs font-semibold ml-2">
                                                {form.opening_time || "Select"}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-1">
                                    <Text className={labelClass}>Closing Time</Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setActiveTimeField("closing_time");
                                            setTimeModalVisible(true);
                                        }}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center">
                                            <Clock size={16} color="#10B981" />
                                            <Text className="text-white text-xs font-semibold ml-2">
                                                {form.closing_time || "Select"}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Cutoff Time */}
                            <View className="mb-6">
                                <Text className={labelClass}>Cutoff Time</Text>
                                <TextInput
                                    value={form.cutoff_time}
                                    onChangeText={(v) => updateField("cutoff_time", v)}
                                    placeholder="e.g. Order before 9 PM for next day"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 10 — REVIEW & SUMMARY */}
                    {/* ================================================= */}
                    {currentStep === 10 && (
                        <View className="px-5">
                            <Text className="text-white text-xl font-black mb-2">
                                📋 Review Home Chef Details
                            </Text>
                            <Text className="text-slate-400 text-xs mb-5">
                                Verify the information below before finalizing registration.
                            </Text>

                            {/* 1. Personal Section */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <User size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            1. Personal Info
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(1)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Name"
                                        value={`${form.first_name} ${form.last_name}`}
                                    />
                                    <ReviewItem label="Gender" value={form.gender} />
                                    <ReviewItem
                                        label="DOB / Age"
                                        value={`${form.date_of_birth || "—"} (${
                                            form.age ? `${form.age} yrs` : "—"
                                        })`}
                                    />
                                    <ReviewItem label="Mobile" value={form.mobile} />
                                    <ReviewItem label="Email" value={form.email} />
                                    <ReviewItem
                                        label="Photo Attached"
                                        value={form.profile_photo ? "Yes" : "No"}
                                    />
                                </View>
                            </View>

                            {/* 2. Address Section */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <MapPin size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            2. Address
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(2)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="House / Street"
                                        value={`${form.house_number}, ${form.street}`}
                                    />
                                    <ReviewItem
                                        label="Area / City"
                                        value={`${form.area}, ${form.city}`}
                                    />
                                    <ReviewItem
                                        label="State / Pincode"
                                        value={`${form.state} - ${form.pincode}`}
                                    />
                                    <ReviewItem
                                        label="Coordinates"
                                        value={
                                            form.latitude
                                                ? `${form.latitude}, ${form.longitude}`
                                                : "Not set"
                                        }
                                    />
                                </View>
                            </View>

                            {/* 3. Kitchen Section */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <Store size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            3. Kitchen
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(3)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Kitchen Name"
                                        value={form.kitchen_name}
                                    />
                                    <ReviewItem
                                        label="Type / Food"
                                        value={`${form.kitchen_type} (${form.veg_nonveg})`}
                                    />
                                    <ReviewItem
                                        label="Experience"
                                        value={`${form.experience_years} Years`}
                                    />
                                    <ReviewItem
                                        label="Daily Capacity"
                                        value={`${form.daily_order_capacity} orders`}
                                    />
                                    <View className="w-full p-2">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            Cuisines
                                        </Text>
                                        <Text className="text-white text-sm font-semibold mt-0.5">
                                            {form.cuisine_type.join(", ") || "—"}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* 4. Availability Section */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <Clock3 size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            4. Availability
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(4)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="p-2">
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                        Days
                                    </Text>
                                    <Text className="text-white text-sm font-semibold mt-0.5">
                                        {form.available_days.join(", ") || "None"}
                                    </Text>
                                </View>
                                <View className="p-2">
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                        Slots
                                    </Text>
                                    <Text className="text-white text-sm font-semibold mt-0.5">
                                        {form.available_slots.join(", ") || "None"}
                                    </Text>
                                </View>
                            </View>

                            {/* 5. Business & Banking */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <FileText size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            5. Business & Bank
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(5)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Aadhaar"
                                        value={form.aadhaar_number}
                                    />
                                    <ReviewItem label="PAN" value={form.pan_number} />
                                    <ReviewItem
                                        label="Account Holder"
                                        value={form.account_holder_name}
                                    />
                                    <ReviewItem
                                        label="Bank / Branch"
                                        value={form.bank_branch}
                                    />
                                    <ReviewItem
                                        label="Account Number"
                                        value={form.bank_account_number}
                                    />
                                    <ReviewItem label="IFSC" value={form.ifsc_code} />
                                    <ReviewItem label="UPI ID" value={form.upi_id} />
                                    <ReviewItem
                                        label="FSSAI / GST"
                                        value={`${form.fssai_available} / ${form.gst_available}`}
                                    />
                                </View>
                            </View>

                            {/* 6. Social & Creator */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <Share2 size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            6. Social & Creator
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(7)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Languages"
                                        value={form.languages_known}
                                    />
                                    <ReviewItem
                                        label="Instagram"
                                        value={form.instagram_url || "—"}
                                    />
                                    <View className="w-full p-2">
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            About Me
                                        </Text>
                                        <Text className="text-white text-sm font-semibold mt-0.5">
                                            {form.about_me || "—"}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* 7. Proof Verification */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <ShieldCheck size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            7. Verification Documents
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(8)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Aadhaar Front"
                                        value={form.aadhaar_front_url ? "Attached" : "Not attached"}
                                    />
                                    <ReviewItem
                                        label="Aadhaar Back"
                                        value={form.aadhaar_back_url ? "Attached" : "Not attached"}
                                    />
                                    <ReviewItem
                                        label="PAN Card"
                                        value={form.pan_card_url ? "Attached" : "Not attached"}
                                    />
                                    <ReviewItem
                                        label="Selfie Verification"
                                        value={form.selfie_verification_url ? "Attached" : "Not attached"}
                                    />
                                </View>
                            </View>

                            {/* 8. Delivery Preferences */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <Truck size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            8. Delivery Preferences
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(9)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Delivery Radius"
                                        value={form.delivery_radius}
                                    />
                                    <ReviewItem
                                        label="Preorder"
                                        value={form.preorder_available ? "Yes" : "No"}
                                    />
                                    <ReviewItem
                                        label="Opening Time"
                                        value={form.opening_time}
                                    />
                                    <ReviewItem
                                        label="Closing Time"
                                        value={form.closing_time}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* NAVIGATION BUTTONS */}
                    {/* ================================================= */}
                    <View className="px-5 mt-3 flex-row gap-3">
                        {currentStep > 1 && (
                            <TouchableOpacity
                                onPress={previousStep}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4 flex-row items-center justify-center"
                            >
                                <ChevronLeft size={18} color="#CBD5E1" />
                                <Text className="text-slate-200 font-black uppercase tracking-widest ml-1 text-xs">
                                    Previous
                                </Text>
                            </TouchableOpacity>
                        )}

                        {currentStep < 10 ? (
                            <TouchableOpacity
                                onPress={nextStep}
                                className="flex-1 bg-emerald-600 rounded-2xl py-4 flex-row items-center justify-center"
                            >
                                <Text className="text-white font-black uppercase tracking-widest mr-1 text-xs">
                                    Next Step
                                </Text>
                                <ChevronRight size={18} color="#ffffff" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={saving}
                                className={`flex-1 rounded-2xl py-4 flex-row items-center justify-center ${
                                    saving ? "bg-emerald-800" : "bg-emerald-600"
                                }`}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Text className="text-white font-black uppercase tracking-widest mr-2 text-xs">
                                            Save Home Chef
                                        </Text>
                                        <Check size={18} color="#fff" />
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ================================================= */}
            {/* PICKER CHOICE MODAL (Gallery vs Camera) */}
            {/* ================================================= */}
            <Modal
                visible={pickerModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end p-5">
                    <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-3">
                        <Text className="text-white text-base font-black mb-4 text-center">
                            Select Attachment
                        </Text>

                        <TouchableOpacity
                            onPress={handlePickFromGallery}
                            className="bg-slate-800 p-4 rounded-2xl flex-row items-center mb-3"
                        >
                            <ImageIcon size={20} color="#10B981" />
                            <Text className="text-white font-bold ml-3 text-sm">
                                Choose from Gallery
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleTakePhoto}
                            className="bg-slate-800 p-4 rounded-2xl flex-row items-center"
                        >
                            <Camera size={20} color="#3B82F6" />
                            <Text className="text-white font-bold ml-3 text-sm">
                                Take Photo / Record
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => setPickerModalVisible(false)}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-2xl items-center"
                    >
                        <Text className="text-slate-400 font-bold text-sm">
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* ================================================= */}
            {/* DATE PICKER MODAL */}
            {/* ================================================= */}
            <Modal
                visible={dateModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDateModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-center p-5">
                    <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <Text className="text-white text-lg font-black mb-2 text-center">
                            Select Date of Birth
                        </Text>
                        <Text className="text-slate-400 text-xs text-center mb-6">
                            Pick Year, Month and Day
                        </Text>

                        {/* Year Selector */}
                        <Text className={labelClass}>Year</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-4"
                        >
                            {Array.from({ length: 65 }, (_, i) => String(2010 - i)).map(
                                (year) => (
                                    <TouchableOpacity
                                        key={year}
                                        onPress={() => setTempYear(year)}
                                        className={`px-3.5 py-2 rounded-xl mr-2 border ${
                                            tempYear === year
                                                ? "bg-emerald-600 border-emerald-500"
                                                : "bg-slate-800 border-slate-700"
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-bold ${
                                                tempYear === year
                                                    ? "text-white"
                                                    : "text-slate-300"
                                            }`}
                                        >
                                            {year}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </ScrollView>

                        {/* Month Selector */}
                        <Text className={labelClass}>Month</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-4"
                        >
                            {[
                                { name: "Jan", val: "01" },
                                { name: "Feb", val: "02" },
                                { name: "Mar", val: "03" },
                                { name: "Apr", val: "04" },
                                { name: "May", val: "05" },
                                { name: "Jun", val: "06" },
                                { name: "Jul", val: "07" },
                                { name: "Aug", val: "08" },
                                { name: "Sep", val: "09" },
                                { name: "Oct", val: "10" },
                                { name: "Nov", val: "11" },
                                { name: "Dec", val: "12" },
                            ].map((m) => (
                                <TouchableOpacity
                                    key={m.val}
                                    onPress={() => setTempMonth(m.val)}
                                    className={`px-3.5 py-2 rounded-xl mr-2 border ${
                                        tempMonth === m.val
                                            ? "bg-emerald-600 border-emerald-500"
                                            : "bg-slate-800 border-slate-700"
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-bold ${
                                            tempMonth === m.val
                                                ? "text-white"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {m.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Day Selector */}
                        <Text className={labelClass}>Day</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-6"
                        >
                            {Array.from({ length: 31 }, (_, i) =>
                                String(i + 1).padStart(2, "0")
                            ).map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    onPress={() => setTempDay(d)}
                                    className={`w-9 h-9 rounded-xl mr-2 border items-center justify-center ${
                                        tempDay === d
                                            ? "bg-emerald-600 border-emerald-500"
                                            : "bg-slate-800 border-slate-700"
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-bold ${
                                            tempDay === d
                                                ? "text-white"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {d}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setDateModalVisible(false)}
                                className="flex-1 bg-slate-800 py-3.5 rounded-2xl items-center"
                            >
                                <Text className="text-slate-300 font-bold text-xs uppercase">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    const formatted = `${tempYear}-${tempMonth}-${tempDay}`;
                                    handleDobChange(formatted);
                                    setDateModalVisible(false);
                                }}
                                className="flex-1 bg-emerald-600 py-3.5 rounded-2xl items-center"
                            >
                                <Text className="text-white font-black text-xs uppercase">
                                    Confirm Date
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ================================================= */}
            {/* TIME PICKER MODAL */}
            {/* ================================================= */}
            <Modal
                visible={timeModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setTimeModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-center p-5">
                    <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <Text className="text-white text-lg font-black mb-2 text-center">
                            Select Time
                        </Text>

                        {/* Quick Presets */}
                        <View className="flex-row flex-wrap gap-2 mb-4 justify-center">
                            {[
                                "06:00 AM",
                                "07:00 AM",
                                "08:00 AM",
                                "09:00 AM",
                                "12:00 PM",
                                "06:00 PM",
                                "08:00 PM",
                                "10:00 PM",
                            ].map((preset) => (
                                <TouchableOpacity
                                    key={preset}
                                    onPress={() => {
                                        if (activeTimeField) {
                                            updateField(activeTimeField, preset);
                                        }
                                        setTimeModalVisible(false);
                                    }}
                                    className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
                                >
                                    <Text className="text-emerald-400 text-xs font-bold">
                                        {preset}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Hours */}
                        <Text className={labelClass}>Hour</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-4"
                        >
                            {Array.from({ length: 12 }, (_, i) =>
                                String(i + 1).padStart(2, "0")
                            ).map((h) => (
                                <TouchableOpacity
                                    key={h}
                                    onPress={() => setTempHour(h)}
                                    className={`w-10 h-10 rounded-xl mr-2 border items-center justify-center ${
                                        tempHour === h
                                            ? "bg-emerald-600 border-emerald-500"
                                            : "bg-slate-800 border-slate-700"
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-bold ${
                                            tempHour === h
                                                ? "text-white"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {h}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Minutes */}
                        <Text className={labelClass}>Minute</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="mb-4"
                        >
                            {["00", "15", "30", "45"].map((min) => (
                                <TouchableOpacity
                                    key={min}
                                    onPress={() => setTempMinute(min)}
                                    className={`px-4 py-2.5 rounded-xl mr-2 border items-center justify-center ${
                                        tempMinute === min
                                            ? "bg-emerald-600 border-emerald-500"
                                            : "bg-slate-800 border-slate-700"
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-bold ${
                                            tempMinute === min
                                                ? "text-white"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {min}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* AM / PM */}
                        <View className="flex-row gap-3 mb-6">
                            {["AM", "PM"].map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setTempPeriod(p)}
                                    className={`flex-1 py-3 rounded-2xl border items-center ${
                                        tempPeriod === p
                                            ? "bg-emerald-600/20 border-emerald-500"
                                            : "bg-slate-800 border-slate-700"
                                    }`}
                                >
                                    <Text
                                        className={`text-xs font-bold ${
                                            tempPeriod === p
                                                ? "text-emerald-400 font-black"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {p}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setTimeModalVisible(false)}
                                className="flex-1 bg-slate-800 py-3.5 rounded-2xl items-center"
                            >
                                <Text className="text-slate-300 font-bold text-xs uppercase">
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (activeTimeField) {
                                        updateField(
                                            activeTimeField,
                                            `${tempHour}:${tempMinute} ${tempPeriod}`
                                        );
                                    }
                                    setTimeModalVisible(false);
                                }}
                                className="flex-1 bg-emerald-600 py-3.5 rounded-2xl items-center"
                            >
                                <Text className="text-white font-black text-xs uppercase">
                                    Confirm Time
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ================================================= */}
            {/* STATE SELECTION MODAL */}
            {/* ================================================= */}
            <Modal
                visible={stateModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setStateModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <View className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[70%]">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white text-base font-black">
                                Select State
                            </Text>
                            <TouchableOpacity
                                onPress={() => setStateModalVisible(false)}
                                className="p-1"
                            >
                                <X size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            value={stateSearch}
                            onChangeText={setStateSearch}
                            placeholder="Search state..."
                            placeholderTextColor="#64748b"
                            className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white mb-3"
                        />

                        <ScrollView className="flex-1">
                            {INDIAN_STATES.filter((s) =>
                                s.toLowerCase().includes(stateSearch.toLowerCase())
                            ).map((st) => (
                                <TouchableOpacity
                                    key={st}
                                    onPress={() => {
                                        updateField("state", st);
                                        setStateModalVisible(false);
                                    }}
                                    className={`py-3.5 px-4 rounded-xl mb-1 flex-row items-center justify-between ${
                                        form.state === st
                                            ? "bg-emerald-600/20"
                                            : "bg-transparent"
                                    }`}
                                >
                                    <Text
                                        className={`text-sm font-semibold ${
                                            form.state === st
                                                ? "text-emerald-400 font-bold"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {st}
                                    </Text>
                                    {form.state === st && (
                                        <Check size={16} color="#10B981" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default AddHomeChef;
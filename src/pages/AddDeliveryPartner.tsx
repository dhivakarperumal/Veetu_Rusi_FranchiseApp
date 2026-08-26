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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    X,
    Eye,
    EyeOff,
    Calendar,
    Camera,
    Image as ImageIcon,
    Trash2,
    UploadCloud,
    Sparkles,
    User,
    MapPin,
    PhoneCall,
    Bike,
    FileText,
    CreditCard,
    ShieldCheck,
    Briefcase,
} from "lucide-react-native";
import {
    launchImageLibrary,
    launchCamera,
    ImageLibraryOptions,
    CameraOptions,
    Asset,
} from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import { post } from "../services/api";
import CenteredDialog from "../components/CenteredDialog";

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

const BLOOD_GROUPS = [
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "Unknown",
];

const VEHICLE_TYPES = ["Bike", "Scooter", "Bicycle", "Electric Bike"];

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
    "Harley-Davidson",
    "Piaggio",
    "Ather",
    "Okinawa",
    "Pure EV",
    "Revolt",
];

const VEHICLE_COLORS = [
    "Black",
    "White",
    "Silver",
    "Grey",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Orange",
    "Maroon",
    "Brown",
    "Gold",
    "Purple",
    "Beige",
];

const RELATIONSHIPS = [
    "Parent",
    "Spouse",
    "Sibling",
    "Friend",
    "Colleague",
    "Other",
];

const PREFERRED_DISTANCES = ["3 KM", "5 KM", "10 KM"];

const STEPS = [
    { id: 1, label: "Personal", title: "Personal Information" },
    { id: 2, label: "Address", title: "Address Information" },
    { id: 3, label: "Emergency", title: "Emergency Contact" },
    { id: 4, label: "Vehicle", title: "Vehicle Information" },
    { id: 5, label: "Driving", title: "Driving Information" },
    { id: 6, label: "Bank", title: "Bank & Identity" },
    { id: 7, label: "Documents", title: "Document Upload" },
    { id: 8, label: "Preferences", title: "Work Preferences" },
    { id: 9, label: "Review", title: "Review & Submit" },
];

const emptyForm = {
    // Step 1: Personal
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
    profile_photo: null as Asset | null,

    // Step 2: Address
    current_address: "",
    permanent_address: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    live_location: "",
    latitude: "",
    longitude: "",

    // Step 3: Emergency Contact
    emergency_contact_name: "",
    emergency_contact_relationship: "Parent",
    emergency_contact_mobile: "",

    // Step 4: Vehicle Information
    vehicle_type: "Bike",
    vehicle_brand: "Honda",
    vehicle_model: "",
    vehicle_number: "",
    vehicle_color: "Black",
    vehicle_front_photo: null as Asset | null,

    // Step 5: Driving Information
    license_number: "",
    license_holder_name: "",
    license_issue_date: "",
    license_expiry_date: "",
    license_front_image: null as Asset | null,
    license_back_image: null as Asset | null,

    // Step 6: Bank & Identity
    account_holder_name: "",
    bank_name: "",
    bank_account_number: "",
    ifsc_code: "",
    branch_name: "",
    upi_id: "",
    aadhaar_number: "",
    pan_number: "",

    // Step 7: Documents
    aadhaar_front_url: null as Asset | null,
    aadhaar_back_url: null as Asset | null,
    pan_card_url: null as Asset | null,
    selfie_verification_url: null as Asset | null,
    selfie_with_vehicle: null as Asset | null,
    selfie_with_aadhaar: null as Asset | null,

    // Step 8: Preferences
    available_areas: "",
    available_time_morning: true,
    available_time_afternoon: true,
    available_time_evening: true,
    available_time_night: false,
    preferred_distance: "3 KM",
    delivery_radius: "5",
    driving_experience: "2",
    status: "Pending",
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AddDeliveryPartner = () => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const [form, setForm] = useState(emptyForm);
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    // Password visibility
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Media Picker Modal
    const [pickerModalVisible, setPickerModalVisible] = useState(false);
    const [activePickerField, setActivePickerField] = useState<string | null>(null);

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [activeDateField, setActiveDateField] = useState<string>("date_of_birth");
    const [datePickerValue, setDatePickerValue] = useState<Date>(new Date(1998, 0, 1));

    // State Selector Modal
    const [stateModalVisible, setStateModalVisible] = useState(false);
    const [stateSearch, setStateSearch] = useState("");

    // Brand Selector Modal
    const [brandModalVisible, setBrandModalVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

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
    // AGE / DOB HANDLER
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

    const fillSamplePartnerData = () => {
        setForm({
            first_name: "Karthik",
            last_name: "Selvam",
            gender: "Male",
            date_of_birth: "1997-04-12",
            age: "27",
            blood_group: "B+",
            mobile: "9876543211",
            alt_mobile: "9123456789",
            email: "karthik.selvam@example.com",
            password: "Test@1234",
            confirmPassword: "Test@1234",
            profile_photo: null,

            current_address: "14/2, Anna Nagar Main Road, West Block",
            permanent_address: "14/2, Anna Nagar Main Road, West Block",
            city: "Chennai",
            state: "Tamil Nadu",
            pincode: "600040",
            live_location: "Anna Nagar Roundtana, Chennai",
            latitude: "13.0850",
            longitude: "80.2100",

            emergency_contact_name: "Selvam Murugan",
            emergency_contact_relationship: "Parent",
            emergency_contact_mobile: "9840123456",

            vehicle_type: "Bike",
            vehicle_brand: "Honda",
            vehicle_model: "Shine 125",
            vehicle_number: "TN02BC4321",
            vehicle_color: "Black",
            vehicle_front_photo: null,

            license_number: "TN0220180009876",
            license_holder_name: "Karthik Selvam",
            license_issue_date: "2018-05-10",
            license_expiry_date: "2038-05-09",
            license_front_image: null,
            license_back_image: null,

            account_holder_name: "Karthik Selvam",
            bank_name: "State Bank of India",
            bank_account_number: "30987654321",
            ifsc_code: "SBIN0000876",
            branch_name: "Anna Nagar East",
            upi_id: "karthik@okhdfcbank",
            aadhaar_number: "987654321098",
            pan_number: "ABCDE9876F",

            aadhaar_front_url: null,
            aadhaar_back_url: null,
            pan_card_url: null,
            selfie_verification_url: null,
            selfie_with_vehicle: null,
            selfie_with_aadhaar: null,

            available_areas: "Anna Nagar, Shenoy Nagar, Kilpauk, Mogappair",
            available_time_morning: true,
            available_time_afternoon: true,
            available_time_evening: true,
            available_time_night: false,
            preferred_distance: "5 KM",
            delivery_radius: "6",
            driving_experience: "4",
            status: "Pending",
        });
        Alert.alert("Sample Loaded", "Sample delivery partner details populated successfully!");
    };

    // ============================================================
    // MEDIA PICKER HANDLERS
    // ============================================================

    const openMediaOptions = (field: string) => {
        setActivePickerField(field);
        setPickerModalVisible(true);
    };

    const handlePickFromGallery = async () => {
        if (!activePickerField) return;
        setPickerModalVisible(false);

        const options: ImageLibraryOptions = {
            mediaType: "photo",
            selectionLimit: 1,
            quality: 0.8,
        };

        try {
            const result = await launchImageLibrary(options);
            if (result.didCancel || !result.assets || result.assets.length === 0) {
                return;
            }
            updateField(activePickerField, result.assets[0]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to pick file");
        }
    };

    const handleTakePhoto = async () => {
        if (!activePickerField) return;
        setPickerModalVisible(false);

        const options: CameraOptions = {
            mediaType: "photo",
            quality: 0.8,
            saveToPhotos: false,
        };

        try {
            const result = await launchCamera(options);
            if (result.didCancel || !result.assets || result.assets.length === 0) {
                return;
            }
            updateField(activePickerField, result.assets[0]);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to take photo");
        }
    };

    // ============================================================
    // FETCH LIVE GPS / NOMINATIM
    // ============================================================

    const fetchCoordinates = async () => {
        if (!form.city || !form.state || !form.pincode) {
            Alert.alert(
                "Address Incomplete",
                "Please enter City, State and Pincode first."
            );
            return;
        }

        try {
            setFetchingLocation(true);
            const address = [form.current_address, form.city, form.state, form.pincode, "India"]
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

            if (!response.ok) throw new Error("Location request failed");

            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                Alert.alert(
                    "Location Not Found",
                    "Could not find coordinates for this address. Setting live location as address."
                );
                updateField("live_location", address);
                return;
            }

            const lat = String(data[0].lat);
            const lon = String(data[0].lon);

            updateField("latitude", lat);
            updateField("longitude", lon);
            updateField(
                "live_location",
                `${form.city}, ${form.state} (${lat}, ${lon})`
            );

            Alert.alert(
                "Location Detected",
                `Latitude: ${lat}\nLongitude: ${lon}\nLive Location updated!`
            );
        } catch (error: any) {
            Alert.alert("Error", error.message || "Unable to fetch location.");
        } finally {
            setFetchingLocation(false);
        }
    };

    // ============================================================
    // STEP VALIDATION
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
            if (!form.current_address.trim()) {
                Alert.alert("Required", "Please enter Current Address.");
                return false;
            }
            if (!form.city.trim() || !form.pincode.trim()) {
                Alert.alert("Required", "Please enter City and Pincode.");
                return false;
            }
        } else if (step === 3) {
            if (!form.emergency_contact_name.trim() || !form.emergency_contact_mobile.trim()) {
                Alert.alert("Required", "Please enter Emergency Contact Name and Mobile.");
                return false;
            }
        } else if (step === 4) {
            if (!form.vehicle_model.trim() || !form.vehicle_number.trim()) {
                Alert.alert("Required", "Please enter Vehicle Model and Number.");
                return false;
            }
        } else if (step === 5) {
            if (!form.license_number.trim() || !form.license_holder_name.trim()) {
                Alert.alert("Required", "Please enter Driving License Number and Holder Name.");
                return false;
            }
        } else if (step === 6) {
            if (!form.account_holder_name.trim() || !form.bank_account_number.trim() || !form.ifsc_code.trim()) {
                Alert.alert("Required", "Please enter Bank Account details (Name, A/C No, IFSC).");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 9));
        }
    };

    const previousStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    // ============================================================
    // SUBMISSION HANDLER
    // ============================================================

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
            formData.append("blood_group", form.blood_group);
            formData.append("mobile", form.mobile);
            formData.append("alt_mobile", form.alt_mobile);
            formData.append("email", form.email);
            formData.append("password", form.password);

            // Address
            formData.append("current_address", form.current_address);
            formData.append(
                "permanent_address",
                form.permanent_address || form.current_address
            );
            formData.append("city", form.city);
            formData.append("state", form.state);
            formData.append("pincode", form.pincode);
            formData.append("live_location", form.live_location);
            formData.append("latitude", form.latitude);
            formData.append("longitude", form.longitude);

            // Emergency
            formData.append("emergency_contact_name", form.emergency_contact_name);
            formData.append(
                "emergency_contact_relationship",
                form.emergency_contact_relationship
            );
            formData.append(
                "emergency_contact_mobile",
                form.emergency_contact_mobile
            );

            // Vehicle
            formData.append("vehicle_type", form.vehicle_type);
            formData.append("vehicle_brand", form.vehicle_brand);
            formData.append("vehicle_model", form.vehicle_model);
            formData.append("vehicle_number", form.vehicle_number);
            formData.append("vehicle_color", form.vehicle_color);

            // Driving
            formData.append("license_number", form.license_number);
            formData.append("license_holder_name", form.license_holder_name);
            formData.append("license_issue_date", form.license_issue_date);
            formData.append("license_expiry_date", form.license_expiry_date);

            // Bank & Identity
            formData.append("account_holder_name", form.account_holder_name);
            formData.append("bank_name", form.bank_name);
            formData.append("bank_account_number", form.bank_account_number);
            formData.append("ifsc_code", form.ifsc_code);
            formData.append("branch_name", form.branch_name);
            formData.append("upi_id", form.upi_id);
            formData.append("aadhaar_number", form.aadhaar_number);
            formData.append("pan_number", form.pan_number);

            // Preferences
            formData.append("available_areas", form.available_areas);
            formData.append(
                "available_time_morning",
                form.available_time_morning ? "1" : "0"
            );
            formData.append(
                "available_time_afternoon",
                form.available_time_afternoon ? "1" : "0"
            );
            formData.append(
                "available_time_evening",
                form.available_time_evening ? "1" : "0"
            );
            formData.append(
                "available_time_night",
                form.available_time_night ? "1" : "0"
            );
            formData.append("preferred_distance", form.preferred_distance);
            formData.append("delivery_radius", form.delivery_radius);
            formData.append("driving_experience", form.driving_experience);
            formData.append("status", form.status);

            // Files
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
            appendFile("vehicle_front_photo", form.vehicle_front_photo);
            appendFile("license_front_image", form.license_front_image);
            appendFile("license_back_image", form.license_back_image);
            appendFile("aadhaar_front_url", form.aadhaar_front_url);
            appendFile("aadhaar_back_url", form.aadhaar_back_url);
            appendFile("pan_card_url", form.pan_card_url);
            appendFile("selfie_verification_url", form.selfie_verification_url);
            appendFile("selfie_with_vehicle", form.selfie_with_vehicle);
            appendFile("selfie_with_aadhaar", form.selfie_with_aadhaar);

            await post("/admin/delivery-partners", formData);

            setSuccessVisible(true);
        } catch (error: any) {
            console.log("Create Delivery Partner Error:", error);
            Alert.alert("Submission Failed", error.message || "Failed to create delivery partner.");
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
        value: Asset | null
    ) => {
        return (
            <View className="mb-5">
                <Text className={labelClass}>{label}</Text>
                {value && value.uri ? (
                    <View className="flex-row items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-2">
                        <View className="flex-row items-center flex-1 mr-2">
                            <Image
                                source={{ uri: value.uri }}
                                className="w-12 h-12 rounded-xl mr-3 bg-slate-800"
                                resizeMode="cover"
                            />
                            <View className="flex-1">
                                <Text
                                    className="text-white text-xs font-bold"
                                    numberOfLines={1}
                                >
                                    {value.fileName || "Uploaded Document"}
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
                        onPress={() => openMediaOptions(field)}
                        className="border border-dashed border-slate-700 bg-slate-900/60 rounded-2xl p-4 items-center justify-center flex-row"
                    >
                        <UploadCloud size={20} color="#64748B" />
                        <Text className="text-slate-300 font-bold ml-2 text-xs uppercase tracking-wider">
                            Upload File / Photo
                        </Text>
                    </TouchableOpacity>
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

    const openDatePickerFor = (field: string) => {
        setActiveDateField(field);
        const currentVal = (form as any)[field];
        let d = new Date();
        if (field === "date_of_birth") {
            d = new Date(1998, 0, 1);
        }
        if (currentVal && typeof currentVal === "string") {
            const cleanStr = currentVal.split("T")[0].split(" ")[0].trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
                const parts = cleanStr.split("-").map(Number);
                const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
                if (!isNaN(parsed.getTime())) d = parsed;
            }
        }
        setDatePickerValue(d);
        setShowDatePicker(true);
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (event.type === "set" && selectedDate) {
            const y = selectedDate.getFullYear();
            const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
            const d = String(selectedDate.getDate()).padStart(2, "0");
            const formatted = `${y}-${m}-${d}`;
            if (activeDateField === "date_of_birth") {
                handleDobChange(formatted);
            } else {
                updateField(activeDateField, formatted);
            }
        }
    };

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
                                    Add Delivery Partner
                                </Text>
                                <Text className="text-emerald-400 text-xs font-bold">
                                    Step {currentStep} of 9: {STEPS[currentStep - 1]?.label}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={fillSamplePartnerData}
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
                        style={{ width: `${(currentStep / 9) * 100}%` }}
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
                                        placeholder="Karthik"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Last Name *</Text>
                                    <TextInput
                                        value={form.last_name}
                                        onChangeText={(v) => updateField("last_name", v)}
                                        placeholder="Selvam"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            {renderFileUploadBox("Profile Photo *", "profile_photo", form.profile_photo)}

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

                            {/* DOB & Blood Group */}
                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Date of Birth *</Text>
                                    <TouchableOpacity
                                        onPress={() => openDatePickerFor("date_of_birth")}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center">
                                            <Calendar size={16} color="#10B981" />
                                            <Text
                                                className={`ml-2 text-xs font-semibold ${
                                                    form.date_of_birth
                                                        ? "text-white"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {form.date_of_birth || "Select"}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-1">
                                    <Text className={labelClass}>Blood Group *</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <View className="flex-row gap-1.5">
                                            {BLOOD_GROUPS.map((bg) => (
                                                <TouchableOpacity
                                                    key={bg}
                                                    onPress={() => updateField("blood_group", bg)}
                                                    className={`px-3 py-3 rounded-2xl border ${
                                                        form.blood_group === bg
                                                            ? "bg-emerald-600/20 border-emerald-500"
                                                            : "bg-slate-900 border-slate-800"
                                                    }`}
                                                >
                                                    <Text
                                                        className={`text-xs font-bold ${
                                                            form.blood_group === bg
                                                                ? "text-emerald-400 font-black"
                                                                : "text-slate-300"
                                                        }`}
                                                    >
                                                        {bg}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </ScrollView>
                                </View>
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
                                    placeholder="partner@example.com"
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

                            <View className="mb-5">
                                <Text className={labelClass}>Current Address *</Text>
                                <TextInput
                                    value={form.current_address}
                                    onChangeText={(v) => updateField("current_address", v)}
                                    placeholder="Enter full current residential address"
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white min-h-[85px]"
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Permanent Address</Text>
                                <TextInput
                                    value={form.permanent_address}
                                    onChangeText={(v) => updateField("permanent_address", v)}
                                    placeholder="Enter permanent address (or same as above)"
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white min-h-[85px]"
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
                                        placeholder="600040"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            {/* State Selector */}
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

                            {/* Live Location / Coordinates Button */}
                            <TouchableOpacity
                                onPress={fetchCoordinates}
                                disabled={fetchingLocation}
                                className="bg-emerald-600/20 border border-emerald-500/40 rounded-2xl p-4 flex-row items-center justify-center mb-5"
                            >
                                {fetchingLocation ? (
                                    <ActivityIndicator size="small" color="#10B981" />
                                ) : (
                                    <>
                                        <MapPin size={18} color="#10B981" />
                                        <Text className="text-emerald-400 font-bold ml-2 text-xs uppercase tracking-wider">
                                            📍 Auto-Detect Coordinates
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <View className="mb-6">
                                <Text className={labelClass}>Live GPS Location / Landmark *</Text>
                                <TextInput
                                    value={form.live_location}
                                    onChangeText={(v) => updateField("live_location", v)}
                                    placeholder="Enter current live GPS or landmark"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 3 — EMERGENCY CONTACT */}
                    {/* ================================================= */}
                    {currentStep === 3 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                📞 Emergency Contact
                            </Text>

                            <View className="mb-5">
                                <Text className={labelClass}>Emergency Contact Name *</Text>
                                <TextInput
                                    value={form.emergency_contact_name}
                                    onChangeText={(v) =>
                                        updateField("emergency_contact_name", v)
                                    }
                                    placeholder="e.g. Selvam Murugan"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>Relationship *</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {RELATIONSHIPS.map((rel) => (
                                        <TouchableOpacity
                                            key={rel}
                                            onPress={() =>
                                                updateField(
                                                    "emergency_contact_relationship",
                                                    rel
                                                )
                                            }
                                            className={`px-4 py-3 rounded-2xl border ${
                                                form.emergency_contact_relationship === rel
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    form.emergency_contact_relationship === rel
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {rel}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View className="mb-6">
                                <Text className={labelClass}>Emergency Contact Mobile *</Text>
                                <TextInput
                                    value={form.emergency_contact_mobile}
                                    onChangeText={(v) =>
                                        updateField(
                                            "emergency_contact_mobile",
                                            v.replace(/[^0-9]/g, "")
                                        )
                                    }
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    placeholder="10-digit emergency number"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 4 — VEHICLE INFORMATION */}
                    {/* ================================================= */}
                    {currentStep === 4 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                🛵 Vehicle Information
                            </Text>

                            {/* Vehicle Type */}
                            <View className="mb-5">
                                <Text className={labelClass}>Vehicle Type *</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {VEHICLE_TYPES.map((vt) => (
                                        <TouchableOpacity
                                            key={vt}
                                            onPress={() => updateField("vehicle_type", vt)}
                                            className={`px-4 py-3 rounded-2xl border ${
                                                form.vehicle_type === vt
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    form.vehicle_type === vt
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {vt}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Vehicle Brand */}
                            <View className="mb-5">
                                <Text className={labelClass}>Vehicle Brand *</Text>
                                <TouchableOpacity
                                    onPress={() => setBrandModalVisible(true)}
                                    className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                >
                                    <Text className="text-white text-sm font-medium">
                                        {form.vehicle_brand || "Select Brand"}
                                    </Text>
                                    <Text className="text-emerald-400 text-xs font-bold uppercase">
                                        Choose
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Vehicle Model & Number */}
                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Vehicle Model *</Text>
                                    <TextInput
                                        value={form.vehicle_model}
                                        onChangeText={(v) => updateField("vehicle_model", v)}
                                        placeholder="e.g. Shine 125"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Vehicle Number *</Text>
                                    <TextInput
                                        value={form.vehicle_number}
                                        onChangeText={(v) =>
                                            updateField("vehicle_number", v.toUpperCase())
                                        }
                                        autoCapitalize="characters"
                                        placeholder="TN02BC4321"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>

                            {/* Vehicle Color */}
                            <View className="mb-5">
                                <Text className={labelClass}>Vehicle Color *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View className="flex-row gap-2">
                                        {VEHICLE_COLORS.map((vc) => (
                                            <TouchableOpacity
                                                key={vc}
                                                onPress={() => updateField("vehicle_color", vc)}
                                                className={`px-3.5 py-2.5 rounded-2xl border ${
                                                    form.vehicle_color === vc
                                                        ? "bg-emerald-600/20 border-emerald-500"
                                                        : "bg-slate-900 border-slate-800"
                                                }`}
                                            >
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        form.vehicle_color === vc
                                                            ? "text-emerald-400 font-black"
                                                            : "text-slate-300"
                                                    }`}
                                                >
                                                    {vc}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {renderFileUploadBox("Vehicle Front Photo *", "vehicle_front_photo", form.vehicle_front_photo)}
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 5 — DRIVING INFORMATION */}
                    {/* ================================================= */}
                    {currentStep === 5 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                🪪 Driving License Details
                            </Text>

                            <View className="mb-5">
                                <Text className={labelClass}>Driving License Number *</Text>
                                <TextInput
                                    value={form.license_number}
                                    onChangeText={(v) =>
                                        updateField("license_number", v.toUpperCase())
                                    }
                                    autoCapitalize="characters"
                                    placeholder="e.g. TN0220180009876"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            <View className="mb-5">
                                <Text className={labelClass}>License Holder Name *</Text>
                                <TextInput
                                    value={form.license_holder_name}
                                    onChangeText={(v) =>
                                        updateField("license_holder_name", v)
                                    }
                                    placeholder="Name as on Driving License"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Issue & Expiry Dates */}
                            <View className="flex-row gap-3 mb-5">
                                <View className="flex-1">
                                    <Text className={labelClass}>Issue Date *</Text>
                                    <TouchableOpacity
                                        onPress={() => openDatePickerFor("license_issue_date")}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center">
                                            <Calendar size={16} color="#10B981" />
                                            <Text
                                                className={`ml-2 text-xs font-semibold ${
                                                    form.license_issue_date
                                                        ? "text-white"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {form.license_issue_date || "Select"}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-1">
                                    <Text className={labelClass}>Expiry Date *</Text>
                                    <TouchableOpacity
                                        onPress={() => openDatePickerFor("license_expiry_date")}
                                        className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 flex-row items-center justify-between"
                                    >
                                        <View className="flex-row items-center">
                                            <Calendar size={16} color="#10B981" />
                                            <Text
                                                className={`ml-2 text-xs font-semibold ${
                                                    form.license_expiry_date
                                                        ? "text-white"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {form.license_expiry_date || "Select"}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {renderFileUploadBox("License Front Photo *", "license_front_image", form.license_front_image)}
                            {renderFileUploadBox("License Back Photo *", "license_back_image", form.license_back_image)}
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 6 — BANK & IDENTITY */}
                    {/* ================================================= */}
                    {currentStep === 6 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                🏦 Bank & Identity Details
                            </Text>

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
                                <Text className={labelClass}>Bank Name *</Text>
                                <TextInput
                                    value={form.bank_name}
                                    onChangeText={(v) => updateField("bank_name", v)}
                                    placeholder="e.g. State Bank of India"
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
                                        placeholder="SBIN0000876"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Branch *</Text>
                                    <TextInput
                                        value={form.branch_name}
                                        onChangeText={(v) =>
                                            updateField("branch_name", v)
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

                            <View className="flex-row gap-3 mb-6">
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
                                        placeholder="12-digit Aadhaar"
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
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 7 — DOCUMENT UPLOAD */}
                    {/* ================================================= */}
                    {currentStep === 7 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                📑 Document Uploads
                            </Text>

                            {renderFileUploadBox("Aadhaar Card Front *", "aadhaar_front_url", form.aadhaar_front_url)}
                            {renderFileUploadBox("Aadhaar Card Back *", "aadhaar_back_url", form.aadhaar_back_url)}
                            {renderFileUploadBox("PAN Card *", "pan_card_url", form.pan_card_url)}
                            {renderFileUploadBox("Identity Selfie *", "selfie_verification_url", form.selfie_verification_url)}
                            {renderFileUploadBox("Selfie with Vehicle *", "selfie_with_vehicle", form.selfie_with_vehicle)}
                            {renderFileUploadBox("Selfie with Aadhaar *", "selfie_with_aadhaar", form.selfie_with_aadhaar)}
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 8 — WORK PREFERENCES */}
                    {/* ================================================= */}
                    {currentStep === 8 && (
                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4">
                                ⚙️ Work Preferences
                            </Text>

                            <View className="mb-5">
                                <Text className={labelClass}>Available Areas / Zones *</Text>
                                <TextInput
                                    value={form.available_areas}
                                    onChangeText={(v) => updateField("available_areas", v)}
                                    placeholder="e.g. Anna Nagar, Kilpauk, Mogappair"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Shift Toggles */}
                            <View className="mb-5">
                                <Text className={labelClass}>Available Shifts *</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {[
                                        { key: "available_time_morning", label: "Morning" },
                                        { key: "available_time_afternoon", label: "Afternoon" },
                                        { key: "available_time_evening", label: "Evening" },
                                        { key: "available_time_night", label: "Night" },
                                    ].map((shift) => {
                                        const checked = !!(form as any)[shift.key];
                                        return (
                                            <TouchableOpacity
                                                key={shift.key}
                                                onPress={() =>
                                                    updateField(shift.key, !checked)
                                                }
                                                className={`px-4 py-3 rounded-2xl border flex-row items-center ${
                                                    checked
                                                        ? "bg-emerald-600 border-emerald-500"
                                                        : "bg-slate-900 border-slate-800"
                                                }`}
                                            >
                                                {checked && (
                                                    <Check
                                                        size={14}
                                                        color="#fff"
                                                        style={{ marginRight: 6 }}
                                                    />
                                                )}
                                                <Text
                                                    className={`text-xs font-bold ${
                                                        checked
                                                            ? "text-white"
                                                            : "text-slate-300"
                                                    }`}
                                                >
                                                    {shift.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>

                            {/* Preferred Distance */}
                            <View className="mb-5">
                                <Text className={labelClass}>Preferred Distance *</Text>
                                <View className="flex-row gap-2">
                                    {PREFERRED_DISTANCES.map((d) => (
                                        <TouchableOpacity
                                            key={d}
                                            onPress={() =>
                                                updateField("preferred_distance", d)
                                            }
                                            className={`flex-1 py-3 rounded-2xl border items-center ${
                                                form.preferred_distance === d
                                                    ? "bg-emerald-600/20 border-emerald-500"
                                                    : "bg-slate-900 border-slate-800"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    form.preferred_distance === d
                                                        ? "text-emerald-400 font-black"
                                                        : "text-slate-300"
                                                }`}
                                            >
                                                {d}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Delivery Radius & Experience */}
                            <View className="flex-row gap-3 mb-6">
                                <View className="flex-1">
                                    <Text className={labelClass}>Delivery Radius (KM) *</Text>
                                    <TextInput
                                        value={form.delivery_radius}
                                        onChangeText={(v) =>
                                            updateField(
                                                "delivery_radius",
                                                v.replace(/[^0-9]/g, "")
                                            )
                                        }
                                        keyboardType="numeric"
                                        placeholder="5"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className={labelClass}>Driving Exp (Years) *</Text>
                                    <TextInput
                                        value={form.driving_experience}
                                        onChangeText={(v) =>
                                            updateField(
                                                "driving_experience",
                                                v.replace(/[^0-9]/g, "")
                                            )
                                        }
                                        keyboardType="numeric"
                                        placeholder="2"
                                        placeholderTextColor="#64748b"
                                        className={inputClass}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 9 — REVIEW & SUMMARY */}
                    {/* ================================================= */}
                    {currentStep === 9 && (
                        <View className="px-5">
                            <Text className="text-white text-xl font-black mb-2">
                                📋 Review Delivery Partner Details
                            </Text>
                            <Text className="text-slate-400 text-xs mb-5">
                                Verify all details below before finalizing registration.
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
                                    <ReviewItem
                                        label="Blood Group"
                                        value={form.blood_group}
                                    />
                                    <ReviewItem label="Mobile" value={form.mobile} />
                                    <ReviewItem label="Email" value={form.email} />
                                    <ReviewItem
                                        label="Profile Photo"
                                        value={form.profile_photo ? "Attached" : "No"}
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
                                        label="City / State"
                                        value={`${form.city}, ${form.state}`}
                                    />
                                    <ReviewItem
                                        label="Pincode"
                                        value={form.pincode}
                                    />
                                    <ReviewItem
                                        label="Live Location"
                                        value={form.live_location}
                                    />
                                </View>
                            </View>

                            {/* 3. Emergency Section */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <PhoneCall size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            3. Emergency Contact
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
                                        label="Contact Name"
                                        value={form.emergency_contact_name}
                                    />
                                    <ReviewItem
                                        label="Relationship"
                                        value={form.emergency_contact_relationship}
                                    />
                                    <ReviewItem
                                        label="Contact Mobile"
                                        value={form.emergency_contact_mobile}
                                    />
                                </View>
                            </View>

                            {/* 4. Vehicle Section */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <Bike size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            4. Vehicle
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
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Vehicle Type"
                                        value={form.vehicle_type}
                                    />
                                    <ReviewItem
                                        label="Brand & Model"
                                        value={`${form.vehicle_brand} ${form.vehicle_model}`}
                                    />
                                    <ReviewItem
                                        label="Vehicle Number"
                                        value={form.vehicle_number}
                                    />
                                    <ReviewItem
                                        label="Color"
                                        value={form.vehicle_color}
                                    />
                                </View>
                            </View>

                            {/* 5. Driving License */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <FileText size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            5. Driving License
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
                                        label="License Number"
                                        value={form.license_number}
                                    />
                                    <ReviewItem
                                        label="Holder Name"
                                        value={form.license_holder_name}
                                    />
                                    <ReviewItem
                                        label="Issue Date"
                                        value={form.license_issue_date}
                                    />
                                    <ReviewItem
                                        label="Expiry Date"
                                        value={form.license_expiry_date}
                                    />
                                </View>
                            </View>

                            {/* 6. Bank & Identity */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <CreditCard size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            6. Bank & Identity
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setCurrentStep(6)}
                                        className="bg-slate-800 px-3 py-1 rounded-lg"
                                    >
                                        <Text className="text-emerald-400 font-bold text-xs">
                                            Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View className="flex-row flex-wrap">
                                    <ReviewItem
                                        label="Account Holder"
                                        value={form.account_holder_name}
                                    />
                                    <ReviewItem
                                        label="Bank / Branch"
                                        value={`${form.bank_name} (${form.branch_name})`}
                                    />
                                    <ReviewItem
                                        label="Account Number"
                                        value={form.bank_account_number}
                                    />
                                    <ReviewItem
                                        label="IFSC"
                                        value={form.ifsc_code}
                                    />
                                    <ReviewItem
                                        label="Aadhaar No"
                                        value={form.aadhaar_number}
                                    />
                                    <ReviewItem
                                        label="PAN No"
                                        value={form.pan_number}
                                    />
                                </View>
                            </View>

                            {/* 7. Documents */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <ShieldCheck size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            7. Verification Proofs
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
                                        label="Aadhaar Front/Back"
                                        value={
                                            form.aadhaar_front_url
                                                ? "Attached"
                                                : "Missing"
                                        }
                                    />
                                    <ReviewItem
                                        label="PAN Card"
                                        value={
                                            form.pan_card_url
                                                ? "Attached"
                                                : "Missing"
                                        }
                                    />
                                    <ReviewItem
                                        label="Identity Selfie"
                                        value={
                                            form.selfie_verification_url
                                                ? "Attached"
                                                : "Missing"
                                        }
                                    />
                                    <ReviewItem
                                        label="Selfie With Vehicle"
                                        value={
                                            form.selfie_with_vehicle
                                                ? "Attached"
                                                : "Missing"
                                        }
                                    />
                                </View>
                            </View>

                            {/* 8. Work Preferences */}
                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
                                <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800">
                                    <View className="flex-row items-center">
                                        <Briefcase size={16} color="#10B981" />
                                        <Text className="text-emerald-400 font-black text-xs uppercase tracking-wider ml-2">
                                            8. Work Preferences
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
                                        label="Areas"
                                        value={form.available_areas}
                                    />
                                    <ReviewItem
                                        label="Preferred Distance"
                                        value={form.preferred_distance}
                                    />
                                    <ReviewItem
                                        label="Radius"
                                        value={`${form.delivery_radius} KM`}
                                    />
                                    <ReviewItem
                                        label="Experience"
                                        value={`${form.driving_experience} Years`}
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

                        {currentStep < 9 ? (
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
                                            Save Partner
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
            {/* PICKER CHOICE MODAL */}
            {/* ================================================= */}
            <Modal
                visible={pickerModalVisible}
                transparent
                animationType="fade"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setPickerModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end p-5">
                    <View
                        className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-3"
                        style={{ marginBottom: Math.max(insets.bottom, 12) }}
                    >
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
                                Take Photo
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => setPickerModalVisible(false)}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-2xl items-center"
                        style={{ marginBottom: insets.bottom }}
                    >
                        <Text className="text-slate-400 font-bold text-sm">
                            Cancel
                        </Text>
                    </TouchableOpacity>
                </View>
            </Modal>

            {/* ================================================= */}
            {/* NATIVE DATE TIME PICKER */}
            {/* ================================================= */}
            {showDatePicker && (
                <DateTimePicker
                    value={datePickerValue}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                />
            )}

            {/* ================================================= */}
            {/* STATE SELECTION MODAL */}
            {/* ================================================= */}
            <Modal
                visible={stateModalVisible}
                transparent
                animationType="slide"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setStateModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <View
                        className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[70%]"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
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

            {/* ================================================= */}
            {/* BRAND SELECTION MODAL */}
            {/* ================================================= */}
            <Modal
                visible={brandModalVisible}
                transparent
                animationType="slide"
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => setBrandModalVisible(false)}
            >
                <View className="flex-1 bg-black/80 justify-end">
                    <View
                        className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 max-h-[60%]"
                        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white text-base font-black">
                                Select Vehicle Brand
                            </Text>
                            <TouchableOpacity
                                onPress={() => setBrandModalVisible(false)}
                                className="p-1"
                            >
                                <X size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1">
                            {VEHICLE_BRANDS.map((vb) => (
                                <TouchableOpacity
                                    key={vb}
                                    onPress={() => {
                                        updateField("vehicle_brand", vb);
                                        setBrandModalVisible(false);
                                    }}
                                    className={`py-3.5 px-4 rounded-xl mb-1 flex-row items-center justify-between ${
                                        form.vehicle_brand === vb
                                            ? "bg-emerald-600/20"
                                            : "bg-transparent"
                                    }`}
                                >
                                    <Text
                                        className={`text-sm font-semibold ${
                                            form.vehicle_brand === vb
                                                ? "text-emerald-400 font-bold"
                                                : "text-slate-300"
                                        }`}
                                    >
                                        {vb}
                                    </Text>
                                    {form.vehicle_brand === vb && (
                                        <Check size={16} color="#10B981" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <CenteredDialog
                visible={successVisible}
                title="Partner created"
                message="The delivery partner was added successfully to your fleet."
                onClose={() => {
                    setSuccessVisible(false);
                    navigation.goBack();
                }}
            />
        </SafeAreaView>
    );
};

export default AddDeliveryPartner;

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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    MapPin,
    Navigation,
    ChevronLeft,
    ChevronRight,
} from "lucide-react-native";

import { post } from "../services/api";

const AddHomeChef = () => {
    // ============================================================
    // FORM STATE
    // ============================================================

    const [form, setForm] = useState({
        // Step 1
        first_name: "",
        last_name: "",
        gender: "Male",
        date_of_birth: "",
        mobile: "",
        alt_mobile: "",
        email: "",
        password: "",
        confirmPassword: "",
        profile_photo: null,

        // Step 2
        house_number: "",
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        google_map_location: "",
        latitude: "",
        longitude: "",

        // Step 3
        kitchen_name: "",
        kitchen_address: "",
        kitchen_type: "Home Kitchen",
        veg_nonveg: "Veg",
        experience_years: "",
        cuisine_type: [],
        daily_order_capacity: "",

        // Step 4
        available_days: [],
        available_slots: [],

        // Step 5
        fssai_available: "No",
        gst_available: "No",
        aadhaar_number: "",
        pan_number: "",
        bank_account_number: "",
        ifsc_code: "",
        account_holder_name: "",
        bank_branch: "",
        upi_id: "",
        passbook_image: null,

        // Step 6
        instagram_url: "",
        facebook_url: "",
        youtube_url: "",
        website_url: "",

        // Step 7
        about_me: "",
        cooking_story: "",
        why_choose_me: "",
        languages_known: "",
        introduction_video: null,

        // Step 8
        aadhaar_front_url: null,
        aadhaar_back_url: null,
        pan_card_url: null,
        selfie_verification_url: null,

        // Step 9
        delivery_radius: "5 KM",
        preorder_available: false,
        cutoff_time: "",
        opening_time: "",
        closing_time: "",
    });

    const [currentStep, setCurrentStep] = useState(1);

    const [fetchingLocation, setFetchingLocation] =
        useState(false);

    const [saving, setSaving] = useState(false);

    // ============================================================
    // COMMON FIELD UPDATE
    // ============================================================

    const updateField = (
        field: string,
        value: any
    ) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // ============================================================
    // STEP NAVIGATION
    // ============================================================

    const nextStep = () => {
        setCurrentStep((prev) =>
            Math.min(prev + 1, 9)
        );
    };

    const previousStep = () => {
        setCurrentStep((prev) =>
            Math.max(prev - 1, 1)
        );
    };

    // ============================================================
    // GET LATITUDE / LONGITUDE
    // ============================================================

    const fetchLatLng = async () => {
        if (
            !form.area ||
            !form.city ||
            !form.state ||
            !form.pincode
        ) {
            Alert.alert(
                "Address Required",
                "Please enter Area, City, State and Pincode first."
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

            const url =
                "https://nominatim.openstreetmap.org/search" +
                `?format=json&q=${encodeURIComponent(address)}`;

            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "User-Agent":
                        "VeetuRusiHomeChefApp/1.0",
                },
            });

            if (!response.ok) {
                throw new Error(
                    "Location request failed"
                );
            }

            const data = await response.json();

            if (
                !Array.isArray(data) ||
                data.length === 0
            ) {
                Alert.alert(
                    "Location Not Found",
                    "Please check the address and try again."
                );
                return;
            }

            const latitude = data[0].lat;
            const longitude = data[0].lon;

            updateField("latitude", latitude);
            updateField("longitude", longitude);

            updateField(
                "google_map_location",
                `https://www.google.com/maps?q=${latitude},${longitude}`
            );

            Alert.alert(
                "Success",
                "Latitude and longitude fetched successfully."
            );
        } catch (error) {
            console.log(
                "Location Error:",
                error
            );

            Alert.alert(
                "Location Error",
                "Unable to fetch location."
            );
        } finally {
            setFetchingLocation(false);
        }
    };

    // ============================================================
    // STYLES
    // ============================================================

    const inputClass =
        "bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white";

    const labelClass =
        "text-[11px] text-slate-300 font-bold uppercase tracking-widest mb-2";

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <SafeAreaView
            className="flex-1 bg-slate-950"
            edges={["top", "bottom"]}
        >
            <KeyboardAvoidingView
                className="flex-1"
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <View className="px-5 pt-3 pb-4 border-b border-slate-800">

                    <Text className="text-white text-2xl font-black">
                        Add Home Chef
                    </Text>

                    <Text className="text-slate-400 text-sm mt-1">
                        Step {currentStep} of 9
                    </Text>

                    {/* Progress */}

                    <View className="h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">

                        <View
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                                width: `${(currentStep / 9) * 100}%`,
                            }}
                        />

                    </View>

                </View>

                <ScrollView
                    className="flex-1"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingTop: 24,
                        paddingBottom: 30,
                    }}
                >

                    {/* ================================================= */}
                    {/* STEP 1 — PERSONAL INFORMATION */}
                    {/* ================================================= */}

                    {currentStep === 1 && (
                        <View className="px-5">

                            <Text className="text-white text-xl font-black mb-6">
                                Personal Information
                            </Text>

                            {/* First Name */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    First Name *
                                </Text>

                                <TextInput
                                    value={form.first_name}
                                    onChangeText={(value) =>
                                        updateField(
                                            "first_name",
                                            value
                                        )
                                    }
                                    placeholder="First Name"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Last Name */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Last Name *
                                </Text>

                                <TextInput
                                    value={form.last_name}
                                    onChangeText={(value) =>
                                        updateField(
                                            "last_name",
                                            value
                                        )
                                    }
                                    placeholder="Last Name"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Mobile */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Mobile Number *
                                </Text>

                                <TextInput
                                    value={form.mobile}
                                    onChangeText={(value) =>
                                        updateField(
                                            "mobile",
                                            value.replace(
                                                /[^0-9]/g,
                                                ""
                                            )
                                        )
                                    }
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    placeholder="10 digit mobile number"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Email */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Email ID *
                                </Text>

                                <TextInput
                                    value={form.email}
                                    onChangeText={(value) =>
                                        updateField(
                                            "email",
                                            value
                                        )
                                    }
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholder="Email address"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Next */}

                            <TouchableOpacity
                                onPress={nextStep}
                                className="bg-emerald-600 rounded-2xl py-4 mt-3"
                            >
                                <Text className="text-white text-center font-black uppercase tracking-widest">
                                    Next Step
                                </Text>
                            </TouchableOpacity>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 2 — ADDRESS INFORMATION */}
                    {/* ================================================= */}

                    {currentStep === 2 && (
                        <View className="px-5">

                            {/* Step Header */}

                            <View className="mb-6">

                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">

                                        <MapPin
                                            size={21}
                                            color="#34d399"
                                        />

                                    </View>

                                    <View>
                                        <Text className="text-white text-xl font-black">
                                            Address Information
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Enter the chef's kitchen location.
                                        </Text>
                                    </View>

                                </View>

                            </View>

                            {/* House Number */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    House Number *
                                </Text>

                                <TextInput
                                    value={form.house_number}
                                    onChangeText={(value) =>
                                        updateField(
                                            "house_number",
                                            value
                                        )
                                    }
                                    placeholder="House / Door Number"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Street */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Street *
                                </Text>

                                <TextInput
                                    value={form.street}
                                    onChangeText={(value) =>
                                        updateField(
                                            "street",
                                            value
                                        )
                                    }
                                    placeholder="Street name"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Area */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Area *
                                </Text>

                                <TextInput
                                    value={form.area}
                                    onChangeText={(value) =>
                                        updateField(
                                            "area",
                                            value
                                        )
                                    }
                                    placeholder="Area / Locality"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* City */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    City *
                                </Text>

                                <TextInput
                                    value={form.city}
                                    onChangeText={(value) =>
                                        updateField(
                                            "city",
                                            value
                                        )
                                    }
                                    placeholder="City"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* State */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    State *
                                </Text>

                                <TextInput
                                    value={form.state}
                                    onChangeText={(value) =>
                                        updateField(
                                            "state",
                                            value
                                        )
                                    }
                                    placeholder="State"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Country */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Country *
                                </Text>

                                <TextInput
                                    value={form.country}
                                    onChangeText={(value) =>
                                        updateField(
                                            "country",
                                            value
                                        )
                                    }
                                    placeholder="Country"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Pincode */}

                            <View className="mb-6">
                                <Text className={labelClass}>
                                    Pincode *
                                </Text>

                                <TextInput
                                    value={form.pincode}
                                    onChangeText={(value) =>
                                        updateField(
                                            "pincode",
                                            value.replace(
                                                /[^0-9]/g,
                                                ""
                                            )
                                        )
                                    }
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    placeholder="6 digit pincode"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Get Location */}

                            <TouchableOpacity
                                onPress={fetchLatLng}
                                disabled={fetchingLocation}
                                className={`rounded-2xl py-4 flex-row items-center justify-center ${fetchingLocation
                                    ? "bg-emerald-800"
                                    : "bg-emerald-600"
                                    }`}
                            >

                                {fetchingLocation ? (
                                    <ActivityIndicator
                                        size="small"
                                        color="#ffffff"
                                    />
                                ) : (
                                    <Navigation
                                        size={19}
                                        color="#ffffff"
                                    />
                                )}

                                <Text className="text-white font-black text-sm uppercase tracking-widest ml-2">
                                    {fetchingLocation
                                        ? "Fetching Location..."
                                        : "Get Latitude & Longitude"}
                                </Text>

                            </TouchableOpacity>

                            {/* Latitude */}

                            <View className="mt-6 mb-5">
                                <Text className={labelClass}>
                                    Latitude
                                </Text>

                                <TextInput
                                    value={form.latitude}
                                    editable={false}
                                    placeholder="Latitude"
                                    placeholderTextColor="#475569"
                                    className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-emerald-400"
                                />
                            </View>

                            {/* Longitude */}

                            <View className="mb-5">
                                <Text className={labelClass}>
                                    Longitude
                                </Text>

                                <TextInput
                                    value={form.longitude}
                                    editable={false}
                                    placeholder="Longitude"
                                    placeholderTextColor="#475569"
                                    className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-emerald-400"
                                />
                            </View>

                            {/* Google Map */}

                            <View className="mb-8">
                                <Text className={labelClass}>
                                    Google Map Location *
                                </Text>

                                <TextInput
                                    value={
                                        form.google_map_location
                                    }
                                    onChangeText={(value) =>
                                        updateField(
                                            "google_map_location",
                                            value
                                        )
                                    }
                                    autoCapitalize="none"
                                    keyboardType="url"
                                    placeholder="Google Maps URL"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />
                            </View>

                            {/* Navigation */}

                            <View className="flex-row gap-3">

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >
                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={nextStep}
                                    className="flex-1 bg-emerald-600 rounded-2xl py-4"
                                >
                                    <View className="flex-row items-center justify-center">

                                        <Text className="text-white font-black uppercase tracking-widest mr-1">
                                            Next Step
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color="#ffffff"
                                        />

                                    </View>
                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 3 — KITCHEN INFORMATION */}
                    {/* ================================================= */}

                    {currentStep === 3 && (
                        <View className="px-5">

                            {/* Step Header */}

                            <View className="mb-6">

                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">
                                        <Text className="text-emerald-400 text-xl">
                                            🍳
                                        </Text>
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-white text-xl font-black">
                                            Kitchen Information
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Tell us about the chef's kitchen and food specialty.
                                        </Text>
                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* KITCHEN NAME */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Kitchen Name *
                                </Text>

                                <TextInput
                                    value={form.kitchen_name}
                                    onChangeText={(value) =>
                                        updateField(
                                            "kitchen_name",
                                            value
                                        )
                                    }
                                    placeholder="Example: Priya's Home Kitchen"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                            </View>


                            {/* ================================================= */}
                            {/* KITCHEN ADDRESS */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Kitchen Address
                                </Text>

                                <TextInput
                                    value={form.kitchen_address}
                                    onChangeText={(value) =>
                                        updateField(
                                            "kitchen_address",
                                            value
                                        )
                                    }
                                    placeholder="Enter complete kitchen address"
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white min-h-[100px]"
                                />

                            </View>


                            {/* ================================================= */}
                            {/* KITCHEN TYPE */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Kitchen Type *
                                </Text>

                                <View className="flex-row flex-wrap gap-3">

                                    {[
                                        "Home Kitchen",
                                        "Cloud Kitchen",
                                        "Traditional Kitchen",
                                    ].map((type) => {

                                        const selected =
                                            form.kitchen_type === type;

                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() =>
                                                    updateField(
                                                        "kitchen_type",
                                                        type
                                                    )
                                                }
                                                className={`px-4 py-3 rounded-2xl border ${selected
                                                    ? "bg-emerald-600 border-emerald-500"
                                                    : "bg-slate-950 border-slate-800"
                                                    }`}
                                            >
                                                <Text
                                                    className={`text-sm font-bold ${selected
                                                        ? "text-white"
                                                        : "text-slate-400"
                                                        }`}
                                                >
                                                    {type}
                                                </Text>
                                            </TouchableOpacity>
                                        );

                                    })}

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* VEG / NON-VEG */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Food Type *
                                </Text>

                                <View className="flex-row gap-3">

                                    {[
                                        "Veg",
                                        "Non-Veg",
                                    ].map((type) => {

                                        const selected =
                                            form.veg_nonveg === type;

                                        return (
                                            <TouchableOpacity
                                                key={type}
                                                onPress={() =>
                                                    updateField(
                                                        "veg_nonveg",
                                                        type
                                                    )
                                                }
                                                className={`flex-1 py-4 rounded-2xl border ${selected
                                                    ? "bg-emerald-600 border-emerald-500"
                                                    : "bg-slate-950 border-slate-800"
                                                    }`}
                                            >

                                                <Text
                                                    className={`text-center font-black ${selected
                                                        ? "text-white"
                                                        : "text-slate-400"
                                                        }`}
                                                >
                                                    {type}
                                                </Text>

                                            </TouchableOpacity>
                                        );

                                    })}

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* EXPERIENCE */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Years Of Experience *
                                </Text>

                                <TextInput
                                    value={form.experience_years}
                                    onChangeText={(value) =>
                                        updateField(
                                            "experience_years",
                                            value.replace(
                                                /[^0-9]/g,
                                                ""
                                            )
                                        )
                                    }
                                    keyboardType="number-pad"
                                    placeholder="Example: 5"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                            </View>


                            {/* ================================================= */}
                            {/* CUISINE */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    Speciality Cuisine *
                                </Text>

                                <Text className="text-slate-500 text-xs mb-4">
                                    Select all cuisines the chef can prepare.
                                </Text>

                                <View className="flex-row flex-wrap gap-3">

                                    {[
                                        "South Indian",
                                        "North Indian",
                                        "Chinese",
                                        "Andhra",
                                        "Kerala",
                                        "Healthy Foods",
                                        "Millet Foods",
                                        "Desserts",
                                        "Others",
                                    ].map((cuisine) => {

                                        const selected =
                                            form.cuisine_type.includes(
                                                cuisine
                                            );

                                        return (
                                            <TouchableOpacity
                                                key={cuisine}
                                                onPress={() => {

                                                    if (selected) {

                                                        updateField(
                                                            "cuisine_type",
                                                            form.cuisine_type.filter(
                                                                (item) =>
                                                                    item !== cuisine
                                                            )
                                                        );

                                                    } else {

                                                        updateField(
                                                            "cuisine_type",
                                                            [
                                                                ...form.cuisine_type,
                                                                cuisine,
                                                            ]
                                                        );

                                                    }

                                                }}
                                                className={`px-4 py-3 rounded-2xl border ${selected
                                                    ? "bg-emerald-600 border-emerald-500"
                                                    : "bg-slate-950 border-slate-800"
                                                    }`}
                                            >

                                                <Text
                                                    className={`text-xs font-bold ${selected
                                                        ? "text-white"
                                                        : "text-slate-400"
                                                        }`}
                                                >
                                                    {selected ? "✓ " : ""}
                                                    {cuisine}
                                                </Text>

                                            </TouchableOpacity>
                                        );

                                    })}

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* DAILY ORDER CAPACITY */}
                            {/* ================================================= */}

                            <View className="mb-8">

                                <Text className={labelClass}>
                                    Maximum Orders Per Day *
                                </Text>

                                <TextInput
                                    value={form.daily_order_capacity}
                                    onChangeText={(value) =>
                                        updateField(
                                            "daily_order_capacity",
                                            value.replace(
                                                /[^0-9]/g,
                                                ""
                                            )
                                        )
                                    }
                                    keyboardType="number-pad"
                                    placeholder="Example: 40"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                                <Text className="text-slate-500 text-xs mt-2">
                                    Maximum number of orders this kitchen can prepare
                                    in one day.
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* NAVIGATION */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3">

                                {/* Previous */}

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>

                                </TouchableOpacity>


                                {/* Next */}

                                <TouchableOpacity
                                    onPress={nextStep}
                                    className="flex-1 bg-emerald-600 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <Text className="text-white font-black uppercase tracking-widest mr-1">
                                            Next Step
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color="#ffffff"
                                        />

                                    </View>

                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 4 — FOOD AVAILABILITY */}
                    {/* ================================================= */}

                    {currentStep === 4 && (
                        <View className="px-5">

                            {/* Step Header */}
                            <View className="mb-7">

                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">
                                        <Text className="text-emerald-400 text-xl">
                                            🗓️
                                        </Text>
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-white text-xl font-black">
                                            Food Availability
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Select the days and food slots when the chef is available.
                                        </Text>
                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* AVAILABLE DAYS */}
                            {/* ================================================= */}

                            <View className="mb-8">

                                <View className="flex-row items-center justify-between mb-3">

                                    <Text className={labelClass}>
                                        Available Days *
                                    </Text>

                                    <Text className="text-slate-500 text-xs">
                                        {form.available_days.length} selected
                                    </Text>

                                </View>

                                <View className="flex-row flex-wrap gap-3">

                                    {[
                                        "Monday",
                                        "Tuesday",
                                        "Wednesday",
                                        "Thursday",
                                        "Friday",
                                        "Saturday",
                                        "Sunday",
                                    ].map((day) => {

                                        const selected =
                                            form.available_days.includes(day);

                                        return (
                                            <TouchableOpacity
                                                key={day}
                                                onPress={() => {

                                                    if (selected) {

                                                        updateField(
                                                            "available_days",
                                                            form.available_days.filter(
                                                                (item) => item !== day
                                                            )
                                                        );

                                                    } else {

                                                        updateField(
                                                            "available_days",
                                                            [
                                                                ...form.available_days,
                                                                day,
                                                            ]
                                                        );

                                                    }

                                                }}
                                                className={`px-4 py-3 rounded-2xl border ${selected
                                                    ? "bg-emerald-600 border-emerald-500"
                                                    : "bg-slate-950 border-slate-800"
                                                    }`}
                                            >

                                                <Text
                                                    className={`text-xs font-bold ${selected
                                                        ? "text-white"
                                                        : "text-slate-400"
                                                        }`}
                                                >
                                                    {selected ? "✓ " : ""}
                                                    {day}
                                                </Text>

                                            </TouchableOpacity>
                                        );

                                    })}

                                </View>

                                {form.available_days.length === 0 && (
                                    <Text className="text-amber-400 text-xs mt-3">
                                        Please select at least one available day.
                                    </Text>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* AVAILABLE FOOD SLOTS */}
                            {/* ================================================= */}

                            <View className="mb-8">

                                <View className="flex-row items-center justify-between mb-3">

                                    <Text className={labelClass}>
                                        Available Food Slots *
                                    </Text>

                                    <Text className="text-slate-500 text-xs">
                                        {form.available_slots.length} selected
                                    </Text>

                                </View>

                                <Text className="text-slate-500 text-xs mb-4">
                                    Select the meals or snacks the chef can prepare.
                                </Text>

                                <View className="gap-3">

                                    {[
                                        {
                                            name: "Breakfast",
                                            icon: "🌅",
                                            description: "Morning meals"
                                        },
                                        {
                                            name: "Lunch",
                                            icon: "🍱",
                                            description: "Afternoon meals"
                                        },
                                        {
                                            name: "Dinner",
                                            icon: "🌙",
                                            description: "Evening meals"
                                        },
                                        {
                                            name: "Evening Snacks",
                                            icon: "☕",
                                            description: "Snacks and beverages"
                                        },
                                    ].map((slot) => {

                                        const selected =
                                            form.available_slots.includes(
                                                slot.name
                                            );

                                        return (
                                            <TouchableOpacity
                                                key={slot.name}
                                                onPress={() => {

                                                    if (selected) {

                                                        updateField(
                                                            "available_slots",
                                                            form.available_slots.filter(
                                                                (item) =>
                                                                    item !== slot.name
                                                            )
                                                        );

                                                    } else {

                                                        updateField(
                                                            "available_slots",
                                                            [
                                                                ...form.available_slots,
                                                                slot.name,
                                                            ]
                                                        );

                                                    }

                                                }}
                                                className={`flex-row items-center p-4 rounded-2xl border ${selected
                                                    ? "bg-emerald-600/15 border-emerald-500"
                                                    : "bg-slate-950 border-slate-800"
                                                    }`}
                                            >

                                                {/* Icon */}

                                                <View
                                                    className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${selected
                                                        ? "bg-emerald-600"
                                                        : "bg-slate-900"
                                                        }`}
                                                >

                                                    <Text className="text-xl">
                                                        {slot.icon}
                                                    </Text>

                                                </View>


                                                {/* Text */}

                                                <View className="flex-1">

                                                    <Text
                                                        className={`font-black ${selected
                                                            ? "text-white"
                                                            : "text-slate-300"
                                                            }`}
                                                    >
                                                        {slot.name}
                                                    </Text>

                                                    <Text className="text-slate-500 text-xs mt-1">
                                                        {slot.description}
                                                    </Text>

                                                </View>


                                                {/* Check */}

                                                <View
                                                    className={`w-6 h-6 rounded-full border items-center justify-center ${selected
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : "border-slate-700"
                                                        }`}
                                                >

                                                    {selected && (
                                                        <Text className="text-white text-xs font-black">
                                                            ✓
                                                        </Text>
                                                    )}

                                                </View>

                                            </TouchableOpacity>
                                        );

                                    })}

                                </View>

                                {form.available_slots.length === 0 && (
                                    <Text className="text-amber-400 text-xs mt-3">
                                        Please select at least one food slot.
                                    </Text>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* SELECTION SUMMARY */}
                            {/* ================================================= */}

                            {(form.available_days.length > 0 ||
                                form.available_slots.length > 0) && (

                                    <View className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 mb-8">

                                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                            Availability Summary
                                        </Text>

                                        <View className="mt-4">

                                            <Text className="text-slate-400 text-xs">
                                                Available Days
                                            </Text>

                                            <Text className="text-white font-bold mt-1">
                                                {form.available_days.length > 0
                                                    ? form.available_days.join(", ")
                                                    : "None selected"}
                                            </Text>

                                        </View>

                                        <View className="mt-4">

                                            <Text className="text-slate-400 text-xs">
                                                Food Slots
                                            </Text>

                                            <Text className="text-white font-bold mt-1">
                                                {form.available_slots.length > 0
                                                    ? form.available_slots.join(", ")
                                                    : "None selected"}
                                            </Text>

                                        </View>

                                    </View>

                                )}


                            {/* ================================================= */}
                            {/* NAVIGATION */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3 mb-8">

                                {/* Previous */}

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>

                                </TouchableOpacity>


                                {/* Next */}

                                <TouchableOpacity
                                    onPress={() => {

                                        if (
                                            form.available_days.length === 0 ||
                                            form.available_slots.length === 0
                                        ) {
                                            return;
                                        }

                                        nextStep();

                                    }}
                                    className={`flex-1 rounded-2xl py-4 ${form.available_days.length === 0 ||
                                        form.available_slots.length === 0
                                        ? "bg-slate-800"
                                        : "bg-emerald-600"
                                        }`}
                                >

                                    <View className="flex-row items-center justify-center">

                                        <Text
                                            className={`font-black uppercase tracking-widest mr-1 ${form.available_days.length === 0 ||
                                                form.available_slots.length === 0
                                                ? "text-slate-500"
                                                : "text-white"
                                                }`}
                                        >
                                            Next Step
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color={
                                                form.available_days.length === 0 ||
                                                    form.available_slots.length === 0
                                                    ? "#64748b"
                                                    : "#ffffff"
                                            }
                                        />

                                    </View>

                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 5 — BUSINESS DETAILS */}
                    {/* ================================================= */}

                    {currentStep === 5 && (
                        <View className="px-5">

                            {/* Step Header */}
                            <View className="mb-7">
                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">
                                        <Text className="text-emerald-400 text-xl">
                                            💳
                                        </Text>
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-white text-xl font-black">
                                            Business Details
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Add KYC, bank and payment information.
                                        </Text>
                                    </View>

                                </View>
                            </View>


                            {/* ================================================= */}
                            {/* FSSAI / GST */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3 mb-6">

                                {/* FSSAI */}

                                <View className="flex-1">

                                    <Text className={labelClass}>
                                        FSSAI Available
                                    </Text>

                                    <View className="flex-row gap-2">

                                        {["Yes", "No"].map((value) => {

                                            const selected =
                                                form.fssai_available === value;

                                            return (
                                                <TouchableOpacity
                                                    key={value}
                                                    onPress={() =>
                                                        updateField(
                                                            "fssai_available",
                                                            value
                                                        )
                                                    }
                                                    className={`flex-1 py-3 rounded-xl border ${selected
                                                        ? "bg-emerald-600 border-emerald-500"
                                                        : "bg-slate-950 border-slate-800"
                                                        }`}
                                                >
                                                    <Text
                                                        className={`text-center text-xs font-bold ${selected
                                                            ? "text-white"
                                                            : "text-slate-400"
                                                            }`}
                                                    >
                                                        {value}
                                                    </Text>
                                                </TouchableOpacity>
                                            );

                                        })}

                                    </View>

                                </View>


                                {/* GST */}

                                <View className="flex-1">

                                    <Text className={labelClass}>
                                        GST Available
                                    </Text>

                                    <View className="flex-row gap-2">

                                        {["Yes", "No"].map((value) => {

                                            const selected =
                                                form.gst_available === value;

                                            return (
                                                <TouchableOpacity
                                                    key={value}
                                                    onPress={() =>
                                                        updateField(
                                                            "gst_available",
                                                            value
                                                        )
                                                    }
                                                    className={`flex-1 py-3 rounded-xl border ${selected
                                                        ? "bg-emerald-600 border-emerald-500"
                                                        : "bg-slate-950 border-slate-800"
                                                        }`}
                                                >
                                                    <Text
                                                        className={`text-center text-xs font-bold ${selected
                                                            ? "text-white"
                                                            : "text-slate-400"
                                                            }`}
                                                    >
                                                        {value}
                                                    </Text>
                                                </TouchableOpacity>
                                            );

                                        })}

                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* AADHAAR */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Aadhaar Number *
                                </Text>

                                <TextInput
                                    value={form.aadhaar_number}
                                    onChangeText={(value) =>
                                        updateField(
                                            "aadhaar_number",
                                            value
                                                .replace(/[^0-9]/g, "")
                                                .slice(0, 12)
                                        )
                                    }
                                    keyboardType="number-pad"
                                    maxLength={12}
                                    placeholder="Enter 12 digit Aadhaar number"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                                <Text className="text-slate-500 text-xs mt-2">
                                    {form.aadhaar_number.length}/12 digits
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* PAN */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    PAN Number *
                                </Text>

                                <TextInput
                                    value={form.pan_number}
                                    onChangeText={(value) =>
                                        updateField(
                                            "pan_number",
                                            value
                                                .toUpperCase()
                                                .replace(/[^A-Z0-9]/g, "")
                                                .slice(0, 10)
                                        )
                                    }
                                    autoCapitalize="characters"
                                    maxLength={10}
                                    placeholder="Example: ABCDE1234F"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                                <Text className="text-slate-500 text-xs mt-2">
                                    Format: 5 letters + 4 numbers + 1 letter
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* ACCOUNT HOLDER */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Account Holder Name *
                                </Text>

                                <TextInput
                                    value={form.account_holder_name}
                                    onChangeText={(value) =>
                                        updateField(
                                            "account_holder_name",
                                            value
                                        )
                                    }
                                    placeholder="Enter account holder name"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                            </View>


                            {/* ================================================= */}
                            {/* BANK ACCOUNT */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Bank Account Number *
                                </Text>

                                <TextInput
                                    value={form.bank_account_number}
                                    onChangeText={(value) =>
                                        updateField(
                                            "bank_account_number",
                                            value.replace(/[^0-9]/g, "")
                                        )
                                    }
                                    keyboardType="number-pad"
                                    placeholder="Enter bank account number"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                            </View>


                            {/* ================================================= */}
                            {/* IFSC */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    IFSC Code *
                                </Text>

                                <TextInput
                                    value={form.ifsc_code}
                                    onChangeText={(value) =>
                                        updateField(
                                            "ifsc_code",
                                            value
                                                .toUpperCase()
                                                .replace(/[^A-Z0-9]/g, "")
                                                .slice(0, 11)
                                        )
                                    }
                                    autoCapitalize="characters"
                                    maxLength={11}
                                    placeholder="Example: SBIN0001234"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                            </View>


                            {/* ================================================= */}
                            {/* BANK BRANCH */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Bank Branch *
                                </Text>

                                <TextInput
                                    value={form.bank_branch}
                                    onChangeText={(value) =>
                                        updateField(
                                            "bank_branch",
                                            value
                                        )
                                    }
                                    placeholder="Example: Vaniyambadi"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                            </View>


                            {/* ================================================= */}
                            {/* UPI */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    UPI ID *
                                </Text>

                                <TextInput
                                    value={form.upi_id}
                                    onChangeText={(value) =>
                                        updateField(
                                            "upi_id",
                                            value
                                        )
                                    }
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholder="username@upi"
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                            </View>


                            {/* ================================================= */}
                            {/* PASSBOOK IMAGE */}
                            {/* ================================================= */}

                            <View className="mb-8">

                                <Text className={labelClass}>
                                    Passbook Image *
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        pickImage("passbook_image")
                                    }
                                    className="border border-dashed border-slate-700 bg-slate-950 rounded-2xl p-6 items-center justify-center"
                                >

                                    <View className="w-14 h-14 rounded-2xl bg-emerald-600/10 items-center justify-center mb-3">

                                        <Text className="text-2xl">
                                            📄
                                        </Text>

                                    </View>

                                    <Text className="text-white font-bold">
                                        {form.passbook_image
                                            ? "Passbook Selected"
                                            : "Upload Passbook"}
                                    </Text>

                                    <Text className="text-slate-500 text-xs mt-2 text-center">
                                        Upload a clear image of the first page
                                        of the bank passbook.
                                    </Text>

                                </TouchableOpacity>


                                {/* Selected file */}

                                {form.passbook_image && (
                                    <View className="mt-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">

                                        <Text className="text-emerald-400 text-xs font-bold">
                                            ✓ Passbook image selected
                                        </Text>

                                    </View>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* NAVIGATION */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3 mb-8">

                                {/* Previous */}

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>

                                </TouchableOpacity>


                                {/* Next */}

                                <TouchableOpacity
                                    onPress={nextStep}
                                    className="flex-1 bg-emerald-600 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <Text className="text-white font-black uppercase tracking-widest mr-1">
                                            Next Step
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color="#ffffff"
                                        />

                                    </View>

                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 6 — SOCIAL MEDIA */}
                    {/* ================================================= */}

                    {currentStep === 6 && (
                        <View className="px-5">

                            {/* Step Header */}
                            <View className="mb-7">
                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">
                                        <Text className="text-emerald-400 text-xl">
                                            🌐
                                        </Text>
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-white text-xl font-black">
                                            Social Media
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Add the chef's social media and website links.
                                        </Text>
                                    </View>

                                </View>
                            </View>


                            {/* ================================================= */}
                            {/* INSTAGRAM */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Instagram URL
                                </Text>

                                <View className="flex-row items-center">

                                    <View className="absolute left-4 z-10">
                                        <Text className="text-pink-400 font-black">
                                            @
                                        </Text>
                                    </View>

                                    <TextInput
                                        value={form.instagram_url}
                                        onChangeText={(value) =>
                                            updateField(
                                                "instagram_url",
                                                value
                                            )
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="url"
                                        placeholder="https://instagram.com/username"
                                        placeholderTextColor="#64748b"
                                        className={`${inputClass} pl-10`}
                                    />

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* FACEBOOK */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Facebook URL
                                </Text>

                                <View className="flex-row items-center">

                                    <View className="absolute left-4 z-10">
                                        <Text className="text-blue-400 font-black">
                                            f
                                        </Text>
                                    </View>

                                    <TextInput
                                        value={form.facebook_url}
                                        onChangeText={(value) =>
                                            updateField(
                                                "facebook_url",
                                                value
                                            )
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="url"
                                        placeholder="https://facebook.com/page"
                                        placeholderTextColor="#64748b"
                                        className={`${inputClass} pl-10`}
                                    />

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* YOUTUBE */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    YouTube Channel URL
                                </Text>

                                <View className="flex-row items-center">

                                    <View className="absolute left-4 z-10">
                                        <Text className="text-red-400 font-black">
                                            ▶
                                        </Text>
                                    </View>

                                    <TextInput
                                        value={form.youtube_url}
                                        onChangeText={(value) =>
                                            updateField(
                                                "youtube_url",
                                                value
                                            )
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="url"
                                        placeholder="https://youtube.com/@channel"
                                        placeholderTextColor="#64748b"
                                        className={`${inputClass} pl-10`}
                                    />

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* WEBSITE */}
                            {/* ================================================= */}

                            <View className="mb-8">

                                <Text className={labelClass}>
                                    Website URL
                                </Text>

                                <View className="flex-row items-center">

                                    <View className="absolute left-4 z-10">
                                        <Text className="text-emerald-400 font-black">
                                            🌐
                                        </Text>
                                    </View>

                                    <TextInput
                                        value={form.website_url}
                                        onChangeText={(value) =>
                                            updateField(
                                                "website_url",
                                                value
                                            )
                                        }
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="url"
                                        placeholder="https://yourwebsite.com"
                                        placeholderTextColor="#64748b"
                                        className={`${inputClass} pl-10`}
                                    />

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* INFO CARD */}
                            {/* ================================================= */}

                            <View className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 mb-8">

                                <View className="flex-row items-start">

                                    <View className="w-9 h-9 rounded-xl bg-emerald-600/10 items-center justify-center mr-3">
                                        <Text className="text-emerald-400">
                                            ℹ
                                        </Text>
                                    </View>

                                    <View className="flex-1">

                                        <Text className="text-white font-bold">
                                            Social links are optional
                                        </Text>

                                        <Text className="text-slate-500 text-xs mt-1 leading-5">
                                            Adding social media profiles can help customers
                                            discover the chef and learn more about their food.
                                        </Text>

                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* NAVIGATION */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3 mb-8">

                                {/* Previous */}

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>

                                </TouchableOpacity>


                                {/* Next */}

                                <TouchableOpacity
                                    onPress={nextStep}
                                    className="flex-1 bg-emerald-600 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <Text className="text-white font-black uppercase tracking-widest mr-1">
                                            Next Step
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color="#ffffff"
                                        />

                                    </View>

                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 7 — CREATOR PROFILE */}
                    {/* ================================================= */}

                    {currentStep === 7 && (
                        <View className="px-5">

                            {/* Step Header */}
                            <View className="mb-7">

                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">
                                        <Text className="text-emerald-400 text-xl">
                                            👨‍🍳
                                        </Text>
                                    </View>

                                    <View className="flex-1">
                                        <Text className="text-white text-xl font-black">
                                            Creator Profile
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Tell customers about the chef and their cooking journey.
                                        </Text>
                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* ABOUT ME */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    About Me *
                                </Text>

                                <TextInput
                                    value={form.about_me}
                                    onChangeText={(value) =>
                                        updateField(
                                            "about_me",
                                            value
                                        )
                                    }
                                    placeholder="Tell customers about yourself..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white min-h-[130px]"
                                />

                                <Text className="text-slate-500 text-xs mt-2">
                                    Introduce yourself and your cooking specialty.
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* COOKING STORY */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    Cooking Story *
                                </Text>

                                <TextInput
                                    value={form.cooking_story}
                                    onChangeText={(value) =>
                                        updateField(
                                            "cooking_story",
                                            value
                                        )
                                    }
                                    placeholder="Share your cooking journey..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white min-h-[130px]"
                                />

                                <Text className="text-slate-500 text-xs mt-2">
                                    Share how your passion for cooking started.
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* WHY CHOOSE ME */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    Why Customers Should Order From Me *
                                </Text>

                                <TextInput
                                    value={form.why_choose_me}
                                    onChangeText={(value) =>
                                        updateField(
                                            "why_choose_me",
                                            value
                                        )
                                    }
                                    placeholder="Tell customers why they should choose you..."
                                    placeholderTextColor="#64748b"
                                    multiline
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white min-h-[130px]"
                                />

                                <Text className="text-slate-500 text-xs mt-2">
                                    Highlight freshness, quality, experience or anything
                                    that makes your food special.
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* LANGUAGES */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    Languages Known *
                                </Text>

                                <TextInput
                                    value={form.languages_known}
                                    onChangeText={(value) =>
                                        updateField(
                                            "languages_known",
                                            value
                                        )
                                    }
                                    placeholder="Tamil, English, Telugu..."
                                    placeholderTextColor="#64748b"
                                    className={inputClass}
                                />

                                <Text className="text-slate-500 text-xs mt-2">
                                    Separate multiple languages with commas.
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* INTRODUCTION VIDEO */}
                            {/* ================================================= */}

                            <View className="mb-8">

                                <Text className={labelClass}>
                                    Introduction Video *
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        pickVideo("introduction_video")
                                    }
                                    className="border border-dashed border-slate-700 bg-slate-950 rounded-2xl p-6 items-center justify-center"
                                >

                                    <View className="w-16 h-16 rounded-2xl bg-emerald-600/10 items-center justify-center mb-4">

                                        <Text className="text-3xl">
                                            🎥
                                        </Text>

                                    </View>

                                    <Text className="text-white font-black">
                                        {form.introduction_video
                                            ? "Introduction Video Selected"
                                            : "Upload Introduction Video"}
                                    </Text>

                                    <Text className="text-slate-500 text-xs mt-2 text-center">
                                        Record a short introduction about yourself
                                        and your cooking.
                                    </Text>

                                </TouchableOpacity>


                                {/* Selected video */}

                                {form.introduction_video && (
                                    <View className="mt-3 flex-row items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">

                                        <View className="w-9 h-9 rounded-lg bg-emerald-600/10 items-center justify-center mr-3">

                                            <Text className="text-emerald-400">
                                                ✓
                                            </Text>

                                        </View>

                                        <View className="flex-1">

                                            <Text className="text-emerald-400 text-xs font-bold">
                                                Video selected successfully
                                            </Text>

                                            <Text className="text-slate-500 text-[10px] mt-1">
                                                Ready to upload
                                            </Text>

                                        </View>

                                    </View>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* PROFILE PREVIEW */}
                            {/* ================================================= */}

                            {(form.about_me ||
                                form.cooking_story ||
                                form.why_choose_me ||
                                form.languages_known) && (

                                    <View className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 mb-8">

                                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                            Profile Preview
                                        </Text>

                                        {form.about_me ? (
                                            <View className="mt-4">

                                                <Text className="text-slate-500 text-xs">
                                                    About Me
                                                </Text>

                                                <Text className="text-white text-sm mt-1 leading-5">
                                                    {form.about_me}
                                                </Text>

                                            </View>
                                        ) : null}

                                        {form.cooking_story ? (
                                            <View className="mt-4">

                                                <Text className="text-slate-500 text-xs">
                                                    Cooking Story
                                                </Text>

                                                <Text className="text-white text-sm mt-1 leading-5">
                                                    {form.cooking_story}
                                                </Text>

                                            </View>
                                        ) : null}

                                        {form.languages_known ? (
                                            <View className="mt-4">

                                                <Text className="text-slate-500 text-xs">
                                                    Languages
                                                </Text>

                                                <Text className="text-emerald-400 font-bold mt-1">
                                                    {form.languages_known}
                                                </Text>

                                            </View>
                                        ) : null}

                                    </View>

                                )}


                            {/* ================================================= */}
                            {/* NAVIGATION */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3 mb-8">

                                {/* Previous */}

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>

                                </TouchableOpacity>


                                {/* Next */}

                                <TouchableOpacity
                                    onPress={nextStep}
                                    className="flex-1 bg-emerald-600 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <Text className="text-white font-black uppercase tracking-widest mr-1">
                                            Next Step
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color="#ffffff"
                                        />

                                    </View>

                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 8 — PROOF VERIFICATION */}
                    {/* ================================================= */}

                    {currentStep === 8 && (
                        <View className="px-5">

                            {/* Header */}
                            <View className="mb-7">

                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">
                                        <Text className="text-emerald-400 text-xl">
                                            🛡️
                                        </Text>
                                    </View>

                                    <View className="flex-1">

                                        <Text className="text-white text-xl font-black">
                                            Proof Verification
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Upload the required identity verification documents.
                                        </Text>

                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* VERIFICATION NOTICE */}
                            {/* ================================================= */}

                            <View className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">

                                <View className="flex-row">

                                    <Text className="text-amber-400 text-lg mr-3">
                                        ⚠️
                                    </Text>

                                    <View className="flex-1">

                                        <Text className="text-amber-300 font-bold text-sm">
                                            Document Verification
                                        </Text>

                                        <Text className="text-amber-200/60 text-xs mt-1 leading-5">
                                            Make sure all uploaded documents are clear,
                                            readable and belong to the home chef.
                                        </Text>

                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* AADHAAR FRONT */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Aadhaar Front *
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        pickImage("aadhaar_front_url")
                                    }
                                    className="border border-dashed border-slate-700 bg-slate-950 rounded-2xl p-5"
                                >

                                    <View className="flex-row items-center">

                                        <View className="w-14 h-14 rounded-2xl bg-blue-500/10 items-center justify-center mr-4">
                                            <Text className="text-2xl">
                                                🪪
                                            </Text>
                                        </View>

                                        <View className="flex-1">

                                            <Text className="text-white font-black">
                                                {form.aadhaar_front_url
                                                    ? "Aadhaar Front Selected"
                                                    : "Upload Aadhaar Front"}
                                            </Text>

                                            <Text className="text-slate-500 text-xs mt-1">
                                                Clear image of the front side
                                            </Text>

                                        </View>

                                        <View className="bg-emerald-600/15 px-3 py-2 rounded-xl">

                                            <Text className="text-emerald-400 text-xs font-bold">
                                                {form.aadhaar_front_url
                                                    ? "✓"
                                                    : "Upload"}
                                            </Text>

                                        </View>

                                    </View>

                                </TouchableOpacity>

                                {form.aadhaar_front_url && (
                                    <View className="mt-2 px-3">

                                        <Text className="text-emerald-400 text-xs font-semibold">
                                            ✓ Aadhaar front uploaded
                                        </Text>

                                    </View>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* AADHAAR BACK */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    Aadhaar Back *
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        pickImage("aadhaar_back_url")
                                    }
                                    className="border border-dashed border-slate-700 bg-slate-950 rounded-2xl p-5"
                                >

                                    <View className="flex-row items-center">

                                        <View className="w-14 h-14 rounded-2xl bg-purple-500/10 items-center justify-center mr-4">
                                            <Text className="text-2xl">
                                                🪪
                                            </Text>
                                        </View>

                                        <View className="flex-1">

                                            <Text className="text-white font-black">
                                                {form.aadhaar_back_url
                                                    ? "Aadhaar Back Selected"
                                                    : "Upload Aadhaar Back"}
                                            </Text>

                                            <Text className="text-slate-500 text-xs mt-1">
                                                Clear image of the back side
                                            </Text>

                                        </View>

                                        <View className="bg-emerald-600/15 px-3 py-2 rounded-xl">

                                            <Text className="text-emerald-400 text-xs font-bold">
                                                {form.aadhaar_back_url
                                                    ? "✓"
                                                    : "Upload"}
                                            </Text>

                                        </View>

                                    </View>

                                </TouchableOpacity>

                                {form.aadhaar_back_url && (
                                    <View className="mt-2 px-3">

                                        <Text className="text-emerald-400 text-xs font-semibold">
                                            ✓ Aadhaar back uploaded
                                        </Text>

                                    </View>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* PAN CARD */}
                            {/* ================================================= */}

                            <View className="mb-5">

                                <Text className={labelClass}>
                                    PAN Card *
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        pickImage("pan_card_url")
                                    }
                                    className="border border-dashed border-slate-700 bg-slate-950 rounded-2xl p-5"
                                >

                                    <View className="flex-row items-center">

                                        <View className="w-14 h-14 rounded-2xl bg-orange-500/10 items-center justify-center mr-4">
                                            <Text className="text-2xl">
                                                📄
                                            </Text>
                                        </View>

                                        <View className="flex-1">

                                            <Text className="text-white font-black">
                                                {form.pan_card_url
                                                    ? "PAN Card Selected"
                                                    : "Upload PAN Card"}
                                            </Text>

                                            <Text className="text-slate-500 text-xs mt-1">
                                                Upload a clear PAN card image
                                            </Text>

                                        </View>

                                        <View className="bg-emerald-600/15 px-3 py-2 rounded-xl">

                                            <Text className="text-emerald-400 text-xs font-bold">
                                                {form.pan_card_url
                                                    ? "✓"
                                                    : "Upload"}
                                            </Text>

                                        </View>

                                    </View>

                                </TouchableOpacity>

                                {form.pan_card_url && (
                                    <View className="mt-2 px-3">

                                        <Text className="text-emerald-400 text-xs font-semibold">
                                            ✓ PAN card uploaded
                                        </Text>

                                    </View>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* SELFIE VERIFICATION */}
                            {/* ================================================= */}

                            <View className="mb-7">

                                <Text className={labelClass}>
                                    Selfie With Aadhaar *
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        pickImage("selfie_verification_url")
                                    }
                                    className="border border-dashed border-slate-700 bg-slate-950 rounded-2xl p-5"
                                >

                                    <View className="flex-row items-center">

                                        <View className="w-14 h-14 rounded-2xl bg-pink-500/10 items-center justify-center mr-4">
                                            <Text className="text-2xl">
                                                🤳
                                            </Text>
                                        </View>

                                        <View className="flex-1">

                                            <Text className="text-white font-black">
                                                {form.selfie_verification_url
                                                    ? "Selfie Selected"
                                                    : "Upload Selfie With Aadhaar"}
                                            </Text>

                                            <Text className="text-slate-500 text-xs mt-1">
                                                Take a clear selfie while holding Aadhaar
                                            </Text>

                                        </View>

                                        <View className="bg-emerald-600/15 px-3 py-2 rounded-xl">

                                            <Text className="text-emerald-400 text-xs font-bold">
                                                {form.selfie_verification_url
                                                    ? "✓"
                                                    : "Upload"}
                                            </Text>

                                        </View>

                                    </View>

                                </TouchableOpacity>

                                {form.selfie_verification_url && (
                                    <View className="mt-2 px-3">

                                        <Text className="text-emerald-400 text-xs font-semibold">
                                            ✓ Selfie uploaded
                                        </Text>

                                    </View>
                                )}

                            </View>


                            {/* ================================================= */}
                            {/* DOCUMENT STATUS */}
                            {/* ================================================= */}

                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-7">

                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    Verification Status
                                </Text>

                                <View className="mt-4">

                                    {[
                                        {
                                            label: "Aadhaar Front",
                                            value: form.aadhaar_front_url,
                                        },
                                        {
                                            label: "Aadhaar Back",
                                            value: form.aadhaar_back_url,
                                        },
                                        {
                                            label: "PAN Card",
                                            value: form.pan_card_url,
                                        },
                                        {
                                            label: "Selfie",
                                            value: form.selfie_verification_url,
                                        },
                                    ].map((doc) => (

                                        <View
                                            key={doc.label}
                                            className="flex-row items-center justify-between py-2.5 border-b border-slate-800 last:border-b-0"
                                        >

                                            <Text className="text-slate-300 text-sm">
                                                {doc.label}
                                            </Text>

                                            <View
                                                className={`px-2.5 py-1 rounded-lg ${doc.value
                                                    ? "bg-emerald-500/10"
                                                    : "bg-slate-800"
                                                    }`}
                                            >

                                                <Text
                                                    className={`text-[10px] font-black ${doc.value
                                                        ? "text-emerald-400"
                                                        : "text-slate-500"
                                                        }`}
                                                >
                                                    {doc.value ? "UPLOADED" : "PENDING"}
                                                </Text>

                                            </View>

                                        </View>

                                    ))}

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* NAVIGATION */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3 mb-8">

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    onPress={nextStep}
                                    className="flex-1 bg-emerald-600 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <Text className="text-white font-black uppercase tracking-widest mr-1">
                                            Next Step
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color="#ffffff"
                                        />

                                    </View>

                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                    {/* ================================================= */}
                    {/* STEP 9 — DELIVERY PREFERENCES */}
                    {/* ================================================= */}

                    {currentStep === 9 && (
                        <View className="px-5">

                            {/* Header */}
                            <View className="mb-7">

                                <View className="flex-row items-center">

                                    <View className="w-11 h-11 rounded-2xl bg-emerald-600/15 items-center justify-center mr-3">
                                        <Text className="text-emerald-400 text-xl">
                                            🚚
                                        </Text>
                                    </View>

                                    <View className="flex-1">

                                        <Text className="text-white text-xl font-black">
                                            Delivery Preferences
                                        </Text>

                                        <Text className="text-slate-400 text-sm mt-1">
                                            Configure delivery area and chef availability.
                                        </Text>

                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* DELIVERY RADIUS */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    Maximum Delivery Radius *
                                </Text>

                                <View className="flex-row flex-wrap gap-3">

                                    {["2 KM", "3 KM", "5 KM"].map((radius) => {

                                        const selected =
                                            form.delivery_radius === radius;

                                        return (
                                            <TouchableOpacity
                                                key={radius}
                                                onPress={() =>
                                                    updateField(
                                                        "delivery_radius",
                                                        radius
                                                    )
                                                }
                                                className={`px-5 py-3.5 rounded-2xl border ${selected
                                                        ? "bg-emerald-600 border-emerald-500"
                                                        : "bg-slate-950 border-slate-800"
                                                    }`}
                                            >

                                                <View className="flex-row items-center">

                                                    {selected && (
                                                        <Text className="text-white font-black mr-2">
                                                            ✓
                                                        </Text>
                                                    )}

                                                    <Text
                                                        className={`font-black ${selected
                                                                ? "text-white"
                                                                : "text-slate-300"
                                                            }`}
                                                    >
                                                        {radius}
                                                    </Text>

                                                </View>

                                            </TouchableOpacity>
                                        );

                                    })}

                                </View>

                                <Text className="text-slate-500 text-xs mt-2">
                                    Customers outside this radius will not see this chef's
                                    products.
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* PREORDER */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    Preorder Available ?
                                </Text>

                                <View className="flex-row gap-3">

                                    {/* YES */}

                                    <TouchableOpacity
                                        onPress={() =>
                                            updateField(
                                                "preorder_available",
                                                true
                                            )
                                        }
                                        className={`flex-1 rounded-2xl border py-4 ${form.preorder_available === true
                                                ? "bg-emerald-600 border-emerald-500"
                                                : "bg-slate-950 border-slate-800"
                                            }`}
                                    >

                                        <View className="items-center">

                                            <Text
                                                className={`font-black ${form.preorder_available === true
                                                        ? "text-white"
                                                        : "text-slate-300"
                                                    }`}
                                            >
                                                Yes
                                            </Text>

                                            {form.preorder_available === true && (
                                                <Text className="text-emerald-100 text-xs mt-1">
                                                    ✓ Enabled
                                                </Text>
                                            )}

                                        </View>

                                    </TouchableOpacity>


                                    {/* NO */}

                                    <TouchableOpacity
                                        onPress={() =>
                                            updateField(
                                                "preorder_available",
                                                false
                                            )
                                        }
                                        className={`flex-1 rounded-2xl border py-4 ${form.preorder_available === false
                                                ? "bg-slate-700 border-slate-600"
                                                : "bg-slate-950 border-slate-800"
                                            }`}
                                    >

                                        <View className="items-center">

                                            <Text
                                                className={`font-black ${form.preorder_available === false
                                                        ? "text-white"
                                                        : "text-slate-300"
                                                    }`}
                                            >
                                                No
                                            </Text>

                                            {form.preorder_available === false && (
                                                <Text className="text-slate-400 text-xs mt-1">
                                                    ✓ Disabled
                                                </Text>
                                            )}

                                        </View>

                                    </TouchableOpacity>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* OPENING / CLOSING TIME */}
                            {/* ================================================= */}

                            <View className="mb-6">

                                <Text className={labelClass}>
                                    Kitchen Operating Hours
                                </Text>

                                <View className="flex-row gap-3">

                                    {/* Opening */}

                                    <View className="flex-1">

                                        <Text className="text-slate-500 text-xs mb-2">
                                            Opening Time
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() =>
                                                openTimePicker("opening_time")
                                            }
                                            className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4"
                                        >

                                            <Text className="text-slate-200 font-bold">

                                                {form.opening_time
                                                    ? form.opening_time
                                                    : "Select time"}

                                            </Text>

                                        </TouchableOpacity>

                                    </View>


                                    {/* Closing */}

                                    <View className="flex-1">

                                        <Text className="text-slate-500 text-xs mb-2">
                                            Closing Time
                                        </Text>

                                        <TouchableOpacity
                                            onPress={() =>
                                                openTimePicker("closing_time")
                                            }
                                            className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4"
                                        >

                                            <Text className="text-slate-200 font-bold">

                                                {form.closing_time
                                                    ? form.closing_time
                                                    : "Select time"}

                                            </Text>

                                        </TouchableOpacity>

                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* CUTOFF TIME */}
                            {/* ================================================= */}

                            <View className="mb-7">

                                <Text className={labelClass}>
                                    Order Cutoff Time
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        openTimePicker("cutoff_time")
                                    }
                                    className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4"
                                >

                                    <View className="flex-row items-center">

                                        <View className="w-10 h-10 rounded-xl bg-amber-500/10 items-center justify-center mr-3">

                                            <Text className="text-lg">
                                                ⏰
                                            </Text>

                                        </View>

                                        <View className="flex-1">

                                            <Text className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                                Cutoff Time
                                            </Text>

                                            <Text className="text-white font-bold mt-1">

                                                {form.cutoff_time
                                                    ? form.cutoff_time
                                                    : "Select cutoff time"}

                                            </Text>

                                        </View>

                                    </View>

                                </TouchableOpacity>

                                <Text className="text-slate-500 text-xs mt-2">
                                    Orders received after this time can be handled
                                    according to the chef's next available slot.
                                </Text>

                            </View>


                            {/* ================================================= */}
                            {/* DELIVERY SUMMARY */}
                            {/* ================================================= */}

                            <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-7">

                                <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                    Delivery Summary
                                </Text>

                                <View className="mt-4">

                                    <View className="flex-row justify-between py-2">

                                        <Text className="text-slate-400">
                                            Delivery Radius
                                        </Text>

                                        <Text className="text-emerald-400 font-black">
                                            {form.delivery_radius || "5 KM"}
                                        </Text>

                                    </View>

                                    <View className="flex-row justify-between py-2">

                                        <Text className="text-slate-400">
                                            Preorder
                                        </Text>

                                        <Text
                                            className={`font-black ${form.preorder_available
                                                    ? "text-emerald-400"
                                                    : "text-slate-500"
                                                }`}
                                        >
                                            {form.preorder_available
                                                ? "Available"
                                                : "Not Available"}
                                        </Text>

                                    </View>

                                    <View className="flex-row justify-between py-2">

                                        <Text className="text-slate-400">
                                            Operating Hours
                                        </Text>

                                        <Text className="text-white font-bold">
                                            {form.opening_time || "--:--"}{" "}
                                            -{" "}
                                            {form.closing_time || "--:--"}
                                        </Text>

                                    </View>

                                    <View className="flex-row justify-between py-2">

                                        <Text className="text-slate-400">
                                            Cutoff
                                        </Text>

                                        <Text className="text-white font-bold">
                                            {form.cutoff_time || "--:--"}
                                        </Text>

                                    </View>

                                </View>

                            </View>


                            {/* ================================================= */}
                            {/* NAVIGATION */}
                            {/* ================================================= */}

                            <View className="flex-row gap-3 mb-8">

                                <TouchableOpacity
                                    onPress={previousStep}
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <ChevronLeft
                                            size={18}
                                            color="#cbd5e1"
                                        />

                                        <Text className="text-slate-200 font-black uppercase tracking-widest ml-1">
                                            Previous
                                        </Text>

                                    </View>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    onPress={nextStep}
                                    className="flex-1 bg-emerald-600 rounded-2xl py-4"
                                >

                                    <View className="flex-row items-center justify-center">

                                        <Text className="text-white font-black uppercase tracking-widest mr-1">
                                            Review
                                        </Text>

                                        <ChevronRight
                                            size={18}
                                            color="#ffffff"
                                        />

                                    </View>

                                </TouchableOpacity>

                            </View>

                        </View>
                    )}

                </ScrollView>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default AddHomeChef;
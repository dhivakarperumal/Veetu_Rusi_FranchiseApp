import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { post } from "../services/api";
import InnerHeader from "../components/InnerHeader";

const AddDeliveryPartner = ({ navigation }: any) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        gender: "Male",
        date_of_birth: "",
        blood_group: "",
        mobile: "",
        email: "",
        password: "",
        confirmPassword: "",

        current_address: "",
        permanent_address: "",
        city: "",
        state: "",
        pincode: "",
        live_location: "",

        emergency_contact_name: "",
        emergency_contact_relationship: "",
        emergency_contact_mobile: "",

        vehicle_type: "Bike",
        vehicle_brand: "",
        vehicle_model: "",
        vehicle_number: "",
        vehicle_color: "",

        license_number: "",
        license_issue_date: "",
        license_expiry_date: "",

        account_holder_name: "",
        bank_name: "",
        bank_account_number: "",
        ifsc_code: "",
        upi_id: "",

        aadhaar_number: "",
        pan_number: "",

        available_areas: "",
        available_time_morning: false,
        available_time_afternoon: false,
        available_time_evening: false,
        available_time_night: false,

        preferred_distance: "3 KM",

        otp_verified: false,
        face_verified: false,
        location_verified: false,

        status: "Pending",
    });


    const handleSubmit = async () => {
        try {
            await post(
                "/superadmin/delivery-partners",
                {
                    ...form,
                    name: `${form.first_name} ${form.last_name}`,
                }
            );

            Alert.alert(
                "Success",
                "Delivery Partner Added Successfully"
            );

            navigation.goBack();
        } catch (error: any) {
            Alert.alert(
                "Error",
                error.message
            );
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            <InnerHeader title="Add Delivery Partner" navigation={navigation} />
            <ScrollView className="flex-1 px-5">
                <Text className="text-slate-400 mb-6 mt-5">
                    Step {step} of 9
                </Text>

        {/* STEP 1 */}
        {step === 1 && (
            <View className="gap-4">

                <TextInput
                    placeholder="First Name"
                    placeholderTextColor="#94a3b8"
                    value={form.first_name}
                    onChangeText={(text) =>
                        setForm({ ...form, first_name: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Last Name"
                    placeholderTextColor="#94a3b8"
                    value={form.last_name}
                    onChangeText={(text) =>
                        setForm({ ...form, last_name: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Gender"
                    placeholderTextColor="#94a3b8"
                    value={form.gender}
                    onChangeText={(text) =>
                        setForm({ ...form, gender: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Date Of Birth"
                    placeholderTextColor="#94a3b8"
                    value={form.date_of_birth}
                    onChangeText={(text) =>
                        setForm({ ...form, date_of_birth: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Blood Group"
                    placeholderTextColor="#94a3b8"
                    value={form.blood_group}
                    onChangeText={(text) =>
                        setForm({ ...form, blood_group: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Mobile Number"
                    placeholderTextColor="#94a3b8"
                    value={form.mobile}
                    onChangeText={(text) =>
                        setForm({ ...form, mobile: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#94a3b8"
                    value={form.email}
                    onChangeText={(text) =>
                        setForm({ ...form, email: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    secureTextEntry
                    placeholder="Password"
                    placeholderTextColor="#94a3b8"
                    value={form.password}
                    onChangeText={(text) =>
                        setForm({ ...form, password: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    secureTextEntry
                    placeholder="Confirm Password"
                    placeholderTextColor="#94a3b8"
                    value={form.confirmPassword}
                    onChangeText={(text) =>
                        setForm({ ...form, confirmPassword: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {/* STEP 2 */}
        {step === 2 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Current Address"
                    value={form.current_address}
                    onChangeText={(text) =>
                        setForm({ ...form, current_address: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Permanent Address"
                    value={form.permanent_address}
                    onChangeText={(text) =>
                        setForm({ ...form, permanent_address: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="City"
                    value={form.city}
                    onChangeText={(text) =>
                        setForm({ ...form, city: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="State"
                    value={form.state}
                    onChangeText={(text) =>
                        setForm({ ...form, state: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Pincode"
                    value={form.pincode}
                    onChangeText={(text) =>
                        setForm({ ...form, pincode: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Live GPS Location"
                    value={form.live_location}
                    onChangeText={(text) =>
                        setForm({ ...form, live_location: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {/* STEP 3 */}
        {step === 3 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Emergency Contact Name"
                    value={form.emergency_contact_name}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            emergency_contact_name: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Relationship"
                    value={form.emergency_contact_relationship}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            emergency_contact_relationship: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Emergency Mobile"
                    value={form.emergency_contact_mobile}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            emergency_contact_mobile: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {/* STEP 4 - 8 */}
        {step === 4 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Vehicle Type"
                    value={form.vehicle_type}
                    onChangeText={(text) =>
                        setForm({ ...form, vehicle_type: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Vehicle Brand"
                    value={form.vehicle_brand}
                    onChangeText={(text) =>
                        setForm({ ...form, vehicle_brand: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Vehicle Model"
                    value={form.vehicle_model}
                    onChangeText={(text) =>
                        setForm({ ...form, vehicle_model: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Vehicle Number"
                    value={form.vehicle_number}
                    onChangeText={(text) =>
                        setForm({ ...form, vehicle_number: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Vehicle Color"
                    value={form.vehicle_color}
                    onChangeText={(text) =>
                        setForm({ ...form, vehicle_color: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {step === 5 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Driving License Number"
                    placeholderTextColor="#94a3b8"
                    value={form.license_number}
                    onChangeText={(text) =>
                        setForm({ ...form, license_number: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="License Issue Date"
                    placeholderTextColor="#94a3b8"
                    value={form.license_issue_date}
                    onChangeText={(text) =>
                        setForm({ ...form, license_issue_date: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="License Expiry Date"
                    placeholderTextColor="#94a3b8"
                    value={form.license_expiry_date}
                    onChangeText={(text) =>
                        setForm({ ...form, license_expiry_date: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {step === 6 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Account Holder Name"
                    placeholderTextColor="#94a3b8"
                    value={form.account_holder_name}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            account_holder_name: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Bank Name"
                    placeholderTextColor="#94a3b8"
                    value={form.bank_name}
                    onChangeText={(text) =>
                        setForm({ ...form, bank_name: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Bank Account Number"
                    placeholderTextColor="#94a3b8"
                    value={form.bank_account_number}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            bank_account_number: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="IFSC Code"
                    placeholderTextColor="#94a3b8"
                    value={form.ifsc_code}
                    onChangeText={(text) =>
                        setForm({ ...form, ifsc_code: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="UPI ID"
                    placeholderTextColor="#94a3b8"
                    value={form.upi_id}
                    onChangeText={(text) =>
                        setForm({ ...form, upi_id: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {step === 7 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Aadhaar Number"
                    placeholderTextColor="#94a3b8"
                    value={form.aadhaar_number}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            aadhaar_number: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="PAN Number"
                    placeholderTextColor="#94a3b8"
                    value={form.pan_number}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            pan_number: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Aadhaar Front
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Aadhaar Back
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload PAN Card
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload License Front
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload License Back
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload RC Book
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Insurance Document
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Selfie With Vehicle
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Selfie With Aadhaar
                    </Text>
                </TouchableOpacity>

            </View>
        )}

        {step === 8 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Available Areas"
                    placeholderTextColor="#94a3b8"
                    value={form.available_areas}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            available_areas: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TouchableOpacity
                    className="bg-slate-800 p-4 rounded-xl"
                    onPress={() =>
                        setForm({
                            ...form,
                            available_time_morning:
                                !form.available_time_morning,
                        })
                    }
                >
                    <Text className="text-white">
                        Morning (
                        {form.available_time_morning
                            ? "Selected"
                            : "Not Selected"}
                        )
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-slate-800 p-4 rounded-xl"
                    onPress={() =>
                        setForm({
                            ...form,
                            available_time_afternoon:
                                !form.available_time_afternoon,
                        })
                    }
                >
                    <Text className="text-white">
                        Afternoon (
                        {form.available_time_afternoon
                            ? "Selected"
                            : "Not Selected"}
                        )
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-slate-800 p-4 rounded-xl"
                    onPress={() =>
                        setForm({
                            ...form,
                            available_time_evening:
                                !form.available_time_evening,
                        })
                    }
                >
                    <Text className="text-white">
                        Evening (
                        {form.available_time_evening
                            ? "Selected"
                            : "Not Selected"}
                        )
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="bg-slate-800 p-4 rounded-xl"
                    onPress={() =>
                        setForm({
                            ...form,
                            available_time_night:
                                !form.available_time_night,
                        })
                    }
                >
                    <Text className="text-white">
                        Night (
                        {form.available_time_night
                            ? "Selected"
                            : "Not Selected"}
                        )
                    </Text>
                </TouchableOpacity>

                <TextInput
                    placeholder="Preferred Distance (3 KM)"
                    placeholderTextColor="#94a3b8"
                    value={form.preferred_distance}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            preferred_distance: text,
                        })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {/* STEP 9 */}
        {step === 9 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Delivery Radius"
                    placeholderTextColor="#94a3b8"
                    value={form.delivery_radius}
                    onChangeText={(text) =>
                        setForm({ ...form, delivery_radius: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Cutoff Time"
                    placeholderTextColor="#94a3b8"
                    value={form.cutoff_time}
                    onChangeText={(text) =>
                        setForm({ ...form, cutoff_time: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        <View className="flex-row justify-between items-center mt-8 mb-10">

            {step > 1 ? (
                <TouchableOpacity
                    onPress={() => setStep(step - 1)}
                    className="bg-slate-700 px-6 py-4 rounded-xl"
                >
                    <Text className="text-white font-bold">
                        Previous
                    </Text>
                </TouchableOpacity>
            ) : (
                <View />
            )}

            {step < 9 ? (
                <TouchableOpacity
                    onPress={() => setStep(step + 1)}
                    className="bg-emerald-600 px-6 py-4 rounded-xl"
                >
                    <Text className="text-white font-bold">
                        Next
                    </Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className="bg-emerald-600 px-6 py-4 rounded-xl"
                >
                    <Text className="text-white font-bold">
                        {loading
                            ? "Saving..."
                            : "Save Delivery Partner"}
                    </Text>
                </TouchableOpacity>
            )}

        </View>

    </ScrollView >
    </SafeAreaView >


    );
};

export default AddDeliveryPartner;

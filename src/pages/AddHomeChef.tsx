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

const AddHomeChef = ({ navigation }: any) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        gender: "Male",
        date_of_birth: "",
        mobile: "",
        email: "",
        password: "",
        confirmPassword: "",


        house_number: "",
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
        landmark: "",
        gps_location: "",
        google_map_location: "",

        kitchen_name: "",
        kitchen_type: "Home Kitchen",
        experience_years: "",
        cuisine_type: "",
        daily_order_capacity: "",

        available_days: [],
        available_slots: [],

        fssai_available: "No",
        gst_available: "No",
        aadhaar_number: "",
        pan_number: "",
        bank_account_number: "",
        ifsc_code: "",
        upi_id: "",

        instagram_url: "",
        facebook_url: "",
        youtube_url: "",
        website_url: "",

        about_me: "",
        cooking_story: "",
        why_choose_me: "",
        languages_known: "",

        delivery_radius: "5 KM",
        preorder_available: false,
        cutoff_time: "",


    });

    const handleSubmit = async () => {
        try {
            setLoading(true);

            const payload = {
                ...form,
                name: `${form.first_name} ${form.last_name}`,
                door_number: form.house_number,
                street_name: form.street,
                area_name: form.area,
                map_link: form.google_map_location,
                available_days: Array.isArray(form.available_days)
                    ? form.available_days.join(",")
                    : "",
            };

            await post("/superadmin/homechefs", payload);

            Alert.alert(
                "Success",
                "Home Chef Added Successfully"
            );

            navigation.goBack();
        } catch (error) {
            console.log(error);
            Alert.alert(
                "Error",
                "Failed to Add Home Chef"
            );
        } finally {
            setLoading(false);
        }
        

};

return ( <SafeAreaView className="flex-1 bg-slate-950"> <ScrollView className="flex-1 px-5">


            < Text className = "text-white text-3xl font-bold mt-5" >
                Add Home Chef
    </Text >

    <Text className="text-slate-400 mb-6">
        Step {step} of 9
    </Text>

{/* STEP 1 */ }
{
    step === 1 && (
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
                placeholder="Mobile"
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
                placeholder="Password"
                secureTextEntry
                placeholderTextColor="#94a3b8"
                value={form.password}
                onChangeText={(text) =>
                    setForm({ ...form, password: text })
                }
                className="bg-slate-900 text-white p-4 rounded-xl"
            />
        </View>
    )
}

{/* STEP 2 */ }
{
    step === 2 && (
        <View className="gap-4">

            <TextInput
                placeholder="House Number"
                placeholderTextColor="#94a3b8"
                value={form.house_number}
                onChangeText={(text) =>
                    setForm({ ...form, house_number: text })
                }
                className="bg-slate-900 text-white p-4 rounded-xl"
            />

            <TextInput
                placeholder="Street"
                placeholderTextColor="#94a3b8"
                value={form.street}
                onChangeText={(text) =>
                    setForm({ ...form, street: text })
                }
                className="bg-slate-900 text-white p-4 rounded-xl"
            />

            <TextInput
                placeholder="City"
                placeholderTextColor="#94a3b8"
                value={form.city}
                onChangeText={(text) =>
                    setForm({ ...form, city: text })
                }
                className="bg-slate-900 text-white p-4 rounded-xl"
            />

        </View>
    )
}

{/* STEP 3 */ }
{
    step === 3 && (
        <View className="gap-4">

            <TextInput
                placeholder="Kitchen Name"
                placeholderTextColor="#94a3b8"
                value={form.kitchen_name}
                onChangeText={(text) =>
                    setForm({ ...form, kitchen_name: text })
                }
                className="bg-slate-900 text-white p-4 rounded-xl"
            />

            <TextInput
                placeholder="Cuisine Type"
                placeholderTextColor="#94a3b8"
                value={form.cuisine_type}
                onChangeText={(text) =>
                    setForm({ ...form, cuisine_type: text })
                }
                className="bg-slate-900 text-white p-4 rounded-xl"
            />

        </View>
    )
}

{/* STEP 4 - 8 */ }
{/* Continue same pattern using your web fields */ }

{/* STEP 9 */ }
{
    step === 9 && (
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

        </View>
    )
}

<View className="flex-row justify-between mt-8 mb-10">

    {step > 1 && (
        <TouchableOpacity
            onPress={() => setStep(step - 1)}
            className="bg-slate-700 px-6 py-4 rounded-xl"
        >
            <Text className="text-white font-bold">
                Previous
            </Text>
        </TouchableOpacity>
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
                {loading ? "Saving..." : "Save Home Chef"}
            </Text>
        </TouchableOpacity>
    )}

</View>

  </ScrollView >
</SafeAreaView >


);
};

export default AddHomeChef;

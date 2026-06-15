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

        profile_photo: null,

        introduction_video: null,

        aadhaar_front_url: null,
        aadhaar_back_url: null,
        pan_card_url: null,

        kitchen_photo1: null,
        kitchen_photo2: null,
        kitchen_photo3: null,

        cooking_area_photo: null,
        storage_area_photo: null,

        selfie_verification_url: null,


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

    return (
        <SafeAreaView className="flex-1 bg-slate-950">
            <InnerHeader title="Add Home Chef" navigation={navigation} />
            <ScrollView className="flex-1 px-5">
                <Text className="text-slate-400 mb-6 mt-5">
                    Step {step} of 9
                </Text>

        {/* STEP 1 */}
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
                        placeholder="Gender"
                        value={form.gender}
                        onChangeText={(text) =>
                            setForm({ ...form, gender: text })
                        }
                    />

                    <TextInput
                        placeholder="Date Of Birth"
                        value={form.date_of_birth}
                        onChangeText={(text) =>
                            setForm({ ...form, date_of_birth: text })
                        }
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

                    <TextInput
                        placeholder="Confirm Password"
                        secureTextEntry
                        value={form.confirmPassword}
                        onChangeText={(text) =>
                            setForm({ ...form, confirmPassword: text })
                        }
                    />

                    <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                        <Text className="text-white">
                            Upload Profile Photo
                        </Text>
                    </TouchableOpacity>
                </View>
            )
        }

        {/* STEP 2 */}
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

                    <TextInput
                        placeholder="Area"
                        value={form.area}
                        onChangeText={(text) =>
                            setForm({ ...form, area: text })
                        }
                    />

                    <TextInput
                        placeholder="State"
                        value={form.state}
                        onChangeText={(text) =>
                            setForm({ ...form, state: text })
                        }
                    />

                    <TextInput
                        placeholder="Pincode"
                        value={form.pincode}
                        onChangeText={(text) =>
                            setForm({ ...form, pincode: text })
                        }
                    />

                    <TextInput
                        placeholder="Landmark"
                        value={form.landmark}
                        onChangeText={(text) =>
                            setForm({ ...form, landmark: text })
                        }
                    />

                    <TextInput
                        placeholder="GPS Location"
                        value={form.gps_location}
                        onChangeText={(text) =>
                            setForm({ ...form, gps_location: text })
                        }
                    />

                    <TextInput
                        placeholder="Google Map Location"
                        value={form.google_map_location}
                        onChangeText={(text) =>
                            setForm({
                                ...form,
                                google_map_location: text,
                            })
                        }
                    />

                </View>
            )
        }

        {/* STEP 3 */}
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

                    <TextInput
                        placeholder="Years Of Experience"
                        value={form.experience_years}
                        onChangeText={(text) =>
                            setForm({
                                ...form,
                                experience_years: text,
                            })
                        }
                    />

                    <TextInput
                        placeholder="Kitchen Type"
                        value={form.kitchen_type}
                        onChangeText={(text) =>
                            setForm({
                                ...form,
                                kitchen_type: text,
                            })
                        }
                    />

                    <TextInput
                        placeholder="Daily Order Capacity"
                        value={form.daily_order_capacity}
                        onChangeText={(text) =>
                            setForm({
                                ...form,
                                daily_order_capacity: text,
                            })
                        }
                    />

                </View>
            )
        }

        {/* STEP 4 - 8 */}
        {step === 4 && (
            <View className="gap-5">

                <Text className="text-white text-lg font-bold">
                    Available Days
                </Text>

                <View className="flex-row flex-wrap gap-2">
                    {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                    ].map((day) => (
                        <TouchableOpacity
                            key={day}
                            onPress={() => {
                                const exists = form.available_days.includes(day);

                                setForm({
                                    ...form,
                                    available_days: exists
                                        ? form.available_days.filter((d) => d !== day)
                                        : [...form.available_days, day],
                                });
                            }}
                            className={`px-4 py-3 rounded-xl ${form.available_days.includes(day)
                                ? "bg-emerald-600"
                                : "bg-slate-800"
                                }`}
                        >
                            <Text className="text-white">{day}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-white text-lg font-bold mt-5">
                    Available Slots
                </Text>

                <View className="flex-row flex-wrap gap-2">
                    {[
                        "Breakfast",
                        "Lunch",
                        "Dinner",
                        "Evening Snacks",
                    ].map((slot) => (
                        <TouchableOpacity
                            key={slot}
                            onPress={() => {
                                const exists = form.available_slots.includes(slot);

                                setForm({
                                    ...form,
                                    available_slots: exists
                                        ? form.available_slots.filter((s) => s !== slot)
                                        : [...form.available_slots, slot],
                                });
                            }}
                            className={`px-4 py-3 rounded-xl ${form.available_slots.includes(slot)
                                ? "bg-emerald-600"
                                : "bg-slate-800"
                                }`}
                        >
                            <Text className="text-white">{slot}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

            </View>
        )}

        {step === 5 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Aadhaar Number"
                    placeholderTextColor="#94a3b8"
                    value={form.aadhaar_number}
                    onChangeText={(text) =>
                        setForm({ ...form, aadhaar_number: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="PAN Number"
                    placeholderTextColor="#94a3b8"
                    value={form.pan_number}
                    onChangeText={(text) =>
                        setForm({ ...form, pan_number: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Bank Account Number"
                    placeholderTextColor="#94a3b8"
                    value={form.bank_account_number}
                    onChangeText={(text) =>
                        setForm({ ...form, bank_account_number: text })
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
                <TextInput
                    placeholder="Aadhaar Number"
                    value={form.aadhaar_number}
                    onChangeText={(text) =>
                        setForm({
                            ...form,
                            aadhaar_number: text,
                        })
                    }
                />

            </View>
        )}

        {step === 6 && (
            <View className="gap-4">

                <TextInput
                    placeholder="Instagram URL"
                    placeholderTextColor="#94a3b8"
                    value={form.instagram_url}
                    onChangeText={(text) =>
                        setForm({ ...form, instagram_url: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Facebook URL"
                    placeholderTextColor="#94a3b8"
                    value={form.facebook_url}
                    onChangeText={(text) =>
                        setForm({ ...form, facebook_url: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="YouTube URL"
                    placeholderTextColor="#94a3b8"
                    value={form.youtube_url}
                    onChangeText={(text) =>
                        setForm({ ...form, youtube_url: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Website URL"
                    placeholderTextColor="#94a3b8"
                    value={form.website_url}
                    onChangeText={(text) =>
                        setForm({ ...form, website_url: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

            </View>
        )}

        {step === 7 && (
            <View className="gap-4">

                <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="About Me"
                    placeholderTextColor="#94a3b8"
                    value={form.about_me}
                    onChangeText={(text) =>
                        setForm({ ...form, about_me: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="Cooking Story"
                    placeholderTextColor="#94a3b8"
                    value={form.cooking_story}
                    onChangeText={(text) =>
                        setForm({ ...form, cooking_story: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder="Why Choose Me"
                    placeholderTextColor="#94a3b8"
                    value={form.why_choose_me}
                    onChangeText={(text) =>
                        setForm({ ...form, why_choose_me: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TextInput
                    placeholder="Languages Known"
                    placeholderTextColor="#94a3b8"
                    value={form.languages_known}
                    onChangeText={(text) =>
                        setForm({ ...form, languages_known: text })
                    }
                    className="bg-slate-900 text-white p-4 rounded-xl"
                />

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Introduction Video
                    </Text>
                </TouchableOpacity>

            </View>
        )}

        {step === 8 && (
            <View className="gap-3">

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
                        Upload Kitchen Photo 1
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Kitchen Photo 2
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="bg-slate-800 p-4 rounded-xl">
                    <Text className="text-white">
                        Upload Kitchen Photo 3
                    </Text>
                </TouchableOpacity>

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

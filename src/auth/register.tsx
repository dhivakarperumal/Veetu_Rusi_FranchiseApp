import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import { post } from "../services/api";

const Register = () => {
  const navigation = useNavigation<any>();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const handleRegister = async () => {
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      await post("/auth/register", {
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      Alert.alert(
        "Success",
        "Registration successful",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Registration Failed"
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
      >
        <View className="bg-slate-900 rounded-3xl p-6">

          <Text className="text-white text-3xl font-bold mb-2">
            Create Account
          </Text>

          <Text className="text-slate-400 mb-8">
            Register to get started
          </Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="#94a3b8"
            value={form.username}
            onChangeText={(text) =>
              setForm({ ...form, username: text })
            }
            className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-4"
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(text) =>
              setForm({ ...form, email: text })
            }
            className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-4"
          />

          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) =>
              setForm({ ...form, phone: text })
            }
            className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-4"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(text) =>
              setForm({ ...form, password: text })
            }
            className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-4"
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text className="text-emerald-400 mb-4">
              {showPassword ? "Hide Password" : "Show Password"}
            </Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showConfirmPassword}
            value={form.confirmPassword}
            onChangeText={(text) =>
              setForm({
                ...form,
                confirmPassword: text,
              })
            }
            className="bg-slate-800 text-white rounded-xl px-4 py-4 mb-4"
          />

          <TouchableOpacity
            onPress={() =>
              setShowConfirmPassword(
                !showConfirmPassword
              )
            }
          >
            <Text className="text-emerald-400 mb-6">
              {showConfirmPassword
                ? "Hide Confirm Password"
                : "Show Confirm Password"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleRegister}
            className="bg-emerald-600 rounded-xl py-4"
          >
            <Text className="text-center text-white font-bold text-lg">
              Sign Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            className="mt-6"
          >
            <Text className="text-center text-slate-400">
              Already have an account?
              <Text className="text-emerald-400">
                {" "}Login
              </Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Register;
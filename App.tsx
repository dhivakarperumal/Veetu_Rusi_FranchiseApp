import "./global.css";
import React from "react";


import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Truck, ChefHat, Package, ClipboardList, Grid3x3 } from "lucide-react-native";

import LoginScreen from "./src/auth/login";
import Dashboard from "./src/tabs/dashboard";
import DeliveryPartners from "./src/tabs/deliverypartners";
import HomeChef from "./src/tabs/homechef";
import FoodProducts from "./src/tabs/foodproducts";
import FoodOrders from "./src/tabs/foodorders";
import MoreSettings from "./src/tabs/more";
import AddHomeChef from "./src/pages/AddHomeChef";
import Profile from "./src/pages/Profile";
import Register from "./src/auth/register";
import AddDeliveryPartner from "./src/pages/AddDeliveryPartner";
import UserManagement from "./src/More/UserManagement";

import { AuthProvider, AuthContext } from "./src/context/AuthContext";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import Header from "./src/components/Header";

const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        header: () => <Header />,
        tabBarActiveTintColor: "#14B8A6",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          height: 56 + (insets.bottom || 0),
          paddingBottom: (insets.bottom || 0) + 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="DeliveryPartners"
        component={DeliveryPartners}
        options={{
          tabBarLabel: "Delivery Partners",
          tabBarIcon: ({ color, size }) => <Truck color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="HomeChef"
        component={HomeChef}
        options={{
          tabBarLabel: "Home Chefs",
          tabBarIcon: ({ color, size }) => <ChefHat color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="FoodProducts"
        component={FoodProducts}
        options={{
          tabBarLabel: "Food Products",
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="FoodOrders"
        component={FoodOrders}
        options={{
          tabBarLabel: "Food Orders",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreSettings}
        options={{
          tabBarLabel: "More",
          tabBarIcon: ({ color, size }) => <Grid3x3 color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const auth = React.useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {auth?.token ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Group screenOptions={{ presentation: "modal", headerShown: false }}>
              <Stack.Screen name="AddHomeChef" component={AddHomeChef} />
              <Stack.Screen name="AddDeliveryPartner" component={AddDeliveryPartner} />
              <Stack.Screen name="Profile" component={Profile} />
              <Stack.Screen
                name="UserManagement"
                component={UserManagement}
              />
            </Stack.Group>
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Group screenOptions={{ presentation: "modal", headerShown: false }}>
              <Stack.Screen name="Register" component={Register} />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

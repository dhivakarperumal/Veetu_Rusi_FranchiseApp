import "./global.css";
import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Truck, ChefHat, Package, ClipboardList } from "lucide-react-native";

import LoginScreen from "./src/auth/login";
import Dashboard from "./src/tabs/dashboard";
import DeliveryPartners from "./src/tabs/deliverypartners";
import HomeChef from "./src/tabs/homechef";
import FoodProducts from "./src/tabs/foodproducts";
import FoodOrders from "./src/tabs/foodorders";
import AddHomeChef from "./src/pages/AddHomeChef";
import Register from "./src/auth/register";
import AddDeliveryPartner from "./src/pages/AddDeliveryPartner";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
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

    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />

          <Stack.Screen
            name="Main"
            component={MainTabs}
          />

          <Stack.Group
            screenOptions={{
              presentation: "modal",
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="AddHomeChef"
              component={AddHomeChef}
            />

            <Stack.Screen
              name="Register"
              component={Register}
            />

            <Stack.Screen
              name="AddDeliveryPartner"
              component={AddDeliveryPartner}
            />
            
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
import "./global.css";
import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import LoginScreen from "./src/auth/login";
import Dashboard from "./src/tabs/dashboard";
import DeliveryPartners from "./src/tabs/deliverypartners";
import HomeChef from "./src/tabs/homechef";
import FoodProducts from "./src/tabs/foodproducts";
import FoodOrders from "./src/tabs/foodorders";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    initialRouteName="Dashboard"
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#14B8A6",
      tabBarInactiveTintColor: "#94A3B8",
      tabBarStyle: {
        backgroundColor: "#0f172a",
        borderTopColor: "#1e293b",
        height: 64,
        paddingBottom: 6,
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
      options={{ tabBarLabel: "Dashboard" }}
    />
    <Tab.Screen
      name="DeliveryPartners"
      component={DeliveryPartners}
      options={{ tabBarLabel: "Delivery Partners" }}
    />
    <Tab.Screen
      name="HomeChef"
      component={HomeChef}
      options={{ tabBarLabel: "Home Chefs" }}
    />
    <Tab.Screen
      name="FoodProducts"
      component={FoodProducts}
      options={{ tabBarLabel: "Food Products" }}
    />
    <Tab.Screen
      name="FoodOrders"
      component={FoodOrders}
      options={{ tabBarLabel: "Food Orders" }}
    />
  </Tab.Navigator>
);

export default function App() {
  return (
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
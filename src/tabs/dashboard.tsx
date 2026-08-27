import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  Users,
  Store,
  ChefHat,
  Bike,
  ShoppingBag,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Landmark,
  Package,
  XCircle,
} from "lucide-react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";

import { get } from "../services/api";
import SubscriptionAlert from "../components/SubscriptionAlert";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 64;

const FALLBACK = {
  cards: {
    totalUsers: 0,
    totalRestaurants: 0,
    totalHomeChefs: 0,
    totalDeliveryPartners: 0,
    totalOrders: 0,
    pendingApprovals: 0,

    deliveredOrdersCount: 0,
    deliveredOrdersRevenue: 0,
    cancelledOrders: 0,

    franchiseOrdersCount: 0,
    franchiseDeliveredCount: 0,
    franchiseCancelledCount: 0,
    franchiseDeliveredRevenue: 0,

    totalDpEarnings: 0,
    totalDpBonuses: 0,
    totalDpPenalties: 0,
    totalPlatformCommission: 0,

    totalProducts: 0,
  },

  charts: {
    dailyOrders: [
      { date: "Mon", orders: 12 },
      { date: "Tue", orders: 19 },
      { date: "Wed", orders: 15 },
      { date: "Thu", orders: 22 },
      { date: "Fri", orders: 30 },
      { date: "Sat", orders: 45 },
      { date: "Sun", orders: 35 },
    ],

    revenueAnalytics: [
      { name: "Jan", revenue: 45000 },
      { name: "Feb", revenue: 58000 },
      { name: "Mar", revenue: 64000 },
      { name: "Apr", revenue: 78000 },
      { name: "May", revenue: 92000 },
      { name: "Jun", revenue: 110000 },
    ],

    userGrowth: [
      { name: "Wk 1", customers: 150, chefs: 10, partners: 20 },
      { name: "Wk 2", customers: 220, chefs: 15, partners: 28 },
      { name: "Wk 3", customers: 310, chefs: 21, partners: 35 },
      { name: "Wk 4", customers: 450, chefs: 30, partners: 45 },
    ],

    ordersByStatus: [
      { status: "Delivered", count: 0 },
      { status: "Pending", count: 0 },
      { status: "Cancelled", count: 0 },
    ],
  },
};

const chartConfig = {
  backgroundColor: "#0f172a",
  backgroundGradientFrom: "#0f172a",
  backgroundGradientTo: "#1e293b",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#14B8A6",
  },
  propsForBackgroundLines: {
    stroke: "#334155",
    strokeDasharray: "4, 4",
  },
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
  iconBackground,
}: any) => {
  return (
    <View className="w-[48%] bg-slate-900 rounded-3xl p-4 mb-4 overflow-hidden">
      <View
        className="w-11 h-11 rounded-2xl items-center justify-center"
        style={{
          backgroundColor: iconBackground,
        }}
      >
        <Icon size={21} color="#fff" strokeWidth={2.5} />
      </View>

      <Text
        className="text-slate-400 mt-4 text-[10px] font-bold"
        numberOfLines={1}
      >
        {label.toUpperCase()}
      </Text>

      <Text
        className="text-white text-2xl font-black mt-1"
        numberOfLines={1}
      >
        {value}
      </Text>

      <View
        className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10"
        style={{
          backgroundColor: color,
        }}
      />
    </View>
  );
};

const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  children,
}: any) => {
  return (
    <View className="bg-slate-900 rounded-3xl p-4 mb-5">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1">
          <Text className="text-white text-sm font-black">
            {title}
          </Text>

          <Text className="text-slate-500 text-[10px] font-bold mt-1">
            {subtitle}
          </Text>
        </View>

        {Icon && (
          <Icon
            size={20}
            color={iconColor}
            strokeWidth={2.5}
          />
        )}
      </View>

      {children}
    </View>
  );
};

const Dashboard = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const applySubscriptionStatus = (subscription: any) => {
    if (!subscription) {
      setSubscriptionInfo(null);
      setShowSubscriptionAlert(false);
      return;
    }

    setSubscriptionInfo(subscription);
    const status = String(subscription.status || "").trim().toLowerCase();
    const isActive = status === "active" && subscription.isExpired !== true;
    const isExpiring =
      isActive &&
      subscription.daysRemaining != null &&
      Number(subscription.daysRemaining) <= 7;
    setShowSubscriptionAlert(!isActive || isExpiring);
  };

  const fetchDashboard = async () => {
    try {
      const data = await get<any>("/dashboard");

      console.log("Dashboard Data:", data);

      setDashboard(data);

      applySubscriptionStatus(data?.subscriptionInfo);

      const statusResponse = await get<any>("/subscriptions/status");
      if (statusResponse?.subscription) {
        const franchiseId =
          statusResponse.franchiseId ||
          statusResponse.franchise_id ||
          statusResponse.subscription.franchiseId ||
          statusResponse.subscription.franchise_id ||
          statusResponse.subscription.id;

        applySubscriptionStatus({
          ...statusResponse,
          ...statusResponse.subscription,
          franchiseId,
        });
      }
    } catch (err) {
      console.log("Dashboard Error:", err);

      setDashboard(FALLBACK);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-950">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator
            size="large"
            color="#14B8A6"
          />

          <Text className="text-white mt-3 text-base">
            Loading Dashboard...
          </Text>
        </View>
      </View>
    );
  }

  const cards = dashboard?.cards || FALLBACK.cards;
  const charts = dashboard?.charts || FALLBACK.charts;

  const statsCards = [
    {
      label: "Home Chef Orders",
      icon: ShoppingBag,
      value: cards?.totalOrders || 0,
      color: "#3B82F6",
      iconBackground: "#3B82F6",
    },

    {
      label: "Delivered Orders",
      icon: Package,
      value: cards?.deliveredOrdersCount || 0,
      color: "#14B8A6",
      iconBackground: "#14B8A6",
    },

    {
      label: "Delivered Revenue",
      icon: DollarSign,
      value: `₹${Number(
        cards?.deliveredOrdersRevenue || 0
      ).toLocaleString()}`,
      color: "#10B981",
      iconBackground: "#10B981",
    },

    {
      label: "Cancelled Orders",
      icon: XCircle,
      value: cards?.cancelledOrders || 0,
      color: "#EF4444",
      iconBackground: "#EF4444",
    },

    {
      label: "Franchise Admin Orders",
      icon: ShoppingBag,
      value: cards?.franchiseOrdersCount || 0,
      color: "#6366F1",
      iconBackground: "#6366F1",
    },

    {
      label: "Franchise Delivered",
      icon: Package,
      value: cards?.franchiseDeliveredCount || 0,
      color: "#10B981",
      iconBackground: "#10B981",
    },

    {
      label: "Franchise Revenue",
      icon: DollarSign,
      value: `₹${Number(
        cards?.franchiseDeliveredRevenue || 0
      ).toLocaleString()}`,
      color: "#059669",
      iconBackground: "#059669",
    },

    {
      label: "Franchise Cancelled",
      icon: XCircle,
      value: cards?.franchiseCancelledCount || 0,
      color: "#DC2626",
      iconBackground: "#DC2626",
    },

    {
      label: "Total Users",
      icon: Users,
      value: cards?.totalUsers || 0,
      color: "#8B5CF6",
      iconBackground: "#8B5CF6",
    },

    {
      label: "Home Chefs",
      icon: ChefHat,
      value: cards?.totalHomeChefs || 0,
      color: "#EC4899",
      iconBackground: "#EC4899",
    },

    {
      label: "Delivery Partners",
      icon: Bike,
      value: cards?.totalDeliveryPartners || 0,
      color: "#F59E0B",
      iconBackground: "#F59E0B",
    },

    {
      label: "Products",
      icon: Store,
      value: cards?.totalProducts || 0,
      color: "#06B6D4",
      iconBackground: "#06B6D4",
    },

    {
      label: "DP Earnings",
      icon: DollarSign,
      value: `₹${Number(
        cards?.totalDpEarnings || 0
      ).toLocaleString()}`,
      color: "#4F46E5",
      iconBackground: "#4F46E5",
    },

    {
      label: "DP Bonuses",
      icon: TrendingUp,
      value: `₹${Number(
        cards?.totalDpBonuses || 0
      ).toLocaleString()}`,
      color: "#10B981",
      iconBackground: "#10B981",
    },

    {
      label: "DP Penalties",
      icon: TrendingDown,
      value: `₹${Number(
        cards?.totalDpPenalties || 0
      ).toLocaleString()}`,
      color: "#EF4444",
      iconBackground: "#EF4444",
    },

    {
      label: "Platform Commission",
      icon: Landmark,
      value: `₹${Number(
        cards?.totalPlatformCommission || 0
      ).toLocaleString()}`,
      color: "#F59E0B",
      iconBackground: "#F59E0B",
    },
  ];

  const revenueList =
    Array.isArray(charts?.revenueAnalytics) &&
    charts.revenueAnalytics.length >= 2
      ? charts.revenueAnalytics
      : FALLBACK.charts.revenueAnalytics;
  const revenueLabels = revenueList.map((item: any) => item.name || "");
  const revenueValues = revenueList.map((item: any) =>
    Number(item.revenue || 0)
  );

  const dailyOrdersList =
    Array.isArray(charts?.dailyOrders) && charts.dailyOrders.length >= 1
      ? charts.dailyOrders
      : FALLBACK.charts.dailyOrders;
  const orderLabels = dailyOrdersList.map((item: any) => item.date || "");
  const orderValues = dailyOrdersList.map((item: any) =>
    Number(item.orders || 0)
  );

  const userGrowthList =
    Array.isArray(charts?.userGrowth) && charts.userGrowth.length >= 2
      ? charts.userGrowth
      : FALLBACK.charts.userGrowth;
  const userGrowthLabels = userGrowthList.map((item: any) => item.name || "");
  const customerValues = userGrowthList.map((item: any) =>
    Number(item.customers || 0)
  );
  const chefValues = userGrowthList.map((item: any) =>
    Number(item.chefs || 0)
  );
  const partnerValues = userGrowthList.map((item: any) =>
    Number(item.partners || 0)
  );

  const ordersByStatusList =
    Array.isArray(charts?.ordersByStatus) &&
    charts.ordersByStatus.length > 0
      ? charts.ordersByStatus
      : FALLBACK.charts.ordersByStatus;

  const pieColors = ["#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6"];

  const hasPieData = ordersByStatusList.some(
    (item: any) => Number(item.count || 0) > 0
  );

  const pieChartData = hasPieData
    ? ordersByStatusList
        .filter((item: any) => Number(item.count || 0) > 0)
        .map((item: any, index: number) => ({
          name: item.status || "Unknown",
          population: Number(item.count || 0),
          color: pieColors[index % pieColors.length],
          legendFontColor: "#94A3B8",
          legendFontSize: 11,
        }))
    : [
        {
          name: "Delivered",
          population: 1,
          color: "#10B981",
          legendFontColor: "#94A3B8",
          legendFontSize: 11,
        },
        {
          name: "Pending",
          population: 1,
          color: "#F59E0B",
          legendFontColor: "#94A3B8",
          legendFontSize: 11,
        },
        {
          name: "Cancelled",
          population: 1,
          color: "#EF4444",
          legendFontColor: "#94A3B8",
          legendFontSize: 11,
        },
      ];

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#14B8A6"
            colors={["#14B8A6"]}
          />
        }
      >
        <View className="p-4 pt-6">
          {/* ================= HEADER ================= */}
          <Text className="text-white text-3xl font-black">
            Dashboard
          </Text>

          <Text className="text-slate-400 mt-1 mb-6">
            Welcome Back Franchise Admin
          </Text>

          {/* ================= STAT CARDS ================= */}
          <View className="flex-row flex-wrap justify-between">
            {statsCards.map((card, index) => (
              <StatCard
                key={index}
                {...card}
              />
            ))}
          </View>

          {/* ================= REVENUE CHART ================= */}
          <ChartCard
            title="Revenue Trends"
            subtitle="Monthly platform earnings"
            icon={TrendingUp}
            iconColor="#10B981"
          >
            <LineChart
              data={{
                labels: revenueLabels,
                datasets: [
                  {
                    data: revenueValues,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 2.5,
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel="₹"
              yAxisSuffix=""
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              }}
              bezier
              style={{
                borderRadius: 16,
                marginTop: 8,
              }}
              formatYLabel={(val: any) => {
                const n = Number(val);
                if (isNaN(n)) return String(val);
                if (n >= 1000) return `${Math.round(n / 1000)}k`;
                return `${Math.round(n)}`;
              }}
            />
          </ChartCard>

          {/* ================= DAILY ORDERS ================= */}
          <ChartCard
            title="Daily Orders"
            subtitle="Orders placed this week"
            icon={ShoppingBag}
            iconColor="#3B82F6"
          >
            <BarChart
              data={{
                labels: orderLabels,
                datasets: [
                  {
                    data: orderValues,
                  },
                ],
              }}
              width={CHART_WIDTH}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              }}
              style={{
                borderRadius: 16,
                marginTop: 8,
              }}
              showValuesOnTopOfBars
            />
          </ChartCard>

          {/* ================= USER ACQUISITION ================= */}
          <ChartCard
            title="User Acquisition"
            subtitle="Customers, chefs & partners by week"
            icon={Users}
            iconColor="#8B5CF6"
          >
            <LineChart
              data={{
                labels: userGrowthLabels,
                datasets: [
                  {
                    data: customerValues,
                    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: chefValues,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 2,
                  },
                  {
                    data: partnerValues,
                    color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
                legend: ["Customers", "Chefs", "Partners"],
              }}
              width={CHART_WIDTH}
              height={230}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`,
              }}
              bezier
              style={{
                borderRadius: 16,
                marginTop: 8,
              }}
            />
          </ChartCard>

          {/* ================= ORDER DISTRIBUTION ================= */}
          <ChartCard
            title="Order Distribution"
            subtitle="Status breakdown of all orders"
            icon={Clock}
            iconColor="#EC4899"
          >
            <View className="items-center">
              <PieChart
                data={pieChartData}
                width={CHART_WIDTH}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute={false}
              />
            </View>

            {/* Status List */}
            <View className="mt-2">
              {pieChartData.map((item: any, index: number) => (
                <View
                  key={index}
                  className="flex-row items-center mb-3"
                >
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />
                  <View className="flex-1">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase">
                      {item.name || "Unknown"}
                    </Text>
                    <Text className="text-white text-base font-black mt-0.5">
                      {item.population || 0}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ChartCard>

          {/* Bottom spacing */}
          <View className="h-10" />
        </View>
      </ScrollView>

      <SubscriptionAlert
        visible={showSubscriptionAlert}
        subscriptionInfo={subscriptionInfo}
        onClose={() => setShowSubscriptionAlert(false)}
        onBuyClick={() => {
          setShowSubscriptionAlert(false);
          navigation.navigate("SubscriptionPlans", {
            franchiseId:
              subscriptionInfo?.franchiseId ||
              subscriptionInfo?.franchise_id ||
              subscriptionInfo?.franchise?.id ||
              dashboard?.franchise?.id,
            subscriptionInfo,
          });
        }}
      />
    </View>
  );
};

export default Dashboard;
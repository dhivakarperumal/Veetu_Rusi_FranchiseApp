import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import {
  Store,
  Search,
  Plus,
  X,
  MapPin,
  Phone,
  Mail,
  Star,
  Package,
  CheckCircle,
} from "lucide-react-native";

import {
  useNavigation,
  useIsFocused,
} from "@react-navigation/native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { get, post } from "../services/api";
import InnerHeader from "../components/InnerHeader";
import FloatingActionButton from "../components/FloatingActionButton";
import CenteredDialog from "../components/CenteredDialog";

type Dealer = {
  id: number | string;
  name?: string;
  contact?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  location?: string;
  status?: string;
  rating?: number;
  orders?: number;
  image?: string | null;
};

const Dealers = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [newDealer, setNewDealer] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    location: "",
    status: "Pending",
  });

  const [feedbackDialog, setFeedbackDialog] = useState({
    visible: false,
    title: "",
    message: "",
  });

  // --------------------------------------------------
  // FETCH DEALERS
  // --------------------------------------------------

  const fetchDealers = useCallback(async () => {
    try {
      setLoading(true);

      const res: any = await get("/dealers");

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.dealers)
        ? res.dealers
        : [];

      setDealers(list);
    } catch (error) {
      console.log("Fetch dealers error:", error);

      setDealers([]);

      setFeedbackDialog({
        visible: true,
        title: "Unable to Load",
        message: "Failed to load dealers.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchDealers();
    }
  }, [isFocused, fetchDealers]);

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const onRefresh = () => {
    setRefreshing(true);
    fetchDealers();
  };

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredDealers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (!q) return dealers;

    return dealers.filter((dealer) =>
      [
        dealer.name,
        dealer.contact,
        dealer.phone,
        dealer.mobile,
        dealer.email,
        dealer.location,
        dealer.status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(q)
        )
    );
  }, [dealers, searchQuery]);

  // --------------------------------------------------
  // ADD DEALER
  // --------------------------------------------------

  const resetDealerForm = () => {
    setNewDealer({
      name: "",
      contact: "",
      phone: "",
      email: "",
      location: "",
      status: "Pending",
    });
  };

  const submitDealer = async () => {
    if (!newDealer.name.trim()) {
      setFeedbackDialog({
        visible: true,
        title: "Dealer Name Required",
        message: "Please enter the dealer name.",
      });
      return;
    }

    if (!newDealer.phone.trim()) {
      setFeedbackDialog({
        visible: true,
        title: "Phone Required",
        message: "Please enter the dealer phone number.",
      });
      return;
    }

    setFormSubmitting(true);

    try {
      await post("/dealers", {
        name: newDealer.name.trim(),
        contact: newDealer.contact.trim(),
        phone: newDealer.phone.trim(),
        email: newDealer.email.trim(),
        location: newDealer.location.trim(),
        status: newDealer.status,
      });

      setShowAddModal(false);
      resetDealerForm();

      setFeedbackDialog({
        visible: true,
        title: "Dealer Added",
        message: "Dealer has been added successfully.",
      });

      fetchDealers();
    } catch (error: any) {
      console.log("Add dealer error:", error);

      setFeedbackDialog({
        visible: true,
        title: "Unable to Add",
        message:
          error?.message || "Failed to add dealer.",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  const getStatus = (status?: string) => {
    const value = (status || "Pending").toLowerCase();

    if (value === "premium") {
      return {
        text: "Premium",
        color: "#fbbf24",
        bg: "bg-amber-500/15",
        border: "border-amber-500/30",
      };
    }

    if (value === "verified" || value === "active") {
      return {
        text: status || "Verified",
        color: "#34d399",
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/30",
      };
    }

    return {
      text: status || "Pending",
      color: "#94a3b8",
      bg: "bg-slate-500/15",
      border: "border-slate-500/30",
    };
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-950">
        <InnerHeader
          title="Dealers"
          navigation={navigation}
        />

        <View className="flex-1 items-center justify-center">
          <ActivityIndicator
            size="large"
            color="#06b6d4"
          />

          <Text className="text-white mt-3 font-semibold text-xs">
            Loading Dealers...
          </Text>
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <View className="flex-1 bg-slate-950">

      <InnerHeader
        title="Dealers"
        navigation={navigation}
      />

      <FlatList
        data={filteredDealers}
        keyExtractor={(item, index) =>
          `dealer-${item.id || index}`
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#06b6d4"
            colors={["#06b6d4"]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 110,
        }}
        ListHeaderComponent={
          <View className="px-4 pt-6">

            {/* HEADER */}

            <View className="flex-row items-center justify-between mb-5">

              <View className="flex-1">
                <Text className="text-white text-3xl font-black">
                  Dealers
                </Text>

                <Text className="text-slate-400 mt-1 text-xs">
                  Manage your dealer partnerships
                </Text>
              </View>

              <View className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 items-center justify-center">
                <Store
                  size={20}
                  color="#22d3ee"
                />
              </View>

            </View>

            {/* TOTAL */}

            <View className="bg-slate-900 border border-cyan-400/20 rounded-2xl p-4 mb-4">

              <View className="flex-row items-center">

                <View className="w-10 h-10 rounded-xl bg-cyan-500/15 items-center justify-center">
                  <Store
                    size={19}
                    color="#67e8f9"
                  />
                </View>

                <View className="ml-3">
                  <Text className="text-cyan-200/60 text-[9px] font-bold uppercase">
                    Total Dealers
                  </Text>

                  <Text className="text-white text-2xl font-black">
                    {dealers.length}
                  </Text>
                </View>

              </View>

            </View>

            {/* SEARCH */}

            <View className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex-row items-center mb-4">

              <Search
                size={18}
                color="#64748b"
              />

              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search dealer, phone, email or location..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3 text-xs font-semibold"
              />

              {searchQuery ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                >
                  <X
                    size={16}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              ) : null}

            </View>

            <Text className="text-slate-500 text-[11px] mb-3">
              Showing {filteredDealers.length} of{" "}
              {dealers.length} dealers
            </Text>

          </View>
        }

        renderItem={({ item }) => {

          const status = getStatus(item.status);

          return (
            <View className="mx-4 mb-3.5 bg-slate-900 border border-white/10 rounded-3xl p-4">

              {/* CARD HEADER */}

              <View className="flex-row items-center justify-between mb-4">

                <View className="flex-row items-center flex-1 mr-2">

                  <View className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 items-center justify-center">

                    <Store
                      size={21}
                      color="#22d3ee"
                    />

                  </View>

                  <View className="flex-1 ml-3">

                    <Text
                      className="text-white font-black text-sm"
                      numberOfLines={1}
                    >
                      {item.name || "Unnamed Dealer"}
                    </Text>

                    <Text
                      className="text-slate-400 text-xs mt-0.5"
                      numberOfLines={1}
                    >
                      {item.contact || "Dealer Partner"}
                    </Text>

                  </View>

                </View>

                {/* STATUS */}

                <View
                  className={`${status.bg} ${status.border} px-2.5 py-1 rounded-xl border`}
                >
                  <Text
                    style={{ color: status.color }}
                    className="text-[9px] font-black uppercase"
                  >
                    {status.text}
                  </Text>
                </View>

              </View>

              {/* STATS */}

              <View className="flex-row gap-2 mb-3">

                <View className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3">

                  <Text className="text-slate-500 text-[9px] font-bold uppercase">
                    Rating
                  </Text>

                  <View className="flex-row items-center mt-1">

                    <Star
                      size={14}
                      color="#fbbf24"
                      fill="#fbbf24"
                    />

                    <Text className="text-amber-400 text-sm font-black ml-1">
                      {Number(item.rating || 0).toFixed(1)}
                    </Text>

                  </View>

                </View>

                <View className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3">

                  <Text className="text-slate-500 text-[9px] font-bold uppercase">
                    Orders
                  </Text>

                  <View className="flex-row items-center mt-1">

                    <Package
                      size={14}
                      color="#38bdf8"
                    />

                    <Text className="text-sky-400 text-sm font-black ml-1">
                      {item.orders || 0}
                    </Text>

                  </View>

                </View>

              </View>

              {/* CONTACT DETAILS */}

              <View className="border-t border-white/10 pt-3 space-y-2">

                {item.location ? (
                  <View className="flex-row items-center">

                    <MapPin
                      size={14}
                      color="#22d3ee"
                    />

                    <Text
                      className="text-slate-400 text-xs ml-2 flex-1"
                      numberOfLines={1}
                    >
                      {item.location}
                    </Text>

                  </View>
                ) : null}

                {item.email ? (
                  <View className="flex-row items-center">

                    <Mail
                      size={14}
                      color="#22d3ee"
                    />

                    <Text
                      className="text-slate-400 text-xs ml-2 flex-1"
                      numberOfLines={1}
                    >
                      {item.email}
                    </Text>

                  </View>
                ) : null}

                {(item.phone || item.mobile) ? (
                  <View className="flex-row items-center">

                    <Phone
                      size={14}
                      color="#22d3ee"
                    />

                    <Text className="text-slate-400 text-xs ml-2">
                      {item.phone || item.mobile}
                    </Text>

                  </View>
                ) : null}

              </View>

            </View>
          );
        }}

        ListEmptyComponent={
          <View className="items-center mt-16 px-5">

            <Store
              size={48}
              color="#334155"
            />

            <Text className="text-slate-400 mt-4 text-sm font-bold">
              No dealers found
            </Text>

            <Text className="text-slate-600 mt-1 text-[11px] text-center">
              Add your first dealer using the button below.
            </Text>

          </View>
        }
      />

      {/* ADD DEALER FAB */}

      <View
        style={{
          position: "absolute",
          right: 20,
          bottom: 25,
          zIndex: 9999,
          elevation: 20,
        }}
      >
        <FloatingActionButton
          onPress={() => setShowAddModal(true)}
          label="Add dealer"
        />
      </View>

      {/* ADD DEALER MODAL */}

      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
          className="flex-1 justify-end bg-black/80"
        >

          <View
            className="bg-slate-900 border-t border-white/10 rounded-t-3xl p-5 max-h-[88%]"
            style={{
              paddingBottom:
                Math.max(insets.bottom, 20) + 16,
            }}
          >

            {/* MODAL HEADER */}

            <View className="flex-row items-center justify-between mb-5">

              <View>
                <Text className="text-white text-lg font-black">
                  Add Dealer
                </Text>

                <Text className="text-slate-400 text-xs mt-0.5">
                  Create a new dealer partnership
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 items-center justify-center"
              >
                <X
                  size={17}
                  color="#cbd5e1"
                />
              </TouchableOpacity>

            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >

              {/* NAME */}

              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Dealer Name *
              </Text>

              <TextInput
                value={newDealer.name}
                onChangeText={(text) =>
                  setNewDealer({
                    ...newDealer,
                    name: text,
                  })
                }
                placeholder="Enter dealer name"
                placeholderTextColor="#64748b"
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs mb-4"
              />

              {/* CONTACT */}

              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Contact Person
              </Text>

              <TextInput
                value={newDealer.contact}
                onChangeText={(text) =>
                  setNewDealer({
                    ...newDealer,
                    contact: text,
                  })
                }
                placeholder="Enter contact person"
                placeholderTextColor="#64748b"
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs mb-4"
              />

              {/* PHONE */}

              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Phone *
              </Text>

              <TextInput
                value={newDealer.phone}
                onChangeText={(text) =>
                  setNewDealer({
                    ...newDealer,
                    phone: text,
                  })
                }
                placeholder="Enter phone number"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs mb-4"
              />

              {/* EMAIL */}

              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Email
              </Text>

              <TextInput
                value={newDealer.email}
                onChangeText={(text) =>
                  setNewDealer({
                    ...newDealer,
                    email: text,
                  })
                }
                placeholder="Enter email"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs mb-4"
              />

              {/* LOCATION */}

              <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                Location
              </Text>

              <TextInput
                value={newDealer.location}
                onChangeText={(text) =>
                  setNewDealer({
                    ...newDealer,
                    location: text,
                  })
                }
                placeholder="Enter location"
                placeholderTextColor="#64748b"
                className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white text-xs mb-5"
              />

              {/* SAVE */}

              <TouchableOpacity
                disabled={formSubmitting}
                onPress={submitDealer}
                className="bg-cyan-600 rounded-2xl py-4 items-center"
              >

                {formSubmitting ? (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                  />
                ) : (
                  <View className="flex-row items-center">

                    <Plus
                      size={17}
                      color="#fff"
                    />

                    <Text className="text-white font-black text-xs uppercase tracking-wider ml-2">
                      Add Dealer
                    </Text>

                  </View>
                )}

              </TouchableOpacity>

            </ScrollView>

          </View>

        </KeyboardAvoidingView>
      </Modal>

      <CenteredDialog
        visible={feedbackDialog.visible}
        title={feedbackDialog.title}
        message={feedbackDialog.message}
        onClose={() =>
          setFeedbackDialog({
            ...feedbackDialog,
            visible: false,
          })
        }
        actionLabel="Done"
      />

    </View>
  );
};

export default Dealers;
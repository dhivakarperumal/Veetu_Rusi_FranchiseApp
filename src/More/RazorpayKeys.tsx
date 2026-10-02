import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  KeyRound,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import InnerHeader from '../components/InnerHeader';
import { Alert } from '../services/customAlert';
import { del, get, patch, post, put } from '../services/api';

type RazorpayKey = {
  id: number | string;
  key_name: string;
  key_id: string;
  business_name?: string | null;
  key_usage?: string | null;
  status: 'Active' | 'Inactive';
  created_at?: string | null;
  assigned_count?: number | string | null;
};

type KeyForm = {
  key_name: string;
  key_id: string;
  key_secret: string;
  business_name: string;
  key_usage: string;
  status: 'Active' | 'Inactive';
};

const API_PATH = '/admin/razorpay-keys';
const USAGE_OPTIONS = [
  'User Checkout',
  'Delivery Partner',
  'Home Chef',
  'General',
];

const EMPTY_FORM: KeyForm = {
  key_name: '',
  key_id: '',
  key_secret: '',
  business_name: '',
  key_usage: '',
  status: 'Active',
};

const normalizeKeys = (response: any): RazorpayKey[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const maskKey = (value = '') =>
  value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value;

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
};

const RazorpayKeys = () => {
  const navigation: any = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [keys, setKeys] = useState<RazorpayKey[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<RazorpayKey | null>(null);
  const [form, setForm] = useState<KeyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [actionKeyId, setActionKeyId] = useState<string | number | null>(null);
  const [activeSelect, setActiveSelect] = useState<'usage' | 'status' | null>(
    null,
  );

  const loadKeys = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await get<any>(API_PATH);
      setKeys(normalizeKeys(response));
    } catch (error) {
      Alert.alert(
        'Could not load Razorpay keys',
        getErrorMessage(error, 'Please try again.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) loadKeys();
  }, [isFocused, loadKeys]);

  const filteredKeys = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return keys;
    return keys.filter(key =>
      [key.key_name, key.key_id, key.business_name].some(value =>
        String(value || '')
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [keys, search]);

  const activeCount = keys.filter(key => key.status === 'Active').length;
  const assignedCount = keys.reduce(
    (total, key) => total + Number(key.assigned_count || 0),
    0,
  );

  const openAdd = () => {
    setEditingKey(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (key: RazorpayKey) => {
    setEditingKey(key);
    setForm({
      key_name: key.key_name || '',
      key_id: key.key_id || '',
      key_secret: '',
      business_name: key.business_name || '',
      key_usage: key.key_usage || 'General',
      status: key.status,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.key_name.trim() || !form.key_id.trim() || !form.key_usage) {
      Alert.alert('Required fields', 'Enter a key name, key ID, and usage.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        key_name: form.key_name.trim(),
        key_id: form.key_id.trim(),
        business_name: form.business_name.trim(),
      };
      if (editingKey) {
        await put(`${API_PATH}/${editingKey.id}`, payload);
      } else {
        await post(API_PATH, payload);
      }
      setModalOpen(false);
      Alert.alert(
        'Success',
        editingKey ? 'Razorpay key updated.' : 'Razorpay key added.',
      );
      await loadKeys();
    } catch (error) {
      Alert.alert(
        'Could not save Razorpay key',
        getErrorMessage(error, 'Please try again.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (key: RazorpayKey) => {
    const status = key.status === 'Active' ? 'Inactive' : 'Active';
    setActionKeyId(key.id);
    try {
      await patch(`${API_PATH}/${key.id}/status`, { status });
      await loadKeys();
      Alert.alert('Success', `Key ${status.toLowerCase()}.`);
    } catch (error) {
      Alert.alert(
        'Could not change key status',
        getErrorMessage(error, 'Please try again.'),
      );
    } finally {
      setActionKeyId(null);
    }
  };

  const deleteKey = (key: RazorpayKey) => {
    Alert.alert(
      'Delete Razorpay key?',
      `Delete ${key.key_name}? Any users assigned to it will be unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionKeyId(key.id);
            try {
              await del(`${API_PATH}/${key.id}`);
              await loadKeys();
              Alert.alert('Success', 'Razorpay key deleted.');
            } catch (error) {
              Alert.alert(
                'Could not delete Razorpay key',
                getErrorMessage(error, 'Please try again.'),
              );
            } finally {
              setActionKeyId(null);
            }
          },
        },
      ],
    );
  };

  const renderKey = ({ item, index }: { item: RazorpayKey; index: number }) => {
    const actionBusy = actionKeyId === item.id;
    return (
      <View className="mx-4 mb-3 rounded-2xl border border-white/10 bg-slate-900 p-4">
        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Configuration {index + 1}
            </Text>
            <Text className="mt-1 text-base font-black text-white">
              {item.key_name}
            </Text>
          </View>
          <View
            className={`rounded-full px-3 py-1 ${
              item.status === 'Active' ? 'bg-emerald-500/15' : 'bg-slate-700'
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                item.status === 'Active' ? 'text-emerald-300' : 'text-slate-300'
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View className="mt-3 rounded-xl border border-white/5 bg-slate-950 p-3">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Razorpay Key ID
          </Text>
          <Text className="mt-1 font-mono text-sm text-slate-200">
            {maskKey(item.key_id)}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center">
          <Building2 size={15} color="#94a3b8" />
          <Text
            className="ml-2 flex-1 text-xs text-slate-300"
            numberOfLines={1}
          >
            {[item.business_name, item.key_usage || 'General']
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center">
          <CalendarDays size={15} color="#94a3b8" />
          <Text className="ml-2 text-xs text-slate-400">
            {formatDate(item.created_at)}
          </Text>
        </View>

        <View className="mt-4 flex-row border-t border-white/10 pt-3">
          <TouchableOpacity
            disabled={actionBusy}
            onPress={() => toggleStatus(item)}
            accessibilityLabel={
              item.status === 'Active' ? 'Deactivate key' : 'Activate key'
            }
            className="mr-2 flex-1 flex-row items-center justify-center rounded-xl bg-slate-800 py-3"
          >
            {actionBusy ? (
              <ActivityIndicator size="small" color="#34d399" />
            ) : (
              <>
                <Power size={16} color="#6ee7b7" />
                <Text className="ml-2 text-xs font-bold text-slate-200">
                  {item.status === 'Active' ? 'Deactivate' : 'Activate'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            disabled={actionBusy}
            onPress={() => openEdit(item)}
            accessibilityLabel="Edit Razorpay key"
            className="mr-2 h-11 w-12 items-center justify-center rounded-xl bg-slate-800"
          >
            <Pencil size={17} color="#cbd5e1" />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={actionBusy}
            onPress={() => deleteKey(item)}
            accessibilityLabel="Delete Razorpay key"
            className="h-11 w-12 items-center justify-center rounded-xl bg-rose-500/10"
          >
            <Trash2 size={17} color="#fda4af" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-slate-950">
      <InnerHeader title="Razorpay Keys" navigation={navigation} />
      <FlatList
        data={filteredKeys}
        keyExtractor={item => String(item.id)}
        renderItem={renderKey}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadKeys(true)}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View className="px-4 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <View className="mr-3 flex-1">
                <Text className="text-2xl font-black text-white">
                  Razorpay Keys
                </Text>
                <Text className="mt-1 text-xs text-slate-400">
                  Manage payment accounts and user assignments.
                </Text>
              </View>
              <TouchableOpacity
                onPress={openAdd}
                className="h-11 flex-row items-center rounded-xl bg-emerald-500 px-3"
              >
                <Plus size={18} color="#052e24" />
                <Text className="ml-1 text-xs font-black text-emerald-950">
                  Add Key
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mb-4 flex-row">
              {[
                {
                  label: 'Configurations',
                  value: keys.length,
                  icon: KeyRound,
                  color: '#6ee7b7',
                },
                {
                  label: 'Active keys',
                  value: activeCount,
                  icon: ShieldCheck,
                  color: '#5eead4',
                },
                {
                  label: 'Assignments',
                  value: assignedCount,
                  icon: Users,
                  color: '#7dd3fc',
                },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <View
                    key={stat.label}
                    className="mr-2 min-h-24 flex-1 rounded-xl border border-white/10 bg-slate-900 p-3"
                  >
                    <Icon size={17} color={stat.color} />
                    <Text className="mt-2 text-xl font-black text-white">
                      {stat.value}
                    </Text>
                    <Text className="mt-0.5 text-[10px] text-slate-400">
                      {stat.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View className="mb-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
              <Text className="text-xs leading-5 text-emerald-100">
                Key secrets are private and are never shown after saving.
              </Text>
            </View>

            <View className="mb-3 flex-row items-center rounded-xl border border-white/10 bg-slate-900 px-3">
              <Search size={18} color="#94a3b8" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search keys or business"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                className="ml-2 h-12 flex-1 text-sm text-white"
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View className="items-center px-8 py-12">
            {loading ? (
              <>
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="mt-3 text-sm text-slate-400">
                  Loading configurations...
                </Text>
              </>
            ) : (
              <Text className="text-center text-sm text-slate-400">
                {search.trim()
                  ? 'No matching Razorpay configurations.'
                  : 'No Razorpay keys have been added.'}
              </Text>
            )}
          </View>
        }
      />

      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          if (activeSelect) setActiveSelect(null);
          else setModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        >
          <View className="flex-1 justify-end bg-black/70">
            <View
              className="rounded-t-3xl border-t border-white/10 bg-slate-900"
              style={styles.sheet}
            >
              <View className="flex-row items-start justify-between border-b border-white/10 px-5 py-4">
                <View className="mr-3 flex-1">
                  <Text className="text-lg font-black text-white">
                    {editingKey ? 'Edit Razorpay Key' : 'Add Razorpay Key'}
                  </Text>
                  <Text className="mt-1 text-xs text-slate-400">
                    Key secret stays private to the backend.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalOpen(false)}
                  accessibilityLabel="Close form"
                  className="h-9 w-9 items-center justify-center rounded-xl bg-slate-800"
                >
                  <X size={18} color="#cbd5e1" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.formContent}
              >
                <Text className="mb-2 text-xs font-bold text-slate-300">
                  Key Name *
                </Text>
                <TextInput
                  value={form.key_name}
                  onChangeText={value =>
                    setForm(prev => ({ ...prev, key_name: value }))
                  }
                  placeholder="e.g. Franchise Payments"
                  placeholderTextColor="#64748b"
                  maxLength={150}
                  className="mb-4 rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"
                />

                <Text className="mb-2 text-xs font-bold text-slate-300">
                  Razorpay Key ID *
                </Text>
                <TextInput
                  value={form.key_id}
                  onChangeText={value =>
                    setForm(prev => ({ ...prev, key_id: value }))
                  }
                  placeholder="rzp_live_..."
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  className="mb-4 rounded-xl border border-white/10 bg-slate-950 px-3 py-3 font-mono text-sm text-white"
                />

                <Text className="mb-2 text-xs font-bold text-slate-300">
                  Razorpay Key Secret (optional)
                </Text>
                <TextInput
                  value={form.key_secret}
                  onChangeText={value =>
                    setForm(prev => ({ ...prev, key_secret: value }))
                  }
                  placeholder={
                    editingKey
                      ? 'Leave blank to keep current secret'
                      : 'Enter secret'
                  }
                  placeholderTextColor="#64748b"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="off"
                  className="mb-4 rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"
                />

                <Text className="mb-2 text-xs font-bold text-slate-300">
                  Account / Business Name
                </Text>
                <TextInput
                  value={form.business_name}
                  onChangeText={value =>
                    setForm(prev => ({ ...prev, business_name: value }))
                  }
                  placeholder="Business or account name"
                  placeholderTextColor="#64748b"
                  maxLength={255}
                  className="mb-4 rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"
                />

                <Text className="mb-2 text-xs font-bold text-slate-300">
                  Razorpay Usage *
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setActiveSelect('usage');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Razorpay Usage: ${
                    form.key_usage || 'Select Razorpay Usage'
                  }`}
                  className="mb-4 h-14 flex-row items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4"
                >
                  <Text
                    className={`text-sm ${
                      form.key_usage ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {form.key_usage || 'Select Razorpay Usage'}
                  </Text>
                  <ChevronDown size={19} color="#94a3b8" />
                </TouchableOpacity>

                <Text className="mb-2 text-xs font-bold text-slate-300">
                  Status
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setActiveSelect('status');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Status: ${form.status}`}
                  className="h-14 flex-row items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4"
                >
                  <Text className="text-sm text-white">{form.status}</Text>
                  <ChevronDown size={19} color="#94a3b8" />
                </TouchableOpacity>
              </ScrollView>

              <View
                className="flex-row border-t border-white/10 px-5 pt-4"
                style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
              >
                <TouchableOpacity
                  disabled={saving}
                  onPress={() => setModalOpen(false)}
                  className="mr-3 flex-1 items-center rounded-xl border border-white/10 bg-slate-800 py-3.5"
                >
                  <Text className="text-sm font-bold text-slate-200">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={saving}
                  onPress={() => submit()}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-emerald-500 py-3.5"
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#052e24" />
                  ) : (
                    <Text className="text-sm font-black text-emerald-950">
                      {editingKey ? 'Save Changes' : 'Add Key'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {activeSelect ? (
              <View className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center bg-black/75 px-6">
                <TouchableOpacity
                  onPress={() => setActiveSelect(null)}
                  activeOpacity={1}
                  accessibilityLabel="Close options"
                  className="absolute bottom-0 left-0 right-0 top-0"
                />
                <View className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                  <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
                    <View>
                      <Text className="text-base font-black text-white">
                        {activeSelect === 'usage'
                          ? 'Razorpay Usage'
                          : 'Key Status'}
                      </Text>
                      <Text className="mt-1 text-xs text-slate-400">
                        Choose an option
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveSelect(null)}
                      accessibilityLabel="Close options"
                      className="h-9 w-9 items-center justify-center rounded-xl bg-slate-800"
                    >
                      <X size={17} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                  {(activeSelect === 'usage'
                    ? USAGE_OPTIONS
                    : ['Active', 'Inactive']
                  ).map(option => {
                    const selected =
                      activeSelect === 'usage'
                        ? form.key_usage === option
                        : form.status === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          if (activeSelect === 'usage') {
                            setForm(prev => ({ ...prev, key_usage: option }));
                          } else {
                            setForm(prev => ({
                              ...prev,
                              status: option as 'Active' | 'Inactive',
                            }));
                          }
                          setActiveSelect(null);
                        }}
                        className={`mx-3 my-1 flex-row items-center justify-between rounded-xl px-4 py-4 ${
                          selected
                            ? 'border border-emerald-400/30 bg-emerald-500/10'
                            : 'bg-slate-800/70'
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            selected ? 'text-emerald-300' : 'text-slate-200'
                          }`}
                        >
                          {option}
                        </Text>
                        {selected ? <Check size={18} color="#6ee7b7" /> : null}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{ height: Math.max(insets.bottom, 12) }} />
                </View>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  listContent: { paddingBottom: 100 },
  sheet: { maxHeight: '94%', flexShrink: 1 },
  formContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 28,
  },
});

export default RazorpayKeys;

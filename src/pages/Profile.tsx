import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';

const Profile = () => {
  const auth = useContext(AuthContext);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const u = await AsyncStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    };
    load();
  }, []);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-slate-950 p-4">
      <Text className="text-white text-2xl font-bold mb-4">Profile</Text>

      <View className="bg-slate-800 p-4 rounded-xl">
        <Text className="text-slate-300">Name: {user?.name || user?.username || '—'}</Text>
        <Text className="text-slate-300 mt-2">Email: {user?.email || '—'}</Text>
        <Text className="text-slate-300 mt-2">Phone: {user?.phone || '—'}</Text>
      </View>

      <TouchableOpacity onPress={() => auth?.signOut()} className="bg-red-500 mt-6 p-4 rounded-xl">
        <Text className="text-white text-center font-bold">Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Profile;

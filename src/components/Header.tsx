import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Image } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LogOut, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Header = () => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const auth = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    fetchUser();
  }, []);

  // Use username, name, email, or 'U'
  const getFirstLetter = () => {
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleLogout = async () => {
    setDropdownVisible(false);
    await auth?.signOut();
  };

  const navigateTo = (screen: string) => {
    setDropdownVisible(false);
    navigation.navigate(screen);
  };

  return (
    <View 
      className="bg-slate-950 px-4 pb-3 flex-row justify-between items-start border-b border-slate-800 z-50"
      style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="flex-row items-center">
          <View className="bg-white rounded-full p-1 mr-3">
            <Image 
              source={require('../images/logo.png')} 
              style={{ width: 36, height: 36 }} 
              resizeMode="contain" 
            />
          </View>
          <View>
            <Text style={{ fontSize: 20, fontFamily: 'Poppins-Bold', color: 'white', letterSpacing: -1 }}>
              V2Rusi
            </Text>

            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Poppins-Medium',
                letterSpacing: 4,
                color: '#666',
              }}
            >
              TASTE OF HOME
            </Text>
          </View>
        </View>

      <TouchableOpacity 
        onPress={() => setDropdownVisible(true)}
        className="w-10 h-10 bg-teal-600 rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white font-bold text-lg">{getFirstLetter()}</Text>
      </TouchableOpacity>

      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDropdownVisible(false)}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>
        
        <View 
          className="absolute right-4 w-52 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden"
          style={{ top: Math.max(insets.top, 16) + 50 }}
        >
          <TouchableOpacity 
            className="flex-row items-center px-4 py-4 border-b border-slate-700"
            onPress={() => navigateTo('Profile')}
          >
            <User color="#94A3B8" size={20} />
            <Text className="text-slate-200 ml-3 font-semibold">Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center px-4 py-4 border-b border-slate-700"
            onPress={() => navigateTo('More')}
          >
            <MoreHorizontal color="#94A3B8" size={20} />
            <Text className="text-slate-200 ml-3 font-semibold">More</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-row items-center px-4 py-4"
            onPress={handleLogout}
          >
            <LogOut color="#EF4444" size={20} />
            <Text className="text-red-500 ml-3 font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default Header;

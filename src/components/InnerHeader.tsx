import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft, UserCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type InnerHeaderProps = {
  title: string;
  navigation: any;
  onBack?: () => void;
  onProfile?: () => void;
};

const InnerHeader = ({ title, navigation, onBack, onProfile }: InnerHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: 14,
        paddingHorizontal: 16,
        backgroundColor: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TouchableOpacity
        onPress={onBack ?? (() => navigation.goBack())}
        style={{ padding: 8 }}
      >
        <ArrowLeft color="#fff" size={24} />
      </TouchableOpacity>

      <Text
        style={{
          color: '#fff',
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: 0.2,
        }}
      >
        {title}
      </Text>

      <TouchableOpacity
        onPress={onProfile ?? (() => navigation.navigate('Profile'))}
        style={{ padding: 8 }}
      >
        <UserCircle color="#fff" size={26} />
      </TouchableOpacity>
    </View>
  );
};

export default InnerHeader;

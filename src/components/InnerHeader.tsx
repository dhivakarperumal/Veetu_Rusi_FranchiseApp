import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type InnerHeaderProps = {
  title: string;
  navigation: any;
  onBack?: () => void;
};

const InnerHeader = ({ title, navigation, onBack }: InnerHeaderProps) => {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation?.canGoBack && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation?.navigate) {
      navigation.navigate('Main');
    }
  };

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
      }}
    >
      <TouchableOpacity
        onPress={handleBack}
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
          marginLeft: 8,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

export default InnerHeader;
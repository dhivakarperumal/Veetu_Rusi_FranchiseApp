import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
} from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledSafeAreaView = styled(SafeAreaView);

export default function App(): React.JSX.Element {
  return (
    <>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />

      <StyledSafeAreaView className="flex-1 bg-orange-50 justify-center items-center">
        <StyledView className="w-11/12 bg-white rounded-2xl p-6 items-center shadow-lg">
          <StyledText className="text-6xl mb-2">🍲</StyledText>

          <StyledText className="text-2xl font-bold text-orange-600 text-center">
            VeetuRusi Franchise Admin
          </StyledText>

          <StyledText className="text-base text-gray-600 mt-2 text-center">
            Welcome to the Franchise Dashboard
          </StyledText>

          <StyledView className="bg-orange-600 mt-5 px-7 py-3 rounded-lg">
            <StyledText className="text-base text-white font-bold text-center">
              Login
            </StyledText>
          </StyledView>

          <StyledText className="text-xs text-gray-400 mt-4">
            Version 1.0
          </StyledText>
        </StyledView>
      </StyledSafeAreaView>
    </>
  );
}
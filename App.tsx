import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StatusBar,
  ScrollView,
} from 'react-native';
import { styled } from 'nativewind';

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);

export default function App(): React.JSX.Element {
  return (
    <>
      <StatusBar backgroundColor="#FF6B00" barStyle="light-content" />

      <StyledSafeAreaView className="flex-1 bg-orange-50">
        <StyledScrollView
          contentContainerClassName="flex-1 justify-center items-center px-4 py-8"
          scrollEnabled={false}
        >
          <StyledView className="w-full max-w-sm bg-white rounded-2xl p-6 items-center shadow-xl">
            <StyledText className="text-6xl mb-4">🍲</StyledText>

            <StyledText className="text-2xl font-bold text-orange-600 text-center mb-2">
              VeetuRusi Franchise Admin
            </StyledText>

            <StyledText className="text-base text-gray-600 text-center mb-6">
              Welcome to the Franchise Dashboard
            </StyledText>

            <StyledView className="w-full bg-orange-600 py-3 px-6 rounded-lg items-center mb-4">
              <StyledText className="text-base text-white font-semibold">
                Login
              </StyledText>
            </StyledView>

            <StyledText className="text-sm text-gray-400">
              Version 1.0
            </StyledText>
          </StyledView>
        </StyledScrollView>
      </StyledSafeAreaView>
    </>
  );
}
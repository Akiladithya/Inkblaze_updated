// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View, Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen from './src/screens/ResultScreen';
import { colors, typography } from './src/styles/theme';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['pdfhighlighter://', 'https://pdfhighlighter.app'],
  config: {
    screens: {
      Home: '',
      Processing: 'processing',
      Result: 'result',
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'PDF Highlighter' }}
        />
        <Stack.Screen
          name="Processing"
          component={ProcessingScreen}
          options={{
            title: 'Processing…',
            gestureEnabled: false, // prevent swipe-back during processing
          }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: 'Results' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

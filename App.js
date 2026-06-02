// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { setAuthToken } from './src/services/api';

import AuthScreen       from './src/screens/AuthScreen';
import HomeScreen       from './src/screens/HomeScreen';
import HistoryScreen    from './src/screens/HistoryScreen';
import ProcessingScreen from './src/screens/ProcessingScreen';
import ResultScreen     from './src/screens/ResultScreen';
import { colors } from './src/styles/theme';

const Stack = createNativeStackNavigator();

const opts = {
  headerShown: false,
  animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
  contentStyle: { backgroundColor: colors.background },
};

function Navigator() {
  const { user, token, loading } = useAuth();

  useEffect(() => { setAuthToken(token); }, [token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={opts} initialRouteName={user ? 'History' : 'Auth'}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'INNK' }} />
        ) : (
          <>
            <Stack.Screen name="History"    component={HistoryScreen}    options={{ title: 'Library' }} />
            <Stack.Screen name="Home"       component={HomeScreen}       options={{ title: 'INNK' }} />
            <Stack.Screen name="Processing" component={ProcessingScreen} options={{ title: 'Processing', gestureEnabled: false }} />
            <Stack.Screen name="Result"     component={ResultScreen}     options={{ title: 'Results' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Navigator />
    </AuthProvider>
  );
}

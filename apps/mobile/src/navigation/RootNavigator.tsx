import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList, AppStackParamList } from './types';
import { useAuth } from '../auth/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import EventListScreen from '../screens/events/EventListScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Login">
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt Ol' }} />
      <AuthStack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ title: 'Doğrulama' }} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator initialRouteName="EventList">
      <AppStack.Screen name="EventList" component={EventListScreen} options={{ title: 'Etkinlikler' }} />
      <AppStack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Etkinlik' }} />
      <AppStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Etkinlik Oluştur' }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <NavigationContainer>{token ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}

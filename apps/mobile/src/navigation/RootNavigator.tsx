import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import type { AuthStackParamList, AppStackParamList, AppTabParamList } from './types';
import { useAuth } from '../auth/AuthContext';
import { checkRegionAccess } from '../location/region-gate';
import type { RegionGateResult } from '../location/region-gate';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OtpVerifyScreen from '../screens/auth/OtpVerifyScreen';
import EventListScreen from '../screens/events/EventListScreen';
import MyEventsScreen from '../screens/events/MyEventsScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import ProfileHomeScreen from '../screens/profile/ProfileHomeScreen';
import EditPersonalInfoScreen from '../screens/profile/EditPersonalInfoScreen';
import PreferencesScreen from '../screens/profile/PreferencesScreen';
import EditInterestsScreen from '../screens/profile/EditInterestsScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import MapExploreScreen from '../screens/events/MapExploreScreen';
import RegionBlockedScreen from '../screens/region/RegionBlockedScreen';
import { colors } from '../theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Login">
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: 'Giriş Yap' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: 'Kayıt Ol' }} />
      <AuthStack.Screen name="OtpVerify" component={OtpVerifyScreen} options={{ title: 'Doğrulama' }} />
    </AuthStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof AppTabParamList, keyof typeof MaterialIcons.glyphMap> = {
  KesfetTab: 'explore',
  EtkinliklerimTab: 'event',
  ProfilTab: 'account-circle',
};

function AppTabsNavigator() {
  return (
    <AppTabs.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => <MaterialIcons name={TAB_ICONS[route.name]} size={size} color={color} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      })}
    >
      <AppTabs.Screen
        name="KesfetTab"
        component={EventListScreen}
        options={{ title: 'Keşfet', tabBarButtonTestID: 'tab-kesfet' }}
      />
      <AppTabs.Screen
        name="EtkinliklerimTab"
        component={MyEventsScreen}
        options={{ title: 'Etkinliklerim', tabBarButtonTestID: 'tab-etkinliklerim' }}
      />
      <AppTabs.Screen
        name="ProfilTab"
        component={ProfileHomeScreen}
        options={{ title: 'Profil', tabBarButtonTestID: 'tab-profil' }}
      />
    </AppTabs.Navigator>
  );
}

function AppNavigator() {
  const { user } = useAuth();
  const needsOnboarding = user?.onboardingCompletedAt == null;

  return (
    <AppStack.Navigator initialRouteName={needsOnboarding ? 'Onboarding' : 'Tabs'}>
      <AppStack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <AppStack.Screen name="Tabs" component={AppTabsNavigator} options={{ headerShown: false }} />
      <AppStack.Screen name="EventDetail" component={EventDetailScreen} />
      <AppStack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Etkinlik Oluştur' }} />
      <AppStack.Screen name="MapExplore" component={MapExploreScreen} options={{ title: 'Haritada Keşfet' }} />
      <AppStack.Screen name="EditPersonalInfo" component={EditPersonalInfoScreen} options={{ title: 'Kişisel Bilgiler' }} />
      <AppStack.Screen name="Preferences" component={PreferencesScreen} options={{ title: 'Tercihler' }} />
      <AppStack.Screen name="EditInterests" component={EditInterestsScreen} options={{ title: 'İlgi Alanları' }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoading, token } = useAuth();
  const [gate, setGate] = useState<RegionGateResult | 'checking'>('checking');

  useEffect(() => {
    checkRegionAccess().then(setGate);
  }, []);

  if (gate === 'checking' || isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!gate.allowed) {
    return <RegionBlockedScreen reason={gate.reason} onRetry={() => checkRegionAccess().then(setGate)} />;
  }

  return <NavigationContainer>{token ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}

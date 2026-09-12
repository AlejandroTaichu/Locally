import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import type {
  AuthStackParamList,
  AppStackParamList,
  AppTabParamList,
} from "./types";
import { useAuth } from "../auth/AuthContext";
import { biometricPreference } from "../auth/biometric-preference";
import { checkRegionAccess } from "../location/region-gate";
import type { RegionGateResult } from "../location/region-gate";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import OtpVerifyScreen from "../screens/auth/OtpVerifyScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";
import BiometricLockScreen from "../screens/auth/BiometricLockScreen";
import EventListScreen from "../screens/events/EventListScreen";
import MyEventsScreen from "../screens/events/MyEventsScreen";
import EventDetailScreen from "../screens/events/EventDetailScreen";
import CreateEventScreen from "../screens/events/CreateEventScreen";
import ProfileHomeScreen from "../screens/profile/ProfileHomeScreen";
import EditPersonalInfoScreen from "../screens/profile/EditPersonalInfoScreen";
import PreferencesScreen from "../screens/profile/PreferencesScreen";
import EditInterestsScreen from "../screens/profile/EditInterestsScreen";
import LegalScreen from "../screens/profile/LegalScreen";
import NotificationsScreen from "../screens/profile/NotificationsScreen";
import OnboardingScreen from "../screens/onboarding/OnboardingScreen";
import MapExploreScreen from "../screens/events/MapExploreScreen";
import RegionBlockedScreen from "../screens/region/RegionBlockedScreen";
import PillTabBar from "./PillTabBar";
import { colors } from "../theme";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Login">
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="OtpVerify"
        component={OtpVerifyScreen}
        options={{ title: "Doğrulama" }}
      />
      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

const TAB_ICONS: Record<
  keyof AppTabParamList,
  keyof typeof MaterialIcons.glyphMap
> = {
  KesfetTab: "explore",
  EtkinliklerimTab: "event",
  ProfilTab: "account-circle",
};

function AppTabsNavigator() {
  return (
    <AppTabs.Navigator
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: "DMSans_700Bold",
          color: colors.textPrimary,
        },
        tabBarIcon: ({ color, size }) => (
          <MaterialIcons
            name={TAB_ICONS[route.name]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <AppTabs.Screen
        name="KesfetTab"
        component={EventListScreen}
        options={{ title: "Keşfet", tabBarButtonTestID: "tab-kesfet" }}
      />
      <AppTabs.Screen
        name="EtkinliklerimTab"
        component={MyEventsScreen}
        options={{
          title: "Etkinliklerim",
          tabBarButtonTestID: "tab-etkinliklerim",
        }}
      />
      <AppTabs.Screen
        name="ProfilTab"
        component={ProfileHomeScreen}
        options={{ title: "Profil", tabBarButtonTestID: "tab-profil" }}
      />
    </AppTabs.Navigator>
  );
}

function AppNavigator() {
  const { user } = useAuth();
  const needsOnboarding = user?.onboardingCompletedAt == null;

  return (
    <AppStack.Navigator
      initialRouteName={needsOnboarding ? "Onboarding" : "Tabs"}
    >
      <AppStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Tabs"
        component={AppTabsNavigator}
        options={{ headerShown: false }}
      />
      <AppStack.Screen name="EventDetail" component={EventDetailScreen} />
      <AppStack.Screen
        name="CreateEvent"
        component={CreateEventScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="MapExplore"
        component={MapExploreScreen}
        options={{ title: "Haritada Keşfet" }}
      />
      <AppStack.Screen
        name="EditPersonalInfo"
        component={EditPersonalInfoScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ title: "Tercihler" }}
      />
      <AppStack.Screen
        name="EditInterests"
        component={EditInterestsScreen}
        options={{ title: "İlgi Alanları" }}
      />
      <AppStack.Screen
        name="Legal"
        component={LegalScreen}
        options={{ title: "Gizlilik ve Yasal" }}
      />
      <AppStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Bildirimler" }}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoading, token } = useAuth();
  const [gate, setGate] = useState<RegionGateResult | "checking">("checking");
  const [biometricState, setBiometricState] = useState<
    "checking" | "locked" | "unlocked"
  >("checking");

  useEffect(() => {
    checkRegionAccess().then(setGate);
  }, []);

  // Recheck a blocked screen when returning from Settings; never prompt on foreground.
  useEffect(() => {
    if (gate === "checking" || gate.allowed) return;
    let cancelled = false;
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      const result = await checkRegionAccess(false, false);
      if (!cancelled) setGate(result);
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [gate]);

  // Uygulama açılışında bir kez kontrol edilir (cold-start gate) — her foreground'da değil, bilerek sınırlı tutuldu.
  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      setBiometricState("unlocked");
      return;
    }
    biometricPreference
      .get()
      .then((enabled) => setBiometricState(enabled ? "locked" : "unlocked"));
  }, [isLoading, token]);

  if (gate === "checking" || isLoading || biometricState === "checking") {
    return (
      <View
        testID="app-bootstrap"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!gate.allowed) {
    return (
      <RegionBlockedScreen
        reason={gate.reason}
        onRetry={() => checkRegionAccess(true).then(setGate)}
      />
    );
  }

  return (
    <NavigationContainer>
      {!token ? (
        <AuthNavigator />
      ) : biometricState === "locked" ? (
        <BiometricLockScreen onUnlock={() => setBiometricState("unlocked")} />
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}

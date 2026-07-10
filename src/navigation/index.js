import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AppProvider } from '../context/AppContext';
import { colors } from '../theme';

import SplashScreen           from '../screens/SplashScreen';
import LoginScreen            from '../screens/LoginScreen';
import OnboardingScreen       from '../screens/OnboardingScreen';
import CashbooksListScreen    from '../screens/CashbooksListScreen';
import TransactionViewScreen  from '../screens/TransactionViewScreen';
import AddEntryScreen         from '../screens/AddEntryScreen';
import TeamScreen             from '../screens/TeamScreen';
import ProfileScreen          from '../screens/ProfileScreen';
import SettingsScreen         from '../screens/SettingsScreen';
import PaymentsScreen         from '../screens/PaymentsScreen';
import GenerateReportScreen     from '../screens/GenerateReportScreen';
import PDFSettingsScreen        from '../screens/PDFSettingsScreen';
import EntryDetailScreen        from '../screens/EntryDetailScreen';
import EditEntryScreen          from '../screens/EditEntryScreen';
import MemberInfoScreen         from '../screens/MemberInfoScreen';
import AddMemberToBooksScreen   from '../screens/AddMemberToBooksScreen';
import BookSearchScreen          from '../screens/BookSearchScreen';
import DuplicateBookScreen       from '../screens/DuplicateBookScreen';
import MoveBookScreen            from '../screens/MoveBookScreen';
import AddBookMemberScreen       from '../screens/AddBookMemberScreen';
import AddExternalMemberScreen   from '../screens/AddExternalMemberScreen';
import BookSettingsScreen        from '../screens/BookSettingsScreen';
import ShareInvitationScreen     from '../screens/ShareInvitationScreen';
import BookActivityScreen        from '../screens/BookActivityScreen';
import DeleteAllEntriesScreen    from '../screens/DeleteAllEntriesScreen';
import ExcelReportScreen         from '../screens/ExcelReportScreen';
import BusinessProfileScreen     from '../screens/BusinessProfileScreen';
import BusinessSettingsScreen    from '../screens/BusinessSettingsScreen';
import ChangePrimaryAdminScreen  from '../screens/ChangePrimaryAdminScreen';
import ChooseNewPrimaryAdminScreen from '../screens/ChooseNewPrimaryAdminScreen';
import DeleteBusinessScreen      from '../screens/DeleteBusinessScreen';
import DeleteSuccessScreen       from '../screens/DeleteSuccessScreen';
import MoveBookRequestsScreen    from '../screens/MoveBookRequestsScreen';
import TeamHelpScreen            from '../screens/TeamHelpScreen';


const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Payments:  { active: 'wallet',     inactive: 'wallet-outline'     },
  Cashbooks: { active: 'bookmarks',  inactive: 'bookmarks-outline'  },
  Settings:  { active: 'settings',   inactive: 'settings-outline'   } };

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.blue,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: colors.gray200,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Poppins-Medium' },
        tabBarIcon: ({ color, focused }) => {
          const { active, inactive } = TAB_ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
        } })}
    >
      <Tab.Screen name="Payments"  component={PaymentsScreen} />
      <Tab.Screen name="Cashbooks" component={CashbooksListScreen} />
      <Tab.Screen name="Settings"  component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <AppProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main"            component={MainTabs} />
        <Stack.Screen name="Onboarding"      component={OnboardingScreen} />
        <Stack.Screen name="TransactionView" component={TransactionViewScreen} />
        <Stack.Screen name="AddEntry"        component={AddEntryScreen} />
        <Stack.Screen name="Team"            component={TeamScreen} />
        <Stack.Screen name="Profile"         component={ProfileScreen} />
        <Stack.Screen name="GenerateReport"  component={GenerateReportScreen} />
        <Stack.Screen name="PDFSettings"     component={PDFSettingsScreen} />
        <Stack.Screen name="EntryDetail"      component={EntryDetailScreen} />
        <Stack.Screen name="EditEntry"        component={EditEntryScreen} />
        <Stack.Screen name="MemberInfo"       component={MemberInfoScreen} />
        <Stack.Screen name="AddMemberToBooks" component={AddMemberToBooksScreen} />
        <Stack.Screen name="BookSearch"      component={BookSearchScreen} />
        <Stack.Screen name="DuplicateBook"      component={DuplicateBookScreen} />
        <Stack.Screen name="MoveBook"           component={MoveBookScreen} />
        <Stack.Screen name="AddBookMember"      component={AddBookMemberScreen} />
        <Stack.Screen name="AddExternalMember"  component={AddExternalMemberScreen} />
        <Stack.Screen name="BookSettings"       component={BookSettingsScreen} />
        <Stack.Screen name="BusinessProfile"    component={BusinessProfileScreen} />
        <Stack.Screen name="BusinessSettings"   component={BusinessSettingsScreen} />
        <Stack.Screen name="ChangePrimaryAdmin" component={ChangePrimaryAdminScreen} />
        <Stack.Screen name="ChooseNewPrimaryAdmin" component={ChooseNewPrimaryAdminScreen} />
        <Stack.Screen name="DeleteBusiness"     component={DeleteBusinessScreen} />
        <Stack.Screen name="DeleteSuccess"      component={DeleteSuccessScreen} />
        <Stack.Screen name="MoveBookRequests"   component={MoveBookRequestsScreen} />
        <Stack.Screen name="ShareInvitation"    component={ShareInvitationScreen} />
        <Stack.Screen name="BookActivity"       component={BookActivityScreen} />
        <Stack.Screen name="DeleteAllEntries"   component={DeleteAllEntriesScreen} />
        <Stack.Screen name="ExcelReport"        component={ExcelReportScreen} />
        <Stack.Screen name="TeamHelp"           component={TeamHelpScreen} />
      </Stack.Navigator>
    </AppProvider>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <SplashScreen />;
  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

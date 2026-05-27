import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {Platform, StyleSheet, Text} from 'react-native';
import {enableScreens} from 'react-native-screens';
import AccountScreen from './screens/AccountScreen';
import DocumentsScreen from './screens/DocumentsScreen';
import HomeScreen from './screens/HomeScreen';
import TripDetailScreen from './screens/TripDetailScreen';
import {colors, typography} from './theme';

enableScreens();

export type RootStackParamList = {
  Home: undefined;
  TripDetail: {tripId: string; tripName: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
    </Stack.Navigator>
  );
}

const TAB_ICONS: Record<string, string> = {
  Trips: '🏠',
  Documents: '📄',
  Account: '👤',
};

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <Text style={focused ? styles.tabIconActive : styles.tabIcon}>
              {TAB_ICONS[route.name]}
            </Text>
          ),
          tabBarLabel: ({focused, children}) => (
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
              {children}
            </Text>
          ),
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
        })}>
        <Tab.Screen name="Trips" component={TripsStack} />
        <Tab.Screen name="Documents" component={DocumentsScreen} />
        <Tab.Screen name="Account" component={AccountScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 0 : 4,
    height: Platform.OS === 'ios' ? 83 : 60,
  },
  tabIcon: {fontSize: 20},
  tabIconActive: {fontSize: 20},
  tabLabel: {
    fontSize: typography.xs,
    fontWeight: typography.medium,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: typography.semibold,
  },
});

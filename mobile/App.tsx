import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {Platform, StyleSheet} from 'react-native';
import {enableScreens} from 'react-native-screens';
import Icon from './components/Icon';
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

const TAB_ICON: Record<string, string> = {
  Trips:     'home',
  Documents: 'doc',
  Account:   'user',
};

function TripsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarIcon: ({focused}) => (
            <Icon
              name={TAB_ICON[route.name] ?? 'star'}
              size={22}
              color={focused ? colors.accent : colors.textTertiary}
            />
          ),
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: styles.tabLabel,
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
  tabLabel: {
    fontSize: typography.xs,
    fontWeight: typography.medium as any,
  },
});

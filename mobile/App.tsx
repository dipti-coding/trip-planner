import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import React from 'react';
import {enableScreens} from 'react-native-screens';
import HomeScreen from './screens/HomeScreen';
import TripDetailScreen from './screens/TripDetailScreen';

enableScreens();

export type RootStackParamList = {
  Home: undefined;
  TripDetail: {tripId: string; tripName: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

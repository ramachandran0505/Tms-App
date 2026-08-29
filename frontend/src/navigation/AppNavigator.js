import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ComplaintFormScreen from '../screens/ComplaintFormScreen';
import ComplaintsDashboardScreen from '../screens/ComplaintsDashboardScreen';
import UserComplaintDashboardScreen from '../screens/UserComplaintDashboardScreen';
import DepartmentScreen from '../screens/DepartmentScreen';
import ProgrammeScreen from '../screens/ProgrammeScreen';
import BlockScreen from '../screens/BlockScreen';
import RoomScreen from '../screens/RoomScreen';
import RoleScreen from '../screens/RoleScreen';
import UserScreen from '../screens/UserScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['tms://', 'http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'],
  config: {
    screens: {
      Login: '',
      Home: 'dashboard',
      ComplaintForm: 'complaints/new',
      Complaints: 'complaints',
      MyComplaints: 'my-complaints',
      Departments: 'departments',
      Programmes: 'programmes',
      Blocks: 'blocks',
      Rooms: 'rooms',
      Roles: 'roles',
      Users: 'users',
      Reports: 'reports',
      Profile: 'profile',
    },
  },
};

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        key={isAuthenticated ? 'app-authenticated' : 'app-guest'}
        initialRouteName={isAuthenticated ? 'Home' : 'Login'}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
          animationEnabled: false, // Smooth instant cross-platform transitions
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ComplaintForm" component={ComplaintFormScreen} />
            <Stack.Screen name="Complaints" component={ComplaintsDashboardScreen} />
            <Stack.Screen name="MyComplaints" component={UserComplaintDashboardScreen} />
            <Stack.Screen name="Departments" component={DepartmentScreen} />
            <Stack.Screen name="Programmes" component={ProgrammeScreen} />
            <Stack.Screen name="Blocks" component={BlockScreen} />
            <Stack.Screen name="Rooms" component={RoomScreen} />
            <Stack.Screen name="Roles" component={RoleScreen} />
            <Stack.Screen name="Users" component={UserScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppNavigator;

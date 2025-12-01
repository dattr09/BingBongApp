import React from "react";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import HomeScreen from "./src/screens/home/HomeScreen";
import SplashScreen from "./src/screens/SplashScreen";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import VerifyCodeScreen from "./src/screens/auth/VerifyCodeScreen";
import NotificationScreen from "./src/screens/notifications/NotifcationScreen";
import SearchScreen from "./src/screens/home/SearchScreen";
import MessengerScreen from "./src/screens/messenger/MessengerScreen";
import ChatScreen from "./src/screens/messenger/ChatScreen";
import ListFriendScreen from "./src/screens/home/ListFriendScreen";
import FriendScreen from "./src/screens/home/FriendScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />

        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Messenger" component={MessengerScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ListFriend" component={ListFriendScreen} />
        <Stack.Screen name="FriendScreen" component={FriendScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

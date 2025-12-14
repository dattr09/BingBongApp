import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import { MenuProvider } from "./src/context/MenuContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

// Import các màn hình (Giữ nguyên đường dẫn của bạn)
import SplashScreen from "./src/screens/SplashScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import VerifyCodeScreen from "./src/screens/auth/VerifyCodeScreen";
import HomeScreen from "./src/screens/home/HomeScreen";
import NotificationScreen from "./src/screens/notifications/NotifcationScreen";
import SearchScreen from "./src/screens/home/SearchScreen";
import MessengerScreen from "./src/screens/messenger/MessengerScreen";
import StoriesScreen from "./src/screens/messenger/StoriesScreen";
import AIChatScreen from "./src/screens/messenger/AIChatScreen";
import ChatScreen from "./src/screens/messenger/ChatScreen";
import ListFriendScreen from "./src/screens/home/ListFriendScreen";
import FriendScreen from "./src/screens/home/FriendScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";
import EditProfileScreen from "./src/screens/profile/EditProfileScreen";
import ShopPageScreen from "./src/screens/shop/ShopPageScreen";
import DetailShopScreen from "./src/screens/shop/DetailShopScreen";
import DetailProductScreen from "./src/screens/shop/DetailProductScreen";
import GroupPageScreen from "./src/screens/group/GroupPageScreen";
import DetailGroupScreen from "./src/screens/group/DetailGroupScreen";
import CartScreen from "./src/screens/cart/CartScreen";
import CheckoutScreen from "./src/screens/cart/CheckoutScreen";
import OrderScreen from "./src/screens/order/OrderScreen";
import OrderDetailScreen from "./src/screens/order/OrderDetailScreen";
import DetailPostScreen from "./src/screens/post/DetailPostScreen";
import BadgeScreen from "./src/screens/badge/BadgeScreen";
import NewsScreen from "./src/screens/news/NewsScreen";
import MovieScreen from "./src/screens/movie/MovieScreen";
import DetailMovieScreen from "./src/screens/movie/DetailMovieScreen";
import QuizPageScreen from "./src/screens/quiz/QuizPageScreen";
import QuizPlayScreen from "./src/screens/quiz/QuizPlayScreen";
import QuizLeaderboardScreen from "./src/screens/quiz/QuizLeaderboardScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import ChangePasswordScreen from "./src/screens/auth/ChangePasswordScreen";
import ShortsScreen from "./src/screens/short/ShortsScreen";
import MyShortsScreen from "./src/screens/short/MyShortsScreen";
import CreateShortScreen from "./src/screens/short/CreateShortScreen";

const Stack = createNativeStackNavigator();

function AppContent() {
  const theme = useTheme();
  const { isDark, colors } = theme || { isDark: false, colors: {} };
  
  // Ensure colors object has all required properties
  const safeColors = {
    primary: colors?.primary || "#0EA5E9",
    background: colors?.background || "#FFFFFF",
    card: colors?.card || "#FFFFFF",
    text: colors?.text || "#111827",
    border: colors?.border || "#E5E7EB",
    error: colors?.error || "#EF4444",
  };
  
  return (
    <MenuProvider>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={safeColors.background}
      />
      <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: safeColors.primary,
            background: safeColors.background,
            card: safeColors.card,
            text: safeColors.text,
            border: safeColors.border,
            notification: safeColors.error,
          },
          fonts: {
            regular: {
              fontFamily: 'System',
              fontWeight: '400',
            },
            medium: {
              fontFamily: 'System',
              fontWeight: '500',
            },
            bold: {
              fontFamily: 'System',
              fontWeight: '700',
            },
            heavy: {
              fontFamily: 'System',
              fontWeight: '800',
            },
          },
        }}
      >
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}
        >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Messenger" component={MessengerScreen} />
        <Stack.Screen name="Stories" component={StoriesScreen} />
        <Stack.Screen name="AIChat" component={AIChatScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ListFriend" component={ListFriendScreen} />
        <Stack.Screen name="Friends" component={FriendScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        
        {/* Shop Screens */}
        <Stack.Screen name="ShopPage" component={ShopPageScreen} />
        <Stack.Screen name="DetailShop" component={DetailShopScreen} />
        <Stack.Screen name="DetailProduct" component={DetailProductScreen} />
        
        {/* Group Screens */}
        <Stack.Screen name="GroupPage" component={GroupPageScreen} />
        <Stack.Screen name="DetailGroup" component={DetailGroupScreen} />
        
        {/* Cart & Order Screens */}
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="Order" component={OrderScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        
        {/* Post Screens */}
        <Stack.Screen name="DetailPost" component={DetailPostScreen} />
        
        {/* Badge Screen */}
        <Stack.Screen name="Badge" component={BadgeScreen} />
        
        {/* News Screen */}
        <Stack.Screen name="News" component={NewsScreen} />
        
        {/* Movie Screens */}
        <Stack.Screen name="Movie" component={MovieScreen} />
        <Stack.Screen name="DetailMovie" component={DetailMovieScreen} />
        
        {/* Quiz Screens */}
        <Stack.Screen name="Quiz" component={QuizPageScreen} />
        <Stack.Screen name="QuizPlay" component={QuizPlayScreen} />
        <Stack.Screen name="QuizLeaderboard" component={QuizLeaderboardScreen} />
        
        {/* Shorts Screens */}
        <Stack.Screen name="Shorts" component={ShortsScreen} />
        <Stack.Screen name="MyShorts" component={MyShortsScreen} />
        <Stack.Screen name="CreateShort" component={CreateShortScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </MenuProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

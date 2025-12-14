import { CommonActions, useNavigation } from "@react-navigation/native";

export const useNavigationSafe = () => {
  try {
    return useNavigation();
  } catch (error) {
    console.warn("Navigation context not available:", error.message);
    return null;
  }
};

export const safeNavigate = (navigation, screenName, params = {}) => {
  try {
    if (!navigation) {
      console.warn("Navigation object not available");
      return false;
    }

    if (typeof navigation.navigate === "function") {
      navigation.navigate(screenName, params);
      return true;
    }

    if (typeof navigation.dispatch === "function") {
      navigation.dispatch(
        CommonActions.navigate({
          name: screenName,
          params,
        })
      );
      return true;
    }

    console.warn("Navigation methods not available");
    return false;
  } catch (error) {
    console.error("Navigation error:", error);
    return false;
  }
};

export const safeGoBack = (navigation) => {
  try {
    if (!navigation) {
      console.warn("Navigation object not available");
      return false;
    }

    if (typeof navigation.canGoBack === "function" && navigation.canGoBack()) {
      if (typeof navigation.goBack === "function") {
        navigation.goBack();
        return true;
      }
      if (typeof navigation.dispatch === "function") {
        navigation.dispatch(CommonActions.goBack());
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Go back error:", error);
    return false;
  }
};


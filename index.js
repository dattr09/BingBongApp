import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
// Dòng này dùng cho NativeWind (nếu bạn có file css), nếu không có thể gây lỗi bundler
// Nếu project của bạn có file index.css thì giữ nguyên, nếu không thì xóa đi.
import "./index.css";

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

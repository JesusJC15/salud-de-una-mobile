import { ExpoConfig, ConfigContext } from "expo/config";

type AppConfig = ExpoConfig & {
  newArchEnabled?: boolean;
  android: ExpoConfig["android"] & {
    edgeToEdgeEnabled?: boolean;
    usesCleartextTraffic?: boolean;
  };
};

export default ({ config }: ConfigContext): AppConfig => ({
  ...config,
  name: "SaludDeUna",
  slug: "salud-de-una-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/iconoSaludDeUna.png",
  scheme: "saluddeunamobile",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.jesusjc15.saluddeunamobile",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/iconoSaludDeUna.png",
      backgroundImage: "./assets/images/iconoSaludDeUna.png",
      monochromeImage: "./assets/images/iconoSaludDeUna.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.jesusjc15.saluddeunamobile",
    // Permite tráfico HTTP al ALB (el APK usa http:// para evitar el cert autofirmado)
    usesCleartextTraffic: true,
    permissions: [
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.VIBRATE",
      "android.permission.RECEIVE_BOOT_COMPLETED",
    ],
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    "@react-native-community/datetimepicker",
    "expo-font",
    "expo-image",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#14b8a6",
        defaultChannel: "default",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "9853f73c-fa30-47cd-b575-cb152e824317",
    },
  },
  owner: "saluddeuna",
});

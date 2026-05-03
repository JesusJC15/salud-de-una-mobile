import { ExpoConfig, ConfigContext } from "expo/config";

type AppConfig = ExpoConfig & {
  newArchEnabled?: boolean;
  android: ExpoConfig["android"] & { edgeToEdgeEnabled?: boolean };
};

export default ({ config }: ConfigContext): AppConfig => ({
  ...config,
  name: "salud-de-una-mobile",
  slug: "salud-de-una-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "saluddeunamobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.jesusjc15.saluddeunamobile",
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

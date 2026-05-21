import { ExpoConfig, ConfigContext } from "expo/config";
import {
  withAndroidManifest,
  withDangerousMod,
  type ConfigPlugin,
} from "@expo/config-plugins";
import * as fs from "fs";
import * as path from "path";

// ─────────────────────────────────────────────────────────────────────────────
// Plugin que garantiza tráfico HTTP en Android.
//
// Por qué es necesario:
//   expo-system-ui (edgeToEdgeEnabled: true) genera su propio
//   network_security_config.xml que anula android:usesCleartextTraffic.
//   En Android, android:networkSecurityConfig tiene prioridad absoluta.
//   Este plugin sobreescribe ese XML para permitir HTTP al ALB de AWS.
// ─────────────────────────────────────────────────────────────────────────────
const withCleartextHttpPlugin: ConfigPlugin<void> = (config) => {
  // Paso 1 — Apuntar AndroidManifest al XML de seguridad de red
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (application?.$) {
      application.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }
    return mod;
  });

  // Paso 2 — Escribir el XML que permite HTTP
  config = withDangerousMod(config, [
    "android",
    (mod) => {
      const xmlDir = path.join(
        mod.modRequest.platformProjectRoot,
        "app",
        "src",
        "main",
        "res",
        "xml"
      );
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, "network_security_config.xml"),
        [
          '<?xml version="1.0" encoding="utf-8"?>',
          "<network-security-config>",
          '    <base-config cleartextTrafficPermitted="true">',
          "        <trust-anchors>",
          '            <certificates src="system"/>',
          "        </trust-anchors>",
          "    </base-config>",
          "</network-security-config>",
        ].join("\n")
      );
      return mod;
    },
  ]);

  return config;
};

type AppConfig = ExpoConfig & {
  newArchEnabled?: boolean;
  android: ExpoConfig["android"] & {
    edgeToEdgeEnabled?: boolean;
    usesCleartextTraffic?: boolean;
  };
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const appConfig: AppConfig = {
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
          icon: "./assets/images/iconoSaludDeUna.png",
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
  };

  // Aplicar el plugin funcional fuera del array plugins
  return withCleartextHttpPlugin(appConfig);
};

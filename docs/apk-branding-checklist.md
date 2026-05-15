# Branding APK - SaludDeUna

## Objetivo
Configurar branding mobile premium para que el APK instalado se muestre como **SaludDeUna** con iconografia consistente en Android (y base lista para iOS).

## Configuracion actual aplicada
- Nombre visible de app: `SaludDeUna` (`app.config.ts -> name`)
- Package Android: `com.jesusjc15.saluddeunamobile` (se mantiene en esta fase para no impactar firma/distribucion)
- Bundle iOS: `com.jesusjc15.saluddeunamobile` (sin cambios)
- Adaptive icon Android:
  - `assets/images/android-icon-foreground.png`
  - `assets/images/android-icon-background.png`
  - `assets/images/android-icon-monochrome.png`
- Icono principal:
  - `assets/images/icon.png`
- Splash:
  - `assets/images/splash-icon.png`

## Especificacion de assets requerida
Preparar un kit de marca en `assets/brand` con estos tamanos:

1. `icon-1024.png`
- Tamano: `1024x1024`
- Fondo solido (sin transparencia)
- Uso: icono principal app stores / Expo `icon`

2. `adaptive-foreground-432.png`
- Tamano: `432x432`
- Fondo transparente
- Uso: `android.adaptiveIcon.foregroundImage`

3. `adaptive-monochrome-432.png`
- Tamano: `432x432`
- Monocromo real (alto contraste)
- Uso: `android.adaptiveIcon.monochromeImage`

4. `splash-1024.png`
- Tamano: `1024x1024`
- Contenido centrado con margenes seguros
- Uso: plugin `expo-splash-screen.image`

## Mapeo recomendado en app.config.ts
Cuando el kit final este listo, actualizar:

- `icon: "./assets/brand/icon-1024.png"`
- `android.adaptiveIcon.foregroundImage: "./assets/brand/adaptive-foreground-432.png"`
- `android.adaptiveIcon.monochromeImage: "./assets/brand/adaptive-monochrome-432.png"`
- `plugins[expo-splash-screen].image: "./assets/brand/splash-1024.png"`

## Comandos build (APK preview)
```bash
npm run typecheck
npx expo config --type public
eas build --platform android --profile preview
```

## Checklist QA visual en dispositivo
1. Nombre mostrado bajo icono: `SaludDeUna`.
2. Icono launcher nitido en fondos claros/obscuros.
3. Adaptive icon sin recortes en mascaras OEM (circular/squircle).
4. Splash sin pixelado ni desalineacion del imagotipo.
5. Notificaciones usan icono correcto y color de marca.
6. Abrir/cerrar app no muestra assets legacy ni placeholders de Expo.
7. Pantallas principales mantienen consistencia visual (Home, Historial, Chat, Notificaciones, Perfil).

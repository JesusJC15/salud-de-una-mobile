# Salud De Una Mobile

Aplicacion movil de Salud De Una orientada exclusivamente al flujo de pacientes. Este repositorio usa Expo Router sobre Expo SDK 54, React 19 y React Native 0.81.

## Objetivo del repositorio

- Construir la experiencia movil para pacientes.
- Mantener una base clara para crecimiento sin mezclar concerns de doctor o admin.
- Alinear arquitectura y contratos con el backend actual y con el frontend web cuando aplique.

## Alcance funcional

Este frontend movil cubre solo capacidades de paciente:

- autenticacion y sesion
- perfil de paciente
- notificaciones del paciente
- crecimiento futuro sobre features de paciente

Las experiencias de doctor y admin viven en otros frontends.

## Stack actual

- Expo SDK 54
- Expo Router con file-based routing
- React 19
- React Native 0.81
- TypeScript estricto
- New Architecture habilitada
- React Compiler habilitado

## Direccion arquitectonica

La estructura objetivo del repositorio es:

- `app/` para rutas, layouts y puntos de entrada de Expo Router
- `src/` para codigo de aplicacion reutilizable
- `docs/` para documentacion y playbooks locales
- `.github/workflows/` para automatizaciones de calidad y CI

La base compartida del proyecto vive en `src/`. Las carpetas legacy del template ya no forman parte de la arquitectura activa.

## Estructura principal

- `app/`: screens, layouts, grupos de rutas y navegacion
- `src/`: arquitectura principal para features, servicios, tipos y capas compartidas
- `assets/`: imagenes, iconos y recursos estaticos
- `docs/agent-skills/`: fuente de verdad para guias locales del repo
- `scripts/`: utilidades de mantenimiento del proyecto

## Convenciones del proyecto

- Usa `app/` solo para routing y composicion de pantallas.
- Evita barrel exports por defecto para no degradar tree shaking.
- Prefiere imports directos y limites claros entre capas.
- Mantiene nombres de modelos y contratos en ingles.
- Escribe documentacion en espanol.
- Haz cambios pequenos y revisables.

## Stack base del proyecto

Para alineacion con el frontend web y con el backend actual, la base recomendada es:

- Axios para networking
- TanStack Query para server state
- Zod para validacion y contratos
- React Hook Form para formularios

Estas librerias forman parte de la base tecnica actual del proyecto.

## Flujo de trabajo

1. Instala dependencias con `npm install`.
2. Crea tu archivo `.env` a partir de `.env.example`.
3. Ejecuta desarrollo con `npm run start` o la variante de plataforma.
4. Consulta `docs/agent-skills/` antes de cambios relevantes.
5. Mantiene la documentacion de carpeta actualizada cuando cambie su responsabilidad.

## Variables de entorno

- `EXPO_PUBLIC_API_URL`: URL base del backend incluyendo el prefijo `/v1`, por ejemplo `http://localhost:3000/v1`
- `EXPO_PUBLIC_APP_ENV`: `development`, `preview` o `production`

## Scripts disponibles

- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm run test`
- `npm run test:ci`
- `npm run reset-project`

## Calidad en CI

El workflow `/.github/workflows/ci.yml` ejecuta lint, pruebas con cobertura y analisis de SonarCloud.

Requiere:

- secret `SONAR_TOKEN`
- variable `SONAR_ORGANIZATION` si tu organizacion en SonarCloud no coincide con el owner de GitHub
- variable `SONAR_PROJECT_KEY` si el project key en SonarCloud no sigue el patron `owner_repo`

La cobertura para Sonar se publica desde `coverage/lcov.info`, generado por `npm run test:ci`.

## Relacion con el backend

El backend actual expone rutas relevantes para mobile de paciente sobre `/v1`:

- auth de paciente
- perfil de paciente
- notificaciones del paciente

La estructura objetivo de `src/` ya separa networking, contratos, estado y features para reflejar esos flujos.

## Skills del repositorio

Antes de proponer cambios importantes, consulta:

- `docs/agent-skills/react-native-best-practices/`
- `docs/agent-skills/github-actions/`
- `docs/agent-skills/upgrading-react-native/`

El protocolo general esta en `docs/agent-skills/CODING_ASSISTANT_INSTRUCTIONS.md`.

## Checklist para contributors

- Verifica si el cambio pertenece a `app/` o a `src/`.
- Documenta nuevas carpetas con su propio `README.md`.
- No mezcles logica de doctor o admin en este repo.
- Mantiene contratos y tipos compartidos consistentes con backend.
- Ejecuta al menos lint antes de cerrar el cambio.

## Do and don't

### Do

- Usa nombres explicitos por feature.
- Mueve logica reutilizable a `src/`.
- Conserva `app/` delgado y orientado a rutas.

### Don't

- No agregues helpers genericos sin ubicar bien su capa.
- No reintroduzcas carpetas legacy fuera de `src/` para codigo compartido.
- No dupliques contratos entre formularios, schemas y tipos.

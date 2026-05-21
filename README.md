# SaludDeUna Mobile — App Movil para Pacientes

Aplicacion movil del MVP de SaludDeUna orientada exclusivamente al flujo del paciente. Construida con Expo SDK 55, Expo Router, React 19 y React Native 0.83.6.

## Objetivo del repositorio

- Ofrecer la experiencia movil completa del paciente: desde el registro hasta el seguimiento post-consulta.
- Mantener una arquitectura limpia y escalable sin mezclar logica de doctor o administrador.
- Alinear contratos y enums con el backend en todo momento.

## Alcance funcional implementado

Este frontend movil cubre la totalidad del flujo del paciente en el MVP:

| Feature | Estado | Descripcion |
|---------|--------|-------------|
| Autenticacion | Completo | Login y registro de paciente via JWT legacy |
| Perfil del paciente | Completo | Ver y actualizar datos del perfil |
| Triage asistido por IA | Completo | Cuestionario guiado por especialidad, deteccion de red flags y clasificacion de prioridad |
| Consultas | Completo | Historial de consultas del paciente |
| Chat clinico | Completo | Chat en tiempo real con el medico via Socket.IO |
| Seguimiento post-consulta | Completo | Respuesta a followups de 72h y 7 dias; escalacion si los sintomas empeoran |
| Notificaciones | Completo | Notificaciones in-app del paciente |
| Auth0 PKCE | Parcial | Servicio implementado (`auth0-service.ts`); flujo principal usa JWT legacy (Auth0 PKCE pendiente de validar en dispositivo fisico) |
| Timeline del paciente | Parcial | Hook implementado (`usePatientTimeline`); pantalla dedicada pendiente |

Las experiencias de doctor y administrador viven en el repositorio `salud-de-una-web`.

## Stack tecnico

- Expo SDK 55 (`expo@55.0.23`)
- Expo Router con file-based routing (`expo-router@55.0.14`)
- React 19.2.5 + React Native 0.83.6
- TypeScript 5.9 estricto
- New Architecture habilitada
- React Compiler habilitado
- Axios para networking
- TanStack Query 5 para server state
- Zod 4 para validacion y contratos
- React Hook Form para formularios
- Socket.IO Client 4 para chat clinico
- Zustand para estado local y de sesion
- Expo Secure Store para almacenamiento seguro de tokens

## Requisitos

- Node.js 20+
- Expo CLI (`npm install -g expo-cli`) o uso via `npx expo`
- Backend disponible y configurado en `.env`

## Variables de entorno

Crea `.env` a partir de `.env.example`:

```bash
cp .env.example .env    # bash
# PowerShell:
Copy-Item .env.example .env
```

Variables disponibles:

| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | URL base del backend **incluyendo** el prefijo `/v1` | `http://localhost:3000/v1` |
| `EXPO_PUBLIC_APP_ENV` | Entorno de la app | `development`, `preview`, `production` |

> En produccion, `EXPO_PUBLIC_API_URL` debe apuntar al dominio real del backend, por ejemplo `https://api.saluddeuna.com/v1`.

## Inicio rapido

```bash
npm install
cp .env.example .env    # completar con URL del backend
npm run start           # Expo DevTools en http://localhost:8081
```

Para plataformas especificas:

```bash
npm run android   # emulador o dispositivo Android
npm run ios       # simulador iOS (solo macOS)
npm run web       # version web de Expo
```

## Estructura principal

```text
app/
  (auth)/       # Pantallas de autenticacion (login, registro)
  (tabs)/       # Navegacion principal del paciente (home, perfil, etc.)
  _layout.tsx   # Layout raiz con providers

src/
  features/
    patient-auth/         # Autenticacion y sesion del paciente
    patient-triage/       # Triage guiado por especialidad
    patient-consultations/ # Historial de consultas
    patient-chat/         # Chat clinico en tiempo real
    patient-followup/     # Seguimiento post-consulta
    patient-notifications/ # Notificaciones in-app
    patient-profile/      # Perfil y datos del paciente
    patient-timeline/     # Timeline evolutivo (hook disponible)
  services/
    api/          # Cliente HTTP (Axios) con interceptores de auth
    auth/         # Servicio JWT legacy y auth0-service.ts
  schemas/        # Esquemas Zod por dominio (contratos con el backend)
  store/          # Estado global Zustand (sesion, preferencias)
  hooks/          # Custom hooks reutilizables
  components/     # Componentes UI compartidos
  types/          # Tipos TypeScript compartidos
  lib/            # Utilidades base

assets/           # Iconos, splash screen, imagenes estaticas
docs/             # Documentacion y playbooks del repositorio
```

## Flujo del paciente (MVP)

```
1. Registro / Login
      ↓
2. Seleccion de especialidad → Triage guiado
   (preguntas estructuradas por especialidad)
      ↓
3. Analisis IA (Gemini) — red flags + prioridad
      ↓
4. Checkout (billing simulado)
      ↓
5. Cola de espera → Doctor asigna la consulta
      ↓
6. Chat clinico en tiempo real (Socket.IO)
      ↓
7. Cierre de consulta → Seguimiento automatico
   (followup a las 72h y a los 7 dias)
      ↓
8. Respuesta de followup → escalacion si empeora
```

## Autenticacion

- **Flujo actual:** JWT legacy (access + refresh token) via `POST /v1/auth/patient/login`.
- **Auth0 PKCE:** Servicio implementado en `src/services/auth/auth0-service.ts`; pendiente de conectar al flujo principal de login y validar en dispositivo fisico.
- Tokens almacenados de forma segura en Expo Secure Store.
- Refresh automatico cuando el access token expira.

## Scripts disponibles

| Script | Descripcion |
|--------|-------------|
| `npm run start` | Inicia el servidor de desarrollo Expo |
| `npm run android` | Inicia en emulador/dispositivo Android |
| `npm run ios` | Inicia en simulador iOS |
| `npm run web` | Inicia version web con Expo |
| `npm run typecheck` | Verificacion TypeScript sin emitir archivos |
| `npm run lint` | ESLint con configuracion Expo |
| `npm run test` | Jest unit tests |
| `npm run test:cov` | Jest con reporte de cobertura en `coverage/lcov.info` |
| `npm run test:watch` | Jest en modo watch |

## CI (GitHub Actions)

El workflow `.github/workflows/mobile-ci.yml` ejecuta en cada push o PR sobre `salud-de-una-mobile/`:

```
npm ci → typecheck → lint → npm test --ci --runInBand
```

No requiere secrets ni servicios externos. EAS Build para generacion de APK se configura independientemente via `eas.json` (ver limitaciones conocidas).

## Relacion con el backend

Rutas del backend consumidas por esta app (base: `/v1`):

| Modulo | Endpoint | Descripcion |
|--------|----------|-------------|
| Auth | `POST /auth/patient/login` | Login con email y password |
| Auth | `POST /auth/patient/register` | Registro de nuevo paciente |
| Auth | `POST /auth/refresh` | Renovar access token |
| Auth | `GET /auth/me` | Perfil del usuario autenticado |
| Paciente | `GET /patients/me` | Datos del perfil |
| Paciente | `PUT /patients/me` | Actualizar perfil |
| Triage | `POST /triage/sessions` | Crear sesion de triage |
| Triage | `POST /triage/sessions/:id/answers` | Enviar respuestas |
| Triage | `POST /triage/sessions/:id/analyze` | Analisis IA |
| Billing | `GET /billing/prices` | Precios por especialidad |
| Billing | `POST /billing/checkout` | Iniciar pago simulado |
| Billing | `POST /billing/checkout/:id/confirm` | Confirmar pago |
| Consultas | `GET /consultations/me` | Historial del paciente |
| Followups | `GET /followups/:id` | Obtener followup programado |
| Followups | `POST /followups/:id/submit` | Responder followup |
| Notificaciones | `GET /notifications/me` | Notificaciones del paciente |

El chat usa Socket.IO conectando al origen del backend (sin el sufijo `/v1`).

## Limitaciones conocidas

| Limitacion | Impacto | Estado |
|------------|---------|--------|
| Auth0 PKCE no validado en dispositivo fisico | Login social (Google) no disponible | Pendiente Sprint 1 |
| EAS Build no configurado (`eas.json` no existe) | No se pueden generar APKs firmadas de produccion | Pendiente Sprint 1 |
| Pantalla de timeline no implementada | Hook existe, pero no hay pantalla dedicada de historial evolutivo | Pendiente Sprint 2 |

## Conveniones del proyecto

- `app/` solo para routing y composicion de pantallas.
- `src/` para toda la logica reutilizable de la aplicacion.
- Sin barrel exports (`index.ts`) para preservar tree-shaking.
- Imports directos a archivos.
- Nombres de modelos y contratos en ingles; documentacion en espanol.
- Cambios pequenos y revisables.

## Checklist para contributors

- Verifica si el cambio pertenece a `app/` (routing) o a `src/` (logica).
- Documenta nuevas carpetas con su propio `README.md`.
- No mezcles logica de doctor o admin en este repo.
- Mantiene contratos y tipos consistentes con el backend.
- Ejecuta `npm run lint` y `npm run typecheck` antes de cerrar el cambio.
- Consulta `docs/agent-skills/` antes de cambios relevantes de arquitectura.

## Troubleshooting

### La app no conecta al backend

- Verificar que `EXPO_PUBLIC_API_URL` en `.env` apunta al backend correcto **incluyendo `/v1`**.
- Si usas emulador Android con backend en `localhost`, usar `http://10.0.2.2:3000/v1`.
- Si usas dispositivo fisico, el backend debe ser accesible por red (usar IP local o tunel ngrok).

### Error de autenticacion al arrancar

- El token puede haber expirado. Verificar que el servicio de refresh esta configurado correctamente.
- Si el backend no esta corriendo, el login fallara con error de red.

### Metro bundler falla al iniciar

- Ejecutar `npm run reset-project` para limpiar la cache de Expo.
- Verificar que las dependencias estan instaladas con `npm install`.

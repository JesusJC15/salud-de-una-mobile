# src/services/auth

Servicios de autenticacion y sesion para paciente.

## Proposito

- encapsular login, registro, refresh y logout
- abstraer persistencia segura de tokens
- ofrecer una interfaz estable al resto de la app

## Alcance inicial

- registro de paciente
- login de paciente
- refresh token
- logout
- lectura de sesion actual

## Archivos esperados

- `auth-service.ts`
- `token-storage.ts`
- `session-mapper.ts`

## Checklist para contributors

- No mezcles aqui formularios o validacion visual.
- Si cambia el contrato backend, sincroniza `src/types` y `src/schemas`.

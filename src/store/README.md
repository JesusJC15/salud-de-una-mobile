# src/store

Estado global del proyecto.

## Proposito

- manejar sesion y estado compartido de aplicacion
- reducir prop drilling en concerns globales

## Estado compartido actual

- estado de autenticacion
- estado base de sesion del paciente
- flags globales ligeros

## Reglas

- No metas aqui server state que deba vivir en TanStack Query.
- Mantiene el store pequeno y orientado a estado de cliente.

## Checklist para contributors

- Distingue entre client state y server state.
- Evita stores monoliticos.

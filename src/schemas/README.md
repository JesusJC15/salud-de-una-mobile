# src/schemas

Contratos de validacion y parsing, con orientacion a Zod.

## Proposito

- validar payloads de backend y formularios
- definir contratos reutilizables y seguros

## Schemas compartidos

- auth schemas
- patient profile schemas
- notification schemas

## Reglas

- Usa schemas como fuente de validacion, no como sustituto de tipos semanticos.
- Mantiene nombres alineados con backend.

## Checklist para contributors

- Si cambia un endpoint, revisa este directorio.
- No mezcles mensajes de UI con definicion base del schema.

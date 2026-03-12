# src/forms

Integracion de formularios y adaptadores de UX, con orientacion a React Hook Form.

## Proposito

- encapsular defaults, adapters y helpers de formulario
- mantener separadas la validacion y la presentacion

## Formularios del dominio

- formularios de registro y login de paciente
- formularios de edicion de perfil

## Reglas

- La validacion base vive en `src/schemas`.
- Los componentes visuales viven en `src/ui` o `src/components`.

## Checklist para contributors

- Evita repetir reglas de validacion dentro de cada screen.
- Mantiene formularios alineados con contratos de backend.

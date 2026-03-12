# src/types

Tipos TypeScript compartidos por varias capas.

## Proposito

- centralizar contratos estaticos
- evitar duplicacion de formas de datos

## Tipos compartidos actuales

- tipos de sesion
- tipos de paciente
- tipos de notificacion
- enums y unions compartidas

## Reglas

- Los nombres de modelos y campos deben ir en ingles.
- Si un tipo nace de validacion, mantenlo alineado con `src/schemas`.

## Checklist para contributors

- No uses esta carpeta para constantes o mappers.
- Revisa si el tipo es local a una feature antes de subirlo aqui.

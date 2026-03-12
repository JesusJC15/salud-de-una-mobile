# src/lib

Utilidades pequenas y enfocadas compartidas entre capas.

## Que va aqui

- helpers puros
- formatters
- adapters pequenos sin dependencia de UI

## Que no va aqui

- servicios HTTP
- reglas de negocio grandes
- componentes visuales

## Checklist para contributors

- Si la utilidad crece demasiado, crea una capa mas especifica.
- Evita `utils` genericos sin criterio.

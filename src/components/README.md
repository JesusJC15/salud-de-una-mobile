# src/components

Componentes compartidos de composicion que no pertenecen a una sola feature.

## Que va aqui

- widgets compartidos entre varias features
- componentes de layout reutilizable
- piezas de composicion sobre `src/ui`

## Que no va aqui

- primitives puras
- screens de Expo Router
- componentes exclusivos de una sola feature

## Checklist para contributors

- Si un componente es demasiado basico, va a `src/ui`.
- Si pertenece a una sola feature, va a `src/features`.

## Do and don't

### Do

- Usa esta capa para composicion transversal.

### Don't

- No la uses como reemplazo de `features/`.

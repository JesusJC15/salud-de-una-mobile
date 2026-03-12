# src/ui

Primitives del design system y componentes base agnosticos al dominio.

## Que va aqui

- buttons, inputs, text, surfaces
- tokens o wrappers visuales muy reutilizables
- adaptaciones visuales por plataforma cuando haga falta

## Que no va aqui

- auth, profile o notifications
- acceso a datos
- reglas de negocio

## Checklist para contributors

- Mantiene API pequena y reutilizable.
- Prefiere composicion sobre variantes innecesarias.

## Do and don't

### Do

- Usa esta capa como base visual del producto.

### Don't

- No filtres aqui decisiones de negocio.

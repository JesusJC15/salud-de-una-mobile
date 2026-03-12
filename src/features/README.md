# src/features

Esta carpeta contiene el codigo de dominio organizado por feature.

## Proposito

- encapsular logica de producto por area funcional
- mantener juntas vistas, hooks, queries y adapters especificos de una feature

## Features actuales y previstas

- `patient-home`
- `patient-auth`
- `patient-profile`
- `patient-notifications`

## Que va aqui

- componentes de feature
- hooks de feature
- adaptadores o mappers de feature
- queries o acciones especificas de feature

## Que no va aqui

- primitives globales de UI
- cliente HTTP base
- config transversal del proyecto

## Checklist para contributors

- Usa nombres explicitos por feature.
- Si algo se reutiliza entre varias features, evalualo en `src/components`, `src/hooks` o `src/lib`.

## Do and don't

### Do

- Agrupa el dominio por feature sin mezclar pacientes con otros actores.

### Don't

- No conviertas `features/` en una capa tecnica mas.

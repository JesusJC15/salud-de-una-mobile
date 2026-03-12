# src/hooks

Hooks compartidos de aplicacion que no pertenecen a una sola feature.

## Que va aqui

- hooks de plataforma o layout compartidos
- hooks de integracion entre capas
- helpers de composicion para UI compartida

## Que no va aqui

- queries especificas de una feature
- hooks de auth exclusivos si viven mejor en `src/features/patient-auth`

## Checklist para contributors

- Mantiene nombre `use-*`.
- Si el hook conoce demasiado una feature, muevelo a `src/features`.

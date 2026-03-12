# scripts

Carpeta para scripts de mantenimiento y automatizacion local del proyecto.

## Que va aqui

- scripts de bootstrap o reseteo
- utilidades repetibles para desarrolladores

## Que no va aqui

- scripts de CI que deban vivir en `.github/`
- logica de app en runtime

## Reglas y convenciones

- Los scripts deben ser seguros, explicitos y revisables.
- Documenta side effects relevantes.

## Ejemplos de archivos esperados

- `reset-project.js`
- `sync-contracts.js`
- `check-env.js`

## Checklist para contributors

- Explica que hace el script antes de agregarlo.
- Evita scripts destructivos sin confirmacion clara.

## Do and don't

### Do

- Usa scripts para tareas repetitivas y reproducibles.

### Don't

- No escondas pasos criticos del proyecto en scripts sin documentacion.

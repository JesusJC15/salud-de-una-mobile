# app/(tabs)

Este grupo contiene la navegacion basada en tabs.

## Proposito

- declarar tabs visibles para el paciente
- centralizar layout y opciones de navegacion por pestaña

## Que va aqui

- `_layout.tsx` del grupo
- pantallas accesibles desde tabs

## Que no va aqui

- logica de autenticacion
- acceso directo a red
- componentes reutilizables de dominio

## Ejemplos de archivos esperados

- `home.tsx`
- `profile.tsx`
- `notifications.tsx`

## Checklist para contributors

- Revisa si una pantalla realmente debe vivir en tabs.
- Mantiene labels, iconos y rutas coherentes con el flujo paciente.

## Do and don't

### Do

- Agrupa solo rutas hermanas de navegacion inferior.

### Don't

- No uses este grupo como carpeta generica para cualquier screen.

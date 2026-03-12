# app

Esta carpeta contiene el arbol de rutas de Expo Router.

## Proposito

- declarar rutas y grupos de navegacion
- montar layouts
- conectar pantallas con features y capas de `src/`

## Que va aqui

- `_layout.tsx`
- screens y modals
- grupos de rutas como `(tabs)/`

## Que no va aqui

- clientes HTTP
- store global
- tipos compartidos
- logica de dominio compleja

## Reglas y convenciones

- Cada archivo representa una ruta o layout de Expo Router.
- La logica de negocio debe vivir fuera de `app/`.
- Las screens pueden componer hooks, queries y componentes desde `src/`.

## Ejemplos de archivos esperados

- `login.tsx`
- `profile/index.tsx`
- `notifications.tsx`
- `(patient)/_layout.tsx`

## Checklist para contributors

- Verifica si el cambio es de routing o de dominio.
- Mantiene los layouts pequenos.
- Si una screen crece demasiado, extrae composicion a `src/features`.

## Do and don't

### Do

- Usa `app/` como capa de entrada y composicion.

### Don't

- No pongas servicios, schemas o estado global aqui.

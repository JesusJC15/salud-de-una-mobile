# src/services

Servicios de integracion externa y piezas de infraestructura de aplicacion.

## Proposito

- centralizar networking
- encapsular auth y detalles de transporte
- evitar acceso directo a red desde pantallas o componentes

## Subcapas esperadas

- `api/`: cliente base, interceptores y configuracion HTTP
- `auth/`: manejo de tokens, sesion y llamadas relacionadas a auth

## Checklist para contributors

- Si una pieza conoce headers, tokens o base URLs, probablemente va aqui.
- No metas logica visual ni de presentacion.

## Do and don't

### Do

- Usa esta capa para integraciones y transporte.

### Don't

- No mezcles reglas de UI con infraestructura.

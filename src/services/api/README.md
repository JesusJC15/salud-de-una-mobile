# src/services/api

Cliente HTTP base del proyecto.

## Proposito

- encapsular Axios y su configuracion
- manejar base URL, headers, timeouts e interceptores
- preparar trazabilidad y manejo consistente de errores

## Integracion esperada con backend

- prefijo base `/v1`
- manejo de auth bearer
- soporte para `correlation_id`
- normalizacion de errores HTTP

## Archivos esperados

- `client.ts`
- `interceptors.ts`
- `api-error.ts`
- `request-context.ts`

## Checklist para contributors

- No llames `axios.create` en cada feature.
- Mantiene aqui las decisiones de transporte.

## Do and don't

### Do

- Centraliza el cliente HTTP en esta capa.

### Don't

- No dupliques configuracion de red en otras carpetas.

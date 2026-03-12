# src

`src/` es la arquitectura principal del codigo de aplicacion.

## Proposito

- sacar logica compartida de `app/`
- separar capas con responsabilidades claras
- preparar crecimiento del frontend de paciente sin desordenar la base de codigo

## Regla principal

`app/` resuelve rutas. `src/` resuelve producto.

## Capas esperadas

- `providers/`: composicion de providers globales y bootstrap de app
- `features/`: dominio y casos de uso de paciente
- `services/`: networking, auth e integraciones
- `store/`: estado global y sesion
- `hooks/`: hooks compartidos no atados a una sola feature
- `components/`: componentes compartidos de composicion
- `ui/`: primitives y design system
- `types/`: tipos compartidos
- `schemas/`: contratos Zod y validaciones
- `forms/`: integracion de formularios y mapping de UX
- `config/`: configuracion de runtime
- `lib/`: utilidades pequenas y enfocadas
- `constants/`: constantes compartidas de aplicacion
- `tests/`: utilidades y suites transversales
- `mocks/`: mocks de red, fixtures y datos de prueba

## Fuente de verdad compartida

- El codigo compartido de UI, tema y hooks vive en `src/`.
- No se deben recrear carpetas legacy como `components/`, `hooks/` o `constants/` en raiz.

## Reglas y convenciones

- Evita imports entre capas sin una razon clara.
- No uses `src/` como un contenedor generico.
- Prefiere nombres orientados al dominio paciente.
- Mantiene contratos y modelos en ingles.

## Checklist para contributors

- Ubica cada nuevo archivo en la capa correcta.
- Si dudas entre varias carpetas, aclara el limite en su README.
- No dupliques responsabilidad entre `types/`, `schemas/` y `forms/`.

## Do and don't

### Do

- Usa `src/` para todo lo reutilizable o de dominio.

### Don't

- No pongas pantallas de Expo Router aqui.

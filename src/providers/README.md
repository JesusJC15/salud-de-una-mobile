# src/providers

Providers globales y bootstrap transversal de la aplicacion.

## Que va aqui

- composicion de contextos globales
- bootstrap inicial de app
- integracion de providers como query client o sesion

## Que no va aqui

- logica de negocio especifica de una feature
- componentes visuales de pantalla

## Checklist para contributors

- Mantiene esta capa delgada y orientada a composicion.
- Si un provider solo sirve para una feature, no sube aqui.

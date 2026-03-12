# app/(auth)

Grupo de rutas para autenticacion del paciente.

## Que va aqui

- pantallas de login y registro
- layouts de autenticacion

## Que no va aqui

- logica de auth reutilizable
- servicios HTTP o store de sesion

## Checklist para contributors

- Mantiene las rutas de auth pequeñas y orientadas a composicion.
- Toda logica compartida debe vivir en `src/features/patient-auth` o capas inferiores.

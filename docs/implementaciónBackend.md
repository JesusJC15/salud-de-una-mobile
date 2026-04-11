Implementación completada para el problema de triage móvil, manteniendo arquitectura NestJS del repo y compatibilidad del flujo actual.

Qué ya existía en backend

Enum de especialidad correcto con GENERAL_MEDICINE y ODONTOLOGY en specialty.enum.ts.
Flujo base de triage:
Crear sesión
Guardar respuestas
Analizar sesión
Validación global con ValidationPipe y filtro global de errores con correlation_id.
Restricción por rol PATIENT en rutas de triage.

Qué faltaba y quedó implementado

409 estructurado para reanudar:
En create session ahora retorna errorCode estable, specialty, existingSessionId, status y message.
Implementado en triage.service.ts y propagado por el filtro global en http-exception.filter.ts.

Endpoint de sesiones activas:
Nuevo GET /v1/triage/sessions/active con filtro opcional specialty.
Retorna id, specialty, status, currentStep, totalSteps, currentQuestionId, isComplete, createdAt, updatedAt.
Implementado en triage.controller.ts y triage.service.ts.

Endpoint de cancelación:
Nuevo PATCH /v1/triage/sessions/:sessionId/cancel.
Valida ownership y estado permitido (solo IN_PROGRESS), y transición a CANCELED.
Implementado en triage.controller.ts y triage.service.ts.

Integridad y concurrencia:
Índice único parcial por patientId + specialty para sesiones IN_PROGRESS.
Manejo race condition por duplicate key 11000 en createSession.
Implementado en triage-session.schema.ts.

Estados claros:
Se amplió a IN_PROGRESS, COMPLETED, CANCELED, EXPIRED, FAILED.

Seguridad/validación:
DTO query para specialty opcional en activa: get-active-triage-sessions.dto.ts.
Se mantuvo validación estricta de specialty.
Se conservó compatibilidad de respuestas de error global con correlation_id.

Documentación Swagger/OpenAPI:
Habilitado Swagger en /v1/docs en main.ts.
Documentadas respuestas 200/400/401/403/404/409 (y 422 donde aplica) en triage.controller.ts.

Documentación funcional de contratos:
Agregada guía de contratos reales en README.md.

Rutas finales

POST /v1/triage/sessions
GET /v1/triage/sessions/active?specialty=GENERAL_MEDICINE
POST /v1/triage/sessions/:sessionId/answers
POST /v1/triage/sessions/:sessionId/analyze
PATCH /v1/triage/sessions/:sessionId/cancel

Ejemplos reales request/response

Crear sesión  
Request
{
  "specialty": "GENERAL_MEDICINE"
}

Response 201
{
  "sessionId": "680f0493bba79f530f7486f1",
  "specialty": "GENERAL_MEDICINE",
  "status": "IN_PROGRESS",
  "questions": [
    {
      "questionId": "MG-Q1",
      "questionText": "Cual es tu sintoma principal?"
    }
  ],
  "totalQuestions": 5,
  "answeredCount": 0,
  "remainingQuestions": 5,
  "progressPercent": 0,
  "nextQuestionId": "MG-Q1",
  "isComplete": false
}

Crear sesión con conflicto (reanudación)  
Response 409
{
  "statusCode": 409,
  "errorCode": "TRIAGE_SESSION_IN_PROGRESS",
  "specialty": "GENERAL_MEDICINE",
  "existingSessionId": "680f0493bba79f530f7486f1",
  "status": "IN_PROGRESS",
  "message": "Ya existe una sesion de triage en progreso para esta especialidad",
  "path": "/v1/triage/sessions",
  "timestamp": "2026-04-07T18:20:00.000Z",
  "correlation_id": "e65fd6f0-966d-4d67-9d0b-f0668f752b17"
}

Consultar activa  
GET /v1/triage/sessions/active?specialty=GENERAL_MEDICINE

Response 200
{
  "items": [
    {
      "id": "680f0493bba79f530f7486f1",
      "specialty": "GENERAL_MEDICINE",
      "status": "IN_PROGRESS",
      "currentStep": 2,
      "totalSteps": 5,
      "currentQuestionId": "MG-Q2",
      "isComplete": false,
      "createdAt": "2026-04-07T18:18:00.000Z",
      "updatedAt": "2026-04-07T18:19:10.000Z"
    }
  ],
  "total": 1
}

Cancelar activa  
PATCH /v1/triage/sessions/680f0493bba79f530f7486f1/cancel

Response 200
{
  "sessionId": "680f0493bba79f530f7486f1",
  "specialty": "GENERAL_MEDICINE",
  "status": "CANCELED",
  "canceledAt": "2026-04-07T18:20:00.000Z",
  "message": "Sesion de triage cancelada correctamente"
}

Specialty inválido  
Request
{
  "specialty": "DENTISTRY"
}

Response 400
{
  "statusCode": 400,
  "message": [
    "specialty must be one of the following values: GENERAL_MEDICINE, ODONTOLOGY"
  ],
  "path": "/v1/triage/sessions",
  "timestamp": "2026-04-07T18:20:00.000Z",
  "correlation_id": "..."
}

Compatibilidad hacia atrás

Se conservaron rutas existentes y contratos principales de create, answers y analyze.
El 409 ahora agrega estructura útil para móvil sin romper manejo previo de error HTTP.
Se amplió validación de answerValue para aceptar string además de boolean/number/string[] en triage-answer-input.dto.ts, evitando romper clientes existentes.
Se añadieron endpoints nuevos sin modificar comportamiento de los anteriores.

Pruebas y validación

Unit tests actualizados y pasando:
triage.service.spec.ts
triage.controller.spec.ts
triage-session.schema.spec.ts
http-exception.filter.spec.ts

E2E de triage pasando:
triage-mg.e2e-spec.ts

Build OK con npm run build.

Snyk SAST:
Escaneo completo repo reportó issues preexistentes.
Escaneo focalizado en código modificado sin issues nuevas:
src/triage
src/common/filters
main.ts

Nota de arquitectura y trade-off

No se agregó endpoint “resume” dedicado porque ya se puede reanudar de forma determinística con existingSessionId + endpoints existentes de answers/analyze y con GET active para reconstruir estado. Trade-off: menos superficie API, pero frontend debe conservar y/o consultar existingSessionId.

Recomendación final para frontend móvil

Al recibir 409 con errorCode TRIAGE_SESSION_IN_PROGRESS, usar existingSessionId de inmediato para cargar pantalla de sesión activa (GET /v1/triage/sessions/active?specialty=...).

Mostrar pantalla “triage en progreso” usando currentStep, totalSteps, currentQuestionId e isComplete del endpoint activo.

Para cancelar desde UI, invocar PATCH /v1/triage/sessions/:sessionId/cancel y luego refrescar GET active para confirmar que ya no hay sesión IN_PROGRESS.
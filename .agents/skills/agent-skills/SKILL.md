---
name: agent-skills
description: Índice y resumen de las skills disponibles en este repositorio. Úsalo como punto de entrada para localizar y entender cada skill.
---

# Índice de Skills del repositorio

Este skill actúa como un índice y resumen de las skills ya presentes en `.agents/skills/`.
Cuando el asistente determine que se aplica este dominio, puede leer el cuerpo de este archivo para conocer rápidamente qué skill leer a continuación.

## Objetivo

Proveer una vista rápida y localizada de las skills disponibles, sus propósitos y la ruta a sus archivos `SKILL.md` para facilitar la carga progresiva de contexto.

## Skills disponibles (resumen)

- **frontend-design**: guías para implementar interfaces con alta calidad visual y componentes reutilizables.
  - Ruta: `.agents/skills/frontend-design/SKILL.md`
- **figma**: integración y extracción de assets/datos desde Figma para implementar diseños.
  - Ruta: `.agents/skills/figma/SKILL.md`
- **figma-implement-design**: traducción de nodos Figma a código de producción con alta fidelidad.
  - Ruta: `.agents/skills/figma-implement-design/SKILL.md`
- **github-actions**: patrones y plantillas para CI (iOS/Android), descarga de artefactos y flujos de trabajo.
  - Ruta: `.agents/skills/github-actions/SKILL.md`
- **react-native-best-practices**: recomendaciones de rendimiento, memoria y optimización para RN.
  - Ruta: `.agents/skills/react-native-best-practices/SKILL.md`
- **upgrading-react-native**: checklist y pasos para actualizar RN y Expo SDK.
  - Ruta: `.agents/skills/upgrading-react-native/SKILL.md`
- **react-native-brownfield-migration**: estrategia para migrar/integrar RN en apps nativas existentes.
  - Ruta: `.agents/skills/react-native-brownfield-migration/SKILL.md`
- **mcp-builder**: guía para crear MCP servers y herramientas relacionadas.
  - Ruta: `.agents/skills/mcp-builder/SKILL.md`
- **skill-creator**: guía para escribir nuevas skills correctamente (frontmatter, referencias, estructura).
  - Ruta: `.agents/skills/skill-creator/SKILL.md`

## Uso recomendado

- Si necesitas realizar una tarea relacionada con CI, performance, upgrades o diseño, primero abre la entrada correspondiente listada arriba.
- Este archivo está pensado para ser legible por humanos y por el agente; su frontmatter permite que el loader lo identifique como skill.

## Notas sobre archivos sueltos

Hay archivos de índice/documentación en `.agents/skills/` (por ejemplo `AGENT_SKILLS.md`, `README.md`). Estos son útiles como referencia humana pero no se cargan automáticamente como skills por el loader que busca carpetas con `SKILL.md`.

Si prefieres, puedo:

- Mover el contenido de `AGENT_SKILLS.md` dentro de este `SKILL.md` y eliminar el archivo suelto, o
- Mantener `AGENT_SKILLS.md` como índice adicional y dejar este skill solo como resumen.

Indica qué prefieres y lo aplico.

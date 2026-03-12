# docs/agent-skills/react-native-best-practices

Skill principal para decisiones de performance, bundling, profiling y arquitectura React Native.

## Que vas a encontrar aqui

- `SKILL.md` con mapa de problemas y referencias
- `agents/` para configuracion de apoyo
- `references/` con guias concretas por tema

## Cuando usar esta skill

- antes de cambios de arquitectura compartida
- al revisar rendimiento, bundle o re-renders
- al decidir patrones tecnicos de crecimiento en mobile

## Reglas

- Sigue el ciclo medir, optimizar, volver a medir.
- Evita patrones que rompan tree shaking o aumenten re-renders gratis.

## Checklist para contributors

- Consulta esta skill antes de introducir nuevas capas compartidas.
- Usa referencias especificas si el cambio toca listas, animaciones o bundle.

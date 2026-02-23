# Resumen: Email Generator Template App

**Fecha:** 22 de Febrero de 2026

## Arquitectura y Stack Tecnológico

La aplicación base para construir emails ha sido configurada utilizando una **Arquitectura Hexagonal** y basando la estructura de los componentes UI en **Atomic Design**.

- **Frontend / Core:** Next.js (App Router), React 19, Bun, TypeScript.
- **Estilos:** Tailwind CSS v4, Shadcn UI.
- **Estado Local / Drag & Drop:** Zustand + Immer (manejo del historial de deshacer/rehacer del editor), `dnd-kit`.
- **Operaciones Asíncronas & Tablas:** TanStack Query, TanStack Table.
- **Formularios & Validación:** TanStack Form, Zod.
- **Email Engine:** React Email (Compila el árbol de componentes del cliente a un HTML `string` validado y responsive).

## Estructura de Capas (Arquitectura Hexagonal)

- `src/domain`: Define los modelos (`User`, `Template`, `Theme`) e interfaces de Repositorios.
- `src/application`: Maneja la lógica de negocio y estado local (ej. `useAuth`, `useTemplates`, `useEditorStore` y el compilador `useExportBuilder`).
- `src/infrastructure`: Implementa los adaptadores, actualmente guardando todo con repositorios falsos que apuntan a `LocalStorage`, facilitando la transición a un backend (ej. NestJS) en el futuro.
- `src/components`: Organizado bajo la metodología Atomic Design (`atoms`, `molecules`, `organisms`, `features`, `templates`, etc).

## Funcionalidades Implementadas Hasta el Momento

1. **Landing Page y Mocking de Auth**
   - Página principal moderna con un componente `Navbar` persistente en el layout global.
   - Estado de autenticación simulado guardado en `LocalStorage`. Cualquier email genera o loguea un usuario (para administradores agregar "admin" al email).

2. **Dashboard de Plantillas**
   - Tabla de datos construida con TanStack Table iterando las plantillas de `LocalStorage` (usando TanStack Query).
   - Acciones desplegables para crear, editar o eliminar cada plantilla.

3. **Editor Drag and Drop (Core de la App)**
   - **Canvas & Renderizado:** Sistema recursivo `NodeRenderer` en base a un árbol de datos administrado por Zustand e Immer.
   - **Historial:** Controles para "Deshacer" (_Undo_) y "Rehacer" (_Redo_).
   - **Componentes DND Incorporados:** Text Block, Button, Image y Container/Wrapper.
   - **Properties Panel:** Panel a la derecha interactivo para modificar el contenido, propiedades (`href`, `src`) y variables base CSS del bloque DND actualmente seleccionado.

4. **React Email Compiler & Export**
   - Integrado en `src/application/useExportBuilder.tsx`.
   - Lee todo el árbol actual del usuario en la sesión y lo mapea hacia los nodos reales de `@react-email/components`.
   - Botón habilitado en el header del editor para exportar un archivo `.html` físico directamente.

5. **Inyector de Themes Custom de Shadcn**
   - Modal ubicado en el Editor de Plantillas que permite pegar el bloque completo `:root` / `.dark` de custom CSS variables (Shadcn Theme).
   - Este se guarda a nivel persistente con `LocalStorageThemeRepository` para ser inyectado automáticamente en el HTML renderizado final de la plantilla de Email.

---

### Notas para la siguiente sesión:

La aplicación debería funcionar nativamente con el servidor levantado (`bun run dev`). Lo que queda pendiente en futuras sesiones sería reemplazar el mock de base de datos de los Repositorios locales en `src/infrastructure` hacia un motor de base de datos real o consumiendo una API externa en NestJS, así como pulir o añadir más bloques modulares al core del `dnd-kit`.

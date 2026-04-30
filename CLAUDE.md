@AGENTS.md

# Project conventions

Frontend for the Agent Loop API. Wraps the generated SDK in [src/sdk/](src/sdk/) with chat-oriented UI (agent list, chat view with streaming SSE, activity log).

## Worktree directory

Use `.worktrees/` (project-local, gitignored) for git worktrees.

## Tech stack

- **Next.js 16** (App Router). See `node_modules/next/dist/docs/` — APIs differ from prior versions.
- **React 19**.
- **Tailwind v4** (CSS-first config in [src/app/globals.css](src/app/globals.css)).
- **Radix UI Primitives** for unstyled, accessible behaviour (dialog, dropdown, tabs, tooltip, etc.). Install per-primitive (`@radix-ui/react-*`) — never the meta package.
- **Generated SDK** in [src/sdk/](src/sdk/) — never edit by hand. Regenerate with `npm run generate:sdk` (set `OPENAPI_URL` if backend not on `localhost:8000`).

## Atomic design + collocation

Two top-level component buckets, distinguished by *what they know*:

```
src/
  ui/             atoms — generic, app-agnostic primitives
  components/     molecules / organisms / templates — domain-aware
```

- `ui/` knows nothing about agents, chat, or the SDK. Pure presentational wrappers around Radix + Tailwind. Reusable across any project.
- `components/` knows about the domain. Imports from `@/ui`, `@/sdk`, `@/lib`. Composes atoms into chat views, agent lists, message bubbles, etc.

Pages in [src/app/](src/app/) compose `components/` — they hold routing, data fetching, and wiring only.

### Folder shape (collocation)

Every component is a folder, even if it has one file. This lets it grow without renames.

```
components/Chat/
  index.ts                 public surface — re-exports only
  Chat.tsx                 the component
  components/              nested, private to Chat
    MessageList/
      index.ts
      MessageList.tsx
      components/
        Message.tsx
    Composer/
      index.ts
      Composer.tsx
  hooks/
    useChatStream.ts
  utils/
    parseSSE.ts
  types.ts
```

Rules:

1. **`index.ts` is the public API.** Only exports listed there are importable from outside the folder. Internal files are private — siblings must not deep-import past a folder's `index.ts`.
2. **Nested `components/` is for children owned by the parent.** If a child gets reused elsewhere, lift it up to the nearest shared ancestor (or to `ui/` if generic).
3. **Co-locate hooks, utils, types, tests next to the component that uses them.** Move them up only when a second consumer appears.
4. **One component per file.** File name matches the exported component (`MessageList.tsx` exports `MessageList`).
5. **No barrel files inside `ui/` or `components/` roots** — only per-folder `index.ts`. Importing from `@/ui` directly is fine; importing from `@/ui/index` is not a thing.

## `ui/` atoms — wrap Radix, don't re-export it

Every atom owns its API. Never expose Radix props directly; map only the props the app actually uses, with names that fit the app.

```tsx
// src/ui/Button/Button.tsx — good
type ButtonProps = {
  variant?: "primary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
  // ...plus the handful of native props we actually use
};
```

Reasons:
- App code stays decoupled from Radix — swap libraries without touching consumers.
- Variants are app-specific (`primary` means *our* primary), not library-specific.
- Prop names match how designers and PRs talk about the component.

When a consumer needs an unsupported prop, add it deliberately. Don't spread `...rest` straight onto Radix.

## Imports & aliases

Always import via aliases — never relative paths that climb (`../../`).

| Alias            | Target              | Use for                                     |
| ---------------- | ------------------- | ------------------------------------------- |
| `@/*`            | `src/*`             | catch-all                                   |
| `@/ui/*`         | `src/ui/*`          | atoms                                       |
| `@/components/*` | `src/components/*`  | domain components                           |
| `@/lib/*`        | `src/lib/*`         | cross-cutting helpers (api client, `cn()`)  |
| `@/sdk`          | `src/sdk`           | generated SDK (import from package root)    |

Configure in [tsconfig.json](tsconfig.json) `compilerOptions.paths`. Same-folder imports stay relative (`./Message`).

## File-naming

- Components & their folders: `PascalCase` (`MessageList/MessageList.tsx`).
- Hooks: `camelCase` starting with `use` (`useChatStream.ts`).
- Utils, types, constants: `camelCase` (`parseSSE.ts`, `types.ts`).
- Route files (Next.js): lowercase as the framework requires (`page.tsx`, `layout.tsx`).

## Interactive elements

Anything the user can click — buttons, links, custom rows, interactive cards — must show `cursor: pointer` on hover. Tailwind's preflight resets `<button>` to `cursor: default`, so this is not free.

- Atoms with built-in click semantics (`Button`, `IconButton`, `Card` when `interactive`, `DropdownItem`) bake `cursor-pointer` into their base classes — consumers don't need to repeat it.
- Bare `<button>` / `<a>` / `<div role="button">` written in domain components must include `cursor-pointer` in their `className`. Same for stretched-link `<Link>` overlays.
- The `disabled:cursor-not-allowed` rule still applies and beats `cursor-pointer` when the element is disabled.

## What goes where — quick test

Before placing a file, ask:

1. *Does it know about agents/chat/SDK?* → `components/`. Otherwise → `ui/`.
2. *Is it used by exactly one parent component?* → nest in that parent's `components/`. Otherwise → lift.
3. *Should outside code import it?* → add to that folder's `index.ts`. Otherwise leave it out.

## Don't

- Don't edit `src/sdk/` — regenerate.
- Don't import Radix directly from `components/` — go through `@/ui`.
- Don't deep-import past another folder's `index.ts`.
- Don't add `index.ts` re-exports for files that are only used internally.
- Don't spread arbitrary props onto Radix primitives in atoms — define an explicit prop surface.

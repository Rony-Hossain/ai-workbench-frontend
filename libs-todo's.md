Here is your Detailed Implementation To-Do List, organized logically to build the system layer by layer. This maps directly to the file structure you provided.

Phase 1: The Foundation (Shared Libs)
Goal: Build the atoms and layout engines first so features have UI to use.

libs/shared

[ ] UI Atoms:

[ ] ui/src/lib/atoms/button.tsx (Implement the 4 variants: primary, secondary, danger, ghost)

[ ] ui/src/lib/atoms/input.tsx (High-density, borderless)

[ ] ui/src/lib/atoms/badge.tsx (Status pills for Agents)

[ ] ui/src/lib/atoms/spinner.tsx (Loading state)

[ ] ui/src/lib/atoms/separator.tsx

[ ] ui/src/lib/atoms/tooltip.tsx

[ ] UI Molecules:

[ ] ui/src/lib/molecules/card.tsx (The glass container)

[ ] ui/src/lib/molecules/modal.tsx (Backdrop blur overlays)

[ ] ui/src/lib/molecules/scroll-area.tsx (Custom scrollbar logic)

[ ] ui/src/lib/molecules/toast.tsx (Notifications)

[ ] ui/src/lib/molecules/accordion.tsx (For sidebar lists)

[ ] Layouts:

[ ] layout/src/lib/cockpit-layout.tsx (The 4-pane grid system using react-resizable-panels)

[ ] layout/src/lib/resizable-panel.tsx (Wrapper component)

[ ] layout/src/lib/auth-layout.tsx (Centered terminal frame)

[ ] Infrastructure:

[ ] electron-bridge/src/lib/bridge-contract.ts (Define the IPC types)

[ ] state/src/lib/use-session.store.ts (Zustand store for user session/theme)

[ ] icons/src/lib/icons.ts (Export specific Lucide icons used in the app)

Phase 2: Domain & Data (The "Hidden" Layer)
Goal: Define what the app "knows" before building what it "shows".

libs/bounded-contexts (Created in previous step)

[ ] Ensure types.ts, agents.ts, permissions.ts, and graph.ts are fully populated.

libs/feature-workspace

[ ] types/workspace.types.ts (Define ProjectConfig DTO)

[ ] store/workspace.store.ts (Zustand store for activeProjectId)

[ ] data-access/workspace.service.ts (Mock file system calls for now)

[ ] data-access/workspace.queries.ts (React Query hooks for project lists)

libs/feature-auth

[ ] types/auth.types.ts (Define Credentials interface)

[ ] store/auth-ui.store.ts (Login form state)

[ ] data-access/auth.service.ts (Mock login function)

Phase 3: The Vertical Slices (Feature UI)
Goal: Port the high-fidelity UI components from your code dump into their specific features.

libs/feature-agents

[ ] ui/agent-avatar.tsx (Consistent circle/color logic)

[ ] ui/agent-roster-list.tsx (The sidebar list of agents)

[ ] ui/agent-builder-modal.tsx (The "Fabrication Unit" form)

[ ] store/agent-builder.store.ts (Form state management)

libs/feature-files

[ ] ui/file-icon.tsx (Logic to show TS vs JSON icons)

[ ] ui/file-tree-node.tsx (Single row component)

[ ] ui/file-tree.tsx (Recursive tree renderer)

[ ] store/file-ui.store.ts (Track expanded folders)

libs/feature-chat

[ ] ui/bubbles/user-bubble.tsx

[ ] ui/bubbles/agent-bubble.tsx

[ ] ui/message-list.tsx (Auto-scroll container)

[ ] ui/input-area.tsx (Textarea with attachment button)

[ ] ui/chat-pane.tsx (Main container wiring it all together)

[ ] store/chat-stream.store.ts (Optimistic message handling)

libs/feature-editor

[ ] ui/monaco-wrapper.tsx (Wrap @monaco-editor/react)

[ ] ui/editor-status-bar.tsx (Bottom bar info)

[ ] store/editor.store.ts (Manage open tabs list)

libs/feature-terminal

[ ] ui/terminal-view.tsx (Integrate xterm.js)

[ ] store/terminal.store.ts (Session management)

libs/feature-permissions

[ ] ui/permission-card.tsx (The "Allow/Deny" card for the chat)

[ ] store/permission.store.ts (Queue for pending requests)

Phase 4: The Orchestration (Cockpit)
Goal: Wire everything together into the main screen.

libs/feature-cockpit

[ ] ui/pane-containers/files-pane.tsx (Imports FileTree from feature-files)

[ ] ui/pane-containers/editor-pane.tsx (Imports MonacoWrapper from feature-editor)

[ ] ui/pane-containers/chat-pane.tsx (Imports ChatPane from feature-chat)

[ ] ui/navigation-rail.tsx (Left sidebar icons)

[ ] ui/cockpit-screen.tsx (Uses CockpitLayout to arrange the panes)

[ ] store/cockpit-layout.store.ts (Persist pane sizes)

Phase 5: The Entry Points (App Wiring)
Goal: Connect the routing and global styles.

apps/workbench-desktop

[ ] src/app/app.tsx (Set up the Router: Auth -> Lobby -> Cockpit)

[ ] src/main.tsx (Ensure global.css is imported)

[ ] tailwind.config.ts (Verify it scans libs/**)
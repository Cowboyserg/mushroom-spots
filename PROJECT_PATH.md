# Project Path — UX Roadmap and Near-Term Plan

Current application version: `0.7.44-hotfix.3 / Sprint 5.44.3 — Group Join WebKit Submit Hotfix`

This file is the shared project path document. Its purpose is to keep the product direction explicit: what has already been stabilized, what we are doing next, what the next few small sprints should cover, and what must remain out of scope until the right phase.

## Product direction

The `0.7.x` line is the user-friendly interface line.

The goal is to turn the mushroom spots PWA from a technically working prototype into a clear mobile-first field app. The app should feel understandable in the same broad category as MAPS.ME / 2GIS / Yandex Maps, but adapted to mushroom spots, weak internet, offline use, local map packages, and group/live-location workflows.

Core idea:

- map first;
- saved mushroom spots as real objects;
- clear screens instead of technical blocks;
- diagnostics available but not forced on normal users;
- offline and weak-network behavior preserved;
- no large architecture rewrites during UX cleanup.

## Current state

Already completed in the real project history:

- `0.7.0 / Sprint 5.0 — App Navigation Shell`
- `0.7.1 / Sprint 5.1 — Clean Map Home UX`
- `0.7.2 / Sprint 5.2 — Save Spot Flow UX`
- `0.7.3 / Sprint 5.3 — Map Point Readability Hotfix`
- `0.7.4 / Sprint 5.4 — Android Cache Reset Hotfix`
- `0.7.5 / Sprint 5.5 — CI Safety Checks`
- `0.7.6 / Sprint 5.6 — CI Source vs Package Rules Fix`
- `0.7.7 / Sprint 5.7 — Stabilize CI Checks`
- `0.7.8 / Sprint 5.8 — Spot Details Panel`
- `0.7.9 / Sprint 5.9 — Spots List UX`
- `0.7.9-hotfix.1 / Sprint 5.9.1 — Save Button Placement Hotfix`
- `0.7.9-hotfix.2 / Sprint 5.9.2 — Save Button Inside Form Hotfix`
- `0.7.9-hotfix.3 / Sprint 5.9.3 — Save GPS Copy Hotfix`
- `0.7.10 / Sprint 5.10 — E2E Smoke Tests`
- `0.7.11 / Sprint 5.11 — Map Object Interaction Model`
- `0.7.11-hotfix.1 / Sprint 5.11.1 — Selected Map Object State Hotfix`
- `0.7.11-hotfix.2 / Sprint 5.11.2 — Leaflet Lite Marker Icon Hotfix`
- `0.7.12 / Sprint 5.12 — Mobile E2E Matrix`
- `0.7.13 / Sprint 5.13 — Group Screen UX`
- `0.7.13-hotfix.1 / Sprint 5.13.1 — Leave Group Persistence Hotfix`
- `0.7.14 / Sprint 5.14 — Offline Maps UX`
- `0.7.14-hotfix.3 / Sprint 5.14.3 — Map Card Reveal Hotfix`
- `0.7.15 / Sprint 5.15 — Settings and Diagnostics UX`
- `0.7.16 / Sprint 5.16 — State Explanations and User Terms`
- `0.7.16-hotfix.1 / Sprint 5.16.1 — Offline Map Module Copy Hotfix`
- `0.7.16-hotfix.2 / Sprint 5.16.2 — Map Copy Cleanup Hotfix`
- `0.7.16-hotfix.3 / Sprint 5.16.3 — DB Config Copy Hotfix`
- `0.7.17 / Sprint 5.17 — Visual Consistency Pass`
- `0.7.17-hotfix.1 / Sprint 5.17.1 — Spot Card Visual Hotfix`
- `0.7.17-hotfix.2 / Sprint 5.17.2 — Map Quick Actions and Navigation Icons Hotfix`
- `0.7.17-hotfix.3 / Sprint 5.17.3 — Quick Panel E2E Name Hotfix`
- `0.7.17-hotfix.4 / Sprint 5.17.4 — Remove Redundant Map Quick Actions Panel`
- `0.7.18 / Sprint 5.18 — UX Reference and Screen Contracts`
- `0.7.19 / Sprint 5.19 — Selected Place Context Sheet`
- `0.7.20 / Sprint 5.20 — Selected Place Context Sheet E2E Guards`
- `0.7.20-hotfix.2 / Sprint 5.20.2 — Test-Only E2E Guard Hotfix`
- `0.7.21 / Sprint 5.21 — In-Map Selected Place Sheet`
- `0.7.22 / Sprint 5.22 — Expanded Map Workspace`
- `0.7.24 / Sprint 5.24 — Spot CRUD and Sheet Close Control`
- `0.7.24-hotfix.1 / Sprint 5.24.1 — Map Sheet Close and Spots CRUD Placement Hotfix`
- `0.7.24-hotfix.2 / Sprint 5.24.2 — Spots Details Button State Hotfix`
- `0.7.25 / Sprint 5.25 — Spots Collections Filter`
- `0.7.25-hotfix.1 / Sprint 5.25.1 — Spot Collection Filter Change Handler Hotfix`
- `0.7.25-hotfix.2 / Sprint 5.25.2 — E2E Version Guard Hotfix`
- `0.7.26 / Sprint 5.26 — Custom Collections CRUD MVP`
- `0.7.26-hotfix.1 / Sprint 5.26.1 — Unique Collection Names Guard`
- `0.7.27 / Sprint 5.27 — Folder-First Spots UX`
- `0.7.27-hotfix.1 / Sprint 5.27.1 — WebKit Spots IndexedDB Hotfix`
- `0.7.27-hotfix.2 / Sprint 5.27.2 — Active Collection Runtime Hotfix`
- `0.7.27-hotfix.3 / Sprint 5.27.3 — Spots Android Back Hotfix`

Important correction from the older roadmap: the original UX roadmap used earlier numbering for several UX items, but the real project history spent `5.3–5.7` on readability, Android cache, and CI stabilization. Therefore the roadmap intent remains valid, but sprint numbers must follow the actual project line from `0.7.8` onward.

## Current focus

Current focus after `0.7.31`:

- Offline PMTiles preview now has interaction parity for the essential field workflow: `Ко мне`, tap-to-pick, save selected point, and route overlay rendering;
- Offline map interactions reuse the shared `pickedMapPoint`, `spots`, `currentPosition`, and `tracks` models instead of creating separate offline-only objects;
- Offline coverage copy is explicit: GPS coordinates can be saved even when the current point is outside the selected PMTiles package bounds, but the map background may be empty there;
- `Настройки` now exports and imports a validated local JSON backup for saved spots, saved routes, and custom folders;
- JSON import is validation-first: malformed JSON, unsupported schema versions, unsafe spot structures, and checksum/count mismatches must not write or erase existing data;
- iPhone-oriented backup testing avoids relying only on the browser download event and uses file-input import checks across the mobile profile matrix;
- the `Точки` screen is now folder-first: opening the section shows folders only, then a selected folder shows the saved marks inside it;
- folder-level actions are exposed from a folder header `⋯` menu, while mark-level actions are exposed from each mark card `⋯` menu;
- spot collections are now locally manageable folders: users can create, rename, and delete custom folders while system folders stay protected;
- custom folder names are unique after trimming repeated spaces and ignoring case, because the current spot model uses the folder name string as the identity key;
- the save-flow button placement and GPS microcopy are fixed;
- the project now has Playwright smoke checks across desktop Chromium, Android-like Chromium, and iPhone-like WebKit profiles;
- map objects now have explicit selected-state UI for saved spots, picked points, chat preview points, and live friends;
- the `Группа` screen is now split into human sections: `Моя группа`, `Участники`, `Live-локации`, and `Чат`;
- chat sending now has an in-flight guard: while one message is being written, duplicate taps are blocked and the composer is cleared after a successful write;
- offline rectangle selection now behaves as an exclusive two-tap map mode: the first tap stores one corner, the second tap creates the PMTiles bbox command, and neither tap creates a normal picked point;
- leaving a group clears the persisted group ID, active profile group memory, and invite URL so refresh does not silently re-enter the group;
- the `Офлайн-карты` screen now behaves as a map manager: `Мои карты`, current map state, file selection, preview, computer-side region preparation, and collapsed diagnostics;
- top screen headings are now plain page labels instead of standalone cards, so tabs do not start with a duplicate visual block;
- opening a saved spot card from the map now reveals the card by scrolling/focusing the map details panel instead of silently showing it below the viewport;
- technical controls are grouped in `Настройки` with a `Расширенный режим` switch, separated diagnostics, debug access, and clearly marked dangerous cache/database actions;
- user-facing terminology now hides implementation names where possible: database is shown as `БД`, offline map file as `файл офлайн-карты`, basemap as `подложка карты`, and cache/service worker as `кэш приложения`;
- weak and empty states now better explain what happened, what still works, and what the next action is;
- user-facing database unavailable copy no longer tells normal users about the internal `config.js` file; technical configuration remains a deployment detail;
- visual consistency is now normalized across cards, bottom navigation, touch targets, empty states, and primary/secondary/danger/ghost button roles;
- route recording is now a minimal local MVP on the map screen; future work should improve it in small safe steps without turning the PWA into a fake native background tracker.


- the visual consistency pass now has a follow-up spot-card hotfix: spot catalog cards keep their action hierarchy, but the tappable information area is no longer rendered as a heavy green primary button.
- the redundant quick-action panel was removed from the map screen; the bottom navigation icons from `5.17.2` and the E2E accessible-name fix from `5.17.3` remain preserved.
- Sprint 5.18 added `UX_REFERENCE.md`, `SCREEN_CONTRACTS.md`, and `SPRINT_5_18_UX_REFERENCE_AND_SCREEN_CONTRACTS.md` as decision guardrails. Runtime UI was intentionally unchanged except for the version label.
- `GPS` and `Ко мне` are explicitly protected as map-native controls; permanent duplicates of bottom navigation inside the map are explicitly forbidden.
- Sprint 5.19 implemented the first code-level contract follow-up: selected map objects now surface contextual actions directly under the map instead of through a generic quick-action panel.
- Sprint 5.20 hardens that context-sheet direction with E2E guards for map-native controls, no permanent bottom-nav duplicates on the map, picked-point actions, group-ready share actions, and save-result handoff into `Точки`.
- Sprint 5.20.2 is a test-only correction: it keeps runtime UI/CSS unchanged, removes the rejected test-driven hidden-CSS approach, checks the non-ready share shortcut by DOM state instead of forcing product CSS, and stabilizes the group-ready E2E setup through the invite URL flow.
- Sprint 5.21 moves the selected-object context sheet into the map viewport as a compact in-map bottom sheet. It is constrained by height and scroll, so it does not become a second full-size card competing with the map.
- Sprint 5.22 expands the map into the primary workspace above bottom navigation and adds a collapse/expand control to the selected-object sheet so the point context can be kept without covering the map.
- Sprint 5.22.1 fixes the expanded workspace clearance so the map stays large but does not overlap the fixed bottom navigation.

## Next sprint

### `0.7.23 / Sprint 5.23 — Save and Share Flow Hardening`

Goal: polish the selected-place save/share flow after GitHub Actions and manual mobile testing confirm the expanded map workspace layout.

Candidate scope:

- verify save-result follow-up actions on real mobile layouts;
- improve share feedback copy if the group/chat is unavailable;
- keep `GPS` and `Ко мне` as protected map-native controls;
- do not add generic app-navigation duplicates to the map;
- keep the in-map sheet compact, collapsible, and object-bound.

Invariant:

- any future cross-section shortcut must carry object context: selected point, saved spot, active group, GPS state, track state, or offline coverage state.

## Later branch

### `0.8.x — Navigation and Track Mode`

This is intentionally a later larger branch, not part of the remaining `0.7.x` UX-shell cleanup.

Candidate scope:

- track recording;
- route/trail mode;
- distance to selected spot;
- direction/bearing to selected spot;
- breadcrumb trail;
- track export/import;
- warning when the user has moved far away from the start point.

Reason for deferral:

- Navigation and tracking require new continuous state, more GPS lifecycle handling, pause/resume semantics, battery considerations, and likely storage/export decisions. Mixing this into the UX-shell work would increase risk.

## Durable project invariants

These invariants should survive all upcoming sprints:

- Do small safe sprints.
- Keep `npm run ci` green and run Playwright smoke checks before release ZIPs when dependencies are installed.
- Keep the app usable on mobile in the forest with weak or missing internet.
- Keep saved GPS spots working.
- Keep selected map points working.
- Keep chat preview points separate from saved local spots.
- Keep live friend markers separate from local mushroom spots.
- Keep `currentPosition`, `selectedMapPoint`, `pickedMapPoint`, and `chatPreviewPoint` as different states.
- Do not create a friend marker from `group_members` without `live_locations`.
- Do not replace the main Leaflet map with MapLibre during `0.7.x`.
- Do not make PMTiles the only map provider during `0.7.x`.
- Do not commit real `.pmtiles` files.
- Do not include `config.js`, `config.json`, real `.pmtiles`, or user map manifests in patch ZIPs.
- Keep debug `!` available until the late polish/debug phase.
- Keep ordinary UI copy in Russian.
- Keep repo/process documentation in English unless there is a specific reason not to.
- Keep bottom navigation as the canonical app-level section switcher.
- Keep `GPS` and `Ко мне` available as map-native controls on the map screen.
- Do not add permanent map-screen duplicates of bottom navigation entries (`Точки`, `Группа`, `Офлайн`, `Настройки`).
- Allow cross-section shortcuts only when they carry context from a selected point, saved spot, GPS state, active group state, active track state, or offline coverage state.

## Target user journey

The target app behavior:

1. Open the app.
2. Immediately see:
   - map;
   - my position;
   - my spots;
   - `Сохранить место`;
   - `Ко мне`.
3. Find mushrooms.
4. Tap `Сохранить место`.
5. Choose mushroom type.
6. Add note/photo.
7. Save.
8. Later open `Точки`.
9. Pick a saved place.
10. Show it on the map.
11. In a group, open `Группа`, see participants, enable live location, chat, and open shared points on the map.
12. Without internet, open `Офлайн`, select a local map, and keep using GPS and saved spots.
13. When something breaks, open settings/diagnostics/debug instead of guessing.

## Applied UX hotfix after Sprint 5.9

### 0.7.9-hotfix.1 / Sprint 5.9.1 — Save Button Placement Hotfix

The primary save action in the map save flow was moved below the spot questionnaire. This keeps the interaction order causal: first choose the target coordinates, then fill the point details, then commit the save action.

This is a small UX correction inside the current 0.7.9 line, not a new product branch.

### 0.7.9-hotfix.2 / Sprint 5.9.2 — Save Button Inside Form Hotfix

Small UX consistency hotfix after Sprint 5.9: the main save action belongs inside the `Анкета точки` frame, below the fields it submits.

Invariant: the user should see and fill the spot questionnaire before pressing the save button.

## 0.7.23 / Sprint 5.23 — Bookmark Save Flow

Base: `0.7.22-hotfix.1 / Sprint 5.22.1`.

Purpose: replace the misleading “draft spot” model with a bookmark-first selected-place flow.

Changes:

- The picked map point is now presented as `Карточка выбранной точки`, not as a draft spot.
- The in-map object sheet shows mini information and a `☆ Сохранить` action.
- Pressing `☆ Сохранить` opens an in-map save editor.
- The save editor includes `Куда сохранить`, `Название`, `Тип`, and `Заметка`.
- Saved spots now store a `collection` field with fixed initial values.
- Existing spots without collection are displayed as `Грибные места`.
- The old below-map save form remains as fallback and also gets `Куда сохранить`.
- E2E guards are updated for the bookmark-save lifecycle.

Not changed:

- GPS lifecycle;
- `Ко мне`;
- bottom navigation;
- group/chat backend runtime;
- offline/bbox flow;
- PMTiles/offline map loading;
- debug `!`;
- no permanent map quick-panel duplicates are reintroduced.


## 0.7.23-hotfix.1 / Sprint 5.23.1 — Bookmark Save Flow E2E Helper Hotfix

Test-only hotfix after Sprint 5.23. The shared Playwright `pickMapPoint()` helper was updated to expect the new selected-place copy and bookmark primary action instead of the old draft-point wording. Runtime UI, CSS, map logic, GPS, group/chat, offline/bbox and data model were not changed.

## 0.7.24 / Sprint 5.24 — Spot CRUD and Sheet Close Control

Object-level CRUD was added to the in-map selected/saved spot sheet. The sheet now uses a top-right `×` close control instead of a bottom `Close` action. Bottom actions are reserved for object operations: create via bookmark, read/open details, update/edit saved spot fields, delete saved spot with confirmation, share when group chat is ready, or back from an editor state. Saved spot edits update existing records in place without changing DB schema or coordinates. GPS, `Ко мне`, bottom navigation, group/chat runtime, offline/bbox, PMTiles and debug `!` were not changed.


## 0.7.24-hotfix.1 / Sprint 5.24.1 — Map Sheet Close and Spots CRUD Placement Hotfix

Small UX placement hotfix after Sprint 5.24. The in-map object sheet close control now sits in the top-right corner aligned with the object title row, not beside the collapse/status controls. Saved-spot edit/delete actions were moved out of the map sheet and into the `Точки` details card. The map sheet now keeps object-preview actions only: open the saved spot in `Точки`, share it when group chat is ready, collapse/expand the sheet, or close the sheet. CRUD editing in `Точки` supports collection, name, type and note; coordinates remain stable.

## 0.7.24-hotfix.2 / Sprint 5.24.2 — Spots Details Button State Hotfix

Small state-model hotfix for the `Точки` details card. View-mode actions and edit-mode actions are now mutually exclusive. In view mode the card shows map/chat/edit/delete/close actions. In edit mode it shows only the edit form plus `Сохранить изменения` and `Отмена`. The old edit-mode `Назад` label was replaced with `Отмена`. A scoped CSS hidden-state guard was added for details action buttons because the shared button display rule could otherwise visually override `hidden`.

Runtime map mechanics, GPS, `Ко мне`, bookmark save flow, group/chat runtime, offline/bbox, PMTiles, DB schema and debug `!` were not changed.


## 0.7.25 / Sprint 5.25 — Spots Collections Filter

Base: `0.7.24-hotfix.2 / Sprint 5.24.2`.

The `Точки` catalog exposes the existing `collection` field as a first-class user filter. The toolbar has a dedicated `Папка` selector with `Все папки`, `Грибные места`, `Разведка`, `Ягоды`, `Парковка`, and `Другое`. Legacy spots without a collection still resolve to `Грибные места`. The list keeps search, mushroom type filtering and sorting, and it shows visual collection headers with counts so the saved places feel like folders rather than only metadata.

Runtime map mechanics, GPS, `Ко мне`, bookmark save flow, group/chat runtime, offline/bbox, PMTiles, DB schema and debug `!` were not changed.

## 0.7.25-hotfix.1 / Sprint 5.25.1 — Spot Collection Filter Change Handler Hotfix

Small regression hotfix after Sprint 5.25. The collection filter UI and render logic existed, but the `spotCollectionFilter` select was not bound to rerender the list on `change`. Selecting a folder therefore left `#spotCount` and the visible list unchanged until another toolbar control triggered rendering. The hotfix wires the missing change handler only.

Folder CRUD is still intentionally out of scope for this hotfix; collections remain the fixed preset list introduced in Sprint 5.23/5.25.

## 0.7.25-hotfix.2 / Sprint 5.25.2 — E2E Version Guard Hotfix

Test-guard repair after Sprint 5.25.1. The app correctly displayed `v0.7.25-hotfix.1 · Sprint 5.25.1`, but the shared Playwright `bootApp()` guard still expected `v0.7.25 · Sprint 5.25`, so every screen smoke test failed before reaching its screen-specific assertions.

This sprint updates the shared E2E version guard and bumps the package line consistently to `0.7.25-hotfix.2 / Sprint 5.25.2`. Runtime product behavior is unchanged except that the Sprint 5.25.1 collection-filter change handler remains included.

Folder CRUD was implemented in Sprint 5.26 as a separate product sprint, not as part of this test-only hotfix.


## 0.7.26 / Sprint 5.26 — Custom Collections CRUD MVP

Base: `0.7.25-hotfix.2 / Sprint 5.25.2`.

The `Точки` screen now has a local folder manager. Users can create custom folders, rename custom folders, and delete custom folders while moving affected spots into another existing folder. The protected system folders remain available and cannot be renamed or deleted. Custom folders are stored in settings as `spot_custom_collections_v1`; the spot store schema is unchanged because each spot still keeps only its `collection` string.

The folder list is reused by the map selected-place save editor, the fallback save form, the spot details editor, and the spots filter. Unknown folder names from imported/legacy spots are treated as custom folders so they remain visible and manageable.

Runtime map mechanics, GPS, `Ко мне`, group/chat runtime, offline/bbox, PMTiles, DB schema version and debug `!` were not changed.


## 0.7.26-hotfix.1 / Sprint 5.26.1 — Unique Collection Names Guard

Base: `0.7.26 / Sprint 5.26`.

This hotfix hardens the folder identity invariant: while spots store only a string `collection`, there must not be two user-visible folders with the same effective name. Folder names are compared after trimming, collapsing repeated spaces, and lowercasing with the Russian locale.

The create and rename flows now use the same identity comparison against system folders, custom folders, and folder names derived from existing spots. Duplicate create/rename attempts are rejected with the existing `уже есть` hint. Rename/delete updates also match affected spots by the same identity key instead of exact string equality.

Added E2E coverage for duplicate custom-folder creation and duplicate rename attempts. Runtime map mechanics, GPS, group/chat runtime, offline flow, IndexedDB schema and debug `!` were not changed.


## 0.7.27 / Sprint 5.27 — Folder-First Spots UX

Base: `0.7.26-hotfix.1 / Sprint 5.26.1 — Unique Collection Names Guard`.

Goal: make `Точки` behave like a real folder catalogue instead of a flat list with a folder filter.

Implemented:

- entering `Точки` shows only folders as a visual list;
- opening a folder shows only marks from that folder;
- folder rename/delete controls moved to a folder-level `⋯` menu in the folder header;
- each mark card now has its own `⋯` menu with `Поделиться`, `Редактировать`, and `Удалить`;
- bottom navigation to `Точки` resets to the folder list, while contextual navigation from a saved spot opens its folder and details;
- the string-based collection identity model and duplicate-name guard remain unchanged.

Out of scope:

- migration from `collection` string to `collectionId`;
- drag-and-drop folder ordering;
- folder colors/icons beyond the lightweight visual folder list;
- track recording.

## 0.7.27-hotfix.1 / Sprint 5.27.1 — WebKit Spots IndexedDB Hotfix

- Stabilized folder-first Spots UX for iPhone WebKit.
- IndexedDB writes/reads now wait for transaction completion.
- App DB connection closes on page lifecycle events and version changes.
- E2E seed helper closes the app DB connection before seeding and verifies seeded count.
- Legacy save button is explicitly `type="button"`.


## 0.7.27-hotfix.2 / Sprint 5.27.2 — Active Collection Runtime Hotfix

- Declared `activeSpotCollection` as explicit global Spots screen state.
- Updated the E2E app version guard to the current hotfix version.
- Preserved folder-first Spots UX and the WebKit IndexedDB transaction-completion fix.
- No map, group/chat, offline-map, PMTiles, config, or backup behavior was changed.


## 0.7.27-hotfix.3 / Sprint 5.27.3 — Spots Android Back Hotfix

- Added History API state for the folder-first `Точки` drill-down levels: folders, collection, and details.
- Android/browser Back from an opened folder now returns to the folder list instead of leaving the PWA.
- Android/browser Back from a spot details card now returns to that folder's mark list.
- Added E2E coverage for folder -> browser Back -> folder list.
- No GPS prompt, chat, offline rectangle, backup/export/import, map, PMTiles, config, or IndexedDB schema behavior was changed.

## 0.7.27-hotfix.4 / Sprint 5.27.4 — Save Prompt Top Placement Hotfix

- Moved the GPS/save readiness prompt (`Сначала включи GPS` / selected-place state) to the top of the map screen.
- Kept the fallback save form below the map workspace.
- Added E2E coverage for prompt-before-map placement.
- No chat, backup/export/import, offline rectangle, PMTiles, config, or Spots folder CRUD behavior was changed.

## 0.7.27-hotfix.5 / Sprint 5.27.5 — Map Nav Clearance After Prompt Hotfix

- Fixed map workspace clearance after the save/GPS prompt was moved above the map.
- Reduced the expanded map height budget so `.map-wrap-home` does not overlap the bottom navigation.
- Kept the prompt above the map and did not change map runtime, GPS, spots, chat, offline maps, or backup logic.

## 0.7.27-hotfix.6 / Sprint 5.27.6 — Mobile Map Height Balance Hotfix

- Balanced the mobile map workspace after 5.27.5 made it too short on Android Chromium and iPhone WebKit.
- Kept the GPS/save prompt above the map but made it compact on narrow viewports.
- Restored the invariant that the map remains more than 52% of the viewport while clearing the bottom navigation.
- Did not change GPS runtime, chat, Spots folders, backup/export/import, offline maps, PMTiles, or config behavior.

## 0.7.27-hotfix.7 / Sprint 5.27.7 — Chat Composer Send Guard Hotfix

- Added an explicit chat send in-flight guard so repeated taps cannot create duplicate rows while a message write is pending.
- Disabled the chat composer controls during the pending write and changed the send button copy to `Отправка…` / `Сохранение…`.
- Made successful composer reset dispatch the same input event path as a user edit, keeping the counter and field state in sync after the text is cleared.
- Added smoke coverage for duplicate-send blocking, composer clearing, and the offline-map rectangle bbox command flow.
- Did not change map layout, Spots folders, backup/export/import, PMTiles files, or deployment config behavior.

## 0.7.27-hotfix.8 / Sprint 5.27.8 — Bbox WebKit Selection Hotfix

- Added a WebKit-safe DOM click/touch fallback for offline rectangle selection on the main map container.
- Converted fallback events through Leaflet `mouseEventToLatLng`, preserving the existing two-corner bbox state machine.
- Added duplicate suppression so one physical tap cannot be counted twice if both Leaflet and the DOM fallback fire.
- Kept the offline rectangle tool as a PMTiles command generator, not an in-app map downloader.
- Did not change chat persistence, map layout, Spots folders, backup/export/import, PMTiles files, or deployment config behavior.

## 0.7.27-hotfix.11 / Sprint 5.27.11 — Bbox Exclusive Tap Layer Hotfix

- Fixed the offline region rectangle picker for the lite/fallback map runtime.
- DOM tap fallback now converts map container coordinates through `containerPointToLatLng` when `mouseEventToLatLng` is unavailable.
- Keeps bbox selection separate from normal picked map points: two taps should produce a PMTiles `--bbox` command, not a saved-place draft.

## 0.7.27-hotfix.12 / Sprint 5.27.12 — Bbox Result Reveal Hotfix

- Manual bbox selection now reveals its result immediately: after the second corner, the app returns to Offline, scrolls the region preparation panel into view, and focuses the generated PMTiles command field.

## 0.7.28 / Sprint 5.28 — Local JSON Backup Reliability MVP

- Replaced the older loose `spots` export/import with a named local JSON backup schema: `mushroom-spots.local-json-backup` / schema version `1`.
- Export now includes saved local spots, explicit custom folder names, export metadata, app version, item counts, and a lightweight checksum over the backup data.
- Import is now validation-first: JSON parse, schema version, `data.spots`, `data.settings.customCollections`, spot coordinates, counts, and checksum are checked before any IndexedDB write.
- Successful import uses one IndexedDB transaction across spots and settings, merges custom folders, then refreshes the Spots UI. Existing local data is not deleted before validation.
- Groups, chat, live locations, Supabase config, API keys, PMTiles files, service worker cache, offline bbox runtime state, and temporary UI/debug/pending states remain out of backup scope.
- Added cross-profile Playwright coverage for export JSON structure, restore of spots, restore of empty custom folders, malformed JSON rejection, unsupported schema rejection, and unsafe structure rejection. The export tests capture the Blob directly instead of depending on a download event, which is important for iPhone/WebKit behavior.
- Did not change map runtime, bbox selection, offline map package handling, group/chat behavior, or spot/folder CRUD flows outside backup restore refresh.

## 0.7.29-hotfix.1 / Sprint 5.29.1 — Backup iPhone Hint Text Hotfix

Repairs the Backup UX iPhone storage hint text so the WebKit E2E contract and the visible Russian copy agree on the exact `На iPhone скачивай JSON вручную` guidance. Backup schema and import/export mechanics are unchanged.


- Added user-visible backup operation status in Settings so export/import outcomes remain visible after alerts are dismissed.
- Export now reports exactly how many local spots and user folders are in the JSON and reminds the user that maps, groups, chat, and keys are not included.
- Import success now says that the restore finished, how many spots/folders were restored, and that existing local data was not cleared.
- Rejected imports now say that the import was rejected and that local data was not changed.
- Storage copy now explicitly tells iPhone users to download the JSON manually and keep it outside the browser/iCloud tab state.
- Added Playwright coverage for export summary copy and rejected-import status copy without relying on download events.
- Did not change backup schema version, map/bbox behavior, chat/groups, PMTiles handling, or spot/folder CRUD outside user-facing backup messages.


## Sprint 5.30 — Track Recorder MVP

- Version: `0.7.30` / `Sprint 5.30`.
- Added IndexedDB `tracks` store with DB version 3.
- Added minimal route recording UI on the map screen.
- Saved routes render as separate map polylines and remain independent from spots, bbox export and navigation lines.
- Saved routes are included in local JSON backup/export/import; active unfinished recordings are not exported.
- iPhone/PWA copy explicitly states that recording works only while the app is open and does not promise background or locked-screen recording.

## Sprint 5.30.1 — Track Recorder E2E Navigation Hotfix

- Version: `0.7.30-hotfix.1` / `Sprint 5.30.1`.
- Fixed the Track Recorder E2E flow after backup export: the test now returns to the map screen after reload before clicking the saved route delete button.
- This preserves the app behavior where the last active screen can be restored across reloads.
- Runtime route recording, route backup, spots, bbox, offline maps, chat, and groups were not changed by this hotfix.

## Sprint 5.31 — Offline Map Interaction Parity

- Version: `0.7.31` / `Sprint 5.31`.
- Added interaction parity to the PMTiles offline preview without rewriting the primary Leaflet map runtime.
- The offline preview now supports `Ко мне`, tap/click-to-pick, saving the picked location as a normal local spot, and clearing the picked location.
- Saved spots, GPS, picked points, live/chat preview points, saved routes, and the active route recording are rendered as shared user overlay data in the offline preview.
- Added coverage messaging for PMTiles bounds: a GPS/picked point may be inside or outside the selected offline package; saving coordinates remains allowed either way.
- Kept bbox export, online map picking, spots/folders, backup/import, groups, chat, and PMTiles package files out of scope except for the shared overlay rendering.

## Sprint 5.32 — Offline Maps Manager UX

- Version: `0.7.32` / `Sprint 5.32`.
- Reworked the Offline screen into a user-facing `Мои карты` manager.
- The empty state now shows only the add-map flow: no preview is displayed before a map exists.
- Added a global offline-map count badge in the `Мои карты` header.
- When a map exists, the PMTiles preview is shown at the top, active map details/actions are shown below it, and the saved map list follows as a CRUD-style list.
- The map canvas stays uncluttered: status chips and file metadata live outside the preview; only the `Ко мне` map action is placed on the preview.
- Added rename, replace-file, delete, open, and list-card actions around the existing remembered PMTiles map model.
- Kept PMTiles persistence unchanged: metadata/custom names are remembered, while the actual File API object remains available only in the current browser session.
- Did not change spots, routes, backup schema, bbox command generation, chat, groups, or PMTiles packaging hygiene.

## Sprint 5.32.1 — Offline Maps Manager UX E2E Hotfix

- Version: `0.7.32-hotfix.1` / `Sprint 5.32.1`.
- Fixed the empty offline manager test oracle by ensuring hidden controls remain hidden even when shared button styles assign inline-flex display.
- Scoped the offline manager rename E2E click to the active-map details rename button to avoid strict-mode ambiguity with list item rename actions.
- Preserved the UX contract: no preview before a map is added; statuses outside the preview map; map preview keeps only map actions.
- Runtime offline maps manager behavior, PMTiles persistence, spots, routes, backup, bbox, chat, and groups were unchanged.

## Sprint 5.32.2 — Offline Maps Version Guard Hotfix

- Version: `0.7.32-hotfix.2` / `Sprint 5.32.2`.
- Base: `0.7.32-hotfix.1 / Sprint 5.32.1`.
- Fixed the shared Playwright `EXPECTED_APP_VERSION` guard so all screen smoke tests expect the hotfix runtime label.
- Updated backup fixture app-version expectations to `0.7.32-hotfix.2`.
- Runtime product behavior is unchanged from Sprint 5.32.1.



## Sprint 5.33 — Persistent Offline Map Import

- Version: `0.7.33` / `Sprint 5.33`.
- Base: `0.7.32-hotfix.2 / Sprint 5.32.2`.
- Changed the offline-map contract from remembered File API metadata to persistent local map import.
- A selected `.pmtiles` file is copied into private local app storage: OPFS is attempted first, with an IndexedDB Blob fallback for browsers/devices where OPFS is unavailable.
- Added IndexedDB `offlineMapFiles` store and bumped the app DB version to 4 for the fallback storage path.
- Remembered map records now store persistent storage metadata (`storageType`, `storageName`, `persistent`, `importedAt`) and can restore the active map after reload without asking the user to choose the file again.
- Deleting a remembered offline map also attempts to remove its persisted file from OPFS/IndexedDB.
- Updated the Offline UI copy so imported maps are described as stored inside the app instead of only selected for the current browser session.
- Added E2E coverage for import -> rename -> reload -> restored preview -> delete.
- Kept the PMTiles files themselves out of the GitHub/ZIP package; imported user files remain device-local runtime data.
- Did not change spots, route recording, backup JSON schema, bbox generation, groups, chat, or online map behavior.

## Sprint 5.33.3 — Offline Map Files Settings Clear Hotfix

- Version: `0.7.33-hotfix.3`
- UI label: `Sprint 5.33.3`
- Added a Settings safety hatch for persistent offline map files.
- Settings now has `Удалить файлы офлайн-карт`, which clears OPFS PMTiles files, IndexedDB Blob fallback files, and remembered `Мои карты` records.
- The action does not delete spots, tracks, backup JSON, groups, chat, or app cache.
- Offline-screen per-map delete remains unchanged.


## Sprint 5.33.3 — Offline Map Import WebKit and Clear Hotfix

- Version: `0.7.33-hotfix.3`
- UI label: `Sprint 5.33.3`
- Stabilized persistent PMTiles import for WebKit by storing IndexedDB fallback bytes as `ArrayBuffer`.
- Hardened settings emergency clear status so the success message survives follow-up UI rerenders.
- Added `SPRINT_5_33_2_OFFLINE_MAP_IMPORT_WEBKIT_AND_CLEAR_HOTFIX.md`.

## Sprint 5.33.3 — Offline Map Clear Navigation Locator Hotfix

- Version: `0.7.33-hotfix.3 / Sprint 5.33.3`.
- Tightened E2E navigation locators for the offline bottom-nav button with exact accessible-name matching.
- Runtime persistent offline map import behavior is unchanged from Sprint 5.33.2.


## Sprint 5.34 — Offline Map Import Feedback

- Version: `0.7.34 / Sprint 5.34`.
- Base: `0.7.33-hotfix.3 / Sprint 5.33.3`.
- Added visible import feedback for offline PMTiles files: import-start toast, import-success toast, import error dialog, duplicate-file dialog, and naming dialog after successful import.
- The naming dialog appears only after the file has been persistently saved; closing it keeps the default map name.
- Duplicate files are no longer imported silently; the user can open the existing map, replace the file, or cancel.
- Invalid files do not create remembered map records.
- Added persisted-file verification before saving a `Мои карты` record.
- Kept OPFS/IndexedDB fallback storage, settings emergency clear, spots, tracks, bbox, backup, groups, chat, and online map behavior unchanged.


## Sprint 5.34.1 — Offline Map Import Toast Timing Hotfix

- Version: `0.7.34-hotfix.1 / Sprint 5.34.1`.
- Base: `0.7.34 / Sprint 5.34`.
- Improved real-device import feedback timing for offline PMTiles files.
- The import flow now shows a visible validation toast, then an import-start toast, then an import-success toast before opening the naming dialog.
- Duplicate-file selection now shows a visible `Карта уже добавлена` toast before opening the duplicate action dialog.
- Added small delays between import feedback states so fast desktop/Android imports do not skip visible user feedback.
- Kept persistent OPFS/IndexedDB fallback storage, remembered map records, emergency clear, spots, tracks, bbox, backup, groups, chat, and online map behavior unchanged.


## Sprint 5.34.2 — Offline Map Duplicate Detection Hotfix

- Version: `0.7.34-hotfix.2 / Sprint 5.34.2`.
- Fixed duplicate `.pmtiles` detection after import feedback timing changes.
- Duplicate detection now keeps the full fingerprint for metadata but falls back to `fileName + sizeBytes` when the browser or Playwright changes/misses `lastModified`.
- This prevents re-selecting the same map file from silently running the success import path again.
- Runtime storage, OPFS import, IndexedDB fallback, emergency clear, and map UI behavior were otherwise unchanged.



## Sprint 5.34.3 — Offline Map Toast Visibility Hotfix

- Version: `0.7.34-hotfix.3 / Sprint 5.34.3`.
- Base: `0.7.34-hotfix.2 / Sprint 5.34.2`.
- Improved real-device visibility for offline map import toasts by extending the visible validation/result steps before opening the naming or duplicate dialogs.
- Moved the app toast to the top center of the viewport so it is not missed near the bottom navigation on desktop and Android.
- Duplicate selection still does not import again; it shows `Проверяю файл карты`, then `Карта уже добавлена`, then opens the duplicate action dialog.
- Persistent OPFS/IndexedDB fallback storage, remembered map records, emergency clear, spots, tracks, bbox, backup, groups, chat, and online map behavior remain unchanged.

## Sprint 5.34.4 — Offline Map Toast Style Hotfix

- Version: `0.7.34-hotfix.4 / Sprint 5.34.4`.
- Base: `0.7.34-hotfix.3 / Sprint 5.34.3`.
- Tightened offline map import toast placement so it is explicitly pinned to the top center of the viewport instead of being easy to miss near the bottom/right edge.
- Changed toast colors slightly for better contrast while preserving the existing rounded app style.
- Runtime behavior is unchanged: persistent OPFS/IndexedDB fallback storage, duplicate detection, import timing, emergency clear, spots, tracks, bbox, backup, groups, chat, and map layers remain unchanged.

## Sprint 5.35 — Offline PMTiles Style Compatibility

- Version: `0.7.35 / Sprint 5.35`.
- Base: `0.7.34-hotfix.4 / Sprint 5.34.4`.
- Added OpenMapTiles/Planetiler vector-layer schema detection for the offline PMTiles preview.
- Added a compact MapLibre vector style for `landcover`, `landuse`, `park`, `water`, `waterway`, `boundary`, `transportation`, `transportation_name`, `building`, and `place` source-layers.
- The preview now chooses the OpenMapTiles-compatible style before trying the Protomaps basemaps runtime when the PMTiles metadata exposes Planetiler/OpenMapTiles layer ids.
- The style only references source-layers present in metadata, so missing optional layers do not create unnecessary style-layer references.
- Added an E2E style JSON oracle that checks source-layer ids instead of visual screenshots.
- Persistent import/storage, duplicate detection, naming modal, emergency clear, backup, spots, tracks, bbox, groups, chat, and raster preview behavior remain unchanged.

## Sprint 5.36 — Offline Region Catalog Downloads

- Version: `0.7.36 / Sprint 5.36`.
- Base: `0.7.35 / Sprint 5.35`.
- Added a user-facing “Каталог регионов” block to the Offline screen.
- Added a configurable `offline-map-packages.json` URL stored locally in the browser.
- Added a GitHub Releases API fallback that can synthesize catalog rows from release assets if direct fetch of the manifest asset is blocked.
- Added GitHub Pages default URL inference for the `maps-2026-06-02` release manifest when the app runs from `<owner>.github.io/<repo>/`.
- The catalog renders remote regional PMTiles packages with names, sizes, manual download links, installed/not-downloaded state, and a safe “select for diagnostics” action.
- The catalog intentionally does not auto-install large PMTiles files yet; users still download manually and import through the existing persistent file flow.
- Added Russian maintainer documentation for the map-release workflow as `OFFLINE_MAP_RELEASE_WORKFLOW_RU.md`.
- Kept the application flat-ZIP rule unchanged: real `.pmtiles`, `release-maps/`, `offline-map-packages.json`, and `checksums.sha256` remain excluded from app packages.


## Sprint 5.36.1 — Offline Region Catalog Installed Region Hotfix

- Version: `0.7.36-hotfix.1 / Sprint 5.36.1`.
- Base: `0.7.36 / Sprint 5.36`.
- Fixed the installed-region catalog action: an installed region now opens the local persistent PMTiles map instead of selecting the remote GitHub Release package.
- Installed catalog cards now use `Открыть установленную` as the primary action and `Скачать заново` for the remote asset link.
- Added a small manual-download opening helper with same-tab fallback for browsers that block or ignore the first `_blank` attempt.
- Added an E2E oracle for the catalog-installed-region path.
- Kept the no-auto-install boundary: the catalog still does not stream-download large PMTiles files into OPFS.


## Sprint 5.36.2 — Offline Region Catalog Small Region Preview Hotfix

- Version: `0.7.36-hotfix.2 / Sprint 5.36.2`.
- Base: `0.7.36-hotfix.1 / Sprint 5.36.1`.
- Fixed small installed PMTiles preview viewport: small regional extracts now prefer explicit metadata center and focused zoom instead of fitting the full bounds, which could make Kaliningrad-style coastal regions look like mostly water.
- Added a broad unfiltered OpenMapTiles `transportation` preview layer so roads/tracks remain visible even when Planetiler road classes differ from the narrow style filters.
- Added diagnostics for PMTiles preview zoom and viewport mode.
- Preserved import, OPFS/IndexedDB storage, region catalog, manual downloads, duplicate detection, backup, tracks, bbox, and the primary Leaflet map.


## Sprint 5.36.3 — Offline Preview Control Clearance Hotfix

- Version: `0.7.36-hotfix.3 / Sprint 5.36.3`.
- Base: `0.7.36-hotfix.2 / Sprint 5.36.2`.
- Moved the offline preview `Ко мне` overlay button away from the MapLibre top-right navigation controls.
- The button now sits at the top-left of the PMTiles preview, while MapLibre zoom buttons keep the top-right position.
- Added a layout oracle that checks the center button uses a left-side absolute position instead of sharing the right-side control column.
- Preserved the catalog, local PMTiles selection, preview style, viewport, OPFS/IndexedDB storage, manual downloads, and the primary Leaflet map.

## 0.7.36-hotfix.4 / Sprint 5.36.4 — Offline Preview Control Style And Test Hotfix

- The PMTiles preview MapLibre zoom controls are now themed as a single dark green control group without the white default MapLibre group background showing through.
- The offline preview center button remains on the left side, away from the top-right zoom controls.
- The E2E oracle no longer relies on computed CSS `right === auto`; it now verifies the center button geometry is in the left half of the preview frame.

## 0.7.36-hotfix.5 / Sprint 5.36.5 — Online Map Title Overlay Hotfix

- Removed the redundant white `Карта` title overlay from the primary online map workspace.
- Kept the bottom navigation `Карта` tab as the screen label/navigation control.
- Added an E2E oracle that verifies the redundant online map title overlay stays hidden.
- Left PMTiles preview, offline region catalog, import/storage, and release assets untouched.

## Sprint 5.36.6 — E2E Version Guard Repair

- Repaired the E2E app version guard after Sprint 5.36.5.
- Aligned app, package, service worker, HTML cache-busting, backup tests, and E2E expected version on `0.7.36-hotfix.6 / Sprint 5.36.6`.
- No functional PMTiles, catalog, storage, backup, or map-flow changes.


## Sprint 5.37 — Offline Region Streaming Install

- Version: `0.7.37 / Sprint 5.37`.
- Base: `0.7.36-hotfix.6 / Sprint 5.36.6`.
- Added conservative catalog auto-install for regional PMTiles packages.
- The `Установить` action downloads the GitHub Release asset through `fetch()` streaming and writes chunks directly to OPFS.
- Auto-install does not use `response.arrayBuffer()` or `response.blob()` for the downloaded region file.
- OPFS is required for auto-install; when OPFS, browser streaming, network, CORS, or redirect behavior blocks the safe path, the card switches to manual-required/failure state and keeps `Скачать вручную`.
- Added progress/status states for catalog cards: not installed, downloading, verifying, installed, failed, blocked manual-required, and canceled.
- After a successful install, the app verifies the local PMTiles header, creates/updates a remembered persistent map record, and opens the installed region through the existing local persistent PMTiles preview path.
- Manual download and manual import remain unchanged and available as fallback.
- Added region-install diagnostics to the `!` panel snapshot: install status, bytes, storage type, and last install error.
- Restored `EXTERNAL_MEMORY.md` and `SPRINTS.md` to the flat project package as historical project memory; new sprint implementation notes continue to live in one file per sprint.

Invariant:

```text
Large auto-installed PMTiles packages must be written to persistent storage chunk-by-chunk.
If the browser cannot provide the safe OPFS streaming path, the app must not fall back to loading a large file into JS memory; it must preserve the manual download/import path.
```


## Sprint 5.37.1 — Spots Menu Layout Hotfix

- Version: `0.7.37-hotfix.1 / Sprint 5.37.1`.
- Base: `0.7.37 / Sprint 5.37`.
- Fixed the Spots screen folder-detail header so the global catalog count is hidden while a folder is open; the visible folder count now says `N метка/метки/меток` instead of an unexplained bare number.
- Fixed spot and folder kebab-menu layout so menu panels participate in the card/header flow instead of overlapping or being clipped by neighboring spot cards.
- Converted the spot-list item shell to an explicit grid layout so the clickable spot body and `⋯` actions keep stable columns.
- Preserved the local spots data model, folder CRUD, spot CRUD, chat sharing, backup, offline-region install, and all map behavior.

Invariant:

```text
The Spots screen layout may change, but saved spots, collections, filters, folder CRUD, spot CRUD, and navigation state must remain unchanged.
```

## Sprint 5.37.2 — Spots Menu Dropdown Hotfix

- Version: `0.7.37-hotfix.2 / Sprint 5.37.2`.
- Base: `0.7.37-hotfix.1 / Sprint 5.37.1`.
- Fixed the folder `⋯` dropdown regression: opening the menu no longer reflows the active folder header.
- Restored dropdown overlay positioning for Spots kebab panels while keeping their containers overflow-visible so menus are not clipped.
- Hid folder-level rename/delete actions for folders that were still treated as system folders in that hotfix.
- Repaired the offline catalog E2E oracle so the existing manual-import auto-preview behavior is not treated as a failure before testing `Открыть установленную`.
- Preserved spot CRUD, filters, sorting, backup, offline-region install, and all map behavior.

Invariant:

```text
Spots menu presentation may change, but spot CRUD, filters, sorting, and local data must stay unchanged.
```

## Sprint 5.37.3 — Spots Folder CRUD Rule Hotfix

- Version: `0.7.37-hotfix.3 / Sprint 5.37.3`.
- Base: `0.7.37-hotfix.2 / Sprint 5.37.2`.
- Corrected the folder ownership rule after user clarification: there must be no non-editable system folders in the user contract.
- Re-enabled folder-level CRUD for every existing visible folder, including `Грибные места` and starter folders.
- Removed `системная/пользовательская` labels from folder cards.
- Kept the dropdown behavior from Sprint 5.37.2 so opening `⋯` does not move the active folder header.
- Added persisted hiding for renamed/deleted starter folder names so a deleted starter folder does not immediately reappear from the built-in starter list.
- Preserved spot CRUD, filters, sorting, backup, offline-region install, and all map behavior.

Invariant:

```text
Visible folder = user-manageable folder.
No folder shown to the user may be protected from folder CRUD merely because it came from the starter list.
```


## Sprint 5.37.5 — Spots Item Menu Stack Hotfix

- Version: `0.7.37-hotfix.5 / Sprint 5.37.5`.
- Base: `0.7.37-hotfix.3 / Sprint 5.37.3`.
- Checked and hardened the `⋯` menus on individual spot cards.
- Added a direct `Показать на карте` action to each spot-card menu so a point can be opened on the map without first opening the detail card.
- Aligned spot-card menu labels with the rest of the Spots screen: `Отправить в чат`, `Править`, and `Удалить`.
- Kept `Отправить в чат` disabled when group chat is not available; map, edit, and delete actions remain active for an existing point.
- Added shared kebab-menu behavior so opening one `⋯` closes other open spot/folder menus, and Escape/outside click closes menus.
- Preserved spots data, folder CRUD, filters, sorting, backup, offline-region install, and map storage behavior.

Invariant:

```text
A spot-card `⋯` menu is a compact action surface for one existing saved point. Opening it must not move folder headers, open multiple competing menus, or disable point CRUD actions.
```


## Sprint 5.38 — Folder Delete Safety UX

- Version: `0.7.38 / Sprint 5.38`.
- Base: `0.7.37-hotfix.5 / Sprint 5.37.5`.
- Replaced the old folder-delete confirm path with a modal overlay flow.
- Folder deletion now offers two explicit outcomes: delete the folder and move its spots to another folder, or delete the folder together with all spots inside it.
- The destructive “delete folder and spots” path uses a second danger confirmation dialog and warns the user to have a backup.
- Empty folders use a simpler delete path without a transfer selector.
- If there is no other folder to transfer into, the safe move action is disabled and the UI explains why.
- Kept the product rule that any visible folder is user-manageable; no hidden system-folder exception was reintroduced.
- Preserved spot cards, point CRUD, `⋯` menu behavior, offline maps, backup schema, and storage schema.

Invariant:

```text
Folder = grouping container.
Spot = independent saved record.
Deleting a folder must not delete spots unless the user explicitly chooses and confirms the destructive path.
```


## Sprint 5.39 — Online Map Expand Mode

- Version: `0.7.39 / Sprint 5.39`.
- Added an icon-only expand control on the online map.
- The control uses `⛶` when the map is in normal layout and `↙` when the map is expanded.
- Expanded mode makes the online Leaflet map fill the application workspace while keeping the bottom navigation visible and usable.
- Toggling expanded mode measures the top bar and bottom navigation insets, updates CSS variables, and calls Leaflet `invalidateSize()` immediately and after layout settle.
- The feature is scoped to the online map screen only. Offline PMTiles preview, region catalog, imports, storage, backup, bbox selection, spots, chat, and tracks are unchanged.

Invariant:
- Online map expand mode changes layout only. It must not change map data, offline map storage, spot records, chat state, backup data, or track recording.

## Sprint 5.39.1 — Expand Version Guard Hotfix

- Version: `0.7.39-hotfix.1 / Sprint 5.39.1`.
- Base: `0.7.39 / Sprint 5.39`.
- Fixed the shared Playwright `EXPECTED_APP_VERSION` guard after Sprint 5.39.
- Updated app, package, Service Worker, HTML cache-busting, backup tests, and E2E expected version to the hotfix runtime label.
- Preserved the Sprint 5.39 online map expand UI and behavior.

Invariant:
- This hotfix is test/version alignment only. It must not change offline maps, storage, backup format, spots, chat, tracks, or the map expand interaction model.


## Sprint 5.39.2 — Expand Button Oracle Hotfix

- Version: `0.7.39-hotfix.2 / Sprint 5.39.2`.
- Base: `0.7.39-hotfix.1 / Sprint 5.39.1`.
- Repaired the online map expand E2E oracle.
- The test no longer requires the expand button to keep the same absolute viewport `x` coordinate after the map container expands.
- The guard now checks that the button remains visible and anchored near the expanded map's own top-left corner while the bottom navigation stays visible.
- Preserved the online map expand runtime behavior.

Invariant:
- A layout E2E oracle should verify the user-visible contract, not incidental absolute viewport coordinates.


## Sprint 5.39.3 — Expand Version Guard Hotfix

- Version: `0.7.39-hotfix.3 / Sprint 5.39.3`.
- Base: `0.7.39-hotfix.2 / Sprint 5.39.2`.
- Fixed the shared Playwright `EXPECTED_APP_VERSION` guard, which still expected `0.7.39-hotfix.1 / Sprint 5.39.1` while the runtime had already moved to hotfix.2.
- Aligned app, package, Service Worker, HTML cache-busting, backup tests, and E2E expected version on `0.7.39-hotfix.3 / Sprint 5.39.3`.
- Preserved the online map expand behavior and the corrected expand-button E2E oracle from Sprint 5.39.2.
- Runtime product behavior is unchanged except for the version label bump.

Invariant:
- A version-guard hotfix must only align runtime and test expectations. It must not change product behavior.

## Sprint 5.40 — Online Map Controls Unification

- Version: `0.7.40 / Sprint 5.40`.
- Base: `0.7.39-hotfix.3 / Sprint 5.39.3`.
- Unified the visible online map floating controls into one control system.
- Changed the left map stack to use the same button geometry for expand/collapse and Leaflet zoom in/out controls.
- Changed the right map stack so GPS and center-on-me use the same square touch target geometry as the other map controls.
- Replaced the visible `Ко мне` text on the floating map button with an icon while preserving `aria-label="Ко мне"` and `title="Ко мне"`.
- Kept the bottom navigation visible and usable in expanded map mode.
- Added E2E guards for unified map control sizing and non-overlap in normal and expanded map modes.
- Preserved online map expand behavior, offline PMTiles preview, region catalog, import/storage, backup, bbox, spots, chat, and tracks.

Invariant:

```text
Online map controls may change visual styling, but their behavior and accessible labels must remain stable.
```

## Sprint 5.41 — Save Place Dialog Flow

- Version: `0.7.41 / Sprint 5.41`.
- Base: `0.7.40 / Sprint 5.40`.
- Removed the always-visible save-place form from the normal map page.
- Kept the map page save block as a short decision panel: choose a map point or save the current GPS position.
- Added a dedicated `Сохранить место` overlay dialog that opens only when a real coordinate exists.
- The picked-map-point card now opens the same save dialog through `☆ Сохранить` instead of expanding an inline form inside the map sheet.
- The GPS save button opens the same dialog once GPS coordinates are available; without coordinates it requests GPS.
- Preserved the result card after save, so the user can open the saved point in `Точки` or share it when group chat is ready.
- Preserved online map controls, expand mode, offline maps, backup, bbox, spots folders, chat, and tracks.

Invariant:

```text
The save-place form must not open without coordinates. A coordinate is created first through GPS or picked-map selection; only then can the save dialog collect folder, name, type, note, and photo.
```



## Sprint 5.41.1 — Save Place Screen Order Hotfix

- Version: `0.7.41-hotfix.1 / Sprint 5.41.1`.
- Base: `0.7.41 / Sprint 5.41`.
- Moved the save-place card above the route recorder so the primary mushroom-place workflow appears before the walking route tool.
- Kept the save-place form as an overlay-only flow from Sprint 5.41.
- Shortened the save-place card copy and moved the long map-pick instruction into a compact details block.
- Changed the empty save target pill from `ждём GPS` to `нет точки`, because GPS status is shown separately in the GPS strip.
- Renamed the picked-place sheet title to `Карточка выбранной точки`.
- Did not change IndexedDB schema, backup, offline maps, chat, route recording logic, map expand, or map control styling.

Invariant:

```text
The primary place-saving workflow should appear before secondary route recording. The save-place form remains overlay-only and coordinate-gated.
```

## Sprint 5.41.3 — GPS Desktop Timeout Hotfix

- Version: `0.7.41-hotfix.3 / Sprint 5.41.3`.
- Base: `0.7.41-hotfix.1 / Sprint 5.41.1`.
- Added a desktop-safe fallback for `navigator.geolocation.getCurrentPosition`.
- The primary request still asks for high accuracy for phones and real GPS devices.
- If the primary request times out or reports position unavailable, the app retries once with lower accuracy, a longer timeout, and a short cached-position allowance.
- The fallback is used by the main GPS button and route-recorder start, so desktop browser geolocation providers get more time before the app reports failure.
- Permission-denied errors are not retried.
- Did not change the save-place UI layout, map controls, offline maps, spots, backup, storage, chat, or track data model.

Invariant:

```text
Browser geolocation permission does not guarantee that a desktop can immediately compute coordinates. Timeout/position-unavailable errors should get one safe lower-accuracy retry before the app reports GPS failure.
```

## Sprint 5.41.3 — Save Flow E2E Oracle Hotfix

- Version: `0.7.41-hotfix.3 / Sprint 5.41.3`.
- Base: `0.7.41-hotfix.2 / Sprint 5.41.2`.
- Fixed stale Playwright expectations after the save-place screen copy and picked-point sheet title changed.
- Updated E2E checks from `Сначала выбери место` to `Выбери место или включи GPS`.
- Updated picked-point sheet expectations from `Выбранное место` to `Карточка выбранной точки`.
- Kept GPS timeout fallback, save dialog flow, map controls, offline maps, storage, backup, spots, groups, chat, and tracks unchanged.

Invariant:

```text
Tests must validate the current user-facing copy after the save dialog flow migration, not stale labels from the pre-overlay save form.
```



## Sprint 5.42 — Spots Folders UX Polish

- Version: `0.7.43-hotfix.2 / Sprint 5.43.2`.
- Base: `0.7.41-hotfix.3 / Sprint 5.41.3`.
- Moved folder creation out of the always-visible folders screen form and into a focused overlay dialog opened by `＋ Новая папка`.
- Kept the folder count pill visible on the folders overview.
- Shortened the folders overview hint so folder selection stays the primary task.
- Added a `⋯` menu to every folder card in the folders overview.
- Folder card primary click still opens the folder.
- Folder card menu actions expose rename and delete without treating any existing folder as system-owned.
- Kept the menu panel as an overlay and added an open-state stacking class so pressing `⋯` does not move the `⋯` button or reflow the folder card.
- Preserved spots, save dialog, map, offline maps, backup, IndexedDB schema, chat, and tracks.

## Sprint 5.43.2 — Folder Menu Popover Hotfix

- Version: `0.7.43-hotfix.2 / Sprint 5.43.2`.
- Moved folder-card `⋯` dropdowns upward so they no longer look attached to the next folder row.
- Added a folder rename dialog for actions launched from the folder list.
- Fixed folder-card rename cancellation so it keeps the user on the folder list instead of opening the folder.
- Added E2E guards for folder-card kebab stability and no implicit folder navigation from rename cancel.
- Preserved the folder-detail rename panel and folder delete safety dialogs.

## Sprint 5.43 — Group Entry UX Simplification

- Version: `0.7.43 / Sprint 5.43`.
- Base: `0.7.42-hotfix.1 / Sprint 5.42.1`.
- Simplified only the top group entry block.
- Hid the live-coordinate status and live-state card while the user is not in a group.
- Changed joined-state status copy to `ваши координаты не передаются` / `ваши координаты передаются` so group membership is not confused with coordinate sharing.
- Renamed `Моё имя` to `Профиль на этом устройстве`.
- Renamed the profile save action to `Переименовать профиль` and kept `Другой человек` for switching/creating another local profile on the same device.
- Renamed `ID группы` to `Код или ссылка группы` and normalized pasted invite links to the `group` code.
- Hid `Скопировать приглашение` and `Выйти из группы` until the user is actually in a group.
- Kept the participants, live-locations, chat, maintenance, map, spots, offline maps, backup, storage, and track recorder behavior unchanged.

Invariant:

```text
Group membership != coordinate sharing. A participant may be in the group without sending a live map marker.
```

## Sprint 5.43.2 — Group Participants E2E Oracle Hotfix

- Version: `0.7.43-hotfix.2 / Sprint 5.43.2`.
- Base: `0.7.43 / Sprint 5.43`.
- Fixed the group entry flow guard so joining a group requires both a group code/link and a local device profile name before the button becomes enabled.
- Updated the group-entry E2E test to model the real user contract: enter a group code/link, provide a local profile name, then join.
- Preserved local-first group entry, Supabase sync behavior, chat, live-location sharing, maps, spots, offline maps, storage, backup, tracks, and folder UI behavior.

Invariant:

```text
Joining a group requires a local profile name and a group code/link. Group membership still does not imply coordinate sharing.
```


## Sprint 5.43.2 — Group Participants E2E Oracle Hotfix

- Version: `0.7.43-hotfix.2 / Sprint 5.43.2`.
- Base: `0.7.43-hotfix.1 / Sprint 5.43.1`.
- Updated the group-screen E2E oracle so local-first group membership renders the current profile as a participant after joining.
- Preserved the invariant that joining a group does not transmit live coordinates.
- Aligned participant metadata wording with the new group copy: coordinates are transmitted / not transmitted.

Invariant:

```text
Group membership creates participant presence. Coordinate sharing remains a separate explicit action.
```


## Sprint 5.44 — Group Screen State Cleanup

- Version: `0.7.44 / Sprint 5.44`.
- Base: `0.7.43-hotfix.4 / Sprint 5.43.4`.
- Split group entry into two explicit paths: create a new group without entering a code, or join an existing group by code/link.
- Hid the members, live-locations, and chat blocks while the user is not in a group; replaced them with a compact preview of what appears after entry.
- Kept group creation dependent on a local device profile name, but independent of the group-code field.
- Kept group joining dependent on both a local device profile name and a code/link.
- After joining, show the current group code plus `Скопировать приглашение` and `Выйти из группы` actions.
- Kept the copy `в группе · ваши координаты не передаются` / `в группе · ваши координаты передаются` so membership remains separate from live coordinate sharing.
- Preserved Supabase API behavior, group_members/live_locations schemas, chat API/storage, maps, spots, offline maps, backup/storage, tracks, and local profile model.
- Aligned version guards to `0.7.44 / Sprint 5.44`.

Invariant:

```text
Before group entry, the screen shows only profile + create/join choices.
After group entry, participants, live-locations, invitation actions, and chat become available.
Creating or joining a group still does not start coordinate sharing.
```

## Sprint 5.44.3 — Group Join WebKit Submit Hotfix

- Version: `0.7.44-hotfix.3 / Sprint 5.44.3`.
- Added draft tracking for the group entry profile and group code inputs so WebKit cannot lose a recently filled value between `fill()`/typing and the join click.
- Kept the Sprint 5.44 state cleanup UI and group membership/live-location invariants unchanged.
- Aligned version guards to `0.7.44-hotfix.3 / Sprint 5.44.3`.

## Sprint 5.44.3 — Group Join WebKit Submit Hotfix

- Version: `0.7.44-hotfix.3 / Sprint 5.44.3`.
- Fixed iPhone/WebKit group join activation after the group screen state cleanup.
- Group entry now uses resolved draft values for profile and group code so WebKit blur/click ordering cannot erase the just-entered values before join.
- Join activation no longer blocks the subsequent click after an early failed touch/pointer activation.
- Preserved the invariant that joining a group does not start live coordinate sharing.

# Harness Overview — Selbstdiagnose des Agent-Systems

> **Datum:** 2026-06-28
> **Agent:** OpenCode (deepseek-v4-flash-free)
> **Projekt:** ItoCook
> **Zweck:** Vollständiges Bild der Harness-Struktur rund um das LLM, verfügbare Tools und Skills, Entscheidungsfindung und Schutz vor Fehlern.

---

## 1. Harness-Konzept

**Harness** — eine mehrschichtige Infrastruktur zwischen dem Entwickler und dem rohen LLM. Sie verwandelt ein Modell, das nur Text generieren kann, in einen Engineering-Agenten, der Dateien liest, Code schreibt, auf die Datenbank zugreift, im Browser debuggt und Ergebnisse dokumentiert.

Im Projekt ItoCook ist eine **9-schichtige Struktur** implementiert:

```
1. INSTRUCTION  — AGENTS.md, Regeln, Verbote
2. CONTEXT      — progress.md, roadmap.md, design.md (was das Modell sieht)
3. TOOLS        — MCP-Server (filesystem, git, Directus, Chrome DevTools)
4. LOOP         — Think → Do → Verify (Ausführungsdisziplin)
5. MEMORY       — progress.md, architecture.md, .planning/, git log
6. SUBAGENTS    — context7, sequential-thinking, task (Unteragenten)
7. VERIFICATION — TypeScript, DevTools, Code-Review
8. SANDBOX      — was erlaubt ist und was nicht ohne Bestätigung
9. SKILLS       — 41+ Skills, bei Bedarf geladen
```

Das Schichtendiagramm ist visualisiert in `notes/Harness/harness-diagram.html`.

---

## 2. AGENTS.md — Das Gehirn des Systems

Der Agent hat **zwei Ebenen von Anweisungen**:

### 2.1 Globales AGENTS.md (`~/.config/opencode/AGENTS.md`)

Definiert:
- **Verhalten:** Plan vor großen Änderungen, Bestätigung vor Commits, niemals ohne Erlaubnis pushen
- **Verbote ohne Erlaubnis:** `.env`, `nuxt.config.ts`, `docker-compose.yml`, DB-Migrationen
- **English-Only Policy:** Russisch verboten in Code, Kommentaren, Dokumentation (außer `notes/`)
- **CSS/Layout:** Tailwind, flexbox/grid, keine Inline-Stile, px für Mobilgeräte
- **Auto-loading skills:** Skill-Laderegeln nach Triggern (security → auth/nginx, debugging → Bugs usw.)

### 2.2 Projekt-AGENTS.md (`/Users/DSAITO/Documents/BackEnd/itocook/AGENTS.md`)

Definiert:
- **Session-Start:** git log → progress.md → roadmap.md → Docs nach Feature
- **Nach jeder Antwort:** progress.md aktualisieren
- **Nach jedem Commit:** zum Git-Log hinzufügen
- **Nuxt 4 Struktur:** alle Ordner innerhalb `app/`
- **Directus permissions checklist:** Rechte vor neuen Collections prüfen
- **Safety Gates:** `docker-compose.yml`, `.env` nicht anfassen, Collections nicht löschen, nicht pushen
- **Dokumentations-Trigger:** nach Phasenabschluss, neuer Collection/Composable/Route/Flow

### Was benötigt menschliche Bestätigung

| Aktion | Grund |
|--------|-------|
| Änderung von `docker-compose.yml` | Kann die gesamte Infrastruktur lahmlegen |
| Änderung von `.env` | Enthält Secrets, Passwörter, Tokens |
| Löschung von Directus Collections | Unwiderruflicher Datenverlust |
| `git push` | Unbeabsichtigter Deployment |
| Löschung von Dateien in `docs/` oder `notes/` | Dokumentationsverlust |
| Änderung von Directus Permissions | Risiko horizontaler Eskalation |

---

## 3. Skills — Wissen bei Bedarf

Insgesamt sind **41+ Skills** in `~/.config/opencode/skills/` installiert. Der Agent lädt sie vor jeder Aufgabe.

### 3.1 Benutzerdefinierte Skills (speziell für ItoCook erstellt)

| Skill | Zweck |
|-------|-------|
| `security/` (5 Dateien) | Sicherheit: auth, API, frontend, Stack, Release-Checkliste |
| `session-start/` | Boot-Sequenz: Docs lesen, Zusammenfassung ausgeben |
| `code-reviewer/` | Checkliste vor "fertig": TS, Vue, Directus, Design |

> **Security-Audit 2026-06-28** wurde via `security/` Skill durchgeführt. Gefunden: 3 CRITICAL (einschließlich unrestricted `directus_users` read), 2 HIGH, 2 MEDIUM. Alle behoben. Vollständiger Bericht: `docs/audits/security-audit.md`.

### 3.2 Superpowers Skills (via `npx superpowers`)

| Skill | Wann verwendet | Problem, das es löst |
|-------|---------------|----------------------|
| `brainstorming/` | Vor neuem Feature | Klärt Anforderungen vor dem Code |
| `spec-driven-development/` | Neues Feature ohne Spezifikation | Formalisert Anforderungen |
| `planning-and-task-breakdown/` | Große Aufgabe | Zerlegt in Schritte |
| `incremental-implementation/` | Jede Implementierung | Kleine Schritte, jeder geprüft |
| `debugging-and-error-recovery/` | Bugs | Reproduzieren → Lokalisieren → Beheben |
| `diagnose/` | Bugs | Zyklus: reproduce → minimise → hypothesis → fix |
| `codebase-health-check/` | Architektur-Audit | Bewertung der Codebasis, 7 Empfehlungen |
| `code-review-and-quality/` | Code-Review | 5 Prüfachsen |
| `test-driven-development/` | Tests | Red → Green → Refactor |
| `git-workflow-and-versioning/` | Commits/Branches | Saubere Historie |
| `documentation-and-adrs/` | Dokumentation | ADR, Glossar, JSDoc |
| `handoff/` | Lange Session | Kontextverpackung |
| `interview-me/` | Unklare Anforderungen | Extrahiert was wirklich gebraucht wird |
| `grill-me/` | Stresstest des Plans | Verhör bis zur Kristallklarheit |
| `grill-with-docs/` | Stresstest mit Docs-Update | Verhör + Aktualisierung von CONTEXT.md |
| `zoom-out/` | Unbekannter Code | Erklärung im Systemkontext |
| `improve-codebase-architecture/` | Refactoring | Architekturvertiefungen finden |
| `idea-refine/` | Rohe Idee | Divergentes + konvergentes Denken |
| `source-driven-development/` | Code mit Framework | Prüfung gegen offizielle Dokumentation |
| `doubt-driven-development/` | Unbekannter/wichtiger Code | Adversarial Review jeder Entscheidung |
| `context-engineering/` | Kontextoptimierung | Richtiger Kontext zur richtigen Zeit |
| `finishing-a-development-branch/` | Branch-Abschluss | Sauberer Merge/PR |
| `executing-plans/` | Vorhandener Plan | Ausführung mit Kontrollpunkten |

### 3.3 Stack-Skills (Nuxt / Vue / Tailwind / Directus)

| Skill | Wann verwendet |
|-------|---------------|
| `nuxt/` | Jede Nuxt-Arbeit |
| `nuxt-ui/` | Verwendung von Nuxt UI Komponenten |
| `nuxt-vue/` | Nuxt + Vue Patterns |
| `vue/` | Vue 3, Composition API, Composables |
| `tailwind-design-system/` | Tailwind Tokens, Design-System |
| `tailwind-nuxtui/` | Tailwind + Nuxt UI zusammen |
| `directus/` | Directus: Schema, Permissions, MCP |
| `docker-expert/` | Docker, docker-compose Probleme |
| `frontend-ui-engineering/` | Produktions-UI-Layout |
| `api-and-interface-design/` | API-Design |
| `make-interfaces-feel-better/` | UI-Politur (Schatten, Animationen, Typografie) |
| `performance-optimization/` | Performance-Optimierung |
| `ci-cd-and-automation/` | CI/CD-Pipelines |
| `shipping-and-launch/` | Prod-Deployment-Checkliste |
| `deprecation-and-migration/` | Entfernung alter Systeme |
| `caveman/` | Token-Sparmodus |
| `browser-testing-with-devtools/` | DevTools MCP Tests |
| `dispatching-parallel-agents/` | Parallele unabhängige Aufgaben |
| `code-simplification/` | Code-Vereinfachung ohne Verhaltensänderung |
| `receiving-code-review/` | Verarbeitung von Code-Review-Feedback |
| `requesting-code-review/` | Review-Anfrage vor Merge |
| `to-prd/` | Konvertierung von Gespräch zu PRD |
| `to-issues/` | Aufteilung von PRD in Aufgaben |
| `triage/` | Bug-Priorisierung |
| `prototype/` | Schneller Prototyp |
| `teach/` | Benutzerschulung |
| `write-a-skill/` | Erstellung neuer Skills |
| `writing-plans/` | Erstellung von Schritt-für-Schritt-Plänen |
| `find-skills/` | Suche nach benötigtem Skill |
| `verification-before-completion/` | Prüfung vor "fertig" |
| `subagent-driven-development/` | Ausführung durch Subtasks |
| `customize-opencode/` | Konfiguration von OpenCode selbst |
| `setup-matt-pocock-skills/` | Initiale Repository-Einrichtung |
| `using-git-worktrees/` | Isolation durch Worktrees |
| `using-superpowers/` | Meta-Skill (bereits zu Sessionsbeginn geladen) |

**Gesamt: 41 installierte Skills.**

---

## 4. MCP-Server — Was der Agent tun kann

### 4.1 Dateisystem (filesystem MCP)

- Lesen/Schreiben aller Projektdateien
- Suche nach Mustern (glob) und Inhalten (grep)
- **Beispiel:** `filesystem_read_file("app/pages/cook.vue")` — Quelldatei lesen

### 4.2 Git (git MCP)

- Status, Commits, Logs, Diffs
- **Beispiel:** `git_git_log({"repo_path": project, "max_count": 5})` — letzte Commits
- **Beispiel:** `git_git_commit({"repo_path": project, "message": "fix(auth): ..."})`

### 4.3 Web Fetch

- Herunterladen von Seiten per URL
- **Beispiel:** `fetch_fetch({"url": "https://nuxt.com/docs/..."})` — aktuelle Dokumentation
- **Beispiel:** `websearch({"query": "nuxt 4 middleware ..."})` — Google-Suche

### 4.4 Directus MCP (`http://localhost:8055/mcp`)

- Vollständiges CRUD von Collections, Feldern, Relationen
- Erstellung von Flows und Operations
- Schema-Lesen vor der Arbeit
- **Beispiel:** `directus_collections({"action": "read"})` — alle Collections auflisten
- **Beispiel:** `directus_flows({"action": "create", "data": {...}})` — Automatisierung

### 4.5 context7 (Framework-Dokumentation)

- Live-Dokumentation von Nuxt, Directus, Vue, Tailwind
- Immer aktuelle APIs, nicht aus Training Data
- **Beispiel:** `context7_query-docs({"libraryId": "/nuxt/nuxt", "query": "server routes"})`

### 4.6 Chrome DevTools (Browser-Debugging)

- Lesen von console.log und Fehlern
- Network Requests (Status, CORS)
- Screenshots, Lighthouse Audit
- Performance Trace
- **Beispiel:** `chrome-devtools_list_console_messages()` — JS-Fehler
- **Beispiel:** `chrome-devtools_list_network_requests()` — 4xx/5xx

### 4.7 Sequential Thinking

- Erzwungenes schrittweises Denken
- Für komplexe Architekturentscheidungen

---

## 5. Speichersystem

Der Agent hat keinen Langzeitspeicher zwischen Sessions. Speicher wird realisiert durch **trigger-basierte Dokumentation**:

| Datei | Wann aktualisiert | Was sie enthält |
|-------|------------------|-----------------|
| `docs/progress.md` | Nach jeder Änderung | Status, bekannte Probleme, Plan nächste Session, git log |
| `docs/roadmap.md` | Bei Phasenabschluss | High-Level Roadmap, Checkboxen, Abschlussdaten |
| `docs/ARCHITECTURE.md` | Neuer Composable/Route/Pattern | Struktur, Core-Layer-Dokumentation |
| `docs/architecture/*.md` | Neues Feature | 6 Dateien: cook-queue, recipe-system, finance, duty, shopping-list, auth-flow |
| `docs/CONTEXT.md` | Interview mit Entwickler | Glossar der Domänenbegriffe (30+ Begriffe) |
| `.planning/` | Vor großer Aufgabe | Ausführungsplan |
| `docs/audits/*.md` | Nach Audit | Security Audit, UI Polish Audit, Refactoring Plan |
| `docs/design.md` | Bei Design-System-Änderung | Farben, Tokens, Schriftarten, UI-Regeln |
| `docs/skills-cheatsheet.md` | Neuer Skill | Skill-Tabelle für Entwickler |

**Prinzip:** Dokumente werden nur bei Ereignissen aktualisiert (Phasenabschluss, neuer Bug, neues Feature), nicht nach Zeitplan. Der Git-Log dient als durchsuchbare Entscheidungshistorie.

---

## 6. Arbeitszyklus

Der Prozess ist ein **Dreieck** aus drei Teilnehmern:

```
┌─────────┐     schreibt Prompts     ┌──────────┐     führt aus       ┌──────────┐
│ Claude  │ ──────────────────────→ │ Dmitrii  │ ────────────────→ │ OpenCode │
│ (Stratege│ ←────────────────────── │ (PO/QA)  │ ←──────────────── │ (Ausführ.)│
│ + Diagn.)│   Ergebnisse+Screens    │           │   Bericht+Code    │           │
└─────────┘                         └──────────┘                   └──────────┘
```

1. **Claude** (extern, im Browser) — Stratege und Diagnostiker. Schreibt Prompts auf Englisch, analysiert Ergebnisse, entwickelt Lösungen.
2. **Dmitrii** (Mensch) — Produktbesitzer. Startet Prompts im Terminal via OpenCode. Genehmigt Änderungen. Macht visuelles QA.
3. **OpenCode** (Agent, aktuell) — Ausführer. Liest Dateien, schreibt Code, greift auf Directus zu, debuggt im Browser, aktualisiert Docs.

**Warum Prompts auf Englisch?** Weil Code, Dokumentation, Kommentare — alles auf Englisch ist (English-Only Policy). Claude schreibt Prompts in derselben Sprache wie der Code, um Sprachmischung zu vermeiden.

**"One change at a time"** — eine Regel, die hinzugefügt wurde, nachdem mehrere gleichzeitige Infrastrukturänderungen zu einem tagelangen Rollback geführt hatten.

---

## 7. Safety Gates & Sandbox

### Harte Gates (ohne Bestätigung — kein Schritt)

| Gate | Grund |
|------|-------|
| **nginx-Konfigurationen** | Fehler in der Konfiguration → kompletter day-long Outage |
| **Service Worker Strategie** | `injectManifest` → `generateSW` Wechsel hat PWA-Build gebrochen; `navigateFallback: null` ist kritisch |
| **Docker Compose** | Kann die gesamte Produktionsinfrastruktur zerstören |
| **.env Dateien** | Passwörter, Tokens, VAPID-Keys |
| **Directus Permissions** | Risiko horizontaler Eskalation (war: CRITICAL finding — `directus_users` unrestricted read) |
| **git push** | Deployment auf Produktion ohne Confirm |
| **Löschung von Collections/Dokumenten** | Unwiderruflicher Verlust |

### Autonome Aktionen (ohne Nachfrage)

- Erstellung/Bearbeitung von Vue/TS Komponenten
- Nuxt Server Routes
- Neue Dateien in `docs/`
- Aktualisierung von `progress.md` und `roadmap.md`
- Neue Directus Collections (ohne Löschung bestehender)
- Lesen aller Projektdateien

---

## 8. Gelernte Lektionen

Regeln, die hinzugefügt wurden, nachdem etwas schiefging:

| Problem | Was passiert ist | Hinzugefügte Regel |
|---------|-----------------|-------------------|
| **Multiple infra changes** | Gleichzeitige Änderung von nginx + Directus + Docker führte zu tagelangem Rollback | "One change at a time" |
| **Composable plain object refs** | `useParticipantsModal()` gab plain object zurück → `v-if="pm.loading"` immer true (Ref object truthy) | Mit `reactive()` umschließen oder `readonly(reactive({}))` zurückgeben |
| **useDirectus() in async** | Composables mit useRuntimeConfig innerhalb von setTimeout verloren Nuxt-Kontext | useDirectus auf oberster Ebene aufrufen, nicht innerhalb von async |
| **Horizontal escalation** | User Policy hatte create/update auf `balances` und `transactions` ohne `$CURRENT_USER` Filter | Admin-Proxy-Pattern + Security Audit |
| **Directus users exposed** | `directus_users` read permission gab alle Felder zurück (inkl. E-Mail, Tokens) | Field-Level Restriction + Audit |
| **DELETE 204 crash** | DELETE von Directus gibt 204 No Content zurück → `res.json()` stürzt ab | `res.text()` + conditional `JSON.parse` |
| **Calendar today highlight** | Ausgewählter Tag und heute visuell im Konflikt | `bg-purple-100 text-purple-700` für today separat |
| **PWA swSrc/swDest conflict** | `injectManifest` scheiterte in Nuxt 4 wegen same-file conflict in `app/public/` | Wechsel zu `generateSW` |
| **Fork pattern needed** | Shared `recipes.cook` PATCH verletzte Urheberrechte | Fork-on-cook: Kopie mit `forked_from`, owned by cook |
| **Naming collision in composable** | `fetch()` innerhalb useTotalUsers rief sich selbst auf | Interne Funktion umbenannt in `fetchCount` |

---

## 9. Tests

Vollständiger Testplan — `notes/tests-promt.md` (10 Prompts, Reihenfolge: Units → API → E2E → CI/CD).

### Unit Tests (Vitest)

| # | Datei | Was wird getestet |
|---|-------|-------------------|
| 1 | `dedupRecipes.test.ts` | Rezept-Deduplizierung nach `dish_name` — reine Funktion, 7 Fälle |
| 2 | `useBalanceCheck.test.ts` | Balance-Gate (−30€ Threshold) — 7 Fälle, inkl. Safe Fallback |
| 3 | `deduction.test.ts` | Kostenaufteilung — `computePastaCost` + pro-Person-Anteil, 10 Fälle |
| 4 | `security.test.ts` | Sicherheitsregression — update-me Whitelist, Balance-Grenzen, Department-Feld |

### API Tests (Vitest — Server Routes)

| # | Datei | Was wird getestet |
|---|-------|-------------------|
| 5 | `auth-routes.test.ts` | Autorisierung auf Server Routes — 401 ohne Token, 403 für Regular User |
| 6 | `validation.test.ts` | Eingabevalidierung — 400 bei Mülldaten, Feld-Whitelist |
| 7 | `permissions.test.ts` | Directus Permission Boundaries — fremde balances/transactions/users unzugänglich |

### E2E Tests (Playwright)

| # | Datei | Was wird getestet |
|---|-------|-------------------|
| 8 | `auth.spec.ts` | Login/Logout — gültige Anmeldedaten redirecten, ungültige zeigen Fehler |
| 9 | `cook-flow.spec.ts` | Become Cook + Cook Panel Dish Input |
| 10 | `join-flow.spec.ts` | Join Meal, Teilnehmerzähler, BalanceWidget |

### CI/CD

| # | Datei | Was wird getestet |
|---|-------|-------------------|
| 11 | `.github/workflows/test.yml` | GitHub Actions — automatischer Teststart bei Push/PR |

### Ausführung

- Unit: `cd frontend && npx vitest run tests/unit/`
- API: `cd frontend && npx vitest run tests/api/`
- E2E: `cd frontend && npx playwright test tests/e2e/`

---

## Zusammenfassung

Dieser Harness verwandelt ein rohes LLM in einen Engineering-Agenten, der ohne ständige Aufsicht an einem Produktionsprojekt arbeiten kann. 9 Schichten (von Anweisungen bis Sandbox), 41+ Skills für verschiedene Aufgaben, 7 MCP-Tools für Dateien, Git, DB, Browser und Dokumentation, trigger-basiertes Speichersystem und Safety Gates, die vor katastrophalen Fehlern schützen.

Ohne diese Umgebung könnte das Modell nur Text generieren. Mit ihr liest und schreibt es Code, verwaltet das Directus-Schema, debuggt in Chrome DevTools, verwendet Live-Framework-Dokumentation, erstellt Flows und Automatisierungen.

**Der Harness — das ist der Unterschied zwischen "AI Plaudertasche" und "AI Engineer".**

# SparApp

Deine private Finanzübersicht: Einnahmen, Ausgaben, Fixkosten und Sparziele im
Blick. Alle Daten bleiben nur auf dem jeweiligen Handy – es gibt keinen Server
und keine Accounts. Jede Installation ist ihre eigene, private App.

## Für dich als Nutzer:in

Öffne den Link zur App in **Safari auf dem iPhone**, tippe unten auf das
Teilen-Symbol und dann auf **„Zum Home-Bildschirm"**. Danach hast du ein
eigenes App-Icon, und die App startet ohne Safari-Leiste – wie eine normale
App.

Wichtig: Mach regelmäßig ein **Backup** (Einstellungen → Sicherung →
„Backup exportieren"). Da alle Daten nur auf dem Handy liegen, sind sie bei
Verlust oder Defekt des Handys sonst weg.

## Für die Weitergabe an Kollegen

Jede Person installiert die App über denselben Link, aber durchläuft ihre
**eigene Ersteinrichtung** und bekommt ihre **eigenen, privaten Daten** – es
wird nichts geteilt oder synchronisiert.

## Entwicklung (technischer Hintergrund)

- **Stack:** Vite + React + TypeScript + Tailwind CSS
- **Speicherung:** IndexedDB im Browser (`idb`), keine Server-Anbindung
- **Installierbarkeit:** PWA über `vite-plugin-pwa` (Manifest, Service
  Worker, iOS-Meta-Tags)

### Lokal starten

```bash
npm install
npm run dev
```

### Für GitHub Pages bauen

```bash
npm run build
```

Das Ergebnis liegt danach im Ordner `dist/`.

### Deployment auf GitHub Pages einrichten (einmalig)

1. Ein neues, leeres GitHub-Repository namens **`sparapp`** anlegen (Name muss
   zum `repoName` in `vite.config.ts` passen, sonst Pfad dort anpassen).
2. Dieses Projekt dorthin pushen (`git remote add origin ...`, `git push -u
   origin main`).
3. Im GitHub-Repository unter **Settings → Pages** bei „Source" **„GitHub
   Actions"** auswählen.
4. Ab dem nächsten Push auf `main` baut und veröffentlicht die Action unter
   `.github/workflows/deploy.yml` die App automatisch unter
   `https://<dein-github-name>.github.io/sparapp/`.

Diesen Link kannst du dann an dich selbst und an Kollegen weitergeben.

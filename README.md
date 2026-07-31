# CV Creator

Lokale Web-App, die aus einem gepflegten Master-Lebenslauf pro Stellenanzeige eine
zugeschnittene Variante plus Anschreiben erzeugt — und beides als PDF exportiert.

Die KI macht genau drei Dinge: Notizen strukturieren, zuschneiden, Anschreiben
schreiben. Layout und Speicherung sind deterministischer Code.

## Einrichten

```bash
npm install
```

Dann `.env.local` anlegen (Vorlage: `.env.local.example`):

```
ANTHROPIC_API_KEY=sk-ant-...
```

Key gibt es unter <https://console.anthropic.com> → API Keys. **Ohne Key funktionieren
Editor, Vorschau und PDF-Export; die drei KI-Aktionen melden einen Hinweis.**

```bash
npm run dev
```

→ <http://localhost:3000>

Zum Ausprobieren mit Beispieldaten:

```bash
cp data/cv.example.json data/cv.json     # PowerShell: Copy-Item data/cv.example.json data/cv.json
```

## Ablauf

1. **Master-CV** (`/cv`) — einmal pflegen. Entweder direkt im Formular oder über
   „Notizen einwerfen“: unsortierten Text einfügen, Claude ordnet ihn in die Felder
   ein und ergänzt den bestehenden Stand. Übernommen wird erst mit „Speichern“.
2. **Neue Bewerbung** (`/`) — Firma, Rolle und den Text der Stellenanzeige einfügen.
   Claude priorisiert und formuliert um, und liefert dazu drei Listen: was es geändert
   hat, welche Begriffe der Anzeige belegt sind, und welche Anforderungen **keinen**
   Beleg im Master-CV haben.
3. **Bewerbung öffnen** — Anschreiben erzeugen, PDFs exportieren, oder mit demselben
   Anzeigentext neu zuschneiden.

### Die Lücken-Liste ist der Punkt

Der System-Prompt verbietet Claude, irgendetwas hinzuzufügen, das nicht im Master-CV
steht. Anforderungen ohne Beleg landen deshalb nicht im Lebenslauf, sondern in
`gaps` — sichtbar in der Bewerbungsansicht. Das ist die Liste, an der du entscheidest,
ob sich die Bewerbung lohnt oder ob dir nur ein Eintrag im Master-CV fehlt.

Prüfe trotzdem stichprobenartig gegen: LLM-Ausgabe ist kein Beweis.

## Daten

Alles liegt als JSON im Projekt, versionierbar mit Git:

| Pfad | Inhalt |
|---|---|
| `data/cv.json` | Master-CV — die einzige Quelle |
| `data/cv.example.json` | Beispiel zum Kopieren / als Formatreferenz |
| `data/applications/<slug>.json` | Pro Bewerbung: Anzeige, zugeschnittener CV, Anschreiben, Begründung, Lücken |
| `export/` | Erzeugte PDFs (gitignored) |

Die JSON-Dateien lassen sich von Hand editieren. Passt eine Datei nicht zum Schema,
kommt beim Laden eine Fehlermeldung mit dem konkreten Feld statt eines kaputten UIs.

## Aufbau

| Datei | Rolle |
|---|---|
| `lib/cv-schema.ts` | Ein Zod-Schema für Typen, Validierung **und** Claudes Structured Outputs |
| `lib/prompts.ts` | Die drei System-Prompts |
| `lib/claude.ts` | Alle API-Aufrufe, Fehlerübersetzung, Prompt-Caching |
| `lib/store.ts` | JSON-Dateien lesen/schreiben, jeweils gegen das Schema validiert |
| `components/CvDocument.tsx` | Layout des Lebenslaufs — bestimmt, wie das PDF aussieht |
| `app/api/pdf/route.ts` | Puppeteer rendert die Vorschauseite nach A4 |

Modell: `claude-opus-5`, adaptives Denken. Effort `high` fürs Zuschneiden und
Anschreiben, `medium` fürs Strukturieren von Notizen. Die Aufrufe nutzen
`messages.parse()` mit `zodOutputFormat()` — die Antwort ist damit garantiert
schema-konform, es gibt kein JSON-Parsing von Hand.

Der API-Key wird ausschließlich serverseitig in Route Handlers verwendet und erreicht
den Browser nie.

### Ein anderes Layout

`components/CvDocument.tsx` ist eine reine Präsentationskomponente ohne Datenzugriff.
Eine zweite Variante ist eine weitere Datei plus eine Zeile in den drei Stellen, die
sie einbinden (`app/preview/*`, `components/ApplicationView.tsx`, `components/CvEditor.tsx`).
Ränder liefert Puppeteer (`app/api/pdf/route.ts`), damit sie auf jeder Seite greifen —
im Print-CSS steht deshalb `padding: 0`.

## Befehle

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktionsbuild inkl. Typecheck
npm run typecheck  # nur Typen
```

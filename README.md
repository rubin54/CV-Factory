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
   Anzeigentext neu zuschneiden. Hier lässt sich auch das Design abweichend vom
   globalen Standard setzen — konservativ für Konzerne, mutiger für Startups.

## Design

Unter `/design` wird der Standard für alle Bewerbungen gesetzt, mit Live-Vorschau und
einem Vergleichsmodus, der alle Vorlagen nebeneinander zeigt.

**Drei Vorlagen:**

| Vorlage | Aufbau | Parser |
|---|---|---|
| **Linear** | Streng einspaltig mit fester Datumsspalte links. Wirkt über Typografie und Weißraum. | Maximal sicher |
| **Kompakt** | Kopfzeile über die volle Breite, schmale Seitenspalte für Kontakt/Kenntnisse/Sprachen, rechts der Fließtext. | Haupttext bleibt einspaltig |
| **Akzent** | Farbiges Kopfband, getönte Kacheln in der Seitenspalte, größere Typo. | Für Direktbewerbungen |

Dazu fünf abgestimmte Akzentfarben, vier Schriftpaarungen (Plex, Source, Grotesk,
Literata — bewusst keine System-Schriften), drei Dichtestufen und drei Seitenrandbreiten.
Kuratierte Sets statt freier Farb- und Größenwahl: ein Lebenslauf mit selbstgewählter
Farbe und Schrift sieht in den meisten Fällen schlechter aus als einer aus abgestimmten
Vorgaben.

**Bewerbungsfoto** — Upload unter `/design`, pro Bewerbung zuschaltbar. In Deutschland
üblich, in den USA, UK und weiten Teilen Europas dagegen unerwünscht. Das Bild liegt in
`data/` (nicht in `public/`) und wird über `/api/photo` ausgeliefert.

**Seitenränder** kommen von Puppeteer, nicht aus dem CSS — nur so greifen sie auf jeder
Seite und nicht bloß auf der ersten.

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
| `data/design.json` | Globale Design-Einstellungen |
| `data/photo.*` | Bewerbungsfoto, falls hochgeladen |
| `data/applications/<slug>.json` | Pro Bewerbung: Anzeige, zugeschnittener CV, Anschreiben, Begründung, Lücken, optional eigenes Design |
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
| `lib/design.ts` | Vorlagen, Paletten, Schriftpaarungen, Dichte- und Randstufen |
| `lib/fonts.ts` | Schriften über `next/font` — zur Buildzeit geladen, selbst gehostet |
| `components/templates/` | Die drei Vorlagen plus ihre gemeinsamen Bausteine |
| `app/api/pdf/route.ts` | Puppeteer rendert die Vorschauseite nach A4 |

Modell: `claude-opus-5`, adaptives Denken. Effort `high` fürs Zuschneiden und
Anschreiben, `medium` fürs Strukturieren von Notizen. Die Aufrufe nutzen
`messages.parse()` mit `zodOutputFormat()` — die Antwort ist damit garantiert
schema-konform, es gibt kein JSON-Parsing von Hand.

Der API-Key wird ausschließlich serverseitig in Route Handlers verwendet und erreicht
den Browser nie.

### Eine eigene Vorlage

Die Vorlagen sind reine Präsentationskomponenten ohne Datenzugriff. Alle Größen und
Farben kommen aus CSS-Variablen, die `designToCssVars()` auf den Dokument-Container
setzt — deshalb wirken Palette, Schrift und Dichte in jeder Vorlage automatisch.

Für eine neue Vorlage: Datei in `components/templates/` anlegen (die Bausteine aus
`shared.tsx` nehmen ab, was sich wiederholt), die ID in `TEMPLATE_IDS` und `TEMPLATES`
in `lib/design.ts` ergänzen und in die Registry in `components/CvDocument.tsx` eintragen.
Sonst nichts — Vorschau, PDF-Export und die Auswahl in der Oberfläche ziehen nach.

Beim Layout zwei Dinge beachten:

- `break-inside: avoid` auf `.doc-entry` verhindert, dass ein Eintrag am Seitenumbruch
  zerrissen wird. Chromium hält sich daran, auch innerhalb der Grid-Spalten.
- Eine durchgehend gefüllte Seitenspalte reißt beim Seitenumbruch am Seitenende ab.
  Deshalb arbeitet „Kompakt" mit einer Haarlinie und „Akzent" mit einzelnen Kacheln
  statt mit einer Fläche über die ganze Spalte.

## Befehle

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktionsbuild inkl. Typecheck
npm run typecheck  # nur Typen
```

# CV Factory

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

### Ohne API-Aufrufe arbeiten

`CV_FACTORY_CLAUDE=fixture` in der `.env.local` schaltet die drei KI-Aktionen auf
aufgezeichnete Antworten aus `data/fixtures/` um. Kein Key, keine Kosten, keine zwei
Minuten Wartezeit — die App verhält sich sonst identisch. Das ist der Modus zum
Arbeiten an Vorlagen, Layout und Bedienung.

Fixtures laufen durch dasselbe Zod-Schema wie eine echte Antwort. Eine Aufzeichnung,
die nach einer Schema-Änderung nicht mehr passt, fällt deshalb mit einer klaren
Meldung auf, statt still mit Daten weiterzuarbeiten, die die API nicht mehr liefern
würde.

`CV_FACTORY_CLAUDE=record` ruft normal auf und legt die Antwort zusätzlich als Fixture
ab. Einmal pro Aktion aufnehmen, danach reicht `fixture`.

Die mitgelieferten Fixtures sind von Hand aus `cv.example.json` gebaut und als solche
erkennbar — sie zeigen, dass der Modus aktiv ist.

## Ablauf

1. **Master-CV** (`/cv`) — einmal pflegen. Entweder direkt im Formular, über
   „Notizen einwerfen“ (unsortierten Text einfügen, Claude ordnet ihn in die Felder ein
   und ergänzt den bestehenden Stand) oder über **„Bestehenden Lebenslauf einlesen“**:
   PDF, DOCX oder Textdatei. Ein PDF geht unverändert an die API — Claude liest die
   Seiten samt Layout, statt hier zu Text zerlegt zu werden, was bei zweispaltigen
   Lebensläufen die Spalten ineinanderschiebt. Übernommen wird in allen drei Fällen
   erst mit „Speichern“.
2. **Neue Bewerbung** (`/`) — Firma, Rolle und den Text der Stellenanzeige einfügen.
   Claude priorisiert und formuliert um, und liefert dazu drei Listen: was es geändert
   hat, welche Begriffe der Anzeige belegt sind, und welche Anforderungen **keinen**
   Beleg im Master-CV haben.
3. **Bewerbung öffnen** — Anschreiben erzeugen, PDFs exportieren, oder mit demselben
   Anzeigentext neu zuschneiden. Hier lässt sich auch das Design abweichend vom
   globalen Standard setzen — konservativ für Konzerne, mutiger für Startups.
4. **Status pflegen** — Entwurf, Beworben, Gespräch, Absage, Zusage, dazu ein Notizfeld
   für Termin, Ansprechpartner oder den Grund der Absage. Der Status steht als Kennzeichen
   in der Liste auf der Startseite; das Datum wird nur gestempelt, wenn sich der Status
   wirklich ändert, nicht beim Bearbeiten der Notiz.

## Design

Unter `/design` wird der Standard für alle Bewerbungen gesetzt, mit Live-Vorschau und
einem Vergleichsmodus, der alle Vorlagen nebeneinander zeigt.

**Fünf Vorlagen:**

| Vorlage | Aufbau | Parser |
|---|---|---|
| **Klassik** | Zentrierte Kopfzeile, Kontaktzeile mit Trennstrichen, Abschnittstitel über einer Linie. Der De-facto-Standard in der Tech-Branche. | Maximal sicher |
| **Linear** | Streng einspaltig mit fester Datumsspalte links. Die Zeiträume bilden eine durchgehende Achse. | Maximal sicher |
| **Kompakt** | Kopfzeile über die volle Breite, schmale Seitenspalte links für Nachschlagbares, rechts der Fließtext. | Haupttext einspaltig |
| **Akzent** | Farbiges Kopfband, getönte Kacheln in der Seitenspalte, größere Typo. | Für Direktbewerbungen |
| **Dicht** | Zweispaltiges Raster mit Seitenspalte rechts, für viele Stationen und Projekte. | Das riskanteste Layout |

Dazu fünf abgestimmte Akzentfarben und vier Schriftpaarungen (Plex, Source, Grotesk,
Literata — bewusst keine System-Schriften). Farben und Schriften sind kuratierte Sets;
Schriftgröße, Zeilenabstand, Abstände und Seitenrand dagegen stufenlos, weil der
Auto-Fit dazwischen sucht.

### Seitenumbrüche und Auto-Fit

Die Vorschau zeichnet ein, wo die Seiten umbrechen, und zeigt die Seitenzahl. Berechnet
wird das nach demselben Modell, das auch Chromium beim Druck anwendet: Blöcke mit
`break-inside: avoid` werden nicht zerschnitten, sondern komplett auf die nächste Seite
geschoben. Über 30 Vergleiche (5 Vorlagen × 6 Lebenslauflängen) stimmte die angezeigte
Seitenzahl exakt mit dem exportierten PDF überein.

„Auf 1 Seite" sucht per Binärsuche die größte Schrift, bei der es noch passt: erst
Schriftgröße, Zeilenabstand und Abstände gemeinsam, dann ein zweiter Durchlauf, der den
Zeilenabstand wieder aufmacht, solange die Seitenzahl hält. Gemessen wird am echten
Layout über CSS-Variablen, ohne React dazwischen.

### Abschnitte

Reihenfolge, Sichtbarkeit und — bei den Vorlagen mit Seitenspalte — die Spaltenzuordnung
sind einstellbar, global und pro Bewerbung. Die Voreinstellung folgt dem, was für
Software-Lebensläufe empfohlen wird: Profil, Erfahrung, Projekte, Ausbildung im
Hauptteil, Nachschlagbares in die Seitenspalte.

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

Für den zweiten Fall führt „Beleg ergänzen“ direkt in die Notizen des Master-CVs, mit
der Lücke schon eingetragen und einem Rückweg zur Bewerbung. Ergänzen, speichern,
zurück, neu zuschneiden — die Lücke ist damit ein Arbeitsschritt statt einer Sackgasse.

Prüfe trotzdem stichprobenartig gegen: LLM-Ausgabe ist kein Beweis.

## Daten

Alles liegt als JSON im Projekt, versionierbar mit Git:

| Pfad | Inhalt |
|---|---|
| `data/cv.json` | Master-CV — die einzige Quelle |
| `data/cv.example.json` | Beispiel zum Kopieren / als Formatreferenz |
| `data/design.json` | Globale Design-Einstellungen |
| `data/photo.*` | Bewerbungsfoto, falls hochgeladen |
| `data/applications/<slug>.json` | Pro Bewerbung: Anzeige, zugeschnittener CV, Anschreiben, Begründung, Lücken, Status, Aufwand, optional eigenes Design |
| `data/fixtures/*.json` | Aufgezeichnete Claude-Antworten für den Fixture-Modus |
| `data/.backups/` | Vorherige Stände, automatisch (gitignored) |
| `export/` | Erzeugte PDFs (gitignored) |

Die JSON-Dateien lassen sich von Hand editieren. Passt eine Datei nicht zum Schema,
kommt beim Laden eine Fehlermeldung mit dem konkreten Feld statt eines kaputten UIs.

### Sicherungen

Jedes Schreiben legt den vorherigen Stand unter `data/.backups/<datei>/<zeitstempel>.json`
ab, die letzten 25 pro Datei bleiben. Geschrieben wird über eine temporäre Datei mit
anschließendem Umbenennen — ein Abbruch mitten im Schreiben hinterlässt damit entweder
den alten oder den neuen Stand, nie eine halbe Datei.

Zurückholen geht in der Oberfläche: Karte „Sicherungen“ auf der CV- und der
Bewerbungsseite. Das Wiederherstellen ist selbst ein Schreibvorgang und wird deshalb
ebenfalls gesichert — ein Fehlgriff kostet nichts. Vor dem Zurückschreiben läuft der
Stand durch das Schema; eine Sicherung, die nicht mehr passt, wird abgelehnt, statt
die App lahmzulegen.

Das deckt die zwei Fälle ab, in denen bisher etwas verloren ging: ein „Einarbeiten“
oder ein Import, der den Master-CV verschlechtert, und ein „Neu zuschneiden“, das den
vorherigen Zuschnitt samt Anschreiben überschreibt.

### Was ein Aufruf gekostet hat

Zu jedem Claude-Aufruf werden Tokenzahlen, Dauer und eine Kostenschätzung mitgeschrieben
und pro Bewerbung unter „Aufwand“ aufgelistet; die Summe über alle Bewerbungen steht auf
der Startseite. Während eines Aufrufs läuft eine Sekundenanzeige mit — bei ein bis zwei
Minuten Laufzeit ist ein bloßer Spinner nicht von einem Hänger zu unterscheiden.

Die Kosten sind eine **Schätzung** aus der Preistabelle in `lib/claude.ts`, keine
abgerechneten Beträge. Stimmt die Tabelle nicht mehr, lässt sie sich über
`CV_FACTORY_PRICE_IN` / `CV_FACTORY_PRICE_OUT` korrigieren.

## Aufbau

| Datei | Rolle |
|---|---|
| `lib/cv-schema.ts` | Ein Zod-Schema für Typen, Validierung **und** Claudes Structured Outputs |
| `lib/prompts.ts` | Die drei System-Prompts |
| `lib/claude.ts` | Alle API-Aufrufe, Fehlerübersetzung, Prompt-Caching, Fixture-Modus, Kostenschätzung |
| `lib/store.ts` | JSON-Dateien lesen/schreiben, jeweils gegen das Schema validiert, mit Sicherung |
| `lib/design.ts` | Vorlagen, Paletten, Schriftpaarungen, Abschnittsplan, Größen |
| `lib/paginate.ts` | Rechnet nach, wo Chromium umbricht — Grundlage für Vorschau und Auto-Fit |
| `lib/autofit.ts` | Binärsuche nach der größten Schrift, die noch passt |
| `lib/fonts.ts` | Schriften über `next/font` — zur Buildzeit geladen, selbst gehostet |
| `components/templates/sections.tsx` | Die Abschnitte als Bausteine; Reihenfolge kommt aus dem Design |
| `components/templates/` | Die fünf Vorlagen plus ihre gemeinsamen Bausteine |
| `components/app/` | Hülle der Oberfläche: Seitenleiste, Reiter, Einblendungen, Farbschema |
| `app/api/pdf/route.ts` | Puppeteer rendert die Vorschauseite nach A4 |

Modell: `claude-opus-5`, adaptives Denken. Effort `high` fürs Zuschneiden und
Anschreiben, `medium` fürs Strukturieren von Notizen und den Import. Die Aufrufe nutzen
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

Beim Layout vier Dinge beachten — alle am exportierten PDF gemessen, nicht vermutet:

- **Sperrung ab etwa 0,11 em zerlegt Text.** Chromium schreibt weit gesperrte
  Überschriften glyphenweise ins PDF; die Textextraktion — und damit jeder ATS-Parser —
  liest dann `B E R U F S E R F A H R U N G`. Die Abschnittstitel stehen deshalb auf
  0,08 em.
- **`font-variant-caps: all-small-caps` zerlegt Text immer**, unabhängig von der
  Sperrung: Chromium synthetisiert Kapitälchen glyphenweise. „Klassik" nutzt deshalb
  `text-transform: uppercase` in kleinerem Grad statt echter Kapitälchen.
- **`break-inside: avoid` auf `.doc-entry`** verhindert, dass ein Eintrag am
  Seitenumbruch zerrissen wird. Chromium hält sich daran, auch innerhalb der Grid-Spalten.
- **Eine durchgehend gefüllte Seitenspalte reißt beim Seitenumbruch ab.** Deshalb
  arbeitet „Kompakt" mit einer Haarlinie und „Akzent" mit einzelnen Kacheln statt mit
  einer Fläche über die ganze Spalte.

Die Spaltenlayouts stellen im DOM immer den Hauptteil vor die Seitenspalte und
positionieren die Spalte per Grid — so liest ein Parser die Berufserfahrung vor der
Kenntnisliste, obwohl sie rechts steht.

## Oberfläche

Seitenleiste mit den drei Bereichen, darüber eine klebende Kopfzeile. Hell und dunkel
umschaltbar (unten links); die Wahl liegt im `localStorage`, ein Inline-Skript setzt sie
vor dem ersten Paint, damit nichts aufblitzt.

**Das Dokument bleibt in beiden Modi weiß.** Die Tokens sind getrennt: `--app-*` für die
Hülle, die Dokument-Variablen kommen weiterhin aus `designToCssVars()`. Ein Lebenslauf
wird gedruckt — ein dunkles Blatt wäre falsch.

Gegen den langen Scroll: im Editor eine Sprungleiste über die Abschnitte und
zusammenklappbare Karten, im Design-Panel Reiter statt eines Stapels. Rückmeldungen
erscheinen als kurze Einblendung unten rechts, statt als Banner den Inhalt zu verschieben.

## Befehle

```bash
npm run dev        # Entwicklungsserver
npm run build      # Produktionsbuild inkl. Typecheck
npm run typecheck  # nur Typen
```

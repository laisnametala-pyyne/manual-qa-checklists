# Checklist spec and rendering

The page is rendered from a JSON spec, so every checklist has the same layout: tick boxes, a progress bar, notes, **Copy results**, **Reset ticks**, Copy buttons, both themes and a phone layout. Ticks and notes are kept in the browser's localStorage under `storageKey`.

## Render and serve

```bash
node scripts/render-checklist.mjs spec.json qa/index.html
python3 -m http.server 4410 --bind 127.0.0.1 --directory qa
```

Give the tester `http://localhost:4410/index.html?v=1`. Change `?v=` each time you re-render, so the browser can't show an old copy. Ticks survive a change of `?v=`, because localStorage is kept per origin. Opening the file directly (`file://`) also works. Node 18 or later; no dependencies.

The renderer refuses duplicate step ids. Copy buttons copy exactly the value shown, with no trailing newline.

## Top-level fields

| Field | What it is |
|---|---|
| `title` | Page title and heading, two to four words |
| `eyebrow` | Small line above the title: PR, environment, account type |
| `lede` | One or two sentences: what is checked, the parts and how long they take |
| `storageKey` | Unique per checklist, for example `"pr-1234-staging-qa"` |
| `resultsTitle` | First line of **Copy results** |
| `legend`, `legendText` | Optional. Chips to explain, for example `["optional", "claude"]` and `{"optional": "skip if short on time"}` |
| `notesPlaceholder` | Hint in the notes box |
| `cards` | Setup cards: before you start, starting values, known behaviours, not covered |
| `parts` | `[{ "title", "intro", "sections": [{ "title", "intro", "steps": [...] }] }]` |

## A step

```json
{
  "id": "A3.2",
  "title": "A text answer and Undo",
  "chip": "optional",
  "actions": [
    { "text": "Click [[Edit answers]]. Paste into [[TYPOGRAPHY]]:", "paste": { "id": "a32-typography", "value": "QA 11-13: Inter for body" } },
    "Click [[Undo]] beside the label."
  ],
  "expect": "After the paste: an [[EDITED]] tag and \"**1 answer changed** · not saved yet\". [[Undo]] empties the box."
}
```

- `chip` is optional: `new`, `same` (unchanged wording), `optional` or `claude` (a check the assistant runs).
- `expectLabel` is optional and replaces "Expect:" (for example "Then:").
- An action is either a string, or an object with `text` and either `paste` or `pastes` (a list).
- A paste is either `{ "id", "value" }` or `{ "repeat", "times", "preview" }`. The second copies a generated string, for example 6,000 characters to test a length limit. `preview` is what the page shows.
- Paste `id`s must be unique on the page.

## Card blocks

`{ "p": "…" }` for a paragraph, `{ "small": "…" }` for muted small text, `{ "ul": ["…", "…"] }` for a list, `{ "callout": "…" }` for an amber callout. A starting value is `{ "label": "…", "value": "…", "id": "…", "note": "…" }`; with an `id` it gets a Copy button.

## Markup inside any text

| Write | Renders as |
|---|---|
| `[[Save changes]]` | An on-screen label, boxed. Write it exactly as displayed, capitals included |
| `{{Cmd}}` | A key |
| `**Save 2 answers?**` | Bold, for dialog titles |
| `@@https://example.com/page\|link text@@` | A link that opens in a new tab |

Everything else is escaped, so `<script>` in a paste value shows as text.

See `example-spec.json` for a small complete spec.

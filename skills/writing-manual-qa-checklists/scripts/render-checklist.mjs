#!/usr/bin/env node
// Renders a manual QA checklist page from a JSON spec: node render-checklist.mjs spec.json out.html
// Text fields accept a small markup: [[On-screen label]], {{Key}}, **bold**, @@https://url|link text@@.
import { readFileSync, writeFileSync } from "node:fs";

const CHIP_LABELS = { new: "New", same: "Unchanged", optional: "Optional", claude: "Claude" };

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inline(text) {
  return escapeHtml(text)
    .replace(/@@(\S+?)\|(.+?)@@/g, '<a href="$1" target="_blank" rel="noopener">$2</a>')
    .replace(/\[\[(.+?)\]\]/g, '<span class="ui">$1</span>')
    .replace(/\{\{(.+?)\}\}/g, "<kbd>$1</kbd>")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
}

function pasteBlock(paste) {
  const button = (attrs) => `<button type="button" ${attrs}>Copy</button>`;
  if (paste.repeat !== undefined) {
    const attrs = `data-repeat="${escapeHtml(paste.repeat)}" data-times="${Number(paste.times)}"`;
    return `<div class="paste"><pre>${escapeHtml(paste.preview)}</pre>${button(attrs)}</div>`;
  }
  return `<div class="paste"><pre id="${escapeHtml(paste.id)}">${escapeHtml(paste.value)}</pre>${button(`data-copy="${escapeHtml(paste.id)}"`)}</div>`;
}

function action(item) {
  if (typeof item === "string") return `<li>${inline(item)}</li>`;
  const pastes = (item.pastes ?? (item.paste ? [item.paste] : [])).map(pasteBlock).join("");
  return `<li>${inline(item.text)}${pastes}</li>`;
}

function chip(kind) {
  if (kind === undefined) return "";
  return ` <span class="chip chip-${kind}">${CHIP_LABELS[kind]}</span>`;
}

function step(item) {
  const expectLabel = item.expectLabel ?? "Expect:";
  return `<li class="step"><div class="step-card">
  <label class="step-check">
    <input type="checkbox" data-step="${escapeHtml(item.id)}" data-title="${escapeHtml(item.title)}">
    <span class="step-no">${escapeHtml(item.id)}</span>
    <span class="step-title">${inline(item.title)}${chip(item.chip)}</span>
  </label>
  <div class="step-body">
    <ol class="acts">${item.actions.map(action).join("")}</ol>
    <p class="expect"><b>${escapeHtml(expectLabel)}</b> ${inline(item.expect)}</p>
  </div>
</div></li>`;
}

function block(item) {
  if (item.p !== undefined) return `<p>${inline(item.p)}</p>`;
  if (item.small !== undefined) return `<p class="small">${inline(item.small)}</p>`;
  if (item.ul !== undefined) return `<ul>${item.ul.map((line) => `<li>${inline(line)}</li>`).join("")}</ul>`;
  if (item.callout !== undefined) return `<div class="callout">${inline(item.callout)}</div>`;
  if (item.value !== undefined) {
    const copy = item.id === undefined ? "" : `<button type="button" data-copy="${escapeHtml(item.id)}">Copy</button>`;
    const id = item.id === undefined ? "" : ` id="${escapeHtml(item.id)}"`;
    return `<div class="start-value"><div class="start-value-head"><span class="value-label">${inline(item.label)}</span>${copy}</div><pre${id}>${escapeHtml(item.value)}</pre>${item.note === undefined ? "" : `<p class="small">${inline(item.note)}</p>`}</div>`;
  }
  throw new Error(`Unknown card block: ${JSON.stringify(item)}`);
}

function card(item) {
  return `<div class="card"><h3>${inline(item.title)}</h3>${item.blocks.map(block).join("")}</div>`;
}

function section(item) {
  const intro = item.intro === undefined ? "" : `<p class="section-intro">${inline(item.intro)}</p>`;
  return `<h3 class="section-title">${inline(item.title)}</h3>${intro}<ol class="steps">${item.steps.map(step).join("")}</ol>`;
}

function part(item) {
  const intro = item.intro === undefined ? "" : `<p class="part-intro">${inline(item.intro)}</p>`;
  return `<h2>${inline(item.title)}</h2>${intro}${item.sections.map(section).join("")}`;
}

function assertUniqueIds(spec) {
  const ids = spec.parts.flatMap((p) => p.sections.flatMap((s) => s.steps.map((st) => st.id)));
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) throw new Error(`Duplicate step ids: ${duplicates.join(", ")}`);
}

const [specPath, outPath] = process.argv.slice(2);
const spec = JSON.parse(readFileSync(specPath, "utf8"));
assertUniqueIds(spec);
const template = readFileSync(new URL("./checklist-template.html", import.meta.url), "utf8");
const legend = spec.legend
  ? `<div class="legend small">${spec.legend.map((kind) => `<span><span class="chip chip-${kind}">${CHIP_LABELS[kind]}</span> ${escapeHtml(spec.legendText[kind])}</span>`).join("")}</div>`
  : "";
const slots = {
  "{{TITLE}}": escapeHtml(spec.title),
  "{{EYEBROW}}": inline(spec.eyebrow),
  "{{HEADING}}": inline(spec.title),
  "{{LEDE}}": inline(spec.lede),
  "{{LEGEND}}": legend,
  "{{CARDS}}": spec.cards.map(card).join(""),
  "{{PARTS}}": spec.parts.map(part).join(""),
  "{{NOTES_PLACEHOLDER}}": escapeHtml(spec.notesPlaceholder),
  "{{STORAGE_KEY}}": JSON.stringify(spec.storageKey),
  "{{RESULTS_TITLE}}": JSON.stringify(spec.resultsTitle),
};
// A replacer function keeps "$&"-style sequences in the content literal.
const html = Object.entries(slots).reduce((page, [slot, value]) => page.replace(slot, () => value), template);
writeFileSync(outPath, html);
const stepCount = spec.parts.reduce((sum, p) => sum + p.sections.reduce((n, s) => n + s.steps.length, 0), 0);
console.log(`Wrote ${outPath}: ${stepCount} steps`);

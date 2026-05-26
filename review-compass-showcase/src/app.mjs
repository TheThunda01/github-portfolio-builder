import {
  buildEligibility,
  buildExportMarkdown,
  buildCommonGapChecks,
  buildPrismaSearchItems,
  buildQuestion,
  buildReadinessGuidance,
  buildRationale,
  buildReportingChecklist,
  buildReviewTypeGuide,
  buildSearchNotes,
  buildSearchString,
  buildSearchTerms,
  buildExtractionRows,
  computeReadiness,
  defaultProject,
  getDatabase,
  getFramework,
  getReviewTypeMatrix,
  getReviewTypeOptions,
  getSourceList,
  normalizeText,
  reviewTypeName,
  screenRecord
} from "./reviewLogic.mjs";

const STORAGE_KEY = "review-compass-project-v1";
const RECORD_KEY = "review-compass-record-v1";
const NOTES_KEY = "review-compass-notes-v1";

const form = document.querySelector("#project-form");
const projectTitle = document.querySelector("#project-title");
const readinessScore = document.querySelector("#readiness-score");
const readinessLabel = document.querySelector("#readiness-label");
const frameworkLabel = document.querySelector("#framework-label");
const sourceCount = document.querySelector("#source-count");
const reviewerLabel = document.querySelector("#reviewer-label");
const reviewTypeSelect = document.querySelector("#review-type-select");
const guideOutput = document.querySelector("#guide-output");
const notesInput = document.querySelector("#notes-input");
const notesPrompts = document.querySelector("#notes-prompts");
const questionOutput = document.querySelector("#question-output");
const searchOutput = document.querySelector("#search-output");
const databaseSelect = document.querySelector("#database-select");
const recordInput = document.querySelector("#record-input");
const screenOutput = document.querySelector("#screen-output");
const extractOutput = document.querySelector("#extract-output");
const reportOutput = document.querySelector("#report-output");
const toast = document.querySelector("#toast");

let toastTimer = null;

const state = {
  project: loadProject(),
  databaseKey: "pubmed",
  notes: readStorage(NOTES_KEY) || "",
  recordText:
    readStorage(RECORD_KEY) ||
    "A cross-sectional survey of college students examined food insecurity, grade point average, retention concerns, and symptoms of anxiety during the academic year."
};

populateReviewTypes();
hydrateForm();
render();

form.addEventListener("input", () => {
  state.project = readForm();
  saveProject();
  render();
});

databaseSelect.addEventListener("change", () => {
  state.databaseKey = databaseSelect.value;
  renderSearch();
});

recordInput.addEventListener("input", () => {
  state.recordText = recordInput.value;
  writeStorage(RECORD_KEY, state.recordText);
  renderScreening();
});

notesInput.addEventListener("input", () => {
  state.notes = notesInput.value;
  writeStorage(NOTES_KEY, state.notes);
});

document.querySelector(".tab-list").addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab]");
  if (!button) return;
  activateTab(button.dataset.tab);
});

document.querySelector(".tab-list").addEventListener("keydown", (event) => {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;

  const tabs = [...document.querySelectorAll("[data-tab]")];
  const currentIndex = tabs.findIndex((tabButton) => tabButton === document.activeElement);
  if (currentIndex < 0) return;

  event.preventDefault();
  const nextIndex = getNextTabIndex(event.key, currentIndex, tabs.length);
  const nextTab = tabs[nextIndex];
  activateTab(nextTab.dataset.tab);
  nextTab.focus();
});

document.querySelector("#reset-button").addEventListener("click", () => {
  state.project = { ...defaultProject };
  state.notes = "";
  state.recordText =
    "A cross-sectional survey of college students examined food insecurity, grade point average, retention concerns, and symptoms of anxiety during the academic year.";
  hydrateForm();
  saveProject();
  writeStorage(NOTES_KEY, state.notes);
  writeStorage(RECORD_KEY, state.recordText);
  render();
  showToast("The sample project has been restored.");
});

document.querySelector("#copy-button").addEventListener("click", async () => {
  const markdown = buildExportMarkdown(state.project, state.databaseKey, state.recordText, state.notes);
  try {
    await copyText(markdown);
    showToast("The project packet is copied.");
  } catch {
    showToast("Copy was unavailable. Export still works.");
  }
});

document.querySelector("#download-button").addEventListener("click", () => {
  const markdown = buildExportMarkdown(state.project, state.databaseKey, state.recordText, state.notes);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "review-compass-project-packet.md";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("The project packet has been exported.");
});

function loadProject() {
  try {
    const saved = JSON.parse(readStorage(STORAGE_KEY) || "null");
    const project = saved && typeof saved === "object" ? { ...defaultProject, ...saved } : { ...defaultProject };
    const supportedTypes = new Set(getReviewTypeOptions().map((option) => option.value));
    return supportedTypes.has(project.reviewType) ? project : { ...project, reviewType: defaultProject.reviewType };
  } catch {
    return { ...defaultProject };
  }
}

function saveProject() {
  writeStorage(STORAGE_KEY, JSON.stringify(state.project));
}

function hydrateForm() {
  for (const [key, value] of Object.entries(state.project)) {
    const field = form.elements.namedItem(key);
    if (field) field.value = value;
  }
  recordInput.value = state.recordText;
  notesInput.value = state.notes;
  databaseSelect.value = state.databaseKey;
}

function readForm() {
  const data = new FormData(form);
  return Object.fromEntries([...data.entries()].map(([key, value]) => [key, normalizeText(value)]));
}

function render() {
  renderStatus();
  renderGuide();
  renderQuestion();
  renderSearch();
  renderScreening();
  renderExtraction();
  renderReport();
}

function renderGuide() {
  const guide = buildReviewTypeGuide(state.project);
  const gaps = buildCommonGapChecks(state.project);
  const matrix = getReviewTypeMatrix();
  const selectedType = guide.selected.type;

  guideOutput.innerHTML = `
    <section class="method-hero" aria-labelledby="method-fit-title">
      <div class="method-copy">
        <p class="surface-label">Review fit</p>
        <h4 id="method-fit-title">${escapeHtml(guide.selected.label)}</h4>
        <p>${escapeHtml(guide.selected.bestFor)}</p>
        <div class="tag-row">
          <span class="tag">${escapeHtml(guide.selected.frame)}</span>
          <span class="tag">${escapeHtml(guide.selected.output)}</span>
        </div>
      </div>
      <div class="method-warning">
        <strong>Watch-out</strong>
        <p>${escapeHtml(guide.selected.caution)}</p>
      </div>
    </section>

    <section class="route-board" aria-labelledby="route-title">
      <div class="board-heading">
        <p class="surface-label">Decision diagram</p>
        <h4 id="route-title">Choose by purpose</h4>
      </div>
      <div class="route-map">
        ${guide.decisionPath
          .map(
            (step, index) => `
            <article class="route-step ${step.active ? "is-active" : ""}">
              <span aria-hidden="true">${index + 1}</span>
              <strong>${escapeHtml(step.label)}</strong>
              <p>${escapeHtml(step.detail)}</p>
            </article>`
          )
          .join("")}
      </div>
    </section>

    <section class="gap-board" aria-labelledby="gap-chart-title">
      <div class="board-heading">
        <p class="surface-label">Common gaps chart</p>
        <h4 id="gap-chart-title">Needs to check before the review grows</h4>
      </div>
      <div class="gap-chart">
        ${gaps
          .map(
            (gap) => `
            <article class="gap-row ${gap.status}">
              <div>
                <strong>${escapeHtml(gap.gap)}</strong>
                <p>${escapeHtml(gap.need)}</p>
              </div>
              <div class="gap-meter" aria-label="${escapeHtml(gap.gap)} score ${gap.score} percent">
                <span style="width: ${gap.score}%"></span>
              </div>
              <em>${escapeHtml(gap.statusLabel)}</em>
            </article>`
          )
          .join("")}
      </div>
    </section>

    <section class="matrix-board" aria-labelledby="matrix-title">
      <div class="board-heading">
        <p class="surface-label">Comparison table</p>
        <h4 id="matrix-title">Review type quick match</h4>
      </div>
      <div class="table-wrap guide-table">
        <table>
          <thead>
            <tr>
              <th>Review type</th>
              <th>Best fit</th>
              <th>Frame</th>
              <th>Output</th>
              <th>Caution</th>
            </tr>
          </thead>
          <tbody>
            ${matrix
              .map(
                (row) => `
                <tr class="${row.type === selectedType ? "selected-row" : ""}">
                  <td data-label="Review type"><strong>${escapeHtml(row.label)}</strong></td>
                  <td data-label="Best fit">${escapeHtml(row.bestFor)}</td>
                  <td data-label="Frame">${escapeHtml(row.frame)}</td>
                  <td data-label="Output">${escapeHtml(row.output)}</td>
                  <td data-label="Caution">${escapeHtml(row.caution)}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="alternate-board" aria-labelledby="alternate-title">
      <div class="board-heading">
        <p class="surface-label">Maybe compare</p>
        <h4 id="alternate-title">Nearby options</h4>
      </div>
      <div class="alternate-grid">
        ${guide.alternatives
          .map(
            (row) => `
            <article>
              <strong>${escapeHtml(row.label)}</strong>
              <p>${escapeHtml(row.bestFor)}</p>
            </article>`
          )
          .join("")}
      </div>
    </section>
  `;

  notesPrompts.innerHTML = guide.mentorPrompts
    .map((prompt) => `<button type="button" class="prompt-chip">${escapeHtml(prompt)}</button>`)
    .join("");
}

function renderStatus() {
  const readiness = computeReadiness(state.project);
  const readinessGuidance = buildReadinessGuidance(state.project);
  const framework = getFramework(state.project.reviewType);
  const sources = getSourceList(state.project);
  const teamPlan = normalizeText(state.project.teamPlan).toLowerCase();
  const reviewerMode = teamPlan.includes("two") || teamPlan.includes("dual") || teamPlan.includes("independent") ? "Dual" : "Single";

  projectTitle.textContent = normalizeText(state.project.topic) || "Review plan";
  readinessScore.textContent = `${readiness}%`;
  readinessLabel.textContent = readinessGuidance.label;
  frameworkLabel.textContent = framework.label;
  sourceCount.textContent = String(sources.length);
  reviewerLabel.textContent = reviewerMode;
}

function renderQuestion() {
  const framework = getFramework(state.project.reviewType);
  const eligibility = buildEligibility(state.project);
  const terms = buildSearchTerms(state.project);
  const readinessGuidance = buildReadinessGuidance(state.project);
  questionOutput.innerHTML = [
    block("Working Question", `<p>${escapeHtml(buildQuestion(state.project))}</p>`, "full"),
    block(
      `${framework.label} Frame`,
      `<p>${escapeHtml(framework.name)}.</p><p>${escapeHtml(framework.rationale)}</p>${tagRow([
        reviewTypeName(state.project.reviewType),
        framework.label
      ])}`
    ),
    block("Rationale", `<p>${escapeHtml(buildRationale(state.project))}</p>`),
    block(
      "Eligibility",
      `<ul>${eligibility.map((row) => `<li><strong>${escapeHtml(row.label)}:</strong> ${escapeHtml(row.text)}</li>`).join("")}</ul>`,
      "full"
    ),
    block(
      "Search Concepts",
      terms.length
        ? terms
            .map((group) => `<p><strong>${escapeHtml(group.label)}:</strong> ${escapeHtml(group.terms.join(", "))}</p>`)
            .join("")
        : `<p>${escapeHtml("Add population, concept, and outcome or context terms to create search concepts.")}</p>`,
      "full"
    ),
    block(
      "Next Method Check",
      `<ul>${readinessGuidance.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`,
      "full"
    )
  ].join("");
}

function renderSearch() {
  const database = getDatabase(state.databaseKey);
  const searchString = buildSearchString(state.project, state.databaseKey);
  const notes = buildSearchNotes(state.project, state.databaseKey);
  searchOutput.innerHTML = `
    <div>
      <pre class="search-code" aria-label="${escapeHtml(database.label)} search draft">${escapeHtml(searchString)}</pre>
    </div>
    <div class="search-notes">
      ${notes
        .map(
          (note) => `
          <section class="note ${note.tone === "warning" ? "warning" : ""}">
            <p><strong>${escapeHtml(note.title)}.</strong> ${escapeHtml(note.text)}</p>
          </section>`
        )
        .join("")}
    </div>
  `;
}

function renderScreening() {
  const result = screenRecord(state.recordText, state.project);
  const badgeClass = result.decision.toLowerCase();
  screenOutput.innerHTML = `
    <div class="decision-badge ${badgeClass}">${escapeHtml(result.decision)} with ${escapeHtml(result.confidence.toLowerCase())} confidence</div>
    <h4>Decision Rationale</h4>
    <ul>${result.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>
    ${
      result.matchedTerms.length
        ? `<p class="field-note">Matched terms: ${escapeHtml(result.matchedTerms.join(", "))}.</p>`
        : `<p class="field-note">No project terms were matched yet.</p>`
    }
  `;
}

function renderExtraction() {
  const rows = buildExtractionRows(state.project);
  extractOutput.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Definition</th>
          <th>Reviewer note</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td data-label="Field"><strong>${escapeHtml(row.field)}</strong></td>
            <td data-label="Definition">${escapeHtml(row.description)}</td>
            <td data-label="Reviewer note">${escapeHtml(row.note)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderReport() {
  const checklist = buildReportingChecklist(state.project);
  const prismaSearch = buildPrismaSearchItems();
  reportOutput.innerHTML = [
    ...checklist,
    {
      title: "PRISMA-S search file",
      text: `Keep a search file that covers ${prismaSearch.length} search-reporting items, including databases, full strategies, dates, limits, deduplication, and records management.`
    }
  ]
    .map(
      (item) => `
      <section class="check-item">
        <span class="check-dot" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"></path></svg>
        </span>
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.text)}</p>
        </div>
      </section>`
    )
    .join("");
}

function populateReviewTypes() {
  reviewTypeSelect.innerHTML = getReviewTypeOptions()
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
}

notesPrompts.addEventListener("click", (event) => {
  const prompt = event.target.closest(".prompt-chip");
  if (!prompt) return;
  const addition = prompt.textContent.trim();
  const prefix = state.notes.trim() ? "\n\n" : "";
  state.notes = `${state.notes}${prefix}- ${addition}`;
  notesInput.value = state.notes;
  writeStorage(NOTES_KEY, state.notes);
  showToast("That note prompt was added.");
});

function activateTab(tabName) {
  document.querySelectorAll("[data-tab]").forEach((tab) => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    const isActive = panel.dataset.panel === tabName;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
}

function getNextTabIndex(key, currentIndex, tabCount) {
  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;
  if (key === "ArrowRight") return (currentIndex + 1) % tabCount;
  return (currentIndex - 1 + tabCount) % tabCount;
}

function block(title, html, modifier = "") {
  return `
    <section class="text-block ${modifier}">
      <h4>${escapeHtml(title)}</h4>
      ${html}
    </section>
  `;
}

function tagRow(tags) {
  return `<div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
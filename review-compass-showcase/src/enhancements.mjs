const defaultFlowCounts = {
  databaseRecords: 124,
  registerRecords: 8,
  otherRecords: 12,
  duplicatesRemoved: 18,
  automationExcluded: 0,
  recordsExcluded: 82,
  reportsNotRetrieved: 4,
  reportsExcluded: 21
};

const auditGroups = [
  {
    title: "Question Translation",
    helper: "Check that the search matches the review question instead of drifting toward a nearby topic.",
    items: [
      ["question-concepts", "The main question concepts are visible in the search.", "A reviewer should be able to point to the population, concept or intervention, and outcome or context groups."],
      ["question-scope", "The search is neither too broad nor too narrow for the review purpose.", "Broad reviews may need flexible terms, while focused effect questions need sharper concept boundaries."],
      ["question-line-counts", "Line counts or test counts were checked before screening begins.", "Big jumps or tiny result sets can reveal a logic mistake early."]
    ]
  },
  {
    title: "Boolean And Line Logic",
    helper: "Review the structure of AND, OR, parentheses, and database-specific syntax.",
    items: [
      ["logic-or", "Synonyms within the same concept are connected with OR.", "OR gathers similar terms before the concept groups are combined."],
      ["logic-and", "Different concept groups are connected with AND.", "AND should combine the major concepts after each concept group is complete."],
      ["logic-parentheses", "Parentheses, quotation marks, and field tags are balanced.", "A missing symbol can quietly change the entire retrieval set."]
    ]
  },
  {
    title: "Vocabulary Coverage",
    helper: "Look for missing controlled vocabulary, natural-language terms, spelling variants, and abbreviations.",
    items: [
      ["vocab-controlled", "Controlled vocabulary or subject headings were considered where available.", "Examples include MeSH, CINAHL Headings, Emtree, or other database-specific indexing."],
      ["vocab-textwords", "Text words include synonyms, spelling variants, and common abbreviations.", "Student searches often miss records because authors use different wording for the same idea."],
      ["vocab-phrase", "Important phrases are quoted or searched in a way the database supports.", "Phrase handling differs across databases, so the same strategy may need translation."]
    ]
  },
  {
    title: "Documentation And Limits",
    helper: "Make the search reproducible enough for a librarian, mentor, or reader to check later.",
    items: [
      ["docs-sources", "Every database, registry, website, and supplementary source is named.", "The source list should match the discipline and the review type."],
      ["docs-dates", "Search dates, limits, filters, and deduplication steps will be recorded.", "This is essential for PRISMA-S style reporting and future updates."],
      ["docs-peer-review", "A librarian, mentor, or experienced reviewer will check the strategy.", "Structured peer review helps catch search errors before they affect screening."]
    ]
  }
];

const form = document.querySelector("#project-form");
const protocolOutput = document.querySelector("#protocol-output");
const auditOutput = document.querySelector("#audit-output");
const flowForm = document.querySelector("#flow-form");
const flowOutput = document.querySelector("#flow-output");
const resetButton = document.querySelector("#reset-button");

let flowCounts = { ...defaultFlowCounts };
let auditState = {};

if (form && protocolOutput && auditOutput && flowForm && flowOutput) {
  hydrateFlowForm();
  renderEnhancements();

  form.addEventListener("input", renderEnhancements);
  flowForm.addEventListener("input", (event) => {
    if (!event.target.matches("input")) return;
    flowCounts = readFlowForm();
    renderFlow();
  });
  auditOutput.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-audit-item]");
    if (!checkbox) return;
    auditState = { ...auditState, [checkbox.value]: checkbox.checked };
    renderAudit();
  });
  resetButton?.addEventListener("click", () => {
    flowCounts = { ...defaultFlowCounts };
    auditState = {};
    hydrateFlowForm();
    renderEnhancements();
  });
}

function renderEnhancements() {
  renderProtocol();
  renderAudit();
  renderFlow();
}

function readProject() {
  const data = new FormData(form);
  return Object.fromEntries([...data.entries()].map(([key, value]) => [key, normalizeText(value)]));
}

function renderProtocol() {
  const project = readProject();
  const score = readinessScore(project);
  const sources = splitList(project.databases);
  const termCount = [
    ...splitList(project.population),
    ...splitList(project.concept),
    ...splitList(project.context),
    ...splitList(project.outcomes)
  ].length;
  const teamPlan = project.teamPlan.toLowerCase();
  const hasReviewerCheck = /two|dual|independent|second|mentor|librarian/.test(teamPlan);
  const hasPilotPlan = /pilot|sample|calibration|test/.test(teamPlan);
  const hasCore = ["topic", "population", "concept", "include", "exclude"].every((key) => project[key].length >= 8);
  const cards = [
    card("Purpose and question", score, `Systematic review using PICO: ${question(project)}`, "Use this as a first draft for mentor feedback."),
    card("Eligibility criteria", hasCore ? 86 : 46, hasCore ? "The inclusion and exclusion rules are specific enough for a first methods review." : "The protocol still needs clearer inclusion or exclusion wording.", "Keep criteria tied to the question so screening decisions do not drift."),
    card("Search coverage", sources.length >= 2 && termCount >= 8 ? 84 : 58, `${sources.length} source${sources.length === 1 ? "" : "s"} named and ${termCount} draft term${termCount === 1 ? "" : "s"} visible.`, "Ask a librarian to check source coverage and syntax."),
    card("Screening reliability", hasReviewerCheck ? 84 : 40, hasReviewerCheck ? "The plan names a second reviewer, mentor, or librarian check." : "The plan still reads like a single-reviewer workflow.", "Add a conflict-resolution rule before screening real records."),
    card("Extraction and synthesis", hasPilotPlan ? 82 : 62, hasPilotPlan ? "The team plan includes a pilot signal." : "The extraction form should be piloted on a small sample.", "Document field changes with dates and reasons."),
    card("Reporting readiness", 76, "Use PRISMA 2020, PRISMA-S, and a source log while drafting.", "Keep record counts, report counts, and included-study counts separate.")
  ];
  const average = Math.round(cards.reduce((sum, item) => sum + item.score, 0) / cards.length);

  protocolOutput.innerHTML = `
    <section class="snapshot-hero ${status(average)}">
      <div>
        <p class="surface-label">Protocol snapshot</p>
        <h4>${escapeHtml(average >= 80 ? "ready for methods review" : "nearly ready")}</h4>
        <p>${escapeHtml(average >= 80 ? "This draft has enough structure for a useful mentor or librarian conversation." : "This draft is moving, but a few method decisions still need attention.")}</p>
      </div>
      <div class="snapshot-score"><strong>${average}%</strong><span>mentor-review readiness</span></div>
    </section>
    <div class="snapshot-grid">
      ${cards
        .map(
          (item) => `
          <article class="snapshot-card ${status(item.score)}">
            <div class="card-kicker"><span>${labelForStatus(status(item.score))}</span><meter min="0" max="100" value="${item.score}">${item.score}%</meter></div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.text)}</p>
            <em>${escapeHtml(item.action)}</em>
          </article>`
        )
        .join("")}
    </div>
  `;
}

function renderAudit() {
  const groups = auditGroups.map((group) => {
    const items = group.items.map(([id, label, detail]) => ({ id, label, detail, checked: Boolean(auditState[id]) }));
    return { ...group, items, checked: items.filter((item) => item.checked).length, total: items.length };
  });
  const checked = groups.reduce((sum, group) => sum + group.checked, 0);
  const total = groups.reduce((sum, group) => sum + group.total, 0);
  const percent = Math.round((checked / total) * 100);
  const nextItem = groups.flatMap((group) => group.items).find((item) => !item.checked);

  auditOutput.innerHTML = `
    <section class="audit-summary">
      <div>
        <p class="surface-label">Search peer review</p>
        <h4>${checked} of ${total} checks complete</h4>
        <p>${escapeHtml(nextItem ? `Next, check: ${nextItem.label}` : "This search draft is ready for a librarian or mentor to review.")}</p>
      </div>
      <div class="audit-meter"><meter min="0" max="100" value="${percent}">${percent}%</meter><strong>${percent}%</strong></div>
    </section>
    <div class="audit-groups">
      ${groups
        .map(
          (group) => `
          <section class="audit-group ${group.checked === group.total ? "steady" : group.checked > 0 ? "watch" : "needs"}">
            <div class="audit-group-heading"><div><h4>${escapeHtml(group.title)}</h4><p>${escapeHtml(group.helper)}</p></div><span>${group.checked}/${group.total}</span></div>
            <div class="audit-items">
              ${group.items
                .map(
                  (item) => `
                  <label class="audit-item">
                    <input type="checkbox" value="${escapeHtml(item.id)}" data-audit-item ${item.checked ? "checked" : ""}>
                    <span><strong>${escapeHtml(item.label)}</strong><em>${escapeHtml(item.detail)}</em></span>
                  </label>`
                )
                .join("")}
            </div>
          </section>`
        )
        .join("")}
    </div>
  `;
}

function renderFlow() {
  hydrateFlowForm();
  const flow = flowModel(flowCounts);
  flowOutput.innerHTML = `
    <section class="flow-summary ${flow.problems.length ? "needs" : "steady"}">
      <div>
        <p class="surface-label">PRISMA-style count check</p>
        <h4>${flow.studiesIncluded} studies included</h4>
        <p>${flow.problems.length ? "Fix the count relationship before using this in a report." : "No impossible count relationships were detected."}</p>
      </div>
      <div class="flow-total"><strong>${flow.recordsIdentified}</strong><span>records identified</span></div>
    </section>
    <div class="flow-path">
      ${flow.steps
        .map(
          (step, index) => `
          <article>
            <span>${String(index + 1).padStart(2, "0")}</span>
            <strong>${step.value.toLocaleString("en-US")}</strong>
            <h4>${escapeHtml(step.label)}</h4>
            <p>${escapeHtml(step.detail)}</p>
          </article>`
        )
        .join("")}
    </div>
    ${flow.problems.length ? messageList("Fix these count issues", flow.problems, "problem") : ""}
    ${flow.cautions.length ? messageList("Helpful documentation reminders", flow.cautions, "caution") : ""}
  `;
}

function flowModel(counts) {
  const input = Object.fromEntries(Object.entries(defaultFlowCounts).map(([key, fallback]) => [key, wholeNumber(counts[key], fallback)]));
  const recordsIdentified = input.databaseRecords + input.registerRecords + input.otherRecords;
  const removed = input.duplicatesRemoved + input.automationExcluded;
  const recordsScreened = Math.max(0, recordsIdentified - removed);
  const reportsSought = Math.max(0, recordsScreened - input.recordsExcluded);
  const reportsAssessed = Math.max(0, reportsSought - input.reportsNotRetrieved);
  const studiesIncluded = Math.max(0, reportsAssessed - input.reportsExcluded);
  const problems = [];
  const cautions = [];

  if (recordsIdentified === 0) problems.push("Add at least one record source before using the flow summary.");
  if (removed > recordsIdentified) problems.push("Records removed before screening cannot exceed records identified.");
  if (input.recordsExcluded > recordsScreened) problems.push("Records excluded at title or abstract screening cannot exceed records screened.");
  if (input.reportsNotRetrieved > reportsSought) problems.push("Reports not retrieved cannot exceed reports sought for retrieval.");
  if (input.reportsExcluded > reportsAssessed) problems.push("Reports excluded after eligibility assessment cannot exceed reports assessed.");
  if (input.automationExcluded > 0) cautions.push("If automation removed records, document the tool, rule, and human check used.");
  if (input.otherRecords === 0) cautions.push("Consider whether citation searching, websites, organizational sources, or handsearching are needed.");
  if (input.reportsExcluded > 0) cautions.push("Keep reason categories for each full-text exclusion so the final report is transparent.");

  return {
    recordsIdentified,
    recordsScreened,
    studiesIncluded,
    problems,
    cautions,
    steps: [
      { label: "Records identified", value: recordsIdentified, detail: `${input.databaseRecords} database, ${input.registerRecords} register, ${input.otherRecords} other source.` },
      { label: "Removed before screening", value: removed, detail: `${input.duplicatesRemoved} duplicates and ${input.automationExcluded} automation exclusions.` },
      { label: "Records screened", value: recordsScreened, detail: `${input.recordsExcluded} excluded by title or abstract screening.` },
      { label: "Reports sought", value: reportsSought, detail: `${input.reportsNotRetrieved} reports not retrieved.` },
      { label: "Reports assessed", value: reportsAssessed, detail: `${input.reportsExcluded} full-text reports excluded with reasons.` },
      { label: "Studies included", value: studiesIncluded, detail: "Keep report counts separate if multiple reports describe one study." }
    ]
  };
}

function readFlowForm() {
  const data = new FormData(flowForm);
  return Object.fromEntries([...data.entries()].map(([key, value]) => [key, wholeNumber(value, defaultFlowCounts[key])]));
}

function hydrateFlowForm() {
  for (const [key, value] of Object.entries(flowCounts)) {
    const field = flowForm.elements.namedItem(key);
    if (field && field.value !== String(value)) field.value = value;
  }
}

function readinessScore(project) {
  const fields = ["topic", "population", "concept", "context", "outcomes", "databases", "include", "exclude", "teamPlan"];
  return Math.round((fields.filter((key) => project[key].length >= 8).length / fields.length) * 100);
}

function question(project) {
  const population = project.population || "[population]";
  const concept = project.concept || "[concept or intervention]";
  const context = project.context ? ` in ${project.context}` : "";
  const outcomes = project.outcomes || "[outcomes or evidence signals]";
  return `Among ${population}${context}, how is ${concept} associated with ${outcomes}?`;
}

function card(title, score, text, action) {
  return { title, score, text, action };
}

function status(scoreOrStatus) {
  if (typeof scoreOrStatus === "string") return scoreOrStatus;
  if (scoreOrStatus >= 80) return "steady";
  if (scoreOrStatus >= 60) return "watch";
  return "needs";
}

function labelForStatus(value) {
  if (value === "steady") return "Ready";
  if (value === "watch") return "Watch";
  return "Needs work";
}

function messageList(title, items, modifier) {
  return `<section class="message-list ${modifier}"><h4>${escapeHtml(title)}</h4><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>`;
}

function splitList(value) {
  return normalizeText(value)
    .split(/\s*(?:,|;|\n|\band\b)\s*/i)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index);
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function wholeNumber(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

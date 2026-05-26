const EMPTY_TEXT = "Add project details to generate this section.";

export const REVIEW_TYPES = Object.freeze([
  ["systematic", "Systematic review"],
  ["scoping", "Scoping review"],
  ["rapid", "Rapid review"],
  ["meta-analysis", "Meta-analysis"],
  ["umbrella", "Umbrella review"],
  ["mapping", "Evidence mapping review"],
  ["qualitative", "Qualitative evidence synthesis"],
  ["mixed-methods", "Mixed-methods review"],
  ["integrative", "Integrative review"],
  ["narrative", "Narrative review"],
  ["realist", "Realist review"]
].map(([value, label]) => ({ value, label })));

const FRAMES = {
  systematic: ["Systematic review", "PICO", "Population, intervention or exposure, comparison, and outcomes", "pico"],
  scoping: ["Scoping review", "PCC", "Population, concept, and context", "pcc"],
  rapid: ["Rapid review", "PICO", "Population, intervention or exposure, comparison, and outcomes", "pico"],
  "meta-analysis": ["Meta-analysis", "PICO", "Population, intervention or exposure, comparison, and outcomes", "pico"],
  umbrella: ["Umbrella review", "PICOS", "Population, intervention or exposure, comparison, outcomes, and study design", "overview"],
  mapping: ["Evidence mapping review", "PCC", "Population, concept, and context", "pcc"],
  qualitative: ["Qualitative evidence synthesis", "SPIDER", "Sample, phenomenon of interest, design, evaluation, and research type", "spider"],
  "mixed-methods": ["Mixed-methods review", "PICO/PCC", "Population, concept or intervention, context, and outcomes", "mixed"],
  integrative: ["Integrative review", "PCC", "Population, concept, and context", "pcc"],
  narrative: ["Narrative review", "Topic map", "Topic, population, context, and themes", "narrative"],
  realist: ["Realist review", "CMO", "Context, mechanism, and outcome", "cmo"]
};

const RATIONALES = {
  PICO: "PICO keeps the question specific enough to support eligibility criteria, structured searching, and transparent synthesis.",
  PCC: "PCC keeps a broad review organized around the population, concept, and setting while still allowing evidence mapping.",
  PICOS: "PICOS keeps an umbrella review focused on the population, intervention or exposure, outcomes, and review-level designs.",
  SPIDER: "SPIDER is helpful for qualitative evidence because it makes the sample, phenomenon, design, evaluation, and research type visible.",
  "PICO/PCC": "A mixed-methods review often needs both outcome logic and context logic so different evidence types stay aligned.",
  "Topic map": "A topic map clarifies the boundaries of a broad explanatory synthesis.",
  CMO: "CMO fits realist reviews because the goal is to explain how and why something works in particular contexts."
};

const DATABASES = {
  pubmed: { label: "PubMed", start: "", end: "", format: (term) => `${quote(term)}[Title/Abstract]` },
  scopus: { label: "Scopus", start: "TITLE-ABS-KEY(", end: ")", format: quote },
  wos: { label: "Web of Science", start: "TS=(", end: ")", format: quote },
  cinahl: { label: "CINAHL", start: "", end: "", format: (term) => `TI ${quote(term)} OR AB ${quote(term)}` }
};

const MATRIX = [
  ["systematic", "Answering a focused question with explicit eligibility criteria.", "PICO", "Transparent synthesis, often with risk-of-bias appraisal.", "Avoid using it for a broad evidence landscape that is not ready for one precise question."],
  ["scoping", "Mapping what evidence exists, how a field is defined, and where gaps remain.", "PCC", "Evidence map, concept summary, and future research directions.", "Do not treat it like a guideline-making review unless appraisal and synthesis plans support that."],
  ["rapid", "Answering a time-sensitive question while documenting every shortcut.", "PICO", "Streamlined synthesis with stated limits and confidence tradeoffs.", "Shortcuts must be named because they can affect completeness and bias."],
  ["meta-analysis", "Pooling comparable quantitative outcomes across similar studies.", "PICO", "Effect estimates, heterogeneity summary, and sensitivity checks.", "Do not pool results just because numbers exist; outcomes and designs need to be compatible."],
  ["umbrella", "Comparing findings from existing systematic reviews or meta-analyses.", "PICOS", "Review-of-reviews summary with overlap and certainty notes.", "Keep review-level conclusions separate from primary-study details."],
  ["mapping", "Showing where evidence clusters across categories, settings, or populations.", "PCC", "Visual map, category counts, and gap table.", "Use stable charting categories after piloting a sample of records."],
  ["qualitative", "Synthesizing experiences, meanings, perceptions, or implementation themes.", "SPIDER", "Themes, concepts, and confidence in qualitative findings.", "Keep participant voice, author interpretation, and reviewer interpretation distinct."],
  ["mixed-methods", "Integrating quantitative outcomes with qualitative explanations.", "PICO/PCC", "Integrated synthesis showing convergence, divergence, and gaps.", "Plan integration early so one evidence type does not quietly dominate."],
  ["integrative", "Combining diverse empirical, theoretical, or practice-based sources.", "PCC", "Broad synthesis of patterns across evidence types.", "Define eligible source types carefully so the review does not become arbitrary."],
  ["narrative", "Explaining a broad topic, history, or theory when systematic searching is not the main claim.", "Topic map", "Thematic explanation with transparent source-selection logic.", "Be honest about source selection so readers do not confuse it with a systematic review."],
  ["realist", "Explaining how and why an intervention or program works in particular contexts.", "CMO", "Program theory built from context, mechanism, and outcome patterns.", "The method needs iterative theory refinement, not only a list of study results."]
];

const DECISION_PATH = [
  ["I need a focused answer", ["systematic", "meta-analysis", "rapid"], "Use PICO and decide whether you need a full review, a rapid review, or a pooled estimate."],
  ["I need to map the field", ["scoping", "mapping", "integrative"], "Use PCC, chart categories, and focus on what evidence exists and where gaps remain."],
  ["I need to synthesize experiences", ["qualitative", "mixed-methods"], "Use SPIDER or a mixed frame, then plan how themes and outcomes will be integrated."],
  ["I need to compare reviews", ["umbrella"], "Use review-level eligibility criteria and track overlap between included reviews."],
  ["I need to explain what works for whom", ["realist"], "Use CMO logic and build a program theory from context, mechanism, and outcome patterns."],
  ["I need a broad explanation", ["narrative"], "Use a topic map and make the source-selection logic transparent."]
];

const SYNONYMS = new Map([
  ["college students", ["university students", "undergraduate students", "higher education students"]],
  ["students", ["learners", "undergraduate students", "graduate students"]],
  ["food insecurity", ["food insufficiency", "nutrition insecurity", "hunger"]],
  ["mental health", ["psychological distress", "wellbeing", "depression", "anxiety"]],
  ["academic outcomes", ["academic performance", "grade point average", "retention", "graduation"]],
  ["systematic review", ["evidence synthesis", "knowledge synthesis"]],
  ["scoping review", ["evidence map", "mapping review"]],
  ["meta-analysis", ["quantitative synthesis", "pooled estimate"]],
  ["umbrella review", ["review of reviews", "overview of reviews"]],
  ["qualitative", ["interview", "focus group", "thematic analysis"]],
  ["mixed methods", ["qualitative", "quantitative", "integrated synthesis"]],
  ["realist review", ["context mechanism outcome", "program theory"]]
]);

const DESIGN_TERMS = ["randomized", "trial", "cohort", "case-control", "cross-sectional", "survey", "interview", "focus group", "qualitative", "mixed methods", "observational", "longitudinal", "prevalence"];
const EXCLUDE_SIGNALS = ["editorial", "commentary", "letter", "opinion", "protocol", "animal study", "mouse", "mice", "rat", "rats", "in vitro"];

export const defaultProject = Object.freeze({
  reviewType: "systematic",
  topic: "Food insecurity and academic outcomes among college students",
  population: "college students",
  concept: "food insecurity",
  context: "higher education settings",
  outcomes: "academic performance, retention, mental health",
  databases: "PubMed, Scopus, PsycINFO, CINAHL, Web of Science",
  include: "Empirical studies that examine college students and report food insecurity with academic, retention, or mental health outcomes.",
  exclude: "Editorials, opinion pieces, protocols without results, animal-only studies, and articles that do not include college students.",
  teamPlan: "Two reviewers screen titles and abstracts independently, resolve conflicts through discussion, and ask a mentor or librarian to review the final search."
});

export function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function sentenceCase(value) {
  const text = normalizeText(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

export function splitList(value) {
  return normalizeText(value)
    .split(/\s*(?:,|;|\n|\band\b)\s*/i)
    .map((item) => item.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((candidate) => same(candidate, item)) === index);
}

export function getFramework(reviewType) {
  const [reviewName, label, name, questionStyle] = FRAMES[reviewType] ?? FRAMES.systematic;
  return {
    reviewName,
    label,
    name,
    questionStyle,
    rationale: RATIONALES[label],
    reportingLead:
      reviewType === "scoping" || reviewType === "mapping"
        ? "Identify the report clearly and use PRISMA-ScR and PRISMA-S when reporting."
        : "Identify the report clearly and use PRISMA 2020 and PRISMA-S when reporting."
  };
}

export function getReviewTypeOptions() {
  return REVIEW_TYPES.map((option) => ({ ...option }));
}

export function getReviewTypeMatrix() {
  return MATRIX.map(([type, bestFor, frame, output, caution]) => ({
    type,
    label: reviewTypeName(type),
    bestFor,
    frame,
    output,
    caution
  }));
}

export function getDatabase(databaseKey) {
  return DATABASES[databaseKey] ?? DATABASES.pubmed;
}

export function getSourceList(project) {
  return splitList(project.databases);
}

export function buildQuestion(project) {
  const frame = getFramework(project.reviewType);
  const population = normalizeText(project.population) || "[population]";
  const concept = normalizeText(project.concept) || "[concept or intervention]";
  const context = normalizeText(project.context);
  const outcomes = normalizeText(project.outcomes) || "[outcomes or evidence signals]";
  if (frame.questionStyle === "pcc") return `What is known about ${concept} among ${population}${context ? ` in ${context}` : ""}?`;
  if (frame.questionStyle === "overview") return `What do existing reviews report about ${concept} among ${population}${context ? ` in ${context}` : ""}, especially for ${outcomes}?`;
  if (frame.questionStyle === "spider") return `How do ${population} describe, experience, or understand ${concept}${context ? ` in ${context}` : ""}?`;
  if (frame.questionStyle === "mixed") return `What quantitative and qualitative evidence is available about ${concept} among ${population}${context ? ` in ${context}` : ""}, and what does it suggest about ${outcomes}?`;
  if (frame.questionStyle === "narrative") return `What themes and evidence help explain ${concept} among ${population}${context ? ` in ${context}` : ""}?`;
  if (frame.questionStyle === "cmo") return `In ${context || "[context]"}, what mechanisms may explain how ${concept} influences ${outcomes} for ${population}?`;
  return `Among ${population}${context ? ` in ${context}` : ""}, how is ${concept} associated with ${outcomes}?`;
}

export function buildRationale(project) {
  return `This ${reviewTypeName(project.reviewType).toLowerCase()} is framed around ${normalizeText(project.topic) || "this topic"}. ${getFramework(project.reviewType).rationale} The generated materials should be reviewed by a mentor or librarian before searching, screening, or submission.`;
}

export function buildEligibility(project) {
  return [
    ["Population", normalizeText(project.population) ? `Include records focused on ${normalizeText(project.population)}.` : EMPTY_TEXT],
    ["Concept or exposure", normalizeText(project.concept) ? `Include records that address ${normalizeText(project.concept)}.` : EMPTY_TEXT],
    ["Outcomes or evidence signals", normalizeText(project.outcomes) ? `Track ${normalizeText(project.outcomes)}.` : EMPTY_TEXT],
    ["Include when", normalizeText(project.include) || EMPTY_TEXT],
    ["Exclude when", normalizeText(project.exclude) || EMPTY_TEXT]
  ].map(([label, text]) => ({ label, text }));
}

export function buildSearchTerms(project) {
  const type = project.reviewType;
  const groups = [];
  const add = (label, value) => {
    const terms = unique(splitList(value).flatMap((term) => [term, ...(SYNONYMS.get(term.toLowerCase()) ?? [])])).slice(0, 6);
    if (terms.length) groups.push({ label, terms });
  };
  if (type === "realist") {
    add("Context or setting", project.context);
    add("Mechanism or program concept", project.concept);
    add("Outcomes", project.outcomes);
  } else if (["scoping", "mapping", "integrative", "narrative", "qualitative"].includes(type)) {
    add("Population", project.population);
    add("Concept, intervention, or phenomenon", project.concept);
    add("Context or setting", project.context);
  } else {
    add("Population", project.population);
    add("Concept, intervention, or phenomenon", project.concept);
    add("Outcomes or evidence signals", project.outcomes);
  }
  if (type === "umbrella") groups.push({ label: "Review or method signals", terms: ["systematic review", "meta-analysis", "review of reviews", "umbrella review"] });
  if (type === "qualitative") groups.push({ label: "Qualitative method signals", terms: ["qualitative", "interview", "focus group", "ethnography", "thematic analysis"] });
  if (type === "mixed-methods") groups.push({ label: "Mixed evidence signals", terms: ["mixed methods", "qualitative", "quantitative", "survey", "interview"] });
  if (type === "realist") groups.push({ label: "Realist method signals", terms: ["realist review", "context mechanism outcome", "program theory", "implementation"] });
  return groups;
}

export function buildSearchString(project, databaseKey = "pubmed") {
  const database = getDatabase(databaseKey);
  const groups = buildSearchTerms(project);
  if (!groups.length) return EMPTY_TEXT;
  const body = groups.map((group) => `(${group.terms.map(database.format).join(" OR ")})`).join("\nAND ");
  return `${database.start}${body}${database.end}`;
}

export function buildSearchNotes(project, databaseKey = "pubmed") {
  const database = getDatabase(databaseKey);
  const sourceText = getSourceList(project).length ? getSourceList(project).join(", ") : "the planned databases and sources";
  return [
    { tone: "standard", title: "Search documentation", text: `Record the exact ${database.label} search, the date searched, applied filters, platform name, and number of records retrieved.` },
    { tone: "standard", title: "Source coverage", text: `Check whether ${sourceText} cover the main literature for the field, and add registries, citation searching, or grey literature when the review question needs them.` },
    { tone: "warning", title: "Limits and restrictions", text: "Use date, language, geography, or publication-type limits only when the protocol explains why they are needed and what they could miss." },
    { tone: "warning", title: "Peer review", text: "Ask a librarian, mentor, or experienced reviewer to check Boolean logic, field tags, controlled vocabulary, and missing synonyms before treating the search as final." }
  ];
}

export function buildExtractionRows(project) {
  const special = getSpecialExtraction(project);
  return [
    ["Citation", "Author, year, title, journal, DOI, and database source.", "Keep enough detail to trace each record."],
    ["Data location", "Page, table, figure, supplement, or quotation location where the extracted data came from.", "This makes checking and conflict resolution much easier."],
    ["Study design", "Design, sampling frame, data source, and study period.", "Match extraction to eligible evidence types."],
    ["Population", "Participant or source characteristics relevant to the question.", "Use definitions that match the protocol."],
    ["Concept or intervention", "Exposure, intervention, phenomenon, mechanism, or review concept.", "Record how the authors defined it."],
    ["Context", "Setting, location, institution, country, or implementation context.", "This is especially important for PCC and CMO questions."],
    ["Outcomes or findings", "Outcomes, themes, effects, experiences, or evidence signals.", "Keep numerical findings and author conclusions separate."],
    special,
    ["Limitations", "Design limits, missing data, bias concerns, or applicability issues.", "Do not wait until writing to notice these."],
    ["Reviewer decision note", "Any disagreement, uncertainty, or follow-up question.", "Use this field during calibration and mentor review."]
  ].map(([field, description, note]) => ({ field, description, note }));
}

export function buildReportingChecklist(project) {
  const checklist = [
    ["Title and abstract", getFramework(project.reviewType).reportingLead],
    ["Rationale and objectives", "State why the review is needed and give the exact review question or objective."],
    ["Eligibility criteria", "Report the inclusion and exclusion rules, including study designs, populations, concepts, outcomes, and settings."],
    ["Information sources", "Name each database, registry, website, citation source, and supplementary source."],
    ["Search strategy", "Provide enough search detail for someone else to repeat the strategy."],
    ["Selection process", "Explain screening levels, number of reviewers, conflict resolution, and any automation used."],
    ["Data collection process", "Describe the extraction form, piloting, reviewer training, and disagreement process."],
    ["Data items", "Define the variables, outcomes, concepts, and contextual details collected from each source."],
    ["Bias or appraisal plan", "Name the appraisal approach or explain why appraisal is not part of the review question."],
    ["Synthesis plan", "Explain how findings will be grouped, mapped, narratively synthesized, themed, or statistically pooled."],
    ["Certainty or confidence", "State whether GRADE, confidence in qualitative findings, or another certainty approach will be used."],
    ["Results flow", "Track records identified, removed, screened, excluded, and included."],
    ["Limitations", "Explain limits caused by scope, search restrictions, missing data, study quality, or rapid-review shortcuts."],
    ["Funding and conflicts", "Report funding, roles, and possible conflicts of interest."]
  ];
  return [...checklist, ...typeReporting(project)].map(([title, text]) => ({ title, text }));
}

export function buildPrismaSearchItems() {
  return [
    "Database names and platforms",
    "Multi-database platform details",
    "Study registries",
    "Online resources and hand searching",
    "Citation searching",
    "Contact with authors or experts",
    "Full search strategies",
    "Limits and restrictions",
    "Search filters",
    "Prior searches reused or adapted",
    "Search updates",
    "Search dates",
    "Search peer review",
    "Total records",
    "Deduplication",
    "Records management"
  ];
}

export function buildReviewTypeGuide(project) {
  const selected = getReviewTypeMatrix().find((row) => row.type === project.reviewType) ?? getReviewTypeMatrix()[0];
  return {
    selected,
    alternatives: getReviewTypeMatrix().filter((row) => row.type !== selected.type).slice(0, 3),
    decisionPath: DECISION_PATH.map(([label, types, detail]) => ({ label, types, detail, active: types.includes(selected.type) })),
    mentorPrompts: [
      `Is a ${selected.label.toLowerCase()} the strongest design for this purpose, or should the question be narrowed or broadened?`,
      getSourceList(project).length ? `Do ${getSourceList(project).join(", ")} cover the most important literature for this field?` : "Which databases, registries, websites, or citation-searching steps should be added?",
      "Which step should be piloted first: search terms, screening criteria, or extraction fields?",
      "What reporting checklist or protocol repository should be used for this review type?"
    ]
  };
}

export function buildCommonGapChecks(project) {
  const sourceCount = getSourceList(project).length;
  const termCount = buildSearchTerms(project).reduce((sum, group) => sum + group.terms.length, 0);
  const text = `${project.include} ${project.exclude} ${project.teamPlan}`;
  const teamPlan = normalizeText(project.teamPlan);
  const protocolReady = ["topic", "population", "concept", "include", "exclude"].every((key) => normalizeText(project[key]).length >= 8);
  const rows = [
    ["Review type fit", "Students often choose a review label before they know the purpose of the review.", `Use the guide to check whether a ${reviewTypeName(project.reviewType).toLowerCase()} matches the question.`, "steady", "Selected", 92],
    ["Protocol rationale", "Weak protocols make eligibility rules drift during screening.", "Write the reason for the review, the question frame, and the inclusion and exclusion rules before searching.", protocolReady ? "steady" : "needs", protocolReady ? "Ready" : "Add detail", protocolReady ? 86 : 48],
    ["Search reproducibility", "Searches are hard to repeat when sources, dates, limits, and record counts are missing.", "Keep a search file with exact strategies, dates searched, limits, deduplication, and counts.", sourceCount >= 2 ? "steady" : "needs", sourceCount >= 2 ? "Document" : "Name sources", sourceCount >= 2 ? 82 : 40],
    ["Search term coverage", "Missed synonyms, controlled vocabulary, or field tags can change what the review finds.", "Expand each concept with synonyms and controlled vocabulary, then ask for peer review.", termCount >= 8 ? "steady" : "needs", termCount >= 8 ? "Broad enough" : "Expand terms", termCount >= 8 ? 78 : 44],
    ["Date and language limits", "Arbitrary restrictions can miss eligible studies and make the review harder to defend.", "Use limits only when the protocol explains the reason and likely tradeoff.", /date|language|limit|restriction|english|year/i.test(text) ? "watch" : "steady", /date|language|limit|restriction|english|year/i.test(text) ? "Justify" : "Open search", /date|language|limit|restriction|english|year/i.test(text) ? 62 : 84],
    ["Screening reliability", "Single-reviewer screening can miss records or apply criteria inconsistently.", "Use two independent reviewers when possible, or document a mentor check and conflict rule.", /two|dual|independent|second|mentor/i.test(teamPlan) ? "steady" : "needs", /two|dual|independent|second|mentor/i.test(teamPlan) ? "Checked" : "Add checker", /two|dual|independent|second|mentor/i.test(teamPlan) ? 84 : 38],
    ["Extraction piloting", "Data extraction errors are common when fields are vague or reviewers are not trained.", "Pilot the form on a small sample, revise definitions, and record disagreement handling.", /pilot|sample|calibration|test/i.test(teamPlan) ? "steady" : "watch", /pilot|sample|calibration|test/i.test(teamPlan) ? "Piloted" : "Plan pilot", /pilot|sample|calibration|test/i.test(teamPlan) ? 82 : 58],
    ["Synthesis plan", "Teams can collect too much data if they do not know how findings will be summarized.", "Name the synthesis approach before extraction, including maps, themes, narrative groups, or effect estimates.", normalizeText(project.outcomes).length >= 8 || normalizeText(project.context).length >= 8 ? "steady" : "needs", normalizeText(project.outcomes).length >= 8 || normalizeText(project.context).length >= 8 ? "Visible" : "Choose plan", normalizeText(project.outcomes).length >= 8 || normalizeText(project.context).length >= 8 ? 80 : 42],
    ["Bias and certainty plan", "Evidence can look stronger than it is when appraisal, certainty, and limitations are not planned.", "Match the appraisal tool to the study designs and decide whether GRADE or another certainty approach is needed.", /bias|quality|grade|appraisal|certainty|rob/i.test(teamPlan) ? "steady" : "watch", /bias|quality|grade|appraisal|certainty|rob/i.test(teamPlan) ? "Named" : "Name tool", /bias|quality|grade|appraisal|certainty|rob/i.test(teamPlan) ? 82 : 60],
    ["Reporting checklist", "Good review work can still be hard to trust if reporting misses required checklist items.", `Use ${project.reviewType === "scoping" || project.reviewType === "mapping" ? "PRISMA-ScR and PRISMA-S" : "PRISMA 2020 and PRISMA-S"} when drafting the final report.`, "steady", "Matched", 88]
  ];
  return rows.map(([gap, need, action, status, statusLabel, score]) => ({ gap, need, action, status, statusLabel, score }));
}

export function screenRecord(recordText, project) {
  const record = normalizeText(recordText).toLowerCase();
  if (!record) return { decision: "Exclude", confidence: "Low", reasons: ["No title or abstract was provided."], matchedTerms: [] };
  const includeTerms = [...splitList(project.population), ...splitList(project.concept), ...splitList(project.outcomes), ...splitList(project.context)];
  const exclusionTerms = [...EXCLUDE_SIGNALS, ...splitList(project.exclude)].map((term) => term.toLowerCase()).filter((term) => term.length > 2);
  const matchedTerms = unique(includeTerms.filter((term) => record.includes(term.toLowerCase())));
  const matchedExclusions = unique(exclusionTerms.filter((term) => record.includes(term)));
  const matchedDesign = DESIGN_TERMS.find((term) => record.includes(term));
  const hasPopulation = splitList(project.population).some((term) => record.includes(term.toLowerCase()));
  const hasConcept = splitList(project.concept).some((term) => record.includes(term.toLowerCase()));
  const hasOutcomeOrContext = splitList(project.outcomes).some((term) => record.includes(term.toLowerCase())) || splitList(project.context).some((term) => record.includes(term.toLowerCase()));
  const reasons = [];
  if (matchedExclusions.length) reasons.push(`The record contains exclusion signals: ${matchedExclusions.join(", ")}.`);
  if (hasPopulation) reasons.push("The population appears to match.");
  if (hasConcept) reasons.push("The concept or exposure appears to match.");
  if (hasOutcomeOrContext) reasons.push("The outcomes, setting, or context appear relevant.");
  if (matchedDesign) reasons.push(`The abstract names an empirical design signal: ${matchedDesign}.`);
  if (!reasons.length) reasons.push("The record does not clearly match the core review terms.");
  const includeScore = [hasPopulation, hasConcept, hasOutcomeOrContext].filter(Boolean).length;
  return {
    decision: !matchedExclusions.length && includeScore >= 2 ? "Include" : "Exclude",
    confidence: matchedExclusions.length || includeScore === 3 ? "High" : includeScore === 2 ? "Medium" : "Low",
    reasons,
    matchedTerms
  };
}

export function buildSubmissionCopy(project) {
  const description =
    "Review Compass is a student-friendly app that helps students plan evidence reviews, from systematic and scoping reviews to rapid, umbrella, mapping, qualitative, mixed-methods, integrative, narrative, realist, and meta-analysis projects. It turns a rough topic into a review-type guide, structured question, search drafts, screening practice, extraction fields, gap checks, notes, and reporting checklist. Built with Codex AI and grounded in PRISMA, PRISMA-S, PRISMA-ScR, and review methods guidance.";
  const sources = getSourceList(project);
  return {
    title: "Review Compass",
    link: "https://raw.githack.com/TheThunda01/github-portfolio-builder/main/review-compass-showcase/index.html",
    description,
    impact: `For the sample topic, the app produces this working question: ${buildQuestion(project)}`,
    tools: "Codex, ChatGPT research support, browser-based JavaScript, and published evidence-synthesis reporting guidance.",
    sources: sources.length ? `The current source plan includes ${sources.join(", ")}.` : "The source plan should name the databases and supplementary sources before submission."
  };
}

export function buildReadinessGuidance(project) {
  const required = [["topic", "working topic"], ["population", "population or problem"], ["concept", "concept or intervention"], ["context", "context, comparison, or setting"], ["outcomes", "outcomes or evidence signals"], ["databases", "databases and sources"], ["include", "inclusion rule"], ["exclude", "exclusion rule"], ["teamPlan", "reviewer plan"]];
  const missing = required.filter(([key]) => normalizeText(project[key]).length < 8).map(([, label]) => label);
  const notes = [];
  if (missing.length) notes.push(`Strengthen the ${missing.slice(0, 3).join(", ")} field${missing.length > 1 ? "s" : ""}.`);
  if (getSourceList(project).length < 2) notes.push("Name at least two relevant databases or sources before treating the search as ready.");
  if (!/two|dual|independent|second/i.test(normalizeText(project.teamPlan))) notes.push("Clarify whether a second reviewer, mentor, or librarian will check screening or the search.");
  if (!notes.length) notes.push("This is ready for a mentor or librarian methods review.");
  const score = computeReadiness(project);
  return { label: score >= 90 ? "ready for methods review" : score >= 65 ? "nearly ready" : "drafting plan", notes };
}

export function buildExportMarkdown(project, databaseKey = "pubmed", recordText = "", notes = "") {
  const guide = buildReviewTypeGuide(project);
  const readiness = buildReadinessGuidance(project);
  const screening = screenRecord(recordText, project);
  return `# Review Compass\n\n## Review Question\n${buildQuestion(project)}\n\n## Rationale\n${buildRationale(project)}\n\n## Review Type Guidance\nSelected type: ${guide.selected.label}\nBest fit: ${guide.selected.bestFor}\nWatch-out: ${guide.selected.caution}\n\n## Common Gap Checks\n${buildCommonGapChecks(project).map((item) => `- ${item.gap}: ${item.action}`).join("\n")}\n\n## Readiness Notes\nStatus: ${readiness.label}\n${readiness.notes.map((note) => `- ${note}`).join("\n")}\n\n## Eligibility Criteria\n${buildEligibility(project).map((row) => `- ${row.label}: ${row.text}`).join("\n")}\n\n## Search Draft\n\`\`\`\n${buildSearchString(project, databaseKey)}\n\`\`\`\n\n## Screening Practice\nDecision: ${screening.decision}\nConfidence: ${screening.confidence}\nReasons:\n${screening.reasons.map((reason) => `- ${reason}`).join("\n")}\n\n## Extraction Fields\n${buildExtractionRows(project).map((row) => `- ${row.field}: ${row.description} ${row.note}`).join("\n")}\n\n## Reporting Readiness\n${buildReportingChecklist(project).map((item) => `- ${item.title}: ${item.text}`).join("\n")}\n\n## Student Notes\n${normalizeText(notes) || "No student notes were added yet."}\n\n## Handshake Description\n${buildSubmissionCopy(project).description}\n`;
}

export function computeReadiness(project) {
  const fields = [project.topic, project.population, project.concept, project.context, project.outcomes, project.databases, project.include, project.exclude, project.teamPlan];
  return Math.round((fields.filter((field) => normalizeText(field).length >= 8).length / fields.length) * 100);
}

export function reviewTypeName(reviewType) {
  return getFramework(reviewType).reviewName;
}

function getSpecialExtraction(project) {
  if (project.reviewType === "umbrella") return ["Review-level methods", "Included review type, search date range, appraisal approach, and overlap with other reviews.", "Do not mix review-level conclusions with primary-study extraction."];
  if (project.reviewType === "qualitative") return ["Theme or concept", "Participant experience, author theme, quotation signal, or interpretive concept.", "Keep participant voice separate from reviewer interpretation when possible."];
  if (project.reviewType === "mixed-methods") return ["Integration note", "How quantitative findings, qualitative themes, and mixed-methods evidence relate to each other.", "Flag convergence, divergence, and gaps."];
  if (project.reviewType === "realist") return ["CMO configuration", "Context, mechanism, and outcome pattern suggested by the record.", "Use this field to build or refine program theory."];
  if (project.reviewType === "rapid") return ["Streamlining decision", "Shortcut used, reason for using it, and possible effect on confidence.", "Rapid methods are acceptable only when the tradeoff is transparent."];
  if (project.reviewType === "mapping" || getFramework(project.reviewType).label === "PCC") return ["Charting category", "Evidence-map theme, population subgroup, setting, or implementation domain.", "Use stable categories after piloting a few records."];
  return ["Risk-of-bias notes", "Planned appraisal tool, domain-level concerns, or reason appraisal is not planned.", "Match the appraisal approach to the included study designs."];
}

function typeReporting(project) {
  const items = {
    "meta-analysis": [["Effect-size plan", "State the effect measure, model choice, heterogeneity plan, and sensitivity or subgroup analyses."]],
    umbrella: [["Review overlap", "Explain how overlapping primary studies across included reviews will be identified and handled."]],
    mapping: [["Map categories", "Define the categories, filters, or visual map structure used to show where evidence exists."]],
    qualitative: [["Synthesis approach", "Describe whether themes, concepts, confidence in findings, or another qualitative synthesis approach will be used."]],
    "mixed-methods": [["Integration approach", "Describe how qualitative and quantitative evidence will be compared, integrated, or kept distinct."]],
    integrative: [["Evidence diversity", "Explain which evidence types are eligible and how differences in methods will be handled."]],
    narrative: [["Source-selection logic", "Explain how sources were chosen and how narrative themes were developed."]],
    realist: [["Program theory", "Describe the initial program theory and how CMO patterns will refine it."]],
    rapid: [["Rapid-review limits", "State which systematic review steps were shortened and how that may affect confidence."]]
  };
  return items[project.reviewType] ?? [];
}

function quote(term) {
  const clean = normalizeText(term).replace(/[()]/g, "");
  return /\s|-/.test(clean) ? `"${clean}"` : clean;
}

function unique(items) {
  const seen = new Set();
  return items.map(normalizeText).filter((item) => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function same(a, b) {
  return normalizeText(a).toLowerCase() === normalizeText(b).toLowerCase();
}
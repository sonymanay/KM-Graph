const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  TabStopType, TabStopPosition, TableOfContents, HeadingLevel, BorderStyle,
  WidthType, ShadingType, VerticalAlign, PageNumber, PageBreak
} = require('docx');

const DIR = __dirname;
const img = f => fs.readFileSync(path.join(DIR, f));

// ---- palette ----
const NAVY="1b3a5b", BLUE="1f6feb", ACCENT="1f6feb", GREY="5b6b7b", LIGHT="eef4fb",
      HEADFILL="1b3a5b", ZEBRA="f2f6fa", GREEN="2f9e44", ORANGE="e8830c";

// ---- helpers ----
const T = (text, o={}) => new TextRun({ text, ...o });
const P = (children, o={}) => new Paragraph({ children: Array.isArray(children)?children:[children], ...o });
const body = (text, o={}) => new Paragraph({ children:[new TextRun({text})], spacing:{after:120, line:276}, ...o });
const bullet = (runs) => new Paragraph({ numbering:{reference:"bullets",level:0}, spacing:{after:60,line:264}, children: Array.isArray(runs)?runs:[T(runs)] });
const numbered = (runs, ref="steps") => new Paragraph({ numbering:{reference:ref,level:0}, spacing:{after:60,line:264}, children: Array.isArray(runs)?runs:[T(runs)] });
const h1 = t => new Paragraph({ heading:HeadingLevel.HEADING_1, children:[T(t)] });
const h2 = t => new Paragraph({ heading:HeadingLevel.HEADING_2, children:[T(t)] });
const h3 = t => new Paragraph({ heading:HeadingLevel.HEADING_3, children:[T(t)] });
const spacer = (h=120) => new Paragraph({ children:[], spacing:{after:h} });

function figure(file, w, capNum, capText){
  const meta = { loop:[1600,860], fabric:[1600,780], metrics:[1600,720], northstar:[1500,520] };
  const [iw,ih] = meta[file];
  const h = Math.round(w*ih/iw);
  return [
    new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:120,after:40}, children:[
      new ImageRun({ type:"png", data: img(file+".png"), transformation:{width:w,height:h},
        altText:{title:capText, description:capText, name:"fig"+capNum} })
    ]}),
    new Paragraph({ alignment:AlignmentType.CENTER, spacing:{after:180}, children:[
      T(`Figure ${capNum}. `, {bold:true, size:18, color:GREY}),
      T(capText, {italics:true, size:18, color:GREY})
    ]})
  ];
}

// ---- table builder ----
const BORDER = { style:BorderStyle.SINGLE, size:1, color:"cbd6e2" };
const BORDERS = { top:BORDER, bottom:BORDER, left:BORDER, right:BORDER,
  insideHorizontal:BORDER, insideVertical:BORDER };
function cell(text, w, {head=false, bold=false, fill=null, align=AlignmentType.LEFT, size=18}={}){
  const runs = Array.isArray(text) ? text : [T(text, {bold:head||bold, color:head?"ffffff":"1b2733", size})];
  return new TableCell({
    width:{size:w, type:WidthType.DXA},
    shading:{ fill: head?HEADFILL:(fill||"ffffff"), type:ShadingType.CLEAR },
    margins:{top:70, bottom:70, left:110, right:110},
    verticalAlign:VerticalAlign.CENTER,
    children:[ new Paragraph({ alignment:align, spacing:{after:0,line:248}, children:runs }) ]
  });
}
function table(widths, headers, rows){
  const total = widths.reduce((a,b)=>a+b,0);
  const headRow = new TableRow({ tableHeader:true, children: headers.map((hh,i)=>cell(hh, widths[i], {head:true})) });
  const bodyRows = rows.map((r,ri)=> new TableRow({ children: r.map((c,i)=>{
    if (c && c.__runs) return cell(c.__runs, widths[i], {fill: ri%2?ZEBRA:null});
    return cell(String(c), widths[i], {fill: ri%2?ZEBRA:null, bold:i===0});
  }) }));
  return new Table({ width:{size:total, type:WidthType.DXA}, columnWidths:widths, borders:BORDERS,
    rows:[headRow, ...bodyRows] });
}
const R = (...runs) => ({__runs:runs}); // rich cell

const CW = 9360; // content width

// ============================ DOCUMENT ============================
const doc = new Document({
  creator:"Knowledge Management CoE",
  title:"KM Eval Rehydration White Paper",
  description:"A control plane for real-time, gap-driven knowledge verification",
  styles:{
    default:{ document:{ run:{ font:"Arial", size:21, color:"1b2733" }, paragraph:{spacing:{line:276}} } },
    paragraphStyles:[
      { id:"Title", name:"Title", basedOn:"Normal", next:"Normal",
        run:{ size:56, bold:true, color:NAVY, font:"Arial" }, paragraph:{ spacing:{after:120} } },
      { id:"Heading1", name:"Heading 1", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:30, bold:true, color:NAVY, font:"Arial" },
        paragraph:{ spacing:{before:320, after:140}, outlineLevel:0,
          border:{ bottom:{ style:BorderStyle.SINGLE, size:6, color:BLUE, space:4 } } } },
      { id:"Heading2", name:"Heading 2", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:25, bold:true, color:"22557f", font:"Arial" },
        paragraph:{ spacing:{before:220, after:100}, outlineLevel:1 } },
      { id:"Heading3", name:"Heading 3", basedOn:"Normal", next:"Normal", quickFormat:true,
        run:{ size:22, bold:true, color:"2b2f36", font:"Arial" },
        paragraph:{ spacing:{before:160, after:70}, outlineLevel:2 } },
    ]
  },
  numbering:{ config:[
    { reference:"bullets", levels:[
      { level:0, format:LevelFormat.BULLET, text:"\u2022", alignment:AlignmentType.LEFT,
        style:{ run:{color:BLUE}, paragraph:{ indent:{left:520, hanging:260} } } },
      { level:1, format:LevelFormat.BULLET, text:"\u2013", alignment:AlignmentType.LEFT,
        style:{ paragraph:{ indent:{left:940, hanging:260} } } } ] },
    { reference:"steps", levels:[
      { level:0, format:LevelFormat.DECIMAL, text:"%1.", alignment:AlignmentType.LEFT,
        style:{ run:{bold:true,color:BLUE}, paragraph:{ indent:{left:520, hanging:300} } } } ] },
    { reference:"steps2", levels:[
      { level:0, format:LevelFormat.DECIMAL, text:"%1.", alignment:AlignmentType.LEFT,
        style:{ run:{bold:true,color:BLUE}, paragraph:{ indent:{left:520, hanging:300} } } } ] },
  ]},
  sections:[
    // -------- COVER --------
    { properties:{ page:{ size:{width:12240,height:15840}, margin:{top:1440,right:1440,bottom:1440,left:1440} } },
      children:[
        spacer(1600),
        new Paragraph({ alignment:AlignmentType.LEFT, spacing:{after:60}, children:[
          T("WHITE PAPER", {bold:true, size:22, color:BLUE, characterSpacing:60}) ]}),
        new Paragraph({ style:"Title", spacing:{after:60}, children:[T("Knowledge Management")]}),
        new Paragraph({ style:"Title", spacing:{after:200}, children:[T("Eval Rehydration")]}),
        new Paragraph({ spacing:{after:120}, children:[
          T("A Control Plane for Real-Time, Gap-Driven Knowledge Verification", {size:28, color:"22557f"}) ]}),
        new Paragraph({ spacing:{after:400}, children:[
          T("Building a controlled, continuously-tested knowledge system that rehydrates and re-runs its own evaluations wherever a gap appears \u2014 across product releases, community, ADO, and more \u2014 ahead of the customer.", {size:22, italics:true, color:GREY}) ]}),
        new Paragraph({ border:{ top:{style:BorderStyle.SINGLE,size:6,color:BLUE,space:6} }, spacing:{before:200,after:120}, children:[]}),
        new Paragraph({ spacing:{after:40}, children:[ T("Version 1.0", {bold:true, size:20}), T("   \u00b7   July 2026", {size:20, color:GREY}) ]}),
        new Paragraph({ spacing:{after:40}, children:[ T("Author: ", {bold:true, size:20}), T("Knowledge Management Center of Excellence", {size:20, color:GREY}) ]}),
        new Paragraph({ spacing:{after:40}, children:[ T("Companion prototype & video: ", {bold:true, size:20}),
          new ExternalHyperlink({ link:"https://sonymanay.github.io/KM-Graph/", children:[ T("sonymanay.github.io/KM-Graph", {style:"Hyperlink", size:20}) ] }) ]}),
        new Paragraph({ children:[new PageBreak()] }),
      ]
    },
    // -------- BODY --------
    { properties:{ page:{ size:{width:12240,height:15840}, margin:{top:1440,right:1440,bottom:1440,left:1440} } },
      headers:{ default: new Header({ children:[ new Paragraph({ spacing:{after:0}, border:{bottom:{style:BorderStyle.SINGLE,size:4,color:"cbd6e2",space:2}}, children:[
        T("KM Eval Rehydration \u2014 White Paper", {size:16, color:GREY}),
        new TextRun({ children:["\tv1.0"], size:16, color:GREY }) ], tabStops:[{type:TabStopType.RIGHT, position:TabStopPosition.MAX}] }) ] }) },
      footers:{ default: new Footer({ children:[ new Paragraph({ alignment:AlignmentType.CENTER, children:[
        T("Page ", {size:16, color:GREY}), new TextRun({ children:[PageNumber.CURRENT], size:16, color:GREY }),
        T(" of ", {size:16, color:GREY}), new TextRun({ children:[PageNumber.TOTAL_PAGES], size:16, color:GREY }) ] }) ] }) },
      children:[
        new Paragraph({ heading:HeadingLevel.HEADING_1, spacing:{before:0,after:140}, children:[T("Contents")] }),
        new TableOfContents("Contents", { hyperlink:true, headingStyleRange:"1-2" }),
        new Paragraph({ children:[new PageBreak()] }),

        // 1. EXEC SUMMARY
        h1("1. Executive Summary"),
        body("Knowledge Management (KM) has become the front line of customer support in the AI era. When a customer reaches a support portal, an agent, or an in-product assistant, an AI system must answer in real time using knowledge that is correct, current, and grounded in verifiable sources. The hard problem is no longer generating an answer \u2014 it is guaranteeing that the answer is right, and staying right as products, code, and community knowledge change every day."),
        body("This paper proposes a control discipline for AI-era KM: treat evaluations (\u201cevals\u201d) as the control layer, and rehydrate them in real time. Whenever a gap is detected across any source \u2014 a product release, a spiking community thread, a newly-shipped ADO fix \u2014 the relevant eval set is automatically regenerated, re-run against the KM agents, and scored against a human-verified golden baseline before the knowledge is ever served to a customer. Content that clears every gate is promoted; content that fails is quarantined and routed to remediation. The result is a knowledge system that is continuously tested, ahead of time, rather than reactively patched after customers hit a gap."),
        body("We define the vision and North Star, explain the concept and the closed control loop, describe the multi-dimensional eval fabric (golden dataset, similar cases, community content, ADO, training, and product releases), and map the approach to established industry standards, methods, and metrics. We close with a prioritized set of recommended techniques and a phased implementation methodology.",),
        new Paragraph({ shading:{fill:LIGHT,type:ShadingType.CLEAR}, border:{left:{style:BorderStyle.SINGLE,size:18,color:BLUE,space:10},top:{style:BorderStyle.SINGLE,size:2,color:"cbd6e2",space:6},bottom:{style:BorderStyle.SINGLE,size:2,color:"cbd6e2",space:6},right:{style:BorderStyle.SINGLE,size:2,color:"cbd6e2",space:6}}, spacing:{before:120,after:160}, children:[
          T("Thesis:  ", {bold:true, color:NAVY}),
          T("Evals are not a test you run once before launch. They are a live control plane. Rehydrated continuously and driven by detected gaps, they let KM stay correct in real time \u2014 measuring agent quality and model drift so \u201cwhat good looks like\u201d is enforced before the customer, not discovered after.", {italics:true})
        ]}),

        // 2. PROBLEM
        h1("2. The Problem: Why Traditional KM Breaks in the AI Era"),
        body("Classic KM was built for a slower world: humans authored articles, humans reviewed them, and freshness was managed on quarterly cycles. Three forces break that model when an AI agent is answering customers directly:"),
        bullet([T("Velocity of change. ", {bold:true}), T("Product releases, code changes, and deprecations ship continuously. A correct answer today can become actively harmful next week when a step is deprecated.")]),
        bullet([T("Distributed truth. ", {bold:true}), T("The best current knowledge often lives outside the official KB \u2014 in community threads, MVP blogs, resolved tickets, and ADO fixes \u2014 long before it is formally documented.")]),
        bullet([T("Non-deterministic answerers. ", {bold:true}), T("LLM-based agents drift. The same model can regress silently as prompts, retrieval, and underlying models change, producing ungrounded or stale answers with high confidence.")]),
        body("The consequence is a widening gap between what the customer is experiencing and what KM can verify. Traditional KM discovers these gaps reactively \u2014 through re-contacts, escalations, and CSAT drops \u2014 after customers are already affected. The AI era demands the opposite: detect and close gaps ahead of the customer, under measurable control."),

        // 3. VISION & NORTH STAR
        h1("3. Vision & North Star"),
        h2("3.1 Vision Statement"),
        new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:80,after:160}, children:[
          T("\u201cA self-evolving knowledge system that verifies itself in real time \u2014 rehydrating and re-running its own evaluations wherever a gap appears, so every customer answer is grounded, current, and provably correct before it is served.\u201d", {italics:true, size:24, color:"22557f"})
        ]}),
        h2("3.2 North Star"),
        body("The North Star is a KM capability that moves from reactive and manually-curated to continuous, gap-driven, and drift-controlled \u2014 what we call Self-Evolving KM (Level 4). Progress is measured along a maturity model:"),
        ...figure("northstar", 600, 1, "KM Eval maturity model \u2014 from reactive knowledge (L0) to a self-evolving, drift-controlled system verified ahead of the customer (L4)."),
        h2("3.3 Guiding Principles"),
        bullet([T("Evals are the control plane. ", {bold:true}), T("Knowledge is only promoted when it passes measurable gates, never on trust alone.")]),
        bullet([T("Ahead of the customer. ", {bold:true}), T("Gaps are detected and verified before first customer contact, tracked by lead time.")]),
        bullet([T("Golden anchors truth. ", {bold:true}), T("A human-verified golden dataset defines \u201cwhat good looks like\u201d; other sources add coverage and recency but never redefine correctness.")]),
        bullet([T("Grounded or nothing. ", {bold:true}), T("Every answer must trace to a cited, current source node in the knowledge graph.")]),
        bullet([T("Controlled autonomy. ", {bold:true}), T("Agents act automatically, but within gates, guardrails, and drift thresholds that trigger review and auto-remediation.")]),

        // 4. CONCEPT
        h1("4. The Concept: Evals as the Control Layer"),
        h2("4.1 What \u201cRehydration\u201d Means"),
        body("Rehydration is the act of regenerating a fresh, executable evaluation set from a source the moment that source changes or a gap is found. Instead of a static, hand-written test suite that ages, the eval corpus is continuously re-hydrated: new eval cases are synthesized from the triggering source (e.g., a release note or a community thread), combined with the golden rubric, and immediately run against the KM agents. Evals become a living, real-time control \u2014 not a one-time gate at launch."),
        h2("4.2 The Control Loop"),
        body("The system runs a continuous closed loop. Each detected gap becomes a rehydration job that flows through five stages; only content that clears every promotion gate is published, and the outcome writes back into the knowledge graph and the metrics store."),
        ...figure("loop", 600, 2, "The KM Eval Rehydration control loop \u2014 detect, rehydrate, run agents, score against golden, and promote or remediate, on a continuous cycle fed by six sources."),
        numbered([T("Detect. ", {bold:true}), T("Continuously diff live sources against the KM graph and golden coverage map to surface gaps, each with a severity and a projected lead time.")]),
        numbered([T("Rehydrate. ", {bold:true}), T("Synthesize eval cases from the triggering source plus the golden rubric \u2014 query, expected resolution, required citations, and gates.")]),
        numbered([T("Run agents. ", {bold:true}), T("Execute the KM agents (retrieval, diagnosis, grounding, answer synthesis) against the rehydrated cases.")]),
        numbered([T("Score. ", {bold:true}), T("Grade outputs against the golden gates using LLM-as-judge plus deterministic checks (citation match, freshness, safety).")]),
        numbered([T("Promote or remediate. ", {bold:true}), T("Passing content is promoted to the live graph; failing content is held in a tested-but-quarantined state and a remediation task is opened. The customer never sees an unverified answer.")]),
        h2("4.3 Worked Example"),
        body("A support article covers troubleshooting Microsoft Entra seamless single sign-on. A new release note changes the key-roll procedure and a matching ADO fix ships. The Release Watcher and ADO agents detect the divergence between the live sources and the current article \u2014 a gap, caught 5 days before the change reaches most customers."),
        numbered([T("The gap triggers rehydration: 24 eval cases are synthesized from the release note, the ADO fix, and the golden case for this scenario.")], "steps2"),
        numbered([T("The KM agents re-answer the rehydrated cases; a new step (\u201cverify device time sync within 5 minutes via w32tm /resync\u201d) is drafted and grounded to the updated sources.")], "steps2"),
        numbered([T("The Eval Judge scores the new answer at 94% \u2014 above every gate \u2014 with correct citations and freshness inside SLA.")], "steps2"),
        numbered([T("The article is auto-promoted from v1 to v2 with the corrected procedure, and the outcome is logged to the drift/metrics store \u2014 all before the customer ever asks.")], "steps2"),

        // 5. FABRIC
        h1("5. The Multi-Dimensional Eval Fabric"),
        body("Robust evaluation cannot rest on a single source. The eval corpus is hydrated from six independent dimensions. The golden dataset anchors correctness; the others contribute coverage, recency, and authentic customer phrasing. Each source is independently monitored for freshness and open gaps, and can be rehydrated on demand."),
        ...figure("fabric", 600, 3, "The multi-dimensional eval fabric \u2014 six sources feed a unified, golden-anchored eval corpus that drives the control loop."),
        table([1740,2340,3480,1800],
          ["Source","Role","What it hydrates into evals","Freshness signal"],
          [
            ["Golden Dataset","Truth anchor","Human-verified queries, expected resolutions, required citations, gate thresholds","Review cadence"],
            ["Similar Cases","Coverage","Resolved support tickets clustered by intent; real customer phrasing and edge cases","Ticket recency"],
            ["Community Content","Recency & reach","Forum threads, Q&A, MVP blogs; emerging issues before formal docs exist","Post velocity / spikes"],
            ["ADO Work Items","Ground truth of fixes","Bugs, known issues, and shipped fixes with authoritative resolution steps","Work-item state"],
            ["Training / Enablement","Canonical procedure","Internal enablement modules and certified guidance","Module version"],
            ["Product Releases","Change signal","Release notes, changelogs, deprecations that invalidate or add steps","Release date / deprecation"],
          ]),
        spacer(80),
        body("Governance note: rehydrated cases from community, releases, ADO, and similar cases are scored against the golden set \u2014 they are never allowed to silently redefine it. When a rehydrated case reveals that the golden itself is stale (for example, a release deprecates a documented step), it is flagged for golden-set promotion through review, keeping \u201cwhat good looks like\u201d both current and controlled."),

        // 6. METRICS / DRIFT
        h1("6. Agent Quality & Model-Drift Monitoring"),
        body("Every KM agent is scored on each eval sweep across both offline (golden) and online (production-sampled) evaluations. Beyond answer quality, the system tracks model drift \u2014 shifts in the distribution of agent outputs over time \u2014 because an LLM-based agent can regress silently even when code does not change. Drift crossing an alert band flags a model for review; crossing the retrain band auto-opens a remediation job."),
        ...figure("metrics", 600, 4, "Continuous agent-quality and model-drift monitoring \u2014 rolling groundedness and correctness against a drift (PSI) alert band, with the core metric families."),
        bullet([T("Quality metrics ", {bold:true}), T("track whether answers are grounded, faithful, correct, and complete against golden.")]),
        bullet([T("Drift metrics ", {bold:true}), T("(PSI, KL/JS divergence on output-embedding distributions) detect silent regression and data/concept shift.")]),
        bullet([T("Operational metrics ", {bold:true}), T("(latency p50/p95, cost per 1k, throughput) keep the control loop affordable and fast.")]),
        bullet([T("Outcome metrics ", {bold:true}), T("(deflection, re-contact rate, CSAT, gaps caught ahead-of-time) tie eval health to customer impact.")]),

        // 7. STANDARDS / METHODS / METRICS
        h1("7. Industry Standards, Methods & Metrics"),
        body("The approach aligns with established practice in LLM/RAG evaluation, MLOps/LLMOps, and AI governance. This section catalogs the relevant frameworks, the methods that underpin them, and the concrete metrics used for this use case."),
        h2("7.1 Standards & Frameworks"),
        table([2600,1700,5060],
          ["Framework / Standard","Type","Relevance to KM Eval Rehydration"],
          [
            [R(T("RAGAS",{bold:true})),"RAG eval library","Reference metrics for faithfulness, answer relevancy, context precision & recall over retrieval-augmented answers."],
            [R(T("TruLens",{bold:true})),"Eval / feedback fns","The \u201cRAG triad\u201d \u2014 groundedness, context relevance, answer relevance \u2014 as programmatic feedback functions."],
            [R(T("DeepEval / promptfoo",{bold:true})),"Eval harness","Assertion-style, CI-friendly test cases and regression gates for prompts and pipelines."],
            [R(T("Azure AI Foundry Evaluation SDK",{bold:true})),"Enterprise eval","Built-in groundedness, relevance, coherence, fluency & safety evaluators; offline + online (continuous) eval."],
            [R(T("MLflow LLM Evaluate",{bold:true})),"Eval orchestration","Experiment tracking and standardized LLM metric logging across model/prompt versions."],
            [R(T("LangSmith / OpenAI Evals",{bold:true})),"Datasets & tracing","Versioned eval datasets, tracing, and pairwise/LLM-judge scoring registries."],
            [R(T("NIST AI RMF",{bold:true})),"Governance","Map\u2013Measure\u2013Manage\u2013Govern functions; validity, reliability, and monitoring for trustworthy AI."],
            [R(T("ISO/IEC 42001",{bold:true})),"AI management system","Organizational controls, lifecycle management, and continual improvement for AI systems."],
            [R(T("Microsoft Responsible AI Standard",{bold:true})),"Governance","Reliability & safety, transparency, and accountability requirements for deployed AI."],
          ]),
        h2("7.2 Methods"),
        bullet([T("Golden dataset curation & versioning ", {bold:true}), T("\u2014 human-verified, version-controlled ground truth expanded only through review.")]),
        bullet([T("LLM-as-a-judge ", {bold:true}), T("\u2014 rubric-based and pairwise grading, calibrated against human labels (inter-rater agreement / Cohen\u2019s kappa) to control judge bias.")]),
        bullet([T("Offline + online evaluation ", {bold:true}), T("\u2014 pre-deployment gates on golden, plus continuous sampling of live production traffic.")]),
        bullet([T("Continuous eval in CI (eval-as-a-gate) ", {bold:true}), T("\u2014 regression suites block promotion when quality drops below threshold.")]),
        bullet([T("Synthetic eval generation ", {bold:true}), T("\u2014 the rehydration technique: auto-generate eval cases from changed sources.")]),
        bullet([T("RAG triad evaluation ", {bold:true}), T("\u2014 jointly score context relevance, groundedness, and answer relevance.")]),
        bullet([T("Guardrails & policy checks ", {bold:true}), T("\u2014 deterministic safety, PII, and compliance gates alongside model-graded metrics.")]),
        bullet([T("Drift detection ", {bold:true}), T("\u2014 scheduled PSI/KL/JS on output-embedding distributions to catch silent regression; distinguish data drift from concept drift.")]),
        bullet([T("A/B, shadow & canary testing with auto-rollback ", {bold:true}), T("\u2014 validate changes on live traffic safely before full promotion.")]),
        bullet([T("Red-teaming / adversarial evaluation ", {bold:true}), T("\u2014 probe for hallucination, jailbreaks, and unsafe guidance.")]),
        bullet([T("Human-in-the-loop feedback & active learning ", {bold:true}), T("\u2014 use thumbs, re-contacts, and hard cases to grow the golden set over time.")]),
        h2("7.3 Metrics Catalog"),
        table([2260,3560,2140,1400],
          ["Metric","What it measures","Method / technique","Target"],
          [
            ["Groundedness","Answer is supported by retrieved, cited evidence","NLI / LLM-judge (RAG triad)","\u2265 0.90"],
            ["Faithfulness","No unsupported or fabricated claims","RAGAS faithfulness / LLM-judge","\u2265 0.95"],
            ["Answer correctness","Matches the golden resolution","Semantic similarity + LLM-judge vs golden","\u2265 0.90"],
            ["Context precision / recall","Retrieval surfaces the right, sufficient context","RAGAS context metrics","\u2265 0.85"],
            ["Intent accuracy","Correct problem identified","Classification vs labeled intent","\u2265 0.88"],
            ["Coverage","Share of queries with a grounded answer","Graph coverage diff","\u2265 0.85"],
            ["Freshness / staleness","Source age within SLA window","Timestamp vs SLA","\u2264 30 days"],
            ["Hallucination rate","Frequency of ungrounded claims","Groundedness inversion / red-team","\u2264 2%"],
            ["Citation accuracy","Citations resolve to correct source","Deterministic link check","\u2265 0.95"],
            ["Model drift (PSI)","Output-distribution shift over time","PSI on output embeddings","alert \u2265 0.25"],
            [R(T("Drift (KL / JS)")),"Distributional divergence vs baseline","KL / Jensen\u2013Shannon divergence","monitor"],
            ["Judge agreement","LLM-judge vs human labels","Cohen\u2019s kappa","\u2265 0.8"],
            ["Latency / cost","Operational efficiency","p50/p95, cost per 1k","SLA-bound"],
            ["Safety / guardrail pass","No unsafe or non-compliant guidance","Policy classifiers","= 100%"],
            ["Re-contact / deflection","Business outcome of KM quality","Production analytics","improving"],
          ]),

        // 8. RECOMMENDED
        h1("8. Recommended Techniques & Methodology"),
        h2("8.1 Prioritized Techniques"),
        table([2560,4100,1300,1400],
          ["Technique","Why it matters for this use case","When","Priority"],
          [
            [R(T("Versioned golden dataset")),"Defines \u201cwhat good looks like\u201d; the anchor every rehydrated eval scores against","Foundation",R(T("P0",{bold:true,color:GREEN}))],
            [R(T("RAG triad + LLM-as-judge")),"Core quality signal for grounded, faithful, relevant answers","Foundation",R(T("P0",{bold:true,color:GREEN}))],
            [R(T("Eval-as-a-gate in CI")),"Blocks regressions before promotion; makes evals a control, not a report","Foundation",R(T("P0",{bold:true,color:GREEN}))],
            [R(T("Judge calibration vs human")),"Prevents biased/uncalibrated automated scoring","Foundation",R(T("P1",{bold:true,color:ORANGE}))],
            [R(T("Synthetic eval generation (rehydration)")),"Turns any changed source into fresh, executable eval cases in real time","Differentiator",R(T("P1",{bold:true,color:ORANGE}))],
            [R(T("Gap detection & lead-time tracking")),"Surfaces gaps ahead of the customer; drives the loop","Differentiator",R(T("P1",{bold:true,color:ORANGE}))],
            [R(T("Drift detection (PSI/KL/JS)")),"Catches silent agent regression that quality-only checks miss","Differentiator",R(T("P1",{bold:true,color:ORANGE}))],
            [R(T("Online eval on sampled traffic")),"Confirms offline gains hold in production","Scale",R(T("P2",{bold:true,color:BLUE}))],
            [R(T("Canary + shadow + auto-rollback")),"Safe promotion of rehydrated knowledge under live load","Scale",R(T("P2",{bold:true,color:BLUE}))],
            [R(T("Guardrails & safety classifiers")),"Deterministic backstop for compliance and safety","Scale",R(T("P2",{bold:true,color:BLUE}))],
            [R(T("Active learning to expand golden")),"Converts hard production cases into new ground truth","Continuous",R(T("P2",{bold:true,color:BLUE}))],
          ]),
        spacer(80),
        h2("8.2 Implementation Methodology (Phased)"),
        table([1200,2600,5560],
          ["Phase","Focus","Key deliverables"],
          [
            [R(T("Phase 0",{bold:true})),"Baseline & instrumentation","Trace agents; log inputs/outputs/citations; define outcome metrics (re-contact, deflection)."],
            [R(T("Phase 1",{bold:true})),"Golden + offline gates","Curate versioned golden set; implement RAG triad + LLM-judge; add eval-as-a-gate to CI."],
            [R(T("Phase 2",{bold:true})),"Continuous evaluation","Calibrate judges; add online eval on sampled traffic; publish the eval-health dashboard."],
            [R(T("Phase 3",{bold:true})),"Gap-driven rehydration","Wire multi-source gap detection; synthesize eval cases on change; track lead time ahead-of-customer."],
            [R(T("Phase 4",{bold:true})),"Drift control & autonomy","PSI/KL drift monitoring; auto-remediation & retrain jobs; canary + auto-rollback \u2014 Self-Evolving KM."],
          ]),
        spacer(120),
        body([T("The companion prototype demonstrates Phases 3\u20134 in an interactive control plane: ", {}),
          new ExternalHyperlink({ link:"https://sonymanay.github.io/KM-Graph/km-eval-rehydration-prototype.html", children:[T("km-eval-rehydration-prototype.html", {style:"Hyperlink"})] }),
          T(".", {}) ]),

        // 9. GOVERNANCE
        h1("9. Governance & Controls"),
        bullet([T("Gate-based promotion. ", {bold:true}), T("No knowledge is served unless it clears every eval gate; failures are quarantined, not published.")]),
        bullet([T("Golden integrity. ", {bold:true}), T("The golden set is version-controlled; changes require review and are auditable.")]),
        bullet([T("Auditability. ", {bold:true}), T("Every promotion carries its eval scores, citations, and source lineage for traceability (aligned with NIST AI RMF and ISO/IEC 42001).")]),
        bullet([T("Drift thresholds. ", {bold:true}), T("Defined alert and retrain bands convert model drift into automatic, controlled action.")]),
        bullet([T("Safety backstop. ", {bold:true}), T("Deterministic guardrails run alongside model-graded metrics for compliance-critical checks.")]),

        // 10. GLOSSARY
        h1("10. Glossary"),
        ...[
          ["Rehydration","Regenerating executable eval cases from a source the moment it changes or a gap is found."],
          ["Golden dataset","Human-verified ground truth defining expected answers, citations, and gate thresholds."],
          ["RAG triad","Groundedness, context relevance, and answer relevance \u2014 the core RAG quality signals."],
          ["LLM-as-a-judge","Using an LLM, guided by a rubric, to grade another model\u2019s output; calibrated to human labels."],
          ["Model drift","Change in an agent\u2019s output distribution over time, detected via PSI/KL/JS divergence."],
          ["PSI","Population Stability Index \u2014 a measure of distribution shift between a baseline and current window."],
          ["Lead time","How far ahead of first customer contact a gap was detected and verified."],
        ].map(([term,def]) => new Paragraph({ spacing:{after:80}, children:[ T(term+" \u2014 ", {bold:true, color:NAVY}), T(def) ]})),

        // 11. REFERENCES
        h1("11. References & Further Reading"),
        ...[
          "RAGAS \u2014 Evaluation framework for retrieval-augmented generation.",
          "TruLens \u2014 Feedback functions and the RAG triad for LLM app evaluation.",
          "DeepEval / promptfoo \u2014 Open-source LLM evaluation and testing harnesses.",
          "Azure AI Foundry \u2014 Evaluation SDK: groundedness, relevance, safety, and continuous online evaluation.",
          "MLflow \u2014 LLM evaluation and experiment tracking.",
          "NIST AI Risk Management Framework (AI RMF 1.0).",
          "ISO/IEC 42001:2023 \u2014 AI management systems.",
          "Microsoft Responsible AI Standard.",
        ].map(r => new Paragraph({ numbering:{reference:"bullets",level:0}, spacing:{after:60}, children:[T(r)] })),
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buf=>{
  const out = path.join(DIR, "KM-Eval-Rehydration-WhitePaper.docx");
  fs.writeFileSync(out, buf);
  console.log("WROTE", out, buf.length, "bytes");
});

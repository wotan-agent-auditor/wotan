Claro. Copie e cole este conteúdo inteiro no `README.md`:

````markdown
# WOTAN

## Black-Box Behavioral Assurance for AI Agents

**No Target-Side Logs. No Target-Side Traces. No Internal Access Required. Just Observable Behavior.**

WOTAN is an autonomous black-box auditing system for AI agents.

It evaluates a Target Agent exclusively through the same public interaction surface available to a normal external user, such as a public chat or API.

WOTAN does **not** require access to the Target Agent's:

- System prompt
- Source code
- Internal logs
- Traces
- Telemetry
- Database
- Internal tools
- Instrumentation

---

## The Problem

AI agents can appear correct while producing harmful business behavior:

- Contradicting policies
- Inventing promises
- Creating unauthorized exceptions
- Losing leads
- Ending conversations prematurely
- Producing unsupported claims
- Behaving inconsistently across turns

Traditional observability systems often depend on internal traces or instrumentation.

WOTAN approaches the problem from the outside.

It audits **what the user actually experiences**.

---

## How WOTAN Works

A user provides an audit mission.

WOTAN performs a multi-step behavioral audit:

```text
PLAN
  ↓
PROBE
  ↓
OBSERVE TARGET
  ↓
EVALUATE
  ↓
ADAPT
  ↓
PROBE AGAIN
  ↓
VALIDATE
  ↓
REPORT
````

The Target Agent is treated as an external black-box system.

Its responses are treated as:

**UNTRUSTED DATA**

---

## Black-Box Boundary

WOTAN observes only the Target Agent's public behavior.

```text
WOTAN
   ↓
Public Chat / API
   ↓
Target Agent
   ↓
Observable Response
   ↓
Evidence Analysis
```

WOTAN does not require target-side instrumentation.

---

## Audit Modes

### Passive Audit

Analyzes existing conversations and transcripts, including exported WhatsApp TXT conversations.

### Black-Box Active Audit

WOTAN interacts with a Target Agent, observes its responses and generates adaptive follow-up probes based on previous observable behavior.

---

## Evidence-First Validation

LLM-generated findings are not automatically accepted.

WOTAN uses deterministic validation to check:

* Evidence exists
* Evidence appears verbatim in the observed transcript
* Severity is valid
* Category is authorized
* Finding schema is complete

Candidate findings become:

**VALIDATED**

or

**REJECTED**

This separates probabilistic AI analysis from deterministic evidence verification.

---

## Architecture

```text
                 WOTAN
                   │
        AgentAuditorOrchestrator
                   │
           AuditPlannerAgent
                   │
              ProbeAgent
                   │
                   ▼
        ┌─────────────────────┐
        │ TARGET AGENT        │
        │ Public Chat / API   │
        │ BLACK-BOX           │
        └─────────────────────┘
                   │
          rawTargetResponse
                   │
                   ▼
        EvidenceEvaluatorAgent
                   │
          candidate finding
                   │
                   ▼
        AuditValidatorEngine
        Deterministic Validation
             │           │
        VALIDATED     REJECTED
             │
             ▼
       ReportSynthesizerAgent
```

---

## Technology Stack

* Google Gemini
* Google Agent Development Kit (ADK) 2.0
* Google GenAI SDK
* TypeScript
* Node.js
* React
* Vite
* Server-Sent Events (SSE)
* Google Cloud Run
* Firestore

---

## Adaptive Probing

WOTAN can generate follow-up probes based on previous Target Agent responses.

Example:

```text
Probe #1
↓
Target states a policy constraint
↓
WOTAN observes the constraint
↓
Probe #2 challenges that specific constraint
```

This enables behavioral testing that changes according to what the Target Agent actually says.

---

## Deterministic Risk Score

Validated findings receive deterministic weights:

* LOW = 3
* MEDIUM = 7
* HIGH = 15
* CRITICAL = 30

Scores are summed and capped at 100.

Risk tiers:

* 0–19: Low
* 20–39: Moderate
* 40–69: High
* 70–100: Critical

If at least one validated CRITICAL finding exists, the final risk tier cannot be lower than HIGH.

---

## Security Model

Target Agent output is considered untrusted external data.

The original Target Agent response is preserved as immutable evidence.

Target output cannot modify:

* WOTAN system instructions
* Audit objective
* Validation rules
* Security policy
* Allowed tools

---

## Hackathon Category

### Taskmaster

WOTAN receives an audit mission and performs a multi-step workflow to evaluate a Target Agent with minimal human intervention between audit turns.

---

## Current Development Status

Implemented:

* Passive transcript auditing
* WhatsApp TXT ingestion
* Black-box Active Audit
* Adaptive probing
* Evidence extraction
* Deterministic validation
* Risk scoring
* SSE live audit timeline
* Google ADK 2.0 integration
* Google Cloud deployment capability

Final verification in progress:

* Full Active Audit execution through the ADK 2.0 runtime
* Firestore persistence
* Final production deployment
* End-to-end hackathon demonstration

---

## Why WOTAN Is Different

WOTAN does not ask:

> "What happened inside the agent?"

It asks:

> **"What did the agent actually do to the user?"**

WOTAN is designed for situations where internal access to the Target Agent is unavailable, restricted or simply unnecessary.

---

## Built For

**Google All Things Agentic Hackathon 2026**

Importante: deixei **“Full Active Audit execution through ADK 2.0 runtime” como verificação em andamento**, porque ainda não vamos afirmar no GitHub algo que acabamos de descobrir que não está 100% concluído. Quando corrigirmos, removemos essa linha. 
```

---
title: "Domain 5: Context Management & Reliability"
description: "15% of the exam. Covers context budgets, progressive summarization, escalation, error propagation, large codebase exploration, and information provenance."
sidebar:
  order: 5
---

# Domain 5: Context Management & Reliability

## Weight: 15% (~9 questions)

**Appears in Scenarios:** 1 (Customer Support), 3 (Multi-Agent Research), 6 (Structured Data Extraction)

---

## What This Domain Tests

- Prevent progressive summarization from losing critical facts
- Understand the "lost in the middle" effect and how to mitigate it
- Design correct escalation triggers (and avoid unreliable signals)
- Handle error propagation correctly in multi-agent pipelines
- Manage context during large codebase exploration sessions
- Maintain source provenance through multi-agent synthesis
- Implement confidence calibration and stratified sampling for human review

---

## Task Statement 5.1: Manage Conversation Context

### Progressive Summarization — The Hidden Problem

When conversations grow long, context gets summarized to save tokens. But summarization silently drops the precise values you need most:

```
ORIGINAL CONTEXT (full detail):
  "Customer ordered 3 items totaling $247.50 on 2025-01-15.
   Requested $82.50 refund for 1 defective Widget Pro.
   Customer expects resolution by 2025-02-01."

❌ LOSSY SUMMARY (what typically survives):
  "Customer had an order issue and wants a partial refund."
  
  Lost forever:
    ✗ Exact order total ($247.50)
    ✗ Exact refund amount ($82.50)
    ✗ Order date (2025-01-15)
    ✗ Product name (Widget Pro)
    ✗ Customer's deadline (2025-02-01)

  When agent later asks "what refund does the customer want?"
  → It cannot answer accurately → vague response → bad experience
```

### The Case Facts Block Pattern — The Fix

Extract transactional facts into a **persistent structured block** that lives OUTSIDE the summarized conversation history:

```python
# Maintain a case_facts dict throughout the conversation
case_facts = {
    "customer_id": "C-12345",
    "customer_name": "Jane Smith",
    "interaction_start": "2025-01-20T10:30:00Z",
    "issues": [
        {
            "order_id": "ORD-789",
            "order_date": "2025-01-15",
            "order_total": 247.50,
            "status": "delivered",
            "complaint": "defective Widget Pro",
            "refund_requested": 82.50,
            "resolution_deadline": "2025-02-01",
            "refund_status": "pending"
        }
    ]
}

# Include in EVERY API call, outside the summarized history
def build_system_prompt(case_facts: dict, conversation_summary: str) -> str:
    return f"""You are a customer support agent.

## ACTIVE CASE FACTS (never summarize or abbreviate these):
{json.dumps(case_facts, indent=2)}

## CONVERSATION SUMMARY (may be compressed):
{conversation_summary}

When referencing order amounts, dates, or deadlines — always use the 
exact values from Active Case Facts above, not the conversation summary.
"""
```

### Context Flow with Case Facts

```
TURN 1: Customer provides details
  ┌────────────────────────────────────────────────┐
  │ Agent extracts facts → populates case_facts    │
  │ case_facts persists as structured block        │
  └────────────────────────────────────────────────┘

TURN 2–5: Normal conversation
  ┌────────────────────────────────────────────────┐
  │ case_facts block: [PRESERVED, EXACT VALUES]    │
  │ conversation: [FULL TURNS]                     │
  └────────────────────────────────────────────────┘

TURN 6: Context getting long → summarize conversation
  ┌────────────────────────────────────────────────┐
  │ case_facts block: [PRESERVED, EXACT VALUES]    │  ← Never touched
  │ conversation: [COMPRESSED SUMMARY]             │  ← Gets compressed
  └────────────────────────────────────────────────┘

TURN 7–20: Agent always has exact amounts/dates
  ┌────────────────────────────────────────────────┐
  │ case_facts block: [PRESERVED, EXACT VALUES]    │
  │ conversation: [ROLLING SUMMARY]                │
  └────────────────────────────────────────────────┘
  
Result: Agent never says "as discussed earlier" — always uses exact values
```

### Context Budget Management Flow

```
                    CONTEXT BUDGET MANAGEMENT
                    ─────────────────────────────────────────────

  Session starts:
  ┌────────────────────────────────────────────────────────┐
  │  Context budget: 200,000 tokens                        │
  │  Used: 0 tokens (0%)                                   │
  └────────────────────────────────────────────────────────┘
  
  As session progresses:
  
  ██████░░░░░░░░░░░░░░  30% used  →  Normal operation
  
  ████████████░░░░░░░░  60% used  →  Extract critical facts to persistent block
                                     (before they get summarized away)
  
  ██████████████████░░  90% used  →  Decision point:
  
                          ┌──────────────────────────────────────────┐
                          │  OPTION A: /compact                      │
                          │  Summarize conversation, preserve facts  │
                          │  Continue in same session                │
                          │  ✓ Simple  ✗ Context degradation risk    │
                          ├──────────────────────────────────────────┤
                          │  OPTION B: Extract → New session         │
                          │  1. Extract case facts (structured)      │
                          │  2. Start fresh session                  │
                          │  3. Inject facts as context              │
                          │  ✓ Clean  ✓ No degradation  ✗ More work │
                          ├──────────────────────────────────────────┤
                          │  OPTION C: Escalate to human             │
                          │  If task is too complex for remaining    │
                          │  context, notify user                    │
                          │  ✓ Reliable  ✗ Interrupts automation     │
                          └──────────────────────────────────────────┘
  
  ████████████████████  100%  →  Auto-compaction triggered
                               (may lose critical task context!)
  
  EXAM RULE: Extract case facts to a PERSISTENT block OUTSIDE the
  summarized history. "Increase context window" is always wrong.
```

### The "Lost in the Middle" Effect

Models reliably process information at the **beginning** and **end** of long inputs. Information in the **middle** gets less attention:

```
┌──────────────────────────────────────────────────────────────┐
│  INPUT DOCUMENT (very long)                                  │
│                                                              │
│  ████████████ BEGINNING — High attention                     │
│  • Models reliably process this section                      │
│                                                              │
│  · · · · · · · MIDDLE — Reduced attention                   │
│  • Findings from middle sections may be missed               │
│  • Critical data placed here is at risk                      │
│                                                              │
│  ████████████ END — High attention                           │
│  • Models reliably process this section                      │
└──────────────────────────────────────────────────────────────┘
```

### Mitigation Strategies for Lost-in-the-Middle

```python
# ✅ Strategy 1: Put key findings summary FIRST
prompt = f"""
## KEY FINDINGS SUMMARY (read this first):
{key_findings_summary}

## DETAILED ANALYSIS:

### Section A: Market Analysis
{section_a_details}   ← Even if this gets less attention...

### Section B: Competitor Review
{section_b_details}   ← ...summary at top covers the key points

### Section C: Financial Projections
{section_c_details}

## CONCLUSIONS:
{conclusions}          ← Also at high-attention position
"""

# ✅ Strategy 2: Use explicit section headers
# Headers act as attention anchors — Claude processes them reliably

# ✅ Strategy 3: Put critical data in structured blocks at START
# Structured JSON/YAML at the beginning gets consistent attention

# ✅ Strategy 4: Chunk large documents
# Process each section separately, then synthesize summaries
```

### Trimming Verbose Tool Outputs

Tool results accumulate and waste context budget with irrelevant fields:

```python
# ❌ FULL TOOL OUTPUT — 40+ fields, only 5 matter for the task
order_result = {
    "order_id": "ORD-789",
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:00:00Z",
    "customer_id": "C-12345",
    "billing_address": {/* 8 fields */},    # Irrelevant for return processing
    "shipping_address": {/* 8 fields */},   # Irrelevant for return
    "payment_method": {/* 5 fields */},     # Irrelevant for return
    "shipping_carrier": "UPS",              # Irrelevant for return
    "tracking_number": "1Z999...",          # Irrelevant for return
    "warehouse_id": "WH-03",               # Irrelevant for return
    # 30 more irrelevant fields...
    "items": [...],                         # ← RELEVANT
    "total": 247.50,                        # ← RELEVANT
    "status": "delivered",                  # ← RELEVANT
    "return_eligible": True,                # ← RELEVANT
    "return_window_end": "2025-02-15"       # ← RELEVANT
}

# ✅ TRIMMED OUTPUT — Keep only return-relevant fields
def trim_order_for_return(order: dict) -> dict:
    return {
        "order_id": order["order_id"],
        "items": order["items"],
        "total": order["total"],
        "status": order["status"],
        "return_eligible": order["return_eligible"],
        "return_window_end": order["return_window_end"]
    }
# 5 fields instead of 40 → saves ~2K tokens per tool call
```

### Subagent Output Design

Subagents with downstream context budgets should return structured data, not verbose reasoning:

```python
# ❌ VERBOSE subagent output (wastes downstream context)
search_output = """
I searched for AI in healthcare and found many interesting results.
The first result was from Nature Medicine, which discussed how AI is
being used in drug discovery. They found that... [2,000 words of reasoning
and intermediate thoughts that the coordinator doesn't need]
"""

# ✅ STRUCTURED subagent output (respects downstream context)
search_output = {
    "findings": [
        {
            "claim": "AI reduces drug discovery time by 40%",
            "source": "Nature Medicine Vol 32, Issue 3",
            "url": "https://nature.com/articles/nm-2025-0123",
            "date": "2025-03-15",
            "relevance_score": 5
        }
    ],
    "total_sources_reviewed": 15,
    "coverage_gaps": ["Clinical trial phase 3 data limited"],
    "queries_attempted": ["AI drug discovery 2025", "AI pharma clinical trials"]
}
# Coordinator gets actionable structured data, not the reasoning trail
```

---

## Task Statement 5.2: Escalation and Ambiguity Resolution

### Escalation Decision Tree

```
Customer message received
          │
          ▼
Customer EXPLICITLY requests a human agent?
          │
    YES   │   NO
          │
          ▼   ▼
  ESCALATE     Is the issue within agent capability?
  IMMEDIATELY  (not a policy gap, not stalled)
  (no investigation   │
   attempt first)  YES │   NO (policy gap / stalled)
                       │
                       ▼   ▼
              Is the customer       ESCALATE
              frustrated?           (policy gap:
                    │               agent can't
                YES │   NO          improvise policy)
                    │
                    ▼   ▼
            Acknowledge      Attempt
            frustration +    to resolve
            attempt resolve  directly
                    │
            Customer repeats
            "give me a person"?
                    │
               YES  │  NO
                    │
                    ▼  ▼
              ESCALATE Continue
                        resolving
```

### Correct vs. Incorrect Escalation Triggers

```
✅ CORRECT ESCALATION TRIGGERS:
  • Customer explicitly says "I want to talk to a real person"
    → Escalate IMMEDIATELY. No "let me try to help you first."
  
  • Customer's request falls outside documented policy
    → Escalate. Do not improvise or make up policy.
  
  • Agent is stalled with no meaningful progress path
    → Escalate. Don't waste customer's time.

❌ UNRELIABLE ESCALATION TRIGGERS (exam distractors):
  • Customer sentiment score < -0.5 (angry customer might have a simple issue)
  • Agent self-reported confidence < 0.7 (LLM confidence is poorly calibrated)
  • Number of conversation turns > N (turns don't correlate with complexity)
```

### Why Sentiment and Confidence Are Unreliable

```
SENTIMENT-BASED ESCALATION:
  Customer A: "This is absolutely ridiculous! My order is 2 days late!"
  Sentiment: VERY NEGATIVE (score: -0.9)
  Actual need: Simple delivery status check → easily resolved

  Customer B: "I noticed a small discrepancy in my billing."
  Sentiment: NEUTRAL (score: 0.1)
  Actual need: Billing investigation requiring manual account access → needs human

  Result: Sentiment predicts frustration, not complexity.
          Escalating based on sentiment escalates the wrong cases.

SELF-REPORTED CONFIDENCE:
  "I'm 85% confident the refund was processed" → may be fabricated/hallucinated
  "I'm 40% confident about the return window" → may be correct but uncertain
  
  LLM confidence is not calibrated like a probability.
  High confidence ≠ correct. Low confidence ≠ wrong.
  Never escalate (or not escalate) based on model self-reporting.
```

### Handling Multiple Customer Matches

```python
# Scenario: get_customer returns 3 customers named "Jane Smith"

# ❌ WRONG: Heuristic selection
if len(customers) > 1:
    customer = customers[0]    # Pick most recent? Alphabetical? Random?
    # HIGH RISK: Processing the wrong person's account

# ✅ CORRECT: Request additional disambiguating identifiers
if len(customers) > 1:
    return {
        "action": "request_disambiguation",
        "message": "I found multiple accounts matching that name. "
                   "To make sure I'm accessing the right account, "
                   "could you please provide your account number, "
                   "the email address on file, or your phone number?"
    }
# Never guess — always confirm identity before accessing account data
```

### Structured Handoff Summary

When escalating to a human agent, provide all context they need:

```python
def build_handoff_summary(case_facts: dict, conversation_summary: str) -> dict:
    return {
        "customer_id": case_facts["customer_id"],
        "customer_name": case_facts["customer_name"],
        "issue_summary": "Customer requesting refund for defective product",
        "root_cause": "Widget Pro arrived damaged",
        "refund_amount_requested": case_facts["issues"][0]["refund_requested"],
        "order_id": case_facts["issues"][0]["order_id"],
        "escalation_reason": "Customer requested human agent",
        "recommended_action": "Process $82.50 refund — within policy limits",
        "conversation_summary": conversation_summary,
        "urgency": "medium",
        "resolution_deadline": case_facts["issues"][0]["resolution_deadline"]
    }
# Human agent gets full context without needing to re-read the transcript
```

---

## Task Statement 5.3: Error Propagation in Multi-Agent Systems

### Structured Error Context for Recovery

```python
# ❌ GENERIC ERROR — coordinator cannot make recovery decisions
search_agent_result = {
    "status": "error",
    "message": "Search unavailable"
}
# Coordinator knows: search failed
# Coordinator doesn't know: why it failed, what was tried, what to do next

# ✅ STRUCTURED ERROR — enables intelligent recovery
search_agent_result = {
    "status": "error",
    "failure_type": "timeout",
    "attempted_query": "AI drug discovery clinical trials 2024",
    "partial_results": [
        {"title": "AI in Pharma 2024", "url": "...", "status": "retrieved"},
        {"title": "Clinical AI Review", "url": "...", "status": "timeout"}
    ],
    "alternative_approaches": [
        "Try more specific: 'AI phase 3 oncology trials 2024'",
        "Use document analysis agent with pre-loaded research database"
    ],
    "retry_recommended": True,
    "max_retries_remaining": 2
}
# Coordinator knows: what failed, what was retrieved, how to recover
```

### Error Propagation Flow

```
SUBAGENT encounters error
          │
          ▼
Is it a transient error (timeout, rate limit)?
          │
    YES   │   NO (validation, permission, business)
          │
          ▼   ▼
  Retry locally      Return error immediately
  (exponential       to coordinator with full
   backoff, 3x max)  structured context
          │
  All retries failed?
          │
    YES   │   NO
          │
          ▼   ▼
  Return structured    Return successful result
  error with partial   to coordinator
  results to
  coordinator
          │
          ▼
COORDINATOR receives structured error
          │
          ▼
  Can it try an alternative approach?
          │
    YES   │   NO
          │
          ▼   ▼
  Spawn alternative   Synthesize with
  subagent or retry   available partial
  with modified query  results + note gaps
```

### Two Anti-Patterns in Error Handling

```
❌ ANTI-PATTERN 1: Suppress error as success
   except Timeout:
       return {"results": [], "status": "success"}
   
   Problem: Coordinator thinks search found nothing (valid empty result).
            It won't retry or use alternatives.
            Report will have coverage gaps with no explanation.

❌ ANTI-PATTERN 2: Terminate entire pipeline on single failure
   if any_subagent_failed:
       raise SystemError("Pipeline failed — aborting")
   
   Problem: Throws away partial results from all other subagents.
            A complete 5-agent pipeline becomes zero results.
            Better: synthesize what succeeded + annotate gaps.
```

### Coverage Annotations in Synthesis

When some sources failed, the synthesis should explicitly annotate what's well-covered vs. what has gaps:

```json
{
  "report_sections": [
    {
      "topic": "AI in Drug Discovery",
      "coverage": "strong",
      "sources_count": 8,
      "confidence": "high",
      "content": "Based on 8 sources..."
    },
    {
      "topic": "AI in Clinical Trials (Phase 3)",
      "coverage": "partial",
      "sources_count": 2,
      "confidence": "medium",
      "gap_note": "Web search timed out for 3 of 5 planned queries. "
                  "Section based on limited sources. Recommend follow-up search.",
      "content": "Limited data suggests..."
    }
  ],
  "overall_confidence": "medium",
  "recommended_follow_up": ["Retry 'AI phase 3 clinical trials' queries"]
}
```

---

## Task Statement 5.4: Large Codebase Exploration

### Context Degradation in Extended Sessions

```
SIGNS OF CONTEXT DEGRADATION:
  • Agent starts saying "typically in projects like this..." instead of citing
    specific files it discovered earlier
  • Recommendations reference "common patterns" not the actual codebase
  • Earlier tool results are effectively forgotten
  • Agent gives inconsistent answers about files it read 30 turns ago

ROOT CAUSE: Earlier tool results pushed deep into context window
            → receive less attention → effectively "forgotten"
```

### Scratchpad Files — Persistent Memory

Have agents write key findings to files immediately upon discovery:

```python
# Agent writes findings to a scratchpad file as it discovers them
def update_scratchpad(new_finding: str):
    existing = ""
    try:
        with open("scratchpad.md", "r") as f:
            existing = f.read()
    except FileNotFoundError:
        pass
    
    with open("scratchpad.md", "w") as f:
        f.write(existing + f"\n\n{new_finding}")

# Example scratchpad content
scratchpad_content = """
# Auth Module Analysis — Session 2025-04-11

## Key Components Found:
- AuthMiddleware: src/auth/middleware.ts — handles JWT validation
- Token refresh: src/auth/refresh.ts
- Critical functions: validateToken(), refreshSession(), revokeAccess()

## Dependencies:
- jsonwebtoken@9.0.0 (beware: v8 had vulnerability CVE-2022-23539)
- Redis for session storage (connection pool in src/db/redis.ts)
- Custom error types: src/errors/auth-errors.ts

## Issues Found:
- NO rate limiting on /auth/refresh endpoint — DoS risk
- Token expiry check uses local time (timezone drift possible)
- refreshSession() does not invalidate old tokens on refresh

## Files NOT Yet Analyzed:
- src/auth/oauth.ts
- src/middleware/cors.ts
"""

# Later, when context has degraded, reference the scratchpad:
# "Based on your scratchpad.md findings, trace how revokeAccess()
#  propagates to active sessions in Redis."
# → Agent reads scratchpad → gets back key facts without needing 
#    old tool results in context
```

### Subagent Delegation for Exploration

```python
# COORDINATOR — manages high-level understanding
# SUBAGENTS — do the heavy investigation

# Each subagent has a specific investigation question:
subagent_questions = [
    "Find all test files. Categorize: unit, integration, e2e. "
    "Return: counts per category, which commands run each type.",
    
    "Trace the refund flow from POST /api/refunds endpoint "
    "through all middleware to the database write operation. "
    "Return: ordered list of functions called, files involved.",
    
    "Identify all external service dependencies (HTTP calls, DB, cache, queues). "
    "For each: client library used, timeout configured, error handling present."
]

# Each subagent operates in isolated context
# Returns only concise findings to main agent
# Main agent context stays clean
```

### Crash Recovery with State Manifests

```
BEFORE CRASH: Each agent saves state periodically
  ┌────────────────────────────────────────────────────────┐
  │ manifests/                                             │
  │   search-agent-1.json    ← completed 2/5 queries      │
  │   search-agent-2.json    ← completed 5/5 queries      │
  │   doc-agent-1.json       ← not yet started            │
  │   synthesis-agent.json   ← blocked (waiting)          │
  └────────────────────────────────────────────────────────┘

AFTER CRASH: Coordinator loads all manifests
  ┌────────────────────────────────────────────────────────┐
  │ search-agent-1: PARTIAL → resume with queries 3,4,5    │
  │ search-agent-2: COMPLETE → load findings, skip         │
  │ doc-agent-1:   PENDING → start from scratch            │
  │ synthesis-agent: BLOCKED → resume after search done    │
  └────────────────────────────────────────────────────────┘

Result: Only incomplete work is redone — complete work is preserved
```

```python
import json
from datetime import datetime

def save_agent_manifest(agent_id: str, completed: list, pending: list, findings_file: str):
    manifest = {
        "agent_id": agent_id,
        "status": "partial" if pending else "complete",
        "completed_queries": completed,
        "pending_queries": pending,
        "findings_file": findings_file,
        "last_checkpoint": datetime.utcnow().isoformat() + "Z"
    }
    with open(f"manifests/{agent_id}.json", "w") as f:
        json.dump(manifest, f, indent=2)

def resume_pipeline_after_crash():
    import glob
    manifests = []
    for path in glob.glob("manifests/*.json"):
        with open(path) as f:
            manifests.append(json.load(f))
    
    for m in manifests:
        if m["status"] == "partial":
            resume_agent(m["agent_id"], m["pending_queries"])
        elif m["status"] == "complete":
            # Just load existing findings — don't redo work
            load_findings(m["findings_file"])
```

---

## Task Statement 5.5: Human Review and Confidence Calibration

### The Aggregate Accuracy Trap

```
OVERALL ACCURACY: 97% ← Looks good!

But broken down by document type:
  Invoices (standard format):     99.5% ✓
  Receipts (varied format):       98.2% ✓
  Purchase orders:                96.1% ✓
  Contracts (complex language):   85.4% ✗ ← HIDDEN PROBLEM
  Handwritten notes (scanned):    71.8% ✗ ← CRITICAL PROBLEM

And by field:
  Vendor name:       99.3% ✓
  Total amount:      97.6% ✓
  Date:              95.8% ✓
  Tax ID:            78.2% ✗ ← HIDDEN PROBLEM
  Line item details: 83.5% ✗ ← PROBLEM

LESSON: A 97% overall accuracy masks fields/types where you'd 
        be wrong 1 in 7 times. Always validate by SEGMENT, 
        not just in aggregate, before automating.
```

### Stratified Random Sampling

Don't only review low-confidence extractions — also randomly sample high-confidence ones:

```python
import random

def build_review_queue(extractions: list, sample_rate: float = 0.05) -> list:
    review_queue = []
    
    # Always review low-confidence extractions
    for extraction in extractions:
        if extraction.confidence < 0.80:
            review_queue.append({
                "extraction": extraction,
                "review_reason": f"Confidence {extraction.confidence:.2f} below 0.80 threshold"
            })
    
    # ALSO randomly sample high-confidence extractions by document type
    # (catches novel error patterns that confidence score doesn't flag)
    high_conf = [e for e in extractions if e.confidence >= 0.80]
    
    for doc_type in set(e.doc_type for e in high_conf):
        type_extractions = [e for e in high_conf if e.doc_type == doc_type]
        sample_n = max(1, int(len(type_extractions) * sample_rate))
        sampled = random.sample(type_extractions, sample_n)
        
        for e in sampled:
            review_queue.append({
                "extraction": e,
                "review_reason": f"Stratified random sample ({doc_type})"
            })
    
    return review_queue

# WHY: High-confidence extractions can still be wrong in systematic ways
# that the confidence score doesn't detect (e.g., new document format).
# Stratified sampling catches drift before it becomes a major problem.
```

### Field-Level Confidence

Extract confidence per field, not just per document:

```json
{
  "extraction": {
    "vendor_name":   {"value": "Acme Corp",    "confidence": 0.97},
    "total_amount":  {"value": 1250.00,         "confidence": 0.93},
    "invoice_date":  {"value": "2025-03-15",    "confidence": 0.88},
    "tax_id":        {"value": "12-3456789",    "confidence": 0.61},
    "line_items":    {"value": [...],            "confidence": 0.79}
  },
  "overall_confidence": 0.84,
  "routing": "human_review",
  "review_reason": "tax_id confidence (0.61) below 0.80 threshold",
  "fields_for_review": ["tax_id"]
}
```

### Confidence Calibration Process

```
CALIBRATION WORKFLOW:

1. Process a labeled validation set (documents with known-correct answers)

2. Compare model's confidence scores to actual accuracy:
   "When model says 0.90, is it correct 90% of the time?"
   
   Finding: Model says 0.90 → actually correct 94% → model is UNDERCONFIDENT
   Finding: Model says 0.90 → actually correct 72% → model is OVERCONFIDENT

3. Apply calibration correction:
   If model reports 0.85 but true accuracy is 0.70:
   adjusted_threshold = 0.92  (raise the threshold to maintain 0.85 actual)

4. Set routing thresholds AFTER calibration:
   < adjusted_threshold → human review
   >= adjusted_threshold → auto-process
```

---

## Task Statement 5.6: Information Provenance

### Claim-Source Mappings

Require subagents to output structured mappings that downstream agents preserve through the full pipeline:

```json
{
  "claim": "AI reduces drug discovery time by 40%",
  "confidence": "high",
  "sources": [
    {
      "url": "https://nature.com/articles/nm-2025-0123",
      "document_name": "Nature Medicine Vol 32, Issue 3",
      "relevant_excerpt": "Our analysis of 50 pharma companies showed...",
      "publication_date": "2025-03-15",
      "methodology": "Meta-analysis of 50 companies over 5 years"
    }
  ]
}
```

Every synthesis agent must pass these mappings through — never strip source metadata.

### Handling Conflicting Statistics

Don't pick one arbitrarily. Annotate both with context:

```json
{
  "claim": "Global AI market size in 2025",
  "conflict": true,
  "values": [
    {
      "value": "$190 billion",
      "source": "McKinsey Global Report 2025-01",
      "methodology": "Excludes embedded AI in hardware"
    },
    {
      "value": "$214 billion",
      "source": "Gartner Market Analysis 2025-03",
      "methodology": "Includes embedded AI in hardware and IoT"
    }
  ],
  "conflict_explanation": "Discrepancy due to different market scope definitions, "
                           "not contradiction. Both figures are plausibly correct "
                           "for their respective definitions.",
  "resolution": "present_both_with_context"
}
```

### Temporal Data — Require Publication Dates

```json
{
  "claim": "Acme Corp annual revenue",
  "values": [
    {"value": "$5.2B", "source": "2024 Annual Report", "data_date": "2024-12-31"},
    {"value": "$4.8B", "source": "Q3 2024 Forecast",   "data_date": "2024-09-30"}
  ],
  "temporal_note": "Not a contradiction — Q3 forecast vs. full-year actuals are expected to differ."
}
```

Without dates, these look like contradictions. With dates, the difference is obvious and expected.

---

## Practice Questions — Domain 5

### Question 1
Your customer support agent handles multi-issue sessions. After 10 turns, it gives vague responses like "as discussed earlier" instead of citing specific amounts. Best fix?

**A)** Increase the model's context window size  
**B)** Extract transactional facts into a persistent "case facts" block included in every prompt, outside summarized history  
**C)** Add "always be specific about amounts and dates" to the system prompt  
**D)** Reduce the number of tools used to save tokens per turn  

**Correct Answer: B**  
Extracting facts into a persistent structured block prevents progressive summarization from losing critical numerical details. A doesn't fix the summarization issue. C is vague instruction (won't help if the facts are lost from context). D doesn't address context management.

---

### Question 2
Your extraction system has 97% overall accuracy. Your team wants to fully automate high-confidence extractions. What must you verify first?

**A)** That 97% accuracy holds when measured by document type AND field, not just in aggregate  
**B)** That self-reported confidence scores are above 0.95 for all extractions  
**C)** That a 10-sample spot check was all correct  
**D)** That the extraction prompt includes few-shot examples for all document types  

**Correct Answer: A**  
Aggregate accuracy can mask catastrophic failure on specific segments (85% on contracts, 72% on handwritten). You must validate across all segments before automating. B relies on uncalibrated confidence scores. C is too small a sample. D doesn't validate actual accuracy.

---

### Question 3
Your multi-agent research pipeline has 5 subagents. One web search subagent times out mid-pipeline. What should happen?

**A)** Terminate the entire pipeline immediately and report failure  
**B)** The search subagent returns a generic "search failed" message; coordinator retries the full pipeline  
**C)** The search subagent returns structured error context with partial results; coordinator synthesizes with available data and annotates the gap  
**D)** The coordinator waits indefinitely for the search subagent to complete  

**Correct Answer: C**  
Structured error context enables the coordinator to produce a useful (if incomplete) result rather than failing entirely. A throws away all other subagents' work. B (generic error) gives coordinator no recovery information. D doesn't handle the timeout at all.

---

## Quick Reference — Domain 5 Cheat Sheet

| Concept | Key Fact |
|---|---|
| **Progressive summarization** | Loses exact numbers, dates, amounts — the critical facts |
| **Case facts block** | Persistent structured data OUTSIDE summarized history |
| **Lost in the middle** | Models process start and end better than middle of long inputs |
| **Mitigation** | Key findings at beginning, section headers, structured blocks |
| **Verbose tool outputs** | Trim to only task-relevant fields before entering context |
| **Subagent output** | Return structured data, not verbose reasoning chains |
| **Escalation: when** | Customer requests human, policy gap, cannot progress |
| **Customer says "give me a human"** | Escalate IMMEDIATELY — no investigation attempt first |
| **Sentiment-based escalation** | UNRELIABLE — frustration ≠ complexity |
| **Self-reported confidence** | UNRELIABLE — LLM confidence is poorly calibrated |
| **Multiple customer matches** | Ask for additional identifiers — never use heuristics |
| **Structured handoff** | Include: customer_id, root_cause, amounts, recommended_action |
| **Generic error messages** | Anti-pattern — coordinator can't make recovery decisions |
| **Suppressing errors as success** | Anti-pattern — hides failures from coordinator |
| **Terminating on single failure** | Anti-pattern — wastes all partial results |
| **Coverage annotations** | Mark partial sections with gap_note and source count |
| **Context degradation** | Extended sessions → vague answers referencing "typical patterns" |
| **1M context window** | Opus 4.6 on Max/Team/Enterprise tiers (v2.1.84+); standard is 200K |
| **Scratchpad files** | Persist key findings to files — survives context compression |
| **/compact** | Reduces context usage. Persistent rules → CLAUDE.md not prompt. |
| **Crash recovery** | State manifests → resume only incomplete work |
| **97% aggregate accuracy** | Can mask 72% accuracy on specific segment |
| **Stratified sampling** | Sample high-confidence extractions BY document type |
| **Field-level confidence** | Calibrate per-field, not per-document |
| **Source attribution** | Claim-source mappings preserved through all synthesis layers |
| **Conflicting statistics** | Present both with source context — never arbitrarily pick one |
| **Temporal data** | Require publication dates — prevents false contradiction diagnosis |

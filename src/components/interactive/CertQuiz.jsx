import { useState, useCallback, useMemo } from "react";

const allQuestions = [
  // DOMAIN 1: Agentic Architecture (27%)
  {
    id: 1, domain: 1, domainName: "Agentic Architecture", difficulty: "Medium",
    question: "Your agentic loop checks for text content in Claude's response to determine when to stop. Users report incomplete results. What's the root cause?",
    options: [
      "A) The max_tokens setting is too low",
      "B) The loop terminates when Claude includes text alongside tool calls, instead of checking stop_reason for 'end_turn'",
      "C) Tool definitions are too vague",
      "D) Conversation history isn't being passed between iterations"
    ],
    correct: 1,
    explanation: "Claude often emits text alongside tool_use blocks (e.g., 'Let me look up your order...'). Checking for text presence instead of stop_reason == 'end_turn' causes premature termination. Always use stop_reason as the sole loop control signal."
  },
  {
    id: 2, domain: 1, domainName: "Agentic Architecture", difficulty: "Hard",
    question: "Production data shows your agent skips get_customer in 12% of cases, calling lookup_order with only the customer's name, leading to misidentified accounts. What change most effectively addresses this?",
    options: [
      "A) Add a programmatic prerequisite that blocks lookup_order and process_refund until get_customer has returned a verified customer ID",
      "B) Enhance the system prompt to state that customer verification is mandatory",
      "C) Add few-shot examples showing the agent always calling get_customer first",
      "D) Implement a routing classifier that enables only appropriate tools per request type"
    ],
    correct: 0,
    explanation: "When a specific tool sequence is required for critical business logic (identity verification before financial operations), programmatic enforcement (hooks) provides deterministic guarantees. Options B and C are probabilistic. Option D addresses tool availability, not ordering."
  },
  {
    id: 3, domain: 1, domainName: "Agentic Architecture", difficulty: "Hard",
    question: "Your multi-agent research system produces reports covering only visual arts when asked about 'AI impact on creative industries.' The coordinator decomposed the topic into: 'AI in digital art,' 'AI in graphic design,' 'AI in photography.' Each subagent completed successfully. What's the root cause?",
    options: [
      "A) The synthesis agent lacks instructions for identifying coverage gaps",
      "B) The coordinator's task decomposition is too narrow, missing music, writing, and film",
      "C) The web search agent's queries aren't comprehensive enough",
      "D) The document analysis agent filters out non-visual creative industries"
    ],
    correct: 1,
    explanation: "The coordinator's logs show it only assigned visual arts subtasks. Subagents executed correctly within their assigned scope — the problem is what they were assigned. Options A, C, and D blame downstream agents working correctly within their scope."
  },
  {
    id: 4, domain: 1, domainName: "Agentic Architecture", difficulty: "Medium",
    question: "Your synthesis subagent consistently produces reports missing citations from web search results, even though the search subagent returns them correctly. What's the most likely cause?",
    options: [
      "A) The synthesis model is too small to handle citation formatting",
      "B) The coordinator isn't passing web search findings to the synthesis subagent's prompt — subagents don't inherit coordinator context",
      "C) The web search agent returns citations in an unparseable format",
      "D) The synthesis agent needs few-shot examples of correct citation format"
    ],
    correct: 1,
    explanation: "Subagents operate with isolated context — they don't automatically inherit the coordinator's conversation history. If findings aren't explicitly included in the synthesis subagent's prompt, it simply doesn't have them."
  },
  {
    id: 5, domain: 1, domainName: "Agentic Architecture", difficulty: "Medium",
    question: "You analyzed a codebase yesterday. Overnight, teammates significantly refactored 5 of the 20 modules you analyzed. What's the most reliable way to continue this morning?",
    options: [
      "A) Resume the session with --resume and re-analyze the 5 changed modules",
      "B) Start a new session with a structured summary of yesterday's findings, noting which modules changed",
      "C) Resume with --resume without mentioning changes — Claude will detect them",
      "D) Use fork_session to create a branch focusing on the changed modules"
    ],
    correct: 1,
    explanation: "Starting fresh with injected summaries is more reliable than resuming with stale tool results. The prior session's analysis of those 5 modules is now outdated. Option A risks reasoning from stale data. C is dangerous. D forks from a stale baseline."
  },
  {
    id: 6, domain: 1, domainName: "Agentic Architecture", difficulty: "Medium",
    question: "Which mechanism is used to spawn subagents in the Claude Agent SDK?",
    options: [
      "A) The Spawn tool with SubagentConfig",
      "B) The Agent tool (formerly Task), with allowedTools including 'Agent'",
      "C) The Fork tool with AgentDefinition",
      "D) Direct API calls from within the coordinator's prompt"
    ],
    correct: 1,
    explanation: "The Agent tool (renamed from Task in v2.1.63) is the mechanism for spawning subagents. The coordinator's allowedTools must include 'Agent' to invoke subagents. AgentDefinition configures each subagent's description, prompt, tools, and model."
  },
  // DOMAIN 2: Tool Design & MCP (18%)
  {
    id: 7, domain: 2, domainName: "Tool Design & MCP", difficulty: "Medium",
    question: "Your agent frequently calls get_customer when users ask about orders. Both tools have minimal descriptions and accept similar identifiers. What's the most effective first step?",
    options: [
      "A) Add 5-8 few-shot examples showing correct tool selection",
      "B) Expand each tool's description to include input formats, example queries, edge cases, and boundaries",
      "C) Implement a routing layer that parses input and pre-selects tools",
      "D) Consolidate both tools into a single lookup_entity tool"
    ],
    correct: 1,
    explanation: "Tool descriptions are the primary mechanism for tool selection. Expanding them is the lowest-effort, highest-leverage fix. Few-shot examples (A) add token overhead without fixing the root cause. Routing layer (C) is over-engineered. Consolidation (D) requires more effort than a first step warrants."
  },
  {
    id: 8, domain: 2, domainName: "Tool Design & MCP", difficulty: "Hard",
    question: "Your web search subagent times out. Which error propagation approach best enables the coordinator to make intelligent recovery decisions?",
    options: [
      "A) Return structured error context including failure type, attempted query, partial results, and alternative approaches",
      "B) Retry with exponential backoff, returning generic 'search unavailable' after all retries fail",
      "C) Return an empty result set marked as successful",
      "D) Propagate the timeout exception to terminate the entire research workflow"
    ],
    correct: 0,
    explanation: "Structured error context lets the coordinator decide: retry with modified query, try alternatives, or proceed with partial results. Generic status (B) hides context. Empty success (C) suppresses the error. Full termination (D) wastes partial results."
  },
  {
    id: 9, domain: 2, domainName: "Tool Design & MCP", difficulty: "Medium",
    question: "You need to guarantee Claude calls an extraction tool rather than returning conversational text, but the document type is unknown. How should you set tool_choice?",
    options: [
      "A) tool_choice: 'auto'",
      "B) tool_choice: 'any'",
      "C) tool_choice: {type: 'tool', name: 'extract_invoice'}",
      "D) Don't set tool_choice, use system prompt instructions instead"
    ],
    correct: 1,
    explanation: "'any' guarantees Claude calls a tool but lets it choose which extraction schema fits the document. 'auto' might return text. Forced selection assumes a specific type. System prompt is probabilistic."
  },
  {
    id: 10, domain: 2, domainName: "Tool Design & MCP", difficulty: "Easy",
    question: "Where should you configure an MCP server that the entire team should use?",
    options: [
      "A) ~/.claude.json (user-level)",
      "B) .mcp.json in the project repository root (project-level)",
      "C) .claude/settings.json",
      "D) The system prompt"
    ],
    correct: 1,
    explanation: "Project-level .mcp.json is shared via version control and available to all team members. User-level ~/.claude.json is personal. Environment variable expansion (${TOKEN}) keeps secrets out of the committed file."
  },
  // DOMAIN 3: Claude Code Config (20%)
  {
    id: 11, domain: 3, domainName: "Claude Code Configuration", difficulty: "Medium",
    question: "A new team member reports Claude Code doesn't follow your team's coding conventions. You confirm conventions are properly defined. Where's the most likely problem?",
    options: [
      "A) Conventions are in ~/.claude/CLAUDE.md (user-level, not shared via version control)",
      "B) The new member's Claude Code version is outdated",
      "C) The .claude/rules/ files have incorrect glob patterns",
      "D) The @import syntax isn't supported on the new member's OS"
    ],
    correct: 0,
    explanation: "User-level ~/.claude/CLAUDE.md is NOT shared via version control. The new team member doesn't have this file. Move conventions to .claude/CLAUDE.md (project-level) to make them available to everyone."
  },
  {
    id: 12, domain: 3, domainName: "Claude Code Configuration", difficulty: "Easy",
    question: "Your CI pipeline runs 'claude \"Analyze this PR\"' but hangs indefinitely. What's the correct fix?",
    options: [
      "A) claude -p \"Analyze this PR\"",
      "B) Set CLAUDE_HEADLESS=true environment variable",
      "C) Redirect stdin: claude \"Analyze this PR\" < /dev/null",
      "D) Add --batch flag: claude --batch \"Analyze this PR\""
    ],
    correct: 0,
    explanation: "The -p (or --print) flag runs Claude Code in non-interactive mode. Options B, C, and D reference non-existent features or workarounds that don't properly address Claude Code's command syntax."
  },
  {
    id: 13, domain: 3, domainName: "Claude Code Configuration", difficulty: "Hard",
    question: "Test files are spread throughout your codebase (Button.test.tsx next to Button.tsx). You want all tests to follow the same conventions regardless of location. What's the most maintainable approach?",
    options: [
      "A) Create .claude/rules/testing.md with paths: ['**/*.test.*'] in YAML frontmatter",
      "B) Put all conventions in root CLAUDE.md and rely on Claude to infer which apply",
      "C) Create skills in .claude/skills/ for each code type",
      "D) Place a separate CLAUDE.md in each subdirectory"
    ],
    correct: 0,
    explanation: ".claude/rules/ with glob patterns automatically applies conventions based on file paths regardless of directory. B relies on inference. C requires manual invocation. D can't handle files spread across many directories."
  },
  {
    id: 14, domain: 3, domainName: "Claude Code Configuration", difficulty: "Medium",
    question: "You need to restructure a monolith into microservices, affecting dozens of files with architectural decisions about service boundaries. Which approach should you take?",
    options: [
      "A) Enter plan mode to explore the codebase and design an approach before making changes",
      "B) Start with direct execution incrementally",
      "C) Use direct execution with comprehensive upfront instructions",
      "D) Begin in direct execution and switch to plan mode if you encounter complexity"
    ],
    correct: 0,
    explanation: "Plan mode is designed for complex tasks with large-scale changes, multiple valid approaches, and architectural decisions. It enables safe exploration before committing. B risks costly rework. C assumes you know the answer. D ignores that complexity is already stated."
  },
  // DOMAIN 4: Prompt Engineering (20%)
  {
    id: 15, domain: 4, domainName: "Prompt Engineering", difficulty: "Medium",
    question: "Your code review agent has high false positive rates. Adding 'only report high-confidence findings' to the system prompt didn't help. What's the most effective improvement?",
    options: [
      "A) Add 'be more conservative' and 'double-check before reporting'",
      "B) Write specific review criteria defining which issues to report (bugs, security) versus skip (minor style)",
      "C) Lower the model temperature to reduce variability",
      "D) Use a more capable model with better judgment"
    ],
    correct: 1,
    explanation: "General instructions like 'be conservative' or 'only report high-confidence findings' fail to improve precision. Specific categorical criteria ('flag only when claimed behavior contradicts code') give Claude clear decision boundaries."
  },
  {
    id: 16, domain: 4, domainName: "Prompt Engineering", difficulty: "Medium",
    question: "Your extraction system uses tool_use with JSON schemas. It never produces malformed JSON, but line items frequently don't sum to the stated total. What type of error is this?",
    options: [
      "A) Schema syntax error — fix with stricter JSON schema",
      "B) Semantic error — tool_use eliminates syntax errors but cannot prevent logical inconsistencies",
      "C) Validation error — add retry logic with error feedback",
      "D) Tool description error — improve the extraction tool's description"
    ],
    correct: 1,
    explanation: "tool_use with JSON schemas guarantees schema-compliant output (eliminating syntax errors) but cannot prevent semantic errors like values that don't sum correctly. You need separate validation logic to catch these."
  },
  {
    id: 17, domain: 4, domainName: "Prompt Engineering", difficulty: "Hard",
    question: "Your team wants to switch both workflows to the Message Batches API for 50% savings: (1) blocking pre-merge checks and (2) overnight technical debt reports. How should you evaluate this?",
    options: [
      "A) Use batch for technical debt reports only; keep real-time for pre-merge checks",
      "B) Switch both to batch with status polling for completion",
      "C) Keep real-time for both to avoid batch ordering issues",
      "D) Switch both to batch with a timeout fallback to real-time"
    ],
    correct: 0,
    explanation: "The Batch API has processing times up to 24 hours with no latency SLA — unsuitable for blocking pre-merge checks. But ideal for overnight batch jobs. Match each API to its appropriate use case."
  },
  {
    id: 18, domain: 4, domainName: "Prompt Engineering", difficulty: "Medium",
    question: "Your extraction prompt sometimes fabricates values for fields not present in the source document. What's the best schema design fix?",
    options: [
      "A) Add 'do not fabricate values' to the system prompt",
      "B) Make fields optional (nullable) when source documents may not contain the information",
      "C) Add a retry loop that validates all fields are present",
      "D) Use tool_choice: 'any' to let Claude pick the best extraction schema"
    ],
    correct: 1,
    explanation: "When fields are required in the schema but absent from the source, Claude fabricates values to satisfy the schema. Making fields nullable gives Claude the option to return null instead of inventing data."
  },
  {
    id: 19, domain: 4, domainName: "Prompt Engineering", difficulty: "Hard",
    question: "A 14-file PR review produces inconsistent results: detailed feedback for some files, superficial for others, and contradictory findings. How should you restructure?",
    options: [
      "A) Split into per-file local analysis passes plus a separate cross-file integration pass",
      "B) Require developers to split large PRs into smaller submissions",
      "C) Use a higher-tier model with a larger context window",
      "D) Run three independent passes and only flag issues found in at least two"
    ],
    correct: 0,
    explanation: "Splitting into focused passes addresses attention dilution. File-by-file ensures consistent depth. Integration pass catches cross-file issues. B shifts burden to developers. C doesn't fix attention quality. D suppresses intermittent but real bugs."
  },
  // DOMAIN 5: Context & Reliability (15%)
  {
    id: 20, domain: 5, domainName: "Context & Reliability", difficulty: "Medium",
    question: "After 10 turns, your customer support agent gives vague responses like 'as discussed earlier' instead of referencing specific amounts. What's the best fix?",
    options: [
      "A) Increase the context window size",
      "B) Extract transactional facts (amounts, dates, order numbers) into a persistent 'case facts' block outside summarized history",
      "C) Add 'always be specific about numbers and dates' to the system prompt",
      "D) Reduce the number of tools to save tokens per turn"
    ],
    correct: 1,
    explanation: "Progressive summarization loses numerical details. A persistent case facts block ensures critical transactional data is preserved regardless of summarization."
  },
  {
    id: 21, domain: 5, domainName: "Context & Reliability", difficulty: "Medium",
    question: "Your agent achieves 55% first-contact resolution. Logs show it escalates simple cases while attempting complex policy exceptions autonomously. What's the most effective improvement?",
    options: [
      "A) Add explicit escalation criteria with few-shot examples demonstrating when to escalate vs resolve",
      "B) Have the agent self-report confidence and auto-escalate below a threshold",
      "C) Deploy a classifier model trained on historical tickets",
      "D) Implement sentiment analysis to detect customer frustration"
    ],
    correct: 0,
    explanation: "Explicit criteria with examples address unclear decision boundaries. Self-reported confidence (B) is poorly calibrated. Classifier (C) is over-engineered before trying prompt optimization. Sentiment (D) doesn't correlate with case complexity."
  },
  {
    id: 22, domain: 5, domainName: "Context & Reliability", difficulty: "Medium",
    question: "A customer says 'I want to talk to a real person.' Your agent's best response is:",
    options: [
      "A) 'I understand. Let me first quickly check your account to provide a complete handoff.'",
      "B) 'I'd be happy to connect you with a human agent. Let me compile a summary of your issue for them.'",
      "C) 'I can likely resolve this faster than a human agent. What's the issue?'",
      "D) 'Before I transfer you, can I try one more thing?'"
    ],
    correct: 1,
    explanation: "Honor explicit customer requests for human agents immediately. Don't attempt investigation first (A), don't try to retain them (C, D). Compile a structured handoff summary so the human agent has context."
  },
  {
    id: 23, domain: 5, domainName: "Context & Reliability", difficulty: "Hard",
    question: "Your extraction system reports 97% overall accuracy. Should you automate high-confidence extractions without human review?",
    options: [
      "A) Yes, 97% is sufficient for production",
      "B) Only after validating accuracy by document type and field segment to ensure consistent performance across all segments",
      "C) Only after confirming the model's self-reported confidence scores exceed 0.95",
      "D) Yes, but add a random 5% sample for ongoing monitoring"
    ],
    correct: 1,
    explanation: "97% aggregate accuracy can mask poor performance on specific document types or fields (e.g., 99% on invoices but 72% on handwritten notes). Validate per-segment performance before automating."
  },
  {
    id: 24, domain: 5, domainName: "Context & Reliability", difficulty: "Medium",
    question: "Your synthesis agent must combine findings that include conflicting statistics from two credible sources. What should it do?",
    options: [
      "A) Select the more recent source's value",
      "B) Average the two values",
      "C) Annotate both values with source attribution, noting the conflict",
      "D) Exclude both values due to unreliability"
    ],
    correct: 2,
    explanation: "Don't arbitrarily select one value. Preserve both with source attribution and note the conflict. Include temporal context (publication dates) so readers can judge which is more relevant."
  },
  {
    id: 25, domain: 2, domainName: "Tool Design & MCP", difficulty: "Hard",
    question: "The synthesis agent frequently needs to verify facts during synthesis, causing 2-3 round trips through the coordinator to the web search agent (40% latency increase). 85% are simple fact-checks. What's the best approach?",
    options: [
      "A) Give the synthesis agent a scoped verify_fact tool for simple lookups, with complex verifications still going through the coordinator",
      "B) Have the synthesis agent batch all verifications and return them to the coordinator at once",
      "C) Give the synthesis agent full web search access",
      "D) Have the search agent proactively cache extra context anticipating verification needs"
    ],
    correct: 0,
    explanation: "Scoped verify_fact handles the 85% common case while preserving coordination for complex cases (least privilege). Batching (B) creates blocking dependencies. Full access (C) violates separation of concerns. Proactive caching (D) can't predict needs reliably."
  },
  // DOMAIN 1: Agentic Architecture — Extended Thinking & Claude 4
  {
    id: 26, domain: 1, domainName: "Agentic Architecture", difficulty: "Hard",
    question: "Your agent uses claude-sonnet-4-20250514 with extended thinking enabled. You set budget_tokens: 5000 but the agent consistently ignores complex analysis steps. What's the most likely cause?",
    options: [
      "A) Extended thinking requires a minimum budget_tokens of 10,000",
      "B) Extended thinking is only supported on claude-opus-4-20250514",
      "C) The budget_tokens ceiling is being hit before the LLM finishes thinking, causing truncated reasoning",
      "D) Extended thinking conflicts with tool_use and must be disabled when using tools"
    ],
    correct: 2,
    explanation: "If budget_tokens is too low for the complexity of the task, the model's thinking chain gets cut short, leading to incomplete or shallow analysis. Increase budget_tokens (up to 32,000 for complex tasks). Extended thinking is supported on claude-sonnet-4 and claude-opus-4. Tools and extended thinking work together."
  },
  {
    id: 27, domain: 1, domainName: "Agentic Architecture", difficulty: "Medium",
    question: "The Agent tool (formerly Task) in Claude Code is used to spawn subagents. What is the correct property name in allowedTools to enable subagent spawning?",
    options: [
      "A) 'Task'",
      "B) 'Spawn'",
      "C) 'Agent'",
      "D) 'SubAgent'"
    ],
    correct: 2,
    explanation: "The tool was renamed from 'Task' to 'Agent' in Claude Code v2.1.63. The coordinator's allowedTools must include 'Agent' (not 'Task') to spawn subagents. Using 'Task' is the legacy name and may fail in current versions."
  },
  // DOMAIN 2: Tool Design & MCP — MCP 2.0
  {
    id: 28, domain: 2, domainName: "Tool Design & MCP", difficulty: "Hard",
    question: "You're implementing an MCP server under MCP 2.0 (released early 2025). Your tool needs to stream large responses. Which transport protocol does MCP 2.0 introduce as the production-grade replacement for HTTP+SSE?",
    options: [
      "A) gRPC streaming",
      "B) WebSocket bidirectional streaming",
      "C) Streamable HTTP (replaces HTTP+SSE as MCP 2.0 standard transport)",
      "D) WebRTC data channels"
    ],
    correct: 2,
    explanation: "MCP 2.0 introduced Streamable HTTP as a unified transport that supports both streaming and non-streaming responses, replacing the older HTTP+SSE protocol. It enables proper bidirectional communication without the limitations of SSE."
  },
  {
    id: 29, domain: 2, domainName: "Tool Design & MCP", difficulty: "Medium",
    question: "Your MCP server needs to expose both read-only database queries and destructive write operations. What's the best security practice for structuring tool permissions?",
    options: [
      "A) Put all tools in one MCP server; use system prompt to restrict write access",
      "B) Separate read-only tools and write tools into different MCP servers with different trust levels in allowedMCPServers",
      "C) Use a single server but prefix destructive tool names with 'DANGER_'",
      "D) Implement an approval workflow inside each write tool function"
    ],
    correct: 1,
    explanation: "Separating tools into servers with different trust levels applies the principle of least privilege. The project's .mcp.json can configure read-only tools as always-allowed (allowedMCPServers) while write tools require explicit trust grants. This prevents accidental approval of dangerous operations."
  },
  // DOMAIN 3: Claude Code Config
  {
    id: 30, domain: 3, domainName: "Claude Code Configuration", difficulty: "Medium",
    question: "MEMORY.md was introduced in Claude Code v2.1.59. What is its primary purpose and how does it differ from CLAUDE.md?",
    options: [
      "A) MEMORY.md stores persistent facts Claude discovers during sessions (auto-generated, ≤200 lines). CLAUDE.md stores team-written instructions (authored manually).",
      "B) MEMORY.md is user-level only while CLAUDE.md is project-level only",
      "C) MEMORY.md replaces CLAUDE.md for newer versions of Claude Code",
      "D) MEMORY.md stores encrypted API credentials; CLAUDE.md stores plaintext instructions"
    ],
    correct: 0,
    explanation: "MEMORY.md is auto-generated by Claude Code as it learns persistent facts about a project (architecture decisions, team preferences, discovered patterns). It's capped at 200 lines. CLAUDE.md is team-authored and contains intentional instructions. Both are loaded into context, but MEMORY.md grows organically through use while CLAUDE.md requires manual curation."
  },
  {
    id: 31, domain: 3, domainName: "Claude Code Configuration", difficulty: "Hard",
    question: "A PostCompact hook fires after Claude Code compacts the conversation. What is the most appropriate use case for this hook?",
    options: [
      "A) Blocking compaction unless certain conditions are met",
      "B) Injecting fresh project state (git status, recent file changes) after compaction to give Claude updated context",
      "C) Logging which files were modified before compaction",
      "D) Switching to a different model after compaction to save tokens"
    ],
    correct: 1,
    explanation: "PostCompact fires after conversation compaction. Since compaction discards tool results and history, the most valuable use is injecting fresh context — current git status, recent test results, or environment state — so Claude starts the compacted session with accurate current information rather than potentially stale pre-compaction data."
  },
  // DOMAIN 4: Prompt Engineering
  {
    id: 32, domain: 4, domainName: "Prompt Engineering", difficulty: "Medium",
    question: "You're comparing claude-haiku-4-20250514 vs claude-sonnet-4-20250514 for a document summarization pipeline processing 10,000 documents daily. Haiku produces quality you'd rate 7/10; Sonnet produces 9/10. Haiku costs $0.25/$1.25 per 1M tokens. Sonnet costs $3/$15 per 1M tokens. When should you choose Haiku over Sonnet?",
    options: [
      "A) Never — always use the highest quality model",
      "B) When 7/10 quality meets the use case's acceptance bar and the 12x cost difference matters at scale",
      "C) Only when latency is more critical than quality",
      "D) When processing fewer than 1,000 documents at a time"
    ],
    correct: 1,
    explanation: "Model selection is a cost/quality trade-off. At 10,000 docs/day with average 1K tokens/doc, the cost difference is significant (~$3/day vs ~$36/day). If 7/10 quality is acceptable for the use case, Haiku is the rational choice. Quality acceptability is domain-specific — summarization of internal docs vs patient medical records have very different thresholds."
  },
  {
    id: 33, domain: 4, domainName: "Prompt Engineering", difficulty: "Hard",
    question: "Your extraction agent uses claude-sonnet-4-20250514 with extended thinking (budget_tokens: 8000). You notice thinking_block tokens appear in the response but aren't counted towards your output tokens for pricing. After analysis, thinking tokens actually cost money. What is the correct pricing model for extended thinking?",
    options: [
      "A) Thinking tokens are free — only text output tokens are billed",
      "B) Thinking tokens are billed as output tokens at the same rate as text output",
      "C) Thinking tokens are billed at 2x the output token rate",
      "D) Extended thinking has a flat fee per call regardless of thinking token count"
    ],
    correct: 1,
    explanation: "Extended thinking tokens ARE billed as output tokens at the standard output token rate. They appear as thinking_block in the response. Budget_tokens sets the maximum, not a guaranteed or free allocation. Always account for thinking token costs when calculating extended thinking pipeline costs."
  },
  // DOMAIN 5: Context & Reliability
  {
    id: 34, domain: 5, domainName: "Context & Reliability", difficulty: "Hard",
    question: "Your production RAG agent using Adaptive RAG reports 91% accuracy overall but 61% on a specific query type (multi-hop comparative questions across policy documents). What's the most targeted fix?",
    options: [
      "A) Increase the MULTI_HOP classifier threshold so more queries route to multi-hop",
      "B) Switch to Graph RAG for the entire system to handle all relational queries",
      "C) Add dedicated multi-hop examples to the classifier prompt AND increase max_hops in the agentic retrieval loop for this query type",
      "D) Pre-compute all cross-policy comparisons as a lookup table"
    ],
    correct: 2,
    explanation: "The problem is two-fold: the classifier may misroute some multi-hop queries (fix: better classifier examples), AND the retrieval loop may terminate too early (fix: increase max_hops). Option A risks over-routing simple queries. Option B is over-engineered. Option D doesn't scale to dynamic queries."
  },
  {
    id: 35, domain: 5, domainName: "Context & Reliability", difficulty: "Medium",
    question: "When running /compact in Claude Code, what happens to tool call results in the conversation history?",
    options: [
      "A) Tool results are preserved verbatim in the compacted summary",
      "B) Tool results are summarized alongside conversation text into a compressed narrative",
      "C) Tool call input/output pairs are discarded; only the narrative conversation and key facts are kept",
      "D) Only the last 5 tool results are preserved; earlier ones are discarded"
    ],
    correct: 2,
    explanation: "The /compact command (and auto-compaction) discards tool call input/output pairs entirely, keeping only the synthesized narrative and key facts. This is why PostCompact hooks are valuable — they can re-inject fresh tool data (like current git status) that would otherwise be lost in the compaction."
  }
];

const domainColors = {
  1: { bg: "rgba(59,130,246,0.1)", border: "#3B82F6", text: "#93c5fd", tag: "rgba(59,130,246,0.15)" },
  2: { bg: "rgba(34,197,94,0.1)", border: "#22C55E", text: "#86efac", tag: "rgba(34,197,94,0.15)" },
  3: { bg: "rgba(249,115,22,0.1)", border: "#F97316", text: "#fdba74", tag: "rgba(249,115,22,0.15)" },
  4: { bg: "rgba(168,85,247,0.1)", border: "#A855F7", text: "#d8b4fe", tag: "rgba(168,85,247,0.15)" },
  5: { bg: "rgba(244,63,94,0.1)", border: "#F43F5E", text: "#fda4af", tag: "rgba(244,63,94,0.15)" },
};

function Quiz() {
  const [mode, setMode] = useState("menu");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);

  const startQuiz = useCallback((domain) => {
    const filtered = domain === "all" 
      ? [...allQuestions].sort(() => Math.random() - 0.5)
      : allQuestions.filter(q => q.domain === domain).sort(() => Math.random() - 0.5);
    setQuestions(filtered);
    setSelectedDomain(domain);
    setCurrentQ(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setAnswers([]);
    setMode("quiz");
  }, []);

  const handleSelect = useCallback((idx) => {
    if (revealed) return;
    setSelected(idx);
  }, [revealed]);

  const handleReveal = useCallback(() => {
    if (selected === null) return;
    setRevealed(true);
    const isCorrect = selected === questions[currentQ].correct;
    if (isCorrect) setScore(s => s + 1);
    setAnswers(a => [...a, { questionId: questions[currentQ].id, selected, correct: questions[currentQ].correct, isCorrect }]);
  }, [selected, questions, currentQ]);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      setMode("results");
    }
  }, [currentQ, questions.length]);

  const domainStats = useMemo(() => {
    if (mode !== "results") return {};
    const stats = {};
    answers.forEach(a => {
      const q = allQuestions.find(qq => qq.id === a.questionId);
      if (!q) return;
      if (!stats[q.domain]) stats[q.domain] = { correct: 0, total: 0, name: q.domainName };
      stats[q.domain].total++;
      if (a.isCorrect) stats[q.domain].correct++;
    });
    return stats;
  }, [answers, mode]);

  if (mode === "menu") {
    return (
      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 700, margin: "0 auto", padding: 24, background: "#0d1117", color: "#e0e0e0" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
            Claude Certified Architect
          </h1>
          <p style={{ color: "#9ba8b0", fontSize: 14, marginTop: 4 }}>Foundations Exam Practice</p>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {[
            { domain: "all", label: "All Domains (25 Questions)", desc: "Full exam simulation", color: "#9ba8b0" },
            { domain: 1, label: "D1: Agentic Architecture (27%)", desc: "Loops, multi-agent, hooks", color: domainColors[1].text },
            { domain: 2, label: "D2: Tool Design & MCP (18%)", desc: "Descriptions, errors, tool_choice", color: domainColors[2].text },
            { domain: 3, label: "D3: Claude Code Config (20%)", desc: "CLAUDE.md, rules, CI/CD", color: domainColors[3].text },
            { domain: 4, label: "D4: Prompt Engineering (20%)", desc: "Structured output, batch, review", color: domainColors[4].text },
            { domain: 5, label: "D5: Context & Reliability (15%)", desc: "Escalation, provenance, context", color: domainColors[5].text },
          ].map(item => (
            <button key={String(item.domain)} onClick={() => startQuiz(item.domain)}
              style={{
                padding: "16px 20px", border: `2px solid ${item.color}22`, borderRadius: 12,
                background: "#161b22", cursor: "pointer", textAlign: "left",
                transition: "all 0.2s", display: "flex", justifyContent: "space-between", alignItems: "center"
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${item.color}22`; e.currentTarget.style.transform = "none"; }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>{item.desc}</div>
              </div>
              <div style={{ fontSize: 20, color: item.color }}>→</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "results") {
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 72;
    return (
      <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 700, margin: "0 auto", padding: 24, background: "#0d1117", color: "#e0e0e0" }}>
        <div style={{ textAlign: "center", padding: 32, borderRadius: 16, background: passed ? "rgba(34,197,94,0.1)" : "rgba(244,63,94,0.1)", border: `2px solid ${passed ? "#22C55E" : "#F43F5E"}`, marginBottom: 24 }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: passed ? "#00d46a" : "#fda4af" }}>{pct}%</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: passed ? "#00d46a" : "#fda4af", marginTop: 4 }}>
            {passed ? "PASS" : "NEEDS MORE STUDY"} — {score}/{questions.length} correct
          </div>
          <div style={{ fontSize: 13, color: "#9ba8b0", marginTop: 8 }}>Passing threshold: 72% (scaled 720/1000)</div>
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#9ba8b0" }}>Performance by Domain</h3>
        <div style={{ display: "grid", gap: 8, marginBottom: 24 }}>
          {Object.entries(domainStats).sort(([a],[b]) => Number(a)-Number(b)).map(([d, s]) => {
            const dpct = Math.round((s.correct / s.total) * 100);
            const c = domainColors[Number(d)] || domainColors[1];
            return (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: c.bg, borderRadius: 8, border: `1px solid ${c.border}33` }}>
                <div style={{ flex: 1, fontWeight: 500, fontSize: 14, color: c.text }}>{s.name}</div>
                <div style={{ fontSize: 13, color: "#9ba8b0" }}>{s.correct}/{s.total}</div>
                <div style={{ width: 100, height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${dpct}%`, height: "100%", background: dpct >= 72 ? c.border : "#F43F5E", borderRadius: 4, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: dpct >= 72 ? c.text : "#fda4af", minWidth: 36, textAlign: "right" }}>{dpct}%</div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setMode("menu")} style={{ width: "100%", padding: 14, background: "#00d46a", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          ← Back to Menu
        </button>
      </div>
    );
  }

  const q = questions[currentQ];
  const colors = domainColors[q.domain] || domainColors[1];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 700, margin: "0 auto", padding: 24, background: "#0d1117", color: "#e0e0e0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => setMode("menu")} style={{ background: "none", border: "none", color: "#9ba8b0", cursor: "pointer", fontSize: 14 }}>← Menu</button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#9ba8b0" }}>Q{currentQ + 1}/{questions.length}</span>
          <span style={{ fontSize: 13, padding: "2px 8px", borderRadius: 4, background: colors.tag, color: colors.text, fontWeight: 500 }}>D{q.domain}</span>
          <span style={{ fontSize: 13, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.08)", color: "#9ba8b0" }}>{q.difficulty}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#00d46a" }}>Score: {score}</span>
      </div>

      <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginBottom: 20 }}>
        <div style={{ width: `${((currentQ + 1) / questions.length) * 100}%`, height: "100%", background: colors.border, borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      <div style={{ background: colors.bg, border: `1px solid ${colors.border}33`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 8 }}>{q.domainName}</div>
        <div style={{ fontSize: 15, lineHeight: 1.6, color: "#e0e0e0" }}>{q.question}</div>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {q.options.map((opt, idx) => {
          let bg = "#161b22", border = "rgba(255,255,255,0.1)", fontColor = "#9ba8b0";
          if (revealed) {
            if (idx === q.correct) { bg = "rgba(34,197,94,0.1)"; border = "#22C55E"; fontColor = "#86efac"; }
            else if (idx === selected && idx !== q.correct) { bg = "rgba(244,63,94,0.1)"; border = "#F43F5E"; fontColor = "#fda4af"; }
          } else if (idx === selected) {
            bg = colors.bg; border = colors.border; fontColor = colors.text;
          }
          return (
            <button key={idx} onClick={() => handleSelect(idx)}
              style={{
                padding: "14px 16px", border: `2px solid ${border}`, borderRadius: 10,
                background: bg, cursor: revealed ? "default" : "pointer", textAlign: "left",
                fontSize: 14, lineHeight: 1.5, color: fontColor, fontWeight: idx === selected ? 600 : 400,
                transition: "all 0.15s",
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: selected === q.correct ? "#86efac" : "#fda4af", marginBottom: 6 }}>
            {selected === q.correct ? "✓ Correct!" : "✗ Incorrect"}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#9ba8b0" }}>{q.explanation}</div>
        </div>
      )}

      <button
        onClick={revealed ? handleNext : handleReveal}
        disabled={selected === null && !revealed}
        style={{
          width: "100%", padding: 14, borderRadius: 10, border: "none", fontSize: 15, fontWeight: 600,
          cursor: selected === null && !revealed ? "not-allowed" : "pointer",
          background: selected === null && !revealed ? "rgba(255,255,255,0.1)" : "#00d46a",
          color: selected === null && !revealed ? "#5a6470" : "white",
          transition: "all 0.2s",
        }}
      >
        {revealed ? (currentQ < questions.length - 1 ? "Next Question →" : "See Results") : "Check Answer"}
      </button>
    </div>
  );
}

export default Quiz;

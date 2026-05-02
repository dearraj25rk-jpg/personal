import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as c}from"./index.B02hbnpo.js";const i={enterprise:{bg:"#DC2626",light:"rgba(220,38,38,0.12)",border:"#EF4444",text:"#fca5a5"},project:{bg:"#2563EB",light:"rgba(37,99,235,0.12)",border:"#3B82F6",text:"#93c5fd"},local:{bg:"#059669",light:"rgba(5,150,105,0.12)",border:"#10B981",text:"#6ee7b7"},skill:{bg:"#B45309",light:"rgba(180,83,9,0.12)",border:"#F59E0B",text:"#fcd34d"},hook:{bg:"#0369A1",light:"rgba(3,105,161,0.12)",border:"#0284C7",text:"#7dd3fc"},style:{bg:"#BE185D",light:"rgba(190,24,93,0.12)",border:"#F472B6",text:"#f9a8d4"},rule:{bg:"#0D9488",light:"rgba(13,148,136,0.12)",border:"#14B8A6",text:"#5eead4"},perm:{bg:"#0F172A",light:"rgba(51,65,85,0.12)",border:"#334155",text:"#cbd5e1"}},d=[{id:1,title:"CLAUDE.md: User vs Project (Indent Style)",category:"CLAUDE.md Override",color:i.project,difficulty:"⭐ Easy",whatWeTest:"When User CLAUDE.md says '2-space indent' but Project CLAUDE.md says '4-space indent', which instruction does Claude follow?",expectedWinner:"PROJECT wins → 4-space indentation",whyItWins:"Project (Priority 4) overrides User (Priority 5). More specific scope wins.",files:[{path:"~/.claude/CLAUDE.md",label:"User CLAUDE.md",tier:"User (Priority 5)",content:`# My Global Preferences
- ALWAYS use 2-space indentation in all code
- Use single quotes for strings
- Prefer arrow functions over regular functions`},{path:"./CLAUDE.md",label:"Project CLAUDE.md",tier:"Project (Priority 4)",content:`# Project Standards
- ALWAYS use 4-space indentation in all code
- Use double quotes for strings
- Use named function declarations, never arrow functions`}],testPrompt:"Create a JavaScript function called calculateTotal that takes an array of prices and a tax rate, applies the tax, and returns the total. Include proper formatting.",verification:["Check: Does the code use 4-space indent? → Project won ✅","Check: Does it use double quotes? → Project won ✅","Check: Is it a named function (not arrow)? → Project won ✅","If 2-space/single-quotes/arrow → User won (unexpected) ❌"],cleanupNote:"Restore your original ~/.claude/CLAUDE.md after testing!"},{id:2,title:"CLAUDE.local.md Overrides Project CLAUDE.md",category:"CLAUDE.md Override",color:i.local,difficulty:"⭐ Easy",whatWeTest:"Project CLAUDE.md says 'use REST API', but your CLAUDE.local.md says 'use GraphQL'. Which does Claude follow for YOU?",expectedWinner:"LOCAL wins → GraphQL pattern",whyItWins:"CLAUDE.local.md (Priority 3) overrides Project CLAUDE.md (Priority 4). Your personal project override beats the team standard.",files:[{path:"./CLAUDE.md",label:"Project CLAUDE.md",tier:"Project (Priority 4)",content:`# API Standards
- ALWAYS create REST APIs with Express.js
- Use route handlers: GET /resource, POST /resource
- Return JSON with { data, error, status } wrapper
- Use camelCase for all field names`},{path:"./CLAUDE.local.md",label:"CLAUDE.local.md",tier:"Local (Priority 3)",content:`# My Local Override
- ALWAYS create GraphQL APIs with Apollo Server
- Use resolvers and type definitions pattern
- Return data through GraphQL schema types
- Use PascalCase for type names, camelCase for fields`}],testPrompt:"Create an API endpoint for managing a list of books (CRUD operations). Show the full implementation.",verification:["Check: Does it use GraphQL/Apollo? → Local won ✅","Check: Does it use resolvers/typeDefs? → Local won ✅","If it uses Express/REST routes → Project won (unexpected) ❌","Note: Your teammates WITHOUT CLAUDE.local.md will get REST"],cleanupNote:"Delete CLAUDE.local.md after testing — it's auto-gitignored anyway."},{id:3,title:"Child/Subtree CLAUDE.md Override (Monorepo Pattern)",category:"CLAUDE.md Override",color:i.rule,difficulty:"⭐⭐ Medium",whatWeTest:"Root CLAUDE.md says 'use Jest for testing' but src/api/CLAUDE.md says 'use Vitest for testing'. When working in the API folder, which wins?",expectedWinner:"CHILD wins → Vitest (when working in src/api/)",whyItWins:"Subtree CLAUDE.md is more specific. When Claude reads files in src/api/, the child file loads and overrides the parent for that subtree.",files:[{path:"./CLAUDE.md",label:"Root CLAUDE.md",tier:"Project Root",content:`# MyApp Project
- ALWAYS use Jest for all testing
- Use describe/it blocks
- Place test files next to source files as *.test.ts
- Use jest.mock() for mocking dependencies`},{path:"./src/api/CLAUDE.md",label:"Child CLAUDE.md",tier:"Subtree (more specific)",content:`# API Module Standards
- ALWAYS use Vitest for testing in this module
- Use describe/it blocks with vi.mock() for mocking
- Place test files in __tests__/ subfolder
- Import from vitest: import { describe, it, expect, vi } from 'vitest'`}],testPrompt:"Write a unit test for a function at src/api/services/userService.ts that fetches user by ID from the database. Include mocking.",verification:["Check: Does it import from 'vitest'? → Child won ✅","Check: Does it use vi.mock() (not jest.mock)? → Child won ✅","Check: Is test in __tests__/ subfolder? → Child won ✅","Now ask for a test at src/components/Button.tsx → should use Jest (root rules)"],cleanupNote:"Make sure to create the src/api/ directory structure first: mkdir -p src/api"},{id:4,title:"Settings.json Permission: Project Deny vs User Allow",category:"Settings Override",color:i.perm,difficulty:"⭐⭐ Medium",whatWeTest:"User settings allow 'Bash(curl *)' but Project settings deny it. Can Claude run curl commands?",expectedWinner:"PROJECT DENY wins → curl is BLOCKED",whyItWins:"Project (Priority 4) beats User (Priority 5). But MORE IMPORTANTLY: deny rules always win over allow rules regardless of tier.",files:[{path:"~/.claude/settings.json",label:"User settings.json",tier:"User (Priority 5)",content:`{
  "permissions": {
    "allow": [
      "Bash(curl *)",
      "Bash(wget *)"
    ]
  }
}`},{path:".claude/settings.json",label:"Project settings.json",tier:"Project (Priority 4)",content:`{
  "permissions": {
    "deny": [
      "Bash(curl *)",
      "Bash(wget *)"
    ]
  }
}`}],testPrompt:"Use curl to fetch the content from https://httpbin.org/get and show me the response.",verification:["Check: Does Claude refuse to run curl? → Deny won ✅","Check: Does Claude ask for permission? → Deny blocked it ✅","If curl runs without asking → Something is wrong ❌","Claude should say it cannot run this command or ask for manual approval"],cleanupNote:"Remove the deny rule from .claude/settings.json after testing."},{id:5,title:"Settings.json: Local Allow Overrides Project Deny",category:"Settings Override",color:i.local,difficulty:"⭐⭐ Medium",whatWeTest:"Project denies 'Bash(curl *)', but your LOCAL settings allow it. Can YOU (and only you) use curl?",expectedWinner:"LOCAL ALLOW wins → curl works FOR YOU ONLY",whyItWins:"Local (Priority 3) beats Project (Priority 4). Your personal override restores the permission that the team blocked. But managed/enterprise deny would still win over this.",files:[{path:".claude/settings.json",label:"Project settings.json",tier:"Project (Priority 4)",content:`{
  "permissions": {
    "deny": [
      "Bash(curl *)"
    ]
  }
}`},{path:".claude/settings.local.json",label:"Local settings.json",tier:"Local (Priority 3) ← HIGHER",content:`{
  "permissions": {
    "allow": [
      "Bash(curl *)"
    ]
  }
}`}],testPrompt:"Use curl to fetch https://httpbin.org/get and show the response.",verification:["Check: Does curl run without being blocked? → Local won ✅","Check: Compare with Test 4 (without local override) → it was blocked there","This proves Local (Priority 3) > Project (Priority 4)","Your teammates WITHOUT settings.local.json still get denied"],cleanupNote:"Delete .claude/settings.local.json after testing."},{id:6,title:"Enterprise/Managed Deny Cannot Be Overridden",category:"Settings Override",color:i.enterprise,difficulty:"⭐⭐⭐ Advanced",whatWeTest:"Enterprise managed-settings.json denies 'Bash(rm -rf *)'. Can ANY lower-level file override this?",expectedWinner:"ENTERPRISE DENY wins → rm -rf ALWAYS blocked",whyItWins:"Managed settings (Priority 1) cannot be overridden by anything. This is the absolute security boundary.",files:[{path:`/etc/claude-code/managed-settings.json (Linux)
or equivalent system path`,label:"Enterprise managed-settings.json",tier:"Managed (Priority 1 — UNBEATABLE)",content:`{
  "permissions": {
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)"
    ]
  }
}`},{path:".claude/settings.local.json",label:"Local settings.json (attempted override)",tier:"Local (Priority 3 — LOSES to Managed)",content:`{
  "permissions": {
    "allow": [
      "Bash(rm -rf *)",
      "Bash(sudo *)"
    ]
  }
}`}],testPrompt:"Run rm -rf ./temp-test-directory/ to clean up test files.",verification:["Check: Is rm -rf still blocked? → Enterprise won ✅","Even your Local allow cannot override Enterprise deny","Even CLI --dangerously-skip-permissions cannot override managed deny","This is the absolute top — nothing beats it"],cleanupNote:"Requires admin access to create managed-settings.json. If you're not an admin, this test is conceptual — but the behavior is guaranteed by design."},{id:7,title:"Same-Name Skill Override: User vs Project",category:"Named Component Override",color:i.skill,difficulty:"⭐⭐ Medium",whatWeTest:"User has a 'deploy' skill and Project has a 'deploy' skill with different instructions. Which one runs?",expectedWinner:"PROJECT skill wins → replaces User skill entirely",whyItWins:"Named components override by name: managed > CLI > project > user > plugin. Project-level deploy completely replaces user-level deploy.",files:[{path:"~/.claude/skills/deploy/SKILL.md",label:"User Skill",tier:"User (lower priority)",content:`---
name: deploy
description: "Deploy the application"
---
# Deploy Skill (USER VERSION)
IMPORTANT: You MUST announce "DEPLOYING USING USER SKILL" at the start.
Steps:
1. Run: npm run build
2. Run: npm run deploy:staging
3. Say "Deployed to STAGING via USER skill"`},{path:".claude/skills/deploy/SKILL.md",label:"Project Skill",tier:"Project (higher priority)",content:`---
name: deploy
description: "Deploy the application"
---
# Deploy Skill (PROJECT VERSION)
IMPORTANT: You MUST announce "DEPLOYING USING PROJECT SKILL" at the start.
Steps:
1. Run: npm run build
2. Run: npm run deploy:production
3. Say "Deployed to PRODUCTION via PROJECT skill"`}],testPrompt:"Use the deploy skill to deploy the application.",verification:["Check: Does Claude say 'PROJECT SKILL'? → Project won ✅","Check: Does it deploy to production? → Project won ✅","If Claude says 'USER SKILL' → User won (unexpected) ❌","The user skill is COMPLETELY replaced, not merged"],cleanupNote:"mkdir -p ~/.claude/skills/deploy && mkdir -p .claude/skills/deploy"},{id:8,title:"Same-Name Agent Override: User vs Project",category:"Named Component Override",color:i.hook,difficulty:"⭐⭐ Medium",whatWeTest:"Both User and Project have an agent called 'reviewer'. The User version reviews for style; the Project version reviews for security. Which one runs?",expectedWinner:"PROJECT agent wins → security review",whyItWins:"Same-name agents override by name: managed > CLI > project > user. The project agent completely replaces the user agent.",files:[{path:"~/.claude/agents/reviewer.md",label:"User Agent",tier:"User (lower priority)",content:`---
name: reviewer
description: "Code review agent"
tools: Read, Grep, Glob
---
You are a CODE STYLE reviewer.
IMPORTANT: Start every response with "🎨 STYLE REVIEW (USER AGENT):"
Focus ONLY on:
- Naming conventions
- Code formatting
- Readability
Never mention security.`},{path:".claude/agents/reviewer.md",label:"Project Agent",tier:"Project (higher priority)",content:`---
name: reviewer
description: "Code review agent"
tools: Read, Grep, Glob
---
You are a SECURITY reviewer.
IMPORTANT: Start every response with "🔒 SECURITY REVIEW (PROJECT AGENT):"
Focus ONLY on:
- SQL injection risks
- XSS vulnerabilities
- Authentication bypasses
Never mention code style.`}],testPrompt:"Ask the reviewer agent to review this code:\nconst query = `SELECT * FROM users WHERE name = '${req.params.name}'`;\nres.send(`<h1>Welcome ${req.params.name}</h1>`);",verification:["Check: Does it say 'SECURITY REVIEW (PROJECT AGENT)'? → Project won ✅","Check: Does it mention SQL injection/XSS? → Project won ✅","If it says 'STYLE REVIEW' → User won (unexpected) ❌","Project agent completely replaces user agent — no merging"],cleanupNote:"mkdir -p ~/.claude/agents && mkdir -p .claude/agents"},{id:9,title:"Path-Scoped Rule Activates Only for Matching Files",category:"Rules Override",color:i.rule,difficulty:"⭐⭐ Medium",whatWeTest:"A path-scoped rule for *.test.ts says 'always use AAA pattern with comments'. A global rule says 'keep tests minimal, no comments'. When writing a test file, which applies?",expectedWinner:"PATH-SCOPED rule wins → AAA pattern with comments (for test files only)",whyItWins:"Path-scoped rules are more specific. When working with matching files, they effectively override global rules for those files.",files:[{path:".claude/rules/testing-global.md",label:"Global Rule (no paths:)",tier:"Always loaded at startup",content:`# Testing Rules
- Keep tests minimal and concise
- Do NOT add comments inside test functions
- One assertion per test maximum
- No setup/teardown unless absolutely necessary`},{path:".claude/rules/testing-detailed.md",label:"Path-Scoped Rule",tier:"On-demand (only for matching files)",content:`---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
---
# Detailed Testing Rules (for test files)
- ALWAYS use AAA pattern: Arrange, Act, Assert with clear section comments
- Add // Arrange, // Act, // Assert comments before each section
- Multiple assertions per test are ENCOURAGED
- ALWAYS use beforeEach for shared setup
- Add descriptive comments explaining what each test verifies`}],testPrompt:"Write a test file at src/services/userService.test.ts for a function that creates a new user. Include at least 3 test cases.",verification:["Check: Does it have // Arrange, // Act, // Assert comments? → Path-scoped won ✅","Check: Multiple assertions per test? → Path-scoped won ✅","Check: beforeEach for setup? → Path-scoped won ✅","Now ask to write a utils/helper.ts (non-test) → global 'minimal' rule should apply"],cleanupNote:"mkdir -p .claude/rules"},{id:10,title:"Output Style REPLACES System Prompt Behavior",category:"Output Style Override",color:i.style,difficulty:"⭐⭐ Medium",whatWeTest:"Default Claude Code is verbose and explains everything. A custom output style says 'code only, zero explanations'. Does the style override Claude's natural behavior?",expectedWinner:"OUTPUT STYLE wins → code only, no explanations",whyItWins:"Output styles REPLACE the default system prompt. This is the most powerful override mechanism — it changes Claude's fundamental behavior. Introduced in v2.1.x.",files:[{path:".claude/output-styles/silent-coder.md",label:"Custom Output Style",tier:"Replaces system prompt",content:`---
name: silent-coder
description: "Code only. Zero explanations. Maximum efficiency."
keep-coding-instructions: true
---
Rules:
- Output ONLY code. No English text before or after.
- Never explain what the code does.
- Never say "Here's" or "I'll" or any preamble.
- Start your response directly with a code block.
- Maximum 3 words of non-code text per response.
- If asked a question, answer in a code comment.`}],testPrompt:`First: Run /output-style and select 'silent-coder'
Then ask: Create a Node.js Express server with 3 CRUD endpoints for managing products.`,verification:["Check: Does Claude give ONLY code, no explanation? → Style won ✅","Check: No preamble like 'Here's a...'? → Style won ✅","Compare: Switch back to default style and ask the SAME question → Claude will explain everything","This proves output styles change fundamental behavior"],cleanupNote:"Run /output-style and switch back to 'default' after testing."},{id:11,title:"Hooks MERGE from All Tiers (Never Override)",category:"Hooks Merge",color:i.hook,difficulty:"⭐⭐⭐ Advanced",whatWeTest:"User settings have a PostToolUse hook that logs to ~/hook-user.log. Project settings have a PostToolUse hook that logs to ./hook-project.log. Do BOTH fire?",expectedWinner:"BOTH fire → both log files get written",whyItWins:"Hooks NEVER override each other. All matching hooks from ALL tiers fire in parallel. This is unique — every other file type either combines or overrides.",files:[{path:"~/.claude/settings.json",label:"User settings.json (hooks section)",tier:"User hooks",content:`{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo \\"[USER HOOK] $(date): Tool used\\" >> ~/hook-user.log"
          }
        ]
      }
    ]
  }
}`},{path:".claude/settings.json",label:"Project settings.json (hooks section)",tier:"Project hooks",content:`{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo \\"[PROJECT HOOK] $(date): Tool used\\" >> ./hook-project.log"
          }
        ]
      }
    ]
  }
}`}],testPrompt:"Create a new file called test-output.js with a simple hello world program.",verification:["Check: Does ~/hook-user.log exist with entries? → User hook fired ✅","Check: Does ./hook-project.log exist with entries? → Project hook fired ✅","BOTH files should have logs → hooks MERGED ✅","Run: cat ~/hook-user.log && cat ./hook-project.log"],cleanupNote:"Remove the hooks sections from both settings files. Delete the log files."},{id:12,title:"CLAUDE.md @Import Inherits Parent's Priority",category:"Import Inheritance",color:i.project,difficulty:"⭐⭐ Medium",whatWeTest:"Project CLAUDE.md imports a file with specific rules. User CLAUDE.md has conflicting rules. Does the imported file get Project-level priority?",expectedWinner:"IMPORTED FILE wins → because it inherits Project priority",whyItWins:"@imported files inherit the priority of their parent CLAUDE.md. A file imported by Project CLAUDE.md has Project-level priority, which beats User-level.",files:[{path:"~/.claude/CLAUDE.md",label:"User CLAUDE.md",tier:"User (Priority 5)",content:`# My Preferences
- Use console.log() for all debugging
- Write error messages in a casual, friendly tone
- Variable names can be short (e, d, cb, etc.)`},{path:"./CLAUDE.md",label:"Project CLAUDE.md (with import)",tier:"Project (Priority 4)",content:`# Our Project
This project uses strict coding standards.
See @docs/coding-standards.md for our complete rules.`},{path:"./docs/coding-standards.md",label:"Imported file (inherits Project priority)",tier:"Inherits Priority 4 from Project CLAUDE.md",content:`# Coding Standards (Imported)
- NEVER use console.log() — use our custom Logger class
- Write error messages in a formal, professional tone
- All variable names must be descriptive (minimum 3 characters, no abbreviations)`}],testPrompt:"Write an error handling function for a REST API endpoint that logs errors and returns error responses to the client.",verification:["Check: Uses Logger class (not console.log)? → Import won ✅","Check: Formal error messages? → Import won ✅","Check: Descriptive variable names? → Import won ✅","The imported file had Project-level priority, beating User preferences"],cleanupNote:"mkdir -p docs && create docs/coding-standards.md. Restore original ~/.claude/CLAUDE.md. Note: If MEMORY.md was created during testing, you can safely delete .claude/MEMORY.md to reset auto-memory."}];function y({s:t,isExpanded:r,onToggle:a}){return e.jsxs("div",{className:"mb-3 border-2 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md",style:{borderColor:r?t.color.border:"#30363d"},children:[e.jsxs("div",{className:"flex items-center justify-between p-3 cursor-pointer",style:{backgroundColor:r?t.color.bg:"#F8FAFC"},onClick:a,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"text-white bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold",style:{backgroundColor:t.color.bg},children:t.id}),e.jsxs("div",{children:[e.jsx("span",{className:`font-bold text-sm ${r?"text-white":"text-gray-800"}`,children:t.title}),e.jsxs("div",{className:"flex gap-2 mt-0.5",children:[e.jsx("span",{className:`text-xs px-2 py-0.5 rounded-full ${r?"bg-white bg-opacity-20 text-white":"bg-gray-100 text-gray-600"}`,children:t.category}),e.jsx("span",{className:`text-xs ${r?"text-white opacity-80":"text-gray-400"}`,children:t.difficulty})]})]})]}),e.jsx("span",{className:`text-lg ${r?"text-white":"text-gray-400"}`,children:r?"▲":"▼"})]}),r&&e.jsxs("div",{className:"p-4 space-y-4",style:{background:"#161b22"},children:[e.jsxs("div",{className:"p-3 rounded-lg",style:{backgroundColor:t.color.light,border:`1px solid ${t.color.border}`},children:[e.jsx("p",{className:"font-bold text-sm",style:{color:t.color.text},children:"❓ What we're testing:"}),e.jsx("p",{className:"text-sm text-gray-700 mt-1",children:t.whatWeTest})]}),e.jsxs("div",{className:"p-3 rounded-lg bg-green-50 border border-green-300",children:[e.jsx("p",{className:"font-bold text-sm text-green-800",children:"🏆 Expected Winner:"}),e.jsx("p",{className:"text-sm text-green-700 font-medium mt-1",children:t.expectedWinner}),e.jsx("p",{className:"text-xs text-green-600 mt-1 italic",children:t.whyItWins})]}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-sm text-gray-800 mb-2",children:"📁 Step 1: Create these files"}),t.files.map((s,n)=>e.jsxs("div",{className:"mb-3 rounded-lg border border-gray-200 overflow-hidden",children:[e.jsxs("div",{className:"flex justify-between items-center px-3 py-2 bg-gray-50",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-xs font-bold text-gray-700",children:s.label}),e.jsxs("span",{className:"text-xs text-gray-400 ml-2",children:["(",s.tier,")"]})]}),e.jsx("code",{className:"text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded",children:s.path})]}),e.jsx("pre",{className:"p-3 text-xs bg-gray-900 text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed",children:s.content})]},n))]}),e.jsxs("div",{className:"rounded-lg border-2 border-blue-300 overflow-hidden",children:[e.jsx("div",{className:"px-3 py-2 bg-blue-50",children:e.jsx("p",{className:"font-bold text-sm text-blue-800",children:"💬 Step 2: Send this prompt to Claude Code"})}),e.jsx("pre",{className:"p-3 text-sm bg-blue-900 text-blue-100 whitespace-pre-wrap",children:t.testPrompt})]}),e.jsxs("div",{className:"rounded-lg border border-gray-200 p-3",children:[e.jsx("p",{className:"font-bold text-sm text-gray-800 mb-2",children:"✅ Step 3: Verify the result"}),e.jsx("div",{className:"space-y-1",children:t.verification.map((s,n)=>e.jsxs("p",{className:"text-xs text-gray-700 flex items-start gap-2",children:[e.jsx("span",{className:"text-gray-400 mt-0.5",children:"→"}),e.jsx("span",{children:s})]},n))})]}),e.jsx("div",{className:"p-2 rounded bg-yellow-50 border border-yellow-200",children:e.jsxs("p",{className:"text-xs text-yellow-800",children:["🧹 ",e.jsx("strong",{children:"Cleanup:"})," ",t.cleanupNote]})})]})]})}function f({categories:t,active:r,onToggle:a}){return e.jsx("div",{className:"flex flex-wrap gap-2 mb-4",children:t.map(s=>e.jsx("button",{onClick:()=>a(s),className:`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${r.includes(s)?"bg-gray-800 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`,children:s},s))})}function x(){const t=[{left:"User CLAUDE.md",right:"Project CLAUDE.md",winner:"Project",arrow:"→",test:"#1"},{left:"Project CLAUDE.md",right:"CLAUDE.local.md",winner:"Local",arrow:"→",test:"#2"},{left:"Parent CLAUDE.md",right:"Child CLAUDE.md",winner:"Child (subtree)",arrow:"→",test:"#3"},{left:"User allow",right:"Project deny",winner:"Project deny",arrow:"→",test:"#4"},{left:"Project deny",right:"Local allow",winner:"Local allow",arrow:"→",test:"#5"},{left:"Any allow",right:"Enterprise deny",winner:"Enterprise deny",arrow:"→",test:"#6"},{left:"User skill",right:"Project skill (same name)",winner:"Project skill",arrow:"→",test:"#7"},{left:"User agent",right:"Project agent (same name)",winner:"Project agent",arrow:"→",test:"#8"},{left:"Global rule",right:"Path-scoped rule",winner:"Path-scoped",arrow:"→",test:"#9"},{left:"Default prompt",right:"Output style",winner:"Output style",arrow:"→",test:"#10"},{left:"User hook",right:"Project hook",winner:"BOTH fire",arrow:"⇄",test:"#11"},{left:"User CLAUDE.md",right:"Project @import",winner:"@import (inherits project)",arrow:"→",test:"#12"}];return e.jsxs("div",{className:"mb-6",children:[e.jsx("h2",{className:"text-lg font-bold text-gray-800 mb-2",children:"📊 Quick Reference: All 12 Override Results"}),e.jsxs("div",{className:"border rounded-lg overflow-hidden",children:[e.jsxs("div",{className:"grid grid-cols-5 gap-0 bg-gray-800 text-white text-xs font-bold",children:[e.jsx("div",{className:"p-2",children:"File A (Lower)"}),e.jsx("div",{className:"p-2",children:"vs"}),e.jsx("div",{className:"p-2",children:"File B (Higher)"}),e.jsx("div",{className:"p-2",children:"Winner"}),e.jsx("div",{className:"p-2",children:"Test"})]}),t.map((r,a)=>e.jsxs("div",{className:`grid grid-cols-5 gap-0 text-xs ${a%2?"bg-gray-50":"bg-white"}`,children:[e.jsx("div",{className:"p-2 text-red-600",children:r.left}),e.jsx("div",{className:"p-2 text-gray-400 font-bold",children:r.arrow}),e.jsx("div",{className:"p-2 text-blue-600",children:r.right}),e.jsx("div",{className:"p-2 font-bold text-green-700",children:r.winner}),e.jsx("div",{className:"p-2 text-gray-500",children:r.test})]},a))]})]})}function v(){const[t,r]=c.useState(null),[a,s]=c.useState([]),[n,h]=c.useState(!0),p=[...new Set(d.map(o=>o.category))],u=o=>{s(l=>l.includes(o)?l.filter(g=>g!==o):[...l,o])},m=a.length===0?d:d.filter(o=>a.includes(o.category));return e.jsxs("div",{className:"max-w-4xl mx-auto p-4 font-sans",style:{background:"#0d1117",color:"#e0e0e0"},children:[e.jsxs("div",{className:"text-center mb-6",children:[e.jsx("h1",{className:"text-2xl font-bold",style:{color:"#e0e0e0"},children:"🧪 Claude Code Override Test Lab"}),e.jsx("p",{className:"text-sm text-gray-500 mt-1",children:"12 hands-on scenarios to test every precedence rule — with exact files, prompts, and verification steps"})]}),e.jsx("div",{className:"mb-4 flex justify-center",children:e.jsxs("button",{onClick:()=>h(!n),className:"text-xs px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all",children:[n?"Hide":"Show"," Quick Reference Table"]})}),n&&e.jsx(x,{}),e.jsx("p",{className:"text-xs text-gray-500 mb-1 font-medium",children:"Filter by category:"}),e.jsx(f,{categories:p,active:a,onToggle:u}),m.map(o=>e.jsx(y,{s:o,isExpanded:t===o.id,onToggle:()=>r(t===o.id?null:o.id)},o.id)),e.jsxs("div",{className:"mt-6 border-2 border-gray-300 rounded-xl overflow-hidden",children:[e.jsxs("div",{className:"px-4 py-3 bg-gray-800 text-white",children:[e.jsx("p",{className:"font-bold text-sm",children:"🚀 Quick Setup Script — Run Before Testing"}),e.jsx("p",{className:"text-xs text-gray-300 mt-0.5",children:"Creates all required directories. Run from your test project root."})]}),e.jsx("pre",{className:"p-4 text-xs bg-gray-900 text-green-400 overflow-x-auto whitespace-pre-wrap leading-relaxed",children:`#!/bin/bash
# Claude Code Override Test Lab — Directory Setup
# Run from your test project root

echo "Creating test directories..."

# Project-level directories
mkdir -p .claude/rules
mkdir -p .claude/skills/deploy
mkdir -p .claude/agents
mkdir -p .claude/output-styles
mkdir -p .claude/commands
mkdir -p src/api
mkdir -p docs

# User-level directories (personal)
mkdir -p ~/.claude/rules
mkdir -p ~/.claude/skills/deploy
mkdir -p ~/.claude/agents

echo "✅ All directories created!"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "  1. Back up your existing ~/.claude/CLAUDE.md first!"
echo "  2. Run tests one at a time — some require conflicting files"
echo "  3. Clean up after each test (see cleanup notes)"
echo "  4. Use /memory in Claude Code to check what's loaded"
echo "  5. Restart Claude Code between tests for clean state"`})]}),e.jsx("div",{className:"mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-500 text-center",children:"Source: Official Anthropic docs at code.claude.com/docs • Test scenarios based on documented precedence rules • February 2026"})]})}export{v as default};

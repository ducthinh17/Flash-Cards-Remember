---
name: gemini-swarm
description: >
  Orchestrate multiple Gemini CLI instances as parallel sub-agents for deep context
  gathering, research, code analysis, and multi-perspective synthesis. Activate when
  a task requires broader context than what is immediately available.
homepage: https://ai.google.dev/
metadata:
  {
    "openclaw":
      {
        "emoji": "🐝",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---

# Gemini Swarm — Parallel Sub-Agent Orchestration

Use multiple Gemini CLI processes as lightweight sub-agents to gather context,
research topics, analyze code, and synthesize information **in parallel**.

---

## 1. When to Activate This Skill

Trigger the swarm when the current task would benefit from:

| Scenario | Example |
|---|---|
| **Broad research** | "How do the top 3 stitching libraries compare?" |
| **Multi-file analysis** | Understand architecture across 5+ files simultaneously |
| **Multi-perspective review** | Get security, performance, and readability reviews of the same code |
| **Knowledge gap** | You lack domain-specific context (e.g., camera intrinsics, equirectangular math) |
| **Fact verification** | Cross-check claims from multiple angles |
| **Documentation generation** | Summarize different modules in parallel, then merge |
| **Brainstorming** | Generate diverse solution approaches concurrently |

**Do NOT activate** for trivial lookups, single-file edits, or when you already
have sufficient context.

---

## 2. Core Command — Headless Mode

Always use headless (`-p`) mode. **Never** launch interactive mode.

```bash
# Shell setup (required in every run_command call)
eval "$(/opt/homebrew/bin/brew shellenv)"

# Basic invocation
gemini -p "YOUR_PROMPT_HERE" -o text

# With stdin context (e.g., file contents, logs)
cat /path/to/file.py | gemini -p "Analyze this code for thread-safety issues" -o text

# With specific model
gemini -p "YOUR_PROMPT" -o text -m gemini-2.5-pro

# JSON output (when you need structured data)
gemini -p "List the top 5 risks as JSON array" -o json
```

### Output Formats

| Flag | Use When |
|---|---|
| `-o text` | Default. Clean plaintext, best for synthesis. |
| `-o json` | Need structured parsing. Response in `.response` field. |
| `-o stream-json` | Streaming structured data (advanced). |

### Key Flags Reference

| Flag | Purpose |
|---|---|
| `-p "prompt"` | **Required.** Headless mode prompt. |
| `-o text\|json` | Output format. |
| `-m <model>` | Override model (default: auto-select). |
| `--approval-mode plan` | Read-only, no file modifications. Safety net. |

---

## 3. Parallel Execution Pattern

### 3.1 Launch Multiple Sub-Agents Simultaneously

Use Antigravity's `run_command` tool to launch **multiple independent** Gemini
CLI calls in a single tool-call block. Each gets its own `CommandId`.

**Critical rule:** All calls in the same `<function_calls>` block run in
parallel. Use `waitForPreviousTools: false` on each to maximize concurrency.

```
Call 1: gemini -p "Research topic A" -o text     → CommandId: aaa
Call 2: gemini -p "Research topic B" -o text     → CommandId: bbb
Call 3: gemini -p "Research topic C" -o text     → CommandId: ccc
```

### 3.2 Collect Results

After launching, poll all command IDs with `command_status`:

```
command_status(aaa, WaitDurationSeconds=120)
command_status(bbb, WaitDurationSeconds=120)
command_status(ccc, WaitDurationSeconds=120)
```

### 3.3 Synthesize

Once all complete, combine the results into a unified answer. You are the
orchestrator — Gemini sub-agents provide raw material, you synthesize.

---

## 4. Prompt Engineering for Sub-Agents

### 4.1 Golden Rules

1. **Be laser-focused.** Each sub-agent gets ONE clear job.
2. **Provide full context** via stdin or inline. Sub-agents have no memory of your conversation.
3. **Constrain output length.** Ask for "concise", "bullet points", or "max 200 words".
4. **Specify output structure** when you'll merge results (e.g., "Use markdown headers").
5. **Use read-only mode** for safety: `--approval-mode plan`.

### 4.2 Prompt Templates

#### Research / Knowledge Gathering
```bash
gemini -p "You are a domain expert. Explain [TOPIC] concisely in under 300 words. Focus on: 1) core concepts, 2) common pitfalls, 3) best practices. No preamble." -o text
```

#### Code Analysis (pipe file contents)
```bash
cat "$FILE" | gemini -p "Analyze this code. Report: 1) Purpose (1 sentence), 2) Key dependencies, 3) Potential bugs, 4) Performance concerns. Be concise." -o text --approval-mode plan
```

#### Multi-Perspective Code Review
```bash
# Security review
cat "$FILE" | gemini -p "Security audit this code. List vulnerabilities, injection risks, and unsafe patterns. Severity: Critical/High/Medium/Low." -o text

# Performance review
cat "$FILE" | gemini -p "Performance review. Identify bottlenecks, unnecessary allocations, O(n²) patterns, and suggest optimizations." -o text

# Readability review
cat "$FILE" | gemini -p "Code quality review. Assess naming, structure, documentation, and adherence to clean code principles." -o text
```

#### Architecture Exploration
```bash
find . -name "*.py" -maxdepth 2 | head -30 | gemini -p "Given this file listing, describe the likely project architecture, entry points, and module relationships. Be concise." -o text
```

#### Documentation Summarization
```bash
cat README.md | gemini -p "Summarize this README into 5 bullet points covering: what it does, how to install, how to use, key dependencies, and limitations." -o text
```

#### Comparative Analysis
```bash
gemini -p "Compare [A] vs [B] vs [C] for [USE_CASE]. Format as a markdown table with columns: Feature, A, B, C, Winner. Max 10 rows." -o text
```

---

## 5. Swarm Patterns (Recipes)

### 5.1 Fan-Out / Fan-In (Most Common)

Split a broad question into N focused sub-questions, dispatch in parallel, merge.

```
User asks: "How should we architect the image stitching pipeline?"

Fan-out:
  Agent 1: "Best practices for OpenCV image stitching pipelines"
  Agent 2: "Equirectangular projection techniques and libraries"
  Agent 3: "GPU-accelerated image processing in Python"
  Agent 4: "Production error handling for image processing"

Fan-in: Synthesize all 4 responses into a cohesive architecture recommendation.
```

### 5.2 Map (Parallel File Analysis)

Apply the same analysis prompt to N different files.

```
For each file in [a.py, b.py, c.py]:
  gemini -p "Summarize this module..." < file

Merge summaries into project overview.
```

### 5.3 Debate (Adversarial Validation)

Get opposing viewpoints to stress-test an approach.

```
Agent 1: "Argue FOR using approach X. Be persuasive."
Agent 2: "Argue AGAINST approach X. Be critical."
Agent 3: "Given both arguments, which is stronger and why?"
```

### 5.4 Chain (Sequential Deepening)

When the first result needs follow-up (use `waitForPreviousTools: true`).

```
Step 1: gemini -p "High-level overview of topic X"
Step 2: Take result → gemini -p "Deep dive into [specific aspect from step 1]"
Step 3: Take result → gemini -p "Generate implementation plan for [detail from step 2]"
```

### 5.5 Specialist Panel

Assign different expert roles for richer analysis.

```
Agent 1 (Architect):  "As a software architect, evaluate..."
Agent 2 (Security):   "As a security engineer, evaluate..."
Agent 3 (DevOps):     "As a DevOps engineer, evaluate..."
Agent 4 (End User):   "As a non-technical user, evaluate..."
```

---

## 6. Concurrency Limits & Best Practices

| Rule | Detail |
|---|---|
| **Max parallel agents** | 5 concurrent sub-agents. More risks rate-limiting. |
| **Timeout** | Set `WaitDurationSeconds=120` (2 min) per agent. |
| **Prompt size** | Keep stdin < 50KB per agent. Truncate large files. |
| **Model selection** | Use default (auto) for most tasks. Use `-m gemini-2.5-pro` for complex reasoning only. |
| **Safety** | Always use `--approval-mode plan` when piping code. Prevents accidental file edits. |
| **Error handling** | If a sub-agent fails/times out, note the gap and proceed with available results. |
| **Cost awareness** | Each call consumes API quota. Don't swarm trivially. |

---

## 7. Integration with Antigravity Workflow

### Before Swarming — Checklist

- [ ] Can I answer this with existing context? → **Don't swarm.**
- [ ] Is the task decomposable into independent sub-questions? → **Swarm.**
- [ ] Do I need multiple expert perspectives? → **Swarm.**
- [ ] Is there a large codebase to scan? → **Swarm (map pattern).**

### After Swarming — Synthesis Protocol

1. **Tag each result** with its sub-agent role/topic.
2. **Identify agreements** — points where multiple agents converge.
3. **Flag contradictions** — explicitly note conflicting information.
4. **Fill gaps** — note what no agent covered.
5. **Produce unified output** — your synthesis is the final answer, not raw sub-agent output.

### Example Orchestration (Pseudocode)

```
# User asks: "Review this module for production readiness"

# 1. Read the file
file_content = view_file("module.py")

# 2. Fan-out to 3 specialist sub-agents (all parallel)
run_command: echo "$file_content" | gemini -p "Security audit..." -o text        → id_sec
run_command: echo "$file_content" | gemini -p "Performance review..." -o text     → id_perf
run_command: echo "$file_content" | gemini -p "Error handling review..." -o text  → id_err

# 3. Collect (parallel)
command_status(id_sec,  wait=120)  → security_findings
command_status(id_perf, wait=120)  → perf_findings
command_status(id_err,  wait=120)  → error_findings

# 4. Synthesize into unified production readiness report
# Present to user with prioritized action items
```

---

## 8. Helper Script — Batch Swarm Runner

For complex swarm jobs, use the helper script at:
`scripts/swarm.sh`

```bash
# Run 3 prompts in parallel, collect results
./scripts/swarm.sh \
  "Research topic A" \
  "Research topic B" \
  "Research topic C"
```

See `scripts/swarm.sh` for implementation details.

---

## 9. Troubleshooting

| Issue | Fix |
|---|---|
| `command not found: gemini` | Prefix with `eval "$(/opt/homebrew/bin/brew shellenv)" &&` |
| Timeout / no output | Increase `WaitDurationSeconds`. Check API quota. |
| Garbled output | Use `-o text` not `-o json` for prose responses. |
| Auth error | Run `gemini` interactively once to complete login flow. |
| Rate limited | Reduce concurrency to 2-3 agents. Add delays. |
| Large file truncation | Pre-truncate with `head -500` or extract relevant sections. |

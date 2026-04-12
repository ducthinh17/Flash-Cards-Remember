#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Gemini Swarm Runner — Run multiple Gemini CLI prompts in parallel
# ──────────────────────────────────────────────────────────────────────────────
#
# Usage:
#   ./swarm.sh "prompt1" "prompt2" "prompt3"
#   ./swarm.sh -m gemini-2.5-pro "prompt1" "prompt2"
#   echo "context" | ./swarm.sh -s "analyze this from perspective A" "...perspective B"
#   ./swarm.sh -f prompts.txt          # one prompt per line
#   ./swarm.sh -j "prompt1" "prompt2"  # JSON output
#
# Options:
#   -m MODEL    Model override (default: auto)
#   -s          Pipe stdin to all agents as shared context
#   -f FILE     Read prompts from file (one per line)
#   -j          JSON output mode
#   -t SECONDS  Timeout per agent (default: 120)
#   -c COUNT    Max concurrent agents (default: 5)
#   -q          Quiet mode — only output results, no headers
#   -h          Show help
#
# Output:
#   Each agent's result is printed with a header:
#   ═══ AGENT 1/N ═══
#   <result>
#
# Exit codes:
#   0  All agents completed successfully
#   1  One or more agents failed
#   2  Invalid arguments
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Homebrew setup ──────────────────────────────────────────────────────────
if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
fi

# ── Verify gemini is available ──────────────────────────────────────────────
if ! command -v gemini &>/dev/null; then
    echo "ERROR: gemini CLI not found. Install with: brew install gemini-cli" >&2
    exit 2
fi

# ── Defaults ────────────────────────────────────────────────────────────────
MODEL=""
STDIN_CONTEXT=""
SHARE_STDIN=false
PROMPTS_FILE=""
OUTPUT_FORMAT="text"
TIMEOUT=120
MAX_CONCURRENT=5
QUIET=false

# ── Parse options ───────────────────────────────────────────────────────────
while getopts "m:sf:jt:c:qh" opt; do
    case $opt in
        m) MODEL="$OPTARG" ;;
        s) SHARE_STDIN=true ;;
        f) PROMPTS_FILE="$OPTARG" ;;
        j) OUTPUT_FORMAT="json" ;;
        t) TIMEOUT="$OPTARG" ;;
        c) MAX_CONCURRENT="$OPTARG" ;;
        q) QUIET=true ;;
        h)
            head -30 "$0" | grep '^#' | sed 's/^# \?//'
            exit 0
            ;;
        *)
            echo "Unknown option: -$OPTARG" >&2
            exit 2
            ;;
    esac
done
shift $((OPTIND - 1))

# ── Collect stdin if shared mode ────────────────────────────────────────────
if $SHARE_STDIN && [[ ! -t 0 ]]; then
    STDIN_CONTEXT=$(cat)
fi

# ── Collect prompts ─────────────────────────────────────────────────────────
PROMPTS=()
if [[ -n "$PROMPTS_FILE" ]]; then
    while IFS= read -r line; do
        [[ -n "$line" && ! "$line" =~ ^# ]] && PROMPTS+=("$line")
    done < "$PROMPTS_FILE"
fi
# Add positional arguments as prompts
PROMPTS+=("$@")

if [[ ${#PROMPTS[@]} -eq 0 ]]; then
    echo "ERROR: No prompts provided. Use positional args or -f file." >&2
    exit 2
fi

TOTAL=${#PROMPTS[@]}

# ── Build gemini base command ───────────────────────────────────────────────
build_cmd() {
    local prompt="$1"
    local cmd="gemini -p $(printf '%q' "$prompt") -o $OUTPUT_FORMAT --approval-mode plan"
    [[ -n "$MODEL" ]] && cmd="$cmd -m $MODEL"
    echo "$cmd"
}

# ── Temp directory for results ──────────────────────────────────────────────
TMPDIR_SWARM=$(mktemp -d)
trap 'rm -rf "$TMPDIR_SWARM"' EXIT

# ── Timeout wrapper (macOS compatible) ──────────────────────────────────────
# macOS lacks GNU `timeout`. Use background process + watchdog pattern.
run_with_timeout() {
    local secs="$1"
    shift
    # Run command in background
    "$@" &
    local cmd_pid=$!
    # Watchdog: kill after timeout
    (
        sleep "$secs" 2>/dev/null
        kill "$cmd_pid" 2>/dev/null
    ) &
    local watchdog_pid=$!
    
    # Wait for the command and capture its exit code
    local exit_code=0
    wait "$cmd_pid" 2>/dev/null || exit_code=$?
    
    # Clean up watchdog
    kill "$watchdog_pid" 2>/dev/null || true
    wait "$watchdog_pid" 2>/dev/null || true
    
    return $exit_code
}

# ── Launch agents ───────────────────────────────────────────────────────────
PIDS=()
ACTIVE=0

for i in "${!PROMPTS[@]}"; do
    idx=$((i + 1))
    prompt="${PROMPTS[$i]}"
    outfile="$TMPDIR_SWARM/agent_${idx}.out"
    errfile="$TMPDIR_SWARM/agent_${idx}.err"

    cmd=$(build_cmd "$prompt")

    if $SHARE_STDIN && [[ -n "$STDIN_CONTEXT" ]]; then
        (echo "$STDIN_CONTEXT" | run_with_timeout "$TIMEOUT" bash -c "$cmd" > "$outfile" 2> "$errfile") &
    else
        (run_with_timeout "$TIMEOUT" bash -c "$cmd" > "$outfile" 2> "$errfile") &
    fi
    PIDS+=($!)
    ACTIVE=$((ACTIVE + 1))

    # Throttle if at max concurrency
    if [[ $ACTIVE -ge $MAX_CONCURRENT ]]; then
        wait "${PIDS[0]}" 2>/dev/null || true
        PIDS=("${PIDS[@]:1}")
        ACTIVE=$((ACTIVE - 1))
    fi
done

# ── Wait for all remaining ──────────────────────────────────────────────────
FAILURES=0
for pid in "${PIDS[@]:-}"; do
    if ! wait "$pid" 2>/dev/null; then
        FAILURES=$((FAILURES + 1))
    fi
done

# ── Print results ───────────────────────────────────────────────────────────
for i in "${!PROMPTS[@]}"; do
    idx=$((i + 1))
    outfile="$TMPDIR_SWARM/agent_${idx}.out"
    errfile="$TMPDIR_SWARM/agent_${idx}.err"

    if ! $QUIET; then
        echo ""
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  AGENT $idx/$TOTAL"
        if [[ ${#PROMPTS[$i]} -le 80 ]]; then
            echo "  Prompt: ${PROMPTS[$i]}"
        else
            echo "  Prompt: ${PROMPTS[$i]:0:77}..."
        fi
        echo "═══════════════════════════════════════════════════════════════════"
    fi

    if [[ -s "$outfile" ]]; then
        cat "$outfile"
    elif [[ -s "$errfile" ]]; then
        echo "[FAILED] $(cat "$errfile")"
        FAILURES=$((FAILURES + 1))
    else
        echo "[NO OUTPUT]"
    fi
done

# ── Summary ─────────────────────────────────────────────────────────────────
if ! $QUIET; then
    echo ""
    echo "───────────────────────────────────────────────────────────────────"
    echo "  Swarm complete: $TOTAL agents, $FAILURES failures"
    echo "───────────────────────────────────────────────────────────────────"
fi

[[ $FAILURES -gt 0 ]] && exit 1
exit 0

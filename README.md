# Many

**Autonomous multi-agent QA system for exploring, testing, and analyzing web applications.**

Many is an experimental QA engineering project that explores how autonomous agents can interact with web applications, reason about their state, remember previous actions, recover from navigation loops, and collect evidence during testing.

The long-term goal is to coordinate multiple specialized QA agents — functional/UX, security, and performance — through a shared reasoning, memory, and evidence layer.

> Status: 🚧 Active development

---

## Why Many?

Traditional automated tests execute predefined scenarios.

Many explores a different approach:

> What if QA agents could observe an application, decide what to test next, remember what they already tried, and adapt when their strategy fails?

Instead of following only hard-coded test steps, Many is being designed around an autonomous testing loop:

```text
Goal
  ↓
Observe application
  ↓
Reason about current state
  ↓
Select action
  ↓
Execute through Playwright
  ↓
Store memory
  ↓
Evaluate progress
  ↓
Recover / Replan
  ↓
Continue
```

---

## Current Capabilities

### Browser Observation

Many uses Playwright to inspect the current browser state and extract structured information including:

- URL
- Page title
- Headings
- Visible text
- Links
- Buttons
- Inputs
- Interactive elements

Interactive DOM elements receive temporary `data-many-id` identifiers so that reasoning and execution operate on explicit elements rather than ambiguous text selectors.

---

### AI Action Selection

Many can send the current page state and testing goal to an LLM.

The model selects a structured action:

```json
{
  "type": "click",
  "targetId": 2,
  "reason": "This link is the most useful next step toward the goal."
}
```

The model cannot directly execute arbitrary browser code or invent selectors.

Actions are validated against the elements actually observed on the page before execution.

A deterministic action selector is also available as a fallback.

---

### Goal Evaluation

Before selecting another action, Many evaluates whether the current page contains enough evidence that the goal has been reached.

Goal evaluation currently uses destination evidence such as:

- URL
- Page title
- Headings

This avoids incorrectly considering a goal complete simply because related text appeared in a navigation link.

---

### Agent Memory

Many maintains memory during an execution session.

The agent currently tracks:

- Visited URLs
- Previous actions
- Action targets
- Decision reasons
- Failed actions
- Execution steps

Example:

```text
Visited URLs:
- loop-test.html
- exit-test.html

Actions:
- Continue
- Exit

Failures:
[]
```

Memory is passed back into the reasoning process so the agent can make decisions using its previous behavior.

---

### Loop Detection

Many detects when an agent attempts to execute the same action again on the same page.

Instead of navigating indefinitely:

```text
Continue
↓
same page
↓
Continue
↓
same page
↓
Continue...
```

Many can recognize that the action has already been attempted.

---

### Recovery

When a repeated action is detected, the reasoning layer can request an alternative strategy.

Example:

```text
STEP 1
Agent → Continue

STEP 2
Agent → Continue again

Memory → Action already attempted

Recovery → Choose another action

Agent → Exit

STEP 3
Navigation continues successfully
```

Recovery has a deterministic test using a mocked AI client, allowing the behavior to be tested without depending on unpredictable LLM responses.

---

### Graceful Stop

The reasoning layer guarantees that the agent can stop safely when no valid action remains.

Instead of propagating an invalid or `null` decision through the execution loop, Many returns a structured stop decision.

```json
{
  "type": "stop",
  "reason": "No relevant action found"
}
```

---

## Architecture

Current architecture:

```text
                    ┌───────────────┐
                    │     Goal      │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Observation  │
                    │   Playwright  │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Reasoner    │
                    ├───────────────┤
                    │ Goal Evaluator│
                    │ AI Selector   │
                    │ Fallback      │
                    │ Recovery      │
                    └───────┬───────┘
                            │
                  ┌─────────┴─────────┐
                  ▼                   ▼
          ┌───────────────┐   ┌───────────────┐
          │ Agent Memory  │   │Action Executor│
          └───────────────┘   │  Playwright   │
                  ▲           └───────┬───────┘
                  │                   │
                  └───────────────────┘
```

---

## Project Structure

```text
many/
│
├── actions/
│   ├── action-executor.js
│   └── test-action-executor.js
│
├── agents/
│   └── agent.js
│
├── browser/
│   └── browser.js
│
├── memory/
│   └── agent-memory.js
│
├── observation/
│   ├── observation.js
│   └── test-observation.js
│
├── reasoning/
│   ├── action-selector.js
│   ├── ai-action-selector.js
│   ├── goal-evaluator.js
│   ├── openai-client.js
│   ├── reasoner.js
│   └── test-reasoner.js
│
├── agent-loop.js
├── population.js
│
├── loop-test.html
├── exit-test.html
│
├── test-agent-loop.js
├── test-loop-detection.js
├── test-recovery.js
│
├── package.json
└── README.md
```

---

## Testing Recovery

A deterministic recovery scenario is included.

The test intentionally simulates an AI agent making a bad decision:

```text
First decision  → Continue
Second decision → Continue again
Recovery        → Exit
```

Run:

```bash
node test-recovery.js
```

Expected behavior:

```text
STEP 1
Continue

STEP 2
AI tried to repeat a previous action. Recovering...

Recovery chooses Exit

STEP 3
No relevant action found

AGENT STOPPED
```

The final browser location should be:

```text
exit-test.html
```

with no recorded failures.

---

## Running Many

Install dependencies:

```bash
npm install
```

Install Playwright browsers if required:

```bash
npx playwright install
```

Create a local `.env` file:

```env
OPENAI_API_KEY=your_api_key
DEBUG_MANY=false
```

> Never commit `.env` or API keys to the repository.

Run the autonomous agent test:

```bash
node test-agent-loop.js
```

Run loop detection:

```bash
node test-loop-detection.js
```

Run deterministic recovery:

```bash
node test-recovery.js
```

---

## Debug Mode

Many supports optional development logging.

Enable it through `.env`:

```env
DEBUG_MANY=true
```

Disable it for cleaner execution output:

```env
DEBUG_MANY=false
```

Debug mode can expose additional information about AI responses, observed elements, and browser execution without permanently filling normal execution output with development logs.

---

## Vision

Many is being designed as a coordinated population of specialized QA agents.

### Classic / NPC User Agent

Focus:

- Functional testing
- User journeys
- Navigation
- UX friction
- Broken flows
- Dead ends
- Unexpected application behavior

### Security Agent

Planned focus:

- Authentication transitions
- Authorization boundaries
- Input validation
- Cookies and storage
- Network behavior
- API responses
- Data exposure
- Security-related application behavior

Testing is intended to remain controlled and non-destructive.

### Performance Agent

Planned focus:

- Request timings
- Failed requests
- TTFB
- DOM loading
- Resource sizes
- JavaScript errors
- Long tasks
- Performance degradation

Future load scenarios may combine browser-discovered workflows with request-based load testing tools.

---

## Future Architecture

The planned system evolves toward:

```text
                    Experiment Manager
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      Classic Agent   Security Agent  Performance Agent
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                  Shared Evidence Layer
                           │
                           ▼
                   Correlation Engine
                           │
                           ▼
                   Evidence / Report
```

The goal is not to produce three disconnected testing reports.

Many aims to correlate findings across dimensions.

For example, the same application behavior could simultaneously produce:

```text
UX
User experiences a slow or confusing checkout

Performance
A backend request takes several seconds

Security
The same request exposes unexpected information
```

Many should eventually connect those observations into a single evidence-backed finding.

---

## Roadmap

**Core Agent**
- [x] Browser automation
- [x] Structured observation
- [x] Action execution
- [x] Goal evaluation
- [x] AI action selection
- [x] Deterministic fallback

**Memory & Reasoning**
- [x] Session memory
- [x] Visited URL tracking
- [x] Action history
- [x] Failure history
- [x] Loop detection
- [x] Recovery
- [x] Graceful stop
- [ ] Multi-step planning
- [ ] Strategy replanning

**Evidence Engine**
- [ ] Network evidence
- [ ] Console evidence
- [ ] Screenshots
- [ ] Error collection
- [ ] Performance metrics
- [ ] Evidence correlation

**Agent Population**
- [ ] Classic / NPC User Agent
- [ ] Security Agent
- [ ] Performance Agent
- [ ] Experiment Manager
- [ ] Shared agent memory
- [ ] Correlation engine

**Product**
- [ ] Structured findings
- [ ] Evidence packs
- [ ] Test reports
- [ ] Dashboard
- [ ] Demo environment

---

## Tech Stack

- Node.js
- JavaScript
- Playwright
- OpenAI API
- LLM-based reasoning
- Git / GitHub

---

## Project Philosophy

Many is not intended to replace deterministic automated testing.

The project explores how autonomous reasoning can complement traditional QA by handling situations where the next useful test action cannot always be completely predefined.

The core principles are:

**Observe → Reason → Act → Remember → Evaluate → Recover**

---

## Author

**Lisette Mainhard**

QA Engineer focused on test automation, AI-assisted testing, and experimental QA tooling.
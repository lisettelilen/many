# Many

**Experimental AI Agent Evaluation & Reliability platform for autonomous software testing, behavioral experimentation, and failure discovery.**

Many is an experimental AI Agent Evaluation & Reliability project that explores how autonomous agents can interact with software, reason about their environment, adapt their strategies, recover from failures, and produce reproducible execution evidence.

The current implementation provides an autonomous single-agent browser engine built with Playwright and LLM-based reasoning.

The long-term vision is to run populations of artificial users and specialized testing agents against both traditional software and autonomous AI systems, enabling long-running experiments designed to discover rare failures, behavioral divergence, reasoning loops, error accumulation, and emergent reliability problems.

> Status: 🚧 Active development  
> Current milestone: **Milestone 1 — Autonomous Single Agent Engine ✅**

---

## Why Many?

Traditional automated tests execute predefined scenarios.

That works extremely well when the expected workflow is already known.

Many explores a different problem:

> What happens when the next useful test action cannot be completely predefined?

Instead of following only hard-coded test steps, Many is being designed around an autonomous experimentation loop:

```text
Goal
 ↓
Observe Environment
 ↓
Build Strategy
 ↓
Reason About Current State
 ↓
Select Action
 ↓
Execute
 ↓
Observe Result
 ↓
Evaluate Progress
 ↓
Remember
 ↓
Recover / Replan
 ↓
Continue
```

The objective is not to replace deterministic automated testing.

Many investigates how autonomous reasoning, artificial user populations, behavioral experimentation, and reproducible evidence can complement traditional QA and AI evaluation.

---

# Current Status

## Milestone 1 — Autonomous Single Agent Engine ✅

Many currently includes a working autonomous browser-agent engine capable of turning a high-level goal into a multi-step execution strategy.

The agent can:

- Observe the current browser state and available interactive elements.
- Generate plans grounded in real page evidence.
- Select browser actions using AI reasoning.
- Execute actions through Playwright.
- Evaluate whether individual plan steps were completed.
- Progress autonomously through multi-step plans.
- Maintain memory of visited states and previous actions.
- Detect repeated actions and navigation loops.
- Recover from unsuccessful or repeated actions.
- Detect lack of progress.
- Trigger strategic replanning.
- Generate alternative strategies using current state and previous attempts.
- Record structured execution trajectories.
- Stop gracefully when the goal or plan is complete.

---

# Current Execution Loop

```text
                         GLOBAL GOAL
                              │
                              ▼
                        OBSERVATION
                         Playwright
                              │
                              ▼
                     GROUNDED PLANNER
                              │
                              ▼
                     CURRENT PLAN STEP
                              │
                              ▼
                          REASONER
                   ┌──────────┼──────────┐
                   │          │          │
                   ▼          ▼          ▼
               AI Selector  Fallback  Recovery
                   │
                   ▼
                         ACTION
                   targetId + reason
                              │
                              ▼
                    ACTION EXECUTOR
                       Playwright
                              │
                              ▼
                      NEW OBSERVATION
                              │
                              ▼
                       STEP EVALUATOR
                              │
                 ┌────────────┴────────────┐
                 │                         │
              COMPLETE                 INCOMPLETE
                 │                         │
                 ▼                         ▼
             NEXT STEP                 ATTEMPTS
                                           │
                                           ▼
                                         STUCK?
                                           │
                                           ▼
                                        REPLAN
                                           │
                                           ▼
                                     NEW STRATEGY
```

Every successful execution can also contribute structured evidence to the agent trajectory.

---

# Core Components

## Browser Observation

Many uses Playwright to inspect the current browser state and extract structured information including:

- URL
- Page title
- Headings
- Visible text
- Links
- Buttons
- Inputs
- Interactive elements

Interactive DOM elements receive temporary `data-many-id` identifiers.

This allows the reasoning and execution layers to operate on explicit observed elements instead of relying on ambiguous text selectors.

Example:

```text
CURRENT PAGE:
URL: https://example.com/
Title: Example Domain

Headings:
Example Domain

Interactive elements:
1: a "Learn more"
```

---

## Observation-Grounded Planning

The Planner converts a global goal into a short sequence of high-level objectives.

Planning is grounded in the current browser observation.

Instead of assuming that an application contains features such as search bars, filters, carts, dashboards, or settings pages, the Planner receives evidence about the actual page before generating its strategy.

Conceptually:

```text
Global Goal
     +
Current Observation
     ↓
Planner
     ↓
High-Level Strategy
```

Example:

```text
Goal:
Find information about reserved domains

Observed page:
Example Domain
Available action: "Learn more"

Plan:
1. Open the available Learn more link.
2. Review the resulting page for information about reserved domains.
3. Follow relevant authoritative references.
```

The Planner manages:

- Global goal
- Plan steps
- Current step
- Step progression
- Step attempts
- Plan completion
- Strategic replanning

---

## AI Action Selection

The Reasoner decides what exact browser action should be taken to pursue the current plan step.

The model receives information about:

- Global context
- Current plan step
- Current page
- Available interactive elements
- Agent memory

It returns a structured action such as:

```json
{
  "type": "click",
  "targetId": 2,
  "reason": "This link is the most useful next action toward the current plan step."
}
```

The model does not directly execute arbitrary browser code.

Actions are validated against elements that were actually observed before being passed to the Action Executor.

A deterministic selector is also available as a fallback.

---

## Action Execution

The Action Executor translates a validated structured decision into a browser interaction.

For example:

```text
Reasoner:
click targetId 2

        ↓

Action Executor

        ↓

Playwright:
[data-many-id="2"]

        ↓

Browser interaction
```

Reasoning and browser execution remain separated.

---

## Goal Evaluation

Before selecting another action, Many evaluates whether the global goal appears to have been reached.

Goal evaluation currently uses destination evidence such as:

- URL
- Page title
- Headings

This avoids incorrectly considering a goal complete simply because related text appeared inside a navigation link.

Goal evaluation operates at the global mission level, while Step Evaluation operates at the individual plan-step level.

---

## Step Evaluation

After an action is executed, Many compares the state before and after the action.

The Step Evaluator receives:

```text
Current Plan Step
        +
Before Observation
        +
Action Taken
        +
After Observation
        ↓
Step Evaluator
        ↓
complete: true / false
```

Example:

```text
PLAN STEP:
Open the "Learn more" link

BEFORE:
https://example.com/

ACTION:
click targetId 1

AFTER:
https://www.iana.org/help/example-domains

RESULT:
complete: true
```

If the step is complete, the Planner advances to the next objective.

If it is incomplete, the attempt is recorded and the agent may eventually replan.

---

# Agent Memory

Many maintains execution memory during an agent session.

The current memory model tracks:

- Visited URLs
- Previous actions
- Action targets
- Decision reasons
- Failed actions
- Execution steps
- Structured trajectories

Memory is fed back into reasoning and replanning so the agent can make decisions using information about its previous behavior.

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

---

# Loop Detection

Many detects when an agent attempts to execute the same action again on the same page.

Without loop detection:

```text
Continue
   ↓
same page
   ↓
Continue
   ↓
same page
   ↓
Continue
   ↓
...
```

With memory and loop detection:

```text
Action already attempted
        ↓
Recovery
        ↓
Alternative action
```

This prevents simple navigation loops from consuming the entire execution budget.

---

# Recovery

Recovery operates at the **action level**.

When the Reasoner attempts to repeat an action that has already been executed on the same page, Many can request a different action.

Example:

```text
STEP 1

Agent → Continue

STEP 2

Agent → Continue again

Memory → Action already attempted

Recovery → Choose another action

Agent → Exit
```

Recovery therefore answers:

> Is this particular action failing or repeating, and can I try another action?

---

# Strategic Replanning

Replanning operates at a higher level than Recovery.

When a plan step repeatedly fails to make progress, Many can abandon the current strategy and generate a new plan.

The Replanner receives:

- Global goal
- Failed or stuck plan step
- Current browser observation
- Previous plan
- Agent memory
- Previous attempts

Conceptually:

```text
Strategy A
    ↓
Attempt
    ↓
No progress
    ↓
Attempt
    ↓
No progress
    ↓
STUCK
    ↓
Replanner
    ↓
Strategy B
    ↓
Different action
    ↓
Continue
```

This distinction is intentional:

```text
Recovery
→ "This action is not useful. Try another action."

Replanning
→ "This strategy is not working. Change the plan."
```

A deterministic replanning test currently demonstrates the complete flow:

```text
Impossible objective
        ↓
Continue
        ↓
No progress
        ↓
Continue
        ↓
No progress
        ↓
REPLANNING
        ↓
New strategy: use Exit
        ↓
Exit
        ↓
Step complete
        ↓
PLAN COMPLETE
```

---

# Trajectory Logging

Many records structured execution trajectories.

A trajectory represents more than a list of clicks.

It connects:

```text
Intent
  ↓
Before State
  ↓
Decision
  ↓
Action
  ↓
After State
  ↓
Evaluation
```

Example:

```json
{
  "planStep": "Use the available Exit link to leave the current flow",
  "beforeUrl": "loop-test.html",
  "beforeTitle": "Loop Test",
  "action": {
    "type": "click",
    "targetId": 2,
    "reason": "Use the new strategy and leave through Exit"
  },
  "afterUrl": "exit-test.html",
  "afterTitle": "Exit Successful",
  "stepComplete": true,
  "evaluationReason": "The agent successfully left the loop using the Exit path"
}
```

Trajectory logging is an important foundation for the future Many architecture.

One agent produces one trajectory.

Future populations will produce many trajectories:

```text
Agent 1 ──→ Trajectory 1
Agent 2 ──→ Trajectory 2
Agent 3 ──→ Trajectory 3
   ...
Agent N ──→ Trajectory N

               ↓

        Correlation Engine

               ↓

Patterns
Divergences
Loops
Rare failures
Behavioral anomalies
```

---

# Graceful Completion

Many guarantees that the agent can stop safely when no valid action remains or when the plan is complete.

A Reasoner stop decision has a structured format:

```json
{
  "type": "stop",
  "reason": "No relevant action found"
}
```

When every plan step has been completed, the execution loop can terminate directly with:

```text
PLAN COMPLETE
```

This prevents unnecessary actions after the current strategy has been completed.

---

# Architecture

Current Milestone 1 architecture:

```text
                         ┌───────────────┐
                         │  Global Goal  │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │  Observation  │
                         │  Playwright   │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │    Planner    │
                         │ Grounded Plan │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Current Step  │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   Reasoner    │
                         ├───────────────┤
                         │ GoalEvaluator │
                         │ AI Selector   │
                         │ Fallback      │
                         │ Recovery      │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌───────────────┐        ┌───────────────┐
             │ Agent Memory  │        │Action Executor│
             └───────────────┘        │  Playwright   │
                    ▲                 └───────┬───────┘
                    │                         │
                    │                         ▼
                    │                 ┌───────────────┐
                    │                 │New Observation│
                    │                 └───────┬───────┘
                    │                         │
                    │                         ▼
                    │                 ┌───────────────┐
                    │                 │Step Evaluator │
                    │                 └───────┬───────┘
                    │                         │
                    │              ┌──────────┴──────────┐
                    │              │                     │
                    │              ▼                     ▼
                    │         Next Step              No Progress
                    │                                    │
                    │                                    ▼
                    │                                Replanner
                    │                                    │
                    └────────────────────────────────────┘
```

---

# Project Structure

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
├── planning/
│   ├── planner.js
│   └── step-evaluator.js
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
├── test-planner.js
├── test-replanning.js
│
├── package.json
└── README.md
```

---

# Deterministic Testing

Many includes deterministic tests using mocked AI responses.

This makes it possible to verify autonomous behavior without relying entirely on unpredictable LLM outputs.

## Recovery Test

The recovery test intentionally causes the agent to repeat an action:

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
AI tried to repeat a previous action.
Recovering...

Recovery chooses Exit
```

---

## Replanning Test

The deterministic replanning test intentionally creates a strategy that cannot succeed.

Run:

```bash
node test-replanning.js
```

Expected high-level behavior:

```text
PLAN:
Reach a page that does not exist

STEP 1
Continue
Step complete: false

STEP 2
Continue
Step complete: false

AGENT APPEARS STUCK
REPLANNING...

NEW PLAN:
Use the available Exit link

STEP 3
Exit

Step complete: true

PLAN COMPLETE
```

The final browser location should be:

```text
exit-test.html
```

This test demonstrates that Many can detect strategic lack of progress, generate a new plan, choose a different action, and successfully escape the original failure state.

---

# Running Many

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

Run the autonomous agent integration test:

```bash
node test-agent-loop.js
```

Run Planner:

```bash
node test-planner.js
```

Run loop detection:

```bash
node test-loop-detection.js
```

Run deterministic Recovery:

```bash
node test-recovery.js
```

Run deterministic Replanning:

```bash
node test-replanning.js
```

---

# Debug Mode

Many supports optional development logging.

Enable it through `.env`:

```env
DEBUG_MANY=true
```

Disable it for cleaner execution output:

```env
DEBUG_MANY=false
```

Debug mode can expose additional information about LLM responses and reasoning decisions without permanently filling normal execution output with development logs.

---

# Long-Term Vision

Many is evolving from an autonomous browser QA agent into an experimental platform for **AI Agent Evaluation & Reliability**.

The long-term goal is to run populations of artificial users and specialized testing agents against both software and autonomous AI systems.

Instead of asking only:

> Does this application have bugs?

Many aims to investigate:

> What happens when diverse populations of autonomous agents interact with a system repeatedly and over long periods of time?

Future experiments are intended to explore behaviors such as:

- Rare and difficult-to-reproduce failures
- Navigation loops
- Reasoning loops
- Error accumulation across long trajectories
- Inconsistent decisions
- Technically valid but undesirable behavior
- Behavioral drift
- Degradation over repeated interactions
- Interference between agents
- Emergent behavior
- Security and permission boundary failures
- Performance degradation

---

# Specialized Agent Population

A future Many population may include several categories of testing behavior.

## Classic / NPC User Agents

Focus:

- Functional testing
- User journeys
- Navigation
- UX friction
- Broken flows
- Dead ends
- Unexpected behavior
- Different behavioral personas

Future populations may simulate users with different strategies and behavior rather than repeatedly executing one identical deterministic path.

---

## Security Agents

Planned focus:

- Authentication transitions
- Authorization boundaries
- Input validation
- Cookies and storage
- Network behavior
- API responses
- Data exposure
- Permission boundaries
- Security-related application behavior

Testing is intended to remain controlled and non-destructive.

---

## Performance Agents

Planned focus:

- Request timings
- Failed requests
- TTFB
- DOM loading
- Resource sizes
- JavaScript errors
- Long tasks
- Performance degradation

Future load experiments may combine browser-discovered workflows with request-based load testing tools.

---

# Future Experiment Architecture

The planned architecture evolves toward:

```text
                         Experiment Manager
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
        User Population   Security Agents   Performance Agents
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
                                ▼
                         Shared Evidence
                                │
                                ▼
                         Trajectory Store
                                │
                                ▼
                        Correlation Engine
                                │
                                ▼
                       Failure Reproduction
                                │
                                ▼
                          Evidence Pack
```

The goal is not to produce disconnected reports from different agents.

Many aims to correlate behavior across many executions.

For example:

```text
Trajectory 17
User encounters unexpected behavior

Trajectory 42
Different persona reaches the same failure through another path

Trajectory 86
Performance degradation appears immediately before the failure

Trajectory 103
Security-related evidence appears during the same state transition

                         ↓

                 Correlation Engine

                         ↓

              One evidence-backed finding
```

---

# Agents Testing Agents

A later stage of Many will explore autonomous agents testing other autonomous AI systems.

Conceptually:

```text
                  AGENT UNDER TEST
                         │
              plan → tools → memory
                         │
                         ▼
                 MANY POPULATION
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
         Persona A   Persona B   Persona C
          normal      chaotic    adversarial
             │           │           │
             └───────────┼───────────┘
                         │
                         ▼
                 Observe Trajectories
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
          Loops        Drift      Bad Decisions
            │            │            │
            └────────────┼────────────┘
                         │
                         ▼
                  Reproduce Failure
                         │
                         ▼
                    Evidence Pack
```

Potential future evaluation targets include:

- Tool-selection failures
- Reasoning loops
- Memory failures
- Contradictory behavior
- Error propagation
- Behavioral drift
- Long-horizon degradation
- Multi-agent interference
- Rare emergent failures

---

# What Many Is Trying to Differentiate

The long-term differentiating layer is not intended to be the existence of AI agents themselves.

Agents are increasingly becoming infrastructure.

Many is intended to focus on the layer around them:

```text
Many Agents
     ↓
Many Trajectories
     ↓
Large Amounts of Behavioral Evidence
     ↓
Experiment Engine
     ↓
Correlation
     ↓
Failure Discovery
     ↓
Reproduction
     ↓
Evidence
```

The core research/product question is:

> Can populations of artificial users and testing agents expose reliability failures that conventional tests or isolated agent evaluations fail to reveal?

---

# Roadmap

## Milestone 1 — Autonomous Single Agent Engine ✅

- [x] Browser automation
- [x] Structured browser observation
- [x] Interactive element identification
- [x] Action execution
- [x] Goal evaluation
- [x] AI action selection
- [x] Deterministic fallback
- [x] Session memory
- [x] Visited URL tracking
- [x] Action history
- [x] Failure history
- [x] Loop detection
- [x] Action recovery
- [x] Observation-grounded planning
- [x] Step evaluation
- [x] Multi-step plan progression
- [x] Strategic replanning
- [x] Structured trajectory logging
- [x] Graceful stop
- [x] Graceful plan completion

---

## Milestone 2 — Population Engine

- [ ] Agent identity model
- [ ] Behavioral personas
- [ ] Population configuration
- [ ] Multiple agent execution
- [ ] Independent agent memory
- [ ] Independent trajectory collection
- [ ] Experiment-level run IDs
- [ ] Population execution summaries

---

## Milestone 3 — Evidence & Correlation Engine

- [ ] Network evidence
- [ ] Console evidence
- [ ] Screenshots
- [ ] Error collection
- [ ] Performance evidence
- [ ] Shared evidence store
- [ ] Trajectory comparison
- [ ] Behavioral divergence detection
- [ ] Failure clustering
- [ ] Rare failure detection
- [ ] Failure reproduction
- [ ] Evidence packs

---

## Milestone 4 — AI Agent Evaluation

- [ ] Agents testing autonomous AI agents
- [ ] Long-running experiments
- [ ] Reasoning loop detection
- [ ] Error accumulation analysis
- [ ] Behavioral drift analysis
- [ ] Long-horizon degradation detection
- [ ] Multi-agent interference experiments
- [ ] Reliability experiment scoring

---

## Milestone 5 — Product Layer

- [ ] Experiment dashboard
- [ ] Population visualization
- [ ] Trajectory explorer
- [ ] Failure explorer
- [ ] Evidence viewer
- [ ] Structured findings
- [ ] Reports
- [ ] Demo environment
- [ ] Public deployment

---

# Tech Stack

Current:

- Node.js
- JavaScript
- Playwright
- OpenAI API
- LLM-based reasoning
- Git
- GitHub

Potential future infrastructure will be selected as the population, experiment, storage, and correlation layers evolve.

---

# Project Philosophy

Many is not intended to replace deterministic automated testing.

Deterministic tests remain the right tool when expected behavior and execution paths are known.

Many explores another layer of quality and reliability engineering: environments where useful behavior must be discovered dynamically and where failures may emerge only through repeated, diverse, or long-running interactions.

The current single-agent engine follows:

> **Observe → Plan → Reason → Act → Evaluate → Remember → Recover → Replan**

The future experimental system extends this toward:

> **Populate → Experiment → Observe → Correlate → Reproduce → Evidence**

---

# Current Limitations

Many is currently an experimental prototype.

Milestone 1 focuses on a single autonomous browser agent.

The following capabilities are part of the roadmap and are **not yet implemented**:

- Large agent populations
- Concurrent experiment orchestration
- Security-specialized agents
- Performance-specialized agents
- Shared evidence infrastructure
- Trajectory correlation
- Automated failure clustering
- Rare failure discovery across populations
- Agent-vs-agent evaluation
- Long-running reliability experiments
- Production dashboard

The roadmap intentionally separates implemented capabilities from experimental direction.

---

# Author

**Lisette Mainhard**

QA Engineer focused on test automation, AI-assisted testing, autonomous QA systems, and experimental AI reliability tooling.
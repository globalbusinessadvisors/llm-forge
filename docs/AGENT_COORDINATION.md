# Agent Coordination Protocol

## Overview

This document defines the coordination protocols, communication patterns, and integration points for the LLM-Forge specialist agent swarm. The SwarmLead uses these protocols to orchestrate work across multiple concurrent workstreams.

## Swarm Structure

### Agent Hierarchy

```
SwarmLead (Coordinator)
├── Schema Architect Agent
├── Template Engine Agent
├── Language Specialist Agents (7)
│   ├── TypeScript Agent
│   ├── Python Agent
│   ├── Rust Agent
│   ├── JavaScript Agent
│   ├── C# Agent
│   ├── Go Agent
│   └── Java Agent
├── Build Pipeline Agent
├── Testing & Quality Agent
├── Documentation Agent
└── CLI & Developer Experience Agent
```

## Communication Protocols

### 1. Work Assignment Protocol

**SwarmLead → Specialist Agent**

```json
{
  "type": "work_assignment",
  "agent": "schema-architect",
  "phase": "1",
  "tasks": [
    {
      "id": "task-001",
      "title": "Design canonical schema",
      "description": "Create JSON Schema for canonical type system",
      "priority": "critical",
      "dependencies": [],
      "deliverables": ["schemas/canonical-schema.json"],
      "deadline": "Week 3"
    }
  ],
  "context": {
    "architecture_doc": "docs/ARCHITECTURE.md",
    "related_tasks": []
  }
}
```

**Specialist Agent → SwarmLead (Acknowledgment)**

```json
{
  "type": "work_acknowledged",
  "agent": "schema-architect",
  "task_id": "task-001",
  "status": "accepted",
  "estimated_completion": "2024-01-15",
  "clarifications": [
    "Should canonical schema support provider-specific extensions?"
  ]
}
```

### 2. Progress Reporting Protocol

**Specialist Agent → SwarmLead (Regular Updates)**

```json
{
  "type": "progress_report",
  "agent": "schema-architect",
  "task_id": "task-001",
  "status": "in_progress",
  "completion_percentage": 60,
  "completed_deliverables": [
    "schemas/canonical-schema-draft.json"
  ],
  "blockers": [],
  "next_steps": [
    "Validate schema with TypeScript generator",
    "Add validation rules"
  ]
}
```

**Expected Frequency**: Daily for active tasks, weekly for pending tasks

### 3. Dependency Request Protocol

**Agent A → SwarmLead → Agent B**

```json
{
  "type": "dependency_request",
  "requesting_agent": "typescript-agent",
  "blocking_task": "task-015",
  "required_from": "template-engine-agent",
  "required_deliverable": "templates/engine.ts",
  "urgency": "high",
  "reason": "Cannot proceed with TypeScript templates until engine API is stable"
}
```

**SwarmLead Response**:
- Checks dependency graph
- Prioritizes blocking task
- Notifies both agents
- Tracks resolution

### 4. Integration Point Protocol

**Definition Phase**:

```json
{
  "type": "integration_point_definition",
  "name": "schema-to-template",
  "provider_agent": "schema-architect",
  "consumer_agent": "template-engine",
  "interface": {
    "input": "CanonicalSchema",
    "output": "TemplateContext",
    "contract": "schemas/interfaces/schema-template.ts"
  },
  "validation": "tests/integration/schema-template.test.ts"
}
```

**Validation Phase**:

```json
{
  "type": "integration_validation",
  "integration_point": "schema-to-template",
  "status": "passed",
  "test_results": {
    "total": 25,
    "passed": 25,
    "failed": 0
  }
}
```

### 5. Conflict Resolution Protocol

**Agent → SwarmLead (Conflict Report)**

```json
{
  "type": "conflict_report",
  "reporting_agent": "rust-agent",
  "conflict_with": "schema-architect",
  "issue": "Canonical schema doesn't support Rust's lifetime annotations",
  "impact": "Cannot generate idiomatic Rust code for streaming responses",
  "proposed_solutions": [
    "Add metadata field for language-specific hints",
    "Create Rust-specific schema extension"
  ]
}
```

**SwarmLead Resolution Process**:
1. Gather context from both agents
2. Review architecture constraints
3. Evaluate solutions against design principles
4. Make decision
5. Update relevant documentation
6. Notify affected agents

### 6. Review Request Protocol

**Agent → SwarmLead (Review Request)**

```json
{
  "type": "review_request",
  "agent": "python-agent",
  "deliverable": "generators/python/",
  "review_type": "architecture_compliance",
  "checklist": [
    "Follows canonical schema correctly",
    "Type mappings are accurate",
    "Generated code is idiomatic Python",
    "Tests cover all edge cases"
  ]
}
```

## Integration Points

### 1. Schema Normalization → Code Generation

**Interface**: `/workspaces/llm-forge/core/schema/canonical-schema.json`

**Contract**:
- Schema Architect publishes canonical schema
- All generators consume this schema
- Breaking changes require major version bump
- Backward compatibility maintained for one version

**Validation**:
```typescript
// tests/integration/schema-validation.test.ts
describe('Canonical Schema', () => {
  it('validates against JSON Schema spec', () => {
    const schema = loadCanonicalSchema();
    expect(validateSchema(schema)).toBe(true);
  });

  it('includes all required provider capabilities', () => {
    const schema = loadCanonicalSchema();
    expect(schema.capabilities).toContain('streaming');
    expect(schema.capabilities).toContain('function_calling');
  });
});
```

### 2. Template Engine → Language Renderers

**Interface**: `/workspaces/llm-forge/templates/engine.ts`

**Contract**:
```typescript
interface TemplateEngine {
  render(templatePath: string, context: TemplateContext): string;
  registerHelper(name: string, fn: HelperFunction): void;
  validateTemplate(templatePath: string): ValidationResult;
}

interface TemplateContext {
  schema: CanonicalSchema;
  language: LanguageConfig;
  provider: ProviderConfig;
  types: TypeMapping[];
}
```

**Validation**:
- Template must compile
- All variables in context must be used or explicitly ignored
- Output must be valid code in target language

### 3. Language Renderers → Build Pipeline

**Interface**: `/workspaces/llm-forge/core/generators/output.ts`

**Contract**:
```typescript
interface GeneratedOutput {
  language: string;
  files: GeneratedFile[];
  buildConfig: BuildConfiguration;
  dependencies: Dependency[];
}

interface GeneratedFile {
  path: string;
  content: string;
  generated: true;
  doNotEdit: true;
}

interface BuildConfiguration {
  packageManager: string;
  buildCommands: string[];
  testCommands: string[];
  publishCommands: string[];
}
```

### 4. All Agents → Testing & Quality

**Interface**: `/workspaces/llm-forge/tests/`

**Contract**:
- Each agent provides test suite for their components
- Tests must pass in CI before merge
- Coverage must be >90%
- Integration tests run nightly

### 5. All Agents → Documentation

**Interface**: `/workspaces/llm-forge/docs/`

**Contract**:
- Each agent documents their components
- API changes require documentation updates
- Examples must be runnable
- Documentation generated from code where possible

## Synchronization Points

### Daily Standups (Async)
Each agent posts:
- Yesterday's progress
- Today's plan
- Any blockers

Format: `/workspaces/llm-forge/.swarm/standups/YYYY-MM-DD.md`

### Weekly Integration Reviews
- SwarmLead reviews all integration points
- Cross-agent testing results
- Dependency graph updates
- Upcoming milestone preparation

### Phase Transitions
- All phase deliverables reviewed
- Integration testing complete
- Documentation updated
- Go/no-go decision for next phase

## Artifact Organization

### Directory Structure

```
llm-forge/
├── .swarm/                    # Swarm coordination files
│   ├── assignments/           # Task assignments
│   ├── standups/              # Daily updates
│   ├── decisions/             # Architecture decisions
│   └── integration-points/    # Integration specs
├── core/                      # Core generator
│   ├── schema/                # Schema Architect
│   ├── templates/             # Template Engine
│   └── generators/            # Language Renderers
├── cli/                       # CLI Agent
├── tests/                     # Testing Agent
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                      # Documentation Agent
└── examples/                  # All agents contribute
```

### Artifact Ownership

| Path | Owner | Consumers |
|------|-------|-----------|
| `core/schema/` | Schema Architect | All generators |
| `core/templates/engine.ts` | Template Engine | All language agents |
| `templates/rust/` | Rust Agent | Build Pipeline |
| `templates/typescript/` | TypeScript Agent | Build Pipeline |
| `templates/python/` | Python Agent | Build Pipeline |
| `cli/` | CLI Agent | End users |
| `tests/integration/` | Testing Agent | All agents |
| `docs/` | Documentation Agent | End users |

### Change Management

**Breaking Changes**:
1. Agent proposes change with RFC
2. SwarmLead reviews impact
3. Affected agents are notified
4. Migration plan created
5. Change implemented with deprecation period
6. All dependent code updated
7. Documentation updated

**Non-Breaking Changes**:
1. Agent implements change
2. Tests pass
3. Documentation updated
4. PR submitted
5. SwarmLead or relevant agent reviews
6. Merge

## Decision Making

### Decision Levels

**Level 1: Agent Autonomous**
- Implementation details within agent's domain
- Non-breaking changes
- Performance optimizations
- Documentation improvements

**Level 2: SwarmLead Approval Required**
- Cross-agent interfaces
- Architecture changes
- Breaking changes
- New dependencies
- Security-related changes

**Level 3: Stakeholder Approval Required**
- Major architecture pivots
- Removal of supported features
- Licensing changes
- Release decisions

### Decision Documentation

All Level 2+ decisions documented in:
`/workspaces/llm-forge/.swarm/decisions/NNNN-title.md`

Format:
```markdown
# Decision NNNN: Title

## Status
Proposed | Accepted | Rejected | Deprecated

## Context
Background and problem statement

## Decision
What was decided

## Consequences
Positive and negative impacts

## Affected Components
- Component A
- Component B

## Migration Path
How to adapt to this decision
```

## Quality Gates

### Agent-Level Gates
- [ ] All tests pass (>90% coverage)
- [ ] Code follows style guide
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Examples work

### Integration-Level Gates
- [ ] Cross-agent tests pass
- [ ] No integration conflicts
- [ ] Performance benchmarks met
- [ ] Security scans pass

### Phase-Level Gates
- [ ] All phase deliverables complete
- [ ] Integration testing passed
- [ ] Documentation complete
- [ ] Examples for all features
- [ ] SwarmLead approval

## Escalation Paths

### Technical Blockers
1. Agent attempts resolution (1 day)
2. Request help from SwarmLead
3. SwarmLead coordinates solution with relevant agents
4. If unresolved, escalate to stakeholders

### Architectural Conflicts
1. Agents discuss and attempt consensus
2. If no consensus, escalate to SwarmLead
3. SwarmLead makes decision based on:
   - Architecture principles
   - Project goals
   - Technical feasibility
   - Timeline impact

### Resource Constraints
1. Agent reports constraint
2. SwarmLead evaluates priority
3. Tasks reprioritized if needed
4. Additional resources requested if critical

## Metrics & Monitoring

### Agent Performance Metrics
- Tasks completed vs. assigned
- On-time delivery rate
- Code quality (test coverage, linting)
- Review turnaround time

### Integration Health Metrics
- Integration test pass rate
- Breaking changes per week
- Time to resolve conflicts
- Cross-agent dependencies

### Project Health Metrics
- Phase completion percentage
- Critical path status
- Risk level (low/medium/high)
- Technical debt accumulation

### Reporting
- Daily: Individual agent progress
- Weekly: Integration health, blockers
- Phase end: Comprehensive review, retrospective

## Tools & Automation

### Coordination Tools
- **Task Tracking**: GitHub Projects
- **Communication**: Markdown files in `.swarm/`
- **Code Review**: GitHub PRs with agent assignments
- **CI/CD**: GitHub Actions with agent-specific workflows

### Automation
- Automatic dependency graph updates
- Integration test scheduling
- Documentation generation
- Metric collection and reporting

## Onboarding New Agents

### New Agent Checklist
1. [ ] Review ARCHITECTURE.md
2. [ ] Review BUILD_ROADMAP.md
3. [ ] Review this coordination protocol
4. [ ] Set up development environment
5. [ ] Introduce self to swarm (`.swarm/introductions/`)
6. [ ] Review assigned tasks
7. [ ] Identify integration points
8. [ ] Ask clarifying questions

### Handoff Protocol
When agent responsibilities change:
1. Document current state
2. Update task assignments
3. Transfer knowledge via detailed notes
4. Pair programming session if needed
5. SwarmLead verifies continuity

## Examples

### Example 1: TypeScript Agent Starting Work

1. **Receive Assignment**:
   - Reviews task: "Implement TypeScript code generator"
   - Checks dependencies: Template Engine must be ready
   - Posts acknowledgment

2. **Check Integration Points**:
   - Reads `core/templates/engine.ts` interface
   - Verifies canonical schema is stable
   - Reviews TypeScript naming conventions

3. **Implementation**:
   - Creates `core/generators/typescript/`
   - Implements generator
   - Writes tests (>90% coverage)
   - Creates example output

4. **Integration**:
   - Runs integration tests with schema
   - Validates generated code compiles
   - Submits PR with examples

5. **Review**:
   - SwarmLead reviews for architecture compliance
   - Template Engine agent reviews for correct API usage
   - Testing agent verifies test coverage

6. **Completion**:
   - Merges to main
   - Updates documentation
   - Notifies Build Pipeline agent that TypeScript target is ready

### Example 2: Resolving Schema Conflict

1. **Conflict Detected**:
   - Rust Agent: "Need lifetime annotations in schema"
   - Python Agent: "Canonical schema is perfect as-is"

2. **Escalation**:
   - Both agents post conflict report
   - SwarmLead reviews requirements

3. **Analysis**:
   - Lifetime annotations are Rust-specific
   - Canonical schema should stay language-agnostic
   - Metadata field can accommodate language hints

4. **Decision**:
   - Add `metadata: Record<string, unknown>` to canonical schema
   - Rust generator can use this for lifetime hints
   - Doesn't affect other languages

5. **Implementation**:
   - Schema Architect updates canonical schema
   - Rust Agent uses metadata field
   - Documentation updated
   - Decision recorded in `.swarm/decisions/`

### Example 3: Phase Transition (Phase 1 → Phase 2)

1. **Pre-Transition Review**:
   - SwarmLead checks all Phase 1 deliverables
   - Schema normalization: ✓ Complete
   - Template engine: ✓ Complete
   - CLI foundation: ✓ Complete
   - Testing infrastructure: ✓ Complete

2. **Integration Testing**:
   - All integration points validated
   - Cross-component tests pass
   - Performance benchmarks met

3. **Documentation Verification**:
   - Architecture docs updated
   - API docs generated
   - Examples run successfully

4. **Go Decision**:
   - SwarmLead approves Phase 2 start
   - TypeScript Agent assigned first implementation
   - Other language agents on standby

5. **Phase 2 Kickoff**:
   - Tasks distributed
   - Dependencies mapped
   - Daily standups continue
   - Integration points monitored

## Version Control Strategy

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/agent-name/feature-name`: Agent feature branches

### Merge Requirements
- All tests pass
- Code review approved
- Documentation updated
- No merge conflicts
- SwarmLead approval for cross-cutting changes

### Commit Messages
```
type(scope): brief description

- Detailed change 1
- Detailed change 2

Agent: agent-name
Related-Tasks: task-001, task-002
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## Conclusion

This coordination protocol ensures smooth collaboration between specialist agents while maintaining the architectural integrity of LLM-Forge. SwarmLead actively monitors these protocols and adapts them as the project evolves.

For questions or clarifications, agents should:
1. Check this documentation
2. Review architecture and roadmap docs
3. Post questions in `.swarm/questions/`
4. Escalate to SwarmLead if needed

# Unified Rich Field Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance GraphQL queries for epics, features, and requirements to return the same rich field set (custom_fields, workflow_status, assigned_to_user, and per-type extensions) currently available for initiatives via REST API.

**Architecture:** Use GraphQL fragment composition to define core fields shared across all types, with per-type query extensions. Extend TypeScript interfaces to support new fields. All responses normalize to the Record type so handlers need no changes.

**Tech Stack:** GraphQL (queries), TypeScript (types), Node.js 20+

## Global Constraints

- Node.js v20+ required
- GraphQL endpoint: `https://{domain}.aha.io/api/v1/graphql`
- REST API endpoint: `https://{domain}.aha.io/api/v1/` (initiatives only, unchanged)
- GraphQL queries use ID variables for reference numbers (not string lookups)
- All new fields are optional in the Record interface (backward compatible)
- Maintain existing MCP tool interface — no breaking changes to handleGetRecord parameters/returns

---

## File Structure

**Modified:**
- `src/types.ts` — Add CustomField, WorkflowStatus, User interfaces; extend Record; update response types
- `src/queries.ts` — Add GraphQL fragments; enhance getEpicQuery, getFeatureQuery, getRequirementQuery

**Created:**
- `tests/queries.test.ts` — Unit tests for enhanced GraphQL queries (if not exist)

**No changes:**
- `src/handlers.ts` — Already handles unified Record objects
- `src/index.ts` — Tool definitions unchanged

---

## Tasks

### Task 1: Add Core Type Definitions

**Files:**
- Modify: `src/types.ts:1-8`

**Interfaces:**
- Produces: `CustomField`, `WorkflowStatus`, `WorkflowStatusCategory`, `User` types; extended Record interface

- [ ] **Step 1: Add CustomField interface**

Insert after the existing Description interface (before the Record interface):

```typescript
export interface CustomField {
  id: string;
  key: string;
  name: string;
  type: string;
  value: any;
  updatedAt: string;
}

export interface WorkflowStatusCategory {
  id: string;
  name: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  complete: boolean;
  color: string;
  workflow_status_category?: WorkflowStatusCategory;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
```

- [ ] **Step 2: Extend Record interface to include optional rich fields**

Replace the existing Record interface (lines 5-8):

```typescript
export interface Record {
  name: string;
  description: Description;
  workflow_status?: WorkflowStatus;
  custom_fields?: CustomField[];
  created_at?: string;
  updated_at?: string;
  assigned_to_user?: User | null;
  // Allow type-specific fields
  [key: string]: any;
}
```

- [ ] **Step 3: Verify types compile**

Run: `npm run build`

Expected: No TypeScript errors

- [ ] **Step 4: Commit types**

```bash
git add src/types.ts
git commit -m "types: add rich field definitions for unified artifact support

Add CustomField, WorkflowStatus, WorkflowStatusCategory, User types.
Extend Record interface to include optional rich fields while
maintaining backward compatibility."
```

---

### Task 2: Update Response Type Interfaces

**Files:**
- Modify: `src/types.ts:22-24` (EpicResponse), similar sections for Feature/Requirement

**Interfaces:**
- Produces: Extended EpicResponse, FeatureResponse, RequirementResponse types

- [ ] **Step 1: Update EpicResponse interface**

Replace the existing EpicResponse (lines 22-24):

```typescript
export interface EpicResponse {
  epic: Record & {
    release?: {
      id: string;
      name: string;
      reference_num: string;
      start_date?: string;
      release_date?: string;
    };
    initiative?: {
      id: string;
      name: string;
      reference_num: string;
    };
    goals?: Array<{
      id: string;
      name: string;
    }>;
    master_features?: Array<{
      id: string;
      name: string;
      reference_num: string;
    }>;
  };
}
```

- [ ] **Step 2: Update FeatureResponse interface**

Replace the existing FeatureResponse (lines 10-12):

```typescript
export interface FeatureResponse {
  feature: Record & {
    release?: {
      id: string;
      name: string;
      reference_num: string;
      start_date?: string;
      release_date?: string;
    };
    epic?: {
      id: string;
      name: string;
      reference_num: string;
    };
    master_feature?: {
      id: string;
      name: string;
      reference_num: string;
    };
    original_estimate?: number;
    work_done?: number;
    requirements_count?: number;
  };
}
```

- [ ] **Step 3: Update RequirementResponse interface**

Replace the existing RequirementResponse (lines 14-16):

```typescript
export interface RequirementResponse {
  requirement: Record & {
    feature?: {
      id: string;
      name: string;
      reference_num: string;
    };
    original_estimate?: number;
    work_done?: number;
    remaining_estimate?: number;
  };
}
```

- [ ] **Step 4: Verify types compile**

Run: `npm run build`

Expected: No TypeScript errors

- [ ] **Step 5: Commit response types**

```bash
git add src/types.ts
git commit -m "types: extend response interfaces with per-type rich fields

Update EpicResponse, FeatureResponse, RequirementResponse to include
type-specific fields: release references, parent/child relationships,
estimates, and goals."
```

---

### Task 3: Add GraphQL Fragments for Common Fields

**Files:**
- Modify: `src/queries.ts:1-20` (add new content at top)

**Interfaces:**
- Produces: GraphQL query fragments as string constants

- [ ] **Step 1: Add GraphQL fragments for common fields**

Insert at the very beginning of `src/queries.ts` (before existing queries):

```typescript
export const commonFieldsFragment = `
  fragment CommonFields on Record {
    name
    description {
      markdownBody
    }
    workflow_status {
      id
      name
      complete
      color
      workflow_status_category {
        id
        name
      }
    }
    custom_fields {
      id
      key
      name
      type
      value
      updatedAt
    }
    created_at
    updated_at
    assigned_to_user {
      id
      name
      email
    }
  }
`;

export const releaseFragment = `
  fragment ReleaseInfo on Release {
    id
    name
    reference_num
    start_date
    release_date
  }
`;

export const goalFragment = `
  fragment GoalInfo on Goal {
    id
    name
  }
`;

export const referenceFragment = `
  fragment ReferenceInfo on Referenceable {
    id
    name
    reference_num
  }
`;
```

- [ ] **Step 2: Verify fragments syntax**

Run: `npm run build`

Expected: No TypeScript errors

- [ ] **Step 3: Commit fragments**

```bash
git add src/queries.ts
git commit -m "queries: add GraphQL fragments for common and per-type fields

Create reusable fragments: CommonFields, ReleaseInfo, GoalInfo,
ReferenceInfo. These reduce duplication across epic, feature,
requirement queries."
```

---

### Task 4: Enhance Epic Query

**Files:**
- Modify: `src/queries.ts:42-51` (replace getEpicQuery)

**Interfaces:**
- Consumes: GraphQL fragments from Task 3
- Produces: Enhanced getEpicQuery returning custom_fields, workflow_status, release, initiative, goals

- [ ] **Step 1: Replace getEpicQuery with enhanced version**

Replace lines 42-51:

```typescript
export const getEpicQuery = `
  query GetEpic($id: ID!) {
    epic(id: $id) {
      name
      description {
        markdownBody
      }
      workflow_status {
        id
        name
        complete
        color
        workflow_status_category {
          id
          name
        }
      }
      custom_fields {
        id
        key
        name
        type
        value
        updatedAt
      }
      created_at
      updated_at
      assigned_to_user {
        id
        name
        email
      }
      release {
        id
        name
        reference_num
        start_date
        release_date
      }
      initiative {
        id
        name
        reference_num
      }
      goals {
        id
        name
      }
      master_features(limit: 10) {
        id
        name
        reference_num
      }
    }
  }
`;
```

- [ ] **Step 2: Verify query syntax**

Run: `npm run build`

Expected: No TypeScript errors

- [ ] **Step 3: Test query manually (optional at this stage)**

Run: `npm run mcp-start` and call get_record with an epic reference like "PBS-E-50"

Expected: Response includes custom_fields, workflow_status, assigned_to_user, etc.

- [ ] **Step 4: Commit epic query**

```bash
git add src/queries.ts
git commit -m "queries: enhance epic GraphQL query with rich fields

Add workflow_status, custom_fields, assigned_to_user, release,
initiative, goals, master_features to epic query. Enables unified
field extraction for epics matching initiative/feature capabilities."
```

---

### Task 5: Enhance Feature Query

**Files:**
- Modify: `src/queries.ts:20-29` (replace getFeatureQuery)

**Interfaces:**
- Consumes: GraphQL fragments from Task 3
- Produces: Enhanced getFeatureQuery returning custom_fields, workflow_status, release, epic, estimates

- [ ] **Step 1: Replace getFeatureQuery with enhanced version**

Replace lines 20-29:

```typescript
export const getFeatureQuery = `
  query GetFeature($id: ID!) {
    feature(id: $id) {
      name
      description {
        markdownBody
      }
      workflow_status {
        id
        name
        complete
        color
        workflow_status_category {
          id
          name
        }
      }
      custom_fields {
        id
        key
        name
        type
        value
        updatedAt
      }
      created_at
      updated_at
      assigned_to_user {
        id
        name
        email
      }
      release {
        id
        name
        reference_num
        start_date
        release_date
      }
      epic {
        id
        name
        reference_num
      }
      master_feature {
        id
        name
        reference_num
      }
      original_estimate
      work_done
      requirements {
        id
        name
        reference_num
      }
    }
  }
`;
```

- [ ] **Step 2: Verify query syntax**

Run: `npm run build`

Expected: No TypeScript errors

- [ ] **Step 3: Test query manually (optional at this stage)**

Run: `npm run mcp-start` and call get_record with a feature reference like "PBS-1"

Expected: Response includes custom_fields, workflow_status, epic reference, etc.

- [ ] **Step 4: Commit feature query**

```bash
git add src/queries.ts
git commit -m "queries: enhance feature GraphQL query with rich fields

Add workflow_status, custom_fields, assigned_to_user, release, epic,
master_feature, estimates, and requirements to feature query."
```

---

### Task 6: Enhance Requirement Query

**Files:**
- Modify: `src/queries.ts:31-40` (replace getRequirementQuery)

**Interfaces:**
- Consumes: GraphQL fragments from Task 3
- Produces: Enhanced getRequirementQuery returning custom_fields, workflow_status, feature, estimates

- [ ] **Step 1: Replace getRequirementQuery with enhanced version**

Replace lines 31-40:

```typescript
export const getRequirementQuery = `
  query GetRequirement($id: ID!) {
    requirement(id: $id) {
      name
      description {
        markdownBody
      }
      workflow_status {
        id
        name
        complete
        color
        workflow_status_category {
          id
          name
        }
      }
      custom_fields {
        id
        key
        name
        type
        value
        updatedAt
      }
      created_at
      updated_at
      assigned_to_user {
        id
        name
        email
      }
      feature {
        id
        name
        reference_num
      }
      original_estimate
      work_done
      remaining_estimate
    }
  }
`;
```

- [ ] **Step 2: Verify query syntax**

Run: `npm run build`

Expected: No TypeScript errors

- [ ] **Step 3: Test query manually (optional at this stage)**

Run: `npm run mcp-start` and call get_record with a requirement reference like "PBS-1-1"

Expected: Response includes custom_fields, workflow_status, feature reference, etc.

- [ ] **Step 4: Commit requirement query**

```bash
git add src/queries.ts
git commit -m "queries: enhance requirement GraphQL query with rich fields

Add workflow_status, custom_fields, assigned_to_user, feature, and
estimates to requirement query."
```

---

### Task 7: Verify Handlers Work Unchanged

**Files:**
- Read: `src/handlers.ts` (no changes needed)

**Interfaces:**
- Consumes: Enhanced Record type from Task 1
- Produces: Confirmation that handlers work with unified responses

- [ ] **Step 1: Review handleGetRecord implementation**

Read `src/handlers.ts:56-129` to confirm it handles all artifact types uniformly.

Expected: The handler uses `JSON.stringify(result)` to return responses, so it automatically works with any Record shape.

- [ ] **Step 2: Verify no handler changes needed**

Confirm:
- Line 76: `data.feature` returns enhanced Record ✓
- Line 82: `data.requirement` returns enhanced Record ✓
- Line 89: `data.epic` returns enhanced Record ✓
- All are passed through JSON.stringify at line 112 ✓

- [ ] **Step 3: Document confirmation**

Add a comment in handlers.ts to clarify this (optional):

At the top of handleGetRecord, add:

```typescript
// Handlers receive unified Record objects from enhanced GraphQL queries.
// All types (epic, feature, requirement) now return consistent rich fields:
// workflow_status, custom_fields, assigned_to_user, and per-type extensions.
// Initiative uses REST API and maps to the same Record interface.
```

- [ ] **Step 4: Run build to verify**

Run: `npm run build`

Expected: No errors

- [ ] **Step 5: Commit handler documentation (if added)**

```bash
git add src/handlers.ts
git commit -m "docs: clarify handler support for unified rich fields

Add comment explaining that handlers work unchanged with enhanced
Record objects from GraphQL and REST APIs."
```

---

### Task 8: Manual Integration Test

**Files:**
- No files modified; uses existing MCP server

**Interfaces:**
- Consumes: Enhanced queries from Tasks 4-6, enhanced types from Tasks 1-2
- Produces: Confirmation that all artifact types return rich fields

- [ ] **Step 1: Build and start MCP server**

Run:
```bash
npm run build
npm run mcp-start
```

Expected: Server starts without errors

- [ ] **Step 2: Test epic retrieval with rich fields**

From another terminal, call the MCP tool:

```json
{
  "reference": "PBS-E-50"
}
```

(Use your Claude session with the MCP server to call `get_record`)

Expected response includes:
- `workflow_status` with id, name, complete, color, workflow_status_category
- `custom_fields` array
- `assigned_to_user` (if assigned)
- `release`, `initiative`, `goals`, `master_features`

- [ ] **Step 3: Test feature retrieval with rich fields**

Call with reference "PBS-1"

Expected response includes:
- `workflow_status`, `custom_fields`, `assigned_to_user`
- `release`, `epic`, `master_feature`
- `original_estimate`, `work_done`
- `requirements` array

- [ ] **Step 4: Test requirement retrieval with rich fields**

Call with reference "PBS-1-1"

Expected response includes:
- `workflow_status`, `custom_fields`, `assigned_to_user`
- `feature` reference
- `original_estimate`, `work_done`, `remaining_estimate`

- [ ] **Step 5: Compare with initiative to verify consistency**

Call with reference "PBS-S-1" (initiative, still uses REST API)

Expected: Response structure matches epic/feature/requirement for common fields (workflow_status, custom_fields, etc.), though some fields differ per type

- [ ] **Step 6: Test edge cases (optional)**

- Call with a reference that has null values (e.g., unassigned, no goals) → should return null/empty gracefully
- Call with invalid reference → should return appropriate error

- [ ] **Step 7: Stop MCP server**

Ctrl+C or kill the process

---

### Task 9: Write/Update Unit Tests

**Files:**
- Create/Modify: `tests/queries.test.ts` (if not exists, create; if exists, extend)

**Interfaces:**
- Consumes: Enhanced queries from src/queries.ts
- Produces: Test suite verifying query fields are present and non-null

- [ ] **Step 1: Check if test file exists**

Run: `ls -la tests/`

If `queries.test.ts` exists, open it. Otherwise, create it.

- [ ] **Step 2: Add or extend tests for enhanced epic query**

Add/update test in `tests/queries.test.ts`:

```typescript
describe("Enhanced Epic Query", () => {
  it("should include rich fields in epic response", async () => {
    const query = getEpicQuery;
    
    // Verify the query string contains expected fields
    expect(query).toContain("workflow_status");
    expect(query).toContain("custom_fields");
    expect(query).toContain("assigned_to_user");
    expect(query).toContain("release");
    expect(query).toContain("initiative");
    expect(query).toContain("goals");
    expect(query).toContain("master_features");
  });

  it("should have valid GraphQL syntax for epic query", () => {
    const query = getEpicQuery;
    
    // Basic syntax checks (more sophisticated validation with GraphQL parser optional)
    expect(query).toContain("query GetEpic");
    expect(query).toContain("$id: ID!");
    expect(query).toMatch(/\{[\s\S]*epic[\s\S]*\{[\s\S]*\}\s*\}/);
  });
});

describe("Enhanced Feature Query", () => {
  it("should include rich fields in feature response", async () => {
    const query = getFeatureQuery;
    
    expect(query).toContain("workflow_status");
    expect(query).toContain("custom_fields");
    expect(query).toContain("assigned_to_user");
    expect(query).toContain("release");
    expect(query).toContain("epic");
    expect(query).toContain("original_estimate");
    expect(query).toContain("work_done");
  });
});

describe("Enhanced Requirement Query", () => {
  it("should include rich fields in requirement response", async () => {
    const query = getRequirementQuery;
    
    expect(query).toContain("workflow_status");
    expect(query).toContain("custom_fields");
    expect(query).toContain("assigned_to_user");
    expect(query).toContain("feature");
    expect(query).toContain("remaining_estimate");
  });
});

describe("Type Interfaces", () => {
  it("should allow Record to have optional rich fields", () => {
    // TypeScript compile-time check; this is verified via npm run build
    const record: Record = {
      name: "Test",
      description: { htmlBody: "<p>Test</p>" },
      workflow_status: {
        id: "123",
        name: "In Progress",
        complete: false,
        color: "#fff",
      },
      custom_fields: [],
      assigned_to_user: null,
    };
    
    expect(record.name).toBe("Test");
    expect(record.workflow_status?.name).toBe("In Progress");
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: All tests pass

- [ ] **Step 4: Commit test file**

```bash
git add tests/queries.test.ts
git commit -m "test: verify enhanced queries include rich fields

Add unit tests for epic, feature, requirement queries to confirm
they include workflow_status, custom_fields, assigned_to_user,
and per-type extensions."
```

---

### Task 10: Final Verification and Documentation

**Files:**
- Review: `README.md`, `docs/superpowers/specs/2026-08-04-unified-artifact-fields-design.md`
- No changes to code files

**Interfaces:**
- Consumes: All prior tasks
- Produces: Confirmation that implementation matches spec

- [ ] **Step 1: Review spec coverage**

Check the spec against implementation:

- ✓ Core Fields (all types): workflow_status, custom_fields, assigned_to_user, created_at, updated_at, description
- ✓ Epic Extensions: release, initiative, goals, master_features
- ✓ Feature Extensions: release, epic, master_feature, estimates, requirements
- ✓ Requirement Extensions: feature, estimates
- ✓ Initiative: Unchanged (REST API)
- ✓ Response Normalization: All types use Record interface
- ✓ Handler Compatibility: handleGetRecord unchanged

- [ ] **Step 2: Verify all tasks completed**

Checklist:
- [ ] Types defined (CustomField, WorkflowStatus, User)
- [ ] Record interface extended with optional rich fields
- [ ] Response interfaces updated
- [ ] Fragments added
- [ ] getEpicQuery enhanced
- [ ] getFeatureQuery enhanced
- [ ] getRequirementQuery enhanced
- [ ] Handlers verified unchanged
- [ ] Manual integration tests passed
- [ ] Unit tests written and passing

- [ ] **Step 3: Check for loose ends**

Run: `npm run build && npm test`

Expected: No errors or failures

- [ ] **Step 4: Verify git history**

Run: `git log --oneline -10`

Expected: ~8 commits related to this work (fragments, types, queries, tests, handlers doc)

- [ ] **Step 5: Create summary comment**

Add a comment at the top of src/queries.ts documenting the change:

```typescript
/**
 * Enhanced GraphQL Queries for Aha Artifacts
 * 
 * This module provides unified, rich field extraction across all artifact types:
 * - Epic, Feature, Requirement: Enhanced GraphQL queries with custom_fields, workflow_status, assigned_to_user, and per-type extensions
 * - Initiative: Uses REST API (unchanged) with automatic mapping to Record interface
 * 
 * All types now return consistent fields enabling unified handling in handlers.ts
 */
```

- [ ] **Step 6: Final build and test run**

Run:
```bash
npm run build
npm test
```

Expected: All pass without errors or warnings

- [ ] **Step 7: Final commit summarizing the feature**

```bash
git add src/queries.ts
git commit -m "feat: unified rich field extraction for all aha artifacts

Complete implementation of unified field extraction across initiatives,
epics, features, requirements. All types now return consistent rich
fields: workflow_status, custom_fields, assigned_to_user, plus
per-type extensions (release, goals, estimates, etc.).

- Enhanced GraphQL queries for epics, features, requirements
- Extended TypeScript interfaces for rich field support  
- Verified handlers work unchanged with unified responses
- Added unit tests for enhanced queries
- Backward compatible: new fields are optional"
```

- [ ] **Step 8: Verify README accuracy**

Check that `README.md:151-181` (get_record tool documentation) accurately reflects the enhanced response structure.

If needed, update with example showing custom_fields, workflow_status, etc.:

```markdown
### Example Response with Rich Fields

Epic (PBS-E-50):
{
  "name": "Charts - PRO [P2]",
  "reference_num": "PBS-E-50",
  "workflow_status": {
    "name": "Ready for review",
    "id": "7477958989132067337"
  },
  "custom_fields": [
    {
      "key": "pi",
      "name": "Quarter (Epic)",
      "value": "2022-Q2"
    }
  ],
  "assigned_to_user": {
    "name": "Matthew Glowacki",
    "email": "matthew.glowacki@statsperform.com"
  },
  "release": {
    "name": "OS-2026-Q4",
    "reference_num": "PBS-R-31"
  },
  "initiative": {
    "name": "Opta Search: ProVision Replacement",
    "reference_num": "PBS-S-1"
  }
}
```

- [ ] **Step 9: Final README commit (if updated)**

```bash
git add README.md
git commit -m "docs: update get_record examples with rich field response

Show example epic response including workflow_status, custom_fields,
assigned_to_user, release, and initiative fields from enhanced queries."
```

---

## Success Criteria

- [ ] All artifact types (epic, feature, requirement, initiative) return `workflow_status`, `custom_fields`, `assigned_to_user`
- [ ] Type-specific relationships are populated (epic→release/initiative/goals, feature→epic/release, requirement→feature)
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm test` passes all tests
- [ ] Manual MCP testing confirms rich fields in get_record responses
- [ ] No breaking changes to the MCP interface
- [ ] Code is committed with clear, atomic commits

---

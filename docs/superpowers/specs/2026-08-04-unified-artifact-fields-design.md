# Unified Rich Field Extraction for Aha Artifacts

**Date:** 2026-08-04  
**Objective:** Standardize field extraction across all Aha artifact types (initiatives, epics, features, requirements) so they all return a consistent, rich field set.

## Current State

- **Initiatives:** Fetched via REST API, returns full object with status, dates, workflow_state, custom_fields array, goals, etc.
- **Epics, Features, Requirements:** Fetched via minimal GraphQL queries returning only name and description.markdownBody
- **Problem:** Epics/Features are missing the rich field set available in the REST API, including custom_fields, workflow_status, assigned_to_user, and type-specific relationships

## Design

### Architecture: Unified GraphQL Query Pattern

**Transport Strategy:**
- Keep initiatives on REST API (already provides complete data, no change needed)
- Migrate epics, features, requirements to enhanced GraphQL queries
- Use consistent response shape so consumers don't need to know which API served the data

**Pattern:**
Use GraphQL fragment composition to define core fields shared across all types, plus type-specific extensions. This reduces duplication and makes fields easy to add/remove.

### Core Fields (All Types)

All artifact types return these fields:

```
name: String
description: { markdownBody: String }
workflow_status: { 
  id: ID
  name: String
  complete: Boolean
  color: String
  workflow_status_category: { id: ID, name: String }
}
custom_fields: [
  {
    id: ID
    key: String
    name: String
    type: String
    value: Any
    updatedAt: String
  }
]
created_at: String
updated_at: String
assigned_to_user: {
  id: ID
  name: String
  email: String
}
```

### Per-Type Extensions

**Epic:**
- `workflow_status` ✓ (from core)
- `release` (reference: id, name, reference_num, start_date, release_date)
- `initiative` (parent reference: id, name, reference_num)
- `goals` (array of goal references)
- `master_features` (count or limited array)

**Feature:**
- `workflow_status` ✓ (from core)
- `release` (reference)
- `epic` (parent reference: id, name, reference_num)
- `master_feature` (reference if exists)
- `requirements_count` (scalar)
- `original_estimate`, `work_done` (numeric fields)

**Requirement:**
- `workflow_status` ✓ (from core)
- `feature` (parent reference)
- `original_estimate`, `work_done`, `remaining_estimate` (numeric)

**Initiative:**
- No change (REST API already returns complete data)
- Response structure mapped to match Record interface

### Response Normalization

All types conform to the Record interface:

```typescript
interface Record {
  name: string
  description: { htmlBody: string }
  workflow_status?: WorkflowStatus
  custom_fields?: CustomField[]
  created_at?: string
  updated_at?: string
  assigned_to_user?: User
  // Type-specific fields (optional, added by each type)
  [key: string]: any
}
```

The `handleGetRecord` handler remains unchanged — it receives unified responses regardless of transport.

## Implementation Strategy

### 1. GraphQL Queries (queries.ts)

Define three enhanced queries using fragments:

**Fragment: CommonFields**
- name, description.markdownBody, workflow_status (full structure), custom_fields, created_at, updated_at, assigned_to_user

**getEpicQuery**
- CommonFields
- release { id, name, reference_num, start_date, release_date }
- initiative { id, name, reference_num }
- goals { id, name }
- master_features { id, name, reference_num } (limited to 5–10 for perf)

**getFeatureQuery**
- CommonFields
- release { id, name, reference_num, start_date, release_date }
- epic { id, name, reference_num }
- master_feature { id, name, reference_num }
- requirements { id, name, reference_num } (count only or limited array)
- original_estimate, work_done

**getRequirementQuery**
- CommonFields
- feature { id, name, reference_num }
- original_estimate, work_done, remaining_estimate

### 2. Type Definitions (types.ts)

Add helper types:

```typescript
interface CustomField {
  id: string
  key: string
  name: string
  type: string
  value: any
  updatedAt: string
}

interface WorkflowStatus {
  id: string
  name: string
  complete: boolean
  color: string
  workflow_status_category?: { id: string; name: string }
}

interface User {
  id: string
  name: string
  email: string
}

// Extend Record interface to include optional rich fields
interface Record {
  name: string
  description: Description
  workflow_status?: WorkflowStatus
  custom_fields?: CustomField[]
  created_at?: string
  updated_at?: string
  assigned_to_user?: User | null
  // Type-specific fields allowed
  [key: string]: any
}
```

Extend response types:

```typescript
interface EpicResponse {
  epic: Record & {
    release?: { id: string; name: string; reference_num: string }
    initiative?: { id: string; name: string; reference_num: string }
    goals?: Array<{ id: string; name: string }>
    master_features?: Array<{ id: string; name: string; reference_num: string }>
  }
}

// Similar for FeatureResponse, RequirementResponse
```

### 3. Handlers (handlers.ts)

No changes needed. The handler already returns responses uniformly via JSON.stringify, so it works with richer Record objects automatically.

### 4. Testing

Verify:
- Epic query returns custom_fields, workflow_status, assigned_to_user
- Feature query returns release, requirements_count, epic reference
- Requirement query returns feature reference and estimate fields
- Nested objects (workflow_status_category, assigned_to_user) resolve correctly
- Null/missing fields handled gracefully

## Future Extensions

The fragment-based structure makes it easy to:
- Add new fields per type (extend the type-specific query)
- Add new types (define new fragment + query)
- Deprecate fields (remove from fragment)

Example: If requirements later need goal references, add them to the getRequirementQuery without touching other queries.

## Success Criteria

- [ ] All artifact types return custom_fields array
- [ ] All artifact types return workflow_status with nested category
- [ ] All artifact types return assigned_to_user
- [ ] Type-specific relationships (epic→feature, feature→requirement, etc.) are populated
- [ ] Existing code paths (handleGetRecord, test cases) work unchanged
- [ ] No breaking changes to the MCP interface

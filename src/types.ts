export interface Description {
  htmlBody: string;
}

export interface FieldDefinition {
  key: string;
  name: string;
  valueType: string;
}

export interface CustomField {
  id: string;
  fieldDefinition: FieldDefinition;
  value: any;
}

export interface WorkflowStatusCategory {
  id: string;
  name: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  color: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

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

export interface InitiativeResponse {
  initiative: Record;
}

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

export interface PageResponse {
  page: {
    name: string;
    description: Description;
    children: Array<{
      name: string;
      referenceNum: string;
    }>;
    parent?: {
      name: string;
      referenceNum: string;
    };
  };
}

// Regular expressions for validating reference numbers
export const FEATURE_REF_REGEX = /^([A-Z][A-Z0-9]*)-(\d+)$/;
export const REQUIREMENT_REF_REGEX = /^([A-Z][A-Z0-9]*)-(\d+)-(\d+)$/;
export const INITIATIVE_REF_REGEX = /^([A-Z][A-Z0-9]*)-S-(\d+)$/;
export const EPIC_REF_REGEX = /^([A-Z][A-Z0-9]*)-E-(\d+)$/;
export const NOTE_REF_REGEX = /^([A-Z][A-Z0-9]*)-N-(\d+)$/;

export interface SearchNode {
  name: string | null;
  url: string;
  searchableId: string;
  searchableType: string;
}

export interface SearchResponse {
  searchDocuments: {
    nodes: SearchNode[];
    currentPage: number;
    totalCount: number;
    totalPages: number;
    isLastPage: boolean;
  };
}

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

export const getPageQuery = `
  query GetPage($id: ID!, $includeParent: Boolean!) {
    page(id: $id) {
      name
      description {
        markdownBody
      }
      children {
        name
        referenceNum
      }
      parent @include(if: $includeParent) {
        name
        referenceNum
      }
    }
  }
`;

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

export const searchDocumentsQuery = `
  query SearchDocuments($query: String!, $searchableType: [String!]!) {
    searchDocuments(filters: {query: $query, searchableType: $searchableType}) {
      nodes {
        name
        url
        searchableId
        searchableType
      }
      currentPage
      totalCount
      totalPages
      isLastPage
    }
  }
`;

export const commonFieldsFragment = `
  fragment CommonFields on Record {
    id
    name
    description {
      markdownBody
    }
    workflowStatus {
      id
      name
      color
    }
    customFieldValues {
      id
      value
    }
    createdAt
    updatedAt
    assignedToUser {
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
      id
      name
      description {
        markdownBody
      }
      workflowStatus {
        id
        name
        color
      }
      customFieldValues {
        id
        value
      }
      createdAt
      updatedAt
      assignedToUser {
        id
        name
        email
      }
      release {
        id
        name
        referenceNum
      }
      epic {
        id
        name
        referenceNum
      }
      requirements {
        id
        name
        referenceNum
      }
      integrationFields {
        id
        name
        value
        serviceName
      }
    }
  }
`;

export const getRequirementQuery = `
  query GetRequirement($id: ID!) {
    requirement(id: $id) {
      id
      name
      description {
        markdownBody
      }
      workflowStatus {
        id
        name
        color
      }
      customFieldValues {
        id
        value
      }
      createdAt
      updatedAt
      assignedToUser {
        id
        name
        email
      }
      feature {
        id
        name
        referenceNum
      }
      integrationFields {
        id
        name
        value
        serviceName
      }
    }
  }
`;

export const getEpicQuery = `
  query GetEpic($id: ID!) {
    epic(id: $id) {
      id
      name
      description {
        markdownBody
      }
      workflowStatus {
        id
        name
        color
      }
      customFieldValues {
        id
        value
      }
      createdAt
      updatedAt
      assignedToUser {
        id
        name
        email
      }
      release {
        id
        name
        referenceNum
      }
      initiative {
        id
        name
        referenceNum
      }
      goals {
        id
        name
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

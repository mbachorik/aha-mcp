import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "graphql-request";
import {
  FEATURE_REF_REGEX,
  REQUIREMENT_REF_REGEX,
  INITIATIVE_REF_REGEX,
  EPIC_REF_REGEX,
  NOTE_REF_REGEX,
  Record,
  FeatureResponse,
  RequirementResponse,
  InitiativeResponse,
  EpicResponse,
  PageResponse,
  SearchResponse,
} from "./types.js";
import {
  getFeatureQuery,
  getRequirementQuery,
  getEpicQuery,
  getPageQuery,
  searchDocumentsQuery,
} from "./queries.js";
import {
  compactListReport,
  compactPivotReport,
  fetchWithRetry,
  LIST_PAGE_SIZE,
  ListReportResponse,
  MAX_LIST_PAGES,
  parseReportId,
  PivotReportResponse,
  PivotView,
} from "./pivots.js";

export class Handlers {
  constructor(
    private client: GraphQLClient,
    private restApiBaseUrl: string,
    private authToken: string
  ) {}

  private async getInitiative(reference: string): Promise<Record | undefined> {
    const response = await fetch(
      `${this.restApiBaseUrl}/initiatives/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`REST ${response.status}: ${body}`);
    }

    const data = (await response.json()) as InitiativeResponse;
    return data.initiative;
  }

  private async getEpic(reference: string): Promise<Record | undefined> {
    const response = await fetch(
      `${this.restApiBaseUrl}/epics/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 404) {
      return undefined;
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`REST ${response.status}: ${body}`);
    }

    const data = (await response.json()) as any;
    const epic = data.epic;

    // Normalize REST API response to match Record interface
    return {
      name: epic.name,
      description: { htmlBody: epic.description?.body || "" },
      workflowStatus: epic.workflow_status ? {
        id: epic.workflow_status.id,
        name: epic.workflow_status.name,
        color: typeof epic.workflow_status.color === 'string'
          ? parseInt(epic.workflow_status.color, 16)
          : epic.workflow_status.color || 0,
      } : undefined,
      customFieldValues: epic.custom_fields || [],
      createdAt: epic.created_at,
      updatedAt: epic.updated_at,
      assignedToUser: epic.assigned_to_user,
      // Include additional fields for reference
      release: epic.release,
      initiative: epic.initiative,
      goals: epic.goals,
      ...epic, // Spread all other fields
    };
  }

  async handleGetRecord(request: any) {
    // Handlers receive unified Record objects from enhanced GraphQL queries.
    // All types (epic, feature, requirement) now return consistent rich fields:
    // workflowStatus, customFieldValues, assignedToUser, and per-type extensions.
    // Initiative uses REST API and maps to the same Record interface.
    const { reference } = request.params.arguments as { reference: string };

    if (!reference) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Reference number is required"
      );
    }

    try {
      let result: Record | undefined;

      if (FEATURE_REF_REGEX.test(reference)) {
        const data = await this.client.request<FeatureResponse>(
          getFeatureQuery,
          {
            id: reference,
          }
        );
        result = data.feature;
      } else if (REQUIREMENT_REF_REGEX.test(reference)) {
        const data = await this.client.request<RequirementResponse>(
          getRequirementQuery,
          { id: reference }
        );
        result = data.requirement;
      } else if (INITIATIVE_REF_REGEX.test(reference)) {
        result = await this.getInitiative(reference);
      } else if (EPIC_REF_REGEX.test(reference)) {
        result = await this.getEpic(reference);
      } else {
        throw new McpError(
          ErrorCode.InvalidParams,
          "Invalid reference number format. Expected DEVELOP-123, ADT-123-1, ABC-S-123, or ABC-E-123"
        );
      }

      if (!result) {
        return {
          content: [
            {
              type: "text",
              text: `No record found for reference ${reference}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("API Error:", errorMessage);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch record: ${errorMessage}`
      );
    }
  }

  async handleGetPage(request: any) {
    const { reference, includeParent = false } = request.params.arguments as {
      reference: string;
      includeParent?: boolean;
    };

    if (!reference) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Reference number is required"
      );
    }

    if (!NOTE_REF_REGEX.test(reference)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "Invalid reference number format. Expected ABC-N-213"
      );
    }

    try {
      const data = await this.client.request<PageResponse>(getPageQuery, {
        id: reference,
        includeParent,
      });

      if (!data.page) {
        return {
          content: [
            {
              type: "text",
              text: `No page found for reference ${reference}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data.page, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("API Error:", errorMessage);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch page: ${errorMessage}`
      );
    }
  }

  async handleSearchDocuments(request: any) {
    const { query, searchableType = "Page" } = request.params.arguments as {
      query: string;
      searchableType?: string;
    };

    if (!query) {
      throw new McpError(ErrorCode.InvalidParams, "Search query is required");
    }

    try {
      const data = await this.client.request<SearchResponse>(
        searchDocumentsQuery,
        {
          query,
          searchableType: [searchableType],
        }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data.searchDocuments, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("API Error:", errorMessage);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to search documents: ${errorMessage}`
      );
    }
  }

  private async fetchPivotPage(
    reportId: string,
    params: URLSearchParams
  ): Promise<any> {
    const response = await fetchWithRetry(
      `${this.restApiBaseUrl}/bookmarks/custom_pivots/${reportId}?${params}`,
      {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          Accept: "application/json",
        },
      }
    );

    if (response.status === 404) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Custom pivot ${reportId} not found or not accessible with this token`
      );
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`REST ${response.status}: ${body.slice(0, 500)}`);
    }

    return response.json();
  }

  async handleGetCustomPivot(request: any) {
    const {
      report,
      view = "list",
      raw = false,
    } = request.params.arguments as {
      report: string;
      view?: PivotView;
      raw?: boolean;
    };

    const reportId = report ? parseReportId(report) : undefined;
    if (!reportId) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "report must be a numeric report ID or an Aha! /bookmarks/custom_pivots/... URL"
      );
    }
    if (view !== "list" && view !== "pivot") {
      throw new McpError(ErrorCode.InvalidParams, 'view must be "list" or "pivot"');
    }

    try {
      let result: unknown;

      if (view === "pivot") {
        const data = (await this.fetchPivotPage(
          reportId,
          new URLSearchParams({ view: "pivot" })
        )) as PivotReportResponse;
        result = raw ? data : compactPivotReport(data);
      } else {
        const pages: ListReportResponse[] = [];
        let totalPages = 1;
        for (let page = 1; page <= Math.min(totalPages, MAX_LIST_PAGES); page++) {
          const data = (await this.fetchPivotPage(
            reportId,
            new URLSearchParams({
              view: "list",
              page: String(page),
              per_page: String(LIST_PAGE_SIZE),
            })
          )) as ListReportResponse;
          pages.push(data);
          totalPages = data.pagination?.[0]?.total_pages ?? 1;
        }
        const truncated = totalPages > MAX_LIST_PAGES;
        result = raw
          ? { pages, truncated }
          : { ...compactListReport(pages), truncated };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      if (error instanceof McpError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("API Error:", errorMessage);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to fetch custom pivot: ${errorMessage}`
      );
    }
  }
}

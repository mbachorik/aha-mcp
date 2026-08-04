import { getEpicQuery, getFeatureQuery, getRequirementQuery, } from "../src/queries";
describe("Enhanced Epic Query", () => {
    it("should include rich fields in epic response", () => {
        const query = getEpicQuery;
        // Verify the query string contains expected core rich fields
        expect(query).toContain("workflowStatus");
        expect(query).toContain("customFieldValues");
        expect(query).toContain("assignedToUser");
        // Verify per-type extensions
        expect(query).toContain("release");
        expect(query).toContain("initiative");
        expect(query).toContain("goals");
    });
    it("should have valid GraphQL syntax for epic query", () => {
        const query = getEpicQuery;
        expect(query).toContain("query GetEpic");
        expect(query).toContain("$id: ID!");
        expect(query).toMatch(/\{[\s\S]*epic[\s\S]*\{[\s\S]*\}\s*\}/);
    });
    it("should use camelCase for field names", () => {
        const query = getEpicQuery;
        // Verify camelCase field names
        expect(query).toContain("workflowStatus");
        expect(query).not.toContain("workflow_status");
        expect(query).toContain("customFieldValues");
        expect(query).not.toContain("custom_fields");
        expect(query).toContain("assignedToUser");
        expect(query).not.toContain("assigned_to_user");
    });
});
describe("Enhanced Feature Query", () => {
    it("should include rich fields in feature response", () => {
        const query = getFeatureQuery;
        // Verify the query string contains expected core rich fields
        expect(query).toContain("workflowStatus");
        expect(query).toContain("customFieldValues");
        expect(query).toContain("assignedToUser");
        // Verify per-type extensions
        expect(query).toContain("release");
        expect(query).toContain("epic");
    });
    it("should have valid GraphQL syntax for feature query", () => {
        const query = getFeatureQuery;
        expect(query).toContain("query GetFeature");
        expect(query).toContain("$id: ID!");
        expect(query).toMatch(/\{[\s\S]*feature[\s\S]*\{[\s\S]*\}\s*\}/);
    });
    it("should use camelCase for field names", () => {
        const query = getFeatureQuery;
        // Verify camelCase field names
        expect(query).toContain("workflowStatus");
        expect(query).not.toContain("workflow_status");
        expect(query).toContain("customFieldValues");
        expect(query).not.toContain("custom_fields");
        expect(query).toContain("assignedToUser");
        expect(query).not.toContain("assigned_to_user");
    });
});
describe("Enhanced Requirement Query", () => {
    it("should include rich fields in requirement response", () => {
        const query = getRequirementQuery;
        // Verify the query string contains expected core rich fields
        expect(query).toContain("workflowStatus");
        expect(query).toContain("customFieldValues");
        expect(query).toContain("assignedToUser");
        // Verify per-type extensions
        expect(query).toContain("feature");
    });
    it("should have valid GraphQL syntax for requirement query", () => {
        const query = getRequirementQuery;
        expect(query).toContain("query GetRequirement");
        expect(query).toContain("$id: ID!");
        expect(query).toMatch(/\{[\s\S]*requirement[\s\S]*\{[\s\S]*\}\s*\}/);
    });
    it("should use camelCase for field names", () => {
        const query = getRequirementQuery;
        // Verify camelCase field names
        expect(query).toContain("workflowStatus");
        expect(query).not.toContain("workflow_status");
        expect(query).toContain("customFieldValues");
        expect(query).not.toContain("custom_fields");
        expect(query).toContain("assignedToUser");
        expect(query).not.toContain("assigned_to_user");
    });
});

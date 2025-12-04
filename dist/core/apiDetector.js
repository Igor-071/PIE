import { promises as fs } from "fs";
import path from "path";
/**
 * Enhanced API endpoint detection that finds both route files and API calls in code
 * @param repoPath - Path to the repository root directory
 * @param allFiles - List of all files in the repository
 * @returns Promise resolving to array of API endpoints
 */
export async function detectApiEndpoints(repoPath, allFiles) {
    const endpoints = [];
    const seenEndpoints = new Set();
    // Scan relevant files for API calls
    const relevantFiles = allFiles.filter((f) => (f.endsWith(".ts") ||
        f.endsWith(".tsx") ||
        f.endsWith(".js") ||
        f.endsWith(".jsx")) &&
        !f.includes("/node_modules/") &&
        !f.includes("/dist/") &&
        !f.includes("/build/"));
    for (const file of relevantFiles) {
        try {
            const filePath = path.join(repoPath, file);
            const content = await fs.readFile(filePath, "utf-8");
            // Extract API calls from code
            const apiCalls = extractApiCalls(content, file);
            for (const call of apiCalls) {
                const key = `${call.method}:${call.endpoint}`;
                if (!seenEndpoints.has(key)) {
                    seenEndpoints.add(key);
                    endpoints.push(call);
                }
            }
        }
        catch (error) {
            // Skip files that can't be read
            continue;
        }
    }
    return endpoints;
}
/**
 * Extracts API calls from code content
 */
function extractApiCalls(content, filePath) {
    const endpoints = [];
    // Pattern 1: fetch() calls
    // fetch('/api/users', { method: 'POST' })
    // fetch(`/api/users/${id}`)
    const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{[^}]*method:\s*['"`](\w+)['"`])?/gi;
    let match;
    while ((match = fetchPattern.exec(content)) !== null) {
        const endpoint = match[1];
        const method = match[2] ? match[2].toUpperCase() : "GET";
        // Only include paths that look like API routes
        if (endpoint.startsWith("/api/") || endpoint.startsWith("/")) {
            const cleanEndpoint = endpoint.replace(/\$\{[^}]+\}/g, ":param");
            endpoints.push({
                name: cleanEndpoint,
                endpoint: cleanEndpoint,
                method,
                handler: filePath,
                framework: detectFramework(filePath),
            });
        }
    }
    // Pattern 2: axios calls
    // axios.get('/api/users')
    // axios.post('/api/users', data)
    const axiosPattern = /axios\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = axiosPattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const endpoint = match[2];
        if (endpoint.startsWith("/api/") || endpoint.startsWith("/")) {
            const cleanEndpoint = endpoint.replace(/\$\{[^}]+\}/g, ":param");
            endpoints.push({
                name: cleanEndpoint,
                endpoint: cleanEndpoint,
                method,
                handler: filePath,
                framework: detectFramework(filePath),
            });
        }
    }
    // Pattern 3: useQuery/useMutation (React Query/TanStack Query)
    // useQuery(['users'], () => fetch('/api/users'))
    // useMutation((data) => axios.post('/api/users', data))
    const useQueryPattern = /use(?:Query|Mutation)\s*\([^)]*['"`]([^'"`]+)['"`]/gi;
    while ((match = useQueryPattern.exec(content)) !== null) {
        const endpoint = match[1];
        if (endpoint.startsWith("/api/") || endpoint.startsWith("/")) {
            endpoints.push({
                name: endpoint,
                endpoint,
                method: "GET",
                handler: filePath,
                framework: detectFramework(filePath),
            });
        }
    }
    // Pattern 4: API client methods
    // api.users.get()
    // apiClient.post('/users')
    const apiClientPattern = /(?:api|apiClient|client)\.\w+\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = apiClientPattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const endpoint = match[2];
        endpoints.push({
            name: endpoint,
            endpoint,
            method,
            handler: filePath,
            framework: detectFramework(filePath),
        });
    }
    // Pattern 5: GraphQL queries
    const graphqlPattern = /(?:query|mutation)\s+(\w+)/gi;
    while ((match = graphqlPattern.exec(content)) !== null) {
        const endpoint = `/graphql/${match[1]}`;
        endpoints.push({
            name: match[1],
            endpoint,
            method: "GRAPHQL",
            handler: filePath,
            framework: "graphql",
        });
    }
    // Pattern 6: Next.js API routes (from route handlers)
    // export async function GET(request: Request)
    // export async function POST(request: Request)
    if (filePath.includes("/api/") || filePath.includes("/route.")) {
        const nextApiPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/gi;
        while ((match = nextApiPattern.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            // Infer path from file location
            let endpoint = filePath
                .replace(/.*\/(api\/.*)/, "/$1")
                .replace(/\/route\.(ts|js)$/, "")
                .replace(/\[(.*?)\]/g, ":$1");
            if (!endpoint.startsWith("/")) {
                endpoint = "/api" + endpoint;
            }
            endpoints.push({
                name: endpoint,
                endpoint,
                method,
                handler: filePath,
                framework: "nextjs",
            });
        }
    }
    // Pattern 7: Express routes (from route definitions)
    // router.get('/users', handler)
    // app.post('/api/users', handler)
    const expressPattern = /(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
    while ((match = expressPattern.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const endpoint = match[2];
        endpoints.push({
            name: endpoint,
            endpoint,
            method,
            handler: filePath,
            framework: "express",
        });
    }
    return endpoints;
}
/**
 * Detects framework from file path
 */
function detectFramework(filePath) {
    if (filePath.includes("/pages/api/") || filePath.includes("/app/api/")) {
        return "nextjs";
    }
    if (filePath.includes("/routes/")) {
        return "express";
    }
    if (filePath.includes("graphql")) {
        return "graphql";
    }
    return undefined;
}
//# sourceMappingURL=apiDetector.js.map
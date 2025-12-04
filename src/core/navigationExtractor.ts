import { promises as fs } from "fs";
import path from "path";
import { Navigation } from "../models/schema.js";

/**
 * Extracts navigation structure from repository
 * @param repoPath - Path to the repository root directory
 * @param screens - List of discovered screens
 * @returns Promise resolving to array of navigation items
 */
export async function extractNavigation(
  repoPath: string,
  screens: string[]
): Promise<Navigation[]> {
  const navigation: Navigation[] = [];

  // Strategy 1: Extract from Next.js file-based routing
  const nextjsNav = await extractNextjsFileRoutes(screens);
  navigation.push(...nextjsNav);

  // Strategy 2: Parse common navigation files
  const navFiles = [
    "src/components/Navigation.tsx",
    "src/components/Navigation.jsx",
    "src/components/Nav.tsx",
    "src/components/Sidebar.tsx",
    "src/components/Header.tsx",
    "src/components/AppLayout.tsx",
    "src/app/layout.tsx",
    "app/layout.tsx",
  ];

  for (const navFile of navFiles) {
    try {
      const navPath = path.join(repoPath, navFile);
      const content = await fs.readFile(navPath, "utf-8");
      const parsed = parseNavigationFromCode(content);
      navigation.push(...parsed);
    } catch (error) {
      // File doesn't exist, continue
    }
  }

  // Strategy 3: Parse React Router configuration
  try {
    const routerFiles = screens.filter(
      (s) =>
        s.includes("routes") ||
        s.includes("router") ||
        s.includes("App.tsx") ||
        s.includes("App.jsx")
    );
    for (const routerFile of routerFiles) {
      const routerPath = path.join(repoPath, routerFile);
      const content = await fs.readFile(routerPath, "utf-8");
      const routes = parseReactRouterRoutes(content);
      navigation.push(...routes);
    }
  } catch (error) {
    // Router file parsing failed, continue
  }

  // Remove duplicates based on path
  const uniqueNav = navigation.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t.path === item.path)
  );

  return uniqueNav;
}

/**
 * Extracts navigation from Next.js file-based routing
 */
function extractNextjsFileRoutes(screens: string[]): Navigation[] {
  const routes: Navigation[] = [];

  const pageFiles = screens.filter(
    (s) => s.includes("/pages/") || s.includes("/app/")
  );

  for (const pageFile of pageFiles) {
    // Extract route path from file path
    let routePath = pageFile;

    // Remove /pages/ or /app/ prefix
    routePath = routePath.replace(/^.*\/(pages|app)\//, "/");

    // Remove file extension
    routePath = routePath.replace(/\.(tsx|jsx|ts|js)$/, "");

    // Convert [param] to :param
    routePath = routePath.replace(/\[([^\]]+)\]/g, ":$1");

    // Remove /index
    routePath = routePath.replace(/\/index$/, "");

    // Handle root index
    if (routePath === "") {
      routePath = "/";
    }

    // Skip API routes
    if (routePath.startsWith("/api/")) {
      continue;
    }

    // Generate label from path
    const segments = routePath.split("/").filter(Boolean);
    const label =
      segments.length > 0
        ? segments[segments.length - 1]
            .replace(/[-_]/g, " ")
            .replace(/:/g, "")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "Home";

    routes.push({
      label,
      path: routePath,
    });
  }

  return routes;
}

/**
 * Parses navigation items from React component code
 */
function parseNavigationFromCode(content: string): Navigation[] {
  const navigation: Navigation[] = [];

  // Pattern 1: Look for <Link to="/path">Label</Link>
  const linkPattern = /<Link\s+to=["']([^"']+)["'][^>]*>([^<]+)<\/Link>/gi;
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    navigation.push({
      label: match[2].trim(),
      path: match[1],
    });
  }

  // Pattern 2: Look for <NavLink to="/path">Label</NavLink>
  const navLinkPattern =
    /<NavLink\s+to=["']([^"']+)["'][^>]*>([^<]+)<\/NavLink>/gi;
  while ((match = navLinkPattern.exec(content)) !== null) {
    navigation.push({
      label: match[2].trim(),
      path: match[1],
    });
  }

  // Pattern 3: Look for navigation arrays
  // const navItems = [ { path: "/...", label: "..." } ]
  const navArrayPattern =
    /(?:const|let|var)\s+\w+\s*=\s*\[\s*\{[^}]*path:\s*["']([^"']+)["'][^}]*label:\s*["']([^"']+)["'][^}]*\}/gi;
  while ((match = navArrayPattern.exec(content)) !== null) {
    navigation.push({
      label: match[2],
      path: match[1],
    });
  }

  // Pattern 4: Look for href="/path"
  const hrefPattern = /href=["']([^"']+)["'][^>]*>([^<]+)</gi;
  while ((match = hrefPattern.exec(content)) !== null) {
    const path = match[1];
    const label = match[2].trim();
    // Only include internal links
    if (
      path.startsWith("/") &&
      !path.startsWith("//") &&
      label &&
      label.length < 50
    ) {
      navigation.push({
        label,
        path,
      });
    }
  }

  return navigation;
}

/**
 * Parses React Router <Route> definitions
 */
function parseReactRouterRoutes(content: string): Navigation[] {
  const routes: Navigation[] = [];

  // Pattern: <Route path="/..." element={<Component />} />
  const routePattern = /<Route\s+path=["']([^"']+)["']\s+element=\{<(\w+)/gi;
  let match;
  while ((match = routePattern.exec(content)) !== null) {
    const path = match[1];
    const component = match[2];

    // Generate label from component name or path
    const label = component
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    routes.push({
      label,
      path,
    });
  }

  return routes;
}


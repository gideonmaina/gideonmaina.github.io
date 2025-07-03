import { strapiAPI } from "../../lib/strapi.js";

export async function GET({ request }) {
  // Extract pagination and filter params from the request URL
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || 1;
  const pageSize = url.searchParams.get("pageSize") || 12;
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");

  try {
    // Build filters based on query params
    const filters = {};
    if (category) {
      filters["category"] = { slug: { $eq: category } };
    }
    if (tag) {
      filters["tags"] = { slug: { $eq: tag } };
    }

    // Fetch projects with filters and pagination
    const { projects, meta } = await strapiAPI.getProjects({
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize) },
      sort: "order:asc,startDate:desc",
      filters,
    });

    // Format the projects for the client
    const formattedProjects = projects.map((project) =>
      strapiAPI.formatProject(project),
    );

    return new Response(
      JSON.stringify({
        projects: formattedProjects,
        meta,
        updated: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    console.error("API Error fetching projects:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch projects",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

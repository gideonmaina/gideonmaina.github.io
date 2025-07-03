import { strapiAPI } from "../../lib/strapi.js";

export async function GET({ request }) {
  // Extract slug from the request URL
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return new Response(
      JSON.stringify({
        error: "Missing slug parameter",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // Fetch the specific project by slug
    const project = await strapiAPI.getProject(slug);

    if (!project) {
      return new Response(
        JSON.stringify({
          error: "Project not found",
          slug,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Format the project for the client
    const formattedProject = strapiAPI.formatProject(project);

    return new Response(
      JSON.stringify({
        project: formattedProject,
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
    console.error(`API Error fetching project with slug ${slug}:`, error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch project",
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

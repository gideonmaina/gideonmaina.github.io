import { strapiAPI } from "../../lib/strapi.js";

export async function GET({ params, request }) {
  try {
    const projects = await strapiAPI.getFeaturedProjects(3);
    const formattedProjects = projects.map((project) =>
      strapiAPI.formatProject(project),
    );

    return new Response(
      JSON.stringify({
        projects: formattedProjects,
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
    console.error("API Error fetching featured projects:", error);
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

import { strapiAPI } from "../../lib/strapi.js";

export async function GET({ request }) {
  // Extract pagination and filter params from the request URL
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || 1;
  const pageSize = url.searchParams.get("pageSize") || 10;
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

    // Fetch blog posts with filters and pagination
    const { posts, meta } = await strapiAPI.getBlogPosts({
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize) },
      sort: "publishedAt:desc",
      filters,
    });

    // Format the posts for the client
    const formattedPosts = posts.map((post) => strapiAPI.formatBlogPost(post));

    return new Response(
      JSON.stringify({
        posts: formattedPosts,
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
    console.error("API Error fetching blog posts:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch blog posts",
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

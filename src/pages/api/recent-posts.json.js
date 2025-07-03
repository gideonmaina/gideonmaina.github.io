import { strapiAPI } from "../../lib/strapi.js";

export async function GET() {
  try {
    const { posts } = await strapiAPI.getBlogPosts({
      pagination: { pageSize: 2 },
      sort: "publishedAt:desc",
    });
    const formattedPosts = posts.map((post) => strapiAPI.formatBlogPost(post));

    return new Response(
      JSON.stringify({
        posts: formattedPosts,
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
    console.error("API Error fetching recent posts:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch posts",
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

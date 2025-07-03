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
    // Fetch the specific blog post by slug
    const post = await strapiAPI.getBlogPost(slug);

    if (!post) {
      return new Response(
        JSON.stringify({
          error: "Blog post not found",
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

    // Format the post for the client
    const formattedPost = strapiAPI.formatBlogPost(post);

    return new Response(
      JSON.stringify({
        post: formattedPost,
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
    console.error(`API Error fetching blog post with slug ${slug}:`, error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch blog post",
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

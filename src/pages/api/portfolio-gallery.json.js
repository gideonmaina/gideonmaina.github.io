// Single Portfolio Gallery API endpoint
export const prerender = false;

import strapiAPI from "@lib/strapi.js";

export async function GET({ params }) {
  try {
    const { slug } = params;

    if (!slug) {
      return new Response(
        JSON.stringify({
          error: "Gallery slug is required",
          success: false,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Fetch gallery from Strapi
    const gallery = await strapiAPI.getPortfolioGallery(slug);

    if (!gallery) {
      return new Response(
        JSON.stringify({
          error: "Portfolio gallery not found",
          success: false,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // Format the gallery
    const formattedGallery = strapiAPI.formatPortfolioGallery(gallery);

    return new Response(
      JSON.stringify({
        data: formattedGallery,
        success: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=600", // 10 minutes cache
        },
      },
    );
  } catch (error) {
    console.error("Portfolio gallery API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch portfolio gallery",
        success: false,
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

// Featured Portfolio Galleries API endpoint
export const prerender = false;

import strapiAPI from "@lib/strapi.js";

export async function GET({ request }) {
	try {
		const url = new URL(request.url);
		const limit = parseInt(url.searchParams.get("limit") || "6");

		// Fetch featured galleries from Strapi
		const galleries = await strapiAPI.getFeaturedPortfolioGalleries(limit);

		// Format the galleries
		const formattedGalleries = galleries.map((gallery) =>
			strapiAPI.formatPortfolioGallery(gallery)
		);

		return new Response(
			JSON.stringify({
				data: formattedGalleries,
				success: true,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=900", // 15 minutes cache
				},
			}
		);
	} catch (error) {
		console.error("Featured portfolio galleries API error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to fetch featured portfolio galleries",
				success: false,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}
}

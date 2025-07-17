// Portfolio Gallery API endpoint
export const prerender = false;

import strapiAPI from "@lib/strapi.js";

export async function GET({ request }) {
	try {
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page") || "1");
		const pageSize = parseInt(url.searchParams.get("pageSize") || "20");
		const category = url.searchParams.get("category");
		const status = url.searchParams.get("status");
		const difficulty = url.searchParams.get("difficulty");
		const featured = url.searchParams.get("featured");
		const highlighted = url.searchParams.get("highlighted");
		const sort = url.searchParams.get("sort") || "order:asc,createdAt:desc";

		// Build filters
		const filters = {};

		if (category) {
			filters.category = { slug: category };
		}

		if (status) {
			filters.status = status;
		}

		if (difficulty) {
			filters.difficulty = difficulty;
		}

		if (featured === "true") {
			filters.featured = true;
		}

		if (highlighted === "true") {
			filters.highlighted = true;
		}

		// Fetch galleries from Strapi
		const response = await strapiAPI.getPortfolioGalleries({
			sort,
			filters,
			pagination: {
				page,
				pageSize,
			},
		});

		// Format the galleries
		const formattedGalleries = response.galleries.map((gallery) =>
			strapiAPI.formatPortfolioGallery(gallery)
		);

		return new Response(
			JSON.stringify({
				data: formattedGalleries,
				meta: response.meta,
				success: true,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "public, max-age=300", // 5 minutes cache
				},
			}
		);
	} catch (error) {
		console.error("Portfolio galleries API error:", error);
		return new Response(
			JSON.stringify({
				error: "Failed to fetch portfolio galleries",
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

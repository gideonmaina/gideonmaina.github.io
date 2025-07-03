// Simple test script to verify blog post routes
import strapiAPI from "../lib/strapi.js";

export async function testBlogRoutes() {
  try {
    console.log("Testing blog routes...");

    // Test getting all blog posts
    const allPosts = await strapiAPI.getBlogPosts({
      pagination: { pageSize: 5 },
    });
    console.log(`✅ Found ${allPosts.posts.length} blog posts`);

    if (allPosts.posts.length > 0) {
      const firstPost = allPosts.posts[0];
      console.log(`First post: ${firstPost.title} (slug: ${firstPost.slug})`);

      // Test getting a single blog post
      const singlePost = await strapiAPI.getBlogPost(firstPost.slug);
      if (singlePost) {
        console.log(`✅ Successfully fetched single post: ${singlePost.title}`);
        console.log(
          `Content type: ${Array.isArray(singlePost.content) ? "Component-based" : "HTML"}`,
        );

        // Test formatting
        const formatted = strapiAPI.formatBlogPost(singlePost);
        console.log(
          `✅ Successfully formatted post with ${formatted.tags?.length || 0} tags`,
        );
      } else {
        console.log("❌ Failed to fetch single post");
      }
    }

    // Test categories
    const categories = await strapiAPI.getBlogCategories();
    console.log(`✅ Found ${categories.length} categories`);

    // Test tags
    const tags = await strapiAPI.getBlogTags();
    console.log(`✅ Found ${tags.length} tags`);

    console.log("Blog routes test completed!");
  } catch (error) {
    console.error("❌ Blog routes test failed:", error);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBlogRoutes();
}

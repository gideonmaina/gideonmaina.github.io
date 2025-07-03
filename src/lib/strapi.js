// Strapi API utility functions
import env from "./env.js";
const STRAPI_URL = env.STRAPI_URL || "http://127.0.0.1:1337";
const STRAPI_TOKEN = env.STRAPI_TOKEN;

class StrapiAPI {
  constructor() {
    this.baseURL = STRAPI_URL;
    this.token = STRAPI_TOKEN;
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        ...options,
        headers,
        cache: "no-store", // Ensures fresh data on each request
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Error response body:", errorText);
        throw new Error(
          `Strapi API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Strapi API fetch error:", error);
      throw error;
    }
  }

  // Build query parameters for Strapi v4
  buildQueryParams(options = {}) {
    const params = new URLSearchParams();

    // Populate - use simplified approach with populate=*
    if (options.populate) {
      params.append("populate", "*");
    }

    // Sort
    if (options.sort) {
      params.append("sort", options.sort);
    }

    // Pagination
    if (options.pagination) {
      if (options.pagination.page) {
        params.append("pagination[page]", options.pagination.page);
      }
      if (options.pagination.pageSize) {
        params.append("pagination[pageSize]", options.pagination.pageSize);
      }
    }

    // Filters
    if (options.filters) {
      this.addFiltersToParams(params, options.filters);
    }

    return params.toString();
  }

  // Add filters to URLSearchParams
  addFiltersToParams(params, filters, prefix = "filters") {
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        if (value.$eq !== undefined) {
          params.append(`${prefix}[${key}][$eq]`, value.$eq);
        } else if (value.$ne !== undefined) {
          params.append(`${prefix}[${key}][$ne]`, value.$ne);
        } else if (value.$containsi !== undefined) {
          params.append(`${prefix}[${key}][$containsi]`, value.$containsi);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === "object") {
              this.addFiltersToParams(
                params,
                item,
                `${prefix}[${key}][${index}]`,
              );
            } else {
              params.append(`${prefix}[${key}][${index}]`, item);
            }
          });
        } else {
          // Handle nested objects
          this.addFiltersToParams(params, value, `${prefix}[${key}]`);
        }
      } else {
        params.append(`${prefix}[${key}]`, value);
      }
    });
  }

  // Get all blog posts
  async getBlogPosts(options = {}) {
    const queryString = this.buildQueryParams({
      populate: "*",
      sort: options.sort || "publishedAt:desc",
      filters: options.filters || {},
      pagination: options.pagination || { pageSize: 10 },
    });

    const data = await this.fetch(`/blog-posts?${queryString}`);
    return {
      posts: data.data || [],
      meta: data.meta || {},
    };
  }

  // Get a single blog post by slug
  async getBlogPost(slug) {
    // Use simple populate=* approach first
    const params = new URLSearchParams();
    params.append("filters[slug][$eq]", slug);
    params.append("populate", "*");

    console.log("post url params:", params);

    const data = await this.fetch(`/blog-posts?${params.toString()}`);

    // Log the fetched content for debugging:       content: [Array]
    console.log("Fetched blog post content:", data.data?.[0]?.content);

    return data.data?.[0] || null;
  }

  // Get blog categories
  async getBlogCategories() {
    const data = await this.fetch("/categories?sort=name:asc");
    return data.data || [];
  }

  // Get blog tags
  async getBlogTags() {
    const data = await this.fetch("/tags?sort=name:asc");
    return data.data || [];
  }

  // Get blog authors
  async getBlogAuthors() {
    const data = await this.fetch("/authors?sort=name:asc");
    return data.data || [];
  }

  // Get featured blog posts
  async getFeaturedBlogPosts(limit = 3) {
    const queryString = this.buildQueryParams({
      populate: "*",
      sort: "publishedAt:desc",
      filters: { featured: { $eq: true } },
      pagination: { pageSize: limit },
    });

    const data = await this.fetch(`/blog-posts?${queryString}`);
    return data.data || [];
  }

  // Get all projects
  async getProjects(options = {}) {
    const queryString = this.buildQueryParams({
      populate: "*",
      sort: options.sort || "order:asc,startDate:desc",
      filters: options.filters || {},
      pagination: options.pagination || { pageSize: 20 },
    });

    const data = await this.fetch(`/projects?${queryString}`);
    return {
      projects: data.data || [],
      meta: data.meta || {},
    };
  }

  // Get a single project by slug
  async getProject(slug) {
    const params = new URLSearchParams();
    params.append("filters[slug][$eq]", slug);
    params.append("populate", "*");

    const data = await this.fetch(`/projects?${params.toString()}`);
    return data.data?.[0] || null;
  }

  // Get featured projects
  async getFeaturedProjects(limit = 3) {
    const queryString = this.buildQueryParams({
      populate: "*",
      sort: "order:asc,startDate:desc",
      filters: { featured: { $eq: true } },
      pagination: { pageSize: limit },
    });

    const data = await this.fetch(`/projects?${queryString}`);
    return data.data || [];
  }

  // Search blog posts
  async searchBlogPosts(query, limit = 10) {
    const queryString = this.buildQueryParams({
      populate: "*",
      sort: "publishedAt:desc",
      filters: {
        $or: [
          { title: { $containsi: query } },
          { excerpt: { $containsi: query } },
          { category: { name: { $containsi: query } } },
          { tags: { name: { $containsi: query } } },
          { author: { name: { $containsi: query } } },
        ],
      },
      pagination: { pageSize: limit },
    });

    console.log("Search query string:", queryString);

    const data = await this.fetch(`/blog-posts?${queryString}`);
    return data.data || [];
  }

  // Get author information
  async getAuthor(id) {
    const data = await this.fetch(`/authors/${id}?populate=avatar`);
    return data.data || null;
  }

  // Helper function to get media URL
  getMediaURL(media) {
    if (!media) return null;

    if (media.url && media.url.startsWith("http")) {
      return media.url;
    }

    return media.url ? `${this.baseURL}${media.url}` : null;
  }

  // Helper function to format blog post data
  formatBlogPost(post) {
    if (!post) return null;

    return {
      id: post.id,
      documentId: post.documentId,
      title: post.title,
      slug: post.slug,
      content: this.formatContent(post.content), // Handle component-based content
      excerpt: post.excerpt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      featured: post.featured || false,
      readTime: post.readTime || this.calculateReadTime(post.content),
      image: post.image?.url ? this.getMediaURL(post.image) : null,
      category: post.category
        ? {
            id: post.category.id,
            name: post.category.name,
            slug: post.category.slug,
            color: post.category.color || "#6B7280",
            description: post.category.description,
          }
        : null,
      author: post.author
        ? {
            id: post.author.id,
            name: post.author.name,
            email: post.author.email,
            bio: post.author.bio,
            title: post.author.title,
            website: post.author.website,
            social: post.author.social,
            avatar: post.author.avatar?.url
              ? this.getMediaURL(post.author.avatar)
              : null,
          }
        : null,
      tags: post.tags
        ? post.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            color: tag.color || "#6B7280",
            description: tag.description,
          }))
        : [],
      seo: post.seo
        ? {
            metaTitle: post.seo.metaTitle,
            metaDescription: post.seo.metaDescription,
            metaKeywords: post.seo.metaKeywords,
            metaImage: post.seo.metaImage?.url
              ? this.getMediaURL(post.seo.metaImage)
              : null,
            canonicalURL: post.seo.canonicalURL,
          }
        : null,
    };
  }

  // Format component-based content
  formatContent(content) {
    if (!content || !Array.isArray(content)) return content;

    return content.map((component) => {
      switch (component.__component) {
        case "content.rich-text":
          return {
            type: "rich-text",
            id: component.id,
            content: component.content,
          };

        case "content.media-block":
          return {
            type: "media-block",
            id: component.id,
            media: component.media
              ? {
                  id: component.media.id,
                  url: this.getMediaURL(component.media),
                  alternativeText: component.media.alternativeText,
                  caption: component.media.caption,
                  mime: component.media.mime,
                  width: component.media.width,
                  height: component.media.height,
                }
              : null,
            caption: component.caption,
            altText: component.altText,
            alignment: component.alignment || "center",
          };

        case "content.code-block":
          return {
            type: "code-block",
            id: component.id,
            code: component.code,
            language: component.language || "javascript",
            filename: component.filename,
            showLineNumbers: component.showLineNumbers !== false,
            highlightLines: component.highlightLines,
            caption: component.caption,
          };

        case "content.quote":
          return {
            type: "quote",
            id: component.id,
            text: component.text,
            author: component.author,
            authorTitle: component.authorTitle,
            authorImage: component.authorImage?.url
              ? this.getMediaURL(component.authorImage)
              : null,
            style: component.style || "default",
          };

        case "content.callout":
          return {
            type: "callout",
            id: component.id,
            title: component.title,
            content: component.content,
            variant: component.type || "info",
            icon: component.icon,
          };

        case "content.embed":
          return {
            type: "embed",
            id: component.id,
            url: component.url,
            title: component.title,
            description: component.description,
            embedType: component.embedType || "custom",
            aspectRatio: component.aspectRatio || "16:9",
            customHeight: component.customHeight,
          };

        default:
          return component;
      }
    });
  }

  // Format category data
  formatCategory(category) {
    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color || "#6B7280",
      icon: category.icon,
    };
  }

  // Format tag data
  formatTag(tag) {
    if (!tag) return null;

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      description: tag.description,
      color: tag.color || "#6B7280",
    };
  }

  // Format project data
  formatProject(project) {
    if (!project) return null;

    return {
      id: project.id,
      documentId: project.documentId,
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      description: project.description,
      publishedAt: project.publishedAt,
      updatedAt: project.updatedAt,
      featured: project.featured || false,
      completed: project.completed || false,
      startDate: project.startDate,
      endDate: project.endDate,
      technologies: (() => {
        if (!project.technologies) return [];

        // If it's already an array, return it
        if (Array.isArray(project.technologies)) return project.technologies;

        // If it's an object with categories, flatten all values into a single array
        if (typeof project.technologies === "object") {
          const allTech = [];
          Object.values(project.technologies).forEach((categoryTech) => {
            if (Array.isArray(categoryTech)) {
              allTech.push(...categoryTech);
            } else if (typeof categoryTech === "string") {
              allTech.push(categoryTech);
            }
          });
          return allTech;
        }

        // If it's a string, try to parse as JSON
        if (typeof project.technologies === "string") {
          try {
            const parsed = JSON.parse(project.technologies);
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === "object") {
              const allTech = [];
              Object.values(parsed).forEach((categoryTech) => {
                if (Array.isArray(categoryTech)) {
                  allTech.push(...categoryTech);
                } else if (typeof categoryTech === "string") {
                  allTech.push(categoryTech);
                }
              });
              return allTech;
            }
            return [parsed];
          } catch {
            return [project.technologies];
          }
        }

        return [];
      })(),
      technologiesByCategory: (() => {
        if (!project.technologies) return {};

        // If it's an object with categories, return it as-is
        if (
          typeof project.technologies === "object" &&
          !Array.isArray(project.technologies)
        ) {
          return project.technologies;
        }

        // If it's a string, try to parse as JSON
        if (typeof project.technologies === "string") {
          try {
            const parsed = JSON.parse(project.technologies);
            if (typeof parsed === "object" && !Array.isArray(parsed)) {
              return parsed;
            }
          } catch {
            // If parsing fails, return empty object
          }
        }

        // For arrays or other types, return empty object
        return {};
      })(),
      github: project.github,
      website: project.website,
      order: project.order || 0,
      image: project.image?.url ? this.getMediaURL(project.image) : null,
      gallery:
        project.gallery && project.gallery.length > 0
          ? project.gallery.map((img) => ({
              id: img.id,
              url: this.getMediaURL(img),
              alternativeText: img.alternativeText,
              caption: img.caption,
              mime: img.mime,
              width: img.width,
              height: img.height,
            }))
          : [],
      category: project.category
        ? {
            id: project.category.id,
            name: project.category.name,
            slug: project.category.slug,
            color: project.category.color || "#6B7280",
            description: project.category.description,
          }
        : null,
      tags: project.tags
        ? project.tags.map((tag) => ({
            id: tag.id,
            name: tag.name,
            slug: tag.slug,
            color: tag.color || "#6B7280",
            description: tag.description,
          }))
        : [],
      seo: project.seo
        ? {
            metaTitle: project.seo.metaTitle,
            metaDescription: project.seo.metaDescription,
            metaKeywords: project.seo.metaKeywords,
            metaImage: project.seo.metaImage?.url
              ? this.getMediaURL(project.seo.metaImage)
              : null,
            canonicalURL: project.seo.canonicalURL,
          }
        : null,
    };
  }

  // Calculate reading time (rough estimate)
  calculateReadTime(content) {
    if (!content) return 0;

    const wordsPerMinute = 200;
    let textContent = "";

    if (Array.isArray(content)) {
      // Component-based content
      content.forEach((component) => {
        if (
          component.__component === "content.rich-text" &&
          component.content
        ) {
          textContent += component.content;
        } else if (
          component.__component === "content.quote" &&
          component.text
        ) {
          textContent += component.text;
        } else if (
          component.__component === "content.callout" &&
          component.content
        ) {
          textContent += component.content;
        }
      });
    } else if (typeof content === "string") {
      textContent = content;
    }

    // Strip HTML tags and count words
    const cleanText = textContent.replace(/<[^>]*>/g, "");
    const wordCount = cleanText
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  // Helper function to get all blog post slugs for sitemap generation
  async getAllBlogSlugs() {
    try {
      const data = await this.fetch(
        "/blog-posts?fields=slug,updatedAt&pagination[pageSize]=1000",
      );
      return (
        data.data?.map((post) => ({
          slug: post.slug,
          lastModified: post.updatedAt,
        })) || []
      );
    } catch (error) {
      console.error("Failed to fetch blog slugs:", error);
      return [];
    }
  }

  // Helper function to get all project slugs for sitemap generation
  async getAllProjectSlugs() {
    try {
      const data = await this.fetch(
        "/projects?fields=slug,updatedAt&pagination[pageSize]=1000",
      );
      return (
        data.data?.map((project) => ({
          slug: project.slug,
          lastModified: project.updatedAt,
        })) || []
      );
    } catch (error) {
      console.error("Failed to fetch project slugs:", error);
      return [];
    }
  }
}

// Export singleton instance
export const strapiAPI = new StrapiAPI();
export default strapiAPI;

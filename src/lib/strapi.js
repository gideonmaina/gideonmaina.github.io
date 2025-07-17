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
        console.log("[strapi.js] Error response body:", errorText);
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
              this.addFiltersToParams(params, item, `${prefix}[${key}][${index}]`);
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

  getGalleryPopulateParams(params) {
    params.append("populate[media]", "*");
    params.append("populate[content][populate]", "*");
  }




  // Helper method to add blog post population parameters
  addBlogPostPopulation(params) {
    // Populate all top-level fields
    params.append("populate[0]", "image");
    params.append("populate[1]", "category");
    params.append("populate[2]", "author");
    params.append("populate[3]", "author.avatar");
    params.append("populate[4]", "tags");
    params.append("populate[5]", "seo");
    params.append("populate[6]", "seo.metaImage");

    // Populate dynamic zone content with nested media fields
    params.append("populate[7]", "content");
    params.append("populate[8]", "content.media");
    params.append("populate[9]", "content.authorImage");
  }

  // Get all blog posts
  async getBlogPosts(options = {}) {
    const params = new URLSearchParams();

    // Sort
    if (options.sort) {
      params.append("sort", options.sort);
    } else {
      params.append("sort", "publishedAt:desc");
    }

    // Pagination
    const pagination = options.pagination || { pageSize: 10 };
    if (pagination.page) {
      params.append("pagination[page]", pagination.page);
    }
    if (pagination.pageSize) {
      params.append("pagination[pageSize]", pagination.pageSize);
    }

    // Filters
    if (options.filters) {
      this.addFiltersToParams(params, options.filters);
    }

    // Add blog post population
    this.addBlogPostPopulation(params);

    console.log("Full URL for blog posts:", `${this.baseURL}/api/blog-posts?${params.toString()}`);

    const data = await this.fetch(`/blog-posts?${params.toString()}`);
    return {
      posts: data.data || [],
      meta: data.meta || {},
    };
  }

  // Get a single blog post by slug
  async getBlogPost(slug) {
    // Use explicit population for dynamic zone components with media fields
    const params = new URLSearchParams();
    params.append("filters[slug][$eq]", slug);

    // Add blog post population
    this.addBlogPostPopulation(params);

    console.log("[strapi.js] post url params:", params);

    const data = await this.fetch(`/blog-posts?${params.toString()}`);

    // Log the fetched content for debugging:       content: [Array]
    console.log("[strapi.js] Fetched blog post content:", data.data?.[0]?.content);

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
    const params = new URLSearchParams();

    // Sort
    params.append("sort", "publishedAt:desc");

    // Pagination
    params.append("pagination[pageSize]", limit);

    // Filters
    params.append("filters[featured][$eq]", "true");

    // Add blog post population
    this.addBlogPostPopulation(params);

    const data = await this.fetch(`/blog-posts?${params.toString()}`);
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
    const params = new URLSearchParams();

    // Sort
    params.append("sort", "publishedAt:desc");

    // Pagination
    params.append("pagination[pageSize]", limit);

    // Search filters using $or operator
    params.append("filters[$or][0][title][$containsi]", query);
    params.append("filters[$or][1][excerpt][$containsi]", query);
    params.append("filters[$or][2][category][name][$containsi]", query);
    params.append("filters[$or][3][tags][name][$containsi]", query);
    params.append("filters[$or][4][author][name][$containsi]", query);

    // Add blog post population
    this.addBlogPostPopulation(params);

    console.log("[strapi.js] Search query string:", params.toString());

    const data = await this.fetch(`/blog-posts?${params.toString()}`);
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

    // If media is already a full URL, return it directly
    if (media.url && media.url.startsWith("http")) {
      return media.url;
    }

    // Otherwise, construct the full URL using the base URL
    return media.url ? `${this.baseURL}${media.url}` : null;
  }

  // Helper function to format media URL (alias for getMediaURL)
  formatMediaUrl(media) {
    return this.getMediaURL(media);
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
      readTime: this.calculateReadTime(post.content),
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
            __component: "content.rich-text",
            id: component.id,
            content: component.content,
          };

        case "content.media-block":
          return {
            type: "media-block",
            __component: "content.media-block",
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
            __component: "content.code-block",
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
            __component: "content.quote",
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
            __component: "content.callout",
            id: component.id,
            title: component.title,
            content: component.content,
            variant: component.type || "info",
            icon: component.icon,
          };

        case "content.embed":
          return {
            type: "embed",
            __component: "content.embed",
            id: component.id,
            url: component.url,
            title: component.title,
            description: component.description,
            embedType: component.embedType || "custom",
            aspectRatio: component.aspectRatio || "16:9",
            customHeight: component.customHeight,
          };

        default:
          // Return the component as-is with its original __component
          return {
            ...component,
            type: component.__component || "unknown",
          };
      }
    });
  }

  // Format gallery-specific content (handles gallery dynamic zone components)
  formatGalleryContent(content) {
    if (!content || !Array.isArray(content)) return content;

    return content.map((component) => {
      switch (component.__component) {
        case "content.rich-text":
          return {
            type: "rich-text",
            __component: "content.rich-text",
            id: component.id,
            content: component.content,
          };

        case "content.media-block": {
          // Extract all possible media fields, including nested data
          let media = null;
          if (component.media) {
            // Strapi may return media as an object or as { data: { ... } }
            if (component.media.data) {
              const m = component.media.data;
              media = {
                id: m.id,
                url: m.url || (m.attributes && m.attributes.url) || null,
                alternativeText: m.alternativeText || (m.attributes && m.attributes.alternativeText) || null,
                caption: m.caption || (m.attributes && m.attributes.caption) || null,
                mime: m.mime || (m.attributes && m.attributes.mime) || null,
                width: m.width || (m.attributes && m.attributes.width) || null,
                height: m.height || (m.attributes && m.attributes.height) || null,
              };
            } else {
              // Direct object
              media = {
                id: component.media.id,
                url: component.media.url,
                alternativeText: component.media.alternativeText,
                caption: component.media.caption,
                mime: component.media.mime,
                width: component.media.width,
                height: component.media.height,
              };
            }
          }
          return {
            type: "media-block",
            __component: "content.media-block",
            id: component.id,
            caption: component.caption,
            altText: component.altText,
            alignment: component.alignment || "center",
            media,
          };
        }

        case "content.quote":
          return {
            type: "quote",
            __component: "content.quote",
            id: component.id,
            text: component.text,
            author: component.author,
            authorTitle: component.authorTitle,
            style: component.style || "default",
          };

        case "content.code-block":
          return {
            type: "code-block",
            __component: "content.code-block",
            id: component.id,
            code: component.code,
            language: component.language || "javascript",
            filename: component.filename,
            showLineNumbers: component.showLineNumbers !== false,
            highlightLines: component.highlightLines,
            caption: component.caption,
          };

        case "content.callout":
          return {
            type: "callout",
            __component: "content.callout",
            id: component.id,
            title: component.title,
            content: component.content,
            variant: component.type || component.variant || "info",
            icon: component.icon,
          };

        case "content.embed":
          return {
            type: "embed",
            __component: "content.embed",
            id: component.id,
            url: component.url,
            title: component.title,
            description: component.description,
            embedType: component.embedType || "custom",
            aspectRatio: component.aspectRatio || "16:9",
            customHeight: component.customHeight,
          };

        default:
          // Return the component as-is but ensure it has both type and __component
          return {
            ...component,
            type: component.__component || "unknown",
            __component: component.__component || "unknown",
          };
      }
    });
  }  // Format category data
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

  // Portfolio Gallery Methods

  // Get all portfolio gallery items
  async getPortfolioGalleries(options = {}) {
    const queryString = this.buildQueryParams({
      populate: {
        featuredImage: true,
        galleryImages: true,
        thumbnailImage: true,
        category: {
          fields: ["name", "slug", "color"],
        },
        tags: {
          fields: ["name", "slug", "color"],
        },
      },
      sort: options.sort || "order:asc,createdAt:desc",
      filters: options.filters || {},
      pagination: options.pagination || { pageSize: 20 },
    });

    const data = await this.fetch(`/portfolio-galleries?${queryString}`);
    return {
      galleries: data.data || [],
      meta: data.meta || {},
    };
  }

  // Get a single portfolio gallery item by slug
  async getPortfolioGallery(slug) {
    const params = new URLSearchParams();
    params.append("filters[slug][$eq]", slug);
    params.append(
      "populate",
      JSON.stringify({
        featuredImage: true,
        galleryImages: true,
        thumbnailImage: true,
        category: {
          fields: ["name", "slug", "color", "description"],
        },
        tags: {
          fields: ["name", "slug", "color", "description"],
        },
      }),
    );

    const data = await this.fetch(`/portfolio-galleries?${params.toString()}`);
    return data.data?.[0] || null;
  }

  // Get featured portfolio gallery items
  async getFeaturedPortfolioGalleries(limit = 6) {
    const queryString = this.buildQueryParams({
      populate: {
        featuredImage: true,
        thumbnailImage: true,
        category: {
          fields: ["name", "slug", "color"],
        },
        tags: {
          fields: ["name", "slug", "color"],
        },
      },
      filters: { featured: true },
      sort: "order:asc,createdAt:desc",
      pagination: { pageSize: limit },
    });

    const data = await this.fetch(`/portfolio-galleries?${queryString}`);
    return data.data || [];
  }

  // Get highlighted portfolio gallery items
  async getHighlightedPortfolioGalleries(limit = 4) {
    const queryString = this.buildQueryParams({
      populate: {
        featuredImage: true,
        thumbnailImage: true,
        category: {
          fields: ["name", "slug", "color"],
        },
        tags: {
          fields: ["name", "slug", "color"],
        },
      },
      filters: { highlighted: true },
      sort: "order:asc,createdAt:desc",
      pagination: { pageSize: limit },
    });

    const data = await this.fetch(`/portfolio-galleries?${queryString}`);
    return data.data || [];
  }

  // Like a portfolio gallery item
  async likePortfolioGallery(id) {
    return await this.fetch(`/portfolio-galleries/${id}/like`, {
      method: "POST",
    });
  }

  // Format portfolio gallery data
  formatPortfolioGallery(gallery) {
    if (!gallery || !gallery.attributes) return null;

    const attributes = gallery.attributes;
    return {
      id: gallery.id,
      title: attributes.title,
      slug: attributes.slug,
      subtitle: attributes.subtitle,
      description: attributes.description,
      shortDescription: attributes.shortDescription,
      featuredImage: this.formatMediaUrl(attributes.featuredImage?.data),
      galleryImages:
        attributes.galleryImages?.data?.map((img) =>
          this.formatMediaUrl(img),
        ) || [],
      thumbnailImage: this.formatMediaUrl(attributes.thumbnailImage?.data),
      category: attributes.category?.data
        ? {
          id: attributes.category.data.id,
          name: attributes.category.data.attributes.name,
          slug: attributes.category.data.attributes.slug,
          color: attributes.category.data.attributes.color,
          description: attributes.category.data.attributes.description,
        }
        : null,
      tags:
        attributes.tags?.data?.map((tag) => ({
          id: tag.id,
          name: tag.attributes.name,
          slug: tag.attributes.slug,
          color: tag.attributes.color,
          description: tag.attributes.description,
        })) || [],
      technologies: attributes.technologies || [],
      clientName: attributes.clientName,
      projectUrl: attributes.projectUrl,
      githubUrl: attributes.githubUrl,
      liveUrl: attributes.liveUrl,
      demoUrl: attributes.demoUrl,
      startDate: attributes.startDate,
      endDate: attributes.endDate,
      duration: attributes.duration,
      status: attributes.status,
      featured: attributes.featured,
      highlighted: attributes.highlighted,
      order: attributes.order,
      views: attributes.views || 0,
      likes: attributes.likes || 0,
      difficulty: attributes.difficulty,
      collaboration: attributes.collaboration,
      teamSize: attributes.teamSize,
      role: attributes.role,
      achievements: attributes.achievements || [],
      challenges: attributes.challenges,
      learnings: attributes.learnings,
      seoTitle: attributes.seoTitle,
      seoDescription: attributes.seoDescription,
      seoKeywords: attributes.seoKeywords,
      publishedAt: attributes.publishedAt,
      createdAt: attributes.createdAt,
      updatedAt: attributes.updatedAt,
    };
  }

  // Get all portfolio gallery slugs
  async getAllPortfolioGallerySlugs() {
    try {
      const data = await this.fetch(
        "/portfolio-galleries?fields=slug,updatedAt&pagination[pageSize]=1000",
      );
      return (
        data.data?.map((gallery) => ({
          slug: gallery.slug,
          lastModified: gallery.updatedAt,
        })) || []
      );
    } catch (error) {
      console.error("Failed to fetch portfolio gallery slugs:", error);
      return [];
    }
  }

  // Gallery Methods

  // Get all galleries
  async getGalleries(options = {}) {
    const params = new URLSearchParams();

    // Sort
    params.append("sort", options.sort || "date:desc");

    // Pagination
    const pagination = options.pagination || { pageSize: 20 };
    if (pagination.page) {
      params.append("pagination[page]", pagination.page);
    }
    if (pagination.pageSize) {
      params.append("pagination[pageSize]", pagination.pageSize);
    }

    // Filters
    if (options.filters) {
      this.addFiltersToParams(params, options.filters);
    }

    // Populate nested media properly
    this.getGalleryPopulateParams(params);

    const data = await this.fetch(`/galleries?${params.toString()}`);

    console.log("[strapi.js] Full URL for galleries:", `${this.baseURL}/api/galleries?${params.toString()}`);
    console.log("[strapi.js] Fetched galleries data:", data);

    const galleries = Array.isArray(data) ? data : (data.data || []);

    return {
      galleries: galleries.map((gallery) => this.formatGallery(gallery)),
      meta: data.meta || {},
    };
  }

  // Get a single gallery by slug
  async getGallery(slug) {
    const params = new URLSearchParams();
    params.append("filters[slug][$eq]", slug);
    this.getGalleryPopulateParams(params);

    const data = await this.fetch(`/galleries?${params.toString()}`);
    const galleries = Array.isArray(data) ? data : (data.data || []);
    const gallery = galleries[0];
    return gallery ? this.formatGallery(gallery) : null;
  }


  // Get galleries by category
  async getGalleriesByCategory(category, limit = 10) {
    const params = new URLSearchParams();
    params.append("filters[category][$eq]", category);
    params.append("sort", "date:desc");
    params.append("pagination[pageSize]", limit);
    params.append("populate", "*");

    const data = await this.fetch(`/galleries?${params.toString()}`);
    // Handle both array response and object with data property
    const galleries = Array.isArray(data) ? data : (data.data || []);
    return galleries.map((gallery) => this.formatGallery(gallery));
  }

  // Format gallery data
  formatGallery(gallery) {

    console.log("[strapi.js] Formatting gallery:", gallery);

    try {
      if (!gallery || typeof gallery !== "object") {
        return null;
      }

      console.log("[strapi.js] media:", gallery.media);

      const formattedGallery = {
        id: gallery.id ?? null,
        documentId: gallery.documentId ?? null,
        title: gallery.title ?? "",
        slug: gallery.slug ?? "",
        altText: gallery.altText ?? "",
        description: gallery.description ?? "",
        media: this.getMediaURL(gallery.media),
        content: this.formatGalleryContent(gallery.content ?? []),
        category: gallery.category ?? null,
        location: gallery.location ?? "",
        date: gallery.date ?? null,
        tags: Array.isArray(gallery.tags) ? gallery.tags : [],
        publishedAt: gallery.publishedAt ?? null,
        createdAt: gallery.createdAt ?? null,
        updatedAt: gallery.updatedAt ?? null,
      };

      console.log("[strapi.js] Formatted gallery:", formattedGallery);

      return formattedGallery;
    } catch (error) {
      console.error("[strapi.js] Error in formatGallery:", error);
      return null;
    }
  }

  // Get all gallery slugs
  async getAllGallerySlugs() {
    try {
      const data = await this.fetch(
        "/galleries?fields=slug,updatedAt&pagination[pageSize]=1000",
      );
      return (
        data.data?.map((gallery) => ({
          slug: gallery.slug,
          lastModified: gallery.updatedAt,
        })) || []
      );
    } catch (error) {
      console.error("Failed to fetch gallery slugs:", error);
      return [];
    }
  }
}

// Export singleton instance
export const strapiAPI = new StrapiAPI();
export default strapiAPI;

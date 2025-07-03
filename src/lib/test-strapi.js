import fetchApi from "./strapi.js";

const data = await fetchApi({
  endpoint: "blog-posts",
  wrappedByKey: "data",
  query: "populate=*",
});

console.log("Data fetched from Strapi:", data);

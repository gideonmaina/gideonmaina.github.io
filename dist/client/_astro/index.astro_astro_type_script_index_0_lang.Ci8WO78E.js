document.addEventListener("DOMContentLoaded",async()=>{async function n(){try{const t=await fetch("/api/featured-projects.json");if(!t.ok)throw new Error("Failed to fetch projects");const r=(await t.json()).projects;if(!r||!r.length)return;const o=document.querySelector(".projects-grid");if(!o)return;if(r.length>0&&o){const a=r.map((e,s)=>`
              <div
                class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-teal-500/10 flex flex-col h-full"
                data-aos="fade-up"
                data-aos-delay="${200*(s+1)}"
                data-aos-duration="1000"
              >
                <div class="relative h-56 overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-br from-teal-500 to-blue-600 opacity-20"></div>
                  ${e.image?`
                    <img
                      src="${e.image}"
                      alt="${e.title}"
                      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  `:`
                    <div class="w-full h-full bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                      <div class="text-6xl text-teal-300/50">
                        ${e.category?.name==="IoT Device"?"🌐":e.category?.name==="Web Application"?"💻":e.category?.name==="Hardware + Software"?"⚡":"🛠️"}
                      </div>
                    </div>
                  `}
                  <div class="absolute top-4 left-4">
                    ${e.category?`
                      <span
                        class="px-3 py-1 backdrop-blur-sm text-white text-xs font-medium rounded-full"
                        style="background-color: ${e.category.color||"#14B8A6"}70"
                      >
                        ${e.category.name}
                      </span>
                    `:""}
                  </div>
                </div>
                <div class="p-6 flex flex-col flex-1">
                  <h3 class="text-white text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-teal-400 group-hover:to-cyan-400">
                    ${e.title}
                  </h3>
                  <p class="text-gray-400 mb-6 flex-1 line-clamp-3">
                    ${e.summary}
                  </p>
                  <div class="flex flex-wrap gap-2 mb-4">
                    ${e.technologies&&e.technologies.slice(0,4).map(l=>`
                        <span class="px-3 py-1 bg-white/5 text-gray-300 text-xs rounded-full border border-white/10">
                          ${l}
                        </span>
                      `).join("")}
                    ${e.technologies&&e.technologies.length>4?`
                      <span class="px-3 py-1 bg-white/5 text-gray-300 text-xs rounded-full border border-white/10">
                        +${e.technologies.length-4} more
                      </span>
                    `:""}
                  </div>
                  <div class="flex items-center gap-4">
                    <a
                      href="/projects/${e.slug}"
                      class="group inline-flex items-center text-teal-400 hover:text-teal-300 font-medium transition-all duration-300"
                    >
                      <span>View Project</span>
                      <svg
                        class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </a>
                    ${e.github||e.website?`
                      <div class="flex items-center gap-2 ml-auto">
                        ${e.github?`
                          <a
                            href="${e.github}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            title="View on GitHub"
                          >
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                          </a>
                        `:""}
                        ${e.website?`
                          <a
                            href="${e.website}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                            title="Visit Website"
                          >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        `:""}
                      </div>
                    `:""}
                  </div>
                </div>
              </div>
            `).join("");o.innerHTML=a}}catch(t){console.error("Error refreshing projects:",t)}}async function i(){try{const t=await fetch("/api/recent-posts.json");if(!t.ok)throw new Error("Failed to fetch blog posts");const r=(await t.json()).posts;if(!r||!r.length)return;const o=document.querySelector(".blog-posts-grid");if(!o)return;if(r.length>0&&o){const a=r.map((e,s)=>{const l=new Date(e.publishedAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"});return`
              <article
                class="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-full"
                data-aos="fade-up"
                data-aos-delay="${200*(s+1)}"
                data-aos-duration="1000"
              >
                <div class="flex items-center text-sm text-gray-400 mb-4 flex-wrap">
                  <time class="flex items-center">
                    <svg
                      class="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    ${l}
                  </time>
                  <span class="mx-2 hidden xs:inline">•</span>
                  <span class="flex items-center mt-2 xs:mt-0">
                    <svg
                      class="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    ${e.readTime} min read
                  </span>
                </div>

                <h3 class="text-white text-xl font-bold mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300 line-clamp-2">
                  <a href="/blog/${e.slug}" class="block">
                    ${e.title}
                  </a>
                </h3>

                <p class="text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                  ${e.excerpt}
                </p>

                <div class="flex items-center justify-between mt-auto flex-wrap gap-2">
                  <div class="flex items-center space-x-2 flex-wrap">
                    ${e.category?`
                      <span
                        class="px-3 py-1 text-white text-xs font-medium rounded-full border mb-1"
                        style="background-color: ${e.category.color||"#6B7280"}20; border-color: ${e.category.color||"#6B7280"}40; color: ${e.category.color||"#6B7280"}"
                      >
                        ${e.category.name}
                      </span>
                    `:""}
                    ${e.tags&&e.tags.length>0?`
                      <span
                        class="px-3 py-1 text-xs font-medium rounded-full border mb-1"
                        style="background-color: ${e.tags[0].color||"#6B7280"}20; border-color: ${e.tags[0].color||"#6B7280"}40; color: ${e.tags[0].color||"#6B7280"}"
                      >
                        ${e.tags[0].name}
                      </span>
                    `:""}
                  </div>

                  <a
                    href="/blog/${e.slug}"
                    class="group inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-all duration-300"
                  >
                    <span>Read more</span>
                    <svg
                      class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </a>
                </div>
              </article>
            `}).join("");o.innerHTML=a}}catch(t){console.error("Error refreshing blog posts:",t)}}setTimeout(async()=>{await n(),await i(),window.AOS&&window.AOS.refresh()},1e3)});

/* ============================================================
   CONFIG — edit these 3 lines to match your GitHub repo.
   This is the only place you should ever need to touch this file.
   ============================================================ */
const GITHUB_USER   = "mimid-aamaliche";   // your GitHub username
const GITHUB_REPO   = "portfolio";         // the repo this site lives in
const GITHUB_BRANCH = "main";              // branch to read from

/* ============================================================
   Everything below discovers /projects automatically.
   Drop a new folder in /projects, push, and it appears here —
   no code changes needed.
   ============================================================ */

const API_BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|svg)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

async function fetchDir(path) {
  const res = await fetch(`${API_BASE}/${path}?ref=${GITHUB_BRANCH}`);
  if (!res.ok) {
    if (res.status === 404) return []; // folder doesn't exist yet — treat as empty
    throw new Error(`GitHub API error ${res.status} for ${path}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function rawUrl(path) {
  return `${RAW_BASE}/${path}`;
}

// Parses a simple "key: value" metadata.txt file.
// Lines starting with # are treated as comments.
function parseMetadata(text) {
  const meta = {};
  text.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf(":");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim().toLowerCase();
    const value = trimmed.slice(idx + 1).trim();
    meta[key] = value;
  });
  // fields that should become arrays
  ["tech", "tags"].forEach((key) => {
    if (meta[key]) meta[key] = meta[key].split(",").map((s) => s.trim()).filter(Boolean);
  });
  return meta;
}

async function loadProject(name) {
  const basePath = `projects/${name}`;
  try {
    const entries = await fetchDir(basePath);

    let meta = {};
    const metaFile = entries.find((e) => e.type === "file" && e.name.toLowerCase() === "metadata.txt");
    if (metaFile) {
      const text = await (await fetch(rawUrl(metaFile.path))).text();
      meta = parseMetadata(text);
    }

    let images = [];
    if (entries.some((e) => e.type === "dir" && e.name === "images")) {
      const imgEntries = await fetchDir(`${basePath}/images`);
      images = imgEntries
        .filter((e) => e.type === "file" && IMAGE_EXT.test(e.name))
        .map((e) => rawUrl(e.path));
    }

    let videos = [];
    if (entries.some((e) => e.type === "dir" && e.name === "videos")) {
      const vidEntries = await fetchDir(`${basePath}/videos`);
      videos = vidEntries
        .filter((e) => e.type === "file" && VIDEO_EXT.test(e.name))
        .map((e) => rawUrl(e.path));
    }

    return {
      slug: name,
      title: meta.title || name.replace(/-/g, " "),
      description: meta.description || "",
      tech: meta.tech || [],
      date: meta.date || "",
      link: meta.link || "",
      highlight: meta.highlight === "true",
      images,
      videos,
    };
  } catch (err) {
    console.error(`Failed to load project "${name}":`, err);
    return null;
  }
}

function resolveMediaUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
  return url;
}

function renderProject(p) {
  const images = Array.isArray(p.images) ? p.images : [];
  const videos = Array.isArray(p.videos) ? p.videos : [];
  const techList = Array.isArray(p.tech) ? p.tech : (p.tech ? [p.tech] : []);

  const gallery = images.length
    ? `<div class="gallery">${images.map((src) => `<img src="${resolveMediaUrl(src)}" alt="${p.title} — capture" loading="lazy">`).join("")}</div>`
    : "";

  const video = videos.length
    ? `<video class="project-video" src="${resolveMediaUrl(videos[0])}" controls preload="metadata"></video>`
    : "";

  const chips = techList.length
    ? `<div class="chip-row">${techList.map((t) => `<span class="chip">${t}</span>`).join("")}</div>`
    : "";

  const link = p.link
    ? `<div class="project-links"><a href="${p.link}" target="_blank" rel="noopener">Voir le projet →</a></div>`
    : "";

  const badge = p.highlight
    ? `<span class="badge-automation">Automatisation</span>`
    : "";

  const cardClass = p.highlight ? "project-card project-card--highlight" : "project-card";

  return `
    <article class="${cardClass}">
      <div class="project-card-header">
        <p class="project-meta">${p.date || ""}</p>
        ${badge}
      </div>
      <h3>${p.title}</h3>
      ${p.description ? `<p class="project-desc">${p.description}</p>` : ""}
      ${chips}
      ${video}
      ${gallery}
      ${link}
    </article>
  `;
}


/* ---- 1. Manifest (fast path — avoids GitHub API rate limits) ---- */

async function tryManifest() {
  // Try relative path first (works when served locally or directly on GitHub Pages)
  try {
    const res = await fetch("manifest.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        return data.projects;
      }
    }
  } catch {}

  // Try raw GitHub URL as fallback
  try {
    const res = await fetch(`${RAW_BASE}/manifest.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        return data.projects;
      }
    }
  } catch {}

  return null;
}

async function loadAllProjects() {
  const grid = document.getElementById("project-grid");
  try {
    // Fast path: try manifest.json first
    let projects = await tryManifest();

    if (projects) {
      console.log("[portfolio] Loaded from manifest.json ✓");
    } else {
      // Slow path: GitHub API discovery (runs when manifest is missing or deleted)
      console.log("[portfolio] manifest.json not found — falling back to GitHub API");

      const entries = await fetchDir("projects");
      const dirs = entries.filter((e) => e.type === "dir");

      if (dirs.length === 0) {
        grid.innerHTML = `<p class="empty-state">Aucun projet pour l'instant.</p>`;
        return;
      }

      projects = (await Promise.all(dirs.map((d) => loadProject(d.name)))).filter(Boolean);
    }

    if (!projects || projects.length === 0) {
      grid.innerHTML = `<p class="empty-state">Aucun projet pour l'instant. Ajoutez un dossier dans <code>/projects</code> ou régénérez <code>manifest.json</code>.</p>`;
      return;
    }

    // Highlighted (automation) projects first, then most recent within each group
    projects.sort((a, b) => {
      if (a.highlight !== b.highlight) return a.highlight ? -1 : 1;
      return (b.date || "").localeCompare(a.date || "");
    });

    grid.innerHTML = projects.map(renderProject).join("");
  } catch (err) {
    console.error("Failed to load projects:", err);
    grid.innerHTML = `<p class="empty-state">Impossible de charger les projets pour le moment (limite d'API GitHub atteinte ou erreur réseau). Régénérez <code>manifest.json</code> pour un chargement instantané sans API.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadAllProjects);

/* ============================================================
   Lightbox — opens when a .gallery img is clicked.
   Works via event delegation so it handles dynamically
   rendered project cards without any extra setup.
   ============================================================ */
(function initLightbox() {
  const lb    = document.getElementById("lightbox");
  const lbImg = lb ? lb.querySelector(".lightbox-img") : null;
  const lbBtn = lb ? lb.querySelector(".lightbox-close") : null;
  if (!lb || !lbImg) return;

  function open(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt || "";
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lbBtn && lbBtn.focus();
  }

  function close() {
    lb.hidden = true;
    lbImg.src = "";
    document.body.style.overflow = "";
  }

  // Open on gallery image click (delegation)
  document.addEventListener("click", (e) => {
    const img = e.target.closest(".gallery img");
    if (img) { e.preventDefault(); open(img.src, img.alt); }
  });

  // Close on backdrop click
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });

  // Close button
  lbBtn && lbBtn.addEventListener("click", close);

  // Close on Escape
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) close(); });
}());

const SCORE_LABELS = {
  logic_gap: "逻辑断层",
  performance: "表演浓度",
  remixability: "二创潜力",
  context_collapse: "语境崩塌",
};

const state = {
  videos: [],
  query: "",
  tag: "",
};

const grid = document.querySelector("#specimen-grid");
const searchInput = document.querySelector("#search-input");
const tagFilter = document.querySelector("#tag-filter");
const emptyState = document.querySelector("#empty-state");
const resultCount = document.querySelector("#result-count");

function element(name, className, text) {
  const node = document.createElement(name);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
}

function averageScore(scores) {
  const values = Object.values(scores);
  return (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1);
}

function pauseOtherVideos(currentVideo) {
  document.querySelectorAll("video").forEach((video) => {
    if (video !== currentVideo) video.pause();
  });
}

function buildScores(scores) {
  const container = element("div", "scores");
  Object.entries(SCORE_LABELS).forEach(([key, label]) => {
    const row = element("div", "score-row");
    const track = element("div", "score-track");
    const fill = element("div", "score-fill");
    fill.style.width = `${scores[key] * 10}%`;
    track.append(fill);
    row.append(element("span", "", label), track, element("strong", "", String(scores[key])));
    container.append(row);
  });
  return container;
}

function buildMoments(moments, video) {
  const container = element("div", "moments");
  moments.forEach((moment) => {
    const button = element("button", "moment-button", `${moment.at.toFixed(1)}s · ${moment.label}`);
    button.type = "button";
    button.addEventListener("click", () => {
      video.currentTime = moment.at;
      pauseOtherVideos(video);
      video.play();
    });
    container.append(button);
  });
  return container;
}

function buildSpecimen(item, index) {
  const article = element("article", "specimen");
  article.id = `video-${item.id}`;
  article.dataset.index = String(index + 1).padStart(3, "0");

  const video = document.createElement("video");
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.poster = item.media.poster;
  video.src = item.media.src;
  video.setAttribute("aria-label", item.title);
  video.addEventListener("play", () => pauseOtherVideos(video));

  const body = element("div", "specimen-body");
  const meta = element("div", "specimen-meta");
  meta.append(
    element("span", "", formatDate(item.published_at)),
    element("span", "", `抽象指数 ${averageScore(item.absurdity)}`),
  );

  const title = element("h3", "", item.title);
  const summary = element("p", "summary", item.summary);
  const tags = element("div", "tags");
  item.tags.forEach((tag) => {
    const button = element("button", "tag-button", `#${tag}`);
    button.type = "button";
    button.addEventListener("click", () => {
      state.tag = tag;
      tagFilter.value = tag;
      render();
    });
    tags.append(button);
  });

  const details = document.createElement("details");
  details.append(element("summary", "", "展开标本档案"));
  const dossier = element("div", "dossier");

  const scoreSection = element("section");
  scoreSection.append(element("h4", "", "ABSURDITY MATRIX"), buildScores(item.absurdity));

  const momentSection = element("section");
  momentSection.append(element("h4", "", "名场面坐标"), buildMoments(item.moments, video));

  const provenanceSection = element("section");
  provenanceSection.append(
    element("h4", "", "来源与权利"),
    element("p", "fine-print", `${item.provenance.creator} · ${item.rights.license}`),
    element("p", "fine-print", item.provenance.source_note),
    element("p", "fine-print", item.rights.evidence),
  );
  if (item.provenance.original_url) {
    const sourceLink = element("a", "text-link", "查看原始出处 ↗");
    sourceLink.href = item.provenance.original_url;
    sourceLink.rel = "noreferrer";
    provenanceSection.append(sourceLink);
  }

  const lineageSection = element("section");
  lineageSection.append(
    element("h4", "", "梗谱系"),
    element(
      "p",
      "fine-print",
      `祖先 ${item.lineage.parents.length} 个 / 后代 ${item.lineage.children.length} 个`,
    ),
  );

  dossier.append(scoreSection, momentSection, provenanceSection, lineageSection);
  details.append(dossier);
  body.append(meta, title, summary, tags, details);
  article.append(video, body);
  return article;
}

function visibleVideos() {
  const query = state.query.trim().toLocaleLowerCase("zh-CN");
  return state.videos.filter((item) => {
    const searchable = [item.title, item.summary, ...item.tags].join(" ").toLocaleLowerCase("zh-CN");
    return (!query || searchable.includes(query)) && (!state.tag || item.tags.includes(state.tag));
  });
}

function render() {
  const videos = visibleVideos();
  grid.replaceChildren(...videos.map(buildSpecimen));
  emptyState.hidden = videos.length !== 0;
  resultCount.textContent = `显示 ${videos.length} / ${state.videos.length}`;
}

function chooseRandomSpecimen() {
  const candidates = visibleVideos();
  if (candidates.length === 0) return;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const article = document.querySelector(`#video-${CSS.escape(pick.id)}`);
  article.scrollIntoView({ behavior: "smooth", block: "center" });
  article.classList.remove("is-random-pick");
  window.requestAnimationFrame(() => article.classList.add("is-random-pick"));
  window.location.hash = `video-${pick.id}`;
}

async function loadCatalog() {
  const response = await fetch("catalog.json");
  if (!response.ok) throw new Error(`目录读取失败：HTTP ${response.status}`);
  const catalog = await response.json();
  state.videos = catalog.videos;

  const tags = [...new Set(state.videos.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  tags.forEach((tag) => {
    const option = element("option", "", tag);
    option.value = tag;
    tagFilter.append(option);
  });

  document.querySelector("#video-count").textContent = String(state.videos.length).padStart(2, "0");
  document.querySelector("#tag-count").textContent = String(tags.length).padStart(2, "0");
  document.querySelector("#catalog-version").textContent = `CATALOG v${catalog.version}`;
  render();

  if (window.location.hash.startsWith("#video-")) {
    document.querySelector(window.location.hash)?.scrollIntoView({ block: "center" });
  }
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

tagFilter.addEventListener("change", (event) => {
  state.tag = event.target.value;
  render();
});

document.querySelector("#random-button").addEventListener("click", chooseRandomSpecimen);
document.querySelector("#reset-filter").addEventListener("click", () => {
  state.query = "";
  state.tag = "";
  searchInput.value = "";
  tagFilter.value = "";
  render();
});

loadCatalog().catch((error) => {
  grid.replaceChildren(element("p", "empty-state", error.message));
  resultCount.textContent = "目录离线";
});

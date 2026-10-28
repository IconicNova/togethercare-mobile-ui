(() => {
  "use strict";
  const grid = document.getElementById("screen-grid");
  const search = document.getElementById("screen-search");
  const clearSearch = document.getElementById("clear-search");
  const emptyState = document.getElementById("empty-state");
  const count = document.getElementById("result-count");
  const loadError = document.getElementById("load-error");
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const dialog = document.getElementById("screen-viewer");
  const viewerImage = document.getElementById("viewer-image");
  const viewerTitle = document.getElementById("viewer-title");
  const viewerCategory = document.getElementById("viewer-category");
  const viewerPosition = document.getElementById("viewer-position");
  const openOriginal = document.getElementById("open-original");
  const download = document.getElementById("download-screen");
  let screens = [];
  let filtered = [];
  let activeFilter = "all";
  let activeScreen = null;
  let opener = null;

  const icon = (name) => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("icon"); svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#icon-" + name); svg.append(use); return svg;
  };
  function updateCount() { count.textContent = filtered.length + (filtered.length === 1 ? " preview" : " previews"); }
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    filtered = screens.filter(screen => (activeFilter === "all" || screen.category === activeFilter) &&
      (!query || [screen.title, screen.category, screen.keywords || "", screen.kind].join(" ").toLocaleLowerCase().includes(query)));
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < filtered.length; index++) {
      const screen = filtered[index];
      const figure = document.createElement("figure"); figure.className = "screen-card";
      const link = document.createElement("a"); link.className = "screen-link"; link.href = screen.file;
      link.setAttribute("aria-label", "View " + screen.title);
      const frame = document.createElement("span"); frame.className = "screen-image-wrap";
      const image = document.createElement("img"); image.className = "screen-image";
      image.src = screen.file; image.width = 824; image.height = 1830;
      image.alt = screen.title + " — TogetherCare mobile UI preview";
      image.loading = index < 4 ? "eager" : "lazy"; image.decoding = "async";
      frame.append(image); link.append(frame);
      const expand = document.createElement("span"); expand.className = "card-open"; expand.setAttribute("aria-hidden", "true"); expand.append(icon("expand")); link.append(expand);
      link.addEventListener("click", event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); opener = link; openScreen(screen.id);
      });
      const caption = document.createElement("figcaption"); caption.className = "card-caption";
      const category = document.createElement("span"); category.className = "card-category"; category.textContent = screen.category;
      const title = document.createElement("h3"); title.className = "card-title"; title.textContent = screen.title;
      caption.append(category, title);
      if (screen.kind !== "Screen") {
        const status = document.createElement("span"); status.className = "card-status" + (screen.kind === "Coming soon" ? " coming-soon" : "");
        status.textContent = screen.kind; caption.append(status);
      }
      figure.append(link, caption); fragment.append(figure);
    }
    grid.replaceChildren(fragment);
    emptyState.hidden = filtered.length !== 0;
    clearSearch.hidden = search.value.length === 0;
    updateCount();
  }
  function setFilter(value) {
    activeFilter = value;
    for (const button of filterButtons) {
      const active = button.dataset.filter === value;
      button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active));
    }
    render();
  }
  function activeCollection() { return filtered.some(screen => screen.id === activeScreen?.id) ? filtered : screens; }
  function setHash(id) {
    const next = new URL(location.href); next.hash = id ? "screen=" + encodeURIComponent(id) : "";
    history.replaceState(null, "", next.pathname + next.search + next.hash);
  }
  function openScreen(id, updateHash = true) {
    const screen = screens.find(item => item.id === id);
    if (!screen) return;
    activeScreen = screen;
    viewerTitle.textContent = screen.title; viewerCategory.textContent = screen.category;
    viewerImage.src = screen.file; viewerImage.alt = screen.title + " — TogetherCare mobile UI preview";
    openOriginal.href = screen.file; download.href = screen.file; download.download = screen.id + ".png";
    const list = activeCollection();
    viewerPosition.textContent = (list.findIndex(item => item.id === screen.id) + 1) + " / " + list.length;
    if (!dialog.open) { dialog.showModal(); document.body.classList.add("viewer-open"); }
    if (updateHash) setHash(id);
  }
  function closeScreen() { if (dialog.open) dialog.close(); }
  function move(direction) {
    if (!activeScreen) return;
    const list = activeCollection(); const index = list.findIndex(screen => screen.id === activeScreen.id);
    openScreen(list[(index + direction + list.length) % list.length].id);
  }
  function fromHash() {
    if (!location.hash.startsWith("#screen=")) { closeScreen(); return; }
    try {
      const id = decodeURIComponent(location.hash.slice(8));
      if (screens.some(screen => screen.id === id)) openScreen(id, false);
      else closeScreen();
    } catch { closeScreen(); }
  }
  search.addEventListener("input", render);
  clearSearch.addEventListener("click", () => { search.value = ""; render(); search.focus(); });
  filterButtons.forEach(button => button.addEventListener("click", () => setFilter(button.dataset.filter)));
  document.getElementById("reset-filters").addEventListener("click", () => { search.value = ""; setFilter("all"); search.focus(); });
  document.getElementById("close-viewer").addEventListener("click", closeScreen);
  document.getElementById("previous-screen").addEventListener("click", () => move(-1));
  document.getElementById("next-screen").addEventListener("click", () => move(1));
  dialog.addEventListener("click", event => { if (event.target === dialog) closeScreen(); });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Tab") {
      const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter(element => element.getClientRects().length > 0);
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first?.focus();
      }
      return;
    }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("viewer-open"); activeScreen = null;
    if (location.hash.startsWith("#screen=")) setHash(null);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  });
  window.addEventListener("hashchange", fromHash);
  fetch("./assets/screens.json")
    .then(response => { if (!response.ok) throw new Error("Screens unavailable"); return response.json(); })
    .then(data => {
      const allowedCategories = new Set(["Getting started", "PSW", "Client", "Family", "Support"]);
      if (!Array.isArray(data) || data.length !== 38 ||
          data.some(screen => !screen || !/^[a-z0-9-]+$/.test(screen.id) || typeof screen.title !== "string" ||
            !allowedCategories.has(screen.category) || !/^\.\/assets\/screenshots\/\d{2}-[a-z0-9-]+\.png$/.test(screen.file))) throw new Error("Invalid screen gallery");
      screens = data; render(); fromHash();
    })
    .catch(() => { loadError.hidden = false; count.textContent = "Unable to load previews"; });
})();


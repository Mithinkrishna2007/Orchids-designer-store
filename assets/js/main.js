/* ==========================================================================
   ORCHIDS — Site behaviour
   ========================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* ---------- Floating orchid details ---------- */
  /* Decorative only: the small orchid marks are non-interactive and are
     omitted for visitors who prefer reduced motion. */
  var compactMotionViewport = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;
  if ((!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: reduce)").matches) && !compactMotionViewport) {
    var orchidFall = document.createElement("div");
    orchidFall.className = "orchid-fall";
    orchidFall.setAttribute("aria-hidden", "true");
    [
      ["5%", "-8s", "28px", "13s", ".12"], ["16%", "-2s", "20px", "16s", ".10"],
      ["29%", "-12s", "34px", "18s", ".09"], ["43%", "-5s", "18px", "14s", ".13"],
      ["57%", "-15s", "30px", "17s", ".10"], ["69%", "-7s", "22px", "15s", ".12"],
      ["81%", "-11s", "38px", "19s", ".08"], ["94%", "-3s", "24px", "16s", ".11"]
    ].forEach(function (detail) {
      var petal = document.createElement("img");
      petal.src = "assets/images/logo/orchids-mark.svg";
      petal.alt = "";
      petal.className = "orchid-fall__petal";
      petal.style.setProperty("--x", detail[0]);
      petal.style.setProperty("--delay", detail[1]);
      petal.style.setProperty("--size", detail[2]);
      petal.style.setProperty("--duration", detail[3]);
      petal.style.setProperty("--opacity", detail[4]);
      orchidFall.appendChild(petal);
    });
    document.body.appendChild(orchidFall);
  }

  /* ---------- Branded loader ---------- */
  var loader = document.querySelector(".site-loader");
  var loaderShownAt = Date.now();
  function showLoader() {
    if (!loader) return;
    loaderShownAt = Date.now();
    loader.classList.remove("is-hidden");
    loader.setAttribute("aria-hidden", "false");
  }
  function hideLoader() {
    if (!loader) return;
    var remaining = Math.max(0, 420 - (Date.now() - loaderShownAt));
    window.setTimeout(function () {
      loader.classList.add("is-hidden");
      loader.setAttribute("aria-hidden", "true");
    }, remaining);
  }
  window.addEventListener("load", hideLoader);
  window.addEventListener("pageshow", hideLoader);

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target || link.hasAttribute("download")) return;
    var destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.protocol !== window.location.protocol) return;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
    event.preventDefault();
    showLoader();
    window.setTimeout(function () { window.location.assign(destination.href); }, 240);
  });

  var CFG = window.ORCHIDS_CONFIG || { whatsappNumber: "919384046656", defaultMessage: "Hello ORCHIDS!" };
  var CATS = window.ORCHIDS_CATEGORIES || {};
  var PRODUCTS = window.ORCHIDS_PRODUCTS || [];

  var ICON_WA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.4-4.2A8.5 8.5 0 1 1 20.5 11.7z"/><path d="M9 8.6c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.4.7 1 1.4 1.7 1.9.3.2.6.4.9.5.2.1.4 0 .5-.1l.6-.7c.2-.2.3-.2.6-.1l1.5.7c.2.1.4.2.4.4 0 .5-.2 1.2-.7 1.5-.5.4-1.2.5-1.9.3-1.4-.4-2.7-1.2-3.8-2.3-.9-.9-1.6-2-2-3.2-.2-.7-.1-1.5.3-2.1z"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function waLink(message) {
    return "https://wa.me/" + CFG.whatsappNumber + "?text=" + encodeURIComponent(message || CFG.defaultMessage);
  }
  function productMessage(name) {
    return "Hello ORCHIDS! I am interested in the " + name + ". Could you please share more details?";
  }
  function media(image, tone, label, alt, cls) {
    var imageMarkup = image ? '<img src="' + esc(image) + '" alt="' + esc(alt || label || "") + '" loading="lazy" decoding="async" onerror="this.remove()">' : "";
    var placeholderClass = image ? "" : " media--placeholder";
    var imageBackdrop = image && String(cls || "").indexOf("gallery-media") !== -1 ? ' style="--gallery-image:url(&quot;' + esc(image) + '&quot;)"' : "";
    return '<div class="media media--' + esc(tone || "terracotta") + placeholderClass + " " + (cls || "") + '" data-label="' + esc(label || "") + '"' + imageBackdrop + '>' +
      imageMarkup +
      "</div>";
  }
  window.ORCHIDS = { waLink: waLink, productMessage: productMessage };

  /* ---------- WhatsApp links ---------- */
  function bindWhatsApp(root) {
    (root || document).querySelectorAll("[data-wa]").forEach(function (a) {
      a.href = waLink(a.getAttribute("data-wa"));
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  /* ---------- Header / nav ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.querySelector(".nav__toggle");
  if (toggle) {
    function closeMenu() {
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    document.querySelectorAll(".nav__menu a").forEach(function (a) {
      a.addEventListener("click", function () {
        closeMenu();
      });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && document.body.classList.contains("nav-open")) closeMenu();
    });
  }

  /* ---------- Boutique navigation symbols ---------- */
  var navIconMarkup = {
    "Home": '<img src="assets/images/logo/orchids-mark.svg" alt="">'
  };
  document.querySelectorAll(".nav__links a").forEach(function (link) {
    var label = link.textContent.trim();
    if (!navIconMarkup[label] || link.querySelector(".nav__link-icon")) return;
    link.classList.add("nav__link--symbolic");
    link.innerHTML = '<span class="nav__link-icon" aria-hidden="true">' + navIconMarkup[label] + '</span><span class="nav__link-label">' + esc(label) + '</span>';
  });
  var navEnquiry = document.querySelector(".nav__menu .btn--dark");
  if (navEnquiry && !navEnquiry.classList.contains("nav__enquiry")) {
    navEnquiry.classList.add("nav__enquiry");
    navEnquiry.innerHTML = '<img src="assets/images/logo/orchids-mark.svg" alt="" aria-hidden="true"><span>WhatsApp Enquiry</span>';
  }

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Products ---------- */
  function productCard(p) {
    var tag = p.tags && p.tags.indexOf("new") > -1 ? "New Arrival" : (p.tags && p.tags.indexOf("exclusive") > -1 ? "Exclusive" : "");
    var cat = CATS[p.category] || "";
    return '<article class="pcard reveal">' +
      '<div class="pcard__media" role="button" tabindex="0" data-details="' + esc(p.id) + '" aria-label="View details of ' + esc(p.name) + '">' +
        (tag ? '<span class="pcard__tag">' + tag + "</span>" : "") +
        media(p.image, p.tone, cat, p.name + " — " + cat + " at ORCHIDS Designer Store, Coimbatore") +
        '<span class="pcard__quick">View Details</span>' +
      "</div>" +
      '<div class="pcard__body">' +
        '<span class="pcard__cat">' + esc(cat) + "</span>" +
        '<h3 class="pcard__name">' + esc(p.name) + "</h3>" +
        (p.description ? '<p class="pcard__desc">' + esc(p.description) + "</p>" : "") +
        '<div class="pcard__actions">' +
          '<button type="button" data-details="' + esc(p.id) + '">View Details</button>' +
          '<a data-wa="' + esc(productMessage(p.name)) + '" href="' + waLink(productMessage(p.name)) + '" target="_blank" rel="noopener" aria-label="Enquire on WhatsApp about ' + esc(p.name) + '">' + ICON_WA + "Enquire</a>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  document.querySelectorAll("[data-products]").forEach(function (grid) {
    var key = grid.getAttribute("data-products");
    var limit = parseInt(grid.getAttribute("data-limit"), 10) || Infinity;
    var list = PRODUCTS.filter(function (p) {
      if (key === "all") return true;
      if (CATS[key]) return p.category === key;
      return p.tags && p.tags.indexOf(key) > -1;
    }).slice(0, limit);
    grid.innerHTML = list.map(productCard).join("");
  });

  /* ---------- Collections page carousels ---------- */
  function collectionCarousel(grid) {
    var cards = Array.prototype.slice.call(grid.children);
    if (!cards.length || grid.closest(".collection-carousel")) return;

    var collectionKey = grid.getAttribute("data-products") || "pieces";
    var carousel = document.createElement("div");
    carousel.className = "collection-carousel collection-carousel--" + collectionKey;
    carousel.setAttribute("data-collection-path", collectionKey);
    var viewport = document.createElement("div");
    viewport.className = "collection-carousel__viewport";
    var controls = document.createElement("div");
    controls.className = "collection-carousel__controls";
    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "collection-carousel__button collection-carousel__button--prev";
    prev.setAttribute("aria-label", "Show previous pieces");
    prev.innerHTML = '<span aria-hidden="true">←</span>';
    var next = document.createElement("button");
    next.type = "button";
    next.className = "collection-carousel__button collection-carousel__button--next";
    next.setAttribute("aria-label", "Show next pieces");
    next.innerHTML = '<span aria-hidden="true">→</span>';

    var pathMap = {
      sarees: "M18 126 C150 24 286 220 430 116 S694 24 824 132 S1035 224 1180 90",
      kurtis: "M18 98 C150 196 278 22 424 126 S670 220 808 90 S1034 18 1180 142",
      ethnic: "M18 144 C154 44 276 208 424 104 S674 22 814 148 S1022 216 1180 82",
      new: "M18 104 C150 214 278 32 426 122 S676 210 816 92 S1028 34 1180 148",
      exclusive: "M18 126 C156 36 282 210 426 108 S676 30 814 136 S1020 212 1180 92"
    };
    var pathSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pathSvg.setAttribute("class", "collection-carousel__botanical");
    pathSvg.setAttribute("viewBox", "0 0 1200 250");
    pathSvg.setAttribute("preserveAspectRatio", "none");
    pathSvg.setAttribute("aria-hidden", "true");
    pathSvg.setAttribute("focusable", "false");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathMap[collectionKey] || pathMap.sarees);
    path.setAttribute("pathLength", "1");
    pathSvg.appendChild(path);
    [286, 604, 918].forEach(function (x, i) {
      var blossom = document.createElementNS("http://www.w3.org/2000/svg", "image");
      blossom.setAttribute("class", "collection-carousel__blossom collection-carousel__blossom--" + (i + 1));
      blossom.setAttribute("x", String(x - 14));
      blossom.setAttribute("y", i === 1 ? "82" : "114");
      blossom.setAttribute("width", "28");
      blossom.setAttribute("height", "28");
      blossom.setAttribute("href", "assets/images/logo/orchids-mark.svg");
      pathSvg.appendChild(blossom);
    });

    grid.parentNode.insertBefore(carousel, grid);
    carousel.appendChild(pathSvg);
    viewport.appendChild(grid);
    controls.appendChild(prev);
    controls.appendChild(next);
    carousel.appendChild(viewport);
    carousel.appendChild(controls);
    grid.classList.add("collection-carousel__track");

    var index = 0;
    function visibleCount() {
      if (window.matchMedia("(max-width: 560px)").matches) return 1;
      if (window.matchMedia("(max-width: 900px)").matches) return 2;
      return 4;
    }
    function update() {
      /* When a supplied collection has fewer than four photographs, enlarge
         the available cards rather than leaving an empty fourth-card gap. */
      var visible = Math.min(cards.length, visibleCount());
      var max = Math.max(0, cards.length - visible);
      index = Math.min(index, max);
      var gap = parseFloat(window.getComputedStyle(grid).gap) || 0;
      var cardWidth = (viewport.clientWidth - gap * (visible - 1)) / visible;
      cards.forEach(function (card) { card.style.flexBasis = cardWidth + "px"; });
      grid.style.transform = "translate3d(" + (-index * (cardWidth + gap)) + "px, 0, 0)";
      prev.disabled = index === 0;
      next.disabled = index >= max;
      carousel.classList.toggle("is-static", max === 0);
    }
    prev.addEventListener("click", function () { index = Math.max(0, index - 1); update(); });
    next.addEventListener("click", function () { index += 1; update(); });
    window.addEventListener("resize", update, { passive: true });
    update();
  }
  document.querySelectorAll(".collection-block .product-grid").forEach(collectionCarousel);

  /* ---------- Product modal ---------- */
  var modal = document.getElementById("product-modal");
  var lastFocus = null;
  function openModal(id) {
    var p = PRODUCTS.filter(function (x) { return x.id === id; })[0];
    if (!p || !modal) return;
    var cat = CATS[p.category] || "";
    modal.querySelector("[data-modal-media]").innerHTML = media(p.image, p.tone, cat, p.name);
    modal.querySelector("[data-modal-cat]").textContent = cat;
    modal.querySelector("[data-modal-title]").textContent = p.name;
    modal.querySelector("[data-modal-desc]").textContent = p.description || "";
    modal.querySelector("[data-modal-list]").innerHTML = (p.details || []).map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("");
    var wa = modal.querySelector("[data-modal-wa]");
    wa.href = waLink(productMessage(p.name));
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal__close").focus();
  }
  function closeModal() {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-details]");
    if (t) { openModal(t.getAttribute("data-details")); return; }
    if (e.target.closest("[data-close-modal]")) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal(); closeLightbox(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".pcard__media")) {
      e.preventDefault(); openModal(e.target.getAttribute("data-details"));
    }
  });

  /* ---------- Collections: sticky category nav ---------- */
  var catLinks = document.querySelectorAll(".cat-nav a");
  if (catLinks.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          catLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    document.querySelectorAll(".collection-block").forEach(function (s) { io.observe(s); });
  }

  /* ---------- Gallery ---------- */
  var gallery = document.getElementById("gallery-grid");
  var lightbox = document.getElementById("lightbox");
  var visibleItems = [];
  var current = 0;
  var gallerySet = [];
  var galleryStage = null;
  var renderGalleryFrame = null;
  if (gallery && window.ORCHIDS_GALLERY) {
    var GCATS = window.ORCHIDS_GALLERY_CATEGORIES || {};
    function galleryItemsFor(filter) {
      var seenImages = {};
      return window.ORCHIDS_GALLERY.filter(function (item) {
        if (!item || !item.image) return false;
        /* The All view is a concise four-photo introduction; each individual
           category supplies its own curated set of four photographs. */
        if (filter === "all" ? !item.featured : item.category !== filter) return false;
        if (seenImages[item.image]) return false;
        seenImages[item.image] = true;
        return true;
      });
    }
    gallery.innerHTML = '<div class="gallery-showcase" role="region" aria-roledescription="carousel" aria-label="ORCHIDS gallery">' +
      '<button type="button" class="gallery-showcase__button gallery-showcase__button--prev" aria-label="Show previous image">←</button>' +
      '<div class="gallery-showcase__frame" role="button" tabindex="0" aria-label="Open image in full view" aria-describedby="gallery-caption"></div>' +
      '<button type="button" class="gallery-showcase__button gallery-showcase__button--next" aria-label="Show next image">→</button>' +
      '<div class="gallery-showcase__meta" id="gallery-caption" aria-live="polite"><small></small><strong></strong><span class="gallery-showcase__count"></span></div>' +
    '</div>';

    gallerySet = galleryItemsFor("all");
    galleryStage = gallery.querySelector(".gallery-showcase__frame");
    var galleryMeta = gallery.querySelector(".gallery-showcase__meta");
    renderGalleryFrame = function (animate) {
      if (!gallerySet.length || !galleryStage) return;
      var g = gallerySet[current];
      if (animate) galleryStage.classList.add("is-changing");
      window.setTimeout(function () {
        galleryStage.innerHTML = media(g.image, g.tone, GCATS[g.category], g.caption + " — " + (GCATS[g.category] || "") + ", ORCHIDS Coimbatore", g.ratio + " gallery-media");
        galleryMeta.querySelector("small").textContent = GCATS[g.category] || "ORCHIDS Gallery";
        galleryMeta.querySelector("strong").textContent = g.caption;
        galleryMeta.querySelector(".gallery-showcase__count").textContent = (current + 1) + " / " + gallerySet.length;
        galleryStage.classList.remove("is-changing");
      }, animate ? 130 : 0);
    };
    renderGalleryFrame(false);

    var filterBtns = document.querySelectorAll("[data-filter]");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) { b.classList.toggle("is-active", b === btn); b.setAttribute("aria-pressed", b === btn); });
        gallerySet = galleryItemsFor(f);
        current = 0;
        renderGalleryFrame(true);
      });
    });

    gallery.querySelector(".gallery-showcase__button--prev").addEventListener("click", function () { step(-1); });
    gallery.querySelector(".gallery-showcase__button--next").addEventListener("click", function () { step(1); });
    galleryStage.addEventListener("click", function () {
      visibleItems = [];
      showSlide();
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lightbox.querySelector(".lightbox__close").focus();
    });
    galleryStage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });
    var showcaseStartX = null;
    galleryStage.addEventListener("touchstart", function (e) { showcaseStartX = e.touches[0].clientX; }, { passive: true });
    galleryStage.addEventListener("touchend", function (e) {
      if (showcaseStartX === null) return;
      var distance = e.changedTouches[0].clientX - showcaseStartX;
      if (Math.abs(distance) > 42) step(distance < 0 ? 1 : -1);
      showcaseStartX = null;
    });
  }
  function showSlide() {
    if (!lightbox || (!visibleItems.length && !gallerySet.length)) return;
    var g = gallerySet.length ? gallerySet[current] : window.ORCHIDS_GALLERY[+visibleItems[current].getAttribute("data-index")];
    var GCATS = window.ORCHIDS_GALLERY_CATEGORIES || {};
    lightbox.querySelector("[data-lb-stage]").innerHTML = media(g.image, g.tone, GCATS[g.category], g.caption, g.ratio + " gallery-media");
    lightbox.querySelector("[data-lb-cap]").textContent = g.caption;
    lightbox.querySelector("[data-lb-count]").textContent = (current + 1) + " / " + (gallerySet.length || visibleItems.length);
  }
  function step(d) {
    var total = gallerySet.length || visibleItems.length;
    if (!total) return;
    current = (current + d + total) % total;
    if (renderGalleryFrame) renderGalleryFrame(true);
    if (lightbox && lightbox.classList.contains("is-open")) showSlide();
  }
  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (galleryStage) galleryStage.focus();
    else if (visibleItems[current] && typeof visibleItems[current].focus === "function") visibleItems[current].focus();
  }
  if (lightbox) {
    lightbox.querySelector(".lightbox__prev").addEventListener("click", function () { step(-1); });
    lightbox.querySelector(".lightbox__next").addEventListener("click", function () { step(1); });
    lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
    var sx = null;
    lightbox.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      sx = null;
    });
  }

  /* ---------- Contact form → WhatsApp ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var lines = ["Hello ORCHIDS!"];
      if (d.get("name")) lines.push("My name is " + d.get("name") + ".");
      if (d.get("interest")) lines.push("I am interested in: " + d.get("interest") + ".");
      if (d.get("message")) lines.push(String(d.get("message")));
      if (d.get("phone")) lines.push("You can reach me on " + d.get("phone") + ".");
      lines.push("Could you please share more details?");
      window.open(waLink(lines.join("\n")), "_blank", "noopener");
    });
  }

  /* ---------- Reveal on scroll ---------- */
  bindWhatsApp();
  var compactViewport = compactMotionViewport;
  /* Give every major editorial group a quiet entrance without requiring a
     manual class on every page template. The selectors intentionally live
     inside <main>, so navigation and controls remain instantly available. */
  var autoRevealSelector = [
    "main .hero__grid > *",
    "main .page-hero__inner > *",
    "main .page-hero__banner",
    "main .section-head",
    "main .split > *",
    "main .intro-grid > *",
    "main .collection-feature > *",
    "main .service-row",
    "main .info-card",
    "main .gallery-strip > *",
    "main .gallery-showcase",
    "main .gallery-filters",
    "main .orchid-collection-card",
    "main .pcard"
  ].join(",");
  if (!compactViewport) {
    document.querySelectorAll(autoRevealSelector).forEach(function (el, index) {
      if (!el.classList.contains("reveal")) {
        el.classList.add("reveal", "reveal-auto");
        el.style.setProperty("--reveal-delay", (index % 4 * 0.11).toFixed(2) + "s");
      }
    });
  }
  var reveals = document.querySelectorAll(".reveal");
  if (compactViewport) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); ro.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -7% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Editorial scroll polish ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!compactViewport) {
  document.body.classList.add("motion-enhanced");
  var progress = document.createElement("div");
  progress.className = "scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = "<span></span>";
  document.body.appendChild(progress);
  var progressBar = progress.firstElementChild;

  var scrollTopButton = document.createElement("button");
  scrollTopButton.className = "scroll-top";
  scrollTopButton.type = "button";
  scrollTopButton.setAttribute("aria-label", "Back to top");
  scrollTopButton.innerHTML = '<span aria-hidden="true"></span>Top';
  document.body.appendChild(scrollTopButton);
  scrollTopButton.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  var depthMedia = Array.prototype.slice.call(document.querySelectorAll(".hero .media, .page-hero .media, .split__media .media, .collection-feature__media .media, .collection-banner .media"));
  depthMedia.forEach(function (item, index) {
    item.classList.add("scroll-depth");
    item.style.setProperty("--depth-factor", String(0.035 + (index % 3) * 0.012));
  });
  function updateEditorialScroll() {
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progressBar.style.transform = "scaleX(" + Math.min(1, window.scrollY / maxScroll) + ")";
    scrollTopButton.classList.toggle("is-visible", window.scrollY > 620);
    if (!reduceMotion && window.innerWidth > 760) {
      var midpoint = window.innerHeight / 2;
      depthMedia.forEach(function (item) {
        var rect = item.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var offset = (rect.top + rect.height / 2 - midpoint) * -parseFloat(item.style.getPropertyValue("--depth-factor"));
        item.style.setProperty("--scroll-depth", Math.max(-22, Math.min(22, offset)).toFixed(2) + "px");
      });
    }
  }
  var scrollQueued = false;
  window.addEventListener("scroll", function () {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(function () { updateEditorialScroll(); scrollQueued = false; });
  }, { passive: true });
  window.addEventListener("resize", updateEditorialScroll, { passive: true });
  updateEditorialScroll();

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) entry.target.classList.add("is-inview"); });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("main > .section, main > .page-hero, main > .hero").forEach(function (section) {
      section.classList.add("has-scroll-accent");
      sectionObserver.observe(section);
    });
  }
  }

  /* Honour #hash on collections page after dynamic render */
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(function () { target.scrollIntoView(); }, 60);
  }
})();

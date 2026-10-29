/* ============ ANIMACIONES (GSAP + ScrollTrigger + SplitText) ============ */
(() => {
  const root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    root.classList.remove("js-anim");
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const mm = gsap.matchMedia();
  let showNav = () => {};

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    document.fonts.ready.then(() => {
      heroIntro();
      root.classList.remove("js-anim");
      scrollScenes();
    });
    marquee();
    navAutoHide();
    if (canHover) { magnetic($(".hero .btn--primary")); productHover(); }
    document.addEventListener("km:add", flyToCart);
    return () => document.removeEventListener("km:add", flyToCart);
  });

  mm.add("(prefers-reduced-motion: reduce)", () => root.classList.remove("js-anim"));

  /* ---------- Logo: la rama se abre y las cerezas brotan ---------- */
  function heroIntro() {
    const logo = $("[data-logo]");
    const wingL = $(".logo-anim__wing--l", logo);
    const wingR = $(".logo-anim__wing--r", logo);
    const core = $(".logo-anim__core", logo);
    const cherries = $$(".logo-anim__cherry", logo);
    const dots = $$(".hero .dots circle");

    const h1 = $(".hero h1");
    const split = SplitText.create(h1, { type: "lines,words", mask: "lines" });
    gsap.set(h1, { autoAlpha: 1 });

    const tl = gsap.timeline({ delay: 0.15, onComplete: idle });

    // Texto
    tl.from(".hero .eyebrow", { autoAlpha: 0, y: 14, duration: 0.7, ease: "power3.out" }, 0)
      .from(split.words, { yPercent: 115, duration: 1.1, ease: "expo.out", stagger: 0.06 }, 0.1)
      .from(".hero .lead", { autoAlpha: 0, y: 20, duration: 0.9, ease: "power3.out" }, 0.55)
      .from(".hero__cta", { autoAlpha: 0, duration: 0.01 }, 0.7)
      .from(".hero__cta .btn", { y: 24, autoAlpha: 0, duration: 0.8, ease: "back.out(1.7)", stagger: 0.1 }, 0.7)
      .from(".hero__facts", { autoAlpha: 0, duration: 0.01 }, 0.95)
      .from(".hero__facts li", { y: 12, autoAlpha: 0, duration: 0.6, ease: "power2.out", stagger: 0.08 }, 0.95);

    // Logo
    tl.from(core, { autoAlpha: 0, scale: 0.3, duration: 0.8, ease: "back.out(1.6)" }, 0.1)
      .from(wingL, { autoAlpha: 0, rotation: 70, scale: 0.4, duration: 1.6, ease: "elastic.out(1, 0.55)" }, 0.3)
      .from(wingR, { autoAlpha: 0, rotation: -70, scale: 0.4, duration: 1.6, ease: "elastic.out(1, 0.55)" }, 0.38)
      .from(cherries, {
        autoAlpha: 0, scale: 0, y: -40,
        rotation: () => gsap.utils.random(-50, 50),
        duration: 0.9, ease: "back.out(2.8)",
        stagger: { each: 0.08, from: "center" },
      }, 0.7)
      .from(dots, {
        autoAlpha: 0, scale: 0, y: -10, transformOrigin: "50% 50%",
        duration: 0.5, ease: "back.out(3)", stagger: { each: 0.05, from: "center" },
      }, 1.25);

    // Respiración continua: hojas que se mecen y cerezas que laten
    function idle() {
      gsap.to(wingL, { rotation: 3, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      gsap.to(wingR, { rotation: -3, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.4 });
      gsap.to(core, { rotation: 1.2, duration: 4, ease: "sine.inOut", yoyo: true, repeat: -1 });
      cherries.forEach((c, i) =>
        gsap.to(c, { scale: 1.05, duration: gsap.utils.random(1.4, 2.2), ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.15 })
      );
      gsap.to(dots, { autoAlpha: 0.35, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: { each: 0.12, from: "center", yoyo: true } });
    }

    // Parallax por capas siguiendo el cursor
    if (canHover) {
      const hero = $(".hero");
      const layers = [[wingL, 8], [wingR, 8], [core, 12], ...cherries.map((c, i) => [c, 16 + (i % 3) * 4])].map(([el, d]) => ({
        d, x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }),
      }));
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        layers.forEach((l) => { l.x(nx * l.d * 2); l.y(ny * l.d * 2); });
      });
      hero.addEventListener("pointerleave", () => layers.forEach((l) => { l.x(0); l.y(0); }));
    }

    // Sacudir la rama: al tocar o al pasar el cursor
    let shaking = false;
    const shake = () => {
      if (shaking || tl.isActive()) return;
      shaking = true;
      gsap.timeline({ onComplete: () => (shaking = false) })
        .to([wingL, wingR], { scaleY: 0.9, duration: 0.12, ease: "power2.in" })
        .to([wingL, wingR], { scaleY: 1, duration: 0.9, ease: "elastic.out(1.2, 0.35)" })
        .to(cherries, {
          yPercent: -45, rotation: () => gsap.utils.random(-25, 25),
          duration: 0.28, ease: "power2.out", stagger: { each: 0.035, from: "random" },
        }, 0.05)
        .to(cherries, { yPercent: 0, rotation: 0, duration: 0.8, ease: "bounce.out", stagger: { each: 0.035, from: "random" } }, 0.35);
    };
    logo.addEventListener("click", shake);
    if (canHover) logo.addEventListener("pointerenter", shake);

    // Al bajar, el logo se aleja con profundidad
    gsap.to(".hero__art", {
      yPercent: 22, scale: 0.9, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__copy", {
      yPercent: 10, autoAlpha: 0.2, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true },
    });
  }

  /* ---------- Escenas al hacer scroll ---------- */
  function scrollScenes() {
    // Titulares de sección: líneas que suben desde una máscara
    $$(".section__head h2, .origin h2").forEach((h2) => {
      SplitText.create(h2, {
        type: "lines", mask: "lines", linesClass: "split-line", autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 1.1, ease: "expo.out", stagger: 0.1,
          scrollTrigger: { trigger: h2, start: "top 85%", once: true },
        }),
      });
    });
    $$(".section__head").forEach((head) => {
      gsap.from(head.querySelectorAll(".eyebrow, p:not(.eyebrow)"), {
        autoAlpha: 0, y: 18, duration: 0.8, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: head, start: "top 85%", once: true },
      });
    });

    // Productos: las tarjetas suben y las fundas aterrizan
    gsap.from(".product", {
      autoAlpha: 0, y: 90, duration: 1.2, ease: "power4.out", stagger: 0.15,
      scrollTrigger: { trigger: ".product-grid", start: "top 82%", once: true },
    });
    $$(".product__media img").forEach((img, i) => {
      gsap.from(img, {
        y: 60, rotation: i ? 8 : -8, scale: 0.85, duration: 1.4, ease: "elastic.out(1, 0.6)", delay: 0.25 + i * 0.15,
        scrollTrigger: { trigger: ".product-grid", start: "top 82%", once: true },
      });
      gsap.fromTo(img, { yPercent: 5 }, {
        yPercent: -5, ease: "none",
        scrollTrigger: { trigger: img.closest(".product"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    gsap.from(".product__specs li, .product__buy", {
      autoAlpha: 0, y: 12, duration: 0.6, ease: "power2.out", stagger: 0.05, delay: 0.5,
      scrollTrigger: { trigger: ".product-grid", start: "top 70%", once: true },
    });

    // Origen: la foto se abre como una ventana
    gsap.timeline({ scrollTrigger: { trigger: ".origin", start: "top 85%", end: "top 20%", scrub: 0.6 } })
      .fromTo(".origin__photo", { clipPath: "inset(18% 22% 18% 22% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none" }, 0)
      .fromTo(".origin__photo img", { scale: 1.35 }, { scale: 1, ease: "none" }, 0);
    gsap.from(".origin__copy > p, .origin__data > div", {
      autoAlpha: 0, y: 24, duration: 0.9, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: ".origin__copy", start: "top 75%", once: true },
    });

    // Galería: cada foto con su propia velocidad
    $$(".gallery img").forEach((img, i) => {
      gsap.fromTo(img, { scale: 1.25, yPercent: -8 * (i % 2 ? 1 : -1) }, {
        yPercent: 8 * (i % 2 ? 1 : -1), ease: "none",
        scrollTrigger: { trigger: ".gallery", start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Cafeterías
    gsap.from(".where__list li", {
      autoAlpha: 0, y: 40, rotation: () => gsap.utils.random(-6, 6), duration: 0.9, ease: "back.out(1.8)", stagger: 0.08,
      scrollTrigger: { trigger: ".where__list", start: "top 85%", once: true },
    });

    // Pasos
    gsap.from(".steps li", {
      autoAlpha: 0, y: 60, duration: 1, ease: "power4.out", stagger: 0.14,
      scrollTrigger: { trigger: ".steps", start: "top 82%", once: true },
    });
    gsap.from(".steps__n", {
      scale: 0, rotation: -120, duration: 0.8, ease: "back.out(3)", stagger: 0.14, delay: 0.25,
      scrollTrigger: { trigger: ".steps", start: "top 82%", once: true },
    });
    gsap.from(".how__cta .btn", {
      autoAlpha: 0, scale: 0.8, duration: 0.8, ease: "back.out(2.5)",
      scrollTrigger: { trigger: ".how__cta", start: "top 92%", once: true },
    });

    // Pie
    gsap.from(".footer__brand img", {
      rotation: -25, scale: 0.6, autoAlpha: 0, duration: 1.2, ease: "elastic.out(1, 0.5)",
      scrollTrigger: { trigger: ".footer", start: "top 90%", once: true },
    });

    addEventListener("load", () => ScrollTrigger.refresh());
  }

  /* ---------- Cinta: se acelera con la velocidad del scroll ---------- */
  function marquee() {
    const loop = gsap.to(".strip__track", { xPercent: -50, ease: "none", duration: 30, repeat: -1 });
    loop.totalTime(loop.duration() * 100); // margen para poder ir en reversa
    let dir = 1;
    ScrollTrigger.create({
      onUpdate(self) {
        dir = self.direction;
        const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 350, 5);
        gsap.timeline({ overwrite: true })
          .to(loop, { timeScale: dir * boost, duration: 0.2 })
          .to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out" });
      },
    });
  }

  /* ---------- Nav: se esconde al bajar y vuelve al subir ---------- */

  function navAutoHide() {
    const nav = $(".nav");
    const to = gsap.quickTo(nav, "yPercent", { duration: 0.4, ease: "power3.out" });
    showNav = () => to(0);
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => to(self.direction === 1 && self.scroll() > 400 ? -100 : 0),
    });
  }

  /* ---------- Botón magnético ---------- */
  function magnetic(el) {
    if (!el) return;
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3);
      y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener("pointerleave", () => { x(0); y(0); });
  }

  /* ---------- Hover en las fundas ---------- */
  function productHover() {
    $$(".product").forEach((card, i) => {
      const img = $(".product__media img", card);
      card.addEventListener("pointerenter", () => gsap.to(img, { scale: 1.06, rotation: i ? 2 : -2, duration: 0.6, ease: "power3.out" }));
      card.addEventListener("pointerleave", () => gsap.to(img, { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" }));
    });
  }

  /* ---------- La funda vuela al carrito ---------- */
  function flyToCart(e) {
    const src = e.detail.img;
    const bar = $("[data-mobile-bar]");
    const mobile = innerWidth <= 680 && !bar.hidden;
    if (!mobile) showNav();
    const target = mobile ? $(".btn", bar) : $(".cart-btn");
    const count = mobile ? $("[data-cart-total]", bar) : $(".cart-btn__count");
    const a = src.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const w = 64, h = w * (src.naturalHeight / src.naturalWidth || 1.4);

    const clone = new Image();
    clone.src = src.currentSrc || src.src;
    clone.className = "fly-bag";
    clone.alt = "";
    document.body.append(clone);
    gsap.set(clone, { left: 0, top: 0, x: a.left + a.width / 2 - w / 2, y: a.top + a.height / 2 - h / 2, scale: 1.6 });

    gsap.timeline({ onComplete: () => clone.remove() })
      .to(clone, { x: b.left + b.width / 2 - w / 2, duration: 0.85, ease: "power1.inOut" }, 0)
      .to(clone, { y: b.top + b.height / 2 - h / 2, duration: 0.85, ease: "back.in(1.8)" }, 0)
      .to(clone, { scale: 0.2, rotation: 300, duration: 0.85, ease: "power2.in" }, 0)
      .to(clone, { autoAlpha: 0, duration: 0.12 }, 0.75)
      .fromTo(count, { scale: 1 }, { scale: 1.45, duration: 0.16, ease: "power2.out", yoyo: true, repeat: 1 }, 0.78)
      .fromTo(target, { rotation: 0 }, { keyframes: { rotation: [0, -8, 6, -3, 0] }, duration: 0.5, ease: "none" }, 0.8);
  }
})();

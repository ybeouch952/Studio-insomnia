/* ============================================================
   INSOMNIA STUDIO — main.js
   Script partagé par toutes les pages. Chaque module vérifie
   la présence de ses éléments : rien ne casse si une page ne
   les contient pas.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE_NAV = window.matchMedia("(max-width: 1180px)");

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ── Année du footer ── */
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ── Header : état « scrollé » ── */
  var header = $("#site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── Apparition au scroll ── */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ── Compteurs animés ── */
  function countUp(el) {
    var target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    var prefix = el.dataset.prefix || "";
    if (reduceMotion) { el.textContent = prefix + target; return; }
    var duration = 1400;
    var start = performance.now();
    (function step(now) {
      var p = Math.min((now - start) / duration, 1);
      el.textContent = prefix + Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  var counters = $$("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { countUp(entry.target); countObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* ── Menu (burger sous 1180px) ── */
  var toggle = $("#menu-toggle");
  var nav = $("#nav-menu");
  if (toggle && nav) {
    var isOpen = function () { return document.body.classList.contains("nav-open"); };
    var syncInert = function () {
      // Sur mobile, le menu fermé est retiré de la tabulation et des lecteurs d'écran
      var hide = MOBILE_NAV.matches && !isOpen();
      nav.inert = hide;
      if (hide) nav.setAttribute("aria-hidden", "true"); else nav.removeAttribute("aria-hidden");
    };
    var setOpen = function (open) {
      document.body.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      syncInert();
      if (open) { var first = $("a", nav); if (first) first.focus({ preventScroll: true }); }
    };
    toggle.addEventListener("click", function () { setOpen(!isOpen()); });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { if (isOpen()) setOpen(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (isOpen() && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    var onBreakpoint = function () { if (!MOBILE_NAV.matches && isOpen()) setOpen(false); syncInert(); };
    if (MOBILE_NAV.addEventListener) MOBILE_NAV.addEventListener("change", onBreakpoint);
    else MOBILE_NAV.addListener(onBreakpoint);
    syncInert();

    /* Lien actif selon la section visible (page d'accueil uniquement) */
    var spyLinks = $$("a[href^='#']", nav);
    if ("IntersectionObserver" in window && spyLinks.length) {
      var spyObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          spyLinks.forEach(function (link) {
            var active = link.getAttribute("href") === "#" + entry.target.id;
            link.classList.toggle("active", active);
            if (active) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
          });
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      $$("main section[id]").forEach(function (s) { spyObs.observe(s); });
    }
  }

  /* ── Dialogues : fermeture par bouton / clic sur le fond ── */
  function wireDialog(dialog) {
    $$("[data-close]", dialog).forEach(function (btn) {
      btn.addEventListener("click", function () { dialog.close(); });
    });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog) dialog.close();
    });
  }
  var canDialog = typeof HTMLDialogElement === "function";

  /* ── Visionneuse d'images (galerie, artistes) ── */
  var lightbox = $("#lightbox");
  if (lightbox && canDialog) {
    wireDialog(lightbox);
    var lbImg = $("#lightbox-img", lightbox);
    var lbCap = $("#lightbox-caption", lightbox);
    var lbPrev = $(".lightbox-prev", lightbox);
    var lbNext = $(".lightbox-next", lightbox);
    var group = [];
    var index = 0;

    var show = function (i) {
      index = (i + group.length) % group.length;
      var img = group[index];
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt + (group.length > 1 ? "  ·  " + (index + 1) + " / " + group.length : "");
    };
    var multi = function (on) { lbPrev.hidden = !on; lbNext.hidden = !on; };

    $$("[data-lightbox-group]").forEach(function (container) {
      var imgs = $$("img", container);
      imgs.forEach(function (img, i) {
        img.tabIndex = 0;
        img.setAttribute("role", "button");
        img.setAttribute("aria-label", "Agrandir : " + (img.alt || "image"));
        img.classList.add("is-zoomable");
        var open = function () {
          group = imgs;
          multi(imgs.length > 1);
          show(i);
          lightbox.showModal();
        };
        img.addEventListener("click", open);
        img.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
        });
      });
    });

    lbPrev.addEventListener("click", function () { show(index - 1); });
    lbNext.addEventListener("click", function () { show(index + 1); });
    lightbox.addEventListener("keydown", function (e) {
      if (group.length < 2) return;
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
    var touchX = null;
    lightbox.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener("touchend", function (e) {
      if (touchX === null || group.length < 2) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(dx > 0 ? index - 1 : index + 1);
      touchX = null;
    });
    lightbox.addEventListener("close", function () { lbImg.removeAttribute("src"); });
  }

  /* ── Modale équipe ── */
  var teamModal = $("#team-modal");
  if (teamModal && canDialog) {
    wireDialog(teamModal);
    $$(".team-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var photo = $("#modal-photo", teamModal);
        photo.src = card.dataset.photo || "";
        photo.alt = card.dataset.name || "";
        // textContent : aucune injection HTML possible depuis les attributs
        $("#modal-name", teamModal).textContent = card.dataset.name || "";
        $("#modal-role", teamModal).textContent = card.dataset.role || "";
        $("#modal-desc", teamModal).textContent = card.dataset.desc || "";
        teamModal.showModal();
      });
    });
  }

  /* ── Formulaire de contact (Formspree) ── */
  var form = $("#contact-form");
  if (form && window.fetch) {
    var msg = $("#form-message", form);
    var btn = $("button[type='submit']", form);
    var btnLabel = btn.textContent;
    var fields = $$("input:not([type=hidden]):not([name=_gotcha]), textarea", form);

    var setStatus = function (type, text) {
      msg.className = "form-message" + (type ? " is-" + type : "");
      msg.textContent = text;
    };
    var describe = function (field) {
      if (field.validity.valueMissing) return "Ce champ est obligatoire.";
      if (field.validity.typeMismatch) return "L'adresse email semble incorrecte.";
      if (field.validity.tooShort) return "Message trop court (" + field.minLength + " caractères minimum).";
      if (field.validity.tooLong) return "Texte trop long.";
      return "";
    };
    fields.forEach(function (f) {
      f.addEventListener("input", function () {
        if (f.getAttribute("aria-invalid") === "true" && f.checkValidity()) f.removeAttribute("aria-invalid");
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // Supprime les espaces superflus avant validation
      fields.forEach(function (f) { f.value = f.value.trim(); });
      var firstInvalid = null;
      fields.forEach(function (f) {
        var ok = f.checkValidity();
        if (ok) f.removeAttribute("aria-invalid"); else f.setAttribute("aria-invalid", "true");
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        setStatus("error", describe(firstInvalid));
        firstInvalid.focus();
        return;
      }
      // Anti-spam : champ invisible rempli = robot (on simule un succès)
      if (form.elements._gotcha && form.elements._gotcha.value) {
        setStatus("success", "Merci ! Nous vous répondrons rapidement.");
        form.reset();
        return;
      }

      btn.disabled = true;
      btn.textContent = "Envoi…";
      setStatus("", "");
      var ctrl = "AbortController" in window ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (res) {
          if (res.ok) {
            setStatus("success", "Merci ! Votre message est bien parti, nous vous répondrons rapidement.");
            form.reset();
            return;
          }
          return res.json().catch(function () { return null; }).then(function (data) {
            var detail = data && Array.isArray(data.errors)
              ? data.errors.map(function (err) { return String(err.message || ""); }).join(" ")
              : "";
            setStatus("error", "L'envoi a échoué. " + (detail ? detail + " " : "") + "Vous pouvez aussi nous écrire par WhatsApp ou email.");
          });
        })
        .catch(function () {
          setStatus("error", "Connexion impossible. Réessayez, ou contactez-nous par WhatsApp ou email.");
        })
        .then(function () {
          if (timer) clearTimeout(timer);
          btn.disabled = false;
          btn.textContent = btnLabel;
        });
    });
  }

  /* ── Spotify : repli si le lecteur ne charge pas ──
     Le lecteur est en loading="lazy" : le délai ne démarre qu'une fois la
     section visible. En cas d'échec (bloqueur, réseau), on masque le cadre
     vide ; le bouton « Ouvrir la playlist » reste disponible. */
  var spotify = $("#spotify-embed");
  if (spotify) {
    var container = spotify.parentNode;
    var loaded = false;
    spotify.addEventListener("load", function () { loaded = true; container.classList.add("is-loaded"); });
    var startTimer = function () {
      setTimeout(function () { if (!loaded) container.hidden = true; }, 12000);
    };
    if ("IntersectionObserver" in window) {
      var spObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { spObs.disconnect(); startTimer(); }
      });
      spObs.observe(container);
    } else {
      startTimer();
    }
  }
})();

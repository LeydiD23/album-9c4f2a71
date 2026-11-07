/* =========================================================
   Carta romántica · interacciones
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------- barra de progreso ---------- */
  const scrollBar = $("#scrollBar");

  function updateScrollProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    if (scrollBar) scrollBar.style.width = `${progress}%`;
  }

  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);
  updateScrollProgress();

  /* ---------- navegación activa ---------- */
  const navLinks = $$(".dot-nav__link");
  const sections = $$("[data-section]");

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.dataset.nav === id);
          });
        });
      },
      { rootMargin: "-42% 0px -48% 0px", threshold: 0 }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  /* ---------- animaciones al hacer scroll ---------- */
  $$(".gallery__item").forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index * 70, 350)}ms`;
  });

  const revealItems = $$(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ---------- pétalos ---------- */
  const petalLayer = $("#petals");

  if (petalLayer && !reduceMotion) {
    const total = window.innerWidth < 700 ? 10 : 18;

    for (let i = 0; i < total; i += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.style.setProperty("--x", `${Math.random() * 100}%`);
      petal.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
      petal.style.setProperty("--duration", `${14 + Math.random() * 14}s`);
      petal.style.setProperty("--delay", `${-Math.random() * 24}s`);
      petal.style.setProperty("--scale", `${0.55 + Math.random() * 1.05}`);
      petal.style.setProperty("--rotate", `${Math.random() * 360}deg`);
      petalLayer.appendChild(petal);
    }
  }

  /* ---------- toast ---------- */
  const toast = $("#toast");
  let toastTimer;

  function showToast(message, duration = 3400) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, duration);
  }

  /* ---------- lightbox de recuerdos ---------- */
  const lightbox = $("#lightbox");
  const lightboxMedia = $("#lightboxMedia");
  const lightboxCaption = $("#lightboxCaption");
  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");
  const photoCards = $$(".photo-card");
  let currentPhoto = 0;
  let lastFocused = null;

  function renderPhoto(index) {
    if (!photoCards.length || !lightboxMedia) return;
    currentPhoto = (index + photoCards.length) % photoCards.length;
    const card = photoCards[currentPhoto];
    const media = $(".photo-placeholder, img", card);

    lightboxMedia.innerHTML = "";
    if (media) lightboxMedia.appendChild(media.cloneNode(true));
    if (lightboxCaption) {
      lightboxCaption.textContent = card.dataset.caption || "";
    }
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    renderPhoto(index);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
    if (lastFocused) lastFocused.focus();
  }

  photoCards.forEach((card, index) => {
    card.addEventListener("click", () => openLightbox(index));
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => renderPhoto(currentPhoto - 1));
  if (lightboxNext) lightboxNext.addEventListener("click", () => renderPhoto(currentPhoto + 1));

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") renderPhoto(currentPhoto - 1);
    if (event.key === "ArrowRight") renderPhoto(currentPhoto + 1);
  });

  /* ---------- reproductor ---------- */
  const audio = $("#audio");
  const player = $("#player");
  const playBtn = $("#playBtn");
  const rewindBtn = $("#rewind");
  const forwardBtn = $("#forward");
  const seek = $("#seek");
  const volume = $("#volume");
  const currentTimeLabel = $("#currentTime");
  const durationLabel = $("#duration");
  const playerStatus = $("#playerStatus");
  const playerTitle = $("#playerTitle");
  const playerArtist = $("#playerArtist");
  const drawBtn = $("#drawSong");
  const specificAudio = $("#specificAudio");
  const specificPlay = $("#specificPlay");
  const specificStatus = $("#specificStatus");

  const songs = [
    { title: "Adoro", artist: "Armando Manzanero", src: "musica/adoro-armando-manzanero.mp3" },
    { title: "El amor", artist: "José Luis Perales", src: "musica/el-amor-jose-luis-perales.mp3" },
    { title: "Almohada", artist: "José José", src: "musica/almohada-jose-jose.mp3" },
    { title: "Mi vida sin tu amor", artist: "Cristian Castro", src: "musica/mi-vida-sin-tu-amor-cristian-castro.mp3" },
    { title: "Por amarte así", artist: "Cristian Castro", src: "musica/por-amarte-asi-cristian-castro.mp3" },
    { title: "Tú de qué vas", artist: "Franco de Vita", src: "musica/tu-de-que-vas-franco-de-vita.mp3" },
    { title: "Qué pasará mañana", artist: "José Luis Perales", src: "musica/que-pasara-manana-jose-luis-perales.mp3" },
    { title: "Quiero perderme contigo", artist: "José José", src: "musica/quiero-perderme-contigo-jose-jose.mp3" },
    { title: "La más bella herejía", artist: "Braulio", src: "musica/la-mas-bella-herejia-braulio.mp3" },
    { title: "Derroche", artist: "Ana Belén", src: "musica/derroche-ana-belen.mp3" }
  ];

  let currentSong = -1;
  let lastSong = -1;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function setRangeProgress(input, percent) {
    if (!input) return;
    input.style.setProperty("--progress", `${Math.max(0, Math.min(100, percent))}%`);
  }

  function resetTimeline() {
    if (seek) {
      seek.value = "0";
      setRangeProgress(seek, 0);
    }
    if (currentTimeLabel) currentTimeLabel.textContent = "0:00";
    if (durationLabel) durationLabel.textContent = "0:00";
  }

  function updateTimeline() {
    if (!audio || !seek) return;
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const percent = duration > 0 ? (audio.currentTime / duration) * 100 : 0;

    seek.value = String(percent);
    setRangeProgress(seek, percent);

    if (currentTimeLabel) currentTimeLabel.textContent = formatTime(audio.currentTime);
    if (durationLabel) durationLabel.textContent = formatTime(duration);
  }

  function markAudioPending() {
    const song = currentSong >= 0 ? songs[currentSong] : null;
    if (playerStatus) {
      playerStatus.innerHTML = song
        ? `Falta agregar <code>${song.src}</code> en la carpeta musica.`
        : "Falta agregar las canciones de la tómbola en la carpeta musica.";
    }
    showToast(song ? "Aún falta agregar esa canción en la carpeta musica" : "Aún faltan las canciones en la carpeta musica");
  }

  function markSpecificPending() {
    if (specificStatus) {
      specificStatus.innerHTML = "Falta agregar <code>musica/a-donde-vamos-morat.mp3</code>.";
    }
    showToast("Aún falta agregar la canción específica en la carpeta musica");
  }

  function drawSong() {
    if (!songs.length || !audio) return;

    const pool = songs.length > 1
      ? songs.map((song, index) => index).filter((index) => index !== lastSong)
      : [0];
    const index = pool[Math.floor(Math.random() * pool.length)];
    const song = songs[index];

    currentSong = index;
    lastSong = index;

    audio.pause();
    audio.preload = "metadata";
    audio.src = song.src;
    resetTimeline();
    if (player) player.classList.remove("is-playing");

    if (playerTitle) playerTitle.textContent = song.title;
    if (playerArtist) playerArtist.textContent = song.artist;
    if (playerStatus) playerStatus.textContent = `Salió «${song.title}». Pulsa play para escucharla.`;
    audio.load();
  }

  if (audio) {
    audio.addEventListener("loadedmetadata", () => {
      if (durationLabel) durationLabel.textContent = formatTime(audio.duration);
      if (playerStatus && currentSong >= 0) {
        playerStatus.textContent = `«${songs[currentSong].title}» lista para reproducir.`;
      }
    });

    audio.addEventListener("timeupdate", updateTimeline);
    audio.addEventListener("play", () => {
      if (player) player.classList.add("is-playing");
      if (specificAudio && !specificAudio.paused) specificAudio.pause();
    });
    audio.addEventListener("pause", () => player && player.classList.remove("is-playing"));
    audio.addEventListener("ended", () => {
      if (player) player.classList.remove("is-playing");
      updateTimeline();
    });

    audio.addEventListener("error", markAudioPending);
  }

  if (drawBtn) {
    drawBtn.addEventListener("click", drawSong);
  }

  if (playBtn && audio) {
    playBtn.addEventListener("click", async () => {
      if (currentSong < 0) {
        showToast("Primero saca una canción de la tómbola.");
        return;
      }

      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (error) {
        markAudioPending();
      }
    });
  }

  if (specificPlay && specificAudio) {
    specificPlay.addEventListener("click", async () => {
      try {
        if (specificAudio.paused) {
          if (audio && !audio.paused) audio.pause();
          await specificAudio.play();
        } else {
          specificAudio.pause();
        }
      } catch (error) {
        markSpecificPending();
      }
    });

    specificAudio.addEventListener("play", () => {
      specificPlay.classList.add("is-playing");
      if (specificStatus) specificStatus.textContent = "Tu canción está sonando.";
      if (audio && !audio.paused) audio.pause();
    });

    specificAudio.addEventListener("pause", () => {
      specificPlay.classList.remove("is-playing");
      if (specificStatus && specificAudio.currentTime > 0) {
        specificStatus.textContent = "Tu canción en pausa.";
      }
    });

    specificAudio.addEventListener("ended", () => {
      specificPlay.classList.remove("is-playing");
      if (specificStatus) specificStatus.textContent = "Tu canción terminó. Puedes volver a ponerla cuando quieras.";
    });

    specificAudio.addEventListener("error", markSpecificPending);
  }

  if (seek && audio) {
    seek.addEventListener("input", () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (duration > 0) {
        audio.currentTime = (Number(seek.value) / 100) * duration;
      }
      setRangeProgress(seek, Number(seek.value));
      updateTimeline();
    });
  }

  if (volume && audio) {
    const initialVolume = Number(volume.value);
    audio.volume = initialVolume;
    if (specificAudio) specificAudio.volume = initialVolume;
    setRangeProgress(volume, initialVolume * 100);

    volume.addEventListener("input", () => {
      const nextVolume = Number(volume.value);
      audio.volume = nextVolume;
      if (specificAudio) specificAudio.volume = nextVolume;
      setRangeProgress(volume, nextVolume * 100);
    });
  }

  if (rewindBtn && audio) {
    rewindBtn.addEventListener("click", () => {
      audio.currentTime = Math.max(0, audio.currentTime - 10);
      updateTimeline();
    });
  }

  if (forwardBtn && audio) {
    forwardBtn.addEventListener("click", () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      audio.currentTime = Math.min(duration || audio.currentTime + 10, audio.currentTime + 10);
      updateTimeline();
    });
  }

  resetTimeline();
  updateTimeline();

  /* ---------- carta dentro del sobre ---------- */
  const envelopeStage = $("#envelopeStage");
  const envelopeButton = $("#envelopeButton");
  const envelopeHint = $("#envelopeHint");
  const letterOverlay = $("#letterOverlay");
  const letterClose = $("#letterClose");
  const letterBackdrop = $("#letterBackdrop");
  const letterPaper = letterOverlay ? $(".letter-paper", letterOverlay) : null;
  let letterOpen = false;
  let letterAutoOpened = false;
  let letterAutoTimer;
  let letterCloseTimer;

  function setLetterOrigin() {
    if (!envelopeButton || !letterPaper) return;

    const envelopeRect = envelopeButton.getBoundingClientRect();
    const paperWidth = Math.min(760, window.innerWidth * 0.92);
    const scale = Math.max(0.4, Math.min(1, envelopeRect.width / paperWidth));
    const x = envelopeRect.left + envelopeRect.width / 2 - window.innerWidth / 2;
    const y = envelopeRect.top + envelopeRect.height / 2 - window.innerHeight / 2;

    letterPaper.style.setProperty("--letter-from-x", `${x}px`);
    letterPaper.style.setProperty("--letter-from-y", `${y}px`);
    letterPaper.style.setProperty("--letter-from-scale", scale.toFixed(3));
  }

  function openLetter() {
    if (!letterOverlay || letterOpen) return;

    letterOpen = true;
    window.clearTimeout(letterAutoTimer);
    window.clearTimeout(letterCloseTimer);
    setLetterOrigin();

    if (envelopeButton) {
      envelopeButton.classList.add("is-open");
      envelopeButton.setAttribute("aria-expanded", "true");
    }

    letterOverlay.classList.remove("is-closing");
    letterOverlay.classList.add("is-open");
    letterOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("letter-open");

    if (letterPaper) letterPaper.scrollTop = 0;
    if (envelopeHint) {
      envelopeHint.textContent = "La carta está abierta. Al cerrarla podrás seguir deslizando.";
    }

    window.setTimeout(() => {
      if (letterClose) letterClose.focus({ preventScroll: true });
    }, 60);
  }

  function closeLetter() {
    if (!letterOverlay || !letterOpen) return;

    letterOpen = false;
    window.clearTimeout(letterCloseTimer);
    letterOverlay.classList.add("is-closing");

    letterCloseTimer = window.setTimeout(() => {
      letterOverlay.classList.remove("is-open", "is-closing");
      letterOverlay.setAttribute("aria-hidden", "true");
      document.body.classList.remove("letter-open");
      if (envelopeHint) {
        envelopeHint.textContent = "Puedes abrirla de nuevo tocando el sobre.";
      }
      if (envelopeButton) {
        envelopeButton.setAttribute("aria-expanded", "false");
        envelopeButton.focus({ preventScroll: true });
      }
    }, reduceMotion ? 20 : 420);
  }

  if (envelopeButton) {
    envelopeButton.setAttribute("aria-controls", "letterOverlay");
    envelopeButton.setAttribute("aria-expanded", "false");
    envelopeButton.addEventListener("click", openLetter);
  }

  if (letterClose) letterClose.addEventListener("click", closeLetter);
  if (letterBackdrop) letterBackdrop.addEventListener("click", closeLetter);

  if (letterOverlay) {
    letterOverlay.addEventListener("click", (event) => {
      if (event.target === letterOverlay) closeLetter();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!letterOpen && !letterOverlay?.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLetter();
      return;
    }

    if (event.key === "Tab" && letterOverlay) {
      const focusables = $$(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        letterOverlay
      ).filter((element) => !element.disabled && element.offsetParent !== null);

      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  if (envelopeStage && letterOverlay && "IntersectionObserver" in window) {
    const letterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || letterAutoOpened) return;
          letterAutoOpened = true;
          letterObserver.disconnect();
          letterAutoTimer = window.setTimeout(openLetter, reduceMotion ? 150 : 700);
        });
      },
      { threshold: 0.55 }
    );

    letterObserver.observe(envelopeStage);
  }

  /* ---------- secreto final ---------- */
  const secretButton = $("#secretButton");
  const secretNote = $("#secretNote");

  if (secretButton && secretNote) {
    secretButton.setAttribute("aria-expanded", "false");
    secretButton.setAttribute("aria-controls", "secretNote");

    secretButton.addEventListener("click", () => {
      const isOpen = secretNote.classList.toggle("is-open");
      secretButton.setAttribute("aria-expanded", String(isOpen));
      secretButton.textContent = isOpen ? "Guardar el secreto otra vez" : "¿Quieres saber un secreto?";
    });
  }
})();

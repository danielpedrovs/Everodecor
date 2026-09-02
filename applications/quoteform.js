
import { sendLeadEmail } from "./emailService.js";


document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("quoteForm");

  if (!form) return;


  const steps =
    [...document.querySelectorAll(".quote-step")];

  const nextButtons =
    document.querySelectorAll(".quote-next");

  const backButtons =
    document.querySelectorAll(".quote-back");

  const successBox =
    document.getElementById("quoteSuccess");

  const errorBox =
    document.getElementById("quoteError");

  const photoInput =
    document.getElementById("photos");

  const photoPreview =
    document.getElementById("photoPreview");


  let currentStep = 1;


  /* ═══════════════════════════════════
     STEP MANAGEMENT
  ═══════════════════════════════════ */

  function showStep(stepNumber) {

    currentStep = stepNumber;

    steps.forEach(step => {

      step.classList.toggle(
        "active",
        Number(step.dataset.step) === stepNumber
      );

    });

  }


  /* ═══════════════════════════════════
     VALIDATION
  ═══════════════════════════════════ */

  function validateStep(stepNumber) {

    const step =
      document.querySelector(
        `.quote-step[data-step="${stepNumber}"]`
      );

    if (!step) return true;


    const fields =
      step.querySelectorAll(
        "input[required], select[required], textarea[required]"
      );


    for (const field of fields) {

      if (!field.checkValidity()) {

        field.reportValidity();

        return false;
      }

    }

    return true;
  }


  /* ═══════════════════════════════════
     NEXT BUTTON
  ═══════════════════════════════════ */

  nextButtons.forEach(button => {

    button.addEventListener("click", () => {

      if (!validateStep(currentStep)) {
        return;
      }


      if (currentStep < 3) {

        showStep(currentStep + 1);

      }

    });

  });


  /* ═══════════════════════════════════
     BACK BUTTON
  ═══════════════════════════════════ */

  backButtons.forEach(button => {

    button.addEventListener("click", () => {

      if (currentStep > 1) {

        showStep(currentStep - 1);

      }

    });

  });


  /* ═══════════════════════════════════
     PHOTO PREVIEW
  ═══════════════════════════════════ */

  if (photoInput) {

    photoInput.addEventListener("change", () => {

      photoPreview.innerHTML = "";

      const files =
        [...photoInput.files];


      if (files.length > 5) {

        alert(
          "Please select a maximum of 5 photos."
        );

        photoInput.value = "";

        return;
      }


      files.forEach(file => {

        if (!file.type.startsWith("image/")) {
          return;
        }


        const reader =
          new FileReader();


        reader.onload = event => {

          const img =
            document.createElement("img");

          img.src =
            event.target.result;

          img.alt =
            "Selected project photo";

          photoPreview.appendChild(img);

        };


        reader.readAsDataURL(file);

      });

    });

  }


  /* ═══════════════════════════════════
     SEND EMAIL
  ═══════════════════════════════════ */

  form.addEventListener("submit", async event => {

    event.preventDefault();


    /* Validate current step */

    if (!validateStep(3)) {
      return;
    }


    /* ═════════════════════════════════
       ANTI-SPAM HONEYPOT
    ═════════════════════════════════ */

    const honeypot =
      document.getElementById("website");


    if (
      honeypot &&
      honeypot.value.trim() !== ""
    ) {

      console.warn(
        "Spam submission blocked."
      );

      return;
    }


    /* ═════════════════════════════════
       SUBMIT BUTTON
    ═════════════════════════════════ */

    const submitButton =
      form.querySelector(".quote-submit");


    const originalText =
      submitButton.textContent;


    submitButton.disabled = true;

    submitButton.textContent =
      "Sending enquiry...";


    /* ═════════════════════════════════
       COLLECT FORM DATA
    ═════════════════════════════════ */

    const formData =
      new FormData(form);


    const contactData = {

      /* Customer */

      name:
        formData.get("name")?.trim() ||
        "Not provided",

      phone:
        formData.get("phone")?.trim() ||
        "Not provided",

      email:
        formData.get("email")?.trim() ||
        "Not provided",


      /* Property */

      postcode:
        formData.get("postcode")?.trim() ||
        "Not provided",


      /* Project */

      service:
        formData.get("service") ||
        "Not provided",

      projectSize:
        formData.get("projectSize") ||
        "Not provided",

      timeframe:
        formData.get("timeframe") ||
        "Not provided",


      /* Description */

      message:
        formData.get("message")?.trim() ||
        "No message provided"

    };


    /* ═════════════════════════════════
       SEND THROUGH EMAIL SERVICE
    ═════════════════════════════════ */

    try {

      await sendLeadEmail(contactData);


      /* ═══════════════════════════════
         SUCCESS
      ═══════════════════════════════ */

      form.reset();

      photoPreview.innerHTML = "";


      steps.forEach(step => {

        step.classList.remove("active");

      });


      successBox.classList.add("show");

      errorBox.classList.remove("show");


    } catch (error) {

      /* ═══════════════════════════════
         ERROR
      ═══════════════════════════════ */

      console.error(
        "Failed to send quote enquiry:",
        error
      );


      errorBox.classList.add("show");

      successBox.classList.remove("show");


      submitButton.disabled = false;

      submitButton.textContent =
        originalText;

    }

  });


  /* ═══════════════════════════════════
     NEW ENQUIRY
  ═══════════════════════════════════ */

  const newQuote =
    document.getElementById("newQuote");


  if (newQuote) {

    newQuote.addEventListener(
      "click",
      () => {

        successBox.classList.remove("show");

        errorBox.classList.remove("show");


        /* Reset to step 1 */

        showStep(1);

      }
    );

  }


  /* ═══════════════════════════════════
     INITIAL STATE
  ═══════════════════════════════════ */

  showStep(1);

});

function initCarousel({ name, speed = 0.4, step = 320 }) {
  const track = document.querySelector(`[data-carousel="${name}"]`);
  const inner = track.querySelector(':scope > div');
  const prevBtn = document.querySelector(`[data-carousel-prev="${name}"]`);
  const nextBtn = document.querySelector(`[data-carousel-next="${name}"]`);

  let pos = 0;
  let paused = false;
  let resumeTimer = null;
  const halfWidth = inner.scrollWidth / 2; // half = one full set of images (before duplicate)

  function tick() {
    if (!paused) {
      pos -= speed;
      if (Math.abs(pos) >= halfWidth) pos = 0; // seamless loop reset
      inner.style.transform = `translateX(${pos}px)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function nudge(direction) {
    pos += direction * -step;
    if (pos > 0) pos -= halfWidth;
    if (Math.abs(pos) >= halfWidth) pos = 0;
    inner.style.transform = `translateX(${pos}px)`;

    paused = true;
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => { paused = false; }, 1200); // resume autoplay after a short pause
  }

  prevBtn?.addEventListener('click', () => nudge(-1));
  nextBtn?.addEventListener('click', () => nudge(1));

  track.addEventListener('mouseenter', () => paused = true);
  track.addEventListener('mouseleave', () => {
    clearTimeout(resumeTimer);
    paused = false;
  });
}

initCarousel({ name: 'main',  speed: 0.35, step: 320 }); // main gallery: slow
initCarousel({ name: 'testi', speed: 0.5,  step: 320 }); // testimonials: slightly faster, or match as you like

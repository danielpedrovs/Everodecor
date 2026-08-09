
const SERVICE_ID  = "service_j3b2g7z";
const TEMPLATE_ID = "template_0oxez2w";
const PUBLIC_KEY  = "EF280Wc-PnadD_T0V";

let initialized = false;


/* ═══════════════════════════════════════
   INITIALISE EMAILJS
═══════════════════════════════════════ */

function ensureInit() {

  if (!initialized && window.emailjs) {

    window.emailjs.init(PUBLIC_KEY);

    initialized = true;
  }

}


/* ═══════════════════════════════════════
   SEND QUOTE / LEAD EMAIL
═══════════════════════════════════════ */

export function sendLeadEmail(contactData) {

  ensureInit();


  if (!window.emailjs) {

    console.error(
      "EmailJS not loaded — check the EmailJS script tag."
    );

    return Promise.reject(
      new Error("EmailJS is not loaded.")
    );

  }


  const templateParams = {

    /* Customer */

    name:
      contactData.name || "Not provided",

    phone:
      contactData.phone || "Not provided",

    email:
      contactData.email || "Not provided",


    /* Property */

    postcode:
      contactData.postcode || "Not provided",


    /* Project */

    service:
      contactData.service || "Not provided",

    projectSize:
      contactData.projectSize || "Not provided",

    timeframe:
      contactData.timeframe || "Not provided",


    /* Description */

    message:
      contactData.message || "No message provided",


    /* Date */

    date:
      new Date().toLocaleString(
        "en-GB",
        {
          timeZone: "Europe/London"
        }
      )

  };


  return window.emailjs
    .send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams
    )

    .then(response => {

      console.log(
        "Quote enquiry sent successfully:",
        response.status,
        response.text
      );

      return response;

    })

    .catch(error => {

      console.error(
        "Failed to send quote enquiry:",
        error
      );

      throw error;

    });

}


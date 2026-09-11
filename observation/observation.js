class Observation {
  constructor(page) {
    this.url = page.url();
    this.title = null;
    this.text = null;

    this.headings = [];

    this.links = [];
    this.buttons = [];
    this.inputs = [];
    this.interactives = [];
  }

  async collect(page) {
    this.url = page.url();
    this.title = await page.title();
    this.headings = await page
    .locator("h1, h2, h3")
    .allTextContents();

    this.headings = this.headings
    .map(text => text.trim())
    .filter(Boolean);
    this.text = await page.locator("body").innerText();

    // Limpiamos IDs de observaciones anteriores
    await page.locator("[data-many-id]").evaluateAll(elements => {
      elements.forEach(element => {
        element.removeAttribute("data-many-id");
      });
    });

    let nextId = 1;

    // LINKS
    this.links = await page.locator("a").evaluateAll(
      (links, startId) => {
        let id = startId;

        return links
          .map(link => {
            const text = link.innerText.trim();

            // Ignoramos links sin texto
            if (!text) {
              return null;
            }

            const currentId = id++;

            link.setAttribute("data-many-id", currentId);

            return {
              id: currentId,
              type: "link",
              text,
              href: link.href
            };
          })
          .filter(Boolean);
      },
      nextId
    );

    nextId += this.links.length;

    // BUTTONS
    this.buttons = await page.locator("button").evaluateAll(
      (buttons, startId) => {
        let id = startId;

        return buttons
          .map(button => {
            const text = button.innerText.trim();

            if (!text) {
              return null;
            }

            const currentId = id++;

            button.setAttribute("data-many-id", currentId);

            return {
              id: currentId,
              type: "button",
              text
            };
          })
          .filter(Boolean);
      },
      nextId
    );

    nextId += this.buttons.length;

    // INPUTS
    this.inputs = await page.locator("input").evaluateAll(
      (inputs, startId) => {
        let id = startId;

        return inputs.map(input => {
          const currentId = id++;

          input.setAttribute("data-many-id", currentId);

          return {
            id: currentId,
            type: "input",
            inputType: input.type,
            name: input.name,
            placeholder: input.placeholder
          };
        });
      },
      nextId
    );

    this.interactives = [
      ...this.links,
      ...this.buttons,
      ...this.inputs
    ];
  }

  show() {
    console.log("OBSERVATION");
    console.log("============");

    console.log(`URL: ${this.url}`);
    console.log(`Title: ${this.title}`);

    console.log("\nTEXT:");
    console.log(this.text.substring(0, 500));

    console.log("\nINTERACTIVES:");

    this.interactives.forEach(element => {
      console.log(
        `[${element.id}] ${element.type.toUpperCase()}`,
        element
      );
    });
  }
}

module.exports = Observation;
import fs from "fs";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import * as chromedriver from "chromedriver";

function resolveChromeBinary() {
     const candidates = [
          process.env.CHROME_BIN,
          process.env.CHROME_PATH,
          "/usr/bin/google-chrome-stable",
          "/usr/bin/google-chrome",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
     ];

     return candidates.find((path) => path && fs.existsSync(path));
}

async function runTest() {
     chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

     const chromeBinary = resolveChromeBinary();
     const options = new chrome.Options()
          .headless()
          .addArguments("--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=1280,1024");

     if (chromeBinary) {
          options.setChromeBinaryPath(chromeBinary);
     }

     const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

     try {
          const baseUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:4173/login";
          await driver.get(baseUrl);

          await driver.wait(
               until.elementLocated(By.css('input[placeholder="Ingresa tu usuario"]')),
               10000,
          );
          await driver.wait(
               until.elementLocated(By.css('input[placeholder="Ingresa tu contraseña"]')),
               10000,
          );

          const usernameInput = await driver.findElement(By.css('input[placeholder="Ingresa tu usuario"]'));
          const passwordInput = await driver.findElement(By.css('input[placeholder="Ingresa tu contraseña"]'));
          const submitButton = await driver.findElement(By.css('button[type="submit"]'));

          if (!usernameInput || !passwordInput || !submitButton) {
               throw new Error("No se encontró el formulario de login en /login");
          }

          const submitText = await submitButton.getText();
          if (!submitText.includes("Iniciar Sesión")) {
               throw new Error(`Texto de botón incorrecto: ${submitText}`);
          }

          console.log("Selenium smoke test: /login carga correctamente y el formulario está disponible.");
     } finally {
          await driver.quit();
     }
}

runTest().catch((error) => {
     console.error(error);
     process.exit(1);
});

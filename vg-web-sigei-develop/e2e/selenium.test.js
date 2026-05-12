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
     const chromeBinary = resolveChromeBinary();
     if (!chromeBinary) {
          throw new Error(
               "Chrome/Chromium binary no encontrado. Establece CHROME_BIN o instala Chrome/Chromium en el runner. " +
               "Rutas intentadas: CHROME_BIN, CHROME_PATH, /usr/bin/google-chrome-stable, /usr/bin/google-chrome, /usr/bin/chromium, /usr/bin/chromium-browser",
          );
     }

     console.log(`Usando binario de Chrome/Chromium en: ${chromeBinary}`);

     const options = new chrome.Options();
     options.addArguments(
          "--headless=new",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--window-size=1280,1024",
     );

     options.setChromeBinaryPath(chromeBinary);

     const driver = await new Builder()
          .forBrowser("chrome")
          .setChromeOptions(options)
          .setChromeService(new chrome.ServiceBuilder(chromedriver.path))
          .build();

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

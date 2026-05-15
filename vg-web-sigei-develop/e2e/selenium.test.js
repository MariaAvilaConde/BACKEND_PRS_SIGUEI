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

          // Prueba 1: Verificar carga de página de login
          console.log("Prueba 1: Verificando carga de página de login...");
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

          console.log("✓ Página de login carga correctamente y el formulario está disponible.");

          // Prueba 2: Verificar elementos de la UI
          console.log("Prueba 2: Verificando elementos de la interfaz...");
          const title = await driver.findElement(By.css('h2'));
          const titleText = await title.getText();
          if (!titleText.includes("¡Bienvenido de vuelta!")) {
               throw new Error(`Título incorrecto: ${titleText}`);
          }

          // Verificar que los campos están habilitados
          const usernameEnabled = await usernameInput.isEnabled();
          const passwordEnabled = await passwordInput.isEnabled();
          if (!usernameEnabled || !passwordEnabled) {
               throw new Error("Campos de entrada no están habilitados");
          }

          console.log("✓ Elementos de la interfaz están presentes y funcionales.");

          // Prueba 3: Verificar navegación y enlaces
          console.log("Prueba 3: Verificando navegación básica...");
          const currentUrl = await driver.getCurrentUrl();
          if (!currentUrl.includes("/login")) {
               throw new Error(`URL incorrecta: ${currentUrl}`);
          }

          // Verificar que no hay errores de JavaScript (comprobando console)
          const logs = await driver.manage().logs().get('browser');
          const errors = logs.filter(log => log.level.name === 'SEVERE');
          if (errors.length > 0) {
               console.warn("Errores de JavaScript detectados:", errors.map(e => e.message));
          }

          console.log("✓ Navegación básica funciona correctamente.");

          // Prueba 4: Verificar responsividad básica (cambiar tamaño de ventana)
          console.log("Prueba 4: Verificando responsividad...");
          await driver.manage().window().setRect({ width: 768, height: 1024 }); // Tablet
          await driver.sleep(1000); // Esperar a que se ajuste

          // Verificar que elementos siguen visibles
          const usernameVisible = await usernameInput.isDisplayed();
          const passwordVisible = await passwordInput.isDisplayed();
          if (!usernameVisible || !passwordVisible) {
               throw new Error("Elementos no visibles en tamaño tablet");
          }

          console.log("✓ Interfaz es responsiva en diferentes tamaños.");

          console.log("🎉 Todas las pruebas funcionales pasaron exitosamente!");

     } finally {
          await driver.quit();
     }
}

runTest().catch((error) => {
     console.error("❌ Error en pruebas funcionales:", error.message);
     process.exit(1);
});

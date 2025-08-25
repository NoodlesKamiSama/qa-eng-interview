const { defineConfig } = require("cypress");
const { allureCypress } = require("allure-cypress/reporter");

module.exports = defineConfig({
    blockHosts: ["*.zopim.com", "*.zendesk.com", "*.zdassets.com"],
    downloadsFolder: "downloads",
    fixturesFolder: "cypress/fixtures",
    screenshotsFolder: "screenshots", 
    videosFolder: "videos",
    numTestsKeptInMemory: 20,
    viewportHeight: 1080,
    viewportWidth: 1920,
    chromeWebSecurity: false,
    retries: {
      runMode: 2,
      openMode: 0
    },
    pageLoadTimeout: 60 * 1000,
    requestTimeout: 10000,
    e2e: {
      setupNodeEvents(on, config) {
        allureCypress(on, config, {
          resultsDir: "../cypress/reports/allure-results",
        environmentInfo: {
          platform: config.platform,
          nodeVersion: config.resolvedNodeVersion,
          cypressVersion: config.version,
          baseUrl: config.baseUrl,
        },
        videoOnFailOnly: true,
        stepsFromCommands: {
          maxArgumentLength: 64,
          maxArgumentDepth: 5,
        },
      });
        return config;
      },
      baseUrl: "https://beautifulslides-staging.appspot.com",
      testIsolation: false
    }
});

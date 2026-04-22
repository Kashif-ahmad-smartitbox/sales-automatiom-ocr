// craco.config.js
const path = require("path");
require("dotenv").config();

// Check if we're in development/preview mode (not production build)
// Craco sets NODE_ENV=development for start, NODE_ENV=production for build
const isDevServer = process.env.NODE_ENV !== "production";

// Environment variable overrides
const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
  enableVisualEdits: isDevServer, // Only enable during dev server
};

// Conditionally load visual edits modules only in dev mode
let setupDevServer;
let babelMetadataPlugin;

if (config.enableVisualEdits) {
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        (warning) =>
          warning?.module?.resource?.includes(`${path.sep}node_modules${path.sep}pdfmake${path.sep}build${path.sep}pdfmake.js`) &&
          typeof warning?.message === "string" &&
          warning.message.includes("Failed to parse source map"),
      ];

      // pdfmake ships a sourcemap reference CRA/source-map-loader cannot parse.
      // Excluding that package removes the noisy warning without changing runtime behavior.
      webpackConfig.module.rules.forEach((rule) => {
        if (!Array.isArray(rule.oneOf)) return;

        rule.oneOf.forEach((oneOfRule) => {
          if (
            oneOfRule.enforce === "pre" &&
            oneOfRule.use &&
            oneOfRule.use.some(
              (loaderConfig) =>
                typeof loaderConfig === "object" &&
                loaderConfig.loader &&
                loaderConfig.loader.includes("source-map-loader"),
            )
          ) {
            const currentExclude = Array.isArray(oneOfRule.exclude)
              ? oneOfRule.exclude
              : oneOfRule.exclude
                ? [oneOfRule.exclude]
                : [];

            oneOfRule.exclude = [
              ...currentExclude,
              /node_modules[\\/]pdfmake[\\/]/,
            ];
          }
        });
      });

      // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
        ],
      };

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

// Only add babel metadata plugin during dev server
if (config.enableVisualEdits && babelMetadataPlugin) {
  webpackConfig.babel = {
    plugins: [babelMetadataPlugin],
  };
}

webpackConfig.devServer = (devServerConfig) => {
  // Apply visual edits dev server setup only if enabled
  if (config.enableVisualEdits && setupDevServer) {
    devServerConfig = setupDevServer(devServerConfig);
  }

  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  return devServerConfig;
};

module.exports = webpackConfig;

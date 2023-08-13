module.exports = {
  env: {
    browser: false,
    mocha: true,
    node: true,
  },
  extends: [
    "standard",
    "plugin:node/recommended",
    "plugin:prettier/recommended",
  ],
  parserOptions: {
    ecmaVersion: 15,
  },
  globals: {
    hre: true,
  },
  overrides: [
    {
      files: ["hardhat.config.js"],
      globals: { task: true },
    },
    {
      files: ["scripts/**"],
      rules: { "no-process-exit": "off" },
    },
    {
      files: ["hardhat.config.js", "scripts/**", "source/**", "test/**"],
      rules: {
        "no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
        "node/no-unpublished-require": ["off"],
        "node/no-extraneous-require": ["off"],
      },
    },
  ],
  rules: {
    camelcase: ["off"],
  },
};

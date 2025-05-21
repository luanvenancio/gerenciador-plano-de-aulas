import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2022, 
      sourceType: "module", 
      globals: {
        ...globals.node,
      },
    },

  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended, 
  {
    rules: {
      "no-console": "off", 
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    ignores: [
        "node_modules/",
        "dist/",
        "coverage/",
        "prisma/generated/", 
        "*.generated.ts",
        ".env",
        "*.log"
    ],
  }
];
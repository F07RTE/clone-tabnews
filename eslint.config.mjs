import babelEslintParser from "@babel/eslint-parser";
import babelPresetReact from "@babel/preset-react";
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      parser: babelEslintParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [babelPresetReact],
        },
      },
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {},
  },
  {
    ignores: [".next/"],
  },
];

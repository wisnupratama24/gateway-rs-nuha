import globals from "globals";
import pluginJs from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import stylisticJs from "@stylistic/eslint-plugin-js";

export default [
	{
		files: ["**/*.js"],
		languageOptions: { sourceType: "commonjs", globals: { ...globals.node, ...globals.browser }},
	},
	{
		ignores: ["helpers/env/envConfig.js", "generateJsConfig.js", "aliases.js", "eslint.config.mjs"],
	},
	pluginJs.configs.recommended,
	{
		plugins: {
			prettier, // Include the Prettier plugin
			"@stylistic/js": stylisticJs,
		},
		rules: {
			"prettier/prettier": ["error"], // Apply Prettier formatting as ESLint errors
			camelcase: "off", // Disable camelcase rule if you prefer
			"no-useless-catch": "off",
			"no-extra-boolean-cast": "off",
			eqeqeq: ["error", "always"],
			"@stylistic/js/space-infix-ops": ["error", { int32Hint: true }],
			"@stylistic/js/comma-spacing": ["error", { before: false, after: true }],
			"@stylistic/js/keyword-spacing": ["error", { before: true, after: true }],
			"@stylistic/js/brace-style": ["error", "1tbs", { allowSingleLine: true }],
			"no-duplicate-imports": "error",
			"@stylistic/js/no-floating-decimal": "error",
			"no-label-var": "error",
			"no-lone-blocks": "error",
			"@stylistic/js/no-multi-spaces": "error",
			"no-return-assign": "error",
			"no-undef-init": "error",
			"no-useless-rename": "error",
			"@stylistic/js/rest-spread-spacing": ["error", "never"],
			"@stylistic/js/space-before-blocks": "error",
			yoda: "error"
			// "no-unused-vars": "off",
		},
	},
	prettierConfig,
];

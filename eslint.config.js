import { defineConfig, globalIgnores } from 'eslint/config'

import tsParser from '@typescript-eslint/parser'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import svelteEslint from 'eslint-plugin-svelte'
import parser from 'svelte-eslint-parser'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import js from '@eslint/js'

import { FlatCompat } from '@eslint/eslintrc'

export default defineConfig([
    {
        files: ['**/*.ts'],
        plugins: {
            js,
            ts: typescriptEslint,
        },
        extends: ['js/recommended', 'ts/recommended', prettier],
        rules: {
            'no-unused-vars': 'off',
            'ts/no-unused-vars': [
                'error',
                {
                    args: 'all',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
        },
        languageOptions: {
            parser: tsParser,
            sourceType: 'module',
            ecmaVersion: 2020,

            parserOptions: {
                extraFileExtensions: ['.svelte'],
            },

            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
    },
    {
        files: ['**/*.svelte'],
        plugins: {
            svelte: svelteEslint,
        },
        extends: ['svelte/recommended'],
        rules: {
            'svelte/no-at-html-tags': 'off',
        },
        languageOptions: {
            parser: parser,

            parserOptions: {
                parser: '@typescript-eslint/parser',
            },
        },
    },
    globalIgnores([
        '**/.DS_Store',
        '**/node_modules',
        '.*/',
        'build',
        '**/.env',
        '**/.env.*',
        '**/pnpm-lock.yaml',
        '**/package-lock.json',
        '**/yarn.lock',
    ]),
])

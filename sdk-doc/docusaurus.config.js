// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Arena Documentation',
  tagline: 'Choose the toll',
  favicon: 'img/favicon.ico',
  url: 'https://your-docusaurus-test-site.com',
  baseUrl: '/',
  organizationName: 'facebook',
  projectName: 'docusaurus',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      "docusaurus-preset-openapi",
      /** @type {import('docusaurus-preset-openapi').Options} */
      {
        api: {
          path: "apiv3.json",
          routeBasePath: "/api",
        },
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          routeBasePath: "/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/arena-logo.svg',
      navbar: {
        logo: {
          alt: 'Arena Logo',
          src: 'img/arena-logo.svg',
        },
        items: [
          {
            href: 'https://github.com/stationfy/arena-chat-sdk',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ItoCook',
  description: 'Internal office kitchen coordination platform — Azubi-Projekt · ITO Consult GmbH',
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: 'Overview', link: '/overview/what-is-itocook' },
      { text: 'Architecture', link: '/architecture/system-overview' },
      { text: 'Features', link: '/features/cook-queue' },
      { text: 'Notifications', link: '/features/notifications' },
      { text: 'Screens', link: '/screens/home' },
      { text: 'Design System', link: '/design/colors' },
      { text: 'Deployment', link: '/overview/deployment' },
      { text: 'Roadmap', link: '/roadmap' },
    ],
    sidebar: {
      '/overview/': [
        {
          text: 'Overview',
          items: [
            { text: 'What is ItoCook', link: '/overview/what-is-itocook' },
            { text: 'Tech Stack', link: '/overview/tech-stack' },
            { text: 'Project Status', link: '/overview/status' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'System Overview', link: '/architecture/system-overview' },
            { text: 'Database Schema', link: '/architecture/schema' },
            { text: 'Data Flows', link: '/architecture/data-flows' },
          ],
        },
      ],
      '/features/': [
        {
          text: 'Features',
          items: [
            { text: 'Cook Queue', link: '/features/cook-queue' },
            { text: 'Recipe System', link: '/features/recipe-system' },
            { text: 'Finance & Balance', link: '/features/finance' },
            { text: 'Duty Schedule', link: '/features/duty' },
            { text: 'Shopping List', link: '/features/shopping-list' },
            { text: 'Auth & Security', link: '/features/auth-flow' },
            { text: 'Notifications & Push', link: '/features/notifications' },
          ],
        },
      ],
      '/screens/': [
        {
          text: 'Screens',
          items: [
            { text: 'Home & Kitchen', link: '/screens/home' },
            { text: 'Cook Panel', link: '/screens/cook-panel' },
            { text: 'Recipe System', link: '/screens/recipes' },
            { text: 'Finance', link: '/screens/finance' },
            { text: 'Duty', link: '/screens/duty' },
            { text: 'Shopping List', link: '/screens/shopping-list' },
          ],
        },
      ],
      '/design/': [
        {
          text: 'Design System',
          items: [
            { text: 'Colors & Typography', link: '/design/colors' },
            { text: 'Components', link: '/design/components' },
          ],
        },
      ],
    },
    footer: {
      message: 'ItoCook — Azubi-Projekt · ITO Consult GmbH · 2025–2026',
    },
  },
})

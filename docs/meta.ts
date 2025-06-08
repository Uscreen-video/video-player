export default {
  components: {
    'Hero': './docs/components/Hero.astro',
    'Header': './docs/components/Header.astro'
  },
  sidebar: [
    {
      label: 'Introduction', link: '/intro'
    },
    {
      label: 'Guides',
      autogenerate: { directory: 'guides' },
    },
    {
      label: 'Reference',
      autogenerate: { directory: 'reference' },
    },
  ]
}

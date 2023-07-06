declare module '*?inline' {
  const Stylesheet: string
  export = Stylesheet
}

declare module '*?url' {
  const S: string
  export = S
}

declare module '*?raw' {
  const S: string
  export = S
}

declare module 'hls.js/dist/hls.light.min.js' {
  import type Hls from 'hls.js'

  export = Hls
}

declare module 'mux-embed' {
  type M = {
    monitor: (element: HTMLElement | string, props: Record<string, any>) => void,
    utils: any
  }

  export = M
}

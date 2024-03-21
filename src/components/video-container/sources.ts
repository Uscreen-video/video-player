import { State } from "../../types";

export const sourcesController = (video: HTMLVideoElement) => {
  const sources = Array.from(video.querySelectorAll("source"));

  const supportedSource = sources.find((s) => video.canPlayType(s.type));

  const activeSource = supportedSource || sources[0];

  return {
    allSources: (): State["sources"] =>
      sources.map((s) => ({
        type: s.type,
        src: s.src || s.getAttribute("data-src"),
      })),
    isSourceSupported: () => !!supportedSource,
    getSrc: () => activeSource.src || activeSource.getAttribute("data-src"),
    enableSource: () => {
      activeSource.src =
        activeSource.src || activeSource.getAttribute("data-src");
    },
    isLazy: () => !activeSource.src,
  };
};

export type SourcesController = ReturnType<typeof sourcesController>;

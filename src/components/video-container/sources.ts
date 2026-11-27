import { State } from "../../types";

export const sourcesController = (
  video: HTMLVideoElement,
  sourcesParent: Element = video,
) => {
  const sources = Array.from(sourcesParent.querySelectorAll("source"));

  const supportedSource = sources.find((s) => video.canPlayType(s.type));

  const activeSource = supportedSource || sources[0];

  const videoHasNoSources = sourcesParent !== video;

  const getSrc = () =>
    activeSource.src || activeSource.getAttribute("data-src");

  return {
    allSources: (): State["sources"] =>
      sources.map((s) => ({
        type: s.type,
        src: s.src || s.getAttribute("data-src"),
      })),
    isSourceSupported: () => !!supportedSource,
    getSrc,
    enableSource: () => {
      activeSource.src = getSrc();
    },
    attachNative: () => {
      if (videoHasNoSources) video.src = getSrc();
    },
    reloadNative: () => {
      if (videoHasNoSources) video.src = getSrc();
      else video.load();
    },
    isLazy: () => !activeSource.src,
  };
};

export type SourcesController = ReturnType<typeof sourcesController>;

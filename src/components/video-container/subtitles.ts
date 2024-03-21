import { dispatch, Types } from "../../state";
import { VideoContainer } from "./Video-container.component";
import { mapCueListToState } from "../../helpers/cue";
import type Hls from "hls.js";
import _debug from "debug";

const subtitlesDebug = _debug("player:subtitles");

/**
 * Util to manage vide text tracks
 */
const videoTextTtracksManager = (video: HTMLVideoElement, hls: Hls) => {
  const trackElements = Array.from(video.querySelectorAll("track"));
  const langToSrcMapping = trackElements.reduce<Record<string, string>>(
    (acc, t) => {
      acc[t.srclang] = t.src;
      return acc;
    },
    {},
  );

  const isTrackNative = (track: TextTrack) =>
    !!trackElements.find(
      (t) => t.label === track.label && t.srclang === track.language,
    );

  const getTracks = (): TextTrack[] => {
    const textTracks = Array.from(video.textTracks);
    const hasNonNative = textTracks.length > trackElements.length;
    /**
     * If non native track presented
     * we need to return only non native tracks
     */
    return hasNonNative
      ? textTracks.filter((t) => !isTrackNative(t))
      : textTracks;
  };

  const tracksToStoreState = () => ({
    textTracks: getTracks().map((t) => ({
      src: langToSrcMapping[t.language] || "",
      lang: t.language || t.label,
      label: t.label,
    })),
  });

  const showTracks = (lang: string) => {
    if (hls) {
      hls.subtitleTracks.forEach((t) => {
        const tLang = t.lang || t.name;
        if (tLang === lang) {
          hls.subtitleTrack = t.id;
          hls.subtitleDisplay = true;
        }
      });
    }
    getTracks().forEach((t) => {
      if (isTrackNative(t)) {
        t.mode = "hidden";
        return;
      }
      const tLang = t.language || t.label;
      if (tLang === lang) {
        t.mode = "showing";
      } else {
        t.mode = "hidden";
      }
    });
  };

  return {
    getTracks,
    tracksToStoreState,
    showTracks,
    isTrackNative,
  };
};

export const subtitlesController = (
  host: VideoContainer,
  video: HTMLVideoElement,
  hls: Hls,
  defaultTextTrack?: string,
) => {
  if (hls) {
    // Disable subtitles by default
    hls.subtitleTrack = -1;
    hls.subtitleDisplay = false;
  }

  let activeTextTrack = defaultTextTrack;

  const tracksManager = videoTextTtracksManager(video, hls);

  dispatch(host, Types.Action.update, tracksManager.tracksToStoreState());

  const onCueChange = (event: Event & { target: TextTrack }) => {
    subtitlesDebug(
      "CUE CHANGE",
      event.target.label,
      event.target.kind,
      event.target.mode,
    );
    const targetLang = event.target.language || event.target.label;

    /**
     * Non native tracks renders via native video cue
     */
    if (!tracksManager.isTrackNative(event.target)) {
      dispatch(host, Types.Action.cues, { cues: [] });
      if (event.target.mode === "showing" && targetLang !== activeTextTrack) {
        activeTextTrack = targetLang;
        dispatch(host, Types.Action.selectTextTrack, {
          activeTextTrack: targetLang,
        });
      }
      return;
    }

    if (targetLang === activeTextTrack) {
      const cues = mapCueListToState(event.target.activeCues);
      dispatch(host, Types.Action.cues, { cues });
    }
  };

  tracksManager.getTracks().forEach((t) => {
    t.oncuechange = onCueChange;
  });

  tracksManager.showTracks(activeTextTrack);

  const onTextTrackAdded = (data: TrackEvent) => {
    subtitlesDebug(
      "TRACK ADDED",
      data.track.label,
      data.track.language,
      data.track.kind,
    );
    if (!tracksManager.isTrackNative(data.track)) {
      data.track.oncuechange = onCueChange;
      tracksManager.showTracks(activeTextTrack);
      dispatch(host, Types.Action.update, tracksManager.tracksToStoreState());
    }
  };

  video.textTracks.addEventListener("addtrack", onTextTrackAdded);

  return {
    enableTextTrack: (lang: string) => {
      activeTextTrack = lang;
      tracksManager.showTracks(activeTextTrack);
      const activeTrack = tracksManager
        .getTracks()
        .find((t) => (t.language || t.label) === activeTextTrack);
      if (
        activeTrack &&
        tracksManager.isTrackNative(activeTrack) &&
        activeTrack.activeCues
      ) {
        dispatch(host, Types.Action.cues, {
          cues: mapCueListToState(activeTrack.activeCues),
        });
      }
    },
  };
};

export type SubtitlesController = ReturnType<typeof subtitlesController>;

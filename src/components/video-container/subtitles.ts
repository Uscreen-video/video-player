import { dispatch, Types } from "../../state";
import { VideoContainer } from "./Video-container.component";
import { mapCueListToState } from "../../helpers/cue";
import debounce from "../../helpers/debounce"
import type Hls from "hls.js";
import _debug from "debug";
import { MediaPlaylist } from "hls.js";

const subtitlesDebug = _debug("player:subtitles");

const buildTrackId = (track: TextTrack) => `${track.label}-${track.language}`;
const buildHlsTrackId = (track: MediaPlaylist) => `${track.name}-${track.lang}`;

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
    return textTracks
  };

  const tracksToStoreState = () => ({
    textTracks: getTracks().map((t) => ({
      src: langToSrcMapping[t.language] || "",
      lang: t.language || t.label,
      label: t.label,
      id: buildTrackId(t),
    })).sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
  });

  const showTracks = (trackId: string) => {
    if (hls) {
      hls.subtitleTracks.forEach((t) => {
        if (buildHlsTrackId(t) === trackId) {
          hls.subtitleTrack = t.id;
          hls.subtitleDisplay = true;
        }
      });
    }
    getTracks().forEach((t) => {
      if (buildTrackId(t) === trackId) {
        t.mode = "hidden";
      } else {
        t.mode = "disabled";
      }
    });
  };

  const removeNativeTextTracks = () => {
    trackElements.forEach(t => t.remove())
  }

  const hasNonNative = () => getTracks().some(t => !isTrackNative(t))

  return {
    getTracks,
    tracksToStoreState,
    showTracks,
    isTrackNative,
    removeNativeTextTracks,
    hasNonNative
  };
};

export const subtitlesController = (
  host: VideoContainer,
  video: HTMLVideoElement,
  hls: Hls,
  defaultTextTrackId?: string,
) => {
  if (hls) {
    // Disable subtitles by default
    hls.subtitleTrack = -1;
    hls.subtitleDisplay = false;
  }

  let activeTextTrackId =   defaultTextTrackId;

  const tracksManager = videoTextTtracksManager(video, hls);

  if (tracksManager.hasNonNative()) {
    tracksManager.removeNativeTextTracks()
  }


  const onCueChange = (event: Event & { target: TextTrack }) => {
    subtitlesDebug(
      "CUE CHANGE",
      event.target.label,
      event.target.kind,
      event.target.mode,
    );
    const targetTrackId = buildTrackId(event.target)

    if (event.target.mode === "showing" && targetTrackId !== activeTextTrackId) {
      activeTextTrackId = targetTrackId;
      dispatch(host, Types.Action.selectTextTrack, {
        activeTextTrackId: targetTrackId,
      });
    }

    if (targetTrackId === activeTextTrackId) {
      const cues = mapCueListToState(event.target.activeCues);
      dispatch(host, Types.Action.cues, { cues });
    }
  };

  tracksManager.getTracks().forEach((t) => {
    t.oncuechange = onCueChange;
  });

  tracksManager.showTracks(activeTextTrackId);

  const updateTracksListSate = debounce(() => {
    dispatch(host, Types.Action.update, tracksManager.tracksToStoreState());
  }, 100)

  updateTracksListSate()

  const onTextTrackAdded = (data: TrackEvent) => {
    subtitlesDebug(
      "TRACK ADDED",
      data.track.label,
      data.track.language,
      data.track.kind,
    );
    if (!tracksManager.isTrackNative(data.track)) {
      tracksManager.removeNativeTextTracks()
      data.track.oncuechange = onCueChange;
      tracksManager.showTracks(activeTextTrackId);
      updateTracksListSate()
    }
  };

  video.textTracks.addEventListener("addtrack", onTextTrackAdded);

  return {
    enableTextTrack: (trackId: string) => {
      activeTextTrackId = trackId;
      tracksManager.showTracks(activeTextTrackId);
      const activeTrack = tracksManager
        .getTracks()
        .find((t) => buildTrackId(t) === activeTextTrackId);
      if (activeTrack && activeTrack.activeCues) {
        dispatch(host, Types.Action.cues, {
          cues: mapCueListToState(activeTrack.activeCues),
        });
      }
    },
  };
};

export type SubtitlesController = ReturnType<typeof subtitlesController>;

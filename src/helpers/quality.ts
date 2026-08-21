import type { QualityBadge } from "../types";

/**
 * Resolves the marketing badge for a rendition.
 *
 * Tiers are keyed off the *shorter* edge — the "p" number — so that portrait
 * renditions are classified correctly: a portrait 1080p rendition is 1080x2340,
 * and keying off the height alone would misread it as 2K.
 */
export const qualityBadge = (
  width?: number,
  height?: number,
): QualityBadge | undefined => {
  const edges = [width, height].filter((edge) => edge > 0);
  if (!edges.length) return undefined;

  const edge = Math.min(...edges);
  if (edge >= 2160) return "4K";
  if (edge >= 1440) return "2K";
  if (edge >= 1080) return "HD";
  return undefined;
};

/**
 * Formats a rendition height as the familiar `1080p` label.
 */
export const qualityLabel = (height?: number) =>
  height > 0 ? `${height}p` : "";

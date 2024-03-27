---
title: Getting started
description: Learn how to integrate Uscreen Video Player
---

### Installing from CDN

To incorporate the Uscreen Video Player into your project, add the following scripts within the `<head>` section of your HTML document. These scripts include both ES module for modern browsers and CommonJS versions for compatibility with older browsers.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@uscreentv/video-player/+esm"></script>
<script nomodule src="https://cdn.jsdelivr.net/npm/@uscreentv/video-player"></script>
```

### Implementing the Player

Once the scripts are added, you can start utilizing the web components provided by Uscreen's video player according to your requirements. However, ensure that all elements are enclosed within the `<video-player>` component, which facilitates controller logic implementation. In the future, these components can be leveraged to manage video states, emit commands, and more.

```html
<video-player>
  <video slot="video">
    <source 
      src="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
      type="application/x-mpegURL"
    />
  </video>
  <video-controls>
    <video-timeline>
      <video-timer></video-timer>
    </video-timeline>
    <video-play-button>
    </video-play-button>
    <!-- Additional controls can be found in the /reference/controls directory -->
  </video-controls>
</video-player>
```

With this setup, you can seamlessly integrate the Uscreen Video Player into your project and tailor the viewing experience to meet your specific needs.

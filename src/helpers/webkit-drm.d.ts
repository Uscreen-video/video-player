export {};

declare global {
  interface WebKitMediaKeyError {
    code: number;
    systemCode: number;
  }

  interface WebKitMediaKeySession extends EventTarget {
    error: WebKitMediaKeyError | null;
    update(key: BufferSource): void;
    close(): void;
  }

  interface WebKitMediaKeys {
    createSession(
      mimeType: string,
      initData: BufferSource,
    ): WebKitMediaKeySession;
  }

  const WebKitMediaKeys: {
    new (keySystem: string): WebKitMediaKeys;
  };

  interface WebKitNeedKeyEvent extends Event {
    initData: ArrayBuffer | null;
  }

  interface WebKitKeyMessageEvent extends Event {
    message: ArrayBuffer;
  }

  interface Window {
    WebKitMediaKeys?: typeof WebKitMediaKeys;
  }

  interface HTMLVideoElement {
    webkitKeys?: WebKitMediaKeys;
    webkitSetMediaKeys(keys: WebKitMediaKeys | null): void;
    webkitCurrentPlaybackTargetIsWireless?: boolean;
  }
}

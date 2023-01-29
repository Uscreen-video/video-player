import { ReactiveController } from "lit";
import { Command } from "../types";
import type { Hls } from 'hls.js'
import { CommandListener } from "../state/commander";
import { VideoContainer } from "../components/video-container";

export class HlsController implements ReactiveController {
  private hls: Hls
  private initListener: CommandListener

  constructor(
    public host: VideoContainer
  ) {
    this.host.addController(this)
    this.initListener = new CommandListener(this.host, Command.init, { isNativeHLS: false }).listen(this.initHls)
  }

  hostConnected(): void {
    
  }

  hostDisconnected(): void {
    this.initListener.unsubscribe()
  }

  initHls = async () => {
    const HLS = (await import('hls.js')).default
    if (!HLS.isSupported()) return

    this.hls?.destroy()
  
    this.hls = new HLS({
      maxMaxBufferLength: 30,
      enableWorker: false,
      initialLiveManifestSize: 2,
      liveSyncDurationCount: 5,
      fragLoadingMaxRetry: 10,
      manifestLoadingMaxRetry: 2,
      levelLoadingMaxRetry: 4,
    })

    this.hls.loadSource(this.host.videoSource);
    this.hls.attachMedia(this.host.videos[0]);
  }
}

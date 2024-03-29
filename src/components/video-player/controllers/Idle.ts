import { ReactiveController, ReactiveElement } from "lit";

export class IdleController implements ReactiveController {
  timer: number;
  callback: (value: boolean) => void;

  constructor(
    private host: ReactiveElement & { idleTimeout: number },
    callback: (value: boolean) => void,
  ) {
    this.host.addController(this);
    this.callback = callback.bind(host);
  }

  hostConnected(): void {
    this.start();
  }

  hostDisconnected(): void {
    this.clear();
  }

  public start = () => {
    this.clear();
    this.timer = window.setTimeout(() => {
      this.callback(true);
    }, this.host.idleTimeout);
  };

  public clear = () => {
    if (!this.timer) return;
    window.clearTimeout(this.timer);
    this.timer = null;
  };

  public reset = () => {
    this.start();
    this.callback(false);
  };
}

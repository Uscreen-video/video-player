import { ReactiveController, ReactiveControllerHost, ReactiveElement } from "lit";
import { decorateProperty } from '@lit/reactive-element/decorators/base.js';
import { COMMAND } from "./emitter";
import { VideoPlayer } from "../components/video-player";


export class EventListener implements ReactiveController {
  root: ReactiveElement

  constructor(
    private host: ReactiveElement,
    private event: string,
    private name: PropertyKey
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.root = this.host instanceof VideoPlayer ? this.host : this.host.closest('video-player')
    this.root?.addEventListener(COMMAND, this.handleCommand)
  }

  hostDisconnected(): void {
    this.root?.removeEventListener(COMMAND, this.handleCommand)
  }

  handleCommand = ({ detail }: any) => {
    if (detail.action !== this.event) return
    this.host[this.name](detail.props)
  }
}


export class Commander {
  constructor(
    private host: ReactiveElement,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
  }

  hostDisconnected(): void {
  }

  
  command = (
    action: string,
    params?: Record<string, any>
  ) => new Promise((resolve, reject) => {
    const event = new CustomEvent(COMMAND, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        action,
        params,
        resolve,
        reject
      },
    })
    this.host.dispatchEvent(event);
  })
}

export function createCommandListener(event: string): <K extends PropertyKey>(
  protoOrDescriptor: ReactiveElement,
  name?: K
) => void | any {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      ctor.addInitializer((element: ReactiveElement): void => {
        new EventListener(
          element,
          event,
          name
        );
      });
    },
  });
}

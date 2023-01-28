import { ReactiveController, ReactiveElement } from "lit";
import { decorateProperty } from '@lit/reactive-element/decorators/base.js';
import { Command, Event } from "./types";
import { VideoPlayer } from "../components/video-player";

export class EventListener implements ReactiveController {
  root: ReactiveElement

  constructor(
    protected host: ReactiveElement,
    private event: Command,
    private name: PropertyKey
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    if (this.host instanceof VideoPlayer) {
      this.hostDiscovered(this.host)
      return
    }
    this.host.dispatchEvent(new CustomEvent(Event.register, {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: {
        callback: this.hostDiscovered
      }
    }))
  }

  hostDisconnected(): void {
    this.root?.removeEventListener(Event.command, this.handleCommand)
  }

  hostDiscovered = (root: ReactiveElement) => {
    (this.root = root).addEventListener(Event.command, this.handleCommand)
  }

  handleCommand = ({ detail }: any) => {
    if (detail.action !== this.event) return
    const fx = (this.host as any)[this.name](detail.props)
    if (fx instanceof Promise) fx.then(detail.resolve).catch(detail.reject)
  }
}

export function createCommand(host: ReactiveElement) {
  return (
    action: Command,
    params?: Record<string, any>
  ) => new Promise((resolve, reject) => {
    const event = new CustomEvent(Event.command, {
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
    host.dispatchEvent(event);
  })
}

export function createCommandListener(event: Command): <K extends PropertyKey>(
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

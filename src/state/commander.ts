import { ReactiveController, ReactiveElement } from "lit";
import { decorateProperty } from '@lit/reactive-element/decorators/base.js';
import { Command, Event, State } from "./types";
import { VideoPlayer } from "../components/video-player";
import { CommandEvent } from "./events";

export class EventListener implements ReactiveController {
  root: ReactiveElement
  unsubscribe: () => void

  constructor(
    protected host: ReactiveElement,
    private event: Command,
    private name: PropertyKey,
    private dependencies?: State
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.dispatchEvent(
      new CommandEvent(
        this.event,
        this.dependencies,
        (unsubscribe) => {
          (this.host as any)[this.name]()
          this.unsubscribe = unsubscribe
        }
      )
    )
  }

  // handleCommand = () => {
  //   const fx = (this.host as any)[this.name](detail.props)
  //   if (fx instanceof Promise) fx.then(detail.resolve).catch(detail.reject)
  // }
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

export function createCommandListener(event: Command, requirements?: State): <K extends PropertyKey>(
  protoOrDescriptor: ReactiveElement,
  name?: K
) => void | any {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      ctor.addInitializer((element: ReactiveElement): void => {
        new EventListener(
          element,
          event,
          name,
          requirements
        );
      });
    },
  });
}

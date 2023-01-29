import { ReactiveController, ReactiveElement } from "lit";
import { decorateProperty } from '@lit/reactive-element/decorators/base.js';
import { Command, Event, State } from "./types";
import { CommandEvent, CommandRegisterEvent } from "./events";

export class EventListener implements ReactiveController {
  root: ReactiveElement
  unsubscribe?: () => void

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
      new CommandRegisterEvent(
        this.event,
        this.dependencies,
        (params, [resolve, reject], unsubscribe) => {
          const fx = (this.host as any)[this.name](params)
          if (fx instanceof Promise) fx.then(resolve).catch(reject)
          this.unsubscribe = unsubscribe
        }
      )
    )
  }

  hostDisconnected(): void {
    this.unsubscribe?.()
  }
}

export function createCommand(host: ReactiveElement) {
  return (
    command: Command,
    params?: Record<string, any>
  ) => {
    console.log('Command fired', Command[command])
    return new Promise((resolve, reject) =>
      host.dispatchEvent(
        new CommandEvent(
          command,
          params,
          [resolve, reject],
        )
      )
    )
  }
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

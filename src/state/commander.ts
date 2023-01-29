import { ReactiveController, ReactiveElement } from "lit";
import { decorateProperty } from '@lit/reactive-element/decorators/base.js';
import { Command, Event, State } from "../types";
import { CommandEvent, CommandRegisterEvent } from "./events";

export class CommandListener implements ReactiveController {
  private _unsubscribe?: () => void
  private callbacks = new Set<(params: any) => void>()

  constructor(
    protected host: ReactiveElement,
    private event: Command,
    private dependencies?: State,
    private name?: PropertyKey,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    this.host.dispatchEvent(
      new CommandRegisterEvent(
        this.event,
        this.dependencies,
        (params, [resolve, reject], unsubscribe) => {
          this._unsubscribe = unsubscribe
          if (this.name) {
            const fx = (this.host as any)[this.name](params)
            if (fx instanceof Promise) fx.then(resolve).catch(reject)
          } else {
            this.resolveCallbacks(params)
          }
        }
      )
    )
  }

  listen(callback: () => void) {
    this.callbacks.add(callback)
    return this
  }

  resolveCallbacks(params: unknown) {
    for (const callback of this.callbacks) {
      callback(params)
    }
  }

  hostDisconnected(): void {
    this.callbacks = undefined
    this._unsubscribe?.()
  }

  public unsubscribe() {
    this.callbacks = undefined
    this._unsubscribe()
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
        new CommandListener(
          element,
          event,
          requirements,
          name,
        );
      });
    },
  });
}

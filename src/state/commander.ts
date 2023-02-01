import { ReactiveController, ReactiveElement } from "lit";
import { decorateProperty } from '@lit/reactive-element/decorators/base.js';
import { Command, State } from "../types";
import { CommandEvent, CommandMeta, CommandParams, CommandRegisterEvent } from "./events";
import _debug from 'debug'

const debugCommand = _debug('player:commands')

export class EventListener implements ReactiveController {
  root: ReactiveElement
  unsubscribe?: () => void

  constructor(
    protected host: ReactiveElement,
    private command: Command,
    private name: PropertyKey,
    private dependencies?: State
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    const _host: any = this.host
    const event = new CommandRegisterEvent(
      this.command,
      this.dependencies,
      (params, meta, unsubscribe, resolve, reject) => {
        const fx = (this.host as any)[this.name](params)
        this.unsubscribe = unsubscribe
        debugCommand(`[${Command[this.command]}] handled`, params)
        if (fx instanceof Promise) {
          fx.then(resolve).catch(reject)
        } else {
          resolve()
        }
      }
    )

    _host.state?.registerCommand?.(event) ||
    _host.dispatchEvent(event)
  }

  hostDisconnected(): void {
    this.unsubscribe?.()
  }
}

export function createCommand(host: ReactiveElement) {
  return (
    command: Command,
    params?: CommandParams,
    meta?: CommandMeta
  ) => {
    debugCommand(`[${Command[command]}] fired`, params)
    return host.dispatchEvent(new CommandEvent(command, params, meta))
  }
}

export function createCommandListener(command: Command, requirements?: State): <K extends PropertyKey>(
  protoOrDescriptor: ReactiveElement,
  name?: K
) => void | any {
  return decorateProperty({
    finisher: (ctor: typeof ReactiveElement, name: PropertyKey) => {
      ctor.addInitializer((element: ReactiveElement): void => {
        new EventListener(
          element,
          command,
          name,
          requirements
        );
      });
    },
  });
}

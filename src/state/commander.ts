import { ReactiveController, ReactiveElement } from "lit";
import { Command, State } from "../types";
import {
  CommandEvent,
  CommandMeta,
  CommandParams,
  CommandRegisterEvent,
} from "./events";
import _debug from "debug";
import { Interface } from "@lit/reactive-element/decorators/base";

const debugCommand = _debug("player:commands");

export class EventListener implements ReactiveController {
  root: ReactiveElement;
  unsubscribe?: () => void;

  constructor(
    protected host: ReactiveElement,
    private command: Command,
    private name: PropertyKey,
    private dependencies?: State,
  ) {
    this.host.addController(this);
  }

  hostConnected() {
    const _host: any = this.host;
    const event = new CommandRegisterEvent(
      this.command,
      this.dependencies,
      (params, meta, unsubscribe, resolve, reject) => {
        const fx = (this.host as any)[this.name](params, meta, this.command);
        this.unsubscribe = unsubscribe;
        debugCommand(`[${Command[this.command]}] handled`, params);
        if (fx instanceof Promise) {
          fx.then(resolve).catch(reject);
        } else {
          resolve();
        }
      },
    );

    _host.state?.registerCommand?.(event) || _host.dispatchEvent(event);
  }

  hostDisconnected(): void {
    this.unsubscribe?.();
  }
}

export function createCommand(host: ReactiveElement) {
  /**
   * Dispatches a command event
   * @type {Command}
   */
  return (
    command: Command | keyof typeof Command,
    params?: CommandParams,
    meta?: CommandMeta,
  ) => {
    const _command = typeof command === "string" ? Command[command] : command;
    debugCommand(`[${Command[_command]}] fired`, params);
    return host.dispatchEvent(new CommandEvent(_command, params, meta));
  };
}

export type CommandDecorator = {
  // legacy
  (
    proto: Interface<ReactiveElement>,
    name: PropertyKey,
    // Note TypeScript requires the return type to be `void|any`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): void | any;

  // standard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <C, V extends (this: C, ...args: any) => any>(
    value: V,
    _context: ClassMethodDecoratorContext<C, V>,
  ): void;
};

export function createCommandListener(
  command: Command,
  requirements?: State,
): CommandDecorator {
  return <C, V extends (this: C, ...args: any) => any>(
    protoOrValue: ReactiveElement,
    nameOrContext: PropertyKey | ClassMethodDecoratorContext<C, V>,
  ) => {
    const ctor = protoOrValue.constructor as typeof ReactiveElement;
    ctor.addInitializer((element: ReactiveElement): void => {
      new EventListener(
        element,
        command,
        nameOrContext as string,
        requirements,
      );
    });
  };
}

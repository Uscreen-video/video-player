
import { ContextProvider } from '@lit-labs/context';
import { context } from '../state'
import { StateAction } from '../state/dispatcher';
import { stateMapper } from '../state/mapper';
import { CommandEvent, CommandRegisterEvent } from '../state/events';
import { Action, Command, Event, PromiseLike, State } from '../types';

type Context = typeof context

export const mapState = (
  action: Action,
  state: State,
  value: any
): State => {
  if (!stateMapper[action]) {
    console.warn(`${action} not found`)
    return state
  }
  return stateMapper[action](state, value)
}


class CachedCommand {
  private _params: unknown
  private _promise: PromiseLike

  constructor(
    public readonly cache: Set<CachedCommand>,
    public readonly command: Command,
    public readonly dependencies: State | undefined,
    public readonly callback: (
      params: unknown,
      promise: PromiseLike,
      unsubscribe: () => void
    ) => void,
  ) { }
  
  isMatchingState(s: State) {
    if (!this.dependencies) return true
    return Object.keys(this.dependencies)
      .every((k: keyof State) => this.dependencies[k] === s[k])
  }

  setParams(promise = this._promise, params: unknown) {
    this._params = params
    this._promise = promise
    return this
  }

  exec(promise = this._promise, params = this._params) {
    this.callback(params, promise, () => this.cache.delete(this))
  }
}

export class StateController extends ContextProvider<Context> {
  private _pending = new Set<CachedCommand>()
  private _commands = new Set<CachedCommand>()

  hostConnected() {
    this.host.addEventListener(Event.state, this.handleEvent)
    this.host.addEventListener(Event.registerCommand, this.registerCommand)
    this.host.addEventListener(Event.command, this.callCommand)
  }

  hostDisconnected() {
    this.host.removeEventListener(Event.state, this.handleEvent)
    this.host.removeEventListener(Event.registerCommand, this.registerCommand)
  }

  handleEvent = (e: CustomEvent<StateAction>) => {
    e.stopPropagation()
    this.setValue(mapState(e.detail.action, this.value, e.detail.params))
    Promise.resolve().then(() => this.resolvePendingCommands())
  }

  resolvePendingCommands() {
    for (const cmd of this._pending) {
      if (!cmd.isMatchingState(this.value)) continue
      cmd.exec()
      this._pending.delete(cmd)
    }
  }

  callCommand = (event?: CommandEvent) => {
    event.stopPropagation()
    for (const cmd of this._commands) {
      if (cmd.command !== event.command) continue
      if (cmd.isMatchingState(this.value)) {
        cmd.exec(event.promise, event.params)
      } else {
        this._pending.add(cmd.setParams(event.promise, event.params))
      }
    }
  }

  registerCommand = (event: CommandRegisterEvent) => {
    event.stopPropagation()
    this._commands.add(
      new CachedCommand(
        this._commands,
        event.command,
        event.dependencies,
        event.callback
      )
    )
  }
}

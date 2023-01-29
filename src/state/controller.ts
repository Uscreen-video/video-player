
import { ContextProvider } from '@lit-labs/context';
import { context } from './index'
import { StateAction } from './dispatcher';
import { stateMapper } from './mapper';
import { Action, Command, Event, State } from './types';
import { CommandEvent } from './events';

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

type RegisteredCommand = [
  command: Command,
  dependencies: State | undefined,
  callback: (callback: () => void) => void,
  params?: any
]

export class StateController extends ContextProvider<Context> {
  private _pending = new Set<RegisteredCommand>()
  private _commands = new Set<RegisteredCommand>()

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

  commandDepsMatchesState(deps?: State) {
    if (!deps) return true
    return Object.keys(deps).every((k: keyof State) => deps[k] === this.value[k])
  }

  execCommand(cmd: RegisteredCommand) {
    cmd[2](() => this._commands.delete(cmd))
  }

  resolvePendingCommands() {
    for (const cmd of this._pending) {
      if (!this.commandDepsMatchesState(cmd[1])) continue
      this.execCommand(cmd)
      this._pending.delete(cmd)
    }
  }

  callCommand = (e?: CustomEvent) => {
    for (const cmd of this._commands) {
      if (cmd[0] !== e.detail.action) continue
      if (this.commandDepsMatchesState(cmd[1])) {
        this.execCommand(cmd)
      } else {
        this._pending.add([...cmd])
      }
    }
  }

  registerCommand = (e: CommandEvent) => {
    e.stopPropagation()
    this._commands.add([e.command, e.dependencies, e.callback])
  }
}

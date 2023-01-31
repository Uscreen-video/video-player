
import { ContextProvider } from '@lit-labs/context';
import { context } from './index'
import { StateAction } from './dispatcher';
import { stateMapper } from './mapper';
import { Action, Command, Event, State } from '../types';
import { CommandEvent, CommandRegisterEvent } from './events';
import _debug from 'debug'

const commandDebug = _debug('player:commands')
const stateDebug = _debug('player:state')

type Context = typeof context

export const mapState = (
  action: Action,
  state: State,
  value: any
): State => {
  if (!stateMapper[action]) {
    stateDebug(`[${Action[action]}] mapper not found"`)
    return state
  }
  return (stateMapper[action] || stateMapper[Action.update])(state, value)
}

class CachedCommand {
  private _params: unknown
  public isPending: boolean

  constructor(
    public readonly cache: Set<CachedCommand>,
    public readonly command: Command,
    public readonly dependencies: State | undefined,
    public readonly callback: (
      params: unknown,
      unsubscribe: () => void,
      resolve: (value: unknown) => void,
      reject: (value: unknown) => void,
    ) => void,
  ) { }
  
  isMatchingState(s: State) {
    if (!this.dependencies) return true
    return Object.keys(this.dependencies)
      .every((k: keyof State) => this.dependencies[k] === s[k])
  }

  setParams(params: unknown) {
    this._params = params
    return this
  }

  pend(params = this._params) {
    this._params = params
    this.isPending = true
  }

  exec(params = this._params) {
    this.callback(
      params,
       // unsubscribe
      () => this.cache.delete(this),
      // resolve
      (res) => {
        commandDebug(`[${Command[this.command]}] resolved`, res)
        this.isPending = false
      },
      // reject
      (e) => {
        commandDebug(`[${Command[this.command]}] rejected`, e)
        this.isPending = true
      }
    )
  }
}

export class StateController extends ContextProvider<Context> {
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
    const prevState = this.value
    this.setValue(mapState(e.detail.action, this.value, e.detail.params))
    if (prevState !== this.value) stateDebug(`[${Action[e.detail.action]}]`, this.value)
    Promise.resolve().then(() => this.resolvePendingCommands())
  }

  resolvePendingCommands() {
    for (const cmd of this._commands) {
      if (cmd.isPending && cmd.isMatchingState(this.value)) {
        cmd.exec()
      }
    }
  }

  callCommand = (event?: CommandEvent) => {
    event.stopPropagation()
    for (const cmd of this._commands) {
      if (cmd.command !== event.command) continue
      if (cmd.isMatchingState(this.value)) {
        cmd.exec(event.params)
      } else {
        cmd.pend(event.params)
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

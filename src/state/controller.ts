
import { ContextProvider } from '@lit/context';
import { context } from './index'
import { StateAction } from './dispatcher';
import { stateMapper } from './mapper';
import { Action, Command, Event, State } from '../types';
import { CommandEvent, CommandMeta, CommandParams, CommandRegisterEvent } from './events';
import _debug from 'debug'

const commandDebug = _debug('player:commands')
const stateDebug = _debug('player:state')

type Context = typeof context

export const mapState = (
  action: Action,
  state: State,
  value: any
): State => (stateMapper[action] || stateMapper[Action.update])(state, value)

class CachedCommand {
  private _params: CommandParams
  private _meta: CommandMeta
  public isPending: boolean

  constructor(
    public readonly cache: Set<CachedCommand>,
    public readonly command: Command,
    public readonly dependencies: State | undefined,
    public readonly callback: (
      params: unknown,
      meta: unknown,
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

  setParams(params: CommandParams, meta: CommandMeta) {
    this._params = params
    this._meta = meta
    return this
  }

  pend(params = this._params, meta = this._meta) {
    this._params = params
    this._meta = meta
    if (!meta?.once) this.isPending = true
  }

  exec(params = this._params, meta = this._meta) {
    this.callback(
      params,
      meta,
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
        if (!meta?.once) this.isPending = true
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

  setState = (action: Action, params: Record<string, any>) => {
    const prevState = this.value
    this.setValue(mapState(action, this.value, params))
    if (prevState !== this.value) {
      Promise.resolve().then(() => {
        stateDebug(`[${Action[action]}]`, params)
      })
    }
  }

  handleEvent = (e: CustomEvent<StateAction>) => {
    e.stopPropagation()
    this.setState(e.detail.action, e.detail.params)

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
        cmd.exec(event.params, event.meta)
      } else {
        cmd.pend(event.params, event.meta)
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

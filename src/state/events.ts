import { Types } from "."

export type CommandMeta = {
  // Command will not be pended
  once?: boolean
  // Command has been sent from keyboard
  keyboard?: boolean
}
export type CommandParams = Record<string, unknown>

export type CommandCallback = (
  params: CommandParams,
  meta: CommandMeta,
  unsubscribe: () => void,
  resolve: (value?: unknown) => void,
  reject: (value?: unknown) => void,
) => void

export class CommandRegisterEvent extends Event {
  constructor(
    public readonly command: Types.Command,
    public readonly dependencies: Types.State,
    public readonly callback: CommandCallback,
  ) {
    super(Types.Event.registerCommand, { bubbles: true, composed: true })
  }
}

export class CommandEvent extends Event {
  constructor(
    public readonly command: Types.Command,
    public readonly params: CommandParams = {},
    public readonly meta: CommandMeta = {},
  ) {
    super(Types.Event.command, { bubbles: true, composed: true })
  }
}



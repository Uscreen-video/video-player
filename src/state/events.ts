import { Types } from "."

export class CommandRegisterEvent extends Event {
  constructor(
    public readonly command: Types.Command,
    public readonly dependencies: Types.State,
    public readonly callback: (
      params: unknown,
      unsubscribe: () => void,
      resolve: (value?: unknown) => void,
      reject: (value?: unknown) => void,
    ) => void,
  ) {
    super(Types.Event.registerCommand, { bubbles: true, composed: true })
  }
}

export class CommandEvent extends Event {
  constructor(
    public readonly command: Types.Command,
    public readonly params: unknown,
  ) {
    super(Types.Event.command, { bubbles: true, composed: true })
  }
}



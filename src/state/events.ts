import { Types } from "."
import { PromiseLike, State } from "./types"

export class CommandRegisterEvent extends Event {
  constructor(
    public readonly command: Types.Command,
    public readonly dependencies: State,
    public readonly callback: (
      params: unknown,
      promise: PromiseLike,
      subscribe: () => void
    ) => void,
  ) {
    super(Types.Event.registerCommand, { bubbles: true, composed: true })
  }
}

export class CommandEvent extends Event {
  constructor(
    public readonly command: Types.Command,
    public readonly params: unknown,
    public readonly promise: PromiseLike
  ) {
    super(Types.Event.command, { bubbles: true, composed: true })
  }
}

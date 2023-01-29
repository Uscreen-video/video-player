import { Types } from "."
import { State } from "./types"

export class CommandEvent extends Event {
  constructor(
    public readonly command: Types.Command,
    public readonly dependencies: State,
    public readonly callback: (unsubscribe: () => void) => void,
  ) {
    super(Types.Event.registerCommand, { bubbles: true, composed: true })
  }
}

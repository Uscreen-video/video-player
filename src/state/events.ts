import { State } from "."

type Actions = {
  click: {
    isPlaying: boolean
  }
}

export type ActionsType = keyof Actions
type ResultType = State & Partial<Actions[ActionsType]>
type MapperType = (s: State, v: any) => ResultType

const mappers: Record<ActionsType, MapperType> = {
  click: (state) => ({
    ...state,
    isPlaying: !state.isPlaying
  })
}

export const mapState = (
  action: ActionsType,
  state: State,
  value: any
): ResultType => {
  if (!mappers[action]) {
    console.warn(`${action} not found`)
    return state
  }
  return mappers[action](state, value)
}

import { initialState } from '.'
import { Action, State } from '../types'

export const stateMapper: Partial<Record<Action, (s: State, v: any) => State>> = {
  [Action.init]: (_, params) => ({
    ...initialState,
    ...params
  }),
  [Action.toggleMuted]: (state) => ({
    ...state,
    isMuted: !state.isMuted
  }),
  [Action.play]: (state) => ({
    ...state,
    isPlaying: true
  }),
  [Action.pause]: (state) => ({
    ...state,
    isPlaying: false
  }),
  [Action.update]: (state, params) => ({
    ...state,
    ...params
  }),
  [Action.toggleAirplay]: (state) => ({
    ...state,
    airplayActivated: !state.airplayActivated
  }),
  [Action.castAvailable]: (state) => ({
    ...state,
    castAvailable: true
  }),

}

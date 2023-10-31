import { initialState } from '.'
import { Action, State } from '../types'
import { getCueText } from '../helpers/cue'

export const stateMapper: Partial<Record<Action, (s: State, v: any) => State>> = {
  [Action.init]: (s, params) => ({
    ...s,
    ...initialState,
    ...params
  }),
  [Action.toggleMuted]: (state) => ({
    ...state,
    isMuted: !state.isMuted
  }),
  [Action.play]: (state) => ({
    ...state,
    isPlaying: true,
    played: true
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
  [Action.canPlay]: (state) => ({
    ...state,
    canPlay: true
  }),
  [Action.cues]: (state, params: TextTrackCueList) => ({
    ...state,
    cues: Array.from(params)
      .map((cue: VTTCue) => cue.getCueAsHTML())
      .flatMap(getCueText)
  })
}

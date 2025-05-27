import { initialState } from ".";
import { Action, State } from "../types";

export const stateMapper: Partial<Record<Action, (s: State, v: any) => State>> =
  {
    [Action.init]: (s, params) => ({
      ...initialState,
      ...s,
      ...params,
    }),
    [Action.toggleMuted]: (state) => ({
      ...state,
      isMuted: !state.isMuted,
    }),
    [Action.play]: (state) => ({
      ...state,
      isPlaying: true,
      played: true,
      canPlay: true
    }),
    [Action.pause]: (state) => ({
      ...state,
      isPlaying: false,
      live: state.live && !state.played ? true : false,
    }),
    [Action.update]: (state, params) => ({
      ...state,
      ...params,
    }),
    [Action.toggleAirplay]: (state) => ({
      ...state,
      airplayActivated: !state.airplayActivated,
    }),
    [Action.canPlay]: (state) => ({
      ...state,
      canPlay: true,
    }),
  };

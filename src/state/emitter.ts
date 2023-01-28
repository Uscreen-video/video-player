import { ReactiveElement } from "lit";
import { ActionsType } from "./events";

export const UPDATE_STATE = 'update-video-state'
export const COMMAND = 'video-command'

export type StateAction = {
  action: ActionsType;
  params: Record<string, any>;
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}

export const dispatch = (
  host: ReactiveElement,
  action: ActionsType,
  params?: Record<string, any>
) => new Promise((resolve, reject) => {
  const event = new CustomEvent<StateAction>(UPDATE_STATE, {
    bubbles: true,
    cancelable: true,
    composed: true,
    detail: {
      action,
      params,
      resolve,
      reject
    },
  })
  host.dispatchEvent(event);
})

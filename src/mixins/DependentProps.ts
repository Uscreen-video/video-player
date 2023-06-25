import type { LitElement, PropertyValueMap } from 'lit'
import { property } from 'lit/decorators.js'

type Constructor<T = {}> = new (...args: any[]) => T;



export declare class WithDependentPropsInterface {
  when: string
}

const parseValue = (val: string): any => {
  try {
    const parsed = JSON.parse(val)
    return parsed
  } catch (err) {
    return val
  }
}

const parsePropNameValue = (prop: string): [string, unknown] => {
  const [name, val] = prop.split('=')
  return [name, parseValue(val)]
}

type LinkedProps = {
  propName: string,
  defaultValue: unknown,
  linkedValue: unknown
}

export const DependentPropsMixin = <T extends Constructor<LitElement>>(superClass: T) => {
  class WithDependentPropsElement extends superClass {
    /**
     * fullscreen=true->custom=false,time=true;
     */
    @property()
    when: string

    private _parsedWhen: Record<string, {
      value: unknown,
      linked: LinkedProps[]
    }>

    connectedCallback() {
      super.connectedCallback();
      if (this.when) {
        this._parsedWhen = this.when.split(';').reduce<typeof this._parsedWhen>((acc, val) => {
          const [dependency, linkedProps] = val.split('->')
          
          const [depName, depValue] = parsePropNameValue(dependency)

          const parsedLinkedProps: LinkedProps[] = linkedProps.split(',').map((prop) => {
            const [propName, propVal] = parsePropNameValue(prop)
            return {
              propName: propName,
              // @ts-ignore
              defaultValue: this[propName],
              linkedValue: propVal
            }
          })

          acc[depName] = {
            value: depValue,
            linked: parsedLinkedProps
          }

          return acc
        }, {})
      }
    }

    protected updated(_changedProps: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
      if (super.updated) {
        super.updated(_changedProps)
      }

      if (!this._parsedWhen) return

      for (const propName of _changedProps.keys()) {
        const dependencyProp = this._parsedWhen[propName as string]
        if (!dependencyProp) return
        dependencyProp.linked.forEach((linkedProp) => {
          // @ts-ignore
          this[linkedProp.propName] = this[propName] === dependencyProp.value ? linkedProp.linkedValue : linkedProp.defaultValue
        })
      }    
    }
  }

  return WithDependentPropsElement as Constructor<WithDependentPropsInterface> & T
}
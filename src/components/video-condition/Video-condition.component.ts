import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { context } from "../../state";
import { State } from "../../types";
import { ContextEvent } from "@lit/context";

const comparatorsRegexp = /^(\w+)\s*([><]=?|==|!=)\s*(\w+)$/;
const operatorRegexp = /(\&\&|\|\|)/g;

type Comparator = ">" | ">=" | "<=" | "<" | "==" | "!=";
type Operator = "&&" | "||";

type Query = {
  key: keyof State;
  compare: (v: any) => boolean;
};

const typeValue = (value: any) => {
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

const createCompare =
  ({ comparator, value: needed }: { comparator: Comparator; value: any }) =>
  (value: any) =>
    ({
      ">": value > needed,
      ">=": value >= needed,
      "<": value < needed,
      "<=": value <= needed,
      "==": value == needed,
      "!=": value != needed,
    })[comparator];

@customElement("video-condition")
export class VideoCondition extends LitElement {
  /**
   * A query string specifying conditions to be evaluated against the application state.
   * The query string consists of one or more comparison expressions separated by logical operators (&& or ||).
   * Each comparison expression follows the pattern: "key comparator value", where:
   * - key: The key of a property in the application state to be compared.
   * - comparator: The comparison operator (>, >=, <, <=, ==, or !=).
   * - value: The value to compare against the property in the application state.
   * Examples of valid comparison expressions:
   *   - "isActive == true"
   *   - "volume >= 50"
   *   - "currentTime < 100"
   *   - "isMuted != false"
   * Multiple comparison expressions can be combined using logical operators:
   *   - "isActive == true && volume >= 50"
   *   - "currentTime < 100 || isMuted != false"
   */
  @property()
  query?: string;

  /**
   * Indicates whether the conditions specified by the query are currently matching the state of the application.
   * This property reflects the result of evaluating the query against the application state.
   * If the conditions specified in the query match the state, this property is set to true; otherwise, it is false.
   */
  @property({ type: Boolean, reflect: true, attribute: "matching" })
  isMatching: boolean;

  _queries: Query[];
  _operators: Operator[];
  _connected = false;
  _unsubscribe: any;

  connectedCallback(): void {
    super.connectedCallback();
    this._operators = this.query.match(operatorRegexp) as Operator[];
    this._queries = this.query
      .split(operatorRegexp)
      .map((string): Query => {
        const match = string.trim().match(comparatorsRegexp);
        if (!match) return undefined;

        return {
          key: match[1] as keyof State,
          compare: createCompare({
            comparator: match[2] as Comparator,
            value: typeValue(match[3]),
          }),
        };
      })
      .filter((i) => i);

    this.connectContext();
  }

  disconnectedCallback(): void {
    this._unsubscribe?.();
  }

  connectContext() {
    const event = new ContextEvent(
      context,
      (value, unsubscribe) => {
        if (this._unsubscribe && this._unsubscribe !== unsubscribe) {
          this._unsubscribe();
        }

        this._unsubscribe = unsubscribe;
        this.isMatching = this._queries.reduce(
          (acc, { key, compare }, index) => {
            const isEq = compare(value[key]);
            return !index || this._operators[index - 1] === "||"
              ? acc || isEq
              : acc && isEq;
          },
          false,
        );
      },
      true,
    );

    this.dispatchEvent(event);
    Promise.resolve().then(() => {
      if (!this._connected) this.dispatchEvent(event);
    });
  }

  render() {
    return html`
      <slot name=${this.isMatching ? "true" : "false"}></slot>
      <slot></slot>
    `;
  }
}

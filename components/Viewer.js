import { createElement, useMemo, createFragment } from "../core/mini-react";
import { html } from "../core/html";

export const Viewer = (props) => {
  const { count } = props;

  const textValue = useMemo(() => {
    if (count % 2 === 0) return "четное";
    return "нечетное";
  }, [count]);

  return html`<div>
    <h2>Счетчик: ${count}</h2>
    <h3>Это ${textValue} число</h3>
  </div>`;
};
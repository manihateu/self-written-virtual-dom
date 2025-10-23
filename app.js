import { createElement, start } from './core/mini-react';
import { Counter } from './components/Counter';
import { html } from './core/html';

export function App() {
    return html`<div>
    <h1>Мой мини-React</h1>
    <${Counter} />
    </div>`
}

start(App, document.getElementById('root'));
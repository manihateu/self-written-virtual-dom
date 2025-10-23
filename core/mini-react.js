let rootEl = null;
let App = null;
let oldTree = null;

let componentHooks = new Map();
let currentComponent = null;
let currentHook = 0;

export function createElement(type, props, ...children) {
    const typeEntity = type;
    const propsEntity = props;
    if (typeof typeEntity === 'function') {
        currentComponent = typeEntity;
        currentHook = 0;
        const { type, props, children } = typeEntity(propsEntity || {});
        currentComponent = null;
        return { type, props: props || {}, children };
    }
    return { type, props: props || {}, children };
}

export function createFragment(children) {
    return { type: 'fragment', props: {}, children };
}

export const render = (vnode) => {
    if (typeof vnode === 'string' || typeof vnode === 'number') return document.createTextNode(vnode);
    if (vnode.type === 'fragment') {
        const fragment = document.createDocumentFragment();
        vnode.children.forEach(child => fragment.appendChild(render(child)));
        return fragment;
    }
    const el = document.createElement(vnode.type);
    for (let [k, v] of Object.entries(vnode.props || {})) el[k] = v;
    if (Array.isArray(vnode.children)){
        vnode.children.forEach(child => el.appendChild(render(child)));
    }
    return el;
}

export const changed = (a, b) => {
    return typeof a !== typeof b ||
        (typeof a === 'string' && a !== b) ||
        a.type !== b.type;
}

export const updateElement = (parent, newNode, oldNode, index = 0) => {
    if (oldNode && oldNode.type === 'fragment') {
        const max = Math.max(newNode?.children?.length || 0, oldNode.children.length);
        for (let i = 0; i < max; i++) {
            updateElement(parent, newNode?.children?.[i], oldNode.children[i], index + i);
        }
        return;
    }
    if (newNode && newNode.type === 'fragment') {
        const max = Math.max(newNode.children.length, oldNode?.children?.length || 0);
        for (let i = 0; i < max; i++) {
            updateElement(parent, newNode.children[i], oldNode?.children?.[i], index + i);
        }
        return;
    }

    if (typeof newNode === 'string' || typeof newNode === 'number') {
        if (typeof oldNode === 'string' || typeof oldNode === 'number') {
            if (newNode !== oldNode) {
                parent.childNodes[index].textContent = newNode;
            }
        } else {
            parent.replaceChild(render(newNode), parent.childNodes[index]);
        }
        return;
    }
    if (oldNode == undefined) {
        parent.appendChild(render(newNode));
    }
    else if (newNode == undefined) {
        parent.removeChild(parent.childNodes[index]);
        if (oldNode.type && typeof oldNode.type === 'function') {
            componentHooks.delete(oldNode.type);
        }
    }
    else if (changed(newNode, oldNode)) {
        parent.replaceChild(render(newNode), parent.childNodes[index]);
    }
    else if (newNode.type) {
        const max = Math.max(newNode.children.length, oldNode.children.length);
        for (let i = 0; i < max; i++)
            updateElement(parent.childNodes[index], newNode.children[i], oldNode.children[i], i);
    }
}

export const useState = (initialValue) => {
    const currComponent = currentComponent;
    if (!currComponent) throw new Error('useState must be called inside a component');
    const hooks = componentHooks.get(currentComponent) || [];
    const id = currentHook;

    if (hooks[id] === undefined) hooks[id] = initialValue;
    const setState = v => {
        if(typeof v === 'function') v = v(hooks[id]);
        hooks[id] = v;
        componentHooks.set(currComponent, hooks);
        renderApp();
    };
    currentHook++;
    componentHooks.set(currentComponent, hooks);
    return [hooks[id], setState];
}

export const useMemo = (factory, deps) => {
    const currComponent = currentComponent;
    if (!currComponent) throw new Error('useMemo must be called inside a component');
    const hooks = componentHooks.get(currentComponent) || [];
    const id = currentHook;
    const prev = hooks[id];
    let hasChanged = true;
    if (prev && prev.deps) {
        hasChanged = deps.some((dep, i) => dep !== prev.deps[i]);
    }
    if (!prev || hasChanged) {
        hooks[id] = { value: factory(), deps };
        componentHooks.set(currComponent, hooks);
    }
    currentHook++;
    return hooks[id].value;
}

export const renderApp = () => {
    currentHook = 0;
    currentComponent = App;
    const newTree = App();
    updateElement(rootEl, newTree, oldTree);
    oldTree = newTree;
    currentComponent = null;
}


export const start = (AppComponent, container) => {
    rootEl = container;
    App = AppComponent;
    renderApp(AppComponent);
}
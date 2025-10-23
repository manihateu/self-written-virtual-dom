import { createElement } from './mini-react';

export const html = (strings, ...values) => {
    let result = '';
    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length) result += `___VAL_${i}___`;
    }

    const parseProps = (attrs, isNative) => {
        const props = {};
        const attrRegex = /([a-zA-Z0-9_$\-:]+)\s*=\s*(?:"([^"]*)"|___VAL_(\d+)___)/g;
        let match;
        while ((match = attrRegex.exec(attrs))) {
            let [, key, strVal, exprIdx] = match;
            if (isNative && /^on[A-Z]/.test(key)) key = key.toLowerCase();
            if (exprIdx !== undefined) {
                props[key] = values[Number(exprIdx)]; // достаем функцию onClick
            } else {
                props[key] = strVal;
            }
        }
        return props;
    };

    const parse = (str) => {
        const tagRegex = /^<([A-Za-z0-9_$\-]+|___VAL_\d+___)([^>]*)>([\s\S]*?)<\/\1>$/;
        const selfClosingTagRegex = /^<([A-Za-z0-9_$\-]+|___VAL_\d+___)([^>]*)\/>$/;
        const valRegex = /___VAL_(\d+)___/g;

        let match = selfClosingTagRegex.exec(str);
        if (match) {
            let [, type, attrs] = match;
            const valTypeMatch = /^___VAL_(\d+)___$/.exec(type);
            if (valTypeMatch) type = values[Number(valTypeMatch[1])];
            const props = parseProps(attrs, typeof type === 'string');
            return createElement(type, props);
        }

        match = tagRegex.exec(str);
        if (match) {
            let [, type, attrs, inner] = match;
            const valTypeMatch = /^___VAL_(\d+)___$/.exec(type);
            if (valTypeMatch) type = values[Number(valTypeMatch[1])];

            const props = parseProps(attrs, typeof type === 'string');
            
            const children = [];
            const childRegex = /(<[^>]+>[\s\S]*?<\/[^>]+>|<[^>]+\/>)/g;
            let lastIndex = 0;
            let childMatch;
            while ((childMatch = childRegex.exec(inner))) {
                const beforeText = inner.slice(lastIndex, childMatch.index);
                if (beforeText.trim()) {
                    children.push(beforeText.replace(valRegex, (_, idx) => values[idx]));
                }
                children.push(parse(childMatch[0]));
                lastIndex = childRegex.lastIndex;
            }
            const afterText = inner.slice(lastIndex);
            if (afterText.trim()) {
                children.push(afterText.replace(valRegex, (_, idx) => values[idx]));
            }

            return createElement(type, props, ...children);
        }

        return str.replace(valRegex, (_, idx) => values[idx]);
    };

    return parse(result.trim());
};
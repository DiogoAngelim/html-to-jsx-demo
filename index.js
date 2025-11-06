import beautify from 'beautify';
const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'col', 'area', 'base'];
const tagsRequiringClosing = new Set(['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'button', 'textarea', 'select', 'option', 'a']);
export function wrapIntoDiv(html) {
    return `<div>${html}</div>`;
}
function cssToObject(cssString) {
    const cleanCss = cssString.replace(/['"]/g, '').trim();
    if (!cleanCss)
        return '{}';
    const styles = cleanCss.split(';')
        .filter((style) => style.trim())
        .map((style) => {
        const [property, value] = style.split(':').map((s) => s.trim());
        if (!property || !value)
            return '';
        const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return `${camelProperty}: "${value}"`;
    })
        .filter(Boolean);
    return `{${styles.join(', ')}}`;
}
const eventAttributesCallback = (_match, eventName, handler) => {
    const newEventName = eventName.slice(2).split('')[0].toUpperCase();
    return `on${newEventName}${eventName.slice(3)}={${handler}}`;
};
export function closeSelfClosingTags(html) {
    const result = html.replaceAll(new RegExp(`<(${selfClosingTags.join("|")})(?=[\\s>/])([^>]*)\\s*/?>`, "gi"), (_match, tagName, attributes) => `<${tagName}${attributes ? attributes : ""}/>`);
    return result.replace(/\/\/>/g, "/>");
}
export function convertEventAttributesToCamelCase(html) {
    return html.replaceAll(/(\bon\w+)=["']([^"']+)["']/g, eventAttributesCallback);
}
export function convertClassToClassName(html) {
    return html.replaceAll(/class=/g, 'className=');
}
export function removeComments(html) {
    return html.replaceAll(/<!--[\s\S]*?-->/g, '');
}
export function indentAllLines(html) {
    return beautify(html, { format: 'html' });
}
const isTagClosed = (tag) => {
    return !selfClosingTags.includes(tag) && tagsRequiringClosing.has(tag);
};
const validateInput = (html) => {
    if (typeof html !== 'string' || html.trim() === '' || !html) {
        throw new TypeError('Input must be valid a string.');
    }
};
const validateTag = (tag) => {
    if (!isTagClosed(tag)) {
        throw new Error(`Tag <${tag}> is not closed.`);
    }
};
const validateTags = (html) => {
    let match;
    const regex = /<([^\s>\/]+)/g;
    while ((match = regex.exec(html)) !== null) {
        validateTag(match[1].toLowerCase());
    }
};
export function toCamelCase(string) {
    return string
        .split(/[-_\s]/)
        .map((word, index) => index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}
export function convertStyleToObject(html) {
    return html.replaceAll(/style\s*=\s*(".*?")/gi, (match, styleValue) => {
        return `style={${cssToObject(styleValue)}}`;
    });
}
export function imageFix(html) {
    return html.replaceAll('</img>', '');
}
export function removeInvalidTags(html) {
    return html.replace(/<!DOCTYPE html>|<!DOCTYPE>/gi, '');
}
export function removeUnsuportedAttrs(html) {
    return html.replaceAll('xmlns:xlink="http://www.w3.org/1999/xlink"', '');
}
export function replaceAttributes(html) {
    html = html.replace(/for=/gi, 'htmlFor=');
    html = html.replace(/\b(autocomplete)\b/gi, 'autoComplete');
    html = html.replace(/\b(tabindex)\b/ig, 'tabIndex');
    html = html.replace(/\b(stroke-width)\b/ig, 'strokeWidth');
    html = html.replace(/\b(stroke-linejoin)\b/ig, 'strokeLinejoin');
    return html.replace(/\b(stroke-linecap)\b/ig, 'strokeLinecap');
}

export function validateHtml(html) {
    if (typeof html !== 'string') {
        throw new TypeError('Input must be a string.');
    }
    
    if (html.trim() === '') {
        return 'HTML is valid.';
    }
    
    const tagStack = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(html)) !== null) {
        const fullTag = match[0];
        const tagName = match[1].toLowerCase();
        
        if (fullTag.endsWith('/>') || selfClosingTags.includes(tagName)) {
            continue;
        }
        
        if (fullTag.startsWith('</')) {
            if (tagStack.length === 0) {
                throw new Error(`Unexpected closing tag: ${fullTag}`);
            }
            const lastOpenTag = tagStack.pop();
            if (lastOpenTag !== tagName) {
                throw new Error(`Mismatched tags: expected </${lastOpenTag}> but found </${tagName}>`);
            }
        } else {
            tagStack.push(tagName);
        }
    }
    
    // Check if there are unclosed tags
    if (tagStack.length > 0) {
        throw new Error(`Unclosed tags: ${tagStack.map(tag => `<${tag}>`).join(', ')}`);
    }
    
    return 'HTML is valid.';
}
export default function convert(html) {
    html = removeInvalidTags(html);
    html = wrapIntoDiv(html);
    html = closeSelfClosingTags(html);
    html = convertEventAttributesToCamelCase(html);
    html = convertClassToClassName(html);
    html = removeComments(html);
    html = imageFix(html);
    html = convertStyleToObject(html);
    html = removeUnsuportedAttrs(html);
    html = replaceAttributes(html);
    return indentAllLines(html);
}

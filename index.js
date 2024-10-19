import beautify from 'beautify';
import parse from 'style-to-object';
import cssToObject from 'css-to-object';
const selfClosingTags = ['input', 'img', 'br', 'hr', 'meta', 'link', 'col', 'area', 'base'];
const tagsRequiringClosing = new Set(['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'button', 'textarea', 'select', 'option', 'a']);
export function wrapIntoDiv(html) {
    return `<div>${html}</div>`;
}
const eventAttributesCallback = (_match, eventName, handler) => {
    const newEventName = eventName.slice(2).split('');
    newEventName.shift();
    return `on${eventName[0].toUpperCase() + newEventName.join('')}={${handler}}`;
};
function convertInlineStyles(html) {
    const style = [html.matchAll(/style\s *=\s * (['"])(.*?)\1/gm)];
    style.map((_m, _g1, g2) => {
        html = html.replaceAll(g2, parse(g2));
    });
    return html;
}
export function closeSelfClosingTags(html) {
    return html.replaceAll(new RegExp(`<(${selfClosingTags.join('|')})([^>]*)\s*/?>`, 'gi'), (_match, tagName, attributes) => `<${tagName}${attributes ? attributes : ''}/>`).replace(/\/\/>/g, '/>');
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
    while ((match = /<([^\s>\/]+)/g.exec(html)) !== null) {
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
    return html.replaceAll(/style = (".*?")/gi, (match) => {
        return `style={${cssToObject(match[1])}}`;
    });
}
export function imageFix(html) {
    return html.replaceAll('</img>', '');
}
export function removeInvalidTags(html) {
    return html.replace(/<!DOCTYPE html>/gi, '');
}
export function removeUnsuportedAttrs(html) {
    return html.replaceAll('xmlns:xlink="http://www.w3.org/1999/xlink"', '');
}
export default function convert(html) {
    html = wrapIntoDiv(html);
    html = removeInvalidTags(html);
    html = closeSelfClosingTags(html);
    html = convertEventAttributesToCamelCase(html);
    html = convertClassToClassName(html);
    html = removeComments(html);
    html = imageFix(html);
    html = convertInlineStyles(html);
    html = convertStyleToObject(html);
    html = removeUnsuportedAttrs(html);
    return indentAllLines(html);
}

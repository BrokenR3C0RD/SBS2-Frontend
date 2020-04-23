import BBCode from "@bbob/html";
import TwelveMarkup from "../utils/12y";

import createPreset, { Node, TagNode } from "@bbob/preset";
import { Dictionary } from "../interfaces";
import { isURL, isDataURI } from "validator";

import { Html5Entities } from "html-entities";
import React from "react";

const entities = new Html5Entities;

function getSoleAttr(attrs: Dictionary<string | object>) {
    return Object.keys(attrs).find(key => attrs[key] == key);
}

const urlOptions = {
    protocols: ['http', 'https', 'ftp'],
    require_tld: false,
    require_protocol: false,
    require_host: false,
    require_valid_protocol: true,
    allow_underscores: false,
    host_whitelist: undefined,
    host_blacklist: undefined,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: true,
    disallow_auth: false
}
function cssPropertiesToString(inp: React.CSSProperties) {
    let x = document.createElement("span")
    let key: string;
    for (key in inp)
        x.style[key as any] = (inp as any)[key];

    return x.style.cssText;

}

function validURL(url: string) {
    return isURL(url, urlOptions) || /^(#[A-Za-z0-9-._~:/?#[\]@!$&'()*+,;=%]*)/.test(url);
}

function fixBBCode(content: (Node | string)[]) {
    let output: (Node | string)[] = [];
    for (let i = 0; i < content.length; i++) {
        let c = content[i];
        if (typeof c == "string" || c.tag != "*" || c.content.length != 0) {
            output.push(c);
        } else {
            c.tag = "li";
            c.content = [];
            i++;
            while (typeof content[i] == "string" || typeof content[i] == "object" && (content[i] as Node).tag != "*")
                c.content.push(content[i++]);
            i--;
            output.push(c);
        }
    }
    return output;
}

const tags = {
    b: node => ({
        tag: "b",
        content: node.content
    }),
    i: node => ({
        tag: "i",
        content: node.content
    }),
    u: node => ({
        tag: "u",
        content: node.content
    }),
    s: node => ({
        tag: "s",
        content: node.content
    }),
    sup: node => ({
        tag: "sup",
        content: node.content
    }),
    sub: node => ({
        tag: "sub",
        content: node.content
    }),
    url: node => ({
        tag: "a",
        attrs: {
            href: (validURL(getSoleAttr(node.attrs!) || "") ? getSoleAttr(node.attrs!) : node.content.toString())!
        },
        content: node.content
    }),
    list: node => ({
        tag: "ul",
        attrs: {
            style: cssPropertiesToString({
                listStyle: typeof node.attrs != "undefined" ? getSoleAttr(node.attrs) || undefined : undefined
            })
        },
        content: fixBBCode(node.content)
    }),
    "*": node => ({
        tag: "li",
        content: node.content
    }),
    h1: node => ({
        tag: "h1",
        content: getSoleAttr(node.attrs!) ? [
            {
                tag: "a",
                attrs: {
                    "id": getSoleAttr(node.attrs!)
                },
                content: node.content
            }
        ] : node.content
    }),
    h2: node => ({
        tag: "h2",
        content: getSoleAttr(node.attrs!) ? [
            {
                tag: "a",
                attrs: {
                    "id": getSoleAttr(node.attrs!)
                },
                content: node.content
            }
        ] : node.content
    }),
    h3: node => ({
        tag: "h3",
        content: getSoleAttr(node.attrs!) ? [
            {
                tag: "a",
                attrs: {
                    "id": getSoleAttr(node.attrs!)
                },
                content: node.content
            }
        ] : node.content
    }),
    align: node => ({
        tag: "div",
        attrs: {
            style: cssPropertiesToString({
                textAlign: (node.attrs ? getSoleAttr(node.attrs) || "center" : "center") as any
            })
        },
        content: node.content
    }),
    img: node => ({
        tag: "img",
        attrs: {
            src: (() => {
                let url = "";
                if (typeof node.content == "string") {
                    url = node.content;
                } else if (typeof node.content == "object" && node.content.length > 0 && typeof node.content[0] === "string") {
                    url = node.content[0] as string;
                } else {
                    return "";
                }

                if (isURL(url, urlOptions) || isDataURI(url)) {
                    return url;
                } else {
                    return "/res/img/blocked.png";
                }
            })(),
            tabindex: "0"
        },
        content: []
    }),
    code: node => ({
        tag: "code",
        attrs: {
            "data-lang": node.attrs?.["lang"] || "sb3",
            "data-inline": (node.attrs?.["inline"] == "inline") ? "true" : undefined
        },
        content: node.content
    }),
    spoiler: node => ({
        tag: "div",
        attrs: {
            "class": "spoiler"
        },
        content: [{
            tag: "button",
            attrs: {
                "class": "spoiler-open",
                "data-open": "false",
                "onClick": "event.target.dataset.open = ['true', 'false'][(['true', 'false'].indexOf(event.target.dataset.open) + 1) % 2]"
            },
            content: [` ${getSoleAttr(node.attrs!) || "spoiler"}`]
        },
        {
            tag: "div",
            attrs: {
                class: "spoiler-content"
            },
            content: node.content
        }]
    }),
    quote: node => ({
        tag: "blockquote",
        content: [
            getSoleAttr(node?.attrs! ?? {}) ? {
                tag: "h3",
                attrs: {},
                content: getSoleAttr(node.attrs!)
            } : "",
            ...node.content
        ]
    }),
    anchor: node => ({
        tag: "a",
        attrs: {
            id: getSoleAttr(node.attrs!)
        },
        content: node.content
    }),
    table: node => ({
        tag: "table",
        attrs: {
            style: cssPropertiesToString({
                borderWidth: +(node.attrs!["border"] || 0)
            })
        },
        content: node.content
    }),
    th: node => ({
        tag: "th",
        attrs: {},
        content: node.content
    }),
    tr: node => ({
        tag: "tr",
        attrs: {},
        content: node.content
    }),
    td: node => ({
        tag: "td",
        attrs: {},
        content: node.content
    })
} as (Dictionary<((node: TagNode) => TagNode)>)

const preset = createPreset(tags);

export default (({
    code,
    markupLang = "12y",
    className = ""
}) => {
    if (markupLang == "12y") {
        return <div className={`bbcode-view ${className}`} dangerouslySetInnerHTML={{
            __html: TwelveMarkup(code || "")?.innerHTML || ""
        }} />
    } else if (markupLang == "bbcode") {
        return (<div className={`bbcode-view ${className}`} dangerouslySetInnerHTML={{
            __html: BBCode(entities.encode(code || "").replace(/\\\[/g, "&lsqb;").replace(/\\\]/g, "&rsqb;").replace(/&quot;/g, "\""), preset(), {
                onlyAllowTags: Object.keys(tags)
            })
        }} />);
    } else {
        return <h1>Unknown markup lang {markupLang}</h1>
    }
}) as React.FunctionComponent<{
    code: string,
    markupLang?: string,
    className?: string
}>;
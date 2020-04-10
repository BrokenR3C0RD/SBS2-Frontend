import BBCode from "@bbob/html";
import createPreset, { Node, TagNode } from "@bbob/preset";
import { Dictionary } from "../interfaces";
import { isURL } from "validator";

import { Html5Entities } from "html-entities";

const entities = new Html5Entities;

function getSoleAttr(attrs: Dictionary<string | object>) {
    return Object.keys(attrs).find(key => attrs[key] == key);
}

const urlOptions = {
    protocols: ['http', 'https', 'ftp'],
    require_tld: true,
    require_protocol: false,
    require_host: false,
    require_valid_protocol: true,
    allow_underscores: false,
    host_whitelist: undefined,
    host_blacklist: undefined,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: true, disallow_auth: false
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
        tag: "sup",
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
            src: isURL((node.content?.toString() || node.content[0]?.toString() || "").trim()) ? ((node.content?.toString() || node.content[0]?.toString() || "")).trim() : ""
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
    })
} as (Dictionary<((node: TagNode) => TagNode)>)
const preset = createPreset(tags);



export default (({
    code,
    className = ""
}) => {
    return (<div className={`bbcode-view ${className}`} dangerouslySetInnerHTML={{
        __html: BBCode(entities.encode(code), preset(), {
            onlyAllowTags: Object.keys(tags)
        })
    }}></div>);
}) as React.FunctionComponent<{
    code: string,
    className?: string
}>;
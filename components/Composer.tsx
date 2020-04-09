import BBCode from "@bbob/html";
import createPreset, {Node, TagNode} from "@bbob/preset";
import { Dictionary } from "../interfaces";
import React, { useState, useRef } from "react";
import { isURL } from "validator";

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

function cssPropertiesToString(inp: React.CSSProperties){
    let x = document.createElement("span")
    let key: string;
    for(key in inp)
        x.style[key as any] = (inp as any)[key];
    
    return x.style.cssText;

}

function validURL(url: string){
    return isURL(url, urlOptions) || /^(#[A-Za-z0-9-._~:/?#[\]@!$&'()*+,;=%]*)/.test(url);
}

function fixBBCode(content: (Node | string)[]){
    let output: (Node | string)[] = [];
    for(let i = 0; i < content.length; i++){
        let c = content[i];
        if(typeof c == "string" || c.tag != "*" || c.content.length != 0){
            output.push(c);
        } else {
            c.tag = "li";
            c.content = [];
            i++;
            while(typeof content[i] == "string")
                c.content.push((content[i++] as string).trim());
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
    })
} as (Dictionary<((node: TagNode) => TagNode)>)

const preset = createPreset(tags);

export default (({}) => {
    const [code, setCode] = useState("");
    const areaRef = useRef<HTMLTextAreaElement>(null);
    
    function updatePreview(evt: React.FormEvent<HTMLTextAreaElement>) {
        setCode(evt.currentTarget.value.replace(/\\\[/g, "&lsqb;").replace(/\\\]/g, "&rsqb;"));
    }
    function handleKeys(evt: React.KeyboardEvent<HTMLTextAreaElement>){
        const area = evt.currentTarget;
        let pos = area.selectionStart;

        if(evt.key == "Tab"){
            evt.preventDefault();
            area.value = area.value.substr(0, pos) + " ".repeat(4) + area.value.substr(pos);
            area.selectionStart = pos + 4;
        } else if(evt.ctrlKey && evt.key == "b"){
            evt.preventDefault();
            insertTag("b")();
        } else if(evt.ctrlKey && evt.key == "i"){
            evt.preventDefault();
            insertTag("i")();
        } else if(evt.ctrlKey && evt.key == "u"){
            evt.preventDefault();
            insertTag("u")(); 
        } else if(evt.ctrlKey && evt.key == "k"){
            evt.preventDefault();
            insertTag("url")();
        }
    }
    function insertTag(tagName: string){
        return () => {
            let area = areaRef.current!;
            const selectionStart = Math.min(area.selectionStart, area.selectionEnd);
            const selectionEnd = Math.max(area.selectionStart, area.selectionEnd);

            let between = area.value.substring(selectionStart, selectionEnd);
            area.value = area.value.substr(0, selectionStart) + `[${tagName}]` + between + `[/${tagName.substr(0, tagName.indexOf("=") == -1 ? tagName.length : tagName.indexOf("="))}]` + area.value.substr(selectionEnd);
            area.selectionStart = selectionStart + tagName.length + 2;
            area.selectionEnd = selectionEnd + tagName.length + 2;
            area.focus();

            setCode(area.value.replace(/\\\[/g, "&lsqb;").replace(/\\\]/g, "&rsqb;"));
        }
    }


    return (
        <div className="composer">
            <div className="composer-editorwrapper">
                <ul className="composer-commands">
                    <li><button onClick={insertTag("b")}><b>B</b></button></li>
                    <li><button onClick={insertTag("i")}><i>I</i></button></li>
                    <li><button onClick={insertTag("u")}><u>U</u></button></li>
                    <li><button onClick={insertTag("s")}><s>S</s></button></li>
                    <li><button onClick={insertTag("sup")}>X<sup>s</sup></button></li>
                    <li><button onClick={insertTag("sub")}>X<sub>s</sub></button></li>
                    <li></li>
                    <li><button onClick={insertTag("align=left")}><span className="iconify" data-icon="oi-align-left" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=center")}><span className="iconify" data-icon="oi-align-center" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=right")}><span className="iconify" data-icon="oi-align-right" data-inline="true"></span></button></li>
                    <li></li>
                    <li><button onClick={insertTag("url=")}><span className="iconify" data-icon="oi:link-intact" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("img")}><span className="iconify" data-icon="oi:image" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("list")}><span className="iconify" data-icon="oi:list" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("poll")} disabled><span className="iconify" data-icon="mdi-poll" data-inline="true"></span></button></li>
                    <li></li>
                    <li><button onClick={insertTag("h1")}>H1</button></li>
                    <li><button onClick={insertTag("h2")}>H2</button></li>
                    <li><button onClick={insertTag("h3")}>H3</button></li>
                    <li><button onClick={insertTag("code")}><span className="iconify" data-icon="bx:bx-code" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("spoiler")}><span className="iconify" data-icon="dashicons:hidden" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("youtube")}><span className="iconify" data-icon="ant-design:youtube-filled" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("quote")}><span className="iconify" data-icon="oi:double-quote-serif-left" data-inline="true"></span></button></li>
                </ul>
                <textarea ref={areaRef} className="composer-editor" onInput={updatePreview} onKeyDown={handleKeys} autoCapitalize="off" autoComplete="off" autoCorrect="off" autoSave="off" data-enable-grammarly="false"></textarea>
            </div>
            <div className="composer-preview" dangerouslySetInnerHTML={{
                __html: BBCode(code, preset(), {
                    onlyAllowTags: Object.keys(tags)
                })
            }}></div>
        </div>
    );
}) as React.FunctionComponent;
import React, { useState, useRef } from "react";
import BBCodeView from "./BBCode";

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
                <textarea ref={areaRef} className="composer-editor" onInput={updatePreview} onKeyDown={handleKeys} autoCapitalize="off" autoComplete="off" autoCorrect="off" autoSave="off" data-enable-grammarly="false"></textarea>
                <ul className="composer-commands">
                    <li><button onClick={insertTag("b")}><b>B</b></button></li>
                    <li><button onClick={insertTag("i")}><i>I</i></button></li>
                    <li><button onClick={insertTag("u")}><u>U</u></button></li>
                    <li><button onClick={insertTag("s")}><s>S</s></button></li>
                    <li><button onClick={insertTag("sup")}>X<sup>s</sup></button></li>
                    <li><button onClick={insertTag("sub")}>X<sub>s</sub></button></li>
                    <li><button onClick={insertTag("h1")}>H1</button></li>
                    <li><button onClick={insertTag("h2")}>H2</button></li>
                    <li><button onClick={insertTag("h3")}>H3</button></li>
                    <li><button onClick={insertTag("align=left")}><span className="iconify" data-icon="oi-align-left" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=center")}><span className="iconify" data-icon="oi-align-center" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=right")}><span className="iconify" data-icon="oi-align-right" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("url=")}><span className="iconify" data-icon="oi:link-intact" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("img")}><span className="iconify" data-icon="oi:image" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("list")}><span className="iconify" data-icon="oi:list" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("poll")} disabled><span className="iconify" data-icon="mdi-poll" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("code")}><span className="iconify" data-icon="bx:bx-code" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("spoiler")}><span className="iconify" data-icon="dashicons:hidden" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("youtube")}><span className="iconify" data-icon="ant-design:youtube-filled" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("quote")}><span className="iconify" data-icon="oi:double-quote-serif-left" data-inline="true"></span></button></li>
                    <li><select value={1}>
                        <option>BBCode</option>
                        <option>Markdown</option>
                    </select></li>
                </ul>
            </div>
            <div className="composer-previewwrapper">
                <BBCodeView className="composer-preview" code={code} />
            </div>
        </div>
    );
}) as React.FunctionComponent;
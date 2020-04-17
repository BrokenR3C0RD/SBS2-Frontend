import React, { useState, useRef, useEffect } from "react";
import BBCodeView from "./BBCode";

export default (({
    code = "",
    onChange = () => {}
}) => {
    const [ccode, setCode] = useState("");
    const areaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setCode(code);
    }, [code]);
    
    function updatePreview(evt: React.FormEvent<HTMLTextAreaElement>) {
        setCode(evt.currentTarget.value);
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

        if(onChange)
            onChange(area.value);
        
    }
    function insertTag(tagName: string, defaultContent?: string){
        return () => {
            let area = areaRef.current!;
            const selectionStart = Math.min(area.selectionStart, area.selectionEnd);
            const selectionEnd = Math.max(area.selectionStart, area.selectionEnd);

            let between = area.value.substring(selectionStart, selectionEnd);
            if(between.length == 0)
                between = defaultContent || "";
            
            area.value = area.value.substr(0, selectionStart) + `[${tagName}]` + between + `[/${tagName.substr(0, tagName.indexOf("=") == -1 ? tagName.length : tagName.indexOf("="))}]` + area.value.substr(selectionEnd);
            area.selectionStart = selectionStart + tagName.length + 2;
            area.selectionEnd = selectionEnd + tagName.length + 2;
            area.focus();

            setCode(area.value);
            if(onChange)
                onChange(area.value);
        }
    }


    return (
        <div className="composer">
            <div className="composer-editorwrapper">
                <textarea ref={areaRef} value={ccode} className="composer-editor" onInput={updatePreview} onKeyDown={handleKeys} autoCapitalize="off" autoComplete="off" autoCorrect="off" autoSave="off" data-enable-grammarly="false" name="composer-code"></textarea>
                <ul className="composer-commands">
                    <li><button onClick={insertTag("b")} type="button"><b>B</b></button></li>
                    <li><button onClick={insertTag("i")} type="button"><i>I</i></button></li>
                    <li><button onClick={insertTag("u")} type="button"><u>U</u></button></li>
                    <li><button onClick={insertTag("s")} type="button"><s>S</s></button></li>
                    <li><button onClick={insertTag("sup")} type="button">X<sup>s</sup></button></li>
                    <li><button onClick={insertTag("sub")} type="button">X<sub>s</sub></button></li>
                    <li><button onClick={insertTag("h1")} type="button">H1</button></li>
                    <li><button onClick={insertTag("h2")} type="button">H2</button></li>
                    <li><button onClick={insertTag("h3")} type="button">H3</button></li>
                    <li><button onClick={insertTag("align=left")} type="button"><span className="iconify" data-icon="oi-align-left" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=center")} type="button"><span className="iconify" data-icon="oi-align-center" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=right")} type="button"><span className="iconify" data-icon="oi-align-right" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("url=")} type="button"><span className="iconify" data-icon="oi:link-intact" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("anchor=")} type="button"><span className="iconify" data-icon="vaadin:anchor" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("img")} type="button"><span className="iconify" data-icon="oi:image" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("list")} type="button"><span className="iconify" data-icon="oi:list" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("poll")} disabled type="button"><span className="iconify" data-icon="mdi-poll" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("code")} type="button"><span className="iconify" data-icon="bx:bx-code" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("spoiler")} type="button"><span className="iconify" data-icon="dashicons:hidden" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("youtube")} type="button"><span className="iconify" data-icon="ant-design:youtube-filled" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("quote")} type="button"><span className="iconify" data-icon="oi:double-quote-serif-left" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("table", "\n [tr]\n  [th]Table Heading 1[/th]\n  [th]Table Heading 2[/th]\n [/tr]\n[tr]\n  [td]Data1[/td]\n  [td]Data2[/td]\n [/tr]\n")} type="button"><span className="iconify" data-icon="mdi:table" data-inline="true"></span></button></li>
                    <li><select name="markup-lang" defaultValue={1}>
                        <option>BBCode</option>
                        <option disabled>Markdown</option>
                    </select></li>
                </ul>
            </div>
            <div className="composer-previewwrapper">
                <BBCodeView className="composer-preview" code={ccode} />
            </div>
        </div>
    );
}) as React.FunctionComponent<{
    onChange?: (value: string) => any,
    code?: string
}>;
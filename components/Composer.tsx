import React, { useState, useRef, useEffect, useCallback } from "react";
import BBCodeView from "./BBCode";
import {UploadFile} from "../utils/Request";
import {useDropzone} from "react-dropzone";
import { API_ENTITY } from "../utils/Constants";

export default (({
    code = "",
    markup = "",
    onChange = () => { },
    hidePreview = false
}) => {
    const [ccode, setCode] = useState("");
    const [cmarkup, setMarkup] = useState("bbcode")
    const areaRef = useRef<HTMLTextAreaElement>(null);
    const [preview, setPreview] = useState(!hidePreview);

    useEffect(() => {
        setCode(code);
        setMarkup(markup);
    }, [code, markup]);

    let onDrop = useCallback(async (files: File[]) => {
        let file = files[0];
        if(file){
            let d = await UploadFile(file);
            console.log(d);
            return insertTag("img", `${API_ENTITY("File")}/raw/${d}`)();
        }
    }, []);

    const {getRootProps, getInputProps, isDragActive, inputRef} = useDropzone({onDrop, noClick: true, multiple: false})

    function updatePreview(evt: React.FormEvent<HTMLTextAreaElement>) {
        setCode(evt.currentTarget.value);
    }

    function handleKeys(evt: React.KeyboardEvent<HTMLTextAreaElement>) {
        const area = evt.currentTarget;
        let pos = area.selectionStart;

        if (evt.key == "Tab") {
            evt.preventDefault();
            area.value = area.value.substr(0, pos) + " ".repeat(4) + area.value.substr(pos);
            area.selectionStart = pos + 4;
        } else if (evt.ctrlKey && evt.key == "b") {
            evt.preventDefault();
            insertTag("b")();
        } else if (evt.ctrlKey && evt.key == "i") {
            evt.preventDefault();
            insertTag("i")();
        } else if (evt.ctrlKey && evt.key == "u") {
            evt.preventDefault();
            insertTag("u")();
        } else if (evt.ctrlKey && evt.key == "k") {
            evt.preventDefault();
            insertTag("url")();
        }
    }
    function insertTag(tagName: string, defaultContent?: string) {
        return () => {
            let area = areaRef.current!;
            const selectionStart = Math.min(area.selectionStart, area.selectionEnd) || 0;
            const selectionEnd = Math.max(area.selectionStart, area.selectionEnd) || 0;

            let between = area.value.substring(selectionStart, selectionEnd);
            if (between.length == 0)
                between = defaultContent || "";
            
            console.log(area);
            area.selectionStart = selectionStart + tagName.length + 2;
            area.selectionEnd = selectionEnd + tagName.length + 2;
            area.focus();

            setCode(area.value.substr(0, selectionStart) + `[${tagName}]` + between + `[/${tagName.substr(0, tagName.indexOf("=") == -1 ? tagName.length : tagName.indexOf("="))}]` + area.value.substr(selectionEnd));
            if (onChange)
                onChange(area.value, cmarkup);
        }
    }


    return (
        <div className="composer" data-previewhidden={!preview}>
            <div className="composer-editorwrapper" {...getRootProps()}>
                <input {...getInputProps()} /> 
                {isDragActive && <div className="composer-dropping">
                    <p>Drop here to upload</p>    
                </div>}
                <textarea ref={areaRef} value={ccode} className="composer-editor" onInput={updatePreview} onKeyDown={handleKeys} autoCapitalize="off" autoComplete="off" autoCorrect="off" autoSave="off" data-enable-grammarly="false" name="composer-code" onChange={(evt) => onChange(evt.currentTarget.value, markup)}></textarea>
                <ul className="composer-commands" onClick={(evt) => evt.currentTarget == evt.target && areaRef.current!.focus()}>
                    <li><button onClick={insertTag("b")} type="button" title="Bold"><b>B</b></button></li>
                    <li><button onClick={insertTag("i")} type="button" title="Italics"><i>I</i></button></li>
                    <li><button onClick={insertTag("u")} type="button" title="Underline"><u>U</u></button></li>
                    <li><button onClick={insertTag("s")} type="button" title="Strikethrough"><s>S</s></button></li>
                    <li><button onClick={insertTag("sup")} type="button" title="Superscript">X<sup>s</sup></button></li>
                    <li><button onClick={insertTag("sub")} type="button" title="Subscript">X<sub>s</sub></button></li>
                    <li><button onClick={insertTag("h1")} type="button" title="Heading 1">H1</button></li>
                    <li><button onClick={insertTag("h2")} type="button" title="Heading 2">H2</button></li>
                    <li><button onClick={insertTag("h3")} type="button" title="Heading 3">H3</button></li>
                    <li><button onClick={insertTag("align=left")} type="button" title="Align left"><span className="iconify" data-icon="oi-align-left" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=center")} type="button" title="Align center"><span className="iconify" data-icon="oi-align-center" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("align=right")} type="button" title="Align right"><span className="iconify" data-icon="oi-align-right" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("url=")} type="button" title="Link"><span className="iconify" data-icon="oi:link-intact" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("anchor=")} type="button" title="Anchor"><span className="iconify" data-icon="vaadin:anchor" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("img")} type="button" title="Image"><span className="iconify" data-icon="oi:image" data-inline="true"></span></button></li>
                    <li><button onClick={() => {inputRef.current?.click()}} type="button"><span className="iconify" data-icon="mdi:cloud-upload-outline" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("list")} type="button" title="List"><span className="iconify" data-icon="oi:list" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("poll")} disabled type="button" title="Poll"><span className="iconify" data-icon="mdi-poll" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("code")} type="button" title="Code"><span className="iconify" data-icon="bx:bx-code" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("spoiler")} type="button" title="Spoiler"><span className="iconify" data-icon="dashicons:hidden" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("youtube")} type="button" title="YouTube"><span className="iconify" data-icon="ant-design:youtube-filled" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("quote")} type="button" title="Quote"><span className="iconify" data-icon="oi:double-quote-serif-left" data-inline="true"></span></button></li>
                    <li><button onClick={insertTag("table", "\n [tr]\n  [th]Table Heading 1[/th]\n  [th]Table Heading 2[/th]\n [/tr]\n[tr]\n  [td]Data1[/td]\n  [td]Data2[/td]\n [/tr]\n")} type="button" title="Table"><span className="iconify" data-icon="mdi:table" data-inline="true"></span></button></li>
                    <li><select name="markup-lang" value={cmarkup} onChange={(evt) => {setMarkup(evt.currentTarget.value); onChange(ccode, markup)}} title="Markup language">
                        <option value="12y" disabled>12-Y-Markup</option>
                        <option value="bbcode">BBCode</option>
                    </select></li>
                    {hidePreview && <li><button onClick={() => {setPreview(!preview); areaRef.current!.focus()}} type="button" title="Show Preview">{preview ? "<" : ">"}</button></li>}
                </ul>
            </div>
            {preview &&
                <div className="composer-previewwrapper">
                    <BBCodeView className="composer-preview" code={ccode} />
                </div>
            }
        </div>
    );
}) as React.FunctionComponent<{
    onChange?: (value: string, markup: string) => any,
    code?: string,
    markup?: string,
    hidePreview?: boolean
}>;
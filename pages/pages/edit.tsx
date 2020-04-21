import { NextPage } from "next";
import { useEffect, useState } from "react";
import { PageProps, Dictionary } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import Composer from "../../components/Composer";
import Form from "../../components/Form";
import UserPicker from "../../components/UserPicker";
import { useRouter } from "next/router";
import { GetSBAPIInfo, KeyInfo } from "../../utils/SBAPI";
import Moment from "moment";
import { Page, ProgramPage } from "../../classes";
import { PAGE_CATEGORY } from "../../utils/Constants";
import { CRUD } from "../../classes/Entity";

function size(number: number): string {
    const suffixes = ["KB", "MB", "GB"];
    let suffix = "B";
    let res = number;

    while (res >= 1024) {
        res /= 1024;
        suffix = suffixes.shift() as string;
    }

    return `${res.toPrecision(3)} ${suffix}`
}

export default (({
    setInfo,
    user
}) => {
    const Router = useRouter();
    const { pid } = Router.query;

    useEffect(() => setInfo("Edit page", []), []);
    useEffect(() => {
        if (user === null)
            Router.push("/login");
    }, [user])

    const [, origPages] = ProgramPage.usePage({
        ids: [+pid]
    });

    useEffect(() => {
        if (pid == null) {
            setTitle("");
            setCode("");
            setPerms([]);
            setProgramPage(false);
            setMarkup("bbcode");
            setKeywords([]);
        }
    }, [pid]);
    useEffect(() => {
        if (origPages && origPages.length > 0) {
            const page = origPages[0] as Page | ProgramPage;
            if (page.type == "@page.program") {
                setKey(page.values.key);
                FetchSBAPIInformation(page.values.key);
                setCompat(JSON.parse(page.values.supported));
                setSupported(Object.keys(JSON.parse(page.values.supported)));
            }
            setTitle(page.title);
            setCode(page.content);
            setPerms(Object.keys(page.permissions).map(id => +id).filter(id => id !== 0));
            setProgramPage(page.type === "@page.program");
            setMarkup(page.values.markupLang);
            setKeywords(page.keywords);
        }
    }, [origPages])

    const [programPage, setProgramPage] = useState<boolean>(false);
    const [key, setKey] = useState<string>();
    const [title, setTitle] = useState<string>();
    const [code, setCode] = useState<string>("");
    const [markup, setMarkup] = useState<string>("bbcode")
    const [compat, setCompat] = useState<Dictionary<boolean>>({
        o3ds: false,
        n3ds: false,
        wiiu: false
    });
    const [supported, setSupported] = useState<string[]>([
        "o3ds", "n3ds", "wiiu"
    ]);


    const [perms, setPerms] = useState<number[]>([]);

    const [keyInfo, setKeyInfo] = useState<KeyInfo>();
    const [keywords, setKeywords] = useState<string[]>([]);

    const [errors, setErrors] = useState<string[]>([]);

    async function SubmitPage(data: Dictionary<string | boolean | number>) {
        setErrors([]);
        if (programPage && keyInfo == null) {
            return setErrors(["You need to provide a key!"]);
        }

        const info = data;
        let content: Partial<Page | ProgramPage> = {
            title: info["title"] as string,
            content: info["composer-code"] as string,
            values: programPage ? {
                key: keyInfo!.path,
                originalAuthor: info["translatedfor"] as string,
                supported: JSON.stringify({
                    o3ds: keyInfo!.extInfo.console !== "Switch" && supported.indexOf("o3ds") !== -1 ? compat["o3ds"] : undefined,
                    n3ds: keyInfo!.extInfo.console !== "Switch" && supported.indexOf("n3ds") !== -1 ? compat["n3ds"] : undefined,
                    wiiu: keyInfo!.extInfo.console !== "Switch" && supported.indexOf("wiiu") !== -1 ? compat["wiiu"] : undefined,
                    switch: keyInfo!.extInfo.console === "Switch" ? false : undefined
                }),
                markupLang: info["markup_lang"] as string,
                photos: ""
            } : {
                    markupLang: info["markup_lang"] as string
                },
            keywords: keywords.map(tag => tag.trim()),
            permissions: {
                "0": "cr",
                ...perms.reduce<Dictionary<string>>((acc, id) => (acc[id.toString()] = "cru") && acc, {})
            },
            parentId: PAGE_CATEGORY,
            id: origPages && origPages.length !== 0 ? origPages[0].id : undefined,
            type: programPage ? "@page.program" : "@page.resource"
        }
        try {
            let result = await Page.Update(content);
            if (result != null) {
                Router.push("/pages/[pid]", `/pages/${result.id}`);
            }
        } catch (e) {
            console.log(e.stack);
            let errors: string[] = [];
            if (e instanceof Error) {
                errors.push(e.message);
            }
            setErrors(errors);
        }
    }
    async function FetchSBAPIInformation(evt: React.MouseEvent<HTMLButtonElement> | string) {
        typeof evt !== "string" && evt.preventDefault();
        setErrors([]);
        let tkey = key;
        if (typeof evt == "string")
            tkey = evt;

        if (tkey == null)
            return;

        try {
            const info = await GetSBAPIInfo(tkey);
            if (info == null) {
                setKeyInfo(undefined);
                setErrors(["Key doesn't exist!"]);
            } else {
                setKeyInfo(info);
                if (code.length == 0 && info.extInfo.console === "Switch" && info.type == "PRJ" && info.extInfo.project_description) {
                    setCode(`[code lang=none]${info.extInfo.project_description}[/code]`);
                }
                if (keywords.length == 0)
                    setKeywords(([
                        info.extInfo.console === "3DS" && "SB3",
                        info.extInfo.console === "Switch" && "SB4",
                        ...(info.extInfo.tags || [])
                    ].filter(tag => tag !== false) as string[]));
            }
        } catch (e) {
            console.log(e.stack);
            let errors: string[] = [];
            if (e instanceof Error) {
                errors.push(e.message);
            }
            setErrors(errors);
        }
    }

    return <>
        <Form onSubmit={SubmitPage}>
            <Grid
                rows={["min-content(1fr)", "1fr", "1fr", "min-content(1fr)"]}
                cols={["1fr", "1fr"]}
                gapX="2em"
                gapY="2em"
                style={{
                    width: "100%"
                }}
            >
                <Cell x={1} y={1} width={2}>
                    <h1>Editing Page: {title}</h1>
                    <label>
                        <input type="checkbox" name="is_resource" checked={programPage} onChange={(evt) => setProgramPage(evt.currentTarget.checked)} />{` `}
                        This page is for a program.
                    </label>
                </Cell>
                {!programPage && <Cell x={1} y={2} width={2}>
                    <input type="text" name="title" placeholder="Title" autoComplete="off" required value={title} onChange={(evt) => setTitle(evt.currentTarget.value)} style={{ fontSize: "1.5em" }} />
                    <br />
                    <h2>Editors:</h2>
                    <p><b>
                        Note: Editors can edit your page at any time. This includes adding/removing other editors. They cannot delete your page, but they can
                        make it difficult for other people to access it. Only add editors if you trust them.
                        </b></p>
                    <UserPicker values={perms} onChange={setPerms} />
                </Cell>}
                {programPage && <>
                    <Cell x={1} y={2}>
                        <h2>Details about your program:</h2>
                        <input type="text" autoComplete="off" name="publickey" placeholder="KEY" style={{ width: "80%", float: "left", fontSize: "32px", fontFamily: "SMILEBASIC" }} value={key} onChange={(evt) => setKey(evt.currentTarget.value)} /*pattern="^4?[A-HJ-NP-TV-Z1-9]{1,8}$"*/ required />
                        <button onClick={FetchSBAPIInformation} style={{ width: "20%", float: "right", fontSize: "32px", fontFamily: "SMILEBASIC" }} type="button">GET!</button>
                        {keyInfo &&
                            <input type="text" name="title" placeholder="Title" autoComplete="off" required value={title} onChange={(evt) => setTitle(evt.currentTarget.value)} style={{ fontSize: "1.5em" }} />
                        }
                        {keyInfo && keyInfo.extInfo.console === "3DS" && <>
                            <h3>Supported devices</h3>
                            <table>
                                <tr>
                                    <td>
                                        Old 3DS:{` `}
                                    </td>
                                    <td>
                                        <input type="checkbox" name="supports_o3ds" checked={supported.indexOf("o3ds") !== -1} onChange={evt => setSupported(evt.currentTarget.checked ? supported.concat(["o3ds"]) : supported.filter(v => v != "o3ds"))} />
                                    </td>
                                    <td>
                                        Requires DLC:{` `}
                                    </td>
                                    <td>
                                        <input type="checkbox" name="o3ds_requires_dlc" defaultChecked={compat["o3ds"]} onChange={evt => { compat["o3ds"] = evt.currentTarget.checked; setCompat(compat); }} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        New 3DS:{` `}
                                    </td>
                                    <td>
                                        <input type="checkbox" name="supports_n3ds" checked={supported.indexOf("n3ds") !== -1} onChange={evt => setSupported(evt.currentTarget.checked ? supported.concat(["n3ds"]) : supported.filter(v => v != "n3ds"))} />
                                    </td>
                                    <td>
                                        Requires DLC:{` `}
                                    </td>
                                    <td>
                                        <input type="checkbox" name="n3ds_requires_dlc" defaultChecked={compat["n3ds"]} onChange={evt => { compat["n3ds"] = evt.currentTarget.checked; setCompat(compat); }} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>
                                        Wii U:{` `}
                                    </td>
                                    <td>
                                        <input type="checkbox" name="supports_wiiu" onChange={evt => { evt.currentTarget.checked ? compat["wiiu"] = false : delete compat["wiiu"]; setCompat(compat); }} />
                                    </td>
                                </tr>
                            </table>
                        </>}
                        <br />
                        {keyInfo && <>
                            <h2>Editors:</h2>
                            <p><b>
                                Note: Editors can edit your page at any time. This includes adding/removing other editors. They cannot delete your page, but they can
                                make it difficult for other people to access it. Only add editors if you trust them.
                            </b></p>
                            <UserPicker values={perms} onChange={setPerms} />
                        </>}
                    </Cell>

                    <Cell x={2} y={2}>
                        {!keyInfo && <h3>Put in a key to see its info!</h3>}
                        {keyInfo && <>
                            {keyInfo.extInfo.console == "Switch" && keyInfo.type === "PRJ" && <img width="32" src={`https://sbapi.me/get/${keyInfo.path}/META/icon`} />}
                            <h3 style={{
                                verticalAlign: "top",
                                lineHeight: "32px",
                                display: "inline-block",
                                marginTop: "0",
                                marginLeft: keyInfo.extInfo.console == "Switch" && keyInfo.type == "PRJ" ? "1em" : "0"
                            }}>
                                {keyInfo.extInfo.console == "Switch" && keyInfo.type === "PRJ" ? keyInfo.extInfo.project_name : keyInfo.filename.substr(1)}</h3>
                            <i style={{ display: "block" }}>{keyInfo.extInfo.console === "3DS" ? "SmileBASIC 3" : "SmileBASIC 4"}</i>
                            <table>
                                <tbody>
                                    <tr>
                                        <td>Size:</td>
                                        <td>{size(keyInfo.size)}</td>
                                    </tr>
                                    <tr>
                                        <td>Uploaded:</td>
                                        <td>{Moment(keyInfo.uploaded).fromNow()}</td>
                                    </tr>
                                    {keyInfo.extInfo.console === "Switch" && <tr>
                                        <td>Last updated:</td>
                                        <td>{Moment(keyInfo.version * 1000).fromNow()}</td>
                                    </tr>}
                                    <tr>
                                        <td>Downloaded:</td>
                                        <td>{keyInfo.downloads} times</td>
                                    </tr>
                                </tbody>
                            </table>
                        </>}
                    </Cell>
                </>
                }
                <Cell x={1} y={3} width={2}>
                    <h2>Content:</h2>
                    <Composer code={code} onChange={(newcode, newmarkup) => { setCode(newcode); setMarkup(newmarkup) }} markup={markup} />
                </Cell>
                <Cell x={1} y={4} width={2}>
                    <h2>Ready to post?</h2>
                    <div className="errors">
                        {errors.join(", ")}
                    </div>
                    {programPage && keyInfo == null && <p>You need to provide a valid key before submitting your page!</p>}
                    {user == null && <p>You can't create a page unless you log in!</p>}
                    {user != null && (origPages && !origPages[0].Permitted(user, CRUD.Update)) && <p>You don't have permission to edit this page!</p>}
                    {code.length < 2 && <p>You must provide a description!</p>}
                    <input type="submit" value="Post!" disabled={(programPage && keyInfo == null) || user == null || (origPages && !origPages[0].Permitted(user, CRUD.Update)) || code.length < 2 || false} />
                    <br />
                    <h3>Advanced</h3>
                    <input type="text" name="keywords" value={keywords.join(",")} onChange={(evt) => setKeywords(evt.currentTarget.value.split(","))} placeholder="Keywords" />
                </Cell>
            </Grid>
        </Form>
        <style jsx>{`
            input:invalid {
                border: 1px solid red !important;
            }
            input:invalid + button {
                display: none;
            }
            tr > td:first-child {
                font-weight: bold;
            }
        `}</style>
    </>;
}) as NextPage<PageProps>;
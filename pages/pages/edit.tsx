import { NextPage } from "next";
import { useEffect, useState } from "react";
import { PageProps, Dictionary } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import Composer from "../../components/Composer";
import Form from "../../components/Form"
import { useRouter } from "next/router";
import { GetSBAPIInfo, KeyInfo } from "../../utils/SBAPI";
import Moment from "moment";
import { ProgramPage } from "../../classes";
import { PROGRAM_PAGE_CATEGORY } from "../../utils/Constants";
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

    const [, origPages] = ProgramPage.usePage([+pid]);

    useEffect(() => {
        if(origPages && origPages.length > 0){
            const page = origPages[0] as ProgramPage;
            setKey(page.values.key);
            FetchSBAPIInformation(page.values.key);
            setTitle(page.title);
            setCode(page.content);
            setCompat(JSON.parse(page.values.supported));
            setSupported(Object.keys(JSON.parse(page.values.supported)));
        }
    }, [origPages])

    const [key, setKey] = useState<string>();
    const [title, setTitle] = useState<string>();
    const [code, setCode] = useState<string>();
    const [compat, setCompat] = useState<Dictionary<boolean>>({
        o3ds: false,
        n3ds: false,
        wiiu: false 
    });
    const [supported, setSupported] = useState<string[]>([
        "o3ds", "n3ds", "wiiu"
    ]);

    useEffect(() => console.log(compat), [compat])

    const [keyInfo, setKeyInfo] = useState<KeyInfo>();
    const [errors, setErrors] = useState<string[]>([]);

    async function SubmitPage(data: Dictionary<string | boolean | number>) {
        setErrors([]);
        if(keyInfo == null){
            return setErrors(["You need to provide a key!"]);
        }
        const info = data;
        console.log(data);
        let content: Partial<ProgramPage> = {
            title: info["title"] as string,
            content: info["composer-code"] as string,
            values: {
                key: keyInfo.path,
                originalAuthor: info["translatedfor"] as string,
                supported: JSON.stringify({
                    o3ds: keyInfo.extInfo.console   !== "Switch" && supported.indexOf("o3ds") !== -1 ? compat["o3ds"] : undefined,
                    n3ds: keyInfo.extInfo.console   !== "Switch" && supported.indexOf("n3ds") !== -1 ? compat["n3ds"] : undefined,
                    wiiu: keyInfo.extInfo.console   !== "Switch" && supported.indexOf("wiiu") !== -1 ? compat["wiiu"] : undefined,
                    switch: keyInfo.extInfo.console === "Switch" ? false : undefined
                }),
                markupLang: info["markup_lang"] as string,
                photos: ""
            },
            tags: [
                keyInfo.extInfo.console !== "Switch" && supported.indexOf("o3ds") !== -1 && "Old3DS Supported",
                keyInfo.extInfo.console !== "Switch" && data["supports_o3ds"] == "on" && compat["o3ds"]  && "Old3DS Requires DLC",
                keyInfo.extInfo.console !== "Switch" && supported.indexOf("n3ds") !== -1 && "New3DS Supported",
                keyInfo.extInfo.console !== "Switch" && data["supports_n3ds"] == "on" && compat["n3ds"]  && "New3DS Requires DLC",
                keyInfo.extInfo.console === "3DS" && "SmileBASIC 3",
                keyInfo.extInfo.console === "Switch" && "SmileBASIC 4"
            ].filter(tag => tag !== false) as string[],
            permissions: {
                "0": "cr"
            },
            parentId: PROGRAM_PAGE_CATEGORY,
            id: origPages && origPages.length !== 0 ? origPages[0].id : undefined
        }
        try {
            let result = await ProgramPage.Update(content);
            if(result != null){
                Router.push("/pages/[pid]", `/pages/${result.id}`);
            }
        } catch(e){
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
        if(typeof evt == "string")
            tkey = evt;
        
        if(tkey == null)
            return;

        try {
            const info = await GetSBAPIInfo(tkey);
            if (info == null) {
                setKeyInfo(undefined);
                setErrors(["Key doesn't exist!"]);
            } else {
                setKeyInfo(info);
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
                    <h1>Create a new page!</h1>
                </Cell>

                <Cell x={1} y={2}>
                    <h2>Details about your program:</h2>
                    <input type="text" autoComplete="off" name="publickey" placeholder="Public Key" style={{ width: "80%", float: "left" }} value={key} onChange={(evt) => setKey(evt.currentTarget.value)} pattern="^4?[A-HJ-NP-TV-Z1-9]{1,8}$" required />
                    <button onClick={FetchSBAPIInformation} style={{ width: "20%", float: "right" }} type="button">Get Info</button>
                    {keyInfo &&
                        <input type="text" name="title" placeholder="Title" autoComplete="off" required defaultValue={keyInfo.extInfo.project_name || keyInfo.filename.substr(1)} value={title} onChange={(evt) => setTitle(evt.currentTarget.value)} />
                    }
                    {keyInfo && keyInfo.extInfo.console === "3DS" && <>
                        <h3>Supported devices</h3>
                        <table>
                            <tr>
                                <td>
                                    Old 3DS:{` `}
                                </td>
                                <td>
                                    <input type="checkbox" name="supports_o3ds" checked={supported.indexOf("o3ds") !== -1} onChange={evt => setSupported(evt.currentTarget.checked ? supported.concat(["o3ds"]) : supported.filter(v => v != "o3ds")) } />
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
                                    <input type="checkbox" name="supports_n3ds" checked={supported.indexOf("n3ds") !== -1} onChange={evt => setSupported(evt.currentTarget.checked ? supported.concat(["n3ds"]) : supported.filter(v => v != "n3ds")) } />
                                </td>
                                <td>
                                    Requires DLC:{` `}
                                    </td>
                                <td>
                                    <input type="checkbox" name="n3ds_requires_dlc" defaultChecked={compat["n3ds"]} onChange={evt => { compat["n3ds"] = evt.currentTarget.checked; setCompat(compat); }}  />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Wii U:{` `}
                                    </td>
                                <td>
                                    <input type="checkbox" name="supports_wiiu" onChange={evt => {evt.currentTarget.checked ? compat["wiiu"] = false : delete compat["wiiu"]; setCompat(compat); }} />
                                </td>
                            </tr>
                        </table>
                    </>}
                    <div className="errors">
                        {errors.join(", ")}
                    </div>
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

                <Cell x={1} y={3} width={2}>
                    <h2>Content:</h2>
                    <Composer code={code} onChange={setCode} />
                </Cell>
                <Cell x={1} y={4} width={2}>
                    <h2>Ready to post?</h2>
                    {keyInfo == null && <p>You need to provide a valid key before submitting your page!</p>}
                    {user == null && <p>You can't create a page unless you log in!</p>}
                    {user != null && (origPages && !origPages[0].Permitted(user, CRUD.Update)) && <p>You don't have permission to edit this page!</p>}
                    <input type="submit" value="Post!" disabled={keyInfo == null || user == null || (origPages && !origPages[0].Permitted(user, CRUD.Update)) || false} />
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
import { NextPage } from "next";
import { useEffect, useState } from "react";
import { PageProps, Dictionary } from "../interfaces";
import { Grid, Cell } from "../components/Layout";
import { useRouter } from "next/router";
import Form from "../components/Form";
import { useSettings, Variable } from "../utils/User";
import {useDropzone} from "react-dropzone";
import { UploadFile, DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { UserPage } from "../classes";
import Composer from "../components/Composer";

export default (({
    setInfo,
    user
}) => {
    const Router = useRouter();

    const [pageCode, setPageCode] = useState<string>("");
    const [pageMarkup, setPageMarkup] = useState<string>("12y");

    useEffect(() => {user == null && Router.replace("/")});
    useEffect(() => setInfo("User Settings", []), []);

    const [, pages, mutate] = UserPage.useUserPage(user);
    let page = pages?.[0];

    useEffect(() => {
        if(page){
            setPageCode(page.content);
            setPageMarkup(page.values.markupLang);
        }
    }, [pages])

    async function onDrop(files: File[]){
        let file = files[0];
        if(file){
            try {
                let id = await UploadFile(file);
                await DoRequest({
                    url: `${API_ENTITY("User")}/basic`,
                    method: "PUT",
                    data: {
                        avatar: id
                    }
                });
                mutateSettings();
            } catch(e){
                console.log("Updating user avatar failed: " + e.stack || e.toString());
            }
        }
    }

    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, multiple: false, accept: "image/png, image/jpeg, image/gif"})


    const [, settings, mutateSettings] = useSettings();

    async function UpdateSettings(data: Dictionary<string | number | boolean>){
        await Variable("user_settings", JSON.stringify(Object.assign({}, settings, data)));
        mutateSettings();
        Router.push("/");
    }

    async function UpdatePage(){
        await UserPage.Update({
            type: "@user.page",
            id: page?.id,
            name: "Userpage",
            content: pageCode,
            values: {
                markupLang: pageMarkup
            },
            permissions: {
                0: "cr"
            },
            parentId: user!.id
        });
        mutate();
        await Router.replace("/user/[uid]", `/user/${user!.id}`);
    }

    return <>
        <Grid 
            rows={["1fr", "1fr"]}
            cols={["1fr", "1fr"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%",
                height: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1} width={2}>
                <h2>User settings:</h2>
                <Form onSubmit={UpdateSettings}>
                    <label>
                        Theme:{` `}
                        <select name="theme" defaultValue={(settings?.["theme"] as string) || "light"}>
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </label>
                    <label>
                        SiteJS:
                        <textarea name="SiteJS" defaultValue={(settings?.["SiteJS"] as string) || ""} />
                    </label>
                    Avatar:
                    <div {...getRootProps()}>
                        {isDragActive && <h1>Drop here!</h1>}
                        {!isDragActive && <h1>Drag your new avatar here or click to open files dialog</h1>}
                    </div>
                    <input {...getInputProps()} />
                    <input type="submit" value="Save Settings!" />
                </Form>
            </Cell>
            <Cell x={1} y={2} width={2}>
                <h2>User page</h2>
                <Composer code={pageCode} markup={pageMarkup} onChange={(code, markup) => {setPageCode(code); setPageMarkup(markup); }} />
                <button onClick={UpdatePage}>Update!</button>
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
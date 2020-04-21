import { NextPage } from "next";
import { useEffect } from "react";
import { PageProps, Dictionary } from "../interfaces";
import { Grid, Cell } from "../components/Layout";
import { useRouter } from "next/router";
import Form from "../components/Form";
import { useSettings, Variable } from "../utils/User";
import {useDropzone} from "react-dropzone";
import { UploadFile, DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";

export default (({
    setInfo,
    user
}) => {
    const Router = useRouter();

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

    useEffect(() => {user == null && Router.replace("/")});
    useEffect(() => setInfo("User Settings", []), []);

    const [, settings, mutateSettings] = useSettings();

    async function UpdateSettings(data: Dictionary<string | number | boolean>){
        await Variable("user_settings", JSON.stringify(Object.assign({}, settings, data)));
        mutateSettings();
        Router.push("/");
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
            <Cell x={1} y={1}>
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
        </Grid>
    </>;
}) as NextPage<PageProps>;
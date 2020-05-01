import { NextPage } from "next";
import { useEffect, useState } from "react";
import { PageProps, Dictionary } from "../interfaces";
import { Grid, Cell } from "../components/Layout";
import { useRouter } from "next/router";
import Form from "../components/Form";
import { useSettings, Variable, UpdateUser, UpdateSenstiveInformation } from "../utils/User";
import { useDropzone } from "react-dropzone";
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
    const [userPageMarkup, setUserPageMarkup] = useState<string>("12y");
    const [uploaded, setUploaded] = useState<boolean>(false);
    const [errors, setErrors] = useState<string>();
    const [sensErrors, setSensErrors] = useState<string>();
    const [uploadErrors, setUploadErrors] = useState<string>();
    const [pageErrors, setPageErrors] = useState<string>();


    useEffect(() => { user == null && Router.replace("/") });
    useEffect(() => setInfo("User Settings", []), []);

    const [pageMarkup, setPageMarkup] = useState<string>();
    const [commentMarkup, setCommentMarkup] = useState<string>();
    const [discussionMarkup, setDiscussionMarkup] = useState<string>();
    const [siteCSS, setSiteCSS] = useState<string>("");

    useEffect(() => {
        Variable("page-markup")
            .then(markup => setPageMarkup(markup || "bbcode"));

        Variable("comment-markup")
            .then(markup => setCommentMarkup(markup || "12y"));

        Variable("discussion-markup")
            .then(markup => setDiscussionMarkup(markup || "plaintext"));

        Variable("SiteCSS")
            .then(css => setSiteCSS(css || ""));
    }, [])

    const [, pages, mutate] = UserPage.useUserPage(user);
    let page = pages?.[0];

    useEffect(() => {
        if (page) {
            setPageCode(page.content);
            setUserPageMarkup(page.values.markupLang);
        }
    }, [pages])

    async function onDrop(files: File[]) {
        let file = files[0];
        if (file) {
            try {
                setUploaded(false);
                let id = await UploadFile(file);
                await DoRequest({
                    url: `${API_ENTITY("User")}/basic`,
                    method: "PUT",
                    data: {
                        avatar: id
                    }
                });
                UpdateUser();
                setUploaded(true);
                setUploadErrors(undefined);
            } catch (e) {
                console.log("Updating user avatar failed: " + e.stack || e.toString());
                setUploadErrors(e.toString());
            }
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: "image/png, image/jpeg, image/gif" })


    const [, settings, mutateSettings] = useSettings();

    async function UpdateSettings(data: Dictionary<string | number | boolean>) {
        try {
            await Variable("user_settings", JSON.stringify(Object.assign({}, settings, data)));
            
            await Variable("page-markup", pageMarkup!);
            await Variable("comment-markup", commentMarkup!);
            await Variable("discussion-markup", discussionMarkup!);
            await Variable("SiteCSS", siteCSS!);

            
            mutateSettings();
            Router.push("/");
        } catch (e) {
            console.log("Updating settings failed: " + e.stack || e.toString());
            setErrors(e.toString());
        }
    }

    async function UpdatePage() {
        try {
            await UserPage.Update({
                type: "@user.page",
                id: page?.id,
                name: "Userpage",
                content: pageCode,
                values: {
                    markupLang: userPageMarkup
                },
                permissions: {
                    0: "cr"
                },
                parentId: user!.id
            });
            mutate();
            await Router.replace("/user/[uid]", `/user/${user!.id}`);
        } catch (e) {
            console.log("Updating userpage failed: " + e.stack || e.toString());
            setPageErrors(e.toString());
        }
    }

    async function UpdateUserInfo(data: Dictionary<string | number | boolean>) {
        try {
            setSensErrors("");
            if (data["old_password"] == "")
                throw "You must provide your current password!";

            await UpdateSenstiveInformation({
                oldPassword: data["old_password"] as string,
                password: (data["new_password"] as string || undefined),
                username: (data["username"] as string || undefined),
                email: (data["new_email"] as string || undefined)
            });

            await Router.push("/");
        } catch (e) {
            console.log("Updating sensitive info failed: " + e.stack || e.toString());
            setSensErrors(e.toString());
        }
    }

    return <>
        <Grid
            rows={["1fr", "1fr", "1fr"]}
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
                    <h2>Default markups:</h2>
                    <label>
                        Pages:
                        <select name="pagemarkup" value={pageMarkup} onChange={(evt) => setPageMarkup(evt.currentTarget.value)} title="Markup language">
                            <option value="12y">12-Y-Markup</option>
                            <option value="bbcode">BBCode</option>
                            <option value="plaintext">Plaintext</option>
                        </select>
                    </label>
                    <label>
                        Comments:
                        <select name="commentmarkup" value={commentMarkup} onChange={(evt) => setCommentMarkup(evt.currentTarget.value)} title="Markup language">
                            <option value="12y">12-Y-Markup</option>
                            <option value="bbcode">BBCode</option>
                            <option value="plaintext">Plaintext</option>
                        </select>
                    </label>
                    <label>
                        Discussions:
                        <select name="discussionmarkup" value={discussionMarkup} onChange={(evt) => setDiscussionMarkup(evt.currentTarget.value)} title="Markup language">
                            <option value="12y">12-Y-Markup</option>
                            <option value="bbcode">BBCode</option>
                            <option value="plaintext">Plaintext</option>
                        </select>
                    </label>
                    <label>
                        SiteJS:
                        <textarea name="SiteJS" defaultValue={(settings?.["SiteJS"] as string) || ""} />
                    </label>
                    <label>
                        SiteCSS:
                        <textarea name="SiteCSS" value={siteCSS} onChange={evt => setSiteCSS(evt.currentTarget.value)} />
                    </label>
                    Avatar:
                    <div {...getRootProps({
                        className: "avatar-upload"
                    })}>
                        {isDragActive && <span>Drop here!</span>}
                        {!isDragActive && <>
                            <span>Drag and drop your avatar here or click here to open files dialog</span>
                            {uploaded && <p>Upload successful!</p>}
                            {uploadErrors && <p className="error">{uploadErrors}</p>}
                        </>}

                    </div>
                    <input {...getInputProps()} />
                    <input type="submit" value="Save Settings!" />
                    {errors && <p className="error">{errors}</p>}
                </Form>
            </Cell>
            <Cell x={1} y={2} width={2}>
                <h2>Change password/username/email</h2>
                <p>
                    You must enter your current password to change anything here.
                </p>
                <Form onSubmit={UpdateUserInfo}>
                    <input type="password" name="old_password" placeholder="Current Password (required)" required />
                    <br />
                    <input type="password" name="new_password" placeholder="New password" />
                    <br />
                    <input type="text" name="username" placeholder="New username" />
                    <ul>
                        <li>You can only have 3 unique usernames per month (sliding window)</li>
                        <li>You can freely switch back to a previous username that you've had within the past month at any time.</li>
                    </ul>
                    <input type="email" name="new_email" placeholder="New email" />
                    <input type="submit" value="Update!" />
                    <p className="errors">
                        {sensErrors}
                    </p>
                </Form>
            </Cell>
            <Cell x={1} y={3} width={2}>
                <h2>User page</h2>
                <Composer code={pageCode} markup={userPageMarkup} onChange={(code, markup) => { setPageCode(code); setUserPageMarkup(markup); }} />
                <button onClick={UpdatePage}>Update!</button>
                {pageErrors && <p className="error">{pageErrors}</p>}
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
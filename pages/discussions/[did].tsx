import { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageProps, Dictionary } from "../../interfaces";
import { Grid, Cell, Gallery } from "../../components/Layout";
import Form from "../../components/Form";
import { Page, ProgramPage, BaseUser, Comment } from "../../classes";
import { useRouter } from "next/router";
import BBCodeView from "../../components/BBCode";
import Moment from "moment";
import { CRUD } from "../../classes/Entity";
import { isURL } from "validator";
import { GetSBAPIInfo, KeyInfo } from "../../utils/SBAPI";
import Composer from "../../components/Composer";
import moment from "moment";


export default (({
    setInfo,
    user: self
}) => {
    useEffect(() => setInfo("Page", [1]), []);
    const Router = useRouter();
    const [keyInfo, setKeyInfo] = useState<KeyInfo | null>();

    const { pid } = Router.query;
    const [, pages] = Page.usePage([+pid]);
    const page = pages?.[0] as ProgramPage | undefined;

    useEffect(() => setInfo(page?.title || "", []), [pages]);

    const [comments, commentUsers] = Comment.useComments(pages);

    const [, users] = BaseUser.useUser([page?.userId as number]);
    const user = users?.[0];

    async function DeletePage() {
        if (!confirm("Are you sure you want to delete this page?"))
            return;

        await Page.Delete(page!);
        Router.push("/");
    }

    async function PostComment(data: Dictionary<string | boolean | number>){
        let commentText = data["composer-code"] as string;
        let markup = data["markup-lang"] as string;
        
        await Comment.Update({
            parentId: page!.id,
            content: {
                t: commentText,
                m: markup
            }
        });
    }

    useEffect(() => {
        if (page && page.type === "@page.program") {
            (async () => {
                const ki = await GetSBAPIInfo(page.values.key);
                if (ki == null) {
                    setKeyInfo(null);
                } else {
                    setKeyInfo(ki);
                }
            })();
        }
    }, [pages]);

    let supported: Dictionary<boolean> = {};
    if (page && page.type === "@page.program") {
        try {
            supported = JSON.parse(page.values.supported);
        } catch (e) {

        }
    }

    return <>
        <Grid
            rows={["min-content", "min-content", "1fr", "min-content"]}
            cols={["max-content", "1fr", "1fr"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%"
            }}
        >
            {(!pages || (pages!.length != 0 && !user)) && <Cell x={1} y={1} width={3}>
                <h1>Loading...</h1>
            </Cell>}
            {page && user &&
                <>

                    <Cell x={1} y={1} width={3}>
                        <h1>{page.title}
                            {self && page.Permitted(self, CRUD.Delete) && <button type="button" style={{ float: "right", fontSize: "1rem", height: "2em" }} onClick={DeletePage}>Delete</button>}
                            {self && page.Permitted(self, CRUD.Update) && <button type="button" style={{ float: "right", fontSize: "1rem", height: "2em" }} onClick={() => Router.push(`/pages/edit?pid=${page.id}`)}>Edit</button>}
                        </h1>
                    </Cell>
                    {page.type === "@page.program" && <>
                        <Cell x={1} y={2} className="program-infobox">
                            {keyInfo && keyInfo.extInfo.console === "Switch" && keyInfo.type === "PRJ" &&
                                <>
                                    <img src={`https://sbapi.me/get/${keyInfo.path}/META/icon`} width="64" style={{ imageRendering: "pixelated", verticalAlign: "middle", margin: "0 auto", display: "block", padding: ".5em" }} />
                                    <br />
                                </>
                            }

                            <h2 style={{ textAlign: "center", fontSize: "24px", textRendering: "optimizeLegibility", fontFamily: "SMILEBASIC", fontWeight: "normal", lineHeight: "32px", verticalAlign: "middle" }} >
                                {keyInfo && keyInfo.extInfo.project_name || keyInfo && `【${keyInfo.filename.substr(1)}】`}
                            </h2>
                            {page.values.photos &&
                                <Gallery className="program-images" width="400px" height="240px" timer={0}>
                                    {
                                        page.values.photos.split(",")
                                            .map((photo, i) => <img src={isURL(photo, {
                                                protocols: ['http', 'https', 'ftp'],
                                                require_tld: false,
                                                require_protocol: false,
                                                require_host: false,
                                                require_valid_protocol: true,
                                                allow_underscores: false,
                                                host_whitelist: undefined,
                                                host_blacklist: undefined,
                                                allow_trailing_dot: false,
                                                allow_protocol_relative_urls: true,
                                                disallow_auth: false
                                            }) ? photo : "/res/img/logo.svg"} key={i} data-chosen={i == 0} />)
                                    }
                                </Gallery>
                            }
                            <table cellSpacing={5}>
                                <tbody>
                                    <tr>

                                    </tr>
                                    <tr>
                                        <td>Submitted</td>
                                        <td>{Moment(page.createDate).fromNow()}</td>
                                    </tr>
                                    <tr>
                                        <td>Last updated</td>
                                        <td>{Moment.utc(page.editDate).fromNow()}</td>
                                    </tr>
                                    <tr>
                                        <td>Author</td>
                                        <td><Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link></td>
                                    </tr>
                                    <tr id="pubkey">
                                        <td>Public key</td>
                                        <td style={{
                                            textDecoration: keyInfo && !keyInfo.available ? "line-through" : undefined
                                        }}>{page.values.key}</td>
                                    </tr>
                                    <tr>
                                        <td>Compatible devices</td>
                                        <td>
                                            {
                                                Object
                                                    .keys(supported)
                                                    .map(device => {
                                                        switch (device) {
                                                            case "o3ds":
                                                                return `Old 3DS` + (supported[device] ? " (with DLC)" : "");
                                                            case "n3ds":
                                                                return `New 3DS` + (supported[device] ? " (with DLC)" : "");
                                                            case "wiiu":
                                                                return `Wii U` + (supported[device] ? " (with DLC)" : "");
                                                            case "switch":
                                                                return `Switch` + (supported[device] ? " (with DLC)" : "");
                                                        }
                                                    })
                                                    .map((m, i) => <span key={i}>{m}<br /></span>)
                                            }
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </Cell>
                        <Cell x={2} y={2} width={2} className="program-description">
                            <h2>Description</h2>
                            <BBCodeView code={page.content} />
                        </Cell>
                    </>}
                    {page.type === "@page.resource" && <>
                        <Cell x={1} y={2} width={3} height={1}>
                            <BBCodeView code={page.content} />
                        </Cell>
                        <Cell x={1} y={3} width={3}>
                            <b>Author: <Link href="/users/[uid]" as={`/users/${user.id}`}><a>{user.username}</a></Link></b>
                            <br />
                            <b>Submitted: {Moment(page.createDate).fromNow()}</b>
                            <br />
                            <b>Updated: {Moment(page.editDate).fromNow()}</b>
                        </Cell>
                    </>
                    }

                    <Cell x={1} y={4} width={3}>
                        <h1>Comments</h1>
                        {self && <Form onSubmit={PostComment}>
                            <Composer hidePreview />
                            <input type="submit" value="Post Comment!" />
                        </Form>}
                        {
                            comments.map(comment => {
                                let user = commentUsers.find(user => user.id == comment.userId);
                                if(user == null) return null;
                                
                                return <div className="comment">
                                    <span className="username">
                                        <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                    </span>
                                    <span className="editdate">
                                        {comment.createDate !== comment.editDate ? "Edited " : "Posted "} {moment(comment.createDate).fromNow()}
                                    </span>
                                    <div className="comment-content">
                                        <BBCodeView code={comment.content["t"]} />
                                    </div>
                                </div>
                            })
                        }
                    </Cell>
                </>
            }
            {pages && pages.length == 0 &&
                <Cell x={1} y={1} width={3}>
                    <h1>This page doesn't exist!</h1>
                </Cell>
            }
        </Grid>
    </>
}) as NextPage<PageProps>;
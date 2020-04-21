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
import { GetSBAPIInfo, KeyInfo } from "../../utils/SBAPI";
import Composer from "../../components/Composer";
import moment from "moment";
import { useInView } from "react-intersection-observer";
import { API_ENTITY } from "../../utils/Constants";

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
    user: self
}) => {
    useEffect(() => setInfo("Page", [1]), []);
    const Router = useRouter();
    const [keyInfo, setKeyInfo] = useState<KeyInfo | null>();

    const { pid } = Router.query;
    const [, pages] = Page.usePage({
        ids: [+pid]
    });
    const page = (pages?.[0] as ProgramPage | Page | undefined);

    useEffect(() => setInfo(page?.title || "", []), [pages]);

    const [comments, commentUsers, listeners, fetching, fetchMoreComments] = Comment.useComments(pages, self != null);
    const [ref, inView] = useInView();

    useEffect(() => {
        if (inView)
            fetchMoreComments();

    }, [inView])

    const [, users] = BaseUser.useUser({
        ids: [page?.createUserId as number, page?.editUserId as number]
    });
    const user = users?.[0];
    const editUser = users?.[1] || user;

    async function DeletePage() {
        if (!confirm("Are you sure you want to delete this page?"))
            return;

        await Page.Delete(page!);
        Router.push("/");
    }

    async function PostComment(data: Dictionary<string | boolean | number>) {
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

    const isPage = ("" + page?.type).indexOf("page") == 0 || ("" + page?.type).indexOf("page") == 1;

    return <>
        <Grid
            rows={["min-content", "min-content", "1fr", "min-content"]}
            cols={["fit-content(30%)", "1fr"]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%"
            }}
        >
            {(!pages || (pages!.length != 0 && !user)) && <Cell x={1} y={1} width={3}>
                <h1>Loading...</h1>
            </Cell>}
            {page && isPage && user && editUser &&
                <>

                    <Cell x={1} y={1} width={3}>
                        <h1>
                            {page.title}
                            {self && page.Permitted(self, CRUD.Update) && <button type="button" style={{ float: "right", fontSize: "1rem", height: "2em", width: "2em", color: "lightcoral", marginLeft: "5px", textAlign: "center" }} onClick={DeletePage}><span className="iconify" data-icon="ic:baseline-delete" data-inline="true"></span></button>}
                            {self && page.Permitted(self, CRUD.Delete) && <button type="button" style={{ float: "right", fontSize: "1rem", height: "2em", width: "2em", textAlign: "center" }} onClick={() => Router.push(`/pages/edit?pid=${page.id}`)}><span className="iconify" data-icon="fe:pencil" data-inline="true"></span></button>}

                        </h1>
                        <div id="page-info">
                            <b>Author: </b><Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                            {` • `}
                            <b>Created: </b>{Moment(page.createDate).fromNow()}
                            {(page.editDate.valueOf() - page.createDate.valueOf()) >= 2000 && <>
                                {` • `}
                                <b>Last edited: </b>{Moment(page.editDate).fromNow()} by <Link href="/user/[uid]" as={`/user/${editUser.id}`}><a>{editUser.username}</a></Link>
                            </>}
                        </div>
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
                                            .map((photo, i) => <img src={`${API_ENTITY("File")}/raw/${+photo}?size=400`} key={i} {...{"data-chosen": i == 0 ? "data-chosen" : undefined}} />)
                                    }
                                </Gallery>
                            }
                            <table cellSpacing={5}>
                                <tbody>
                                    <tr id="pubkey">
                                        <td>Public key</td>
                                        <td style={{
                                            textDecoration: (!keyInfo || !keyInfo.available) ? "line-through" : undefined
                                        }}>{page.values.key}</td>
                                    </tr>
                                    <tr>
                                        <td>Download size</td>
                                        <td>{keyInfo && size(keyInfo.size) + (keyInfo.extInfo.console === "3DS" ? ` (${keyInfo.size / 128000} blocks)` : "")}</td>
                                    </tr>
                                    <tr>
                                        <td>Submitted</td>
                                        <td>{keyInfo && Moment(keyInfo.uploaded).fromNow()}</td>
                                    </tr>
                                    <tr>
                                        <td>Last updated</td>
                                        <td>{keyInfo && Moment(keyInfo.version * 1000).fromNow()}</td>
                                    </tr>
                                    <tr>
                                        <td>Downloads</td>
                                        <td>{keyInfo && keyInfo.downloads.toString()}</td>
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
                        <Cell x={2} y={2} width={2} height={2} className="program-description">
                            <h2>Description</h2>
                            <BBCodeView code={page.content} />
                        </Cell>
                    </>}
                    {page.type === "@page.resource" &&
                        <>
                            <Cell x={1} y={2} width={3} height={2}>
                                <BBCodeView code={page.content} />
                            </Cell>
                        </>
                    }

                    <Cell x={1} y={4} width={3}>
                        <h2>Comments</h2>
                        {self && <Form onSubmit={PostComment}>
                            <Composer hidePreview />
                            <input type="submit" value="Post Comment!" />
                        </Form> || <h3>Sign in to comment!</h3>}
                        {
                            (() => {
                                let listeningUsers = listeners.map(listener => {
                                    let user = commentUsers.find(user => user.id == listener);
                                    return user!;
                                }).filter(user => user != null && user.id != self?.id);

                                let message = `${listeningUsers.slice(0, 2).map(user => user.username).join(", ")} and ${listeningUsers.length - 3} other${listeningUsers.length != 1 ? "s" : ""} are`;
                                if(listeningUsers.length == 0){
                                    return null;
                                } else if(listeningUsers.length == 1){
                                    message = `${listeningUsers[0].username} is`;
                                } else if(listeningUsers.length <= 3){
                                    message = `${listeningUsers.slice(0, listeningUsers.length - 1).map(user => user.username).join(", ")} and ${listeningUsers[listeningUsers.length - 1].username} are`;
                                }

                                return <h4>{message} currently viewing!</h4>
                            })()
                        }
                        {
                            comments.slice().reverse().map((comment, idx) => {
                                let user = commentUsers.find(user => user.id == comment.createUserId);
                                if (user == null) return null;

                                return <div className="comment" key={comment.id} ref={comments.length - 1 == idx && !fetching ? ref : undefined}>
                                    <span className="username">
                                        <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                    </span>
                                    <span className="editdate">
                                        {((comment.editDate.valueOf() - comment.createDate.valueOf()) >= 2000) ? "Edited " : "Posted "} {moment(comment.editDate).fromNow()}
                                    </span>
                                    <div className="comment-content">
                                        <BBCodeView code={comment.content["t"]} />
                                    </div>
                                </div>
                            })
                        }
                        {fetching && <div className="spinner circles">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>}
                    </Cell>
                </>
            }
            {pages && (pages.length == 0 || !isPage) &&
                <Cell x={1} y={1} width={3}>
                    <h1>This page doesn't exist!</h1>
                </Cell>
            }
        </Grid>
    </>
}) as NextPage<PageProps>;
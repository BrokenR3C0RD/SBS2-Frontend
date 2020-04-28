import { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageProps, Dictionary } from "../../interfaces";
import { Grid, Cell, Gallery } from "../../components/Layout";
import { Page, ProgramPage, BaseUser, Category, Comment } from "../../classes";
import { useRouter } from "next/router";
import BBCodeView from "../../components/DisplayMarkup";
import Moment from "moment";
import { CRUD } from "../../classes/Entity";
import { GetSBAPIInfo, KeyInfo } from "../../utils/SBAPI";
import { API_ENTITY } from "../../utils/Constants";
import { Comments } from "../../components/Comment";
import Composer from "../../components/Composer";
import Form from "../../components/Form";

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
    const cid = +(page?.parentId || 0);
    const [, category] = Category.useCategory({
        ids: [cid]
    })

    useEffect(() => setInfo(page?.name || "", []), [pages]);

    const [, users] = BaseUser.useUser({
        ids: [page?.createUserId as number, page?.editUserId as number]
    });
    const user = users?.find(user => user.id == page?.createUserId);
    const editUser = users?.find(user => user.id == page?.editUserId);

    async function DeletePage() {
        if (!confirm("Are you sure you want to delete this page?"))
            return;

        await Page.Delete(page!);
        Router.push("/");
    }

    const [commentCode, setCommentCode] = useState<string>("");
    const [commentMarkup, setCommentMarkup] = useState<string>("12y");

    async function PostComment() {
        if (commentCode.trim().length == 0)
            return;

        await Comment.Update({
            parentId: page!.id,
            content: {
                t: commentCode,
                m: commentMarkup
            }
        });

        setCommentCode("");
        setCommentMarkup("12y");
    }

    useEffect(() => {
        if (page && page.type === "@page.program") {
            (async () => {
                try {
                    const ki = await GetSBAPIInfo(page.values.key);
                    if (ki == null) {
                        setKeyInfo(null);
                    } else {
                        setKeyInfo(ki);
                    }
                } catch (e) {
                    setKeyInfo(JSON.parse(page.values.keyinfo || "null"));
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
            cols={["minmax(260px, 1fr)", "2fr"]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%",
                maxWidth: "100%"
            }}
        >
            {(!pages || (pages!.length != 0 && !user)) && <Cell x={1} y={1} width={3}>
                <h1>Loading...</h1>
            </Cell>}
            {page && isPage && user && editUser && category &&
                <>

                    <Cell x={1} y={1} width={3}>
                        <h1>
                            {page.name}
                            {self && page.Permitted(self, CRUD.Delete) && <button type="button" style={{ float: "right", fontSize: "1rem", height: "2em", width: "2em", color: "lightcoral", marginLeft: "5px", textAlign: "center" }} onClick={DeletePage}><span className="iconify" data-icon="ic:baseline-delete" data-inline="true"></span></button>}
                            {self && page.Permitted(self, CRUD.Update) && <button type="button" style={{ float: "right", fontSize: "1rem", height: "2em", width: "2em", textAlign: "center" }} onClick={() => Router.push(`/pages/edit?pid=${page.id}`)}><span className="iconify" data-icon="fe:pencil" data-inline="true"></span></button>}
                        </h1>
                        <div id="page-info">
                            <b>{`Author: `}</b>
                            <Link href="/user/[uid]" as={`/user/${user.id}`}><a>
                                <img src={user.GetAvatarURL(32)} className="info-avatar" />
                                {user.username}
                            </a></Link>
                            {` • `}
                            <b>Created: </b>{Moment(page.createDate).fromNow()}
                            {(page.editDate.valueOf() - page.createDate.valueOf()) >= 2000 && <>
                                {` • `}
                                <b>Last edited: </b>{Moment(page.editDate).fromNow()} by <Link href="/user/[uid]" as={`/user/${editUser.id}`}><a>
                                    <img src={editUser.GetAvatarURL(32)} className="info-avatar" />
                                    {editUser.username}
                                </a></Link>
                            </>}
                            {` • `}
                            <b>Category: </b>{category[0] ? <Link href="/pages/categories/[cid]" as={`/pages/categories/${page.parentId}`}><a>{category[0]?.name}</a></Link> : "Private"}
                        </div>
                    </Cell>
                    {page.type === "@page.program" && <>
                        <Cell x={1} y={2} width={1} className="program-infobox">
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
                                <Gallery className="program-images" width="400px" height="240px" timer={2000}>
                                    {
                                        page.values.photos.split(",")
                                            .filter(photo => photo != "")
                                            .map((photo, i) => <img src={`${API_ENTITY("File")}/raw/${+photo}?size=400`} key={i} />)
                                    }
                                </Gallery>
                            }
                            <table cellSpacing={5}>
                                <tbody>
                                    <tr id="pubkey">
                                        <td>Public key</td>
                                        <td style={{
                                            textDecoration: (keyInfo !== null && "available" in keyInfo! && !(keyInfo?.available)) ? "line-through" : undefined
                                        }} title={page.values.key}>{page.values.key}</td>
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
                                        <td>{keyInfo && Moment((keyInfo.version - 9 * 60 * 60) * 1000).fromNow()}</td>
                                    </tr>
                                    {keyInfo && "downloads" in keyInfo && <tr>
                                        <td>Downloads</td>
                                        <td>{keyInfo.downloads.toString()}</td>
                                    </tr>}
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
                            <BBCodeView code={page.content} markupLang={page.values.markupLang} />
                        </Cell>
                    </>}
                    {page.type === "@page.resource" &&
                        <>
                            <Cell x={1} y={2} width={3} height={1 + (page.values.photos.length == 0 || page.values.photos === "0" ? 1 : 0)}>
                                <BBCodeView code={page.content} markupLang={page.values.markupLang} />
                            </Cell>
                            {page.values.photos && (page.values.photos?.trim()?.length > 0 && page.values.photos !== "0") && <Cell x={1} y={3} width={3} height={1}>
                                <Gallery className="program-images" width="400px" height="240px" timer={2000}>
                                    {
                                        page.values.photos.split(",")
                                            .filter(photo => photo != "")
                                            .map((photo, i) => <img src={`${API_ENTITY("File")}/raw/${+photo}?size=400`} key={i} />)
                                    }
                                </Gallery>
                            </Cell>}
                        </>
                    }

                    <Cell x={1} y={4} width={3}>
                        <h2>Comments</h2>
                        {self && page.Permitted(self, CRUD.Create) && <div className="comment-post">
                            <Form onSubmit={PostComment}>
                                <Composer hidePreview code={commentCode} markup={commentMarkup} onChange={(code, markup) => { setCommentCode(code); setCommentMarkup(markup); }} />
                                <div className="edit-buttons">
                                    <button type="submit"><span className="iconify" data-icon="mdi:send" data-inline="true"></span></button>
                                </div>
                            </Form>
                        </div>}
                        <Comments parent={page} reverse self={self} />
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
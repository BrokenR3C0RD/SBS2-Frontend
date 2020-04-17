import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { PageProps, Dictionary } from "../../interfaces";
import { Grid, Cell, Gallery } from "../../components/Layout";
import { Page, ProgramPage, BaseUser } from "../../classes";
import { useRouter } from "next/router";
import BBCode from "../../components/BBCode";
import Moment from "moment";
import { CRUD } from "../../classes/Entity";
import { isURL } from "validator";

export default (({
    setInfo,
    user: self
}) => {
    useEffect(() => setInfo("Page", [1]), []);
    const Router = useRouter();

    const { pid } = Router.query;
    const [, pages] = Page.usePage([+pid]);
    const page = pages?.[0] as ProgramPage | undefined;
    console.log(page);

    useEffect(() => { setInfo(page?.title || "", []); console.log("This update is running"); }, [pages]);

    const [, users] = BaseUser.useUser([page?.userId as number]);
    const user = users?.[0];

    async function DeletePage() {
        if (!confirm("Are you sure you want to delete this page?"))
            return;

        await Page.Delete(page!);
        Router.push("/");
    }

    let supported: Dictionary<boolean> = {};
    if (page) {
        try {
            supported = JSON.parse(page.values.supported);
        } catch (e) {

        }
    }

    return <>
        <Grid
            rows={["fit-content(5em)", "min-content", "1fr"]}
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
                        {self && page.Permitted(self, CRUD.Update) && <button type="button" style={{ float: "right" }} onClick={() => Router.push(`/pages/edit?pid=${page.id}`)}>Edit</button>}
                        {self && page.Permitted(self, CRUD.Delete) && <button type="button" style={{ float: "right" }} onClick={DeletePage}>Delete</button>}
                        </h1>
                    </Cell>
                    <Cell x={1} y={2} className="program-infobox">
                        {page.values.photos &&
                            <Gallery className="program-images" width="400px" height="240px" timer={0}>
                                {
                                    page.values.photos.split(",")
                                        .map((photo, i) => <img src={isURL(photo) ? photo : "/res/img/logo.svg"} key={i} data-chosen={i==0} /> )
                                }
                            </Gallery>
                        }
                        <table cellSpacing={5}>
                            <tbody>
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
                                    <td><Link href="/user/[uid]" as={`/user/${user.id}`}>{user.username}</Link></td>
                                </tr>
                                <tr id="pubkey">
                                    <td>Public key</td>
                                    <td>{page.values.key}</td>
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
                        <BBCode code={page.content} />
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
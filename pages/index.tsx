import { NextPage } from "next";
import { useEffect } from "react";
import { PageProps } from "../interfaces";
import { Grid, Cell, Gallery } from "../components/Layout";
import { Page, Category } from "../classes";
import { API_ENTITY } from "../utils/Constants";
import { useRouter } from "next/router";
import { Activity } from "../classes";
import { CRUD } from "../classes/Entity";
import Link from "next/link";
import Moment from "moment";
import {useInView} from "react-intersection-observer";

export default (({
    setInfo,
    user: self
}) => {
    const Router = useRouter();
    useEffect(() => setInfo("Home", [1]), []);
    const [, programs] = Page.usePage({
        type: "@page.program%",
        limit: 10,
        sort: "random"
    });

    const [events, users, contents, loading, loadMore, more] = Activity.useActivity();
    const [ref, inView] = useInView();
    useEffect(() => {
        if(inView && !loading && more)
            loadMore()
    }, [inView])

    const [, categories] = Category.useCategory({
        name: "Pages"
    });

    let pageCategoryId = categories?.[0]?.id; 



    return <>
        <Grid
            rows={["min-content", "1fr", "min-content", "min-content"]}
            cols={["1fr", "max-content", "1fr"]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1} width={4}>
                <h1>Welcome to SmileBASIC Source!</h1>
            </Cell>
            <Cell x={1} y={2} width={2}>
                <h2>Program Gallery</h2>
                <p>
                    Here's a selection of programs submitted by users in our community!
                </p>
                <div className="showcase-container">
                    <Gallery width="400px" height="240px" className="program-showcase">
                        {programs ? programs.map((program) => <div key={program.id} className="program" onClick={() => Router.push("/pages/[pid]", `/pages/${program.id}`)}>
                            <img src={program.values.photos?.length > 0 ? `${API_ENTITY("File")}/raw/${+program.values.photos.split(",")[0]}?size=400` : "/res/img/logo.svg"} />
                            <span className="title">{program.name}</span>
                        </div>) : []}
                    </Gallery>
                </div>
                <p>
                    You can view all programs and resources <Link href="/pages/categories/[cid]" as={`/pages/categories/${pageCategoryId}`}>here!</Link>
                </p>
            </Cell>
            <Cell x={3} y={2} width={2} height={1}>
                <h2><Link href="/activity"><a>Recent Activity</a></Link></h2>
                <ul className="activity">
                    {events.map((event, i) => {
                        let content: React.ReactElement = <></>;
                        let user = users.find(user => user.id == event.userId);
                        if (user == null && (event.userId != -1))
                            return null;

                        let c = contents.find(content => content.id == event.contentId);
                        if (event.userId != -1 && event.action !== CRUD.Delete && c == null)
                            return null;

                        let href = c ? `/${c.type.substr(1).split(".")[0]}s/[${c.type.substr(1, 1)}id]` : "";
                        let as = c ? `/${c.type.substr(1).split(".")[0]}s/${c.id}` : "";

                        switch (event.action) {
                            case CRUD.Create:
                                if (event.userId == -1) { // A new user joined!
                                    user = users.find(user => user.id == event.contentId);
                                    if (user != null)
                                        content = <>
                                            <Link href="/user/[uid]" as={`/user/${user.id}`}>
                                                <a>
                                                    {user.username}
                                                </a>
                                            </Link>
                                            {` created an account`}
                                        </>;
                                } else {               // Some type of content was created
                                    content = <>
                                        <Link href="/user/[uid]" as={`/user/${user!.id}`}><a>
                                            {user!.username}
                                        </a>
                                        </Link>
                                        {` created `}
                                        <Link href={href} as={as}><a>
                                            {c!.name}
                                        </a></Link>
                                    </>;
                                }
                                break;
                            case CRUD.Update:
                                if (event.userId == event.contentId && event.userId == self?.id) {
                                    content = <i>
                                        You edited your profile.
                                    </i>
                                } else {
                                    content = <>
                                        <Link href="/user/[uid]" as={`/user/${user!.id}`}><a>
                                            {user!.username}
                                        </a></Link>
                                        {` edited `}
                                        <Link href={href} as={as}><a>
                                            {c!.name}
                                        </a></Link>
                                    </>;
                                }
                                break;
                            case CRUD.Delete:
                                content = <>
                                    <Link href="/user/[uid]" as={`/user/${user!.id}`}><a>
                                        {user!.username}
                                    </a>
                                    </Link>
                                    {` deleted `}
                                    {event.extra}
                                </>;
                                break;
                        }
                        return <li key={event.id} ref={events.length - 1 == i ? ref : undefined}>
                            {event.contentId == self?.id && event.action == CRUD.Update ? <></> : <img src={user?.GetAvatarURL(128)} />}
                            <div className="content">
                                <span>{content}</span>
                                <span className="time">{Moment(event.date).fromNow()}</span>
                            </div>
                        </li>
                    })}
                    <li ref={ref}></li>
                    {loading && <div className="spinner circles">
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>}
                </ul>
            </Cell>
            <Cell x={1} y={4} width={4}>
                <h2>About SmileBASIC Source</h2>
                <p>
                    SmileBASIC Source is an online community for <a href="http://smilebasic.com/en/">"SmileBASIC"</a>, a programming language and IDE for Nintendo platforms
                    developed and released by SmileBoom Co. Ltd.
                    It all began with Petit Computer in 2011, which gave users the first taste of SmileBASIC. Since then,
                    there have been iterations of SmileBASIC for the 3DS, Wii U, and now the Nintendo Switch.
                    <br />
                    <br />
                    SmileBASIC Source was made to give people a place to discuss SmileBASIC, share their creations, and ask questions.
                    Whether brand new to programming or a seasoned veteran, we hope to provide everything you need to enjoy
                    SmileBASIC!
                </p>
            </Cell>
            <Cell x={1} y={5} width={4}>
                <h2>Under development</h2>
                <p>
                    SmileBASIC Source is still under active development, so you may find bugs or notice features that aren't yet available.
                    <br /><br />
                    Please report any bugs to MasterR3C0RD on Discord: @MasterR3C0RD#7695
                </p>
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
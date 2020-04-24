import Moment from "moment";
import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Activity } from "../classes";
import { CRUD } from "../classes/Entity";
import { Cell, Grid, Spinner } from "../components/Layout";
import { PageProps } from "../interfaces";

export default (({
    user: self
}) => {
    const [events, users, contents, loading, loadMore, more] = Activity.useActivity(100);
    const [ref, inView] = useInView();
    useEffect(() => {
        if (inView && !loading && more)
            loadMore()
    }, [inView])

    return <Grid
        cols={["100%"]}
        rows={["100%"]}
        style={{
            width: "100%",
            height: "100%"
        }}
    >
        <Cell x={1} y={1} width={1} height={1}>
            <h2>Recent Activity</h2>
            <ul className="activity activity-full">
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
                {loading && <Spinner />}
            </ul>
        </Cell>
    </Grid>
}) as NextPage<PageProps>;
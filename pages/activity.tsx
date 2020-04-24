import Moment from "moment";
import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Activity } from "../classes";
import { CRUD } from "../classes/Entity";
import { Cell, Grid, Spinner } from "../components/Layout";
import { PageProps } from "../interfaces";
import { CommentActivity, Event } from "../classes/Activity";

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
                {events.map((e, i) => {
                    let content: React.ReactElement = <></>;
                    if ((e as CommentActivity).lastDate) {
                        let comment = e as CommentActivity;

                        let pl = (num: number) => num != 1 ? "s" : "";
                        let c = contents.find(content => content.id == comment.parentId);
                        if (c == null)
                            return null;

                        let cusers = comment.userIds.map(id => users.find(user => user.id == id)).filter(user => (user != null));
                        if(cusers.length == 0)
                            return null;

                        let href = `/${c.type.substr(1).split(".")[0]}s/[${c.type.substr(1, 1)}id]`;
                        let as = `/${c.type.substr(1).split(".")[0]}s/${c.id}`;

                        if (c.type == "@user.page") {
                            let pageUser = users.find(user => user.id == c!.parentId);
                            c.name = `${pageUser?.username}'s userpage`;
                            href = "/user/[uid]";
                            as = `/user/${c.parentId}`;
                        }

                        return <li key={"c" + comment.parentId}>
                            <div className="imgs">
                                {cusers.slice(0, 4).map(user => <Link href="/user/[uid]" as={`/user/${user!.id}`}><img src={user!.GetAvatarURL(64)} title={user!.username} /></Link>)}
                            </div>
                            <div className="content">
                                <span>{comment.count} comment{pl(comment.count)} on <Link href={href} as={as}>
                                    {c.name}
                                </Link></span>
                                <span className="time">{Moment(comment.lastDate).fromNow()}</span>
                            </div>
                        </li>
                    } else {
                        let event = e as Event;
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
                            {event.contentId == self?.id && event.action == CRUD.Update ? <></> : <Link href="/user/[uid]" as={`/user/${user?.id}`}><img title={user?.username} src={user?.GetAvatarURL(128)} /></Link>}
                            <div className="content">
                                <span>{content}</span>
                                <span className="time">{Moment(event.date).fromNow()}</span>
                            </div>
                        </li>
                    }
                })}
                <li ref={ref}></li>
                {loading && <Spinner />}
            </ul>
        </Cell>
    </Grid>
}) as NextPage<PageProps>;
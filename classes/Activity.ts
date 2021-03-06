import { SearchQuery } from "../interfaces";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { BaseUser } from "./User";
import { CRUD } from "./Entity";
import { useState, useEffect } from "react";
import { Content } from "./Content";

export interface Event {
    id: number;
    userId: number;
    date: Date;
    contentId: number;
    contentType: string;
    action: CRUD;
    extra: string;
}

export interface CommentActivity {
    parentId: number;
    count: number;
    lastDate: Date;
    userIds: number[];
}

export class Activity {
    activity: Event[] = [];
    comments: CommentActivity[] = [];

    public static useActivity(limit: number = 35, realtime: boolean = false): [(Event | CommentActivity)[], BaseUser[], Content[], boolean, () => void, boolean] {
        let [events, setEvents] = useState<Event[]>([]);
        let [comments, setComments] = useState<CommentActivity[]>([]);
        let [users, setUsers] = useState<BaseUser[]>([]);
        let [content, setContent] = useState<Content[]>([]);
        const [fetchMore, setFetchMore] = useState<boolean>(true)
        const [loading, setLoading] = useState<boolean>(false);
        const [more, setMore] = useState<boolean>(true);

        useEffect(() => {
            let aborter = new AbortController();

            if (fetchMore && !loading)
                (async () => {
                    try {
                        setLoading(true);
                        let res = await DoRequest({
                            url: `${API_ENTITY("Activity")}`,
                            method: "GET",
                            signal: aborter.signal,
                            return: Activity,
                            data: {
                                limit: limit,
                                maxId: events?.[events?.length - 1]?.id || undefined,
                                reverse: true,
                                includeAnonymous: true,
                                recentCommentTime: "01:00:00:00"
                            } as SearchQuery
                        });

                        if (res) {
                            events = events.concat(res.activity);
                            comments = res.comments;

                            let newcontent = res
                                .activity
                                .filter(event => event.contentType != "@user.page" && event.contentType !== "")
                                .map(event => event.action === CRUD.Create && event.userId === -1 ? -1 : event.contentId)
                                .concat(comments.map(comment => comment.parentId))
                                .filter(id => id !== -1);

                            if(newcontent.length > 0)
                                content = content.concat(await Content.GetByIDs(newcontent));

                            let uids = res
                                .activity
                                .map(event => [event.userId, event.action === CRUD.Create && event.userId === -1 ? event.contentId : -1])
                                .concat(
                                    comments
                                    .map(comment => comment.userIds)
                                    .reduce((acc, e) => acc.concat(e), [])
                                )
                                .reduce((acc, e) => acc.concat(e), [])
                                .concat(content.filter(content => content.type == "@user.page").map(content => content.parentId))
                                .filter(id => id != -1 && users.findIndex(user => user.id == id) == -1);

                            if (uids.length > 0) {
                                users = users.concat(await BaseUser.GetByIDs(uids));
                            }

                            setUsers(users);
                            setComments(comments);
                            setContent(content);
                            setEvents(events);
                            setMore(res.activity.length % limit === 0);
                        }
                    } catch (e) {
                        if (!aborter.signal.aborted)
                            console.error("An error occurred while fetching activity: " + e.stack);
                    }
                    setLoading(false);
                    setFetchMore(false);
                })();

            if (realtime) {
                /* TODO: Add realtime mode */
            }

            return () => aborter.abort();
        }, [fetchMore]);

        return [((events as (Event|CommentActivity)[]).concat(comments)).sort((a, b) => {
            return new Date((b as Event)?.date || (b as CommentActivity)?.lastDate)!.getTime()
                - new Date((a as Event)?.date || (a as CommentActivity)?.lastDate)!.getTime();
        }), users, content, loading, () => setFetchMore(true), more];
    }
}
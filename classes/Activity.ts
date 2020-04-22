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

export class Activity {
    activity: Event[] = [];

    public static useActivity(realtime: boolean = false): [Event[], BaseUser[], Content[], () => void] {
        let [events, setEvents] = useState<Event[]>([]);
        let [users, setUsers] = useState<BaseUser[]>([]);
        let [content, setContent] = useState<Content[]>([]);
        const [fetchMore, setFetchMore] = useState<boolean>(true)

        useEffect(() => {
            let aborter = new AbortController();

            if (fetchMore)
                (async () => {
                    try {
                        let res = await DoRequest({
                            url: `${API_ENTITY("Activity")}`,
                            method: "GET",
                            signal: aborter.signal,
                            return: Activity,
                            data: {
                                limit: 25,
                                maxId: events?.[events?.length - 1]?.id || undefined,
                                reverse: true
                            } as SearchQuery
                        });

                        if (res) {
                            events = events.concat(res.activity);

                            let uids = res
                                .activity
                                .map(event => [event.userId, event.action === CRUD.Create && event.userId === event.contentId ? event.contentId : -1])
                                .reduce((acc, e) => acc.concat(e), [])
                                .filter(id => id != -1 && users.findIndex(user => user.id == id) == -1);

                            if (uids.length > 0) {
                                users = users.concat(await BaseUser.GetByIDs(uids));
                            }

                            let newcontent = res
                                .activity
                                .map(event => event.action === CRUD.Create && event.userId === event.contentId ? -1 : event.contentId)
                                .filter(id => id !== -1);

                            if(newcontent.length > 0)
                                content = content.concat(await Content.GetByIDs(newcontent));

                            setUsers(users);
                            setContent(content);
                            setEvents(events);
                        }
                    } catch (e) {
                        if (!aborter.signal.aborted)
                            console.error("An error occurred while fetching activity: " + e.stack);
                    }
                })();

            if (realtime) {
                /* TODO: Add realtime mode */
            }

            return () => aborter.abort();
        }, [fetchMore]);

        return [events, users, content, () => setFetchMore(true)];
    }
}
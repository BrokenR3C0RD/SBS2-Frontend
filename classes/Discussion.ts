import { Content } from "./Content";
import { Dictionary, SearchQuery } from "../interfaces";
import { plainToClass } from "class-transformer";
import { BaseUser } from "./User";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { useState, useEffect } from "react";


export interface DiscussionProperties extends Dictionary<string> {
    markupLang: string
}

export class Discussion extends Content {
    // @ts-ignore
    values: DiscussionProperties = {};

    type: string = "@discussion";

    public static async GetByIDs(ids: number[]): Promise<Discussion[]> {
        return (await Content
            .GetByIDs(ids))
            .map(entity => plainToClass(Discussion, entity));
    }

    public static useDiscussions(query: SearchQuery | null, realtime: boolean = false): [BaseUser[], Discussion[], boolean, () => void, boolean] {
        let [users, setUsers] = useState<BaseUser[]>([]);
        let [content, setContent] = useState<Discussion[]>([]);
        const [fetchMore, setFetchMore] = useState<boolean>(true)
        const [loading, setLoading] = useState<boolean>(true);
        const [more, setMore] = useState<boolean>(true);
        const [lquery, setLquery] = useState<SearchQuery>();

        useEffect(() => {
            if(query && JSON.stringify(lquery) != JSON.stringify(query)){
                setContent([]);
                setMore(true);
                setLoading(true);
                setFetchMore(true);
                setLquery(query);
            } else if(!loading && more && content.length == 0 && query){
                setContent([]);
                setMore(true);
                setLoading(true);
                setFetchMore(true);
                setLquery(query);
            }
        }, [query]);

        useEffect(() => {
            let aborter = new AbortController();

            if (fetchMore && query)
                (async () => {
                    try {
                        setLoading(true);
                        let res = (await DoRequest<Discussion[]>({
                            url: `${API_ENTITY("Content")}`,
                            method: "GET",
                            signal: aborter.signal,
                            data: {
                                ...query,
                                limit: query.limit!,
                                maxId: content?.[content.length - 1]?.id || undefined,
                                type: "@discussion"
                            } as SearchQuery
                        }))?.map(obj => plainToClass(Discussion, obj));

                        if (res) {
                            content = content.concat(res);

                            let uids = res
                                .map(discussion => [discussion.createUserId, discussion.editUserId])
                                .reduce((acc, e) => acc.concat(e), [])
                                .filter(id => id != -1 && users.findIndex(user => user.id == id) == -1);

                            if (uids.length > 0) {
                                users = users.concat(await BaseUser.GetByIDs(uids));
                            }

                            setUsers(users);
                            setContent(content);
                            setMore(res.length % query.limit! === 0 && res.length > 0);
                        }
                    } catch (e) {
                        if (!aborter.signal.aborted)
                            console.error("An error occurred while fetching pages: " + e.stack);
                    }
                    setFetchMore(false);
                    setLoading(false);
                })();

            if (realtime) {
                /* TODO: Add realtime mode */
            }

            return () => aborter.abort();
        }, [fetchMore, query]);

        return [users, content, loading, () => setFetchMore(true), more];
    }

    public static useDiscussion(query: SearchQuery, mutate: (p: Discussion) => Promise<Discussion> = async p => p): [any, Discussion[] | null, () => void] {
        return Content.useContent(query, p => mutate(plainToClass(Discussion, p))) as [any, Discussion[] | null, () => void];
    }

    public static async Search(query: SearchQuery, signal?: string | AbortSignal): Promise<Discussion[]> {
        return (await Content
            .Search({
                ...query,
                type: "@discussion"
            }, signal as AbortSignal))
            .map(entity => plainToClass(Discussion, entity));
    }

    public static async Update(discussion: Partial<Discussion>): Promise<Discussion> {
        // @ts-ignore
        return (await Content.Update(discussion));
    }
    public static async Delete(discussion: Discussion): Promise<boolean> {
        return (await Content.Delete(discussion));
    }
}
import { Content } from "./Content";
import { Dictionary, SearchQuery } from "../interfaces";
import { plainToClass } from "class-transformer";
import { BaseUser } from "./User";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { useState, useEffect } from "react";


export interface PageProperties extends Dictionary<string> {
    markupLang: string
}

export interface ProgramPageProperties extends PageProperties {
    key: string | any,
    supported: string,
    originalAuthor: string,
    photos: string
}

export class Page extends Content {
    // @ts-ignore
    values: PageProperties = {};

    type: string = "@page";

    public static async GetByIDs(ids: number[]): Promise<Page[]> {
        return (await Content
            .GetByIDs(ids))
            .map(entity => plainToClass(Page, entity));
    }

    public static usePages(cid: number, realtime: boolean = false): [BaseUser[], Content[], boolean, () => void, boolean] {
        let [users, setUsers] = useState<BaseUser[]>([]);
        let [content, setContent] = useState<Content[]>([]);
        const [fetchMore, setFetchMore] = useState<boolean>(true)
        const [loading, setLoading] = useState<boolean>(true);
        const [more, setMore] = useState<boolean>(true);
        const [lastCid, setLastCid] = useState<number>(0);

        useEffect(() => {
            if(cid && lastCid !== cid){
                setContent([]);
                setMore(true);
                setLoading(true);
                setFetchMore(true);
                setLastCid(cid);
            }
        }, [cid]);

        useEffect(() => {
            let aborter = new AbortController();

            if (fetchMore && !isNaN(cid))
                (async () => {
                    try {
                        setLoading(true);
                        let res = (await DoRequest<Page[]>({
                            url: `${API_ENTITY("Content")}`,
                            method: "GET",
                            signal: aborter.signal,
                            data: {
                                limit: 20,
                                maxId: content?.[content.length - 1]?.id || undefined,
                                reverse: true,
                                parentIds: [cid]
                            } as SearchQuery
                        }))?.map(obj => plainToClass(Page, obj));

                        if (res) {
                            content = content.concat(res);

                            let uids = res
                                .map(page => [page.createUserId, page.editUserId])
                                .reduce((acc, e) => acc.concat(e), [])
                                .filter(id => id != -1 && users.findIndex(user => user.id == id) == -1);

                            if (uids.length > 0) {
                                users = users.concat(await BaseUser.GetByIDs(uids));
                            }

                            setUsers(users);
                            setContent(content);
                            setMore(res.length % 20 === 0);
                        }
                    } catch (e) {
                        if (!aborter.signal.aborted)
                            console.error("An error occurred while fetching pages: " + e.stack);
                    }
                    setLoading(false);
                })();

            if (realtime) {
                /* TODO: Add realtime mode */
            }

            return () => aborter.abort();
        }, [fetchMore, lastCid]);

        return [users, content, loading, () => setFetchMore(true), more];
    }

    public static usePage(query: SearchQuery, mutate: (p: Page) => Promise<Page> = async p => p): [any, Page[] | null, () => void] {
        return Content.useContent(query, p => mutate(plainToClass(Page, p))) as [any, Page[] | null, () => void];
    }

    public static async Search(query: SearchQuery): Promise<Page[]> {
        return (await Content
            .Search({
                ...query,
                type: "@page%"
            }))
            .map(entity => plainToClass(Page, entity));
    }

    public static async Update(page: Partial<Page>): Promise<Page> {
        // @ts-ignore
        return (await Content.Update(page));
    }
    public static async Delete(page: Page): Promise<boolean> {
        return (await Content.Delete(page));
    }
}

export class UserPage extends Page {
    type: string = "@user.page"
    // @ts-ignore
    values: PageProperties = {};

    /*public static GetUserPage(user: BaseUser): Promise<UserPage> {
        
    }*/

    public static useUserPage(user?: BaseUser) {
        return Content.useContent({
            type: "@user.page",
            parentIds: [user?.id || 0],
            limit: 1,
            reverse: true,
            sort: "id"
        }, async e => plainToClass(UserPage, e)) as [any, UserPage[], () => void];
    }

    public static async Update(page: Partial<UserPage>): Promise<UserPage> {
        // @ts-ignore
        return (await Content.Update(page));
    }
}

export class ProgramPage extends Page {
    type: string = "@page.program"
    // @ts-ignore
    values: ProgramPageProperties = {};

    public static async Search(query: SearchQuery): Promise<ProgramPage[]> {
        return (await Content
            .Search({
                ...query,
                type: "@page.program%"
            }))
            .map(entity => plainToClass(ProgramPage, entity));
    }
}
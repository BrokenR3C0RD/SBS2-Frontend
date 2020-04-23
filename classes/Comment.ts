import { IsInt, IsBoolean } from "class-validator";
import { useState, useEffect } from "react";
import { plainToClass, Transform } from "class-transformer";
import { Entity, CRUD } from "./Entity";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { BaseUser, FullUser } from "./User";
import { Dictionary } from "../interfaces";


function Wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    })
}

export class Comment extends Entity {
    @Transform(obj => {
        try {
            return JSON.parse(obj)
        } catch (e) {
            return {
                t: obj,
                m: "12y"
            }
        }
    })
    content: Dictionary<string> = {};

    @IsInt()
    parentId: number = 0;

    @IsInt()
    createUserId: number = 0;

    @IsInt()
    editUserId: number = 0;

    @IsBoolean()
    deleted: boolean = false;

    public Permitted(user: FullUser, perm: CRUD = CRUD.Read): boolean {
        return (this.createUserId == user.id || (user.super)) && (perm == CRUD.Update || perm == CRUD.Delete);
    }

    public static async GetComments(parentId: number, reverse: boolean = true, skip: number = 0, limit: number = 20, createEnd?: Date): Promise<Comment[] | null> {
        return (await DoRequest<Comment[]>({
            url: API_ENTITY("Comment"),
            method: "GET",
            data: {
                parentIds: parentId,
                reverse: reverse,
                limit,
                skip,
                ... (createEnd ? { createEnd: createEnd.toISOString() } : {})
            }
        }))?.map(comment => plainToClass(Comment, comment)) || null;
    }

    public static useComments(parent: Entity[] | null, realtime: boolean = true): [Comment[], BaseUser[], number[], boolean, () => void] {
        // Since this is using long polling, which is a VERY special case, we're giving up on even TRYING to reuse useRequest
        const [comments, setComments] = useState<Comment[]>([]);
        const [users, setUsers] = useState<BaseUser[]>([]);
        const [didInit, setDidInit] = useState<boolean>(false);
        const [lastParent, setLastParent] = useState<Entity>();
        const [fetchMore, setFetchMore] = useState<boolean>(false);
        const [noMore, setNoMore] = useState<boolean>(false);
        const [listeners, setListeners] = useState<number[]>([]);
        const [list, setList] = useState<number[]>([]);

        useEffect(() => {
            if (parent == null || parent[0] == null)
                return;

            if (lastParent !== parent[0]) {
                setComments([]);
                setLastParent(parent[0]);
                setDidInit(false);
                setFetchMore(false);
                setNoMore(false);
                setList([]);
                return;
            }

            const aborter = new AbortController();

            if (!didInit) {
                (async () => {
                    if (aborter.signal.aborted)
                        return;

                    let newc: Comment[] = (await Comment.GetComments(parent[0].id) || comments).reverse();
                    if (newc.length > 0)
                        setComments(
                            newc
                        );

                    let newUsers = (newc as Comment[])
                        .map(comment => comment.createUserId)
                        .filter(id => users.findIndex(user => user.id == id) == -1)
                        .reduce<number[]>((acc, id) => (acc.indexOf(id) == -1 && acc.push(id) && acc) || acc, []);

                    if (newUsers.length >= 0)
                        setUsers(
                            users.concat(await BaseUser.GetByIDs(newUsers))
                        );

                    setDidInit(true);
                    setNoMore(newc.length < 20);
                })();
            } else if (fetchMore && !noMore) {
                (async () => {
                    if (aborter.signal.aborted)
                        return;

                    let newc: Comment[] = (await Comment.GetComments(parent[0].id, true, comments.length, 20) || []).reverse();
                    if (newc.length > 0)
                        setComments(
                            newc = newc
                                .concat(comments.map(comment => newc.find(c => c.id == comment.id) || comment))
                                .reduce<Comment[]>((acc, comment) => acc.findIndex(c => c.id == comment.id) == -1 ? acc.concat([comment]) : acc, [])
                                .filter(comment => !comment.deleted)
                                .sort((a, b) => a.id - b.id)
                        );

                    let newUsers = (newc as Comment[])
                        .map(comment => comment.createUserId)
                        .filter(id => users.findIndex(user => user.id == id) == -1)
                        .reduce<number[]>((acc, id) => (acc.indexOf(id) == -1 && acc.push(id) && acc) || acc, []);

                    if (newUsers.length >= 0)
                        setUsers(
                            users.concat(await BaseUser.GetByIDs(newUsers))
                        );

                    setFetchMore(false);
                    setNoMore((newc.length % 20) !== 0);
                })();
            } else if (realtime) {
                (async () => {
                    while (!aborter.signal.aborted) {
                        if (!didInit)
                            continue;

                        try {
                            let token = localStorage.getItem("sbs-auth") || sessionStorage.getItem("sbs-auth") || null;
                            let resp = await fetch(`${API_ENTITY("Comment")}/listen/${parent[0].id}?lastID=${comments?.[comments.length - 1]?.id || 0}`, {
                                method: "GET",
                                headers: {
                                    "Accept": "application/json",
                                    ...(token ? {
                                        "Authorization": `Bearer ${token}`
                                    } : {})
                                },
                                signal: aborter.signal
                            });
                            if (aborter.signal.aborted)
                                return;

                            if (resp.status === 400)
                                break;

                            if (resp.status === 200) {
                                let newc: Comment[] = (await resp.json()).map((obj: Comment) => plainToClass(Comment, obj));

                                if (newc.length > 0) {
                                    setComments(
                                        newc = newc
                                            .concat(comments.map(comment => newc.find(c => c.id == comment.id) || comment))
                                            .reduce<Comment[]>((acc, comment) => acc.findIndex(c => c.id == comment.id) == -1 ? acc.concat([comment]) : acc, [])
                                            .filter(comment => !comment.deleted)
                                            .sort((a, b) => a.id - b.id)
                                    );
                                    let newUsers = (newc as Comment[])
                                        .map(comment => comment.createUserId)
                                        .filter(id => users.findIndex(user => user.id == id) == -1)
                                        .reduce<number[]>((acc, id) => (acc.indexOf(id) == -1 && acc.push(id) && acc) || acc, [])

                                    if (newUsers.length > 0)
                                        setUsers(
                                            users.concat(await BaseUser.GetByIDs(newUsers))
                                        );

                                    break;
                                }
                            } else {
                                throw await resp.text();
                            }
                        } catch (e) {
                            if (!aborter.signal.aborted)
                                console.error("An error occurred while polling for comments:" + (e && e.stack ? e.stack : e));
                            
                            await Wait(2500);
                        }
                    }
                })();
                (async () => {
                    let lastList: number[] = list;
                    while (!aborter.signal.aborted) {
                        if (!didInit)
                            continue;

                        try {
                            let token = sessionStorage.getItem("sbs-auth") || localStorage.getItem("sbs-auth") || null;
                            let resp = await fetch(`${API_ENTITY("Comment")}/listen/${parent[0].id}/listeners?${lastList.map(id => `lastListeners=${id}`).join("&")}`, {
                                method: "GET",
                                headers: {
                                    "Accept": "application/json",
                                    ...(token ? {
                                        "Authorization": `Bearer ${token}`
                                    } : {})
                                },
                                signal: aborter.signal
                            });
                            if (aborter.signal.aborted)
                                return;

                            if (resp.status === 400)
                                break;
                            
                            if(resp.status === 524)
                                continue;

                            if (resp.status === 200) {
                                let newc = (await resp.json());
                                lastList = newc.slice().map((u: any) => u.userId);
                                setList(lastList);

                                newc = newc.filter((u: any) => listeners.indexOf(u.userId) === -1);
                                if (newc.length > 0) {
                                    setListeners(newc.filter((info: any) => info.contentListenId == lastParent.id).map((info: any) => info.userId));
                                    let newUsers = (newc as any[])
                                        .map(listener => listener.userId as number)
                                        .filter(listener => users.findIndex(user => user.id == listener) == -1)
                                        .reduce<number[]>((acc, id) => (acc.indexOf(id) == -1 && acc.push(id) && acc) || acc, [])

                                    if (newUsers.length > 0)
                                        setUsers(
                                            users.concat(await BaseUser.GetByIDs(newUsers))
                                        );

                                    break;
                                }
                            } else {
                                throw await resp.text();
                            }
                        } catch (e) {
                            if (!aborter.signal.aborted)
                                console.error("An error occurred while polling for listeners:" + (e && e.stack ? e.stack : e));
                        }
                    }
                })();
            }

            return () => {
                aborter.abort();
            }
        }, [parent, didInit, comments, fetchMore, listeners]);

        return [comments, users, listeners, (!didInit) || fetchMore, () => !noMore && setFetchMore(true)];
    }

    public static async Update(comment: Partial<Comment>): Promise<Comment> {
        return (await DoRequest({
            url: `${API_ENTITY("Comment")}${comment.id ? `/${comment.id}` : ""}`,
            method: comment.id ? "PUT" : "POST",
            data: {
                ...comment,
                content: JSON.stringify(comment.content)
            },
            return: Comment
        }))!;
    }

    public static async Delete(comment: Comment): Promise<boolean> {
        await DoRequest({
            url: `${API_ENTITY("Comment")}/${comment.id}`,
            method: "DELETE"
        });
        return true;
    }
}
import { IsInt } from "class-validator";
import { useState, useEffect } from "react";
import { plainToClass, Transform } from "class-transformer";
import { Entity } from "./Entity";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { BaseUser } from "./User";
import { Dictionary } from "../interfaces";

export class Comment extends Entity {
    @Transform(obj => {
        try {
            return JSON.parse(obj)
        } catch(e){
            return {
                t: obj
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

    public static async GetComments(parentId: number, reverse: boolean = true, skip: number = 0, limit: number = 20, createEnd?: Date): Promise<Comment[] | null> {
        return (await DoRequest<Comment[]>({
            url: API_ENTITY("Comment"),
            method: "GET",
            data: {
                parentIds: parentId,
                reverse: reverse,
                limit,
                skip,
                ... (createEnd ? {createEnd: createEnd.toISOString()} : {})
            }
        }))?.map(comment => plainToClass(Comment, comment)) || null;
    }

    public static useComments(parent: Entity[] | null): [Comment[], BaseUser[], boolean, () => void] {
        // Since this is using long polling, which is a VERY special case, we're giving up on even TRYING to reuse useRequest
        const [comments, setComments] = useState<Comment[]>([]);
        const [users, setUsers] = useState<BaseUser[]>([]);
        const [didInit, setDidInit] = useState<boolean>(false);
        const [lastParent, setLastParent] = useState<Entity>();
        const [fetchMore, setFetchMore] = useState<boolean>(false);
        const [noMore, setNoMore] = useState<boolean>(false);

        useEffect(() => {
            if (parent == null || parent[0] == null)
                return;
            
            if(lastParent !== parent[0]){
                setComments([]);
                setLastParent(parent[0]);
                setDidInit(false);
                setFetchMore(false);
                setNoMore(false);
                return;
            }

            const aborter = new AbortController();

            if (!didInit) {
                (async () => {
                    if(aborter.signal.aborted)
                        return;
                    
                    let newc: Comment[]
                    setComments(
                        newc = (await Comment.GetComments(parent[0].id) || comments).reverse()
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
            } else if(fetchMore && !noMore){
                (async () => {
                    if(aborter.signal.aborted)
                        return;
                    
                    let newc: Comment[]
                    setComments(
                        newc = (await Comment.GetComments(parent[0].id, true, comments.length, 20) || []).reverse().concat(comments)
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
            } else {
                (async () => {
                    while (!aborter.signal.aborted) {
                        if (!didInit)
                            continue;

                        try {
                            let token = sessionStorage.getItem("sbs-auth") || localStorage.getItem("sbs-auth") || null;
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
                                let newc = (await resp.json());
                                if (newc.length > 0) {
                                    setComments(
                                        newc = comments.concat(
                                            newc.map((obj: Comment) => plainToClass(Comment, obj))
                                        )
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
                            if(!aborter.signal.aborted)
                                console.error("An error occurred doing all that fun stuff: " + ("stack" in e ? e.stack : e));
                        }
                    }
                })();
            }

            return () => {
                aborter.abort();
            }
        }, [parent, didInit, comments, fetchMore]);

        return [comments, users, (!didInit) || fetchMore, () => !noMore && setFetchMore(true)];
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
}
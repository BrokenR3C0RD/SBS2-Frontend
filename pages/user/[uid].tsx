import { NextPage } from "next";
import { PageProps, Dictionary } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { BaseUser, UserPage, Comment } from "../../classes";
import Moment from "moment";
import DisplayMarkup from "../../components/DisplayMarkup";
import { useInView } from "react-intersection-observer";
import { CRUD } from "../../classes/Entity";
import Form from "../../components/Form";
import Composer from "../../components/Composer";
import Link from "next/link";
import moment from "moment";

export default (({
    setInfo,
    user: self
}) => {
    const { query: { uid } } = useRouter();

    const [, user] = BaseUser.useUser({
        ids: [parseInt((uid ?? "").toString())]
    });

    const [, pages] = UserPage.useUserPage(user?.[0]);
    let page = pages?.[0];

    useEffect(() => {
        setInfo(user?.[0] ? user[0].username : "", []);
    }, [user]);

    const [comments, commentUsers, listeners, fetching, fetchMoreComments] = Comment.useComments(pages, self != null);
    const [ref, inView] = useInView();

    const [commentId, setCommentId] = useState<number>(0);
    const [commentCode, setCommentCode] = useState<string>("");
    const [commentMarkup, setCommentMarkup] = useState<string>("12y");
    const commentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (inView)
            fetchMoreComments();

    }, [inView]);


    async function PostComment(data: Dictionary<string | boolean | number>) {
        let commentText = data["composer-code"] as string;
        let markup = data["markup-lang"] as string;

        await Comment.Update({
            parentId: page!.id,
            id: (commentId === 0 ? undefined : commentId),
            content: {
                t: commentText,
                m: markup
            }
        });

        setCommentCode("");
        setCommentMarkup("12y");
        setCommentId(0);
    }

    async function EditComment(id: number) {
        let comment = comments.find(comment => comment.id == id);

        setCommentCode(comment?.content?.t || "");
        setCommentMarkup(comment?.content?.m || "12y");
        setCommentId(comment?.id || 0);

        commentRef.current!.scrollIntoView(true);
    }

    async function DeleteComment(id: number) {
        if (!confirm("Are you sure you want to delete this comment?"))
            return;

        await Comment.Delete(comments.find(comment => comment.id == id)!);
    }

    return <>
        <Grid
            rows={["min-content", "max-content", "max-content", "max-content"]}
            cols={["max-content", "1fr"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%"
            }}
        >
            {user && user[0] && <>
                <Cell x={1} y={1} width={2}>
                    <h1>{user[0].username}</h1>
                    <div id="page-info">
                        <b>Joined: </b>{Moment(user[0].createDate).fromNow()}
                    </div>
                </Cell>
                <Cell x={1} y={2} width={1} >
                    <img className="profile-avatar" width="256" height="256" src={user[0].GetAvatarURL(256)} />
                </Cell>
                <Cell x={2} y={2} height={2}>
                    <h2>About me:</h2>
                    {page &&
                        <DisplayMarkup markupLang={page.values.markupLang} code={page.content} />
                        || <h3>This user hasn't created a page yet!</h3>}
                </Cell>
                {page &&
                    <Cell x={2} y={4}>
                        <h2>Wall:</h2>
                        {self && page.Permitted(self, CRUD.Create) && <Form onSubmit={PostComment}>
                            <Composer hidePreview markup={commentMarkup} code={commentCode} onChange={(code, markup) => { setCommentCode(code); setCommentMarkup(markup); }} ref={commentRef} />
                            <input type="submit" value="Post to wall!" />
                        </Form> || !self && <h3>Sign in to post to this user's wall!</h3> || <h3>You can't post to this user's wall!</h3>}
                        {page &&
                            (() => {
                                let listeningUsers = listeners.map(listener => {
                                    let user = commentUsers.find(user => user.id == listener);
                                    return user!;
                                }).filter(user => user != null && user.id != self?.id);

                                let message = `${listeningUsers.slice(0, 2).map(user => user.username).join(", ")} and ${listeningUsers.length - 3} other${listeningUsers.length != 1 ? "s" : ""} are`;
                                if (listeningUsers.length == 0) {
                                    return null;
                                } else if (listeningUsers.length == 1) {
                                    message = `${listeningUsers[0].username} is`;
                                } else if (listeningUsers.length <= 3) {
                                    message = `${listeningUsers.slice(0, listeningUsers.length - 1).map(user => user.username).join(", ")} and ${listeningUsers[listeningUsers.length - 1].username} are`;
                                }

                                return <h4>{message} currently viewing this user's page!</h4>
                            })()
                        }
                        <div className="wall-comments">
                            {comments.slice().reverse().map((comment, idx) => {
                                let user = commentUsers.find(user => user.id == comment.createUserId);
                                if (user == null) return null;

                                return <div className="comment" key={comment.id} ref={comments.length - 1 == idx && !fetching ? ref : undefined}>
                                    <img src={user.GetAvatarURL(64)} className="avatar" />
                                    <div className="comment-body">
                                        <div className="user-info">
                                            <span className="username">
                                                <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                            </span>

                                            <span className="editdate">
                                                {((comment.editDate.valueOf() - comment.createDate.valueOf()) >= 2000) ? "Edited " : "Posted "} {moment(comment.editDate).fromNow()}
                                            </span>
                                            <div className="buttons">
                                                {self && comment.Permitted(self, CRUD.Update) && <button type="button" style={{ textAlign: "center" }} onClick={() => EditComment(comment.id)}><span className="iconify" data-icon="fe:pencil" data-inline="true"></span></button>}
                                                {self && comment.Permitted(self, CRUD.Delete) && <button type="button" style={{ color: "lightcoral", }} onClick={() => { DeleteComment(comment.id) }}><span className="iconify" data-icon="ic:baseline-delete" data-inline="true"></span></button>}
                                            </div>
                                        </div>

                                        <div className="comment-content">
                                            <DisplayMarkup code={comment.content["t"]} markupLang={comment.content["m"]} />
                                        </div>
                                    </div>
                                </div>
                            })
                            }
                        </div>
                    </Cell>}
            </>}

        </Grid>
    </>;
}) as NextPage<PageProps>;
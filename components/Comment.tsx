import DisplayMarkup from "./DisplayMarkup";
import { CRUD } from "../classes/Entity";
import { Comment, FullUser, Content } from "../classes";
import Link from "next/link";
import moment from "moment";
import { useInView } from "react-intersection-observer";
import ScrollableFeed from "react-scrollable-feed";
import { useEffect, useState } from "react";
import { Spinner } from "./Layout";
import Composer from "./Composer";
import Form from "./Form";

const Comments = (({
    parent,
    reverse = false,
    self,
    className = "comments",
    autoScroll = false
}) => {
    const [ref, inView] = useInView();

    const [commentCode, setCommentCode] = useState<string>("");
    const [commentMarkup, setCommentMarkup] = useState<string>("12y");
    const [commentId, setCommentId] = useState<number>(0);

    const [rawComments, users, listeners, fetching, loadMore] = Comment.useComments([parent], self != null);

    useEffect(() => {
        if (inView) {
            loadMore();
        }
    }, [inView]);

    let comments = rawComments.slice();
    if (reverse)
        comments = comments.reverse();


    async function EditComment(id: number) {
        let comment = comments.find(comment => comment.id == id);

        setCommentCode(comment?.content?.t || "");
        setCommentMarkup(comment?.content?.m || "12y");
        setCommentId(comment?.id || 0);
    }

    async function PostComment() {
        await Comment.Update({
            parentId: parent!.id,
            id: (commentId === 0 ? undefined : commentId),
            content: {
                t: commentCode,
                m: commentMarkup
            }
        });

        setCommentCode("");
        setCommentMarkup("12y");
        setCommentId(0);
    }

    async function DeleteComment(id: number) {
        if (!confirm("Are you sure you want to delete this comment?"))
            return;

        await Comment.Delete(comments.find(comment => comment.id == id)!);
    }

    const [firstUpdate, setFirstUpdate] = useState(true);

    useEffect(() => {
        if(autoScroll && firstUpdate && !fetching && comments && users && listeners){
            setFirstUpdate(false);
            let list = document.querySelector(".comments-list")!;
            list.scrollTop = list.scrollHeight;
        }
    }, [firstUpdate, comments, users, listeners, fetching, autoScroll])

    return <div className={className}>
        <ul className="comment-listeners">
            {listeners.map(listener => {
                let user = users.find(user => user.id == listener);
                if (user == null) return null;

                return <li key={user.id}>
                    <Link href="/user/[uid]" as={`/user/${user.id}`}><a><img src={user.GetAvatarURL(64)} className="comment-listener" title={user.username} /></a></Link>
                </li>
            })}
        </ul>
        <ScrollableFeed className="comments-list" changeDetectionFilter={() => autoScroll}>
            {!reverse && fetching && <Spinner />}
            {
                comments.slice().map((comment, idx) => {
                    let user = users.find(user => user.id == comment.createUserId);
                    if (user == null) return null;

                    return <div className="comment" key={comment.id} ref={(reverse ? comments.length - 1 : 0) == idx && !fetching ? ref : undefined}>
                        <img src={user.GetAvatarURL(64)} className="avatar" />
                        <div className="comment-body">
                            <div className="user-info">
                                <span className="username">
                                    <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                </span>
                                <div className="buttons">
                                    {self && comment.Permitted(self, CRUD.Update) && <button type="button" style={{ textAlign: "center" }} onClick={() => EditComment(comment.id)}><span className="iconify" data-icon="fe:pencil" data-inline="true"></span></button>}
                                    {self && comment.Permitted(self, CRUD.Delete) && <button type="button" style={{ color: "lightcoral", }} onClick={() => { DeleteComment(comment.id) }}><span className="iconify" data-icon="ic:baseline-delete" data-inline="true"></span></button>}
                                </div>

                                <span className="editdate">
                                    {((comment.editDate.valueOf() - comment.createDate.valueOf()) >= 2000) ? "Edited " : "Posted "} {moment(comment.editDate).fromNow()}
                                </span>
                            </div>

                            <div className="comment-content">
                                {
                                    comment.id == commentId && <Form onSubmit={PostComment} className="comment-edit">
                                        <Composer hidePreview code={commentCode} markup={commentMarkup} onChange={(code, markup) => { setCommentCode(code); setCommentMarkup(markup); }} />
                                        <div className="edit-buttons">
                                            <button type="button" onClick={() => EditComment(0)}><span className="iconify" data-icon="topcoat:cancel" data-inline="true"></span></button>
                                            <button type="submit"><span className="iconify" data-icon="mdi:send" data-inline="true"></span></button>
                                        </div>
                                    </Form> || <DisplayMarkup code={comment.content["t"]} markupLang={comment.content["m"]} />
                                }
                            </div>
                        </div>
                    </div>
                })
            }
            {reverse && fetching && <Spinner />}
        </ScrollableFeed>
    </div>;
}) as React.FunctionComponent<{
    parent: Content,
    reverse?: boolean,
    self?: FullUser,
    className?: string,
    autoScroll?: boolean
}>

export { Comments }
import { NextPage } from "next";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import { Category, Discussion, BaseUser, Comment } from "../../classes";
import { useRouter } from "next/router";
import Moment from "moment";
import DisplayMarkup from "../../components/DisplayMarkup";
import { Comments } from "../../components/Comment";
import { CRUD } from "../../classes/Entity";
import Form from "../../components/Form";
import Composer from "../../components/Composer";

export default (({
    setInfo,
    user: self
}) => {
    const Router = useRouter();

    const { did } = Router.query;
    const [, discussions] = Discussion.useDiscussion({
        ids: [+did]
    });
    let discussion = discussions?.[0];
    let textRef = useRef<HTMLTextAreaElement>(null);

    const [, users] = BaseUser.useUser({
        ids: [discussion?.createUserId as number, discussion?.editUserId as number]
    });
    let user = users?.find(user => user.id == discussion?.createUserId)
    let editUser = users?.find(user => user.id == discussion?.editUserId);

    const [, tree] = Category.useCategoryTree();

    const [useComposer, setUseComposer] = useState<boolean>(false);
    let [minimize, setMinimize] = useState<boolean>(true);
    useEffect(() => setInfo(discussion?.name || "", [], true), [discussions]);

    let [commentCode, setCommentCode] = useState("");
    const [commentMarkup, setCommentMarkup] = useState("plaintext");

    async function PostComment() {
        if(textRef.current){
            commentCode = textRef.current.value;
            textRef.current.value = "";
        }
            
        if (commentCode.trim().length == 0)
            return;

        setCommentCode("");

        await Comment.Update({
            parentId: discussion!.id,
            content: {
                t: commentCode,
                m: commentMarkup
            }
        });
    }

    function handleEnter(evt: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (evt.key === "Enter" && !evt.shiftKey) {
            evt.preventDefault();
            PostComment();
        }
    }

    return <>
        <Grid
            rows={["min-content", "1fr"]}
            cols={["max-content", "1fr", "1fr"]}
            gapX="1em"
            gapY="0"
            style={{
                width: "100%",
                height: "calc(100vh - var(--nav-height) - 2em)"
            }}
            always // Cheap hack
            className="discussions-grid"
        >
            {(!tree || !discussions) && <Cell x={1} y={1} width={3}>
                <h1>Loading...</h1>
            </Cell>}
            {tree && discussion && user && editUser &&
                <>
                    <Cell x={1} y={1} width={3} data-minimize={minimize}>
                        <h2 className="crumbs">
                            {discussion.name}
                        </h2>
                        <div>
                            <div id="page-info">
                                <span><b>{`Author: `}</b>
                                    <Link href="/user/[uid]" as={`/user/${user.id}`}><a>
                                        <img src={user.GetAvatarURL(32)} className="info-avatar" />
                                        {user.username}
                                    </a></Link></span>
                                {` • `}
                                <span><b>Created: </b>{Moment(discussion.createDate).fromNow()}</span>
                                {(discussion.editDate.valueOf() - discussion.createDate.valueOf()) >= 2000 && <span>
                                    {` • `}
                                    <b>Last edited: </b>{Moment(discussion.editDate).fromNow()} by <Link href="/user/[uid]" as={`/user/${editUser.id}`}><a>
                                        <img src={editUser.GetAvatarURL(32)} className="info-avatar" />
                                        {editUser.username}
                                    </a></Link>
                                </span>}
                            </div>
                            <br />
                            <DisplayMarkup markupLang={discussion.values.markupLang} code={discussion.content} />
                        </div>
                    </Cell>
                    <Cell x={1} y={2} width={3} className="discussion-view">
                        <button type="button" className="topbutton" onClick={() => setMinimize(!minimize)}><span className="iconify" data-icon="icomoon-free:shrink2" data-inline="true"></span></button>
                        <Comments className="discussion-comments" parent={discussion} self={self} autoScroll merge />
                        {self && discussion.Permitted(self, CRUD.Create) && (<Form onSubmit={PostComment} className="discussion-input">
                            {!useComposer && <textarea ref={textRef} onKeyPress={handleEnter} />}
                            {useComposer && <Composer hidePreview code={commentCode} markup={commentMarkup} onChange={(code, markup) => { setCommentCode(code); setCommentMarkup(markup); }} />}
                            <div className="discussion-buttons">
                                <button type="submit"><span className="iconify" data-icon="mdi:send" data-inline="true"></span></button>
                                <button type="button" onClick={() => setUseComposer(!useComposer)}><span className="iconify" data-icon="bytesize:compose" data-inline="true"></span>
                                {` `}
                                {commentMarkup !== "plaintext" ? commentMarkup : ""}
                                </button>
                            </div>
                        </Form>)}
                    </Cell>
                </>
            }
            {discussions && (discussion == null) && <>
                <Cell x={1} y={1} width={3}>
                    <h1>This discussion doesn't exist!</h1>
                </Cell>
            </>
            }

            <style jsx global>{`
                #content {
                    margin-bottom: 0;
                }
            `}</style>
        </Grid>
    </>
}) as NextPage<PageProps>;
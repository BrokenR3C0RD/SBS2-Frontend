import { NextPage } from "next";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { BaseUser, UserPage, Comment } from "../../classes";
import Moment from "moment";
import DisplayMarkup from "../../components/DisplayMarkup";
import { CRUD } from "../../classes/Entity";
import Form from "../../components/Form";
import Composer from "../../components/Composer";
import { Comments } from "../../components/Comment";

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

    const [commentCode, setCommentCode] = useState<string>("");
    const [commentMarkup, setCommentMarkup] = useState<string>("12y");

    async function PostComment() {

        await Comment.Update({
            parentId: page!.id,
            content: {
                t: commentCode,
                m: commentMarkup
            }
        });

        setCommentCode("");
        setCommentMarkup("12y");
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
                        {self && page.Permitted(self, CRUD.Create) && <div className="comment-post">
                            <Form onSubmit={PostComment}>
                                <Composer hidePreview code={commentCode} markup={commentMarkup} onChange={(code, markup) => { setCommentCode(code); setCommentMarkup(markup); }} />
                                <div className="edit-buttons">
                                    <button type="submit"><span className="iconify" data-icon="mdi:send" data-inline="true"></span></button>
                                </div>
                            </Form>
                        </div>}
                        <Comments parent={page} reverse self={self} className="wall-comments" />
                    </Cell>
                }
            </>}

        </Grid>
    </>;
}) as NextPage<PageProps>;
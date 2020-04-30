import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { PageProps, Dictionary } from "../../../interfaces";
import { Grid, Cell, Spinner } from "../../../components/Layout";
import { Category, ParentCategory, Discussion } from "../../../classes";
import { useRouter } from "next/router";
import { useInView } from "react-intersection-observer";
import moment from "moment";
import { CRUD } from "../../../classes/Entity";
import Form from "../../../components/Form";
import Composer from "../../../components/Composer";
// import { API_ENTITY } from "../../../utils/Constants";

export default (({
    setInfo,
    user: self
}) => {
    useEffect(() => setInfo("", []), []);
    const Router = useRouter();

    const { cid } = Router.query;
    const [, tree] = Category.useCategoryTree();
    const [ref, inView] = useInView();

    const [users, discussions, loading, loadMore, more] = Discussion.useDiscussions({
        parentIds: [+cid],
        reverse: true,
        limit: 25
    });

    useEffect(() => {
        if (inView && more && !loading)
            loadMore();
    }, [inView]);

    let category: ParentCategory | undefined = undefined;

    let crumbs: ParentCategory[] = [];
    if (tree) {
        let root = tree.find(category => category.name == "Discussions");
        if (root && root.id == +cid) {
            crumbs = [root];
            category = root;
        } else {
            let res = root?.GetTreeLocation(+cid);
            if (!root || res == null)
                category = undefined;
            else {
                crumbs = [root].concat(res);
                category = crumbs[crumbs.length - 1];
            }
        }
    }

    async function CreateDiscussion(data: Dictionary<string | boolean | number>) {
        let title = data["title"] as string;
        let content = data["composer-code"] as string;
        let markupLang = data["markup-lang"] as string;

        let newDiscussion = await Discussion.Update({
            parentId: +cid,
            content: content,
            name: title,
            values: {
                markupLang
            },
            permissions: {
                "0": "cr"
            },
            type: "@discussion"
        });

        await Router.push("/discussions/[did]", `/discussions/${newDiscussion.id}`);
    }

    let children: ParentCategory[] = crumbs?.[crumbs?.length - 1]?.children || [];

    useEffect(() => setInfo(category?.name || "", []), [tree]);

    /*const [ref, inView] = useInView();

    useEffect(() => {
        if (inView)
            fetchMoreComments();

    }, [inView])*/

    const [, pinned] = Discussion.useDiscussion({
        ids: category?.PinnedContent(true) || [0]
    });

    async function PinDiscussion(id: number) {
        let pinned: number[] = category?.PinnedContent() || [];
        if (pinned.indexOf(id) == -1) {
            pinned.push(id);
        } else {
            pinned.splice(pinned.indexOf(id), 1);
        }
        category!.values.pinned = pinned.filter(n => n != 0).join(",");
        await Category.Update(category!);
    }

    return <>
        <Grid
            rows={["min-content", "max-content", "max-content", "max-content", "max-content"]}
            cols={["max-content", "1fr", "1fr"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%",
                height: "100%"
            }}
        >
            {(!tree) && <Cell x={1} y={1} width={3}>
                <h1>Loading...</h1>
            </Cell>}
            {tree && category &&
                <>

                    <Cell x={1} y={1} width={3}>
                        <h1 className="crumbs">
                            {`Categories: `}
                            {crumbs.map((crumb, i) => {
                                if (crumbs.length - 1 === i) {
                                    return <>{crumb.name}</>;
                                } else {
                                    return <><Link href="/discussions/categories/[cid]" as={`/discussions/categories/${crumb.id}`}><a>{crumb.name}</a></Link>{` > `}</>;
                                }
                            })}
                        </h1>
                        <p>
                            {category.description}
                        </p>
                    </Cell>
                    {children && pinned && (children.length > 0 || pinned.length > 0) &&
                        <Cell x={1} y={2} width={3}>
                            {children.length > 0 && <>
                                <h2>Subcategories</h2>
                                <ul className="category-list">
                                    {children.map(child => {
                                        return (<li key={child.id}>
                                            <Link href="/discussions/categories/[cid]" as={`/discussions/categories/${child.id}`}><a>{child.name}</a></Link>
                                            <p>
                                                {child.description}
                                            </p>
                                        </li>)
                                    })}
                                </ul>
                                <br />
                            </>}
                            {pinned.length > 0 && <>
                                <h2>Pinned content:</h2>
                                {pinned.map((discussion, i) => {
                                    let user = users.find(user => user.id == discussion.createUserId);
                                    if (!user)
                                        return null;

                                    // let img = page.values.photos?.split(",")?.[0];
                                    return <div className="resource-entry" key={discussion.id} ref={i == discussions.length - 1 && more ? ref : undefined}>
                                        {/* <img src={img ? `${API_ENTITY("File")}/raw/${+img}?size=200` : "/res/img/logo.svg"} className="page-photo" /> */}
                                        <span className="page-name">
                                            <button type="button" onClick={() => PinDiscussion(discussion.id)} disabled={!self || !category?.Permitted(self, CRUD.Update)}>
                                                {pinned.findIndex(p => discussion.id == p.id) != -1 ? `📌` : `📍`}
                                            </button>
                                            <Link href="/pages/[pid]" as={`/pages/${discussion.id}`}>
                                                {discussion.name}
                                            </Link>
                                        </span>
                                        <span className="page-author">
                                            <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                        </span>
                                        <span className="page-time">
                                            {moment(discussion.editDate).fromNow()}
                                        </span>
                                    </div>
                                })
                                }
                            </>}
                        </Cell>
                    }
                    <Cell x={1} y={3} width={3}>
                        <h2>Discussions</h2>
                        {discussions && users && pinned &&
                            discussions.map((discussion, i) => {
                                let user = users.find(user => user.id == discussion.createUserId);
                                if (!user)
                                    return null;

                                return <div className="resource-entry" key={discussion.id} ref={i == discussions.length - 1 && more ? ref : undefined}>
                                    <span className="page-name">
                                        {((self && category?.Permitted(self, CRUD.Update)) || pinned.findIndex(p => discussion.id == p.id) != -1) && <button type="button" onClick={() => PinDiscussion(discussion.id)} disabled={!self || !category?.Permitted(self, CRUD.Update)}>
                                            {pinned.findIndex(p => discussion.id == p.id) != -1 ? `📌` : `📍`}
                                        </button>}
                                        <Link href="/discussions/[did]" as={`/discussions/${discussion.id}`}>
                                            {discussion.name}
                                        </Link>
                                    </span>
                                    <span className="page-author">
                                        <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                    </span>
                                    <span className="page-time">
                                        {moment(discussion.editDate).fromNow()}
                                    </span>
                                </div>
                            })
                        }
                        {loading && <Spinner />}
                    </Cell>
                    {self && category.Permitted(self, CRUD.Create) && <Cell x={1} y={4} width={3}>
                        <h2>Create a discussion</h2>
                        <Form onSubmit={CreateDiscussion}>
                            <input type="text" name="title" placeholder="Title" />
                            <Composer />
                            <br />
                            <input type="submit" value="Post discussion!" />
                        </Form>
                    </Cell>}
                </>
            }
            {tree && !category &&
                <Cell x={1} y={1} width={3}>
                    <h1>This category doesn't exist!</h1>
                </Cell>
            }
        </Grid>
    </>
}) as NextPage<PageProps>;
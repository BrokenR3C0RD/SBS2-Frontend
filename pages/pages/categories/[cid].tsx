import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { PageProps } from "../../../interfaces";
import { Grid, Cell, Spinner } from "../../../components/Layout";
import { Category, ParentCategory, Page } from "../../../classes";
import { useRouter } from "next/router";
import { useInView } from "react-intersection-observer";
import moment from "moment";
// import { API_ENTITY } from "../../../utils/Constants";

export default (({
    setInfo,
}) => {
    useEffect(() => setInfo("", []), []);
    const Router = useRouter();


    const { cid } = Router.query;
    const [, tree] = Category.useCategoryTree();
    const [ref, inView] = useInView();

    const [users, pages, loading, loadMore, more] = Page.usePages({
        parentIds: [+cid],
        reverse: true,
        limit: 2
    });

    useEffect(() => {
        if (inView && more && !loading)
            loadMore();
    }, [inView]);

    let category: ParentCategory | undefined = undefined;

    let crumbs: ParentCategory[] = [];
    if (tree) {
        let root = tree.find(category => category.name == "Pages");
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

    let children: ParentCategory[] = crumbs?.[crumbs?.length - 1]?.children || [];

    useEffect(() => setInfo(category?.name || "", []), [tree]);

    /*const [ref, inView] = useInView();

    useEffect(() => {
        if (inView)
            fetchMoreComments();

    }, [inView])*/

    return <>
        <Grid
            rows={["min-content", "max-content", "max-content", "max-content"]}
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
                                    return <><Link href="/pages/categories/[cid]" as={`/pages/categories/${crumb.id}`}><a>{crumb.name}</a></Link>{` > `}</>;
                                }
                            })}
                        </h1>
                        <p>
                            {category.description}
                        </p>
                        <Link href={`/pages/edit?cid=${cid}`}><a>Create a page here!</a></Link>
                    </Cell>
                    {children && children.length > 0 &&
                        <Cell x={1} y={2} width={3}>
                            <h2>Subcategories</h2>
                            <ul className="category-list">
                                {children.map(child => {
                                    return (<li key={child.id}>
                                        <Link href="/pages/categories/[cid]" as={`/pages/categories/${child.id}`}><a>{child.name}</a></Link>
                                        <p>
                                            {child.description}
                                        </p>
                                    </li>)
                                })}
                            </ul>
                        </Cell>
                    }
                    <Cell x={1} y={3} width={3}>
                        <h2>Pages</h2>
                        {pages && users &&
                            pages.map((page, i) => {
                                let user = users.find(user => user.id == page.createUserId);
                                if (!user)
                                    return null;

                                // let img = page.values.photos?.split(",")?.[0];
                                return <div className="resource-entry" key={page.id} ref={i == pages.length - 1 && more ? ref : undefined}>
                                    {/* <img src={img ? `${API_ENTITY("File")}/raw/${+img}?size=200` : "/res/img/logo.svg"} className="page-photo" /> */}
                                    <span className="page-name">
                                        <Link href="/pages/[pid]" as={`/pages/${page.id}`}>
                                            {page.name}
                                        </Link>
                                    </span>
                                    <span className="page-author">
                                        <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                    </span>
                                    <span className="page-time">
                                        {moment(page.editDate).fromNow()}
                                    </span>
                                </div>
                            })
                        }
                        {loading && <Spinner />}
                    </Cell>
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
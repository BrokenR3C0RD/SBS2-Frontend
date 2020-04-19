import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import { Category, ParentCategory } from "../../classes";
import { useRouter } from "next/router";

export default (({
    setInfo,
}) => {
    useEffect(() => setInfo("Page", [1]), []);
    const Router = useRouter();


    const { cid } = Router.query;
    const [, categories] = Category.useCategory([+cid]);
    const [, tree] = Category.useCategoryTree();

    const category = (categories?.[0] as Category | undefined);
    let crumbs: ParentCategory[] = [];
    if (category && tree) {
        for (let i = 0; i < tree.length; i++) {
            if (tree[i].id == category.id) {
                crumbs = [tree[i]];
                break;
            }

            let res = tree[i].GetTreeLocation(category.id);
            if (res != null) {
                crumbs = [tree[i]].concat(res);
                break;
            }
        }
    }

    let children: ParentCategory[] = crumbs?.[crumbs?.length - 1]?.children || [];

    useEffect(() => setInfo(category?.name || "", []), [categories]);

    /*const [ref, inView] = useInView();

    useEffect(() => {
        if (inView)
            fetchMoreComments();

    }, [inView])*/

    return <>
        <Grid
            rows={["min-content", "min-content", "1fr", "min-content"]}
            cols={["max-content", "1fr", "1fr"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%"
            }}
        >
            {(!categories || (categories!.length != 0 && !tree)) && <Cell x={1} y={1} width={3}>
                <h1>Loading...</h1>
            </Cell>}
            {category && tree &&
                <>

                    <Cell x={1} y={1} width={3}>
                        <h1 className="crumbs">
                            {`Categories: `}
                            {crumbs.map((crumb, i) => {
                                if (crumbs.length - 1 === i) {
                                    return <>{crumb.name}</>;
                                } else {
                                    return <><Link href="/categories/[cid]" as={`/categories/${crumb.id}`}><a>{crumb.name}</a></Link>{` > `}</>;
                                }
                            })}
                        </h1>
                    </Cell>
                    {children && children.length > 0 &&
                        <Cell x={1} y={2} width={3}>
                            <h2>Subcategories</h2>
                            <ul className="category-list">
                                {children.map(child => {
                                    return (<li key={child.id}>
                                        <Link href="/categories/[cid]" as={`/categories/${child.id}`}><a>{child.name}</a></Link>
                                        <p>
                                            {child.description}
                                        </p>
                                    </li>)
                                })}
                            </ul>
                        </Cell>
                    }
                    <Cell x={1} y={3} width={3}>
                        <h2>Discussions</h2>
                    </Cell>
                </>
            }
            {categories && (categories.length == 0) &&
                <Cell x={1} y={1} width={3}>
                    <h1>This category doesn't exist!</h1>
                </Cell>
            }
        </Grid>
    </>
}) as NextPage<PageProps>;
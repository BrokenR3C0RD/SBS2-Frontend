import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell, Spinner } from "../../components/Layout";
import { Page } from "../../classes";
import { useInView } from "react-intersection-observer";
import moment from "moment";
import { API_ENTITY } from "../../utils/Constants";

export default (({
    setInfo,
}) => {
    useEffect(() => setInfo("Programs", []), []);
    const [ref, inView] = useInView();

    const [users, pages, loading, loadMore, more] = Page.usePages({
        type: "@page.program",
        reverse: true,
        limit: 24,
        sort: "id"
    });

    useEffect(() => {
        if (inView && more && !loading)
            loadMore();
    }, [inView]);


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
            {(!pages) && <Cell x={1} y={1} width={3}>
                <h1>Loading...</h1>
            </Cell>}
            <Cell x={1} y={1} width={3}>
                <h1>Program Gallery</h1>
            </Cell>
            <Cell x={1} y={2} width={3} className="program-library">
                {pages && users &&
                    pages.map((page, i) => {
                        let user = users.find(user => user.id == page.createUserId);
                        if (!user)
                            return null;

                        let img = page.values.photos?.split(",")?.[0];

                        return <Link href="/pages/[pid]" as={`/pages/${page.id}`}>
                            <div className="page-entry" key={page.id} ref={i == pages.length - 1 && more ? ref : undefined}>
                                <div className="page-photo-wrap">
                                    <img src={img ? `${API_ENTITY("File")}/raw/${+img}?size=400` : "/res/img/logo.svg"} className="page-photo" />
                                </div>
                                <span className="page-name">
                                    <Link href="/pages/[pid]" as={`/pages/${page.id}`}>
                                        {page.name}
                                    </Link>
                                </span>
                                <span className="page-key">
                                    {page.values.key}
                                </span>
                                <div className="page-extra">
                                    <span className="page-author">
                                        <Link href="/user/[uid]" as={`/user/${user.id}`}><a>{user.username}</a></Link>
                                    </span>
                                    <span className="page-time">
                                        {moment(page.editDate).fromNow()}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    })
                }
                {loading && <Spinner />}

            </Cell>
        </Grid>
    </>
}) as NextPage<PageProps>;
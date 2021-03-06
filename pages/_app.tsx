import { NextPage } from "next";
import { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import "normalize.css";
import { useEffect, useRef, useState } from "react";
import { Category, Page, BaseUser } from "../classes";
import "../styles/dark.css";
import "../styles/global.css";
import "../styles/light.css";
// import { API_ENTITY } from "../utils/Constants";
// import { useRequestPage } from "../utils/Request";
import { Logout, useSettings, useUser, Variable } from "../utils/User";
import dl from "damerau-levenshtein";
import { Spinner } from "../components/Layout";

const App = (({
    Component,
    pageProps
}) => {
    const userInfo = useRef<HTMLDivElement>(null);

    const user = useUser();
    const [, settings, mutateSettings] = useSettings();

    const [, tree, pins] = Category.useCategoryTree();
    const pageTree = tree?.find(category => category.name === "Pages");
    const discussionTree = tree?.find(category => category.name === "Discussions");


    const [title, setTitle] = useState("");
    const [sidebar, setSidebar] = useState(false);
    const [selected, setSelected] = useState([0]);
    const [loaded, setLoaded] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [query, setQuery] = useState<string>("");

    const router = useRouter();

    // const { data: pages, loading: loadingPages, end, loadMore: loadMorePages } = useRequestPage({
    //     url: API_ENTITY("Content"),
    //     method: "GET",
    //     data: {
    //         reverse: true,
    //         type: "@page%"
    //     },
    //     offset: 0,
    //     limit: 10,
    //     return: Page
    // }, (pages) => {
    //     if (pages == null) {
    //         return [<p>Loading...</p>];
    //     } else {
    //         return pages
    //             .map(page => <li key={page.id}>
    //                 <Link href="/pages/[pid]" as={`/pages/${page.id}`}><a>{page.name}</a></Link>
    //             </li>);
    //     }
    // }, []);



    async function SwitchTheme() {
        if (user)
            await Variable("user_settings", JSON.stringify(Object.assign({}, settings, {
                theme: localStorage.getItem("sbs-theme") === "dark" ? "light" : "dark"
            })));

        localStorage.setItem("sbs-theme", localStorage.getItem("sbs-theme") === "dark" ? "light" : "dark");
        mutateSettings();
    }

    useEffect(() => {
        if (user !== null && user !== false && settings?.["theme"])
            localStorage.setItem("sbs-theme", ((settings?.["theme"] as string) || "light"));
        else if (user === null && localStorage.getItem("sbs-theme") == null)
            localStorage.setItem("sbs-theme", "light");

        document.documentElement.dataset.theme = localStorage.getItem("sbs-theme") as string;
        if (settings) setLoaded(true);

        let siteJS = document.createElement("script");
        siteJS.async = true;
        if (settings && settings["SiteJS"] && router.query["sitejs"] != "off") {
            siteJS.innerHTML = `try { ${settings["SiteJS"] as string} } catch(e){console.error("Error in SiteJS:" + e.stack)};`;
            document.head.appendChild(siteJS);

            return () => { document.head.removeChild(siteJS); }
        }
    }, [settings, user]);

    useEffect(() => {
        router.events.on("routeChangeStart", () => {
            setSidebar(false);
            if (userInfo.current)
                userInfo.current!.dataset.open = "false";

            setLoaded(false);
        });

        router.events.on("routeChangeComplete", () => {
            if (settings) setLoaded(true);
        });
    }, []);

    const [footer, setFooter] = useState(false);

    const setInfo = (title: string, selected: number[], hideFooter: boolean = false) => {
        setTitle(title);
        setSelected(selected);
        setFooter(hideFooter);
    }

    function updateSideBar() {
        setSidebar(!sidebar);
        if (userInfo.current)
            userInfo.current.dataset.open = "false";
    }

    function toggle(evt: any) {
        if (evt.target === evt.currentTarget)
            evt.target.dataset.open = ["true", "false"][(["true", "false"].indexOf(evt.target.dataset.open) + 1) % 2];
    }
    function toggleParent(evt: any) {
        if (evt.target === evt.currentTarget && "open" in evt.target.parentElement.dataset)
            evt.target.parentElement.dataset.open = ["true", "false"][(["true", "false"].indexOf(evt.target.parentElement.dataset.open) + 1) % 2];
    }

    useEffect(() => {
        let abort = new AbortController();
        (async () => {
            if (query.length == 0)
                return setResults([]);;

            try {
                let usersThatMatch = await BaseUser.Search({
                    name: `%${query}%`,
                    limit: 10
                }, abort.signal);
                let pagesThatMatch = (await Page.Search({
                    name: `%${query}%`,
                    limit: 10
                }, abort.signal)).concat((await Page.Search({
                    keyword: `%${query}%`,
                    limit: 10
                }, abort.signal))).reduce<Page[]>((acc, val) => {
                    if (acc.findIndex(r => r.id == val.id) == -1)
                        acc.push(val)

                    return acc;
                }, [])

                let aggregate = (usersThatMatch.map<any>(user => ({
                    type: "user",
                    name: user.username,
                    link: `/user/${user.id}`,
                    keywords: []
                })))
                    .concat(
                        (pagesThatMatch.map<any>(page => ({
                            type: "page",
                            name: page.name,
                            link: `/pages/${page.id}`,
                            keywords: page.keywords
                        }))
                        )
                    )
                    .sort((a: any, b: any) => {
                        return (
                            dl(b.keywords.join(" "), query).similarity
                            - dl(a.keywords.join(" "), query).similarity
                        ) * 10
                            + (
                                dl(b.name, query).similarity
                                - dl(a.name, query).similarity
                            ) * 5
                    })
                    .slice(0, 10);

                setResults(aggregate);
            } catch (e) {

            }
        })();


        return () => abort.abort();
    }, [query]);

    const [style, setStyle] = useState<string>("");
    const styleTag = useRef<HTMLStyleElement>(null);
    useEffect(() => {
        if(localStorage)
            setStyle(localStorage.getItem("sbs-sitecss") || "");
    }, []);

    useEffect(() => {
        Variable("SiteCSS")
            .then(css => {
                if(style !== css)
                    setStyle(css || "");
            });
    });

    useEffect(() => {
        if(styleTag.current){
            styleTag.current.innerHTML = style;
            localStorage.setItem("sbs-sitecss", style || "");
        }
    }, [style, styleTag])

    const SearchTypeHref: { [i: string]: string } = {
        page: "/pages/[pid]",
        user: "/user/[uid]"
    }


    return <>
        <Head>
            <meta charSet="utf8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="shortcut icon" href="/favicon.svg" />
            <title>{title ? `${title} | SmileBASIC Source` : "SmileBASIC Source"}</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <script src="https://code.iconify.design/1/1.0.5/iconify.min.js"></script>

            {/* SEO stuff */}
            <meta name="rating" content="general" />
            <meta name="description" content="A community for learning to program and sharing programs made with SmileBASIC for the Nintendo 3DS and Switch." />
            <meta name="keywords" content="programming, programs, 3DS, Switch, Nintendo, SmileBASIC, BASIC, debugging, resources" />

            {/* OpenGraph stuff */}
            <meta property="og:description" content="A community for learning to program and sharing programs made with SmileBASIC for the Nintendo 3DS and Switch." />
            <meta property="og:url" content={`https://new.smilebasicsource.com${router.asPath}`} />
            <meta property="og:image" content={`https://new.smilebasicsource.com/res/img/logo.svg`} />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="SmileBASIC Source" />

            <script async defer data-domain="new.smilebasicsource.com" src="http://analytics.sbapi.me/js/plausible.js"></script>
        </Head>
        <style ref={styleTag} />
        <nav>
            <span id="nav-brand">
                <Link href="/"><a><img src="/res/img/logo.svg" /></a></Link>
            </span>

            <span className="search-container">
                <input type="text" placeholder="Search..." value={query} onChange={(evt) => setQuery(evt.currentTarget.value)} />
                <div id="hideout" />
                <div id="results">
                    <ul>
                        {results.map((result, i) => <li key={i}>
                            <Link href={SearchTypeHref[result.type as string] as string} as={result.link}><a>{result.name}</a></Link>
                        </li>)}
                    </ul>
                </div>
            </span>

            <img src="/res/img/hamburger.png" id="show-sidebar" onClick={updateSideBar} data-open={sidebar} />
            <div id="user-info" ref={userInfo} data-open={false} onClick={toggle}>
                {user && (
                    <>
                        <span id="user-name" onClick={toggleParent}>{user.username}</span>
                        <img src={user?.GetAvatarURL(64)} className="user-avatar" onClick={toggleParent} />
                        <ul>
                            <li><Link href="/user/[uid]" as={`/user/${user.id}`}><a>Profile</a></Link></li>
                            <li><Link href="/usersettings"><a>Settings</a></Link></li>
                            <li><a onClick={Logout}>Logout</a></li>
                        </ul>
                    </>
                )}
            </div>
        </nav>
        <div id="sidebar" data-open={sidebar}>
            <ul>
                <li>
                    <Link href="/"><a>Home</a></Link>
                </li>
                {user == null && (
                    <li>
                        <Link href="/login"><a>Login</a></Link>
                    </li>
                )}
                <li onClick={toggle} data-open="false">
                    <Link href="/pages/categories/[cid]" as={`/pages/categories/${tree?.find(page => page.name === "Pages")?.id}`}><a>Pages</a></Link>
                    <ul>
                        <li key={-1}><Link href="/pages/edit"><a>📝 Create a new page!</a></Link></li>
                        {
                            pageTree && pins && pins.filter(p => p.parentId === pageTree.id).map(page =>
                                <li key={page.id}>
                                    <Link href="/pages/[pid]" as={`/pages/${page.id}`}><a>{`📌`} {page.name}</a></Link>
                                </li>
                            )
                        }
                        {pageTree && pins && pageTree.children.map(function render(cat) {
                            let pinned = pins.filter(page => page.parentId == cat.id);

                            if (cat.children && cat.children.length == 0 && pinned.length == 0) {
                                return <li key={cat.id}><Link href="/pages/categories/[cid]" as={`/pages/categories/${cat.id}`}><a>{cat.name}</a></Link></li>;
                            } else {
                                return <li key={cat.id} data-open="false" onClick={toggle}>
                                    <Link href="/pages/categories/[cid]" as={`/pages/categories/${cat.id}`}><a>{cat.name}</a></Link>
                                    <ul>
                                        {pinned.map(page =>
                                            <li key={page.id}>
                                                <Link href="/pages/[pid]" as={`/pages/${page.id}`}><a>{`📌 `} {page.name}</a></Link>
                                            </li>
                                        )}
                                        {cat.children.map(render)}
                                    </ul>
                                </li>;
                            }
                        })}
                    </ul>
                </li>
                <li onClick={toggle} data-open="false">
                    <Link href="/discussions/categories/[cid]" as={`/discussions/categories/${tree?.find(page => page.name === "Discussions")?.id}`}><a>Discussions</a></Link>
                    <ul>
                        {
                            discussionTree && pins && pins.filter(p => p.parentId === discussionTree.id).map(discussion =>
                                <li key={discussion.id}>
                                    <Link href="/discussions/[did]" as={`/discussions/${discussion.id}`}><a>{`📌`} {discussion.name}</a></Link>
                                </li>
                            )
                        }
                        {discussionTree && pins && discussionTree.children.map(function render(cat) {
                            let pinned = pins.filter(discussion => discussion.parentId == cat.id);

                            if (cat.children && cat.children.length == 0 && pinned.length == 0) {
                                return <li key={cat.id}><Link href="/discussions/categories/[cid]" as={`/discussions/categories/${cat.id}`}><a>{cat.name}</a></Link></li>;
                            } else {
                                return <li key={cat.id} data-open="false" onClick={toggle}>
                                    <Link href="/discussions/categories/[cid]" as={`/discussions/categories/${cat.id}`}><a>{cat.name}</a></Link>
                                    <ul>
                                        {cat.children.map(render)}
                                        {pinned.map(discussion =>
                                            <li key={discussion.id}>
                                                <Link href="/discussions/[did]" as={`/discussions/${discussion.id}`}><a>{`📌`} {discussion.name}</a></Link>
                                            </li>
                                        )}
                                    </ul>
                                </li>;
                            }
                        })}
                    </ul>
                </li>


                {user && user.super &&
                    <li>
                        <Link href="/admin"><a>Admin Panel</a></Link>
                    </li>
                }
            </ul>
        </div>
        {selected[0] !== 0 &&
            <style jsx global>{`
            
                #sidebar ${" > " + selected.map(num => `ul > li:nth-child(${num})`).join(" > ")} a {
                    color: var(--sidebar-selected);
                }
                #sidebar ${" > " + selected.map(num => `ul > li:nth-child(${num})`).join(" > ")} a:hover {
                    color: var(--sidebar-selected-hover);
                }
            `}</style>
        }
        <div id="content">
            <Component {...pageProps} setInfo={setInfo} user={user ? user : undefined} />
        </div>
        {!loaded && <Spinner />}
        {!footer && <footer>
            <div style={{ float: "left", height: "2em" }}>
                &copy; 2020 SmileBASIC Source
            </div>
            <button onClick={SwitchTheme} data-theme={typeof document !== "undefined" && document.documentElement.dataset.theme} style={{ float: "right", height: "2em", verticalAlign: "top", padding: "0" }}><span className="iconify" data-icon={"mdi:electric-switch" + ((typeof document !== "undefined" && document.documentElement.dataset.theme) === "dark" ? "-closed" : "")} data-inline="false"></span></button>
        </footer>}
    </>;
}) as NextPage<AppProps>;

export default App;
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
import { API_ENTITY } from "../utils/Constants";
import { useRequestPage } from "../utils/Request";
import { Logout, useSettings, useUser, Variable } from "../utils/User";
import dl from "damerau-levenshtein";

const App = (({
    Component,
    pageProps
}) => {
    const userInfo = useRef<HTMLDivElement>(null);

    const user = useUser();
    const [, settings, mutateSettings] = useSettings();

    const [, tree] = Category.useCategoryTree();

    const [title, setTitle] = useState("");
    const [sidebar, setSidebar] = useState(false);
    const [selected, setSelected] = useState([0]);
    const [loaded, setLoaded] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const router = useRouter();

    const { data: pages, loading: loadingPages, end, loadMore: loadMorePages } = useRequestPage({
        url: API_ENTITY("Content"),
        method: "GET",
        data: {
            reverse: true,
            type: "@page%"
        },
        offset: 0,
        limit: 10,
        return: Page
    }, (pages) => {
        if (pages == null) {
            return [<p>Loading...</p>];
        } else {
            return pages
                .map(page => <li key={page.id}>
                    <Link href="/pages/[pid]" as={`/pages/${page.id}`}><a>{page.name}</a></Link>
                </li>);
        }
    }, []);

    async function SwitchTheme() {
        console.log("Changing theme");
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
        if (settings && settings["SiteJS"]) {
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

    const setInfo = (title: string, selected: number[]) => {
        setTitle(title);
        setSelected(selected);
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

    async function handleSearch(evt: React.FormEvent<HTMLInputElement>) {
        const query = evt.currentTarget.value;

        if(query.length == 0)
            return setResults([]);;

        let usersThatMatch = await BaseUser.Search({
            name: `%${query}%`,
            limit: 10
        });
        let pagesThatMatch = (await Page.Search({
            name: `%${query}%`,
            limit: 10
        })).concat((await Page.Search({
            keyword: `%${query}%`,
            limit: 10
        }))).reduce<Page[]>((acc, val) => {
            if(acc.findIndex(r => r.id == val.id) == -1)
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
                ) *5
            })
            .slice(0, 10);
        
        setResults(aggregate);
    }

    const SearchTypeHref: {[i: string]: string} = {
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
        </Head>
        <nav>
            <span id="nav-brand">
                <Link href="/"><a><img src="/res/img/logo.svg" /></a></Link>
            </span>

            <span className="search-container">
                <input type="text" placeholder="Search..." onChange={handleSearch} />
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
                {user == null && (
                    <>
                        <Link href="/login"><a>Login</a></Link>
                    </>
                )}
            </div>
        </nav>
        <div id="sidebar" data-open={sidebar}>
            <ul>
                <li>
                    <Link href="/"><a>Home</a></Link>
                </li>
                <li onClick={toggle} data-open="false">
                    <Link href="/pages/categories/[cid]" as={`/pages/categories/${tree?.find(page => page.name === "Pages")?.id}`}><a>Pages</a></Link>
                    <ul>
                        <li key={-1}><Link href="/pages/edit"><a>Create a new page!</a></Link></li>
                        {loadingPages && <p key={-3}>Loading pages...</p>}
                        {pages}
                        {!end && <button type="button" key={-2} onClick={loadMorePages}>Load more</button>}
                    </ul>
                </li>
                {/* <li onClick={toggle} data-open="false">
                    Discussions
                    <ul>
                        {tree && tree.filter(c => [PAGE_CATEGORY, USER_PAGE_CATEGORY].indexOf(c.id) == -1).map(function render(cat) {
                            if (cat.children && cat.children.filter(c => [PAGE_CATEGORY, USER_PAGE_CATEGORY].indexOf(c.id) == -1).length == 0) {
                                return <li key={cat.id}><Link href="/categories/[cid]" as={`/categories/${cat.id}`}><a>{cat.name}</a></Link></li>;
                            } else {
                                return <li key={cat.id} data-open="false" onClick={toggle}>
                                    <Link href="/categories/[cid]" as={`/categories/${cat.id}`}><a>{cat.name}</a></Link>
                                    <ul>
                                        {cat.children.filter(c => [PAGE_CATEGORY, USER_PAGE_CATEGORY].indexOf(c.id) == -1).map(render)}
                                    </ul>
                                </li>;
                            }
                        })}
                    </ul>
                </li> */}
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
        {!loaded && <div id="loading">
            <div className="spinner circles">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>}
        <footer>
            <div style={{ float: "left", height: "2em" }}>
                (c) 2020 SmileBASIC Source community
            </div>
            <button onClick={SwitchTheme} data-theme={typeof document !== "undefined" && document.documentElement.dataset.theme} style={{ float: "right", height: "2em", verticalAlign: "top", padding: "0" }}><span className="iconify" data-icon={"mdi:electric-switch" + ((typeof document !== "undefined" && document.documentElement.dataset.theme) === "dark" ? "-closed" : "")} data-inline="false"></span></button>
        </footer>
    </>;
}) as NextPage<AppProps>;

export default App;
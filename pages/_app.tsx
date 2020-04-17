import { NextPage } from "next";
import { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import "normalize.css";
import { useState, useEffect, useRef } from "react";

import "../styles/global.css";
import "../styles/dark.css";
import "../styles/light.css";

import { Logout, useUser, useSettings, Variable } from "../utils/User";

const App = (({
    Component,
    pageProps
}) => {
    const userInfo = useRef<HTMLDivElement>(null);

    const user = useUser();
    const [, settings, mutateSettings] = useSettings();

    const [title, setTitle] = useState("");
    const [sidebar, setSidebar] = useState(false);
    const [selected, setSelected] = useState([0]);
    const [loaded, setLoaded] = useState(false);


    const router = useRouter();

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
        if (user !== null && user !== false && settings != null)
            localStorage.setItem("sbs-theme", ((settings?.["theme"] as string) || "light"));
        else if (user === null && localStorage.getItem("sbs-theme") == null)
            localStorage.setItem("sbs-theme", "light");

        document.documentElement.dataset.theme = localStorage.getItem("sbs-theme") as string;
        if (settings) setLoaded(true);

        let siteJS = document.createElement("script");
        siteJS.async = true;
        if (settings && settings["SiteJS"]) {
            siteJS.innerHTML = settings["SiteJS"] as string;
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
    }

    function toggle(evt: any) {
        if (evt.target === evt.currentTarget)
            evt.target.dataset.open = ["true", "false"][(["true", "false"].indexOf(evt.target.dataset.open) + 1) % 2];
    }
    function toggleParent(evt: any) {
        if (evt.target === evt.currentTarget && "open" in evt.target.parentElement.dataset)
            evt.target.parentElement.dataset.open = ["true", "false"][(["true", "false"].indexOf(evt.target.parentElement.dataset.open) + 1) % 2];
    }

    return <>
        <Head>
            <meta charSet="utf8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="shortcut icon" href="/favicon.svg" />
            <title>{title ? `${title} | SmileBASIC Source` : "SmileBASIC Source"}</title>
            <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
            <script src="https://code.iconify.design/1/1.0.5/iconify.min.js"></script>
        </Head>
        <nav>
            <span id="nav-brand">
                <Link href="/"><a><img src="/res/img/logo.svg" /></a></Link>
            </span>
            <input type="text" placeholder="Search..." />
            <img src="/res/img/hamburger.png" id="show-sidebar" onClick={updateSideBar} data-open={sidebar} />
            <div id="user-info" ref={userInfo} data-open={false} onClick={toggle}>
                {user && (
                    <>
                        <span id="user-name" onClick={toggleParent}>{user.username}</span>
                        <img src="/res/img/sample-useravatar.png" className="user-avatar" onClick={toggleParent} />
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
                    <Link href="/pages"><a>Pages</a></Link>
                    <ul>
                        <li><Link href="/pages/category/[cid]" as="/pages/category/1"><a>Programs</a></Link></li>
                        <li>Libraries</li>
                        <li>Documentation</li>
                        <li>Random</li>
                    </ul>
                </li>
                <li onClick={toggle} data-open="false">
                    Discussions
                        <ul>
                        <li>Off-Topic</li>
                        <li>Programming Questions</li>
                        <li>Site Development</li>
                        <li>Staff</li>
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
            (c) 2020 SmileBASIC Source community
            <button onClick={SwitchTheme} data-theme={settings?.theme}>Switch</button>
        </footer>
    </>;
}) as NextPage<AppProps>;

export default App;
import { NextPage } from "next";
import { useEffect } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import {useRouter} from "next/router";

export default (({
    setInfo,
    user
}) => {
    const router = useRouter();
    useEffect(() => setInfo("Admin Panel", [4]), []);
    useEffect(() => {
        user == null && router.push("/")
    });

return <>
        <Grid 
            rows={["fit-content(1fr)", "fit-content(1fr)"]}
            cols={["25%", "12.5%", "12.5%", "25%    "]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%",
                height: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1} width={1} height={2}>
                <h2>Categories:</h2>
                <ul>
                    <li>
                        Discussions
                    </li>
                    <li>
                        Pages
                        <ul>
                            <li>
                                Programs
                            </li>
                        </ul>
                    </li>
                    <li>
                        Private Discussions
                    </li>
                </ul>
                <h3 style={{color: "rgba(255, 54, 54)"}}>SUDO: OFF</h3>
            </Cell>
        </Grid>
        <style jsx>{`
            ul {
                list-style: none;
                padding-left: 1em;
            }
            :global(.cell) > ul {
                margin-left: -1em;
            }
            ul > li > ul {
                margin-bottom: .5em;
            }
        `}</style>
    </>;
}) as NextPage<PageProps>;
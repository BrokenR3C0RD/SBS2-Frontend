import { NextPage } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { PageProps } from "../interfaces";
import { Grid, Cell } from "../components/Layout";

export default (({
    setInfo
}) => {
    useEffect(() => setInfo("404 Not Found", [1]), []);
    return <>
        <Grid
            rows={["100%"]}
            cols={["100%"]}
            gapX="0em"
            gapY="0em"
            style={{
                width: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1} style={{
                textAlign: "center"
            }}>
                <h2>404 Not Found</h2>
                <p>
                    Well, you've gotten yourself stuck, haven't you. How unfortunate...
                    <br/>
                    You should get out quick, before a hungry grue comes by.
                    <br/>
                    Just <Link href="/"><a>RUN</a></Link> and you'll be out of here in no time.
                </p>
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
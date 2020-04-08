import { NextPage } from "next";
import { useEffect } from "react";
import { PageProps } from "../interfaces";
import { Grid, Cell } from "../components/Layout";

export default (({
    setInfo,
    user
}) => {
    useEffect(() => setInfo("Home", [1]), []);
    return <>
        <Grid 
            rows={["fit-content(1fr)", "fit-content(1fr)"]}
            cols={["50%", "50%"]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%",
                height: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1}>
                <h2>What You Missed</h2>
                <p>
                    You'll see updates for your watched threads here
                    {user ? `, ${user.username}` : ""}!
                </p>
            </Cell>
            <Cell x={1} y={2}>
                <h2>Open Questions</h2>
                <p>
                    Answer some questions and help out the community!
                </p>
            </Cell>
            <Cell x={2} y={2}>
                <h2>Recent Polls</h2>
                <p>
                    Who knows if I'll actually set this up.
                </p>
            </Cell>
            <Cell x={2} y={1}>
                <h2>Recent Activity</h2>
                <p>
                    See what's going on in the community!
                </p>
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
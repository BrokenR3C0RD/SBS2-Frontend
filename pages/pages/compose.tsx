import { NextPage } from "next";
import { useEffect } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import Composer from "../../components/Composer";

export default (({
    setInfo
}) => {
    useEffect(() => setInfo("Page", [1]), []);
    return <>
        <Grid
            rows={["100%"]}
            cols={["100%"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%"
            }}
        >
            <Cell x={1} y={1} >
                <h1>Input composer testing</h1>
                <Composer />
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
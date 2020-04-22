import { NextPage } from "next";
import { useEffect } from "react";
import { PageProps } from "../interfaces";
import { Grid, Cell, Gallery } from "../components/Layout";
import { Page } from "../classes";
import { API_ENTITY } from "../utils/Constants";
import { useRouter } from "next/router";

export default (({
    setInfo,
    //user
}) => {
    const Router = useRouter();
    useEffect(() => setInfo("Home", [1]), []);
    const [, programs] = Page.usePage({
        type: "@page.program%",
        reverse: true,
        limit: 10
    })
    return <>
        <Grid
            rows={["1fr", "1fr", "1fr", "1fr"]}
            cols={["1fr", "1fr", "1fr", "1fr"]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%",
                height: "100%",
                right: 0
            }}
        >
            <Cell x={2} y={1} width={2}>
                <h2>Program Gallery</h2>
                <p>
                    Here are some programs you should check out!
                </p>
                <Gallery width="400px" height="240px" className="program-showcase">
                    {programs ? programs.map((program, i) => <div key={program.id} data-chosen={i == 0} className="program" onClick={() => Router.push("/pages/[pid]", `/pages/${program.id}`)}>
                        <img src={program.values.photos?.length > 0 ? `${API_ENTITY("File")}/raw/${+program.values.photos.split(",")[0]}?size=400` : "/res/img/logo.svg"} />
                        <span className="title">{program.name}</span>
                    </div>) : []}
                </Gallery>
            </Cell>
            <Cell x={1} y={2} width={4} height={2} style={{
                maxHeight: "100vh"
            }}>
                <h2>Recent Activity</h2>
                <ul>

                </ul>
            </Cell>

        </Grid>
    </>;
}) as NextPage<PageProps>;
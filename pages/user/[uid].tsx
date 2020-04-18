import { NextPage } from "next";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { BaseUser } from "../../classes";
import Moment from "moment";

export default (({
    setInfo,
    /*user*/
}) => {
    const { query: { uid } } = useRouter();

    const [, user] = BaseUser.useUser([parseInt((uid ?? "").toString())]);

    useEffect(() => {
        setInfo(user && user[0] ? user[0].username : "", []);
    }, [user])
    return <>
        <Grid
            rows={["min-content", "fit-content(30em)"]}
            cols={["max-content", "1fr"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%"
            }}
        >
            {user && user[0] && <>
                <Cell x={1} y={1} width={2}>
                    <h1>{user[0].username}</h1>
                </Cell>
                <Cell x={1} y={2} width={1} >
                    <p>Joined {Moment(user[0].createDate).fromNow()}</p>
                </Cell>
                <Cell x={2} y={2}>
                    <h2>About me:</h2>
                    
                </Cell>
            </>}

        </Grid>
    </>;
}) as NextPage<PageProps>;
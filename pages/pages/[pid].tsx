import { NextPage } from "next";
import { useEffect } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell, Gallery } from "../../components/Layout";

export default (({
    setInfo,
    //user
}) => {
    useEffect(() => setInfo("Page", [1]), []);
    return <>
        <Grid
            rows={["fit-content(5em)", "min-content", "1fr"]}
            cols={["max-content", "1fr", "1fr"]}
            gapX="2em"
            gapY="2em"
            style={{
                width: "100%"
            }}
        >
            <Cell x={1} y={1} width={3}>
                <h1>Page title</h1>
            </Cell>
            <Cell x={1} y={2} className="program-infobox">
                <Gallery className="program-images" width="400px" height="240px" timer={0}>
                    <img src="http://smilebasicsource.com/user_uploads/page/1582336805.png" data-chosen />
                    <img src="http://smilebasicsource.com/user_uploads/page/1578363982.jpg" />
                    <img src="http://kland.smilebasicsource.com/i/xtnno.png" />
                </Gallery>
                <table cellSpacing={5}>
                    <tr>
                        <td>Submitted</td>
                        <td>5 years ago</td>
                    </tr>
                    <tr>
                        <td>Last updated</td>
                        <td>3 days ago</td>
                    </tr>
                    <tr>
                        <td>Author</td>
                        <td>MasterR3C0RD</td>
                    </tr>
                    <tr id="pubkey">
                        <td>Public key</td>
                        <td>QK4N3PZF</td>
                    </tr>
                    <tr>
                        <td>Compatible devices</td>
                        <td>3DS, Wii U, Switch</td>
                    </tr>
                </table>
            </Cell>
            <Cell x={2} y={2} width={2} className="program-description">
                <h2>Description</h2>
                <p>
                    {`
                    i got this new anime plot. basically there's this high school girl except she's got huge boobs.
                    i mean some serious honkers.
                    a real set of badonkers.
                    packin some dobonhonkeros.
                    massive dohoonkabhankoloos.
                    big ol' tonhongerekoogers.
                    
                    what happens next?!
                    transfer student shows up with even bigger bonkhonagahoogs.
                    humongous hungolomghononoloughongous.`}
                </p>
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
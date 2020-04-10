import { ValidationError } from "class-validator";
import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import Form from "../components/Form";
import { Grid, Cell } from "../components/Layout";
import { Dictionary, PageProps } from "../interfaces";
import { Confirm, SendEmail } from "../utils/UserAuth";

export default (({
    setInfo
}) => {
    const router = useRouter();
    useEffect(() => setInfo("Confirm your account", [0]), []);
    const [cerrors, setCerrors] = useState<string[]>([]);
    const [serrors, setSerrors] = useState<string[]>([]);
    let confirmed = false;


    async function confirm(data: Dictionary<string | number | boolean>) {
        const { confirmationKey } = data;
        setCerrors([]);
        try {
            await Confirm(confirmationKey as string);
            await router.push("/login", "/login?confirm=1");
        } catch (e) {
            let errors: string[] = [];
            if (e instanceof Error) {
                errors.push(e.message);
            } else {
                errors = e.map((err: any) => err instanceof ValidationError ? Object.values(err.constraints).join(", ") : err);
            }
            setCerrors(errors);
        }
    }

    async function sendCode(data: Dictionary<string | number | boolean>) {
        const { email } = data;
        setSerrors([]);
        try {
            await SendEmail(email as string);
            confirmed = true;
        } catch (e) {
            let errors: string[] = [];
            if (e instanceof Error) {
                errors.push(e.message);
            } else {
                errors = e.map((err: any) => err instanceof ValidationError ? Object.values(err.constraints).join(", ") : err);
            }
            setSerrors(errors);
        }
    }

    return <>
        <Grid
            cols={["1fr", "1fr"]}
            rows={["100%"]}
            gapX="2em"
            style={{height: "100%"}}
        >
            <Cell x={1} y={1}>
                <Form onSubmit={confirm}>
                    <h2>Confirm your account!</h2>
                    <p>
                        Check the email you used when you were creating your account.
                        There should be a code for you to copy and paste.
                        Make sure to check your junk/spam!
            </p>
                    <input type="text" name="confirmationKey" placeholder="Put your key here!" />

                    <input type="submit" value="Finish registration!" />
                    <p className="errors">
                        {cerrors.join(", ")}
                    </p>
                </Form>
            </Cell>
            <Cell x={2} y={1}>
                <Form onSubmit={sendCode}>
                    <p>If you need to have the email send to you again, type in your email.</p>
                    <input type="email" name="email" placeholder="Email" />
                    <input type="submit" value="Send Email" />
                    <p className="errors">
                        {serrors.join(", ")}
                    </p>
                    {confirmed &&
                        <p style={{ color: "green" }}>
                            Code sent!
                </p>}
                </Form>
            </Cell>
        </Grid>

    </>;
}) as NextPage<PageProps>;
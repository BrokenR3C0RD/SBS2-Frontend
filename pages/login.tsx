import { ValidationError } from "class-validator";
import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import Form from "../components/Form";
import { Dictionary, PageProps } from "../interfaces";
import { Login, Register } from "../utils/User";
import { Grid, Cell } from "../components/Layout";

export default (({
    setInfo
}) => {
    const router = useRouter();
    const confirm = router?.query?.confirm;
    useEffect(() => setInfo("Login", [0]), []);
    const [lerrors, setLerrors] = useState<string[]>([]);
    const [rerrors, setRerrors] = useState<string[]>([]);

    async function login(data: Dictionary<string | number | boolean>) {
        const { username, password, rememberme } = data;
        setLerrors([]);
        try {
            await Login(username as string, password as string, (rememberme == "on") as boolean);
            console.log("logged in. redirecting to home page.")
            await router.push("/");
        } catch (e) {
            console.log(e.stack);
            let errors: string[] = [];
            if (e instanceof Error) {
                errors.push(e.message);
            } else {
                errors = e.map((err: any) => err instanceof ValidationError ? Object.values(err.constraints).join(", ") : err);
            }
            setLerrors(errors);
        }
    }

    async function register(data: Dictionary<string | number | boolean>) {
        setRerrors([]);
        if (data["password"] !== data["confirm-password"]) {
            setRerrors([
                "Passwords do not match!"
            ]);
            return;
        }

        const { username, email, password } = data;

        try {
            await Register(username as string, email as string, password as string);
            console.log("Registration success. Redirecting to home page.");
            await router.push("/confirm");
        } catch (e) {
            console.log(e.stack);
            let errors: string[] = [];
            if (e instanceof Error) {
                errors.push(e.message);
            } else {
                errors = e.map((err: any) => err instanceof ValidationError ? Object.values(err.constraints).join(", ") : err);
            }
            setRerrors(errors);
        }
    }

    return <>
        <Grid
            cols={["1fr", "1fr"]}
            rows={["fit-content(50%)", "fit-content(50%)"]}
            gapX="2em"
            gapY="0"
            style={{
                width: "100%",
                height: "100%"
            }}
        >
            <Cell x={1} y={1}>
                <Form onSubmit={login} style={{
                    width: "100%"
                }}>
                    <h2>Login</h2>
                    {confirm && <p style={{ color: "green" }}>
                        Your account has successfully been confirmed! You can now log in!
            </p>}
                    <input type="text" name="username" placeholder="Username" />
                    <input type="password" name="password" placeholder="Password" />
                    <label><input type="checkbox" name="rememberme" /> Remember me</label>
                    <input type="submit" value="Log in!" />
                    <p className="errors">
                        {lerrors.join(", ")}
                    </p>
                </Form>
            </Cell>
            <Cell x={2} y={1}>
                <Form onSubmit={register} style={{
                    width: "100%"
                }}>
                    <h2>Register</h2>
                    <input type="text" name="username" placeholder="Username" />
                    <input type="email" name="email" placeholder="Email" />
                    <input type="password" name="password" placeholder="Password" />
                    <input type="password" name="confirm-password" placeholder="Confirm Password" />
                    <input type="submit" value="Register" />
                    <p className="errors">
                        {rerrors.join(", ")}
                    </p>
                </Form>
            </Cell>
        </Grid>
    </>;
}) as NextPage<PageProps>;
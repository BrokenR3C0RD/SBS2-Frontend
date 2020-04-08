import { ValidationError } from "class-validator";
import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import { useEffect, useState } from "react";
import Form from "../components/Form";
import { Dictionary, PageProps } from "../interfaces";
import { Login, Register } from "../utils/UserAuth";

export default (({
    setInfo
}) => {
    const router = useRouter();
    const confirm = router?.query?.confirm;
    useEffect(() => setInfo("Login", [0]), []);
    const [lerrors, setLerrors] = useState<string[]>([]);
    const [rerrors, setRerrors] = useState<string[]>([]);

    async function login(data: Dictionary<string | number | boolean>) {
        const { username, password, rememberMe } = data;
        setLerrors([]);
        try {
            await Login(username as string, password as string, rememberMe as boolean);
            await router.push("/");
        } catch (e) {
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
        if(data["password"] !== data["confirm-password"]){
            setRerrors([
                "Passwords do not match!"
            ]);
            return;
        }

        const { username, email, password } = data;

        try {
            await Register(username as string, email as string, password as string);
            await router.push("/confirm");
        } catch (e) {
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
        <Form onSubmit={login} style={{
            width: "45%"
        }} className="left">
            <h2>Login</h2>
            {confirm && <p style={{color: "green"}}>
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
        <Form onSubmit={register} style={{
            width: "45%"
        }} className="right">
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
    </>;
}) as NextPage<PageProps>;
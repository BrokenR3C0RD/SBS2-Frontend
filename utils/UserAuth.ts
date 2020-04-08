import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { isEmail, isUUID } from "validator";
import { User, UserCredential } from "../classes";
import { APIRoot } from "./Constants";

const API_USER_ME = `${APIRoot}/api/User/me`;
const API_USER_LOGIN = `${APIRoot}/api/User/authenticate`;
const API_USER_REGISTER = `${APIRoot}/api/User/register`;
const API_USER_REGISTER_SENDEMAIL = `${APIRoot}/api/User/register/sendemail`;
const API_USER_REGISTER_CONFIRM = `${APIRoot}/api/User/register/confirm`;


async function fetchWithToken(key: string) {
    let token = window.localStorage.getItem("sbs-auth") || window.sessionStorage.getItem("sbs-auth");
    if (token == null)
        return false;
    
    const resp = await fetch(key, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
        }
    });
    if (resp.status === 200) {
        return plainToClass(User, await resp.json());
    } else {
        return false;
    }
}

export function useUser(): User | null | false {
    if (typeof window == "undefined") return false;


    const [user, setUser] = useState<User | null | false>(false);
    const { data } = useSWR(API_USER_ME, fetchWithToken, {
        refreshInterval: 30000
    });

    useEffect(() => {
        if (data == null) {
            setUser(false);
            return;
        }
        if (data === false) {
            setUser(null);
        } else {
            setUser(data);
        }
    }, [data])

    return user;
}

export async function Login(username: string, password: string, rememberMe: boolean = false): Promise<void> {
    const creds: UserCredential = plainToClass(UserCredential, {
        username: isEmail(username) ? undefined : username,
        email: isEmail(username) ? username : undefined,
        password: password
    });

    await validateOrReject(creds);

    let resp = await fetch(API_USER_LOGIN, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(creds)
    });
    if (resp.status === 200) {
        let token = await resp.json();
        (rememberMe ? localStorage : sessionStorage).setItem("sbs-auth", token);
        mutate(API_USER_ME, null, true);
    } else {
        let errors: string[] = (resp.headers.get("content-type") === "application/json" ? Object.values((await resp.json()).errors).reduce<string[]>((acc, err) => acc = acc.concat(err as string[]), [] as string[]) : [await resp.json()]);
        throw errors;
    }
}

export async function Register(username: string, email: string, password: string): Promise<void> {
    const creds: UserCredential = plainToClass(UserCredential, {
        username: username,
        email: email,
        password: password
    });

    await validateOrReject(creds);

    let resp = await fetch(API_USER_REGISTER, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(creds)
    });
    if (resp.status === 200) {
        await SendEmail(email);
        return;
    } else {
        let errors: string[] = (resp.headers.get("content-type") === "application/json" ? Object.values((await resp.json()).errors).reduce<string[]>((acc, err) => acc = acc.concat(err as string[]), [] as string[]) : [await resp.json()]);
        throw errors;
    }
}

export async function SendEmail(email: string) {
    if (!isEmail(email)) {
        throw ["Invalid email."]
    }
    let resp = await fetch(API_USER_REGISTER_SENDEMAIL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            email: email
        })
    });
    if (resp.status === 200) {
        return;
    } else {
        let errors: string[] = (resp.headers.get("content-type") === "application/json" ? Object.values((await resp.json()).errors).reduce<string[]>((acc, err) => acc = acc.concat(err as string[]), [] as string[]) : [await resp.json()]);
        throw errors;
    }
}

export async function Confirm(key: string) {
    if (!isUUID(key)) {
        throw ["Invalid confirmation key."];
    }

    let resp = await fetch(API_USER_REGISTER_CONFIRM, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            confirmationKey: key
        })
    });

    if (resp.status === 200) {
        return;
    } else {
        let errors: string[] = (resp.headers.get("content-type") === "application/json" ? Object.values((await resp.json()).errors).reduce<string[]>((acc, err) => acc = acc.concat(err as string[]), [] as string[]) : [await resp.json()]);
        throw errors;
    }
}

export async function Logout() {
    localStorage.removeItem("sbs-auth");
    sessionStorage.removeItem("sbs-auth");

    mutate(API_USER_ME, false, true);
}
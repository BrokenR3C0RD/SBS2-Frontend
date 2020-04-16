import { plainToClass } from "class-transformer";
import { validateOrReject } from "class-validator";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { isEmail, isUUID } from "validator";
import { FullUser, UserCredential } from "../classes";
import { API_USER_LOGIN, API_USER_ME, API_USER_REGISTER, API_USER_REGISTER_CONFIRM, API_USER_REGISTER_SENDEMAIL } from "./Constants";
import { DoRequest } from "./Request";

async function fetchWithToken(key: string) {
    let token = window.localStorage.getItem("sbs-auth") || window.sessionStorage.getItem("sbs-auth");
    if (token == null)
        return false;

    try {
        return await DoRequest({
            url: key,
            return: FullUser
        })
    } catch (e) {
        return false;
    }
}

export function useUser(): FullUser | null | false {
    if (typeof window == "undefined") return false;


    const [user, setUser] = useState<FullUser | null | false>(false);
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

    let resp = await DoRequest<string>({
        method: "POST",
        url: API_USER_LOGIN,
        data: creds
    });

    (rememberMe ? localStorage : sessionStorage).setItem("sbs-auth", resp);
    mutate(API_USER_ME, null, true);
}

export async function Register(username: string, email: string, password: string): Promise<void> {
    const creds: UserCredential = plainToClass(UserCredential, {
        username: username,
        email: email,
        password: password
    });

    await validateOrReject(creds);

    await DoRequest({
        url: API_USER_REGISTER,
        method: "POST",
        data: creds
    });

    await SendEmail(email);
}

export async function SendEmail(email: string) {
    if (!isEmail(email)) {
        throw ["Invalid email."]
    }
    await DoRequest({
        url: API_USER_REGISTER_SENDEMAIL,
        method: "POST",
        data: {
            email: email
        }
    });
}

export async function Confirm(key: string) {
    if (!isUUID(key)) {
        throw ["Invalid confirmation key."];
    }

    await DoRequest({
        url: API_USER_REGISTER_CONFIRM,
        method: "POST",
        data: {
            confirmationKey: key
        }
    });
}

export async function Logout() {
    localStorage.removeItem("sbs-auth");
    sessionStorage.removeItem("sbs-auth");

    mutate(API_USER_ME, false, true);
}
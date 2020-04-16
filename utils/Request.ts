import {Dictionary} from "../interfaces"
import {plainToClass} from "class-transformer";
import useSWR, {mutate as swrMutate} from "swr";

export interface RequestOptions<T = any> {
    method?: "GET" | "POST" | "DELETE",
    url: string | URL,
    data?: Dictionary<any>,
    headers?: Dictionary<string>,
    return?: new() => T
}

export async function DoRequest<T>(options: RequestOptions<T>): Promise<T> {
    let token = window.localStorage.getItem("sbs-auth") || window.sessionStorage.getItem("sbs-auth");
    let method = options.method || "GET";

    let url: URL = new URL(options.url.toString());
    if(method == "GET" && options.data){
        for(let key in options.data){
            let data = options.data[key];
            if(data instanceof Array){
                data.forEach(val => url.searchParams.append(key, val.toString()));
            } else {
                url.searchParams.append(key, options.data[key].toString());
            }
        }
    }

    const resp = await fetch(url.toString(), {
        method: method,
        headers: Object.assign({
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": method == "POST" ? "application/json" : undefined
        }, options.headers || {}),
        body: method == "POST" ? JSON.stringify(options.data || {}) : undefined
    });

    if (resp.status === 200) {
        if(options.return){
            return plainToClass(options.return, await resp.json());
        } else {
            return await resp.json();
        }
    }  else {
        let errors: string[] = (resp.headers.get("content-type") === "application/json" ? Object.values((await resp.json()).errors).reduce<string[]>((acc, err) => acc = acc.concat(err as string[]), [] as string[]) : [await resp.json()]);
        throw errors;
    }
}

export function useRequest<T>(options: RequestOptions<T>, mutate: (obj: T) => Promise<T> = (async (d) => d)): [any, T | undefined, () => void] {
    const {data, error} = useSWR(JSON.stringify(options), async (key) => {
        const data = await DoRequest(JSON.parse(key) as RequestOptions<T>);
        return mutate(data);
    });
    return [error, data, () => swrMutate(JSON.stringify(options))];
}
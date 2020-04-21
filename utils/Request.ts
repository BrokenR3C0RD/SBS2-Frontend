import {Dictionary} from "../interfaces"
import {plainToClass} from "class-transformer";
import useSWR, {mutate as swrMutate, useSWRPages} from "swr";
import { isNullOrUndefined } from "util";
import { API_ENTITY } from "./Constants";

export interface RequestOptions<T = any> {
    method?: "GET" | "POST" | "PUT" | "DELETE",
    url: string | URL,
    data?: Dictionary<any> | string,
    headers?: Dictionary<string>,
    return?: new() => T
}

export interface RequestOptionsPages<T = any> extends RequestOptions<T> {
    limit: number,
    offset: number
}

export async function DoRequest<T>(options: RequestOptions<T>): Promise<T | null> {
    let token = window.localStorage.getItem("sbs-auth") || window.sessionStorage.getItem("sbs-auth");
    let method = options.method || "GET";

    let url: URL = new URL(options.url.toString());
    if(method == "GET" && typeof options.data == "object"){
        for(let key in options.data){
            let data = options.data[key];
            if(data instanceof Array){
                data.forEach(val => url.searchParams.append(key, val.toString()));
            } else if(!isNullOrUndefined(data)) {
                url.searchParams.append(key, options.data[key].toString());
            }
        }
    }

    const resp = await fetch(url.toString(), {
        method: method,
        headers: Object.assign({
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
            "Content-Type": (method == "POST" || method == "PUT") ? "application/json" : undefined
        }, options.headers || {}),
        body: (method == "POST" || method == "PUT") ? JSON.stringify(options.data || {}) : undefined
    });

    if (resp.status === 200) {
        if(options.return){
            return plainToClass(options.return, await resp.json());
        } else {
            return await resp.json();
        }
    } else if(resp.status === 404){
        return null;
    }  else {
        let errors: string[] = []
        try {
            errors = (resp.headers.get("content-type") === "application/json" ? Object.values((await resp.json()).errors).reduce<string[]>((acc, err) => acc = acc.concat(err as string[]), [] as string[]) : [await resp.json()]);
        } catch(ee){
            throw new Error("An internal server error occurred.");
        }
        throw errors;
    }
}

export function useRequest<T>(options: RequestOptions<T>, mutate: (obj: T) => Promise<T> = (async (d) => d)): [any, T | null | undefined, () => void] {
    const {data, error} = useSWR(JSON.stringify(options), async (key) => {
        const data = await DoRequest(JSON.parse(key) as RequestOptions<T>);
        if(data == null)
            return null;
        
        return mutate(data);
    });
    return [error, data, () => swrMutate(JSON.stringify(options))];
}

export function useRequestPage<T>(options: RequestOptionsPages<T>, mutate: (obj: T[] | null) => React.ReactElement[], dependencies?: any[]){
    const {
        pages,
        isLoadingMore,
        isReachingEnd,
        loadMore
      } = useSWRPages(JSON.stringify(options), ({offset, withSWR}) => {
          const {data} = withSWR(useSWR(JSON.stringify(Object.assign({}, options, {
              data: Object.assign({}, options.data, {
                  skip: offset || options.offset,
                  limit: options.limit || 10
              })
          })), async (key) => {
            const data = await DoRequest(JSON.parse(key) as RequestOptions<T[]>);
            return data;
        }));

        return mutate(data);
      },
      (SWR, index) => {
        if (SWR.data && SWR.data.length < (options.limit || 10)) return null;
        return (index + 1) * (options.limit || 10);
      }, dependencies || []);

      return {
          data: pages as React.ReactElement[],
          loading: isLoadingMore,
          end: isReachingEnd,
          loadMore
      };
}

export async function UploadFile(file: File): Promise<number> {
    let token = window.localStorage.getItem("sbs-auth") || window.sessionStorage.getItem("sbs-auth");
    let formData = new FormData;
    formData.set("file", file);

    let res = await fetch(API_ENTITY("File"), {
        method: "POST",
        headers: {
            "Authorization": token ? `Bearer ${token}` : ""
        },
        body: formData
    });

    return (await res.json()).id;
}
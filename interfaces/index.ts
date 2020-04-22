import { FullUser } from "../classes";

export type PageProps<T = {}> = {
    setInfo: (title: string, selected: number[]) => void,
    user?: FullUser
} & T;

export type Dictionary<T> = {
    [i: string]: T
}

export interface SearchQuery {
    ids?: number[],
    name?: string,
    keyword?: string,
    type?: string,
    parentIds?: number[],
    limit?: number,
    skip?: number,
    reverse?: boolean,
    sort?: "id" | "random"
}
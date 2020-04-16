import { FullUser } from "../classes";

export type PageProps<T = {}> = {
    setInfo: (title: string, selected: number[]) => void,
    user?: FullUser
} & T;

export type Dictionary<T> = {
    [i: string]: T
}
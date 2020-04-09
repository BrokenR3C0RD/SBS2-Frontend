import { User } from "../classes";

export type PageProps<T = {}> = {
    setInfo: (title: string, selected: number[]) => void,
    user?: User
} & T;

export type Dictionary<T> = {
    [i: string]: T
}
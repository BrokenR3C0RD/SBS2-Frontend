import { Dictionary } from "../interfaces";
import { Content } from "./Content";
import { plainToClass } from "class-transformer";

export class Discussion extends Content {
    type: string = "@discussion";
    values: Dictionary<string> = {};

    public static async GetByIDs(ids: number[]): Promise<Discussion[]> {
        return (await Content
            .GetByIDs(ids))
            .map(entity => plainToClass(Discussion, entity));
    }

    public static useDiscussion(ids: number[], mutate: ((e: Content) => Promise<Discussion>) = async (e) => e): [any, Content[] | null, () => void] {
        return Discussion.useContent(ids, async (e) => mutate(plainToClass(Discussion, e))) as [any, Content[] | null, () => void];
    }
}
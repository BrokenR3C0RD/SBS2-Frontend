import { Dictionary } from "../interfaces";
import { Content } from "./Content";
import { plainToClass } from "class-transformer";

export interface DiscussionProperties extends Dictionary<string> {
    markupLang: string
}

export class Discussion extends Content {
    type: string = "@discussion";
    values: DiscussionProperties = {
        markupLang: "bbcode"
    };

    public static async GetByIDs(ids: number[]): Promise<Discussion[]> {
        return (await Content
            .GetByIDs(ids))
            .map(entity => plainToClass(Discussion, entity));
    }

    public static async useDiscussionsCategory()

    public static useDiscussion(ids: number[], mutate: ((e: Discussion) => Promise<Discussion>) = async (e) => e): [any, Content[] | null, () => void] {
        return Discussion.useContent(ids, async (e) => mutate(plainToClass(Discussion, e))) as [any, Content[] | null, () => void];
    }

    public static async Update(discussion: Partial<Discussion>): Promise<Discussion> {
        // @ts-ignore
        return (await Content.Update(discussion));
    }
    public static async Delete(discussion: Discussion): Promise<boolean> {
        return (await Content.Delete(discussion));
    }
}
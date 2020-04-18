import { Content } from "./Content";
import { Dictionary } from "../interfaces";
import { plainToClass } from "class-transformer";
// import { BaseUser } from "./User";

export interface PageProperties extends Dictionary<string> {
    markupLang: string
}

export interface ProgramPageProperties extends PageProperties {
    key: string | any,
    supported: string,
    originalAuthor: string,
    photos: string
}

export class Page extends Content {
    // @ts-ignore
    values: PageProperties = {};

    type: string = "@page";

    public static async GetByIDs(ids: number[]): Promise<Page[]> {
        return (await Content
            .GetByIDs(ids))
            .map(entity => plainToClass(Page, entity));
    }

    public static usePage(ids: number[], mutate: (p: Page) => Promise<Page> = async p => p): [any, Page[] | null, () => void] {
        return Content.useContent(ids, p => mutate(plainToClass(Page, p))) as [any, Page[] | null, () => void];
    }

    public static async Update(page: Partial<Page>): Promise<Page> {
        // @ts-ignore
        return (await Content.Update(page));
    }
    public static async Delete(page: Page): Promise<boolean> {
        return (await Content.Delete(page));
    }
}

/*export class UserPage extends Page {
    type: string = "@user.page"
    // @ts-ignore
    values: PageProperties = {};

    public static GetUserPage(user: BaseUser): Promise<UserPage> {

    }
}*/

export class ProgramPage extends Page {
    type: string = "@page.program"
    // @ts-ignore
    values: ProgramPageProperties = {};
}
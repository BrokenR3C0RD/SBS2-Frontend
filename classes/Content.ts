import { IsInt, IsString, IsOptional, IsObject, IsArray } from "class-validator";
import { AccessControlledEntity, Entity } from "./Entity";
import { Dictionary, SearchQuery } from "../interfaces";
import { plainToClass } from "class-transformer";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";

export class Content extends AccessControlledEntity {
    @IsString()
    type: string = "";

    @IsString()
    name: string = "";

    @IsOptional()
    @IsString()
    content: string = "";

    @IsInt()
    createUserId: number = 0;

    @IsInt()
    parentId: number = 0;

    @IsObject()
    permissions: Dictionary<string> = {};

    @IsObject()
    values: Dictionary<string> = {};

    @IsArray()
    @IsString({ each: true })
    keywords: string[] = [];


    public static async GetByIDs(ids: number[]): Promise<Content[]> {
        return (await Entity
            .GetByIDs(ids, "Content"))
            .map(entity => plainToClass(Content, entity));
    }

    public static useContent(query: SearchQuery, mutate: ((e: Content) => Promise<Content>) = async (e) => e): [any, Content[] | null, () => void] {
        return Entity.useEntity(query, "Content", async (e) => mutate(plainToClass(Content, e))) as [any, Content[] | null, () => void];
    }

    public static async Search(query: SearchQuery, signal?: string | AbortSignal): Promise<Content[]> {
        return (await Entity
            .Search({
                ...query
            }, "Content", signal as AbortSignal))
            .map(entity => plainToClass(Content, entity));
    }

    public static async Update(content: Partial<Content>): Promise<Content> {
        return (await DoRequest({
            url: `${API_ENTITY("Content")}${content.id ? `/${content.id}` : ""}`,
            method: content.id ? "PUT" : "POST",
            data: content,
            return: Content
        }))!;
    }
    public static async Delete(content: Content): Promise<boolean> {
        await DoRequest({
            url: `${API_ENTITY("Content")}/${content.id}`,
            method: "DELETE"
        });
        return true;
    }
}

export class ParentContent extends Content {
    public children: ParentContent[] = [];
}
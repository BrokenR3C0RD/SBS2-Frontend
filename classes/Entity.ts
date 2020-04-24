import { IsDate, IsInt, IsObject } from "class-validator";
import { Type } from "class-transformer";
import { Dictionary, SearchQuery } from "../interfaces";
import { DoRequest, useRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { FullUser } from "./User";

export enum CRUD {
    Create = "c",
    Read = "r",
    Update = "u",
    Delete = "d"
}

export class Entity {
    @IsInt()
    id: number = 0;

    @Type(() => Date)
    @IsDate()
    createDate: Date = new Date(0);

    @Type(() => Date)
    @IsDate()
    editDate: Date = new Date(0);

    public static async GetByIDs(ids: number[], type: string): Promise<Entity[]> {
        return (await DoRequest<Entity[]>({
            url: API_ENTITY(type),
            method: "GET",
            data: {
                ids: ids
            }
        }))!;
    }

    public static async Search(query: SearchQuery | Dictionary<string | number | boolean | (string | number | boolean)[]>, type: string | AbortSignal, signal?: AbortSignal): Promise<Entity[]> {
        return (await DoRequest<Entity[]>({
            url: API_ENTITY(type as string),
            method: "GET",
            data: {
                ...query
            },
            signal
        }))!;
    }

    public static useEntity(query: SearchQuery, type: string, mutate: (e: Entity) => Promise<Entity> = (async (e) => e)): [any, Entity[] | null, () => void] {
        const [errors, data, mut] = useRequest<Entity[]>({
            url: API_ENTITY(type),
            method: "GET",
            data: {
                ...query
            }
        }, async (entities) => {
            if(entities.length == 0){
                return [];
            } else {
                return await Promise.all(entities.map(e => mutate(e)));
            }
        });
        return [errors, data || null, mut];
    }
}

export abstract class AccessControlledEntity extends Entity {
    @IsObject()
    permissions: Dictionary<string> = {};

    @IsInt()
    createUserId: number = 0;

    @IsInt()
    editUserId: number = 0;

    public Permitted(user: FullUser, permission: CRUD = CRUD.Read): boolean { 
        return ((this.permissions[user.id.toString()] || this.permissions["0"] || "").indexOf(permission) !== -1) || this.createUserId == user.id || (user.super && permission !== CRUD.Read);
    }
}
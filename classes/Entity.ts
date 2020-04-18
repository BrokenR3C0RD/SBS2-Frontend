import { IsDate, IsInt, IsObject } from "class-validator";
import { Type } from "class-transformer";
import { Dictionary } from "../interfaces";
import { DoRequest, useRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { BaseUser } from "./User";

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

    public static useEntity(ids: number[], type: string, mutate: (e: Entity) => Promise<Entity> = (async (e) => e)): [any, Entity[] | null, () => void] {
        const [errors, data, mut] = useRequest<Entity[]>({
            url: API_ENTITY(type),
            method: "GET",
            data: {
                ids: ids
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
    userId: number = 0;

    public Permitted(user: BaseUser, permission: CRUD = CRUD.Read): boolean {
        return ((this.permissions[user.id.toString()] || this.permissions["0"] || "").indexOf(permission) !== -1) || this.userId == user.id;
    }
}
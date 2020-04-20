import {IsString, Length, MinLength, IsEmail, IsOptional, IsBoolean} from "class-validator";
import { plainToClass } from "class-transformer";
import { Entity } from "./Entity";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { SearchQuery } from "../interfaces";

export class BaseUser extends Entity {
    @IsString()
    @Length(3, 20)
    username: string = "";

    avatar: null = null;

    public static async GetByIDs(ids: number[]): Promise<BaseUser[]> {
        return (await Entity
            .GetByIDs(ids, "User"))
            .map(entity => plainToClass(BaseUser, entity));
    }

    public static async GetByUsername(username: string): Promise<BaseUser[]> {
        return (await DoRequest<BaseUser[]>({
            url: API_ENTITY("User"),
            method: "GET",
            data: {
                limit: 5,
                reverse: true,
                username: `%${username}%`
            }
        })) || [];
    }

    public static useUser(query: SearchQuery): [any, BaseUser[] | null, () => void] {
        return Entity.useEntity(query, "User", async (e) => plainToClass(BaseUser, e)) as [any, BaseUser[] | null, () => void];
    }
}

export class FullUser extends BaseUser {
    @IsBoolean()
    super: boolean = false;

    @IsString()
    @IsEmail()
    email: string = "";
}

export class UserCredential {
    @IsOptional()
    @IsString()
    @Length(3, 20, {
        message: "Username needs to be between 3 and 20 characters!"
    })
    username?: string = "";

    @IsOptional()
    @IsEmail()
    email?: string = "";

    @IsString({
        message: "Please provide a password."
    })
    @MinLength(8, {
        message: "Password must be at least 8 characters."
    })
    password: string = "";
}
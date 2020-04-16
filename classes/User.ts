import {IsString, Length, MinLength, IsEmail, IsOptional, IsBoolean} from "class-validator";
import { plainToClass } from "class-transformer";
import { Entity } from "./Entity";

export class BaseUser extends Entity {
    @IsString()
    @Length(3, 20)
    username: string = "";

    public static async GetByIDs(ids: number[]): Promise<BaseUser[]> {
        return (await Entity
            .GetByIDs(ids, "User"))
            .map(entity => plainToClass(BaseUser, entity));
    }

    public static useUser(ids: number[]): [any, BaseUser[] | null, () => void] {
        return Entity.useEntity(ids, "User", async (e) => plainToClass(BaseUser, e)) as [any, BaseUser[] | null, () => void];
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
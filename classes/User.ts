import {IsInt, IsDate, IsString, Length, MinLength, IsEmail, IsOptional} from "class-validator";
import { Type } from "class-transformer";

export class User {
    @IsInt()
    uid: number = 0;

    @Type(() => Date)
    @IsDate()
    createdDate: Date = new Date();

    @IsOptional()
    @IsString()
    @Length(3, 20)
    username: string = "";

    @IsOptional()
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
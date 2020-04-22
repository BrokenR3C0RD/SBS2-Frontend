import { Type } from "class-transformer";
import { Dictionary, SearchQuery } from "../interfaces";
import { DoRequest, useRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { BaseUser } from "./User";
import { CRUD } from "./Entity";


export class Activity {
    userId: number = 0;

    contentId: number = 0;

    contentType: string = "tp";

    
}
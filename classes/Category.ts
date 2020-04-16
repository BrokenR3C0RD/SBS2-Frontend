import {IsInt,  IsString,  IsOptional, IsObject} from "class-validator";
import { Entity } from "./Entity";
import { Dictionary } from "../interfaces";
import { plainToClass } from "class-transformer";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";

export class Category extends Entity {
    @IsString()
    name: string = "";

    @IsOptional()
    @IsString()
    description: string = "";

    @IsInt()
    userId: number = 0;

    @IsInt()
    parentId: number = 0;

    @IsObject()
    permissions: Dictionary<string> = {};

    public static async GetByIDs(ids: number[]): Promise<Category[]> {
        return (await Entity
            .GetByIDs(ids, "Category"))
            .map(entity => plainToClass(Category, entity));
    }

    public static useCategory(ids: number[]): [any, Category[] | null, () => void] {
        return Entity.useEntity(ids, "Category", async (e) => plainToClass(Category, e)) as [any, Category[] | null, () => void];
    }

    public static async Update(category: Partial<Category>): Promise<Category> {
        return await DoRequest({
            url: API_ENTITY("Category"),
            method: "POST",
            data: category,
            return: Category
        });
    }
    public static async Delete(category: Category): Promise<boolean> {
        await DoRequest({
            url: `${API_ENTITY("Category")}/${category.id}`,
            method: "DELETE"
        });
        return true;
    }
}

export class ParentCategory extends Category {
    public children: ParentCategory[] = [];
}
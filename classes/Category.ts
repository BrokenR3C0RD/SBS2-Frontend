import { IsInt, IsString, IsOptional, IsObject } from "class-validator";
import { Entity, AccessControlledEntity } from "./Entity";
import { Dictionary, SearchQuery } from "../interfaces";
import { plainToClass } from "class-transformer";
import { DoRequest } from "../utils/Request";
import { API_ENTITY } from "../utils/Constants";
import { useEffect, useState } from "react";
import { Content } from "./Content";

function treeify<T>(list: T[], idAttr: string, parentAttr: string, childrenAttr: string): T[] {
    if (!idAttr) idAttr = 'id';
    if (!parentAttr) parentAttr = 'parent';
    if (!childrenAttr) childrenAttr = 'children';

    let treeList: T[] = [];
    let lookup: Dictionary<T> = {};
    list.forEach(function (obj) {
        lookup[(obj as any)[idAttr] as string] = obj;
        (obj as any)[childrenAttr] = [];
    });
    list.forEach(function (obj) {
        if ((obj as any)[parentAttr] != 0 && (lookup as any)[(obj as any)[parentAttr]] != null) {
            (lookup[(obj as any)[parentAttr]] as any)[childrenAttr].push(obj);
        } else {
            treeList.push(obj);
        }
    });
    return treeList;
};

export class Category extends AccessControlledEntity {
    @IsString()
    name: string = "";

    @IsOptional()
    @IsString()
    description: string = "";

    @IsInt()
    createUserId: number = 0;

    @IsInt()
    parentId: number = 0;

    @IsObject()
    values: Dictionary<string> = {};

    @IsObject()
    permissions: Dictionary<string> = {};

    public children: Category[] = [];

    public GetTreeLocation(cid: number): Category[] | null {
        let idx = this.children.find(cat => cat.id == cid);
        if (idx != null)
            return [idx];

        for (let i = 0; i < this.children.length; i++) {
            let res = this.children[i].GetTreeLocation(cid);
            if (res != null)
                return [this.children[i]].concat(res);
        }
        return null;
    }

    public Flatten(): Category[] {
        return this.children.reduce<Category[]>((acc, cat) => acc.concat(cat.Flatten()), []);
    }

    public PinnedContent(only: boolean = false): number[] | null {
        let pinned = (this.values["pinned"] || "")
            .split(",")
            .map(n => +n)
            .filter(n => !isNaN(n));

        if (only)
            if (pinned.length == 0)
                return [0];
            else
                return pinned;

        pinned = pinned.concat(this.children.reduce<number[]>((acc, child) => acc.concat(child.PinnedContent() || []), []));
        if (pinned.length == 0)
            return [0];
        else
            return pinned;
    }

    public static async GetByIDs(ids: number[]): Promise<Category[]> {
        return (await Entity
            .GetByIDs(ids, "Category"))
            .map(entity => plainToClass(Category, entity));
    }

    public static async Search(query: SearchQuery): Promise<Category[]> {
        return (await Entity
            .Search({
                ...query
            }, "User"))
            .map(entity => plainToClass(Category, entity));
    }

    public static useCategory(query: SearchQuery): [any, Category[] | null, () => void] {
        return Entity.useEntity(query, "Category", async (e) => plainToClass(Category, e)) as [any, Category[] | null, () => void];
    }

    public static useCategoryTree(): [any, Category[] | null, Content[], () => void] {
        const [err, categories, mutate] = Entity.useEntity({}, "Category", async (e) => plainToClass(Category, e))
        const [lastCats, setLastCats] = useState<Category[]>([]);
        let [categoryTree, setCategoryTree] = useState<Category[]>();
        let [pinned, setPinned] = useState<number[]>([0]);
        const [pinnedContent, setPinnedContent] = useState<Content[]>([]);
        const [, content] = Content.useContent({
            ids: pinned
        }) 

        useEffect(() => {
            if(categories && categories !== lastCats){
                setCategoryTree(categoryTree = treeify<Category>(categories as Category[], "id", "parentId", "children"));
                setLastCats(categories as Category[]);
                setPinned(pinned = categoryTree.reduce<number[]>((acc, cat) => acc.concat(cat.PinnedContent() || []), []).filter(pin => pin != 0));
            } else if(categories && content && content != pinnedContent){
                setPinnedContent(content);
            }
            
        }, [categories, content, pinned]);

        return [err, categoryTree || null, pinnedContent, mutate];
    }

    public static async Update(category: Partial<Category>): Promise<Category> {
        return (await DoRequest({
            url: `${API_ENTITY("Category")}${typeof category.id == "number" ? `/${category.id}` : ""}`,
            method: typeof category.id == "number" ? "PUT" : "POST",
            data: category,
            return: Category
        }))!;
    }
    public static async Delete(category: Category): Promise<boolean> {
        await DoRequest({
            url: `${API_ENTITY("Category")}/${category.id}`,
            method: "DELETE"
        });
        return true;
    }
}
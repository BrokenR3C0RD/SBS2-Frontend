import { NextPage } from "next";
import { useEffect, useState, useRef } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import Form from "../../components/Form";
import { useRouter } from "next/router";
import { Category } from "../../classes";
import { Dictionary } from "../../interfaces";
import React from "react";
import { CRUD } from "../../classes/Entity";

export default (({
    setInfo,
    user
}) => {
    const router = useRouter();
    const [errors, setErrors] = useState<string[]>([]);
    const [, categories, mutate] = Category.useCategory({}); // This will load all categories
    const [, categoryTree] = Category.useCategoryTree();
    const [selected, setSelected] = useState<number>();
    const [newPerms, setNewPerms] = useState<Dictionary<Dictionary<string>>>({});

    const newPermRef = useRef<HTMLInputElement>(null);

    useEffect(() => setInfo("Admin Panel", [4]), []);
    useEffect(() => {
        (user == null || (user != null && !user.super)) && router.push("/")
    }, [user]);

    let selectedCategory: Category | undefined;
    if (categories && selected != null)
        if (selected == -1)
            selectedCategory = new Category();
        else
            selectedCategory = categories.find(category => category.id == selected);

    useEffect(() => {
        if (selected != null && selectedCategory != null) {
            setNewPerms(Object.assign({}, newPerms, {
                [selected]: selectedCategory?.permissions
            }));
        }
    }, [selected, categories])

    async function UpdateCategory(data: Dictionary<string | number | boolean>) {
        setErrors([]);
        let newCategory: Partial<Category> = {
            name: data.name as string,
            description: data.description as string,
            parentId: parseInt(data.parentId as string || "0"),
            permissions: newPerms[selected as number],
            id: selected === -1 ? undefined : selected,
            values: selectedCategory ? selectedCategory.values : {}
        };

        try {
            newCategory = await Category.Update(newCategory);
        } catch (e) {
            setErrors([e instanceof Error ? e.stack : e]);
        }
        if (selected == -1)
            setNewPerms(Object.assign({}, newPerms, {
                "-1": {}
            }));
        mutate()
    }
    async function DeleteCategory() {
        if (selected == null || selected == -1 || !confirm("Are you sure you want to delete this category?"))
            return;
        try {
            await Category.Delete(selectedCategory!);
            setSelected(undefined);
        } catch (e) {
            setErrors([e instanceof Error ? e.stack : e]);
        }
        mutate();
    }

    function addPermission(evt: React.MouseEvent) {
        console.log(newPerms, newPermRef.current!.value, selected);
        evt.preventDefault();
        setNewPerms({
            ...newPerms,
            [selected!]: {
                ...newPerms[selected!] || {},
                [newPermRef.current!.value]: "r"
            }
        });
        newPermRef.current!.value = "";
    }

    function setPerm(user: number, permission: CRUD) {
        let perms = newPerms[selected!][user].split("");
        let idx = perms.indexOf(permission);
        if (idx != -1)
            perms.splice(idx, 1);
        else
            perms.push(permission);

        let nperms = (perms.indexOf(CRUD.Create) != -1 ? "c" : "")
            + (perms.indexOf(CRUD.Read) != -1 ? "r" : "")
            + (perms.indexOf(CRUD.Update) != -1 ? "u" : "")
            + (perms.indexOf(CRUD.Delete) != -1 ? "d" : "");

        setNewPerms({
            ...newPerms,
            [selected!]: {
                ...newPerms[selected!],
                [user]: nperms
            }
        });
    }

    return <>
        <Grid
            rows={["fit-content(1fr)", "fit-content(1fr)"]}
            cols={["1fr", "1fr"]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%",
                height: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1} height={2}>
                <h2>Categories:</h2>
                <ul>
                    {categoryTree && (categoryTree.map(
                        function build(category) {
                            return (<li key={category.id} data-selected={category.id == selected} onClick={(evt) => evt.currentTarget == evt.target && setSelected(category.id)}>
                                {category.id} : {category.name}
                                {category.children.length > 0 && <ul>
                                    {category.children.map(build)}
                                </ul>}
                            </li>);
                        }))}
                    <li data-selected={selected == -1} onClick={() => setSelected(-1)}>
                        <i>New Category...</i>
                    </li>
                </ul>
            </Cell>
            {selected != null && selectedCategory != null &&
                <Cell x={2} y={1} height={2}>
                    <Form onSubmit={UpdateCategory} key={selected}>
                        <label>
                            Name:
                            <input name="name" defaultValue={selectedCategory!.name} placeholder="Category name" />
                        </label>
                        <label>
                            Description:
                            <textarea name="description" defaultValue={selectedCategory!.description} placeholder="Category description" />
                        </label>
                        <label>
                            Parent:{` `}
                            <select name="parentId" defaultValue={selectedCategory!.parentId}>
                                <option value="0">None</option>
                                {categories!.map(category => category.id != selected && <option key={category.id} value={category.id}>{category.name}</option>)}
                            </select>
                        </label>
                        Permissions:
                        <ul id="permissions">
                            {newPerms[selected!] && Object.keys(newPerms[selected!]).map((user) =>
                                <li key={user}>
                                    {`${user == "0" ? "Everyone" : `UID #${user}`}: `}
                                    <label>
                                        C
                                        <input type="checkbox" name={`${user}-c`} checked={newPerms[selected!][user].indexOf("c") != -1} onChange={() => setPerm(+user, CRUD.Create)} />
                                    </label>
                                    <label>
                                        R
                                        <input type="checkbox" name={`${user}-r`} checked={(newPerms[selected!][user].indexOf("r") != -1)} onChange={() => setPerm(+user, CRUD.Read)} />
                                    </label>
                                    <label>
                                        U
                                        <input type="checkbox" name={`${user}-u`} checked={(newPerms[selected!][user].indexOf("u") != -1)} onChange={() => setPerm(+user, CRUD.Update)} />
                                    </label>
                                    <label>
                                        D
                                        <input type="checkbox" name={`${user}-d`} checked={(newPerms[selected!][user].indexOf("d") != -1)} onChange={() => setPerm(+user, CRUD.Delete)} />
                                    </label>
                                </li>
                            )}
                        </ul>
                        <input ref={newPermRef} type="number" placeholder="New permission UID..." />
                        <button onClick={addPermission} type="button">Add new permission</button>
                        <input type="submit" value={selected != -1 ? "Update Category" : "Add Category"} />
                        {selected !== -1 && <button onClick={DeleteCategory} id="delete" type="button">Delete Category</button>}
                        <div className="errors">
                            {errors.join(", ")}
                        </div>
                    </Form>
                </Cell>
            }
        </Grid>
        <style jsx>{`
            ul {
                list-style: none;
                padding: 0 1em;
            }
            ul li:before {
                content: "+ ";
                font-weight: bold;
            }
            :global(.cell) > ul {
                margin-left: -1em;
                font-size: 1.25em;
            }
            ul > li > ul {
                margin-bottom: .5em;
            }
            input:not([type="checkbox"]), textarea {
                margin-left: 2em;
                max-width: calc(100% - 2em);
                margin-top: .25em;
            }
            textarea {
                min-height: 10em;
            }
            button:not(#delete) {
                width: unset;
                float: right;
            }
            button#delete {
                margin-left: 2em;
                width: calc(100% - 2em);
                color: orange;
                font-weight: bold;
            }
            li[data-selected="true"]{
                color: var(--primary-accent);
            }
            li:not([data-selected="true"]){
                color: var(--primary-text);
            }
            ul#permissions > li > label  {
                display: inline;
                padding-left: 1em;
                font-weight: bold;
            }
            ul#permissions > li > label > input[type="checkbox"] {
                margin-left: 1em;
            }
        `}</style>
    </>;
}) as NextPage<PageProps>;
import { NextPage } from "next";
import { useEffect, useState, useRef } from "react";
import { PageProps } from "../../interfaces";
import { Grid, Cell } from "../../components/Layout";
import Form from "../../components/Form";
import { useRouter } from "next/router";
import { Category } from "../../classes";
import { Dictionary } from "../../interfaces";
import React from "react";

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
    if (categories && selected != null) {
        if (selected == -1) {
            selectedCategory = new Category();
        } else {
            selectedCategory = categories.find(category => category.id == selected);
        }
    }

    async function UpdateCategory(data: Dictionary<string | number | boolean>) {
        setErrors([]);
        let newCategory: Partial<Category> = {
            name: data.name as string,
            description: data.description as string,
            parentId: parseInt(data.parentId as string || "0"),
            permissions: {},
            id: selected === -1 ? undefined : selected
        };

        Object.keys(data).forEach(key => {
            if (key.indexOf("-") != -1) {
                const [user, value] = key.split("-");
                newCategory.permissions![user] = (newCategory.permissions![user] || "") + (data[key] == "on" ? value : "");
            }
        });

        try {
            newCategory = await Category.Update(newCategory);
        } catch (e) {
            setErrors([e instanceof Error ? e.stack : e]);
        }
        if(selected == -1)
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
        evt.preventDefault();
        setNewPerms(Object.assign({}, newPerms, {
            [selectedCategory!.id]: Object.assign({}, newPerms[selectedCategory!.id], {
                [newPermRef.current!.value]: "r"
            })
        }));
        newPermRef.current!.value = "";
    }

    return <>
        <Grid
            rows={["fit-content(1fr)", "fit-content(1fr)"]}
            cols={["25%", "12.5%", "12.5%", "25%"]}
            gapX="1em"
            gapY="1em"
            style={{
                width: "100%",
                height: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1} width={1} height={2}>
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
            {selected != null &&
                <Cell x={2} y={1} width={3} height={2}>
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
                            {Object.keys(selectedCategory!.permissions).map((user) =>
                                <li key={user}>
                                    {`${user == "0" ? "Everyone" : `UID #${user}`}: `}
                                    <label>
                                        C
                                        <input type="checkbox" name={`${user}-c`} defaultChecked={(selectedCategory!.permissions[user].indexOf("c") != -1)} />
                                    </label>
                                    <label>
                                        R
                                        <input type="checkbox" name={`${user}-r`} defaultChecked={(selectedCategory!.permissions[user].indexOf("r") != -1)} />
                                    </label>
                                    <label>
                                        U
                                        <input type="checkbox" name={`${user}-u`} defaultChecked={(selectedCategory!.permissions[user].indexOf("u") != -1)} />
                                    </label>
                                    <label>
                                        D
                                        <input type="checkbox" name={`${user}-d`} defaultChecked={(selectedCategory!.permissions[user].indexOf("d") != -1)} />
                                    </label>
                                </li>
                            )}
                            {newPerms[selectedCategory!.id] && Object.keys(newPerms[selectedCategory!.id]).map((user) =>
                                <li key={user}>
                                    {`${user == "0" ? "Everyone" : `UID #${user}`}: `}
                                    <label>
                                        C
                                        <input type="checkbox" name={`${user}-c`} defaultChecked={(newPerms[selectedCategory!.id][user].indexOf("c") != -1)} />
                                    </label>
                                    <label>
                                        R
                                        <input type="checkbox" name={`${user}-r`} defaultChecked={(newPerms[selectedCategory!.id][user].indexOf("r") != -1)} />
                                    </label>
                                    <label>
                                        U
                                        <input type="checkbox" name={`${user}-u`} defaultChecked={(newPerms[selectedCategory!.id][user].indexOf("u") != -1)} />
                                    </label>
                                    <label>
                                        D
                                        <input type="checkbox" name={`${user}-d`} defaultChecked={(newPerms[selectedCategory!.id][user].indexOf("d") != -1)} />
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
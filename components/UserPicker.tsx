import React, { useState, useRef, useEffect } from "react";
import { BaseUser } from "../classes";
import dl from "damerau-levenshtein";

export default (({
    max = Infinity,
    values = [],
    onChange = () => { }
}) => {
    const [possibilities, setPossibilities] = useState<BaseUser[]>([]);
    const [users, setUsers] = useState<BaseUser[]>([]);
    const [selected, setSelected] = useState<number>(0);

    const inputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        let newusers = users.slice();
        if (values.length < newusers.length) {
            newusers = newusers.filter(user => values.indexOf(user.id) !== -1);
        }

        if (values.length !== newusers.length) {
            let newuids = values.filter(uid => newusers.findIndex(user => user.id == uid) == -1);

            (async () => {
                newusers = newusers.concat(await BaseUser.GetByIDs(newuids));
                setUsers(newusers);
            })();
        }
    }, [values])

    async function findUser(evt: React.FormEvent<HTMLInputElement>) {
        let filledIn = evt.currentTarget.value;
        if (filledIn.length >= 1) {
            let nusers = (await BaseUser
                .GetByUsername(filledIn))
                .sort((user1, user2) => dl(user1.username, filledIn).similarity - dl(user2.username, filledIn).similarity)
                .filter(user => users.find(nuser => user.id == nuser.id) == null);

            setPossibilities(nusers);
        } else {
            setPossibilities([]);
        }
        setSelected(0);
    }

    async function addUser(user: BaseUser) {
        let newUsers = users.slice();
        newUsers.push(user);
        setUsers(newUsers);
        setPossibilities([]);

        inputRef.current!.value = "";
        inputRef.current!.focus();

        onChange(newUsers.map(user => user.id));
    }

    async function removeUser(user: BaseUser) {
        let newUsers = users.slice();
        newUsers.splice(newUsers.indexOf(user), 1);
        setUsers(newUsers);

        onChange(newUsers.map(user => user.id));
    }

    function handleSelectionControl(evt: React.KeyboardEvent) {
        if (evt.key == "ArrowUp") {
            setSelected((selected + possibilities.length - 1) % possibilities.length);
        } else if (evt.key == "ArrowDown") {
            setSelected((selected + 1) % possibilities.length);
        } else if(evt.key === "Enter"){
            evt.preventDefault();
            if(possibilities.length > 0)
                addUser(possibilities[selected]);
        }
    }

    return <div className="user-pick">
        <ul className="picked">
            {users.map(user => <li key={user.id} onClick={() => removeUser(user)}>{user.username}</li>)}
        </ul>

        <input type="text" onChange={findUser} ref={inputRef} placeholder="Fill in a user's name" disabled={users.length >= max} onKeyDown={handleSelectionControl} />
        <ul className="possibilities">
            {possibilities.map((user, i) => <li key={user.id} onClick={() => addUser(user)} data-selected={i == selected}>{user.username}</li>)}
        </ul>
    </div>
}) as React.FunctionComponent<{
    max?: number,
    values?: number[],
    onChange?: (values: number[]) => void
}>;
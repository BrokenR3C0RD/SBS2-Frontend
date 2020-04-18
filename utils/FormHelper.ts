import React from "react";

type Dictionary = { [i: string]: string | boolean | number };

type InputElements = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLSelectElement;

export function FormHelper(evt: React.FormEvent, callback: (data: Dictionary) => Promise<void>) {
    evt.preventDefault();
    if (evt.target !== evt.currentTarget)
        return;

    const target: HTMLFormElement = evt.target as HTMLFormElement;
    const data: Dictionary = {};

    for (let i = 0; i < target.elements.length; i++) {
        let ele = target.elements[i] as InputElements;
        data[ele.name] = ele.value;
    }

    let submitButtons = target.querySelectorAll("input[type=\"submit\"]") as NodeListOf<HTMLInputElement>;
    submitButtons.forEach((button) => { button.disabled = true });
    callback(data)
        .then(() => submitButtons.forEach((button) => { button.disabled = false; }))
        .catch(() => submitButtons.forEach((button) => { button.disabled = false; }));
}
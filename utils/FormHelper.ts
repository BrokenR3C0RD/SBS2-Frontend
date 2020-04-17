import React from "react";

type Dictionary = {[i: string]: string | boolean | number};

type InputElements = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLSelectElement;

export function FormHelper(evt: React.FormEvent, callback: (data: Dictionary) => void){
    evt.preventDefault();
    if(evt.target !== evt.currentTarget)
        return;

    const target: HTMLFormElement = evt.target as HTMLFormElement;
    const data: Dictionary = {};

    for(let i = 0; i < target.elements.length; i++){
        let ele = target.elements[i] as InputElements;
        data[ele.name] = ele.value;
    }

    return callback(data);
}
import {DoRequest} from "./Request";

export interface KeyInfo {
    filename: string,
    type: "TXT" | "DAT1" | "DAT2" | "PRJ" | "META" | "DAT" 
    icon: "TXT" | "DAT" | "PRJ" | "PRG" | "GRP",
    path: string,
    author: {
        uid: number,
        name: string
    },
    uploaded: Date,
    version: number,
    size: number,
    downloads: number,
    available: boolean,
    extInfo:  {
        version: number,
        type?: "col" | "int" | "real",
        dims?: number,
        files?: {name: string, size: number}[],
        console: "Switch" |  "3DS",
        project_name?: string,
        project_description?: string,
        tags: string[]
    },
    encodings: string[]
}

export async function GetSBAPIInfo(key: string, filename?: string): Promise<KeyInfo | null>{
    let info = await DoRequest<KeyInfo>({
        url: `https://sbapi.me/get/${key}${filename ? `/${filename}` : ""}/info`,
        data: {
            json: "1",
            en: "1"
        },
        method: "GET",
        headers: {
            Authorization: ""
        }
    });
    return info;
}
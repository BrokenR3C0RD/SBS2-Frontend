let APIRoot = process.env["API_ROOT"];
if (typeof window !== 'undefined')
    APIRoot = location.protocol + process.env["API_ROOT"];

export { APIRoot }

export const API_ENTITY = (type: string) => `${APIRoot}/api/${type}`;

export const API_USER_ME = `${APIRoot}/api/User/me`;
export const API_USER_LOGIN = `${APIRoot}/api/User/authenticate`;
export const API_USER_REGISTER = `${APIRoot}/api/User/register`;
export const API_USER_REGISTER_SENDEMAIL = `${APIRoot}/api/User/register/sendemail`;
export const API_USER_REGISTER_CONFIRM = `${APIRoot}/api/User/register/confirm`;
export const API_USER_VARIABLE = `${APIRoot}/api/Variable`;
export const API_USER_SENSITIVE = `${APIRoot}/api/User/sensitive`;

export const PAGE_CATEGORY = 3;
export const USER_PAGE_CATEGORY = 3;
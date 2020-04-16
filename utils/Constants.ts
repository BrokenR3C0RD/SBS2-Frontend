export const APIRoot = "http://new.smilebasicsource.com";

export const API_ENTITY = (type: string) => `${APIRoot}/api/${type}`;

export const API_USER_ME = `${APIRoot}/api/User/me`;
export const API_USER_LOGIN = `${APIRoot}/api/User/authenticate`;
export const API_USER_REGISTER = `${APIRoot}/api/User/register`;
export const API_USER_REGISTER_SENDEMAIL = `${APIRoot}/api/User/register/sendemail`;
export const API_USER_REGISTER_CONFIRM = `${APIRoot}/api/User/register/confirm`;

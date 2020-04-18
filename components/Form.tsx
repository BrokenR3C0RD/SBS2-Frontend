import { Dictionary } from "../interfaces";
import { FormHelper } from "../utils/FormHelper";
import React from "react";

export default (({
    children,
    onSubmit,
    style = {},
    className = ""
}) => {
    return (<form onSubmit={(evt) => FormHelper(evt, onSubmit)} style={style} className={className}>
        {children}
    </form>);
}) as React.FunctionComponent<{
    onSubmit: (data: Dictionary<string | boolean | number>) => Promise<void>,
    style?: React.CSSProperties,
    className?: string
}>
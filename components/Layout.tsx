import React from "react";

const Grid = (({
    children,
    rows,
    cols,
    gapX = "0",
    gapY = "0",
    style = {}
}) => {
    return <div className="grid" style={Object.assign({}, {
        gridTemplateColumns: cols.join(" "),
        gridTemplateRows: rows.join(" "),
        gridRowGap: gapY,
        gridColumnGap: gapX
    }, style)}>
        {children}
    </div>
}) as React.FunctionComponent<{
    rows: string[],
    cols: string[],
    gapX?: string,
    gapY?: string,
    style?: React.CSSProperties
}>;

const Cell = (({
    children,
    x,
    y,
    width = 1,
    height = 1,
    style = {}
}) => {
    return <div className="cell" style={Object.assign({}, {
        gridColumnStart: x,
        gridColumnEnd: x + width,
        gridRowStart: y,
        gridRowEnd: y + height
    }, style)}>
        {children}
    </div>
}) as React.FunctionComponent<{
    x: number,
    y: number,
    width?: number,
    height?: number,
    style?: React.CSSProperties
}>;

export { Grid, Cell }
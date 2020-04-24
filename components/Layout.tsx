import React, { useEffect, useRef, HTMLAttributes, Children, useState } from "react";

const Grid = (({
    children,
    rows,
    cols,
    gapX = "0",
    gapY = "0",
    style = {},
    className = ""
}) => {
    return <div className={`grid ${className}`} style={Object.assign({}, {
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
    style?: React.CSSProperties,
    className?: string
}>;

const Cell = (({
    children,
    x,
    y,
    width = 1,
    height = 1,
    style = {},
    className = "",
    ...props
}) => {
    return <div className={`cell ${className}`} style={Object.assign({}, {
        gridColumnStart: x,
        gridColumnEnd: x + width,
        gridRowStart: y,
        gridRowEnd: y + height
    }, style)} {...props}>
        {children}
    </div>
}) as React.FunctionComponent<{
    x: number,
    y: number,
    width?: number,
    height?: number,
    style?: React.CSSProperties,
    className?: string
} & HTMLAttributes<HTMLDivElement>>;

const Gallery = (({
    children,
    width,
    height,
    style = {},
    timer = 5000,
    className = ""
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [selected, setSelected] = useState<number>(0);
    const [wait, setWait] = useState<boolean>(false);
    const childCount = Children.count(children);

    function nextImage(user = false) {
        if (wait && !user) {
            setWait(false);
            return;
        }
        if (ref.current && childCount > 0) {
            setSelected((selected + 1) % childCount);
        }
        setWait(user);
    }
    function prevImage(user = false) {
        if (wait && !user) {
            setWait(false);
            return;
        }
        if (ref.current && childCount > 0) {
            setSelected((selected + (childCount - 1)) % childCount);
        }
        setWait(user);
    }

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                nextImage();
            }, timer);
            return () => clearInterval(interval);
        }
    });
    return <div className={`gallery ${className}`} style={Object.assign({}, {
        width: width,
        height: height,
        lineHeight: height
    }, style)}>
        <div className="gallery-content" ref={ref}>
            {children}
        </div>
        {childCount > 1 && <>
            <div className="gallery-next" onClick={() => nextImage(true)} />
            <div className="gallery-prev" onClick={() => prevImage(true)} />
        </>}
        <style jsx>{`
            .gallery > .gallery-content > :global(*) {
                position: relative;
                max-width: ${width};
                max-height: ${height};
            }
            .gallery > .gallery-content > :global(*:nth-child(${selected + 1})){
                display: block;
                text-align: center;
                box-sizing: border-box;
                min-width: 0;
                min-height: 0;
            }
        `}</style>
    </div>
}) as React.FunctionComponent<{
    width: string,
    height: string,
    style?: React.CSSProperties,
    timer?: number,
    className?: string,
} & HTMLAttributes<HTMLDivElement>>;

const Spinner = (() => {
    return <div className="spinner circles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
    </div>;
}) as React.FunctionComponent;

export { Grid, Cell, Gallery, Spinner }
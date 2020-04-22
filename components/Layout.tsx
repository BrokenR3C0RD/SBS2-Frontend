import React, { useEffect, useRef, HTMLAttributes } from "react";

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

    let wait: boolean = false;
    function nextImage(user = false) {
        if(wait && !user){
            wait = false;
            return;
        }
        if (ref.current && React.Children.count(children) > 0) {
            const current = ref.current.querySelector("[data-chosen]") as (HTMLElement | null);
            if (current) {
                delete current.dataset["chosen"];
            }
            (current?.nextElementSibling as (HTMLElement | null) || ref.current.children[0] as HTMLElement).dataset["chosen"] = "chosen";
        }
        wait = user;
    }
    function prevImage(user = false) {
        if(wait && !user){
            wait = false;
            return;
        }
        if (ref.current && React.Children.count(children) > 0) {
            const current = ref.current.querySelector("[data-chosen]") as (HTMLElement | null);
            if (current) {
                delete current.dataset["chosen"];
            }
            (current?.previousElementSibling as (HTMLElement | null) || ref.current.children[ref.current.children.length - 1] as HTMLElement).dataset["chosen"] = "chosen";
        }
        wait = user;
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
        <div className="gallery-next" onClick={() => nextImage(true)} />
        <div className="gallery-prev" onClick={() => prevImage(true)} />
        <style jsx>{`
            .gallery > .gallery-content > :global(*) {
                position: relative;
                max-width: ${width};
                max-height: ${height};
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

export { Grid, Cell, Gallery }
import highlightSB from "./sbhighlight";


let defoptions = (() => {
    if(typeof document == "undefined")
        return;

    var create = document.createElement.bind(document);
    var createText = document.createTextNode.bind(document);
    var creator = function (tag) {
        return create.bind(document, tag);
    };

    return {
        append: function (parent, child) {
            parent.appendChild(child);
        },
        parent: function (child) { // unused currently
            return child.parent;
        },

        //========================
        // nodes without children:
        text: function (text) {
            return createText(text);
        },
        lineBreak: creator('br'),
        line: creator('hr'),
        // code block
        code: function (code, language) {
            var node = create('code');
            node.dataset.lang = language;
            node.innerHTML = highlightSB(code, language);
            return node;
        },
        // inline code
        icode: function (code) {
            var node = create('code');
            node.textContent = code;
            node.dataset.inline = "true";
            return node;
        },
        audio: function (url) {
            var node = create('audio');
            node.setAttribute('controls', "");
            node.setAttribute('src', url);
            return node;
        },
        video: function (url) {
            var node = create('video');
            node.setAttribute('controls', "");
            node.setAttribute('src', url);
            return node;
        },

        //=====================
        // nodes with children
        root: function () {
            var node = create('div');
            node.className = "markup-root";
            return node;
        },
        bold: creator('b'),
        italic: creator('i'),
        underline: creator('u'),
        strikethrough: creator('s'),
        heading: function (level) { // input: 1, 2, or 3
            return create('h' + level);//['h1','h2','h3'][level-1] || 'h3');
        },
        quote: function (user) {
            var node = create('blockquote');
            node.setAttribute('cite', user);
            return node;
        },
        list: creator('ul'),
        item: creator('li'), // (list item)
        link: function (url) {
            var node = create('a');
            node.setAttribute('href', url);
            return node;
        },
        table: creator('table'),
        row: creator('tr'),
        cell: function (header) {
            return header ?
                create('th') :
                create('td');
        },
        image: function (url) {
            var node = create('img');
            node.setAttribute('src', url);
            return node;
        },
    };
})();

export default function parse(code, options = defoptions) {
    if(typeof document == "undefined")
        return;

    var output = options.root();
    var curr = output;

    // this is a list of all nodes that we are currently inside
    // as well as {}-block pseudo-nodes
    var stack = [{ node: curr, type: 'root' }];
    stack.top = function () {
        return stack[stack.length - 1];
    };
    var textBuffer = "";
    var inside = {};
    var startOfLine = true;
    var lastWasBlock;
    // todo:
    // so, the way to prevent extra linebreaks (without just ignoring them all) is
    // to ignore linebreaks around blocks. (before and after, as well as inside, ignore 1 leading/trailing linebreak)
    // idea:

    var i = -1;
    var c;
    scan();

    while (c) {
        if (c == "\n") {
            scan();
            endLine();
            //==========
            // \ escape
        } else if (c == "\\") {
            scan();
            if (c == "\n")
                addBlock(options.lineBreak());
            else
                addText(c);
            scan();
            //===============
            // { group start (why did I call these "groups"?)
        } else if (c == "{") {
            scan();
            startBlock(null, {});
            skipLinebreak();
            startOfLine = true;
            //=============
            // } group end
        } else if (c == "}") {
            scan();
            if (stackContains(null)) {
                closeAll(false);
            } else {
                addText("}");
            }
            //========
            // * bold
        } else if (c == "*") {
            var wasStartOf = startOfLine;
            scan();
            if (wasStartOf && (c == " " || c == "*") && !stackContains('heading')) {
                console.log("HEADING");
                var headingLevel = 1;
                while (c == "*") {
                    headingLevel++;
                    scan();
                }
                if (c == " " && headingLevel <= 3) {
                    scan();
                    startBlock('heading', {}, headingLevel);
                } else { //invalid heading level
                    addText('*'.repeat(headingLevel));
                }
            } else {
                doMarkup('bold', options.bold, "*");
            }
        } else if (c == "/") {
            scan();
            doMarkup('italic', options.italic, "/");
        } else if (c == "_") {
            scan();
            doMarkup('underline', options.underline, "_");
        } else if (c == "~") {
            scan();
            doMarkup('strikethrough', options.strikethrough, "~");
            //============
            // >... quote
        } else if (c == ">" && startOfLine) {
            // todo: maybe >text should be a quote without author... 
            // need to add a way to add information to quotes:
            // - user ID
            // - post ID
            scan();
            start = i;
            while (c == " ")
                scan();
            while (c && !char_in(c, " \n{:"))
                scan();
            var name = code.substring(start, i).trim();
            if (c == ":")
                scan();
            while (c == " ")
                scan();
            startBlock('quote', {}, name);
            skipLinebreak();
            //==============
            // -... list/hr
        } else if (c == "-" && startOfLine) {
            scan();
            //----------
            // --... hr
            if (c == "-") {
                scan();
                var count = 2;
                while (c == "-") {
                    count++;
                    scan();
                }
                //-------------
                // ---<EOL> hr
                if (c == "\n" || !c) {
                    skipLinebreak();
                    addBlock(options.line);
                    //----------
                    // ---... normal text
                } else {
                    addText("-".repeat(count));
                }
                //------------
                // - ... list
            } else if (c == " ") {
                scan();
                startBlock('list', { level: 0 });
                startBlock('item', { level: 0 });
                // hmm...
                // it's strange to think that
                // people will be reading this
                // after I'm dead
                //...
                //---------------
                // - normal char
            } else {
                addText("-");
            }
            //==========================
            // ] end link if inside one
        } else if (c == "]" && top_is('link')) {
            scan();
            endBlock();
            //================
            // https?:// link
        } else if (c == "h") { //lol this is silly
            var start = i;
            scan();
            if (code.substr(start, 7) == "http://" || code.substr(start, 8) == "https://") {
                while (isUrlChar(c)) {
                    scan();
                }
                var url = code.substring(start, i);
                startBlock('link', {}, url);
                if (c == "[") {
                    scan();
                    skipLinebreak();
                } else {
                    addText(url);
                    endBlock();
                }
            } else {
                addText("h");
            }
            //============
            // |... table
        } else if (c == "|") {
            var top = stack.top();
            // continuation
            if (top.type == 'cell') {
                var row = top.row;
                var table = top.row.table;
                scan();
                skipLinebreak();
                //--------------
                // | | next row
                if (c == "|") {
                    scan();
                    if (table.columns == null)
                        table.columns = row.cells;
                    endBlock();
                    if (top_is('row')) //always
                        endBlock();
                    var row = startBlock('row', { table: table, cells: 0 });
                    if (c == "*") {
                        scan();
                        row.header = true;
                    } else {
                        row.header = false;
                    }
                    startBlock('cell', { row: row }, row.header);
                    skipLinebreak();
                    //--------------------------
                    // | next cell or table end
                } else {
                    row.cells++;
                    // end of table
                    // table ends when number of cells in current row = number of cells in first row
                    // single-row tables are not easily possible ..
                    console.log(table.columns, row.cells, code.substr(i, 10));
                    if (table.columns != null && row.cells > table.columns) {
                        console.log("ENDING TABLE");
                        endBlock(); //end cell
                        if (top_is('row')) //always
                            endBlock();
                        if (top_is('table')) //always
                            endBlock();
                        skipLinebreak();
                        console.log(curr);
                    } else { // next cell
                        console.log("NOT ENDING");
                        endBlock();
                        startBlock('cell', { row: row }, row.header);
                    }
                }
                // start of new table (must be at beginning of line)
            } else if (startOfLine) {
                scan();
                table = startBlock('table', {
                    columns: null,
                });
                row = startBlock('row', {
                    table: table,
                    cells: 0
                });
                if (c == "*") {
                    scan();
                    row.header = true;
                } else {
                    row.header = false;
                }
                startBlock('cell', {
                    row: row,
                }, row.header);
            } else {
                scan();
                addText("|");
            }
            //===========
            // `... code
        } else if (c == "`") {
            scan();
            //---------------
            // ` inline code
            if (c != "`") {
                start = i;
                while (c && c != "`")
                    scan();
                addBlock(options.icode(code.substring(start, i)));
                scan();
                //-------
                // ``...
            } else {
                scan();
                //----------------
                // ``` code block
                if (c == "`") {
                    scan();
                    // read lang name
                    start = i;
                    while (c && c != "\n" && c != "`")
                        scan();
                    var language = code.substring(start, i).trim().toLowerCase();
                    if (c == "\n")
                        scan();
                    start = i;
                    i = code.indexOf("```", i);
                    addBlock(options.code(
                        code.substring(start, i != -1 ? i : code.length),
                        language,
                    ));
                    if (i != -1) {
                        i += 2;
                        scan();
                    } else {
                        i = code.length;
                        scan();
                    }
                    skipLinebreak();
                    //------------
                    // `` invalid
                } else {
                    scan();
                    addText("``");
                }
            }
            //
            //=============
            // normal char
        } else {
            addText(c);
            scan();
        }
    }

    flushText();
    closeAll(true);
    return output;

    // ######################

    function skipLinebreak() {
        if (c == "\n")
            scan();
    }

    // ew regex
    function isUrlChar(c) {
        return c && (/[-\w$.+!*'(),;/?:@=&]/).test(c);
    }

    // closeAll(true) - called at end of document
    // closeAll(false) - called at end of {} block
    function closeAll(force) {
        while (stack.length) {
            var top = stack.top();
            if (top.type == 'root') {
                break;
            }
            if (!force && top.type == null) {
                endBlock();
                break;
            }
            // hm maybe have a way to define actions on block close...
            // nah
            // TODO: add other block-type elements here
            // maybe just have a list of which elements are blocks somewhere
            // actually this is kind of weird
            // basically it's to fix uh
            // {| dumb small table}<linebreak>
            // idk...
            // oh and also this should always only skip ONE line break
            // so probably have an 'eat' flag like before
            if (top.type == 'table') {
                skipLinebreak();
            }
            endBlock();
        }
    }

    function endLine() {
        var eat = false;
        while (1) {
            var top = stack.top();
            if (top.type == 'heading' || top.type == 'quote') {
                endBlock();
                eat = true;
            } else if (top.type == 'item') {
                eat = true;
                if (top.type == 'item')
                    endBlock();
                var indent = 0;
                while (c == " ") {
                    indent++;
                    scan();
                }
                // OPTION 1:
                // no next item; end list
                console.log("what is C?", c);
                if (c != "-") {
                    console.log("ending list", stack.top());
                    while (top_is('list')) {//should ALWAYS happen at least once
                        endBlock();
                        console.log(stack.top());
                    }
                    addText(" ".repeat(indent));
                } else {
                    scan();
                    while (c == " ")
                        scan();
                    // OPTION 2:
                    // next item has same indent level; add item to list
                    if (indent == top.level) {
                        startBlock('item', { level: indent });
                        // OPTION 3:
                        // next item has larger indent; start nested list	
                    } else if (indent > top.level) {
                        startBlock('list', { level: indent });
                        startBlock('item', { level: indent }); // then made the first item of the new list
                        // OPTION 4:
                        // next item has less indent; try to exist 1 or more layers of nested lists
                        // if this fails, fall back to just creating a new item in the current list
                    } else {
                        // TODO: currently this will just fail completely 
                        while (1) {
                            top = stack.top();
                            if (top && top.type == 'list') {
                                console.log("found item with level", top.level, indent);
                                if (top.level <= indent) {
                                    break;
                                } else {
                                    endBlock();
                                }
                            } else {
                                // no suitable list was found :(
                                // so just create a new one
                                startBlock('list', { level: indent });
                                break;
                            }
                        }
                        startBlock('item', { level: indent });
                    }
                    break; //really?
                    // yes really.
                    // yes, I know you're thinking "what if there's a list inside a quote on one line?"
                    // except both of those things are only allowed to start at the start of a line, so the only way
                    // that would be possible is if
                    // you did > 12Me21: {-list etc.
                    // except then, the {} stops the quote from ending
                    // so it's fiiiine

                }
            } else {
                if (!eat)
                    addBlock(options.lineBreak());
                break;
            }
        }
    }

    // common code for all text styling tags (bold etc.)
    function doMarkup(type, create, symbol) {
        if (canStartMarkup(type)) {
            startBlock(type, {});
        } else if (canEndMarkup(type)) {
            endBlock();
        } else {
            addText(symbol);
        }
    }
    // todo: maybe have support for non-ASCII punctuation/whitespace?
    function canStartMarkup(type) {
        return (
            (!code[i - 2] || char_in(code[i - 2], " \t\n({'\"")) && //prev char is one of these (or start of text)
            !char_in(c, " \t\n,'\"") && //next char is not one of these
            !stackContains(type)
        );
    }
    function canEndMarkup(type) {
        return (
            top_is(type) && //there is an item to close
            !char_in(code[i - 2], " \t\n,'\"") && //prev char is not one of these
            (!c || char_in(c, " \t\n-.,:!?')}\"")) //next char is one of these (or end of text)
        );
    }
    function char_in(chr, list) {
        return chr && list.indexOf(chr) != -1;
    }

    function scan() {
        if (c == "\n" || !c)
            startOfLine = true;
        else if (c != " ")
            startOfLine = false;
        i++;
        c = code.charAt(i);
    }

    // um like
    // don't use 'null' as a type name probably
    // In THis House
    // We use ==         ,
    function stackContains(type) {
        for (var i = 0; i < stack.length; i++) {
            if (stack[i].type == type) {
                return true;
            }
        }
        return false;
    }
    function top_is(type) {
        var top = stack.top();
        return top && top.type == type;
    }

    function startBlock(type, data, arg) {
        data.type = type;
        if (type) {
            data.node = options[type](arg);
            flushText();
            options.append(curr, data.node);
            curr = data.node;
        }
        stack.push(data);
        return data;
    }
    // add simple block with no children
    function addBlock(node) {
        flushText();
        options.append(curr, node);
    }
    function addText(text) {
        if (text)
            textBuffer += text;
    }
    function flushText() {
        if (textBuffer) {
            options.append(curr, options.text(textBuffer));
            textBuffer = ""
        }
    }
    function endBlock() {
        flushText();
        stack.pop();
        var i = stack.length - 1;
        // this skips {} fake nodes
        // it will always find at least the root <div> element I hope
        while (!stack[i].node) {
            i--;
        }
        curr = stack[i].node;
    }
}
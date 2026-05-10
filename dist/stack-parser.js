const CHROME_REGEX = /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/;
const CHROME_SHORT_REGEX = /at\s+(.+?):(\d+):(\d+)/;
const FIREFOX_REGEX = /(.+?)@(.+?):(\d+):(\d+)/;
const SAFARI_REGEX = /(.+?)@(.+?):(\d+):(\d+)/;
const SAFARI_SHORT_REGEX = /^(?:file:\/\/)?(.+?):(\d+):(\d+)$/;
export function parseStack(stack) {
    const lines = stack.split('\n').filter(line => line.trim());
    const callStack = [];
    let file = '';
    let lineNum = 0;
    let column = 0;
    for (let i = 1; i < lines.length; i++) {
        const lineText = lines[i];
        let match = null;
        let matchedType = null;
        match = lineText.match(CHROME_REGEX);
        if (match)
            matchedType = 'chrome';
        if (!match) {
            match = lineText.match(CHROME_SHORT_REGEX);
            if (match)
                matchedType = 'chrome_short';
        }
        if (!match) {
            match = lineText.match(FIREFOX_REGEX);
            if (match)
                matchedType = 'firefox';
        }
        if (!match) {
            match = lineText.match(SAFARI_REGEX);
            if (match)
                matchedType = 'safari';
        }
        if (!match) {
            match = lineText.match(SAFARI_SHORT_REGEX);
            if (match)
                matchedType = 'safari_short';
        }
        if (match && matchedType) {
            if (!file) {
                switch (matchedType) {
                    case 'chrome':
                    case 'firefox':
                    case 'safari':
                        file = match[2];
                        lineNum = parseInt(match[3], 10);
                        column = parseInt(match[4], 10);
                        break;
                    case 'chrome_short':
                    case 'safari_short':
                        file = match[1];
                        lineNum = parseInt(match[2], 10);
                        column = parseInt(match[3], 10);
                        break;
                }
            }
            callStack.push(match[1] || lineText);
        }
        else {
            callStack.push(lineText);
        }
    }
    return { file, line: lineNum, column, callStack };
}
//# sourceMappingURL=stack-parser.js.map
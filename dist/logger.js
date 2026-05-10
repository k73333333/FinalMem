export function logLeak(info) {
    const now = Date.now();
    const aliveTime = info.destroyTime ? now - info.destroyTime : now - info.createTime;
    console.warn(`%c[MEMGUARD] %c疑似内存泄漏检测`, 'color: #667eea; font-weight: bold;', 'color: #ff4757; font-weight: bold; font-size: 14px;');
    console.warn(`  %c类型%c: ${info.type} | %c名称%c: ${info.name} | %c存活%c: ${aliveTime}ms`);
    if (info.stack.file) {
        console.warn(`%c📍 定位信息`, 'color: #2ed573; font-weight: bold;');
        console.warn(`  ├── %c文件%c : ${truncate(info.stack.file, 60)}`);
        console.warn(`  └── %c行号%c : ${info.stack.line}`);
    }
    if (info.stack.methodName) {
        console.warn(`%c🔧 调用方法`, 'color: #ffa502; font-weight: bold;');
        console.warn(`  └── %c名称%c : ${info.stack.methodName}`);
    }
    if (info.stack.closureName) {
        console.warn(`%c🔒 闭包信息`, 'color: #9b59b6; font-weight: bold;');
        console.warn(`  └── %c名称%c : ${info.stack.closureName}`);
    }
    if (info.stack.callStack.length > 0) {
        console.warn(`%c📋 调用堆栈`, 'color: #3498db; font-weight: bold;');
        const stackLines = info.stack.callStack.slice(0, 5);
        stackLines.forEach((line, index) => {
            const cleanLine = line.replace(/\s+/g, ' ').trim();
            console.warn(`  ├── ${index + 1}. ${truncate(cleanLine, 55)}`);
        });
        if (info.stack.callStack.length > 5) {
            console.warn(`  └── ... 共 ${info.stack.callStack.length} 行`);
        }
    }
}
function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength - 3) + '...';
}
//# sourceMappingURL=logger.js.map
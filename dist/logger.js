export function logLeak(info) {
    const now = Date.now();
    const aliveTime = info.destroyTime ? now - info.destroyTime : now - info.createTime;
    console.warn(`%c[MEMGUARD 内存泄漏]`, 'color: #ff4757; font-weight: bold;', `类型: ${info.type} | 名称: ${info.name} | 存活: ${aliveTime}ms`);
    if (info.stack.file) {
        console.warn(`文件: ${info.stack.file} | 行: ${info.stack.line}`);
    }
    if (info.stack.callStack.length > 0) {
        console.warn('完整堆栈:');
        info.stack.callStack.forEach((line, index) => {
            console.warn(`  ${index + 1}. ${line}`);
        });
    }
}
//# sourceMappingURL=logger.js.map
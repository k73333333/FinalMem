import { track, destroy, init } from '../core';
export function useMemGuard() {
    return {
        track: (obj, options) => {
            return track(obj, options);
        },
        destroy
    };
}
export function createMemGuardDirective() {
    return {
        mounted(el, binding) {
            const id = track(el, binding.value);
            el.__memGuardId = id;
        },
        unmounted(el) {
            const id = el.__memGuardId;
            if (id) {
                destroy(id);
            }
        }
    };
}
export const MemGuardVuePlugin = {
    install(app, options) {
        init(options);
        if (options?.trackComponents !== false) {
            app.mixin({
                beforeCreate() {
                    const opts = this.$options;
                    const componentName = opts.name || opts._componentTag || 'Anonymous';
                    const id = track(this, {
                        type: 'component',
                        name: componentName
                    });
                    this.__memGuardId = id;
                },
                beforeUnmount() {
                    const id = this.__memGuardId;
                    if (id) {
                        destroy(id);
                    }
                }
            });
        }
        app.directive('mem-guard', createMemGuardDirective());
    }
};
//# sourceMappingURL=vue.js.map
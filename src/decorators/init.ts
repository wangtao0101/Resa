export default function <S = any>(options) {
    options = options || {};
    const {
        name,
        namespace,
        state,
    } = options;

    return (target) => {
        Object.defineProperty(target, '__name__', {
            value: name || target.name,
            enumerable: false,
            writable: false,
            configurable: false,
        })
        Object.defineProperty(target, '__namespace__', {
            value: namespace || '',
            enumerable: false,
            writable: false,
            configurable: false,
        })
        Object.defineProperty(target, '__state__', {
            value: state,
            enumerable: false,
            writable: false,
            configurable: false,
        })
        return target;
    };
}

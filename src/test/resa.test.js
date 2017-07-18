import Immutable from 'immutable';
import { delay } from 'redux-saga';
import { call } from 'redux-saga/effects';
import createResa from '../resa';


function myReducer(state = {}, _action) {
    return state;
}

const model = {
    namespace: 'model',
    reducer: 'model',
    effects: {
        * add(_models, action, { fulfilled, _reject }) {
            yield call(fulfilled, action.payload);
        },

        * minus(_models, action, { _fulfilled, reject }) {
            yield call(reject, action.payload);
        },
    },
};

const effectModel = {
    namespace: 'effectModel',
    reducer: 'effectModel',
    state: {
        count: 0,
    },
    effects: {
        add: [function* ({ effectModel }, _action, { fulfilled, _reject }) { // eslint-disable-line
            yield delay(10);
            yield call(fulfilled, { count: effectModel.getState().count + 1 });
        }, 'takeLatest'],
    },
};

const callSelfModel = {
    namespace: 'callSelfModel',
    reducer: 'callSelfModel',
    effects: {
        * add(_models, action, { _fulfilled, _reject }) {
            yield call(this.effects.minus, action.payload);
        },

        * minus(_models, action, { _fulfilled, reject }) {
            yield call(reject, action.payload);
        },
    },
};

describe('createResa', () => {
    test('createResa return success', () => {
        const app = createResa();
        expect(app).toEqual(expect.objectContaining({
            store: expect.anything(),
            runSaga: expect.anything(),
            models: expect.anything(),
            registerModel: expect.anything(),
        }));
    });

    test('createResa set initialState success', () => {
        const app = createResa({ initialState: { myReducer: 'a' }, reducers: { myReducer } });
        expect(app.store.getState()).toEqual({
            myReducer: 'a',
            resaReducer: {},
        });
    });
});

describe('registerModel', () => {
    test('register model success', () => {
        const app = createResa();
        app.registerModel(model);
        expect(app.models.model).toEqual(expect.objectContaining({
            namespace: 'model',
            reducer: 'model',
            effects: {
                add: expect.anything(),
                minus: expect.anything(),
            },
        }));
    });
});

describe('dispatch action success', () => {
    test('dispatch fulfilled success', () => {
        const app = createResa();
        app.registerModel(model);
        app.models.model.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('dispatch return promise success', () => {
        const app = createResa();
        app.registerModel(model);
        const result = app.models.model.effects.add({ a: 'a' });
        expect(Object.prototype.toString.call(result.then)).toEqual('[object Function]');
    });

    test('dispatch fulfilled success when immutable', () => {
        const app = createResa({ immutable: Immutable });
        app.registerModel(model);
        app.models.model.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                resaReducer: {},
                model: Immutable.Map({
                    loading: false,
                    a: 'a',
                }),
            }));
        });
    });

    test('dispatch reject success', () => {
        const app = createResa();
        app.registerModel(model);
        app.models.model.effects.minus({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('dispatch action in saga', () => {
        const app = createResa();
        app.registerModel(callSelfModel);
        app.models.callSelfModel.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                callSelfModel: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('model getState success', () => {
        const app = createResa();
        app.registerModel(callSelfModel);
        app.models.callSelfModel.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.callSelfModel.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                a: 'a',
                loading: false,
            });
        });
    });

    test('model getState success when use immutable', () => {
        const app = createResa({ immutable: Immutable });
        app.registerModel(callSelfModel);
        app.models.callSelfModel.effects.add({ a: 'a' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.callSelfModel.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual(Immutable.Map({
                loading: false,
                a: 'a',
            }));
        });
    });

    test('takeLatest', () => {
        const app = createResa();
        app.registerModel(effectModel);
        app.models.effectModel.effects.add({ a: 'a' });
        app.models.effectModel.effects.add({ a: 'c' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.models.effectModel.getState());
            }, 20);
        }).then((data) => {
            expect(data).toEqual({
                loading: false,
                count: 1,
            });
        });
    });
});

const model1 = {
    namespace: 'model1',
    reducer: 'model',
    effects: {
        * add(_models, action, { fulfilled, _reject }) {
            yield fulfilled(action.payload);
        },
    },
};

const model2 = {
    namespace: 'model2',
    reducer: 'model',
    effects: {
        * add(_models, action, { fulfilled, _reject }) {
            yield fulfilled(action.payload);
        },
    },
};

describe('tow model use same reducer', () => {
    test('reserve state after add new model in same reducer', () => {
        const app = createResa();
        app.registerModel(model1);
        app.models.model1.effects.add({ a: 'a' });
        app.registerModel(model2);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    loading: false,
                },
            });
        });
    });

    test('tow model use same reducer', () => {
        const app = createResa();
        app.registerModel(model1);
        app.registerModel(model2);
        app.models.model1.effects.add({ a: 'a' });
        app.models.model2.effects.add({ b: 'b' });
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(app.store.getState());
            }, 5);
        }).then((data) => {
            expect(data).toEqual({
                resaReducer: {},
                model: {
                    a: 'a',
                    b: 'b',
                    loading: false,
                },
            });
        });
    });
});

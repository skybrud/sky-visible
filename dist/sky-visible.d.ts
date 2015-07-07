declare module sky {
    interface ISkyVisibleProvider {
        defaults: {
            any: any;
        };
        getDefaults: () => any[];
        $get: ISkyVisible;
    }
    interface ISkyVisible {
        setReference: (element: Element, name: string) => Element;
        getReference: (name: string) => Element;
        bind: (element: any, view: any, preferences: any, method: any) => void;
        unbind: (element: any) => void;
        recalculate: (element?: Element) => void;
        checkViews: (element?: Element, checkCache?: boolean) => void;
    }
    interface ISkyVisibleItem {
        node: Element;
        methods: ISkyVisbileItemMethods;
        name?: string;
    }
    interface ISkyVisbileItemMethods {
        [index: number]: ISkyVisbileItemMethod;
    }
    interface ISkyVisbileItemMethod {
        (value: any, dimensions: ISkyVisibleItemDimensions): void;
    }
    interface ISkyVisibleItemDimensions {
        top: number;
        left: number;
        width: number;
        height: number;
    }
}
declare module sky {
    interface ISkyVisibleViewsProvider {
        views: ISkyVisibleViews;
        $get(): ISkyVisibleViews;
    }
    interface ISkyVisibleViews {
        any: (values: any, dimensions: any) => any;
    }
}
